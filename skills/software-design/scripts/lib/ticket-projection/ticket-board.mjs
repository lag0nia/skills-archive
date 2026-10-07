import { kindDisplayName } from "./core.mjs";
import { analyzeTicketDependencies } from "../model/ticket-dependencies.mjs";

// Conservative UTF-8 budget, not a claim about GitHub's undocumented counting rule.
// The complete explanation is rendered in the issue; never discard it to fit a card.
export const WAITING_ON_BYTE_BUDGET = 1000;
function compactWaitingOn(summaries, ids) {
  const full = summaries.join(" | ");
  if (!full) return null;
  if (Buffer.byteLength(full, "utf8") <= WAITING_ON_BYTE_BUDGET) return full;
  const suffix = ". Full explanation: open this issue's Waiting on section.";
  const render = (shown) => `${ids.length} blocking sources: ${ids.slice(0, shown).join(", ")}${shown < ids.length ? ` (+${ids.length - shown} more)` : ""}${suffix}`;
  let shown = 0;
  while (shown < ids.length && Buffer.byteLength(render(shown + 1), "utf8") <= WAITING_ON_BYTE_BUDGET) shown += 1;
  return render(shown);
}

// Adapt normalized projection records to the existing analyzer, never infer edges.
export function deriveTicketBoard(records) {
  const recordIndex = new Map(records.map((record) => [record.id, record]));
  const inventory = records.map((record) => ({
    id: record.id, title: record.title, status: record.status,
    resolution: record.resolution, depends_on: record.dependencies ?? [],
    blocked_by: record.blockedBy, resume_when: record.resumeWhen,
  }));
  return records.map((record) => {
    const boardValues = { "Work area": null, "Answering group": null, "Waiting on": null,
      "Board status": ["todo", "deferred", "decided", "finished"].includes(record.status) ? record.status : null };
    if (!["todo", "deferred"].includes(record.status)) return { ...record, boardValues, waitingOnDetails: [] };
    if (!record.domainLabel) throw new Error(`Cannot resolve projected Domain for ${record.id}.`);
    boardValues["Work area"] = record.kind === "technical" ? kindDisplayName(record.kind) : record.domainLabel;
    // Selection is one card; the inventory is complete, including hidden/settled
    // prerequisites. This gives the analyzer's deterministic path for every cause.
    const analysis = analyzeTicketDependencies(inventory, [record.id]);
    const question = analysis.questions[0];
    const nodes = new Map(analysis.nodes.map((node) => [node.id, node]));
    const grouped = new Map();
    for (const cause of question.causes) {
      if (!grouped.has(cause.source)) grouped.set(cause.source, { path: cause.path, reasons: new Set() });
      const group = grouped.get(cause.source);
      const node = nodes.get(cause.source);
      if (cause.kind === "outside-ticket") group.reasons.add("answer required");
      else if (cause.kind === "external-fact") group.reasons.add(`External: ${cause.detail}`);
      else if (["deferred", "out-of-scope"].includes(cause.detail)) {
        const reason = recordIndex.get(cause.source)?.deferReason || recordIndex.get(cause.source)?.scopeReason;
        group.reasons.add(`${cause.detail}${reason ? `: ${reason}` : ""}; Resume when: ${node.resumeWhen || "not recorded"}`);
      } else group.reasons.add(`Review: ${cause.detail}`);
    }
    const describe = (id, { path, reasons }, compact) => {
      const title = nodes.get(id)?.title;
      const shortTitle = title && title !== id ? ` — ${compact && [...title].length > 72 ? [...title].slice(0, 69).join("") + "…" : title}` : "";
      const via = !record.dependencies?.includes(id) && path.length > 2 ? ` via ${path.slice(1, -1).join(" → ")}` : "";
      return `${id}${shortTitle}${via}: ${[...reasons].join("; ")}`;
    };
    const summaries = [...grouped].map(([id, group]) => describe(id, group, true));
    const waitingOnDetails = [...grouped].map(([id, group]) => describe(id, group, false));
    boardValues["Answering group"] = question.causes.some((cause) => ["review", "external-fact"].includes(cause.kind))
      ? "Needs attention" : question.causes.length ? "Waiting for answers" : "Ready";
    boardValues["Waiting on"] = compactWaitingOn(summaries, [...grouped.keys()]);
    if (record.status === "todo" && question.causes.length) boardValues["Board status"] = "Waiting";
    return { ...record, boardValues, waitingOnDetails };
  });
}

export function decidedNotice(records) {
  const decidedTickets = records.filter((record) => record.status === "decided").map((record) => record.id);
  return decidedTickets.length ? { decidedTickets, completionNotice: "Approved decisions still await canonical completion; see All Tickets." } : {};
}
