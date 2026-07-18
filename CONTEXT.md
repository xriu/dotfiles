# dotfiles — pi agent extensions

Personal configuration and extensions for the pi coding agent: agent profiles, guardrails, long-running development loops, skills, and shell configuration.

## Language

**Ralph Loop** (or **Development Loop**):
A persistent, multi-iteration development workflow managed by the Ralph Wiggum extension. The agent works through a task file iteration by iteration, calling `ralph_done` to advance.
_Avoid_: Agent loop, iteration cycle

**Plan**:
A container directory under `.scratch/<plan>/` holding a `PRD.md` (product requirements doc) and an `issues/` subdirectory of task files. Plan-level loops work through issues sequentially.
_Avoid_: Project, module, workspace

**Issue**:
A single task file within a plan (`issues/<name>.md`), containing a checklist of acceptance criteria. Issue-level loops are scoped to one issue.
_Avoid_: Ticket, task item, story

**LoopState**:
The persisted JSON state of a loop — iteration count, status (active/paused/completed), max iterations, reflection settings, and TDD mode flag. Stored as `.state.json` files alongside task files.
_Avoid_: Loop config, loop metadata

**LoopOrchestrator**:
The module that owns loop lifecycle — `start()`, `advance()`, `stop()`. It encapsulates state transitions, prompt generation, iteration enforcement, and issue advancement behind a narrow interface.
_Avoid_: Loop manager, loop controller

**LoopStore**:
State persistence layer for loops. Owns load/save of LoopState, cross-project references, plan discovery, and issue advancement logic.

**Cross-project ref**:
A loop whose `.scratch/` directory lives in a different project. Referenced via an absolute path stored in `.ralph.cross-refs.json`.

**Reflection**:
A periodic checkpoint where the agent pauses to assess progress against the task. Configured via `--reflect-every N`.

**Plan-level loop**:
A loop started by plan name (e.g., `my-plan`). The agent works through the plan's issues sequentially — completing one advances to the next.

**Issue-level loop**:
A loop started with an issue path (e.g., `my-plan/01-bugfix`). The agent works on a single issue.
