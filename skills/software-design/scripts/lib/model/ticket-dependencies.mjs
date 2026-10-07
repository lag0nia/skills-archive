const ticketId = /^TICKET-\d{4}$/;
const sorted = (values) => [...new Set(values)].sort();
const approved = (ticket) => ["finished", "decided"].includes(ticket.status)
  && typeof ticket.resolution === "string" && ticket.resolution.trim().length > 0;

/** Pure, scoped analysis. Records are parser records, optionally carrying filePath. */
export function analyzeTicketDependencies(records, selection) {
  if (selection.some((id) => typeof id !== "string" || !ticketId.test(id))) throw new Error("Invalid selected ticket ID.");
  const selected = sorted(selection);
  const selectedSet = new Set(selected);
  const index = new Map();
  for (const record of records) {
    if (typeof record.id !== "string" || !ticketId.test(record.id)) throw new Error("Cannot build identity index: invalid ticket ID");
    if (!index.has(record.id)) index.set(record.id, []);
    index.get(record.id).push(record);
  }
  const findings = [];
  const nodes = new Map();
  const find = (id, code, detail) => {
    if (!findings.some((f) => f.id === id && f.code === code && f.detail === detail)) findings.push({ id, code, detail });
  };
  function visit(id) {
    if (nodes.has(id)) return;
    const matches = index.get(id) || [];
    const node = { id, title: id, dependencies: [], blockers: [], settled: false, issues: [] };
    nodes.set(id, node);
    function issue(code, detail) { node.issues.push(code); find(id, code, detail); }
    if (matches.length !== 1) {
      issue(matches.length ? "ambiguous-identity" : "missing-identity", "Expected exactly one canonical record.");
      return;
    }
    const record = matches[0];
    Object.assign(node, { title: record.title || record.name || id, status: record.status, filePath: record.filePath, resolution: record.resolution, resumeWhen: record.resume_when, settled: approved(record) });
    if (record.record_state === "archived") { issue("archived-identity", "Archived records cannot supply current answers."); node.settled = false; return; }
    if (!["todo", "decided", "finished", "deferred", "out-of-scope"].includes(record.status)) issue("invalid-status", "Unknown ticket disposition.");
    if (["decided", "finished"].includes(record.status) && !node.settled) issue("missing-resolution", "Approved status requires a non-empty resolution.");
    if (!Array.isArray(record.depends_on) || record.depends_on.some((dep) => typeof dep !== "string" || !ticketId.test(dep))) {
      issue("invalid-dependencies", "depends_on must be an inline array of canonical ticket IDs.");
    } else node.dependencies = sorted(record.depends_on);
    if (record.blocked_by !== undefined) {
      if (!Array.isArray(record.blocked_by)) issue("invalid-blockers", "blocked_by must be an array of non-empty external fact/action strings.");
      else for (const blocker of record.blocked_by) {
        if (typeof blocker !== "string" || !blocker.trim()) issue("invalid-blockers", "Each external blocker must be a non-empty string.");
        else if (ticketId.test(blocker.trim())) issue("misplaced-ticket-blocker", blocker.trim() + " belongs in depends_on after semantic review.");
        else node.blockers.push(blocker.trim());
      }
    }
    node.blockers = sorted(node.blockers);
    for (const dep of node.dependencies) {
      if (dep === id) issue("self-dependency", "A question cannot require itself.");
      visit(dep);
    }
  }
  selected.forEach(visit);

  // Find strongly connected components in the relevant closure, including historical
  // ancestry for review. Availability traversal below stops at approved answers.
  let next = 0;
  const numbers = new Map(), low = new Map(), stack = [], onStack = new Set();
  function connect(id) {
    numbers.set(id, next); low.set(id, next++); stack.push(id); onStack.add(id);
    for (const dep of nodes.get(id).dependencies) {
      if (!numbers.has(dep)) { connect(dep); low.set(id, Math.min(low.get(id), low.get(dep))); }
      else if (onStack.has(dep)) low.set(id, Math.min(low.get(id), numbers.get(dep)));
    }
    if (low.get(id) === numbers.get(id)) {
      const component = []; let member;
      do { member = stack.pop(); onStack.delete(member); component.push(member); } while (member !== id);
      if (component.length > 1 || nodes.get(id).dependencies.includes(id)) {
        const ids = component.sort();
        for (const item of ids) find(item, "cycle", "Cycle members: " + ids.join(", "));
      }
    }
  }
  [...nodes.keys()].sort().forEach((id) => { if (!numbers.has(id)) connect(id); });
  for (const node of nodes.values()) if (node.settled) {
    if (node.dependencies.some((id) => !nodes.get(id).settled || nodes.get(id).issues.length)) find(node.id, "settled-prerequisite-review", "Approved answer retains an unresolved or uncertain prerequisite; review the relationship without reopening the answer.");
    if (node.blockers.length || node.issues.some((code) => code.includes("blocker"))) find(node.id, "settled-blocker-review", "Review leftover blockers without discarding the approved answer.");
  }

  const questions = selected.map((id) => {
    const start = nodes.get(id);
    const internal = new Set(), context = new Set(), causes = new Map();
    const visited = new Set();
    function cause(kind, source, detail, path) {
      const key = JSON.stringify([kind, source, detail]);
      if (!causes.has(key)) causes.set(key, { kind, source, detail, path });
    }
    // One deterministic explanatory path per cause; shared diamonds do not
    // enumerate every possible path. Active recursion detects unresolved cycles.
    function walk(current, path, active) {
      const node = nodes.get(current);
      if (node.settled) { context.add(current); return; }
      if (active.has(current)) { cause("review", current, "Unresolved dependency cycle", path); return; }
      if (visited.has(current)) return;
      visited.add(current);
      for (const code of node.issues) cause("review", current, code, path);
      if (["deferred", "out-of-scope"].includes(node.status)) cause("review", current, node.status, path);
      if (current !== id && node.status === "todo") {
        if (selectedSet.has(current)) internal.add(current);
        else cause("outside-ticket", current, node.title, path);
      }
      for (const fact of node.blockers) cause("external-fact", current, fact, path);
      const nextActive = new Set(active); nextActive.add(current);
      for (const dep of node.dependencies) walk(dep, [...path, dep], nextActive);
    }
    walk(id, [id], new Set());
    const waiting = [...causes.values()];
    const disposition = start.settled ? "approved-context"
      : ["deferred", "out-of-scope"].includes(start.status) ? start.status
      : waiting.some((item) => item.kind === "review") ? "needs-review"
      : waiting.length ? "waiting" : internal.size ? "answer-after" : "answer-now";
    return { id, title: start.title, status: start.status, disposition, internalPrerequisites: sorted(internal), approvedContext: sorted(context), directExternalFacts: start.blockers, causes: waiting };
  });
  // Only nodes with an established order participate; never manufacture an
  // order for a cycle or its affected dependents. Waiting acyclic nodes remain.
  const candidates = new Set(questions.filter((q) => !["needs-review", "deferred", "out-of-scope", "approved-context"].includes(q.disposition)).map((q) => q.id));
  const prerequisiteOrder = [];
  while (candidates.size) {
    const ready = [...candidates].sort().filter((id) => !questions.find((q) => q.id === id).internalPrerequisites.some((dep) => candidates.has(dep)));
    if (!ready.length) break;
    for (const id of ready) { candidates.delete(id); prerequisiteOrder.push(id); }
  }
  const outside = new Map();
  for (const question of questions) for (const cause of question.causes.filter((c) => c.kind !== "review")) {
    // A factual blocker is identified by its source ticket and text, not wording alone.
    const key = JSON.stringify(cause.kind === "external-fact"
      ? [cause.kind, cause.source, cause.detail] : [cause.kind, cause.source]);
    if (!outside.has(key)) outside.set(key, { kind: cause.kind, detail: cause.detail, sources: [], affected: [] });
    const notice = outside.get(key);
    if (!notice.sources.includes(cause.source)) notice.sources.push(cause.source);
    if (!notice.affected.some((item) => item.id === question.id)) {
      notice.affected.push({ id: question.id, path: cause.path });
    }
  }
  return { selected, questions, prerequisiteOrder, outsideNotices: [...outside.values()], nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)), findings: findings.sort((a, b) => a.id.localeCompare(b.id) || a.code.localeCompare(b.code) || a.detail.localeCompare(b.detail)) };
}
