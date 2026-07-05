---
name: work-build
description: >-
  Implements a single issue from a PRD. Use after /work-plan when you have a specific issue to build.
disable-model-invocation: true
---

# Work Build

**Leading words:** _prefactor_ (make the change easy), _implement_ (build the solution).

## The workflow

1. **Prefactor:** Look for opportunities to prefactor the code to make the change easy. "Make the change easy, then make the easy change." Extract functions, rename for clarity, add missing abstractions in the area you'll touch.
2. **Implement:** Run **`/implement`** with the PRD and the issue (drives **`/tdd`** internally, closes with **`/code-review`**)
3. **Commit**

**Gate:** The issue is implemented. Tests pass. Code review is clean.

## Context hygiene

- Start a **fresh session** for each issue
- Work from the PRD and the single issue
- Do not carry context from previous issues
