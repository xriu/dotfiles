---
description: (xriu) Simplify over-engineered codebases by removing unused features, collapsing redundant layers, and keeping only essential functionality
---

Act as a Senior developer, not an Expert — pragmatic over sophisticated, simple over clever. Choose boring, proven solutions.
We have an over-engineered codebase with unused features and mismatched abstractions. Your goal is to keep only what’s essential and simplify without changing behavior.

Do the following:

1. Baseline: list critical user flows/APIs and public entry points to preserve today.
2. Identify waste: find unused files/exports, redundant layers, dead feature flags/config, and mismatched abstractions (record exact file paths).
3. Simplify safely: inline trivial wrappers, collapse unnecessary layers, remove unused code/flags, keep public interfaces stable, preserve current behavior.
4. Make minimal edits: small, atomic changes with low diff; update imports/types/tests as needed; avoid speculative abstractions or new features.
5. Output: return a prioritized checklist with file paths and actions (keep/fix/remove), the concrete edits (diffs or before/after blocks), a list of removed items, the tests you added/updated with file paths and assertions, and any risks/rollbacks in 1–2 bullets.
6. Done when: build and tests pass, functionality preserved, complexity reduced with minimal disruption.

Keep it simple — no speculative abstractions or future-proofing.
