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

**Agent Profile**:
A named configuration that selects a model and optional thinking level for the main session and agent roles.
_Avoid_: Agent model

**Agent Override**:
A per-role model and optional thinking-level setting that changes an agent's behavior only when explicitly configured in an Agent Profile.
_Avoid_: Agent preset

**Handoff Document**:
A structured markdown document saved to the OS temp directory during context compaction, designed for a fresh agent session to pick up the work. Contains: goals, key decisions, current state, next steps, suggested skills, artifact references, and a redaction note.
_Avoid_: Compaction summary, session export

**Condensed Summary**:
A 1-2 paragraph prose summary returned to the SessionManager during compaction for inline context replacement. Token-efficient; captures the essential state without the full detail of the handoff document.
_Avoid_: Summary, tl;dr
