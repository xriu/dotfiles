---
name: ralph-wiggum
description: Long-running iterative development loops with pacing control and verifiable progress. Uses .scratch/<plan>/ structure where each plan has a PRD.md and issues/. Use when tasks require multiple iterations, many discrete steps, or periodic reflection with clear checkpoints; avoid for simple one-shot tasks or quick fixes.
---

# Ralph Wiggum - Long-Running Development Loops

Uses the `.scratch/<plan>/` directory structure. Each plan contains a `PRD.md` and an `issues/` folder with individual task files.

## Plan Structure

```
.scratch/
├── my-plan/
│   ├── PRD.md              ← Plan document (problem, solution, user stories)
│   └── issues/
│       ├── 01-first-task.md    ← Individual task with acceptance criteria
│       ├── 02-second-task.md
│       └── 01-first-task.state.json  ← Loop state (auto-created)
```

Each issue file follows this format:

```markdown
## Parent

[PRD](../PRD.md)

## What to build

Description of what to build.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

None (or list blockers).
```

## Starting Loops

Use the `ralph_start` tool or `/ralph start` command:

**Plan-level loop** (works on PRD.md):

```
/ralph start my-plan
```

**Issue-level loop** (works on a specific issue):

```
/ralph start my-plan/01-first-task
/ralph start my-plan/issues/01-first-task   ← also works
```

Via tool:

```
ralph_start({
  name: "my-plan/01-first-task",
  taskContent: "# Task\n\n## Goals\n- Goal 1\n\n## Checklist\n- [ ] Item 1",
  maxIterations: 50,        // Default: 50
  itemsPerIteration: 3,     // Optional: suggest N items per turn
  reflectEvery: 10          // Optional: reflect every N iterations
})
```

## Loop Behavior

1. **State file**: Created automatically at `.scratch/<plan>/.ralph.state.json` (plan loops) or `.scratch/<plan>/issues/<issue>.state.json` (issue loops).
2. **Issue files must exist** before starting an issue-level loop — they are not auto-created.
3. **Plan PRD.md** is auto-created if the plan directory doesn't exist.
4. Work on the task and update the file each iteration.
5. Record verification evidence (commands run, file paths, outputs) in the task file.
6. Call `ralph_done` to proceed to the next iteration.
7. Output `<promise>COMPLETE</promise>` when finished.
8. Stop when complete or when max iterations is reached (default 50).

## User Commands

- `/ralph start <plan> [options]` - Start a plan-level loop (on PRD.md).
- `/ralph start <plan>/<issue> [options]` - Start an issue-level loop.
- `/ralph stop` - Pause current loop (when agent idle).
- `/ralph resume <name>` - Resume a paused loop.
- `/ralph status` - Show all active loops.
- `/ralph plans` - List all plans in .scratch/ with status.
- `/ralph plan <name>` - Show plan summary (PRD title, status, issues).
- `/ralph issues <plan>` - List issues for a plan with their loop status.
- `/ralph cancel <name>` - Delete loop state.
- `/ralph archive <name>` - Archive a completed loop (removes state, keeps task file).
- `/ralph clean [--all]` - Clean completed loops.
- `/ralph list` - Show all loops.
- `/ralph nuke [--yes]` - Delete all state files (task files preserved).
- `/ralph-stop` - Stop active loop (idle only).

## Options

- `--items-per-iteration N` — Suggest N items per turn (prompt hint)
- `--reflect-every N` — Reflect every N iterations
- `--max-iterations N` — Stop after N iterations (default: 50)

## Examples

```
/ralph start architecture-deepening
/ralph start architecture-deepening/01-workflow-context-di --items-per-iteration 3 --reflect-every 5
/ralph plans
/ralph issues architecture-deepening
/ralph plan cloudfront-auto-update
```

Press ESC to interrupt streaming, send a normal message to resume, and run `/ralph-stop` when idle to end the loop.

## Best Practices

1. Write a clear checklist with discrete items.
2. Update checklist and notes as you go.
3. Capture verification evidence for completed items.
4. Reflect when stuck to reassess approach.
5. Output the completion marker only when truly done.
