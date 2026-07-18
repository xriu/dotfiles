# Extract LoopOrchestrator from Ralph Wiggum extension

The Ralph Wiggum extension (1534 lines across `index.ts` + `command-handlers.ts`) scatters loop lifecycle logic across tool handlers, CLI command handlers, event handlers, and a 7-callback `CommandDeps` interface. A previous refactor moved code from `index.ts` → `command-handlers.ts` without deepening the module — `command-handlers.ts` still knows about loop state, plan paths, and prompt building.

We're extracting a `LoopOrchestrator` module with a 4-method interface (`start`, `resume`, `advance`, `stop`) that owns all loop lifecycle logic behind one seam. `command-handlers.ts` stays as a separate file but its interface shrinks from 7 callbacks to a single `LoopOrchestrator` dependency. `LoopRuntime` (49 lines of active-loop tracking) is absorbed into the orchestrator and deleted.

**Considered options:**
- **3-method interface (start/advance/stop):** Rejected — `resume` semantics (continue at current iteration without incrementing) differ from both `start` (create new) and `advance` (increment → next). The CLI `resume` command needs a dedicated method that sets state active and builds the prompt without calling the issue advancement or iteration-increment logic.
- **Keep LoopRuntime separate:** Rejected — 49 lines is too thin for a module; splitting state between orchestrator and runtime creates coordination overhead.
- **Fold command-handlers.ts into index.ts:** Rejected — keeping the CLI parsing/UX layer separate keeps both files navigable (~200 + ~150 loc vs one 350 loc file).

**Consequences:**
- Loop lifecycle becomes testable without the pi API (mock LoopStore, pure `advance`/`stop` logic).
- `CommandDeps` interface shrinks from 7 callbacks to 1 dependency.
- Duplicate start/advance logic across tools and commands is eliminated.
