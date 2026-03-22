---
description: (xriu) Refactor code safely in small, verifiable steps
---

Refactor the requested code while preserving external behavior.

## Goals

Improve one or more of the following without changing functionality:
- readability
- maintainability
- testability
- performance in clearly identified hot paths
- removal of dead or redundant code

## Default scope

- Focus on the requested files or symbols.
- If no scope is provided, prefer recently modified code first.
- Expand only when a nearby dependency or shared utility must change to keep the refactor coherent.

## Process

1. Define the exact refactor target and why it needs work.
2. Inspect current behavior, call sites, dependencies, and constraints.
3. Check whether tests already cover the behavior.
4. If coverage is missing for risky behavior, add or update tests first.
5. Plan the refactor as small, low-risk steps.
6. Make focused changes only; avoid mixing refactors with unrelated feature work.
7. Re-run the relevant verification after changes.
8. Summarize what improved and any residual risks.

## Preferred refactor types

- rename unclear symbols
- extract cohesive helper functions
- remove dead code
- collapse unnecessary wrappers or layers
- reduce duplication
- simplify conditionals and control flow
- improve module boundaries

## Avoid

- speculative abstractions
- pattern-driven rewrites without clear payoff
- broad architecture changes unless explicitly requested
- changing public interfaces unless the user asked for it
- replacing clear code with clever code

## Output format

```md
Target
- <files / symbols reviewed>
- Goal: <why this refactor is worth doing>

Plan
1. <small step>
2. <small step>
3. <small step>

Changes made
- <concrete change>
- <concrete change>

Behavior preserved
- <what intentionally stayed the same>

Verification
- <tests / build / checks run>
- <result>

Risks / follow-ups
- <remaining concern or "None significant">
```

Guardrails:
- Preserve behavior first.
- Prefer the smallest change set that clearly improves the code.
- If the code does not clearly benefit from refactoring, say so.
