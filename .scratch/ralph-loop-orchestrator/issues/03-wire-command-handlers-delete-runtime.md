# 03 — Wire into command-handlers.ts, delete LoopRuntime

**What to build:** Refactor command-handlers.ts to depend on `LoopOrchestrator` directly instead of the 7-callback `CommandDeps`. Each CLI command handler becomes parses-args → calls orchestrator → notifies UI. The `CommandDeps` interface and adapter are deleted. LoopRuntime is deleted since all its state and behavior now live in LoopOrchestrator.

**Blocked by:** 02 — Wire orchestrator into index.ts, remove old helpers.

**Status:** ready-for-agent

- [ ] `registerCommands` signature changed to `(pi, store, orchestrator)` — `runtime` and `deps` parameters removed
- [ ] `CommandDeps` interface removed
- [ ] `start` command: state creation and prompt logic replaced by `orchestrator.start()`; cross-project ref handling absorbed by orchestrator
- [ ] `resume` command: iteration advancement, reflection, issue advancement, and prompt logic replaced by `orchestrator.advance()`
- [ ] `stop` command: pause transition replaced by `orchestrator.stop(state, "paused")`
- [ ] `cancel` command: uses `orchestrator.activeLoop` to clear active reference; state file deletion stays (orchestrator doesn't own cleanup)
- [ ] `archive` command: uses `orchestrator.activeLoop` to clear active reference
- [ ] `clean` command: uses `orchestrator.activeLoop` to clear active reference for completed loops
- [ ] `nuke` command: uses `orchestrator.activeLoop = null` to clear state
- [ ] `status`, `list`, `plans`, `plan`, `issues`, `issue` commands: unchanged (read-only, don't touch lifecycle)
- [ ] `formatLoop` helper stays in command-handlers.ts (presentation concern)
- [ ] `banner` usage removed from command handlers — callers get prompt string from orchestrator and handle display
- [ ] `STATUS_ICONS` stays (presentation concern)
- [ ] `deleteStateFile`, `tryDelete`, `parseArgs` helpers stay (command-specific)
- [ ] Comma-deps adapter from ticket 02 removed from index.ts
- [ ] `loop-runtime.ts` file deleted
- [ ] `import { LoopRuntime }` removed from all files
- [ ] Manual smoke test: `/ralph start my-plan`, `/ralph resume my-plan`, `/ralph stop`, `/ralph status`, `/ralph cancel my-plan`, `/ralph start my-plan/01-issue` all work
- [ ] `loop-runtime.ts` no longer exists in the directory
