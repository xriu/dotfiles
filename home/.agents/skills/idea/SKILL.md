---
name: idea
description: >-
  Orchestrates the full idea-to-ship workflow. Use when the user has a new idea, feature, or project and wants guided step-by-step progress. Triggers on "I have an idea", "let's build", "new feature", "start a project", or when the user wants to follow the complete workflow from concept to code.
disable-model-invocation: true
---

# Idea to Ship

**Leading words:** _anchor_ (the idea paragraph), _gate_ (transition criteria), _legwork_ (each step's work).

**Pass `auto` as the first argument** to use self-driving grilling mode (auto-selects recommended options without asking).

## The workflow

```
Step 1: Anchor the idea
Step 2: Grill (interactive or auto)
Step 3: Requirements
Step 4: Prototype (if needed)
Step 5: PRD
Step 6: Types
Step 7: Issues
Step 8: Pre-implementation + Implement
```

**Resuming:** If you've already completed steps, say "I'm at step X" to skip ahead.

## Step 1: Anchor the idea

Write a one-paragraph description of your idea. This _anchor_ holds the entire workflow together.

**Gate:** You can state the idea in one paragraph that a non-technical stakeholder would understand.

## Step 2: Grill with docs

**If `auto` was passed:** Run **`/grill-with-docs-auto`**.
**Otherwise:** Run **`/grill-with-docs`**.

**Gate:** Every major question has been answered or explicitly deferred. You have a `CONTEXT.md` and at least one ADR. If you're uncertain about domain terms or architectural choices, you're not done.

**Next:** Say "ready for requirements" when the _gate_ is met.

## Step 3: Make requirements great

Run **`/make-requirements-great`** in **Author mode**.

**Gate:** Requirements pass the 18 characteristics. Open questions are resolved or explicitly deferred with owner assignment.

**Next:** Say "ready for PRD" when the _gate_ is met.

## Step 4: Prototype (if needed)

**Can you settle every question in conversation?** If yes, skip to Step 5.

If a question needs a runnable answer, run **`/prototype`** and use **`/handoff`** to bridge context.

**Gate:** All design questions that needed code answers have been answered.

**Next:** Say "ready for PRD" when the _gate_ is met.

## Step 5: To PRD

Run **`/to-prd`**.

**Gate:** PRD is complete with all sections filled. Scope is clear. Success criteria are measurable.

**Next:** Say "ready for types" when the _gate_ is met.

## Step 6: Docs to types

Run **`/docs-to-types`** to build the typed _skeleton_ (domain types, seams, adapters, error families, dependency rules). Does not implement business behavior.

**Gate:** Typed architecture compiles. Domain types reflect CONTEXT.md glossary. Seams match ADRs.

**Next:** Say "ready for issues" when the _gate_ is met.

## Step 7: To issues

Run **`/to-issues`**.

**Gate:** Every issue is small enough to implement in one session. Acceptance criteria are clear. Dependencies are mapped.

**Next:** For each issue, start a **fresh session** and run **`/implement`** with the PRD and the single issue.

## Step 8: Implement

For each issue:
1. Start a fresh session
2. **Pre-implementation:** Look for opportunities to prefactor the code to make the change easy. "Make the change easy, then make the easy change." Extract functions, rename for clarity, add missing abstractions in the area you'll touch.
3. Run **`/implement`** (drives **`/tdd`** internally, closes with **`/code-review`**)
4. Commit when done

**Gate:** All issues are implemented. Tests pass. Code review is clean. PRD is fully delivered.

## Context hygiene

- Keep Steps 1–7 in **one unbroken context window** — don't compact or clear until after `/to-issues`
- Each `/implement` (Step 8) starts fresh, working from the issue
- If you approach the **smart zone** (~120k tokens) before `/to-issues`, use **`/handoff`** to continue in a fresh thread
