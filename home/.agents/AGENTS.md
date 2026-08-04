# AGENTS.md

## Engineering principles

- Only report to me in ASD-STE100 Simplified Technical English
- Do not aim to maintain backward compatibility. For deprecated code paths, remove them directly rather than retaining them through compatibility layers, fallback mechanisms, or migration plans.
- Under the premise of fully meeting current requirements, adopt the simplest possible implementation. Avoid introducing abstractions, configuration items, and indirect layers that lack a basis in actual needs.
- Build systems in a progressive, layered manner. First complete the minimal version that can run end-to-end, then gradually add features based on a stable, usable product. Do not replace an already usable product with immature complexity.
- Keep components modular and clearly delineate different responsibilities and concerns.
- When a mature, well-maintained library can reduce overall complexity or improve reliability, prioritize its use. Unless there is a clear reason, do not reimplement common functionality.
- Before implementing functionality yourself or adding new dependencies, first evaluate the capabilities of existing project dependencies. Consult relevant documentation and type definitions first—do not assume a library lacks the required capability without verification.
- Architectural decisions should focus on long-term evolution. Do not adopt stopgap solutions that only address the current issue and are expected to need replacement later.
- Before designing a solution, first study how mature products address similar problems. Prioritize proven patterns and conventions, and avoid designing a new scheme from scratch.

## Agent skills

### Issue tracker

Issues and PRDs live as local Markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use this vocabulary by default: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
