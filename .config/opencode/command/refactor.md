---
description: Refactor code
agent: build
---

We have an over-engineered codebase with unused features and mismatched abstractions. Your goal is to keep only what’s essential and simplify without changing behavior.

Do the following:

1. Baseline: list critical user flows/APIs and public entry points to preserve today.
2. Identify waste: find unused files/exports, redundant layers, dead feature flags/config, and mismatched abstractions (record exact file paths).
3. Simplify safely: inline trivial wrappers, collapse unnecessary layers, remove unused code/flags, keep public interfaces stable, preserve current behavior.
4. Make minimal edits: small, atomic changes with low diff; update imports/types/tests as needed; avoid speculative abstractions or new features.
5. Tests: add 1–2 focused tests per critical path (unit for core logic, light integration for one happy-path); add a regression test when removing an abstraction.
6. Output: return a prioritized checklist with file paths and actions (keep/fix/remove), the concrete edits (diffs or before/after blocks), a list of removed items, the tests you added/updated with file paths and assertions, and any risks/rollbacks in 1–2 bullets.
7. Done when: build and tests pass, functionality preserved, complexity reduced with minimal disruption.

Keep it simple — no speculative abstractions or future-proofing.
