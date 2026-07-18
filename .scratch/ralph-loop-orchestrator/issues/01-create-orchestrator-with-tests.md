# 01 — Create LoopOrchestrator with tests

**What to build:** A new `LoopOrchestrator` module that owns loop lifecycle — `start`, `advance`, `stop` — with unit and integration tests. This ticket delivers the module in isolation; it is NOT wired into index.ts or command-handlers.ts yet. LoopRuntime continues to function unchanged alongside it.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `LoopOrchestrator` class exists with constructor taking `LoopStore`
- [ ] `start(name, config, ctx)` creates `LoopState`, persists via store, loads PRD for plan-level loops, builds prompt via `PromptBuilder`, sets `activeLoop`, returns `{ state, prompt }`
- [ ] `start` returns error if loop already exists (loadState returns non-null)
- [ ] `advance(state, ctx)` increments iteration, checks/enforces max-iterations (returns `complete: true`), checks reflection interval, advances plan issues via `store.tryAdvancePlanIssue`, persists state, builds prompt, sets `doneThisTurn`, returns `{ prompt, complete? }`
- [ ] `stop(state, status, ctx)` sets state.status, sets `completedAt` if completing, persists, clears `activeLoop`
- [ ] `activeLoop` property (get/set) tracks the currently active loop name
- [ ] `doneThisTurn` property exposed (get/set); set to `true` by `advance`, cleared externally
- [ ] Unit tests with mock `LoopStore`: advance increments iteration, advance triggers reflection at interval, advance enforces max-iterations, advance returns complete when all issues done, stop transitions state, start creates correct defaults, start rejects existing loop
- [ ] Integration test with real `LoopStore` against temp `.scratch/`: start creates state file, start returns prompt containing task content, full start→advance→advance→stop lifecycle
- [ ] `LoopRuntime` and `index.ts` are NOT modified
