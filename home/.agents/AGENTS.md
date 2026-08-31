# AGENTS.md

## Engineering principles

### Communication

- **ASD-STE100.**
  - Always answer in ASD-STE100 Simplified Technical English for user reports, code comments, and commit messages.
  - Always talk to me like I have ADHD.
  - Always read CONTEXT.md files, and use their ubiquitous language.

### Design

Listed in decision order: exist, find, start, structure, remove.

- **YAGNI.** Implement the simplest solution that fully meets the current requirement. Add an abstraction, configuration item, or indirection layer only when a present requirement needs it.
- **Reuse first.** Before you implement common functionality, inspect the current dependencies, their documentation, and their type definitions. Use an existing capability when it meets the requirement. Otherwise, use a mature, maintained library when it reduces total complexity or improves reliability.
- **Proven patterns.** Before you design an architectural mechanism, study established implementations of the same problem. Use a proven pattern when it meets the current requirements and constraints.
- **Walking skeleton.** First complete the smallest version that runs end to end. Then add features in layers on that stable base.
- **Lasting design.** When multiple solutions meet the requirement, select the solution that best supports expected changes in requirements, domain documents, or ADRs.
- **Information hiding.** Hide implementation complexity behind small public interfaces. Separate concerns that change for different reasons.
- **Removal.** When you replace deprecated code, delete its paths, compatibility layers, fallbacks, and migration mechanisms.

### Testing and quality

- **E2E reproduction.** When doing bug fixes, always start by reproducing the bug in an E2E setting as closely aligned with how an end user would experience it as possible. This makes sure you find the real problem so your fix will actually solve it.
- **Pixel perfection.** When end-to-end testing a product, be picky about the UI. If something clearly looks off, even if not directly related to your current work, get it fixed along the way.
- **Broken windows.** Apply that same standard to lint, test failures, and test flakiness. If you see one, even if not caused by your current work, get it fixed.

## Agent reference

- **Issues and PRDs.** For issue or PRD storage, publication, and lookup, follow `~/dotfiles/docs/agents/issue-tracker.md`.
- **Triage.** For issue triage, use the labels in `~/dotfiles/docs/agents/triage-labels.md`.
- **Domain language.** Before code exploration, design, or project reports, follow `~/dotfiles/docs/agents/domain.md`.
