# pstack skills

These are the 31 skills that remain after removing Cursor-dependent skills. Scores are my subjective estimate of their value in your Pi setup. They are not a quality grade. Existing skills such as Ponytail and Coding Standards lower the score when they cover similar ground.

| Skill                                      | Score / 10 | Why                                                                         |
| ------------------------------------------ | ---------: | --------------------------------------------------------------------------- |
| `prove-it-works`                           |       10.0 | Check the real result before saying the work is done.                       |
| `build-the-lever`                          |        9.7 | Make a small tool or check that repeats or proves the work.                 |
| `fix-root-causes`                          |        9.5 | Find and fix the cause, not the symptom.                                    |
| `model-the-domain`                         |        9.4 | Use data structures to prevent scattered rules and invalid states.          |
| `test-behavior-not-implementation`         |        9.3 | Test what users observe, not internal details.                              |
| `foundational-thinking`                    |        9.2 | Choose the data shape before writing the logic.                             |
| `guard-the-context-window`                 |        9.1 | Keep large outputs out of the main session.                                 |
| `boundary-discipline`                      |        9.0 | Put checks at external boundaries and keep core logic simple.               |
| `type-system-discipline`                   |        8.9 | Use types to prevent invalid states and unsafe assumptions.                 |
| `make-operations-idempotent`               |        8.8 | Make commands safe to retry after a crash.                                  |
| `sequence-verifiable-units`                |        8.8 | Break large tasks into steps with checks.                                   |
| `encode-lessons-in-structure`              |        8.7 | Turn repeated guidance into a test, lint, or other guardrail.               |
| `minimize-reader-load`                     |        8.5 | Reduce indirection and hidden state.                                        |
| `separate-before-serializing-shared-state` |        8.5 | Remove shared writes before adding locks.                                   |
| `correct`                                  |        8.4 | Turn repeated agent mistakes into enforceable checks.                       |
| `explain-the-number`                       |        8.3 | Check what a metric measures before trusting it.                            |
| `benchmark-checklist`                      |        8.2 | Strong measurement checks. Some commands need macOS alternatives.           |
| `laziness-protocol`                        |        8.2 | Good rule, but it overlaps with your Ponytail instructions.                 |
| `subtract-before-you-add`                  |        8.1 | Remove dead weight before adding more.                                      |
| `attack-the-premise`                       |        7.9 | High value when repeated fixes fail for the same reason.                    |
| `never-block-on-the-human`                 |        7.9 | Helps with reversible choices. Keep safety limits for irreversible actions. |
| `outcome-oriented-execution`               |        7.7 | Useful for planned rewrites and migrations.                                 |
| `migrate-callers-then-delete-legacy-apis`  |        7.7 | Good migration rule, but applies to a narrower set of work.                 |
| `redesign-from-first-principles`           |        7.6 | Helps when a new requirement changes the design.                            |
| `experience-first`                         |        7.4 | Useful for product and UX choices.                                          |
| `exhaust-the-design-space`                 |        7.2 | Encourages prototypes, but can add work to simple decisions.                |
