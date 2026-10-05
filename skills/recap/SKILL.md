---
name: recap
description: Catch the user up on the current plan with a structured status card (goal, phases with progress, where things stand, recent decisions, risks, next step). Use when the user says "recap", "/recap", "ponme al día", "¿por dónde vamos?", "where are we", "status" or asks for a progress summary. Works idle or mid-task; when work is in progress, answer the recap and then keep working without stopping.
license: MIT
---

# Recap

Give the user a clear picture of the plan, where it stands and what comes next. A recap is a **side answer, not a new task**: it never changes the plan, the state or the work in progress.

## 1. Detect the mode

- **Mid-task**: you were working when the request arrived. Signs: an unfinished turn or tool sequence, a message injected while you work (a steer), unfinished todo items, a running background job, or a turn the harness interrupted to deliver this request.
- **Idle**: the previous turn had finished and nothing is running.

## 2. Gather the facts (read-only, cheap)

1. **Conversation first.** Use the latest agreed plan, todo list, last completed step, running jobs, pending decisions and anything the user is waiting on.
2. **Files only if the conversation is not enough** (for example, a fresh session). Read at most 5 files, and stop as soon as you have the picture:
   - pointers in `AGENTS.md`, `CLAUDE.md` or a README to plan or state files;
   - files named like `PLAN*`, `ROADMAP*`, `STATUS*`, `ESTADO*`, `CONTINUIDAD*`, `TODO*`, `HANDOFF*`;
   - the most recent report under a `tasks/` folder;
   - `git log --oneline -5` if the folder is a repository.
3. Never edit files, run commands with side effects, make network or model calls, or mark todo items as done to produce a recap.
4. Do not invent. If something is unknown, say so. If there is no identifiable plan, say that in one line, summarise what has been done in this session, and propose the decision needed to define a plan.

## 3. Write the recap

**Business language, always.** Write the recap as if for a non-technical stakeholder: what the product does for its users, which features are done, which are coming. Name features by what a user can do with them ("change between your Hermes servers without logging in again"), never by internal labels. Never mention phase codes, unit/round/release ids (G3, R5, W6, B1, UI.A7…), hashes, leases, test counts, file names, branches or tooling. Technical detail belongs in the state files, not in the recap. If the user asks for detail, give it; otherwise do not.

Write in the language the user is using. Use only markdown, so it renders in any client (Claude, Codex, Hermes CLI). Keep it to roughly 20–40 lines. Omit a section that would be empty, except **Next step**.

Template (labels shown in English; translate them):

```markdown
## 🧭 Recap · <plan name>

**🎯 Goal:** <one sentence: what we are building or achieving and why>

`▰▰▰▰▰▰▱▱▱▱` **<done>/<total> phases** · <overall state in 3–6 words>

### 🗺️ Plan
| | Phase | Status |
|---|---|---|
| ✅ | <phase> | done |
| 🔄 | <phase> | **in progress** |
| ⏳ | <phase> | pending |
| ⛔ | <phase> | blocked: <reason> |

### 📍 Where we are
- <what is happening right now, or the last completed step>
- <what is running or waiting, and on whom>

### 🧩 Recent decisions
- <decision> — <why, in a few words>

### ⚠️ Risks and blockers
- <risk or blocker, with what would resolve it>

### ⏭️ Next step
> **<one concrete action>** — <who does it: you / me / another agent> · <what it unblocks>

🙋 **I need from you:** <only if something is waiting on the user>
```

Rules:

- Progress bar: 10 cells, filled cells = round(done / total × 10). Count only finished phases as done.
- Plan table: at most 8 rows. Group older finished phases into one row if needed. Describe each phase by the features it gives the user, not by its code name.
- **Where we are**: 2–4 bullets, concrete in product terms (which feature is being built, what the user can already try), no history lesson.
- **Recent decisions**: at most 3, only ones that shape what comes next.
- **Next step**: exactly one action. If the plan has a fork the user must decide, name the options in one line.
- Separate "done and tried" from "built but not yet tried by the user", in plain words, when it matters.

## 4. Continue or stop

**Mid-task:**

- Produce the recap from what you already know; avoid extra tool calls.
- End the recap with one line: `↪️ Continuing with: <task>` (translated).
- Then **immediately resume the exact work you were doing**, in the same turn, from where you left off. Do not restart it, re-plan it, ask permission to continue, or wait for or stop a background job.
- If the turn was interrupted to deliver this request, resume the interrupted work after the recap.
- If the same message also contains a real instruction (a steer), apply it after the recap.

**Idle:** give the recap and stop. Do not start the next step until the user asks.
