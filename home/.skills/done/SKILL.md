---
name: done
description: Finalize repository work safely — commit changes and push the current branch. Use when the user says "done", "wrap up", "finalize work", or invokes /done.
disable-model-invocation: true
---

# Done — Finalize Repository Work

Commit changes and push the current branch safely. Does **not** merge or rebase into the default branch — integration is left to the user.

## Workflow

1. **Inspect state**: Run `git status` and check the current branch.
2. **Commit**: Stage and commit relevant unstaged changes with an appropriate message.
3. **Push**: Push the current branch to remote. Report any conflicts, policy mismatches, or missing information before taking risky actions.
4. **Worktrees**: If this repository uses worktrees, update the worktree accordingly; otherwise skip this step.

## Guardrails

- **Do NOT merge** the current branch into the default branch (main/master).
- **Do NOT rebase** the current branch onto the default branch.
- Leave all integration into the default branch to the user.
- Report any issues before pushing (untracked files that should be committed, large files, potential conflicts).
