---
description: (xriu) Finalize current work safely for the current repository workflow
---

Finalize the current work safely:

1. Inspect git status and current branch.
2. Identify the repository default branch.
3. Commit staged and relevant unstaged changes with an appropriate message if needed.
4. Update the default branch from remote.
5. Merge or rebase the current branch onto the default branch, following the repo’s existing workflow.
6. Push the branch and report any conflicts, policy mismatches, or missing information before taking risky actions.
7. If this repository uses worktrees, update the worktree accordingly; otherwise skip that step.
