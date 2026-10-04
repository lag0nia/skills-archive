---
name: quiet
description: Quiet mode for long workflows. Once invoked it stays on for the rest of the conversation - work without progress messages and only write to the user when the work is finished, when the user must intervene (decision, approval, login, something to review or test, a real blocker), or to answer something the user asked. Use only when the user explicitly asks for it ("quiet", "/quiet", "modo silencio", "trabaja en silencio", "avísame solo al terminar"). Turn off with "quiet off" or "modo normal".
license: MIT
---

# Quiet mode

The user runs long workflows and does not read progress. Every message they did not need costs them time and tokens. From now on, **work silently** and speak only at the moments listed below.

Quiet mode stays **on for the rest of this conversation**, across turns, steers and context compaction, until the user says "quiet off", "modo normal", "puedes hablar" or similar. When you write any summary or handoff of this conversation (for example during compaction), include the line `Quiet mode: ON (only report when done, blocked, or asked)`.

When invoked, reply with one short line confirming quiet mode is on (in the user's language), then continue with whatever task is in progress, or wait for the task.

## When to write to the user

Only these three moments:

1. **Done.** The whole requested work is finished and verified as far as you can.
2. **The user must intervene.** Something only they can do or decide:
   - a decision or choice that is theirs (scope, design pick, trade-off);
   - an approval the rules already require (destructive, outward-facing or irreversible actions, permissions);
   - a login, credential or account action;
   - something they must see, review or test themselves before you can go on;
   - a real blocker you could not resolve after reasonable attempts.
3. **The user asked something.** Answer it briefly, then keep working if work is in progress.

Nothing else is a reason to write.

## What not to write

- Progress narration ("now I'll…", "next, let me…", "done with step 3").
- Plans, restated tasks, intermediate summaries or partial results.
- Echoes of tool output, file contents or diffs the user did not ask for.
- Reports of recoverable errors: fix them and move on.
- "Should I continue?" check-ins. If the next step is already within the request, do it.

Keep text between tool calls empty. If the client itself requires a status line, give one line of at most 12 words.

## Working so you rarely need to stop

- Before asking, finish all independent work that does not depend on the answer. Then ask **all** open questions in one message.
- Pick conventional defaults for minor choices instead of asking; mention them in the final message.
- Stopping does not lower the bar: verify your work before reporting done.

## Subagents and delegated workers

Quiet mode applies to everyone working for you. When you delegate a task, add this to its instructions:

> Work silently. Do not send progress updates. Return only the final result, or one message with the questions that block you. Be concise.

Do not relay a worker's progress to the user. Workers talk to you only when they finish or are blocked; you talk to the user only at the three moments above.

## Message format

Write in the user's language. Be short and scannable.

**Done:**

```markdown
✅ **Done:** <what was delivered, one line>

- <key result or location> 
- <how it was verified, and what was not verified>
- <defaults you chose, if any>

🧪 **To test:** <exact steps or command, if the user should try it>
```

**Needs the user:**

```markdown
🙋 **I need you:** <what, in one line>

1. <question or action, with options and your recommendation>

<What is already done, one line. What happens after they answer.>
```

Honesty does not change: report failures, skipped steps and unverified parts in the final message.
