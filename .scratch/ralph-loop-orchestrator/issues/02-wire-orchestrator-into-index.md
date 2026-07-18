# 02 — Wire orchestrator into index.ts, remove old helpers

**What to build:** Replace the cross-cutting helper functions and inline loop logic in index.ts with `LoopOrchestrator` calls. Tool handlers (`ralph_start`, `ralph_done`), event handlers, and the `ralph-stop` command become thin adapters. command-handlers.ts is temporarily adapted via a thin `CommandDeps → orchestrator` wrapper so it keeps working without being fully refactored yet.

**Blocked by:** 01 — Create LoopOrchestrator with tests.

**Status:** ready-for-agent

- [ ] `LoopOrchestrator` is instantiated in `index.ts` with the real `LoopStore`
- [ ] `ralph_start` tool handler: state creation and prompt logic replaced by `orchestrator.start()`
- [ ] `ralph_done` tool handler: iteration advancement, reflection, max-iterations, and prompt logic replaced by `orchestrator.advance()`
- [ ] `ralph-stop` command: completion logic replaced by `orchestrator.stop()`
- [ ] `before_agent_start` handler: uses `orchestrator.activeLoop` and `orchestrator.doneThisTurn`; clears `doneThisTurn` before each agent turn
- [ ] `agent_end` handler: COMPLETE_MARKER detection and issue advancement logic replaced by `orchestrator.advance()`; message-format-specific logic (scanning assistant messages for marker text) stays in index.ts
- [ ] `session_start` handler: loop discovery and active-loop restoration uses `orchestrator.activeLoop` setter
- [ ] `session_before_compact` handler: uses `orchestrator.activeLoop` for state save
- [ ] `session_compact` handler: retry logic uses `orchestrator.advance()`; `willRetry` skip stays in index.ts
- [ ] `session_shutdown` handler: uses `orchestrator.activeLoop` for final state save
- [ ] Cross-cutting helpers removed: `banner`, `formatMaxIter`, `pauseLoop`, `completeLoop`, `enforceMaxIterations`, `sendPrompt`, `loadPrdContent`
- [ ] `updateUI` remains in index.ts unchanged (presentation concern)
- [ ] `CommandDeps` adapter created: a thin object mapping the 7 old callbacks to orchestrator methods, passed to `registerCommands` so command-handlers.ts functions without changes
- [ ] Manual smoke test: start a loop via `ralph_start` tool → iteration advances via `ralph_done` → loop completes → agent events fire correctly
