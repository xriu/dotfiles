# PRD: Extract LoopOrchestrator from Ralph Wiggum

**Status:** `ready-for-agent`
**Owner:** Xavier Riu
**Created:** 2026-07-18
**Source:** Architecture review — Candidate 2 (Strong recommendation)

## Problem Statement

The Ralph Wiggum extension is 1534 lines across two files (`index.ts` + `command-handlers.ts`). Loop lifecycle logic — starting a loop, advancing iterations, stopping — is scattered across four places: tool handlers in index.ts, CLI command handlers in command-handlers.ts, event handlers in index.ts, and cross-cutting helper functions. The previous refactor (commit `c3215ec`) moved code from index.ts into command-handlers.ts but left a 7-callback dependency interface that leaks internal concerns. LoopRuntime exists as a 49-line module that tracks an active-loop name and a flag — the real orchestration logic lives outside it.

When someone wants to understand "what happens when a loop advances?" they must trace through: `ralph_done` tool handler → `enforceMaxIterations` helper → `tryAdvancePlanIssue` on store → `sendPrompt` helper → `buildPrompt`. Then repeat for the CLI `resume` command and the `agent_end` event handler — each with slightly different variants of the same logic.

This makes the extension hard to test, hard to modify, and hard to reason about. Adding a new lifecycle feature (e.g., pause-on-error) would require touching all four locations.

## Solution

Extract a `LoopOrchestrator` module with a 3-method interface — `start`, `advance`, `stop` — that owns all loop lifecycle logic behind a single seam. Callers (tool handlers, CLI commands, event handlers) become thin adapters that call the orchestrator and handle UI presentation. `LoopRuntime` is absorbed and deleted. The 7-callback `CommandDeps` interface shrinks to a single `LoopOrchestrator` dependency.

## User Stories

### Core lifecycle

1. As a developer starting a Ralph loop, I want to call one method that creates the loop state, persists it, and returns the initial prompt, so that I don't have to duplicate state creation logic across tools and CLI commands.

2. As a developer advancing a Ralph loop iteration, I want to call one method that increments the iteration, checks reflection and max-iteration limits, advances to the next issue if applicable, and returns the next prompt, so that iteration advancement is consistent regardless of whether it was triggered by a tool call, a CLI command, or the agent completing a turn.

3. As a developer stopping a Ralph loop, I want to call one method that transitions the loop to paused or completed, persists the state, and clears the active loop reference, so that stop behavior is consistent across all stop triggers (/ralph stop, /ralph-stop, max iterations, plan completion).

4. As a developer wiring the extension to pi events, I want the orchestrator to expose the active loop name and done-this-turn flag, so that event handlers (before_agent_start, agent_end, session_compact) can read loop state without reaching into internal tracking variables.

### Interface quality

5. As a developer reading command-handlers.ts, I want each CLI command handler to be parses-args → calls-orchestrator → notifies-UI, with no inline loop logic, so that the file is navigable and focused on CLI UX.

6. As a developer adding a new command to the extension, I want to depend on one module (LoopOrchestrator) instead of seven callbacks, so that I can understand the dependency surface in one glance.

7. As a developer reading index.ts, I want the file to contain only pi-specific wiring (tool registration, event registration, UI updates), so that I can distinguish "what pi requires" from "what Ralph does."

### Testability

8. As a developer writing tests, I want to test iteration advancement logic without a filesystem or a running pi agent, so that tests are fast and deterministic.

9. As a developer writing tests, I want to test reflection triggering logic by calling `advance` and asserting the returned prompt contains reflection instructions, so that reflection behavior is verified independently of the rest of the system.

10. As a developer writing tests, I want to test max-iteration enforcement by calling `advance` on a state at the limit and asserting the loop completes, so that the safety limit is verified.

### Robustness

11. As a developer maintaining the extension, I want a single place where issue advancement happens (plan-level loops), so that when the issue-advancement rules change I only update one module.

12. As a developer debugging a loop, I want the same code path to be exercised whether the loop is advanced via `ralph_done`, `/ralph resume`, or automatic advancement after `COMPLETE` marker, so that bugs reproduce consistently.

### Deletion

13. As a developer running the extension, I want LoopRuntime deleted and its responsibilities moved into LoopOrchestrator, so that there is one fewer module to navigate.

## Implementation Decisions

### Module: LoopOrchestrator

A new module that owns the full loop lifecycle. Constructed with a `LoopStore` instance.

**Interface (3 methods):**

```
start(name, config, ctx) → { state: LoopState, prompt: string }
advance(state, ctx)        → { prompt: string, complete?: boolean }
stop(state, status, ctx)   → void
```

- `start` creates a `LoopState`, persists it via the store, loads PRD content for plan-level loops, builds the initial prompt via PromptBuilder, sets `activeLoop`, and returns both state and prompt.
- `advance` increments `state.iteration`, checks and enforces max-iterations (returns `complete: true` if exceeded), checks reflection (appends reflection instructions to prompt if at reflection interval), calls `store.tryAdvancePlanIssue` for plan-level loops (returns `complete: true` if all issues done), persists state, builds prompt, sets `doneThisTurn`, and returns the prompt.
- `stop` sets `state.status` to the given status (`"paused"` or `"completed"`), sets `completedAt` timestamp if completing, persists via store, and clears `activeLoop`.

**Absorbed state (from LoopRuntime):**

- `activeLoop: string | null` — the currently active loop name
- `doneThisTurn: boolean` — whether `ralph_done` was called this turn (set by `advance`, cleared by `before_agent_start` flow)

**Dependencies:**

- `LoopStore` — injected via constructor (enables testing with mock store)
- `PromptBuilder.buildPrompt` — called internally; not injectable
- `PlanPaths.scratchDirFromFile` — called internally for resolving scratch dir during issue advancement

### Modules modified

**index.ts** shrinks from ~725 to ~150 lines. Changes:
- Removes cross-cutting helpers: `banner`, `formatMaxIter`, `pauseLoop`, `completeLoop`, `enforceMaxIterations`, `sendPrompt`, `loadPrdContent`.
- Replaces them with `LoopOrchestrator` calls.
- `updateUI` stays — it's presentation logic tied to `ExtensionContext.ui`.
- Event handlers become thin: call orchestrator, call `updateUI`, call `pi.sendUserMessage` with the returned prompt.
- Tool handlers (`ralph_start`, `ralph_done`) become thin: parse params, call orchestrator, return result.
- Command registrations: `registerCommands(pi, store, orchestrator)` instead of `registerCommands(pi, store, runtime, deps)`.

**command-handlers.ts** shrinks from ~809 to ~200 lines. Changes:
- `CommandDeps` interface replaced by a single `LoopOrchestrator` parameter.
- `registerCommands` signature: `(pi, store, orchestrator)`.
- Each command handler (`start`, `resume`, `stop`, etc.) becomes: parse args → orchestrator call → notify UI.
- Duplicate state-creation logic in `start` command (currently ~40 lines) replaced by `orchestrator.start(...)`.
- Duplicate iteration-advancement logic in `resume` command (currently ~30 lines) replaced by `orchestrator.advance(...)`.

**loop-runtime.ts** — DELETED. All state and behavior absorbed into LoopOrchestrator.

### Modules unchanged

- **LoopStore** — no changes. Already has clean interface: `loadState`, `saveState`, `listLoops`, `discoverPlans`, `findNextIncompleteIssue`, `tryAdvancePlanIssue`.
- **PromptBuilder** — no changes. `buildPrompt` signature unchanged.
- **PlanPaths** — no changes. Pure functions with no side effects.

### Architectural decisions

- **ADR-0001** applies: 3-method interface, LoopRuntime absorbed, PromptBuilder called internally, single-PR delivery, file at `loop-orchestrator.ts`.
- The orchestrator does NOT own UI concerns (`updateUI`, `banner`, `formatMaxIter`) — those remain in index.ts because they are tied to `ExtensionContext.ui` API.
- The orchestrator does NOT replace `LoopStore` — persistence is a separate concern.
- Event handler logic unique to pi (e.g., `agent_end` checking for `COMPLETE_MARKER` in assistant messages, `session_compact` checking `willRetry`) stays in index.ts — the orchestrator doesn't know about pi message formats or compaction events.

## Testing Decisions

### What makes a good test

Tests verify external behavior through the public interface only. For LoopOrchestrator, the public interface is `start`, `advance`, `stop` plus the `activeLoop` and `doneThisTurn` properties. Tests do not reach into internal state or mock internal function calls.

### Modules tested

**LoopOrchestrator** — unit tests with a mock LoopStore:
- `advance` increments iteration count
- `advance` triggers reflection at configured interval (prompt contains reflection instructions)
- `advance` enforces max-iterations (returns `complete: true`)
- `advance` advances to next issue for plan-level loop when current issue is done
- `advance` returns `complete: true` when all issues in a plan are done
- `stop` transitions state to paused, persists, clears activeLoop
- `stop` transitions state to completed, sets completedAt, persists, clears activeLoop
- `start` creates state with correct defaults (iteration=1, status=active)
- `start` rejects if loop already exists

**LoopOrchestrator** — integration tests with real LoopStore against temp directories:
- `start` creates state file on disk
- `start` returns a prompt containing the task content
- Full lifecycle: start → advance → advance → stop → state is completed on disk

### Prior art

No existing tests in the ralph-wiggum extension. These will be the first. Test runner: Vitest (consistent with pi extension conventions). Mock store: in-memory implementation of the `LoopStore` interface, or a real `LoopStore` pointed at a temp `.scratch/` directory.

## Out of Scope

- **Refactoring LoopStore.** LoopStore's interface is already adequate. Internal cleanup (e.g., splitting `scanDirForStates`) is not part of this work.
- **Refactoring PromptBuilder.** Prompt string construction is already a pure function module. No changes needed.
- **Adding new loop features.** Pause-on-error, loop chaining, parallel loops — none of these are in scope. This is a structural refactor only.
- **Migrating the `ralph` CLI command to pi's native command system.** The `/ralph` command stays as a single catch-all command with subcommand routing.
- **File-watching for external state changes.** If another process modifies loop state files, the orchestrator does not detect it. This is existing behavior.
- **LoopOrchestrator as a standalone npm package.** It stays within the ralph-wiggum extension directory.

## Further Notes

- The `sendPrompt` helper currently handles the case where a task file can't be read — this error path moves into `start`/`advance` return values (return `null` prompt on failure instead of calling `pauseLoop` as a side effect).
- Cross-project ref handling (`store.setCrossProjectRef`, `store.saveCrossProjectRefs`) currently happens in both `ralph_start` tool and `start` command — `start` on the orchestrator absorbs this duplication.
- The `agent_end` handler has a special case for plan-level loops where `tryAdvancePlanIssue` changes `state.taskFile` but the `COMPLETE_MARKER` was present — this logic stays in index.ts (it's pi message-format-specific), but calls `orchestrator.advance` instead of inline state mutation.
