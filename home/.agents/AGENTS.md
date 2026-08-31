# AGENTS.md

## Engineering principles

- **ASD-STE100.**
  - Always answer in ASD-STE100 Simplified Technical English for user reports, code comments, and commit messages.
  - Always talk to me like I have ADHD.
  - Always read CONTEXT.md files, and use their ubiquitous language.
  - Write always in English.
- **YAGNI.** Implement the simplest solution that fully meets the current requirement. Add an abstraction, configuration item, or indirection layer only when a present requirement needs it.
- **Walking skeleton.** First complete the smallest version that runs end to end. Then add features in layers on that stable base.
- **Removal.** When you replace deprecated code, delete its paths, compatibility layers, fallbacks, and migration mechanisms.
- **Reuse first.** Before you implement common functionality, inspect the current dependencies, their documentation, and their type definitions. Use an existing capability when it meets the requirement. Otherwise, use a mature, maintained library when it reduces total complexity or improves reliability.
- **Proven patterns.** Before you design an architectural mechanism, study established implementations of the same problem. Use a proven pattern when it meets the current requirements and constraints.
- **Lasting design.** When multiple solutions meet the requirement, select the solution that best supports expected changes in requirements, domain documents, or ADRs.
- **Information hiding.** Hide implementation complexity behind small public interfaces. Separate concerns that change for different reasons.

## Skills

Load these skills at session start; follow them for the whole session:

- **`/ponytail`** — laziest solution that works: stdlib first, shortest diff, no speculative abstractions.

## Agent reference

- **Issues and PRDs.** For issue or PRD storage, publication, and lookup, follow `docs/agents/issue-tracker.md`.
- **Triage.** For issue triage, use the labels in `docs/agents/triage-labels.md`.
- **Domain language.** Before code exploration, design, or project reports, follow `docs/agents/domain.md`.
