---
name: refactor-safe
description: Refactor code safely in small, verifiable steps while preserving external behavior. Use when user says "refactor", "clean up this code", "simplify", "improve readability", "remove dead code", or asks to restructure without changing functionality.
disable-model-invocation: true
---

# Safe Refactoring

Refactor the requested code while preserving external behavior.

## Goals

Improve one or more of without changing functionality:

- Readability and clarity
- Maintainability and testability
- Performance in clearly identified hot paths
- Removal of dead or redundant code

## Scope

- Focus on the requested files or symbols.
- If no scope is provided, prefer recently modified code first.
- Expand only when a nearby dependency must change to keep the refactor coherent.

## Process

1. Define the exact refactor target and why it needs work.
2. Inspect current behavior, call sites, dependencies, and constraints.
3. Check whether tests already cover the behavior.
4. If coverage is missing for risky behavior, add or update tests first.
5. Plan the refactor as small, low-risk steps.
6. Make focused changes only; avoid mixing refactors with unrelated feature work.
7. Re-run relevant verification after changes.
8. Summarize what improved and any residual risks.

## Preferred refactor types

- Rename unclear symbols
- Extract cohesive helper functions
- Remove dead code
- Collapse unnecessary wrappers or layers
- Reduce duplication
- Simplify conditionals and control flow
- Improve module boundaries

## Avoid

- Speculative abstractions
- Pattern-driven rewrites without clear payoff
- Broad architecture changes unless explicitly requested
- Changing public interfaces unless asked
- Replacing clear code with clever code

## Output format

```
Target
- <files / symbols reviewed>
- Goal: <why this refactor is worth doing>

Plan
1. <small step>
2. <small step>

Changes made
- <concrete change>

Behavior preserved
- <what intentionally stayed the same>

Verification
- <tests / build / checks run and result>

Risks / follow-ups
- <remaining concern or "None significant">
```

## Guardrails

- Preserve behavior first.
- Prefer the smallest change set that clearly improves the code.
- If the code does not clearly benefit from refactoring, say so.
