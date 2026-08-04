# AGENTS.md

## Engineering principles

- **ASD-STE100.** Report to me, write all reports, code comments, and commit messages in ASD-STE100 Simplified Technical English.
- **YAGNI.** Implement the simplest solution that fully meets the current requirement. Add an abstraction, configuration item, or indirection layer only when a present requirement needs it.
- **Walking skeleton.** First complete the smallest version that runs end-to-end. Then add features in layers on that stable, usable base.
- **Delete deprecated code outright.** Remove deprecated paths and their compatibility layers, fallbacks, and migration mechanisms.
- **Reuse first.** Before you implement common functionality, inspect the current dependencies, their documentation, and their type definitions. Use an existing capability when it meets the requirement. Otherwise, use a mature, maintained library when it reduces total complexity or improves reliability.
- **Proven patterns.** Before you design a new architectural mechanism, study established implementations of the same problem. Use a proven pattern when it fits the current requirements and constraints.
- **Lasting design.** Among solutions that meet the current requirement, select the one that best supports expected changes recorded in requirements, domain documents, or ADRs.
- **Information hiding.** Hide implementation complexity behind small public interfaces. Separate concerns that change for different reasons.

## Agent reference

- For issue or PRD work, follow `docs/agents/issue-tracker.md`.
- For issue triage, use the labels in `docs/agents/triage-labels.md`.
- Before code exploration or design work, follow `docs/agents/domain.md`.
