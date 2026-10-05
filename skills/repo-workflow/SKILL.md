---
name: repo-workflow
description: Mandatory change procedure for any git repository - one branch per feature, small commits, a pull request for every change, and a merge into the default branch only through that PR and only when the user approves it. Use it whenever you work inside a git repository and are about to create, edit or delete tracked files, commit, push, open or update a PR, merge, or revert. It applies to code, docs, config and evidence alike, in Claude Code, Codex, Hermes and their subagents. Also use it when the user says "branch", "PR", "merge", "mergea", "sube los cambios", "push" or "revert".
license: MIT
---

# Repo workflow

Every change reaches the default branch (`main`, `master`, …) **through a pull request**. No exceptions: not for docs, not for a one-line fix, not for "just evidence". Direct commits or pushes to the default branch are never allowed. This keeps history ordered and every change easy to review and to revert.

Stricter rules in the repository (`CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`) also apply. If a repository rule contradicts "everything through a PR", stop and ask the user.

## 0. Detect

```bash
git rev-parse --show-toplevel                         # inside a repo?
git remote -v                                         # is there a remote?
git symbolic-ref --short refs/remotes/origin/HEAD     # default branch (e.g. origin/main)
gh auth status                                        # can PRs be opened from here?
```

Not a git repository → this skill does not apply.

## 1. Before the first edit: be on a feature branch

1. `git status`. If there are changes you did not make, do not move, stash, commit or discard them: ask the user.
2. If you are on the default branch, update it and branch off:

   ```bash
   git fetch origin
   git switch <default> && git pull --ff-only
   git switch -c <type>/<short-slug>
   ```

   Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`. Slug: a few lowercase words, e.g. `feat/history-reopen`.
3. Already on a feature branch for this same task → keep using it. A different task gets a different branch.
4. One feature = one branch = one PR. Do not mix unrelated changes.

## 2. Commit

- Small, logical commits. Message: `<type>: <what changed>` in the imperative, plus a body when the why is not obvious.
- Stage explicit paths (`git add <paths>`). No blind `git add -A` / `git add .`.
- Never commit secrets, credentials, tokens, `.env` files, personal data or large generated artifacts. Check `git diff --cached` before committing.
- Run the checks the project defines (tests, lint, typecheck) for what you touched. Report anything you could not run.
- Never `--no-verify`. Never rewrite history the user or another agent may already have (no force-push of shared branches, no amend of pushed commits) without asking.

## 3. Push and open the PR

```bash
git push -u origin <branch>
gh pr create --base <default> --head <branch> --title "<type>: <summary>" --body-file <file>
```

PR body (keep it short, fill every heading):

```markdown
## What and why
<the change and the reason, 1–5 lines>

## Changes
- <main files or areas touched>

## Verification
- Observed: <what you ran or saw yourself, with results>
- Reported: <what others (tests, workers, CI) claim, not re-checked>
- Not verified: <gaps>

## Risk and rollback
<what could break; how to revert (e.g. revert this PR)>
```

No `gh` or not on GitHub → push the branch and give the user the compare URL or the exact steps. No remote at all → keep the branch local and tell the user.

## 4. Merge: only through the PR, only with the user's approval

There are two allowed ways, and both go through the PR:

1. **The user merges** it themselves on the hosting site.
2. **The agent merges** it, only after the user explicitly says so for that PR ("merge", "mergea", "sube esto", "aprobado"). Approval for one PR does not cover others. Then:

   ```bash
   gh pr checks <number>                                   # must be green or have none
   gh pr merge <number> --squash --delete-branch
   gh pr comment <number> --body "Merged by the agent on the user's explicit instruction."
   git switch <default> && git pull --ff-only
   ```

Default merge method: **squash** (one commit per feature on the default branch; the PR keeps the detail), unless the repository says otherwise. Never merge with failing checks, unresolved conflicts or an outdated base without telling the user.

After opening a PR, tell the user: branch, PR link, what it contains, check status, and that it is waiting for their review or their "merge".

## 5. While the PR is open

- More work for the same feature → commit on the same branch and push; the PR updates itself.
- Default branch moved → `git fetch origin && git merge origin/<default>` into the feature branch (no force-push needed). Rebase plus `--force-with-lease` only on a branch nobody else uses.
- Review comments → address them in new commits; reply on the PR when useful.

## 6. Several agents in parallel

- One task, one branch, one writer. Two agents never commit to the same branch at the same time.
- Parallel workers in the same repository use separate worktrees:

  ```bash
  git worktree add ../<repo>-<slug> -b <type>/<slug> origin/<default>
  ```

- Workers commit and push their own branch and open (or hand over) their PR. Only the coordinator or the user merges. Remove finished worktrees with `git worktree remove`.

## 7. Revert

Something merged went wrong → revert it **through a new PR**, never by editing the default branch directly:

```bash
git switch -c fix/revert-<slug> origin/<default>
git revert <squash-commit-sha>        # for a merge commit: git revert -m 1 <sha>
```

Then open the PR as in step 3.

## Never

- Commit or push to the default branch, for any reason.
- Merge without the user's explicit approval for that PR.
- Bypass hooks or checks, force-push shared history, or delete someone else's branch.
- Sweep unrelated or unknown changes into your commits.
