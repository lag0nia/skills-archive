import { readText } from "./files.mjs";

function parseScalar(raw, filePath, fieldName) {
  const value = raw.trim();
  if (value === "null") return null;
  if (/^(?:true|false|-?\d+)$/.test(value)) return JSON.parse(value);
  if (value.startsWith("\"") || value.startsWith("[") || value.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(filePath + ": invalid JSON-compatible YAML value for " + fieldName + ": " + error.message);
    }
  }
  throw new Error(filePath + ": " + fieldName + " must use a quoted JSON-compatible scalar or inline array.");
}

function parseRecords(text, sectionName, filePath) {
  const headers = [...text.matchAll(/^(tickets|archived_records):\s*$/gm)];
  const headerIndex = headers.findIndex((header) => header[1] === sectionName);
  if (headerIndex === -1) return [];
  const start = headers[headerIndex].index + headers[headerIndex][0].length;
  const end = headerIndex + 1 < headers.length ? headers[headerIndex + 1].index : text.length;
  const section = text.slice(start, end);
  const blocks = [...section.matchAll(/^  - id:\s*(.+?)\s*$([\s\S]*?)(?=^  - id:|(?![\s\S]))/gm)];
  return blocks.map((match) => {
    const ticket = { id: parseScalar(match[1], filePath, "id") };
    for (const line of match[2].split("\n")) {
      const field = /^    ([a-z][a-z0-9_]*):\s*(.*?)\s*$/.exec(line);
      if (!field) {
        if (line.trim()) throw new Error(filePath + ": unsupported ticket YAML line: " + line.trim());
        continue;
      }
      if (Object.hasOwn(ticket, field[1])) throw new Error(filePath + ": duplicate field " + field[1] + " in " + ticket.id + ".");
      ticket[field[1]] = parseScalar(field[2], filePath, field[1]);
    }
    return ticket;
  });
}

export function parseTicketFile(filePath) {
  const text = readText(filePath);
  const version = /^ticket_file_version:\s*(\d+)\s*$/m.exec(text)?.[1];
  const scopeRaw = /^scope:\s*(.+?)\s*$/m.exec(text)?.[1];
  if (version !== "3" || !scopeRaw) {
    throw new Error(filePath + ": ticket_file_version must be 3 and scope must be present.");
  }
  const scope = parseScalar(scopeRaw, filePath, "scope");
  const tickets = parseRecords(text, "tickets", filePath);
  const archivedRecords = parseRecords(text, "archived_records", filePath);
  if (!tickets.length && !archivedRecords.length) throw new Error(filePath + ": tickets or archived_records must contain at least one record.");
  if (tickets.some((ticket) => ticket.record_state === "archived") || archivedRecords.some((ticket) => ticket.record_state !== "archived")) {
    throw new Error(filePath + ": archived records belong only in archived_records and require record_state archived.");
  }
  return { filePath, version: Number(version), scope, tickets, archivedRecords };
}
