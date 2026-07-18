---
name: work-plan
description: >-
  Guides you from concept to issues. Use when you want to plan a feature, fix a bug, or make any change that needs structured planning before implementation.
hidden: true
disable-model-invocation: true
---

# Work Plan

**Leading words:** _anchor_ (the change description), _gate_ (transition criteria), _skeleton_ (typed architecture).

**Pass `auto` as the first argument** to use self-driving grilling mode (auto-selects recommended options without asking).

## The workflow

If this change spans more than one agent session and the way isn't clear yet, use **`/wayfinder`** to chart a map first.

```
Step 1: Anchor the change
Step 2: Grill (interactive or auto)
Step 3: Requirements
Step 4: Prototype (if needed)
Step 5: PRD
Step 6: Types
Step 7: Issues
```

**Resuming:** If you've already completed steps, say "I'm at step X" to skip ahead.

## Step 1: Anchor the change

Write a one-paragraph description of what you're building or fixing. This _anchor_ holds the entire workflow together.

- **For features:** Describe the feature, who it's for, and what problem it solves.
- **For bugs:** Describe the expected behavior, actual behavior, and how to reproduce it.

**Gate:** You can state the change in one paragraph that a non-technical stakeholder would understand.

## Step 2: Grill with docs

**If `auto` was passed:** Run **`/grill-with-docs-auto`**.
**Otherwise:** Run **`/grill-with-docs`**.

**Gate:** Every major question has been answered or explicitly deferred. You have a `CONTEXT.md` and at least one ADR. If the grilling reveals this spans many sessions, pivot to **`/wayfinder`** instead. If you're uncertain about domain terms or architectural choices, you're not done.

**Next:** Say "/make-requirements-great" when the _gate_ is met.

## Step 3: Make requirements great

Run **`/make-requirements-great`** in **Author mode**.

**Gate:** Requirements pass the 18 characteristics. Open questions are resolved or explicitly deferred with owner assignment.

**Next:** Say "/to-prd" when the _gate_ is met.

## Step 4: Prototype (if needed)

**Can you settle every question in conversation?** If yes, skip to Step 5.

If a question needs a runnable answer, run **`/prototype`** and use **`/handoff`** to bridge context.

**Gate:** All design questions that needed code answers have been answered.

**Next:** Say "/to-prd" when the _gate_ is met.

## Step 5: To PRD

Run **`/to-prd`**.

**Gate:** PRD is complete with all sections filled. Scope is clear. Success criteria are measurable.

**Next:** Say "/docs-to-types" when the _gate_ is met.

## Step 6: Docs to types

Run **`/docs-to-types`** to build the typed _skeleton_ (domain types, seams, adapters, error families, dependency rules). Does not implement business behavior.

**Gate:** Typed architecture compiles. Domain types reflect CONTEXT.md glossary. Seams match ADRs.

**Next:** Say "/to-issues" when the _gate_ is met.

## Step 7: To issues

Run **`/to-issues`**.

**Gate:** Every issue is small enough to implement in one session. Acceptance criteria are clear. Dependencies are mapped.

**Next:** Run **`/work-build`** for each issue, passing the PRD and the single issue.

## Context hygiene

- Keep all steps in **one unbroken context window** — don't use `/compact` (which summarizes in place) until after `/to-issues`
- If you approach the **smart zone** (~120k tokens) before `/to-issues`, use **`/handoff`** instead to bridge to a fresh session (preserves full context)
