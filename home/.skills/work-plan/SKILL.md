---
name: work-plan
description: >-
  Guides you from concept to issues. Use when you want to plan a feature, fix a bug, or make any change that needs structured planning before implementation.
disable-model-invocation: true
---

# Work Plan

**Leading words:** _anchor_ (the change description), _gate_ (transition criteria), _skeleton_ (typed architecture).

## The workflow

If this change spans more than one agent session and the way isn't clear yet, use **`/wayfinder`** to chart a map first.

**Precondition:** Steps 5 and 7 publish to the project issue tracker — run **`/setup-matt-pocock-skills`** first if the tracker and triage labels aren't configured.

```
Step 1: Anchor the change
Step 2: Grill
Step 3: Requirements
Step 4: Prototype (if needed)
Step 5: Spec (PRD)
Step 6: Types (if needed)
Step 7: Tickets
```

**Resuming:** If you've already completed steps, say "I'm at step X" to skip ahead.

## Step 1: Anchor the change

Write a one-paragraph description of what you're building or fixing. This _anchor_ holds the entire workflow together.

- **For features:** Describe the feature, who it's for, and what problem it solves.
- **For bugs:** Describe the expected behavior, actual behavior, and how to reproduce it.

**Gate:** You can state the change in one paragraph that a non-technical stakeholder would understand.

## Step 2: Grill with docs

Run **`/grill-with-docs`**.

**Branch — does a question need a runnable answer?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through **`/prototype`** bridged by **`/handoff`** in both directions, then return to grilling.

**Gate:** Every major question has been answered or explicitly deferred. You have a `CONTEXT.md` and at least one ADR. If the grilling reveals this spans many sessions, pivot to **`/wayfinder`** instead. If you're uncertain about domain terms or architectural choices, you're not done.

**Next:** Say "/make-requirements-great" when the _gate_ is met.

## Step 3: Make requirements great

Run **`/make-requirements-great`** in **Author mode**.

**Gate:** Requirements pass the 18 characteristics. Open questions are resolved or explicitly deferred with owner assignment.

**Next:** Say "/to-spec" when the _gate_ is met.

## Step 4: Prototype (if needed)

This step consolidates any **`/prototype`** detours started in Step 2. If you skipped them because every question settled in conversation, skip to Step 5.

**Gate:** All design questions that needed code answers have been answered.

**Next:** Say "/to-spec" when the _gate_ is met.

## Step 5: To spec (PRD)

Run **`/to-spec`** — it synthesizes the conversation into a spec (the document you may know as a PRD) and publishes it to the tracker with the `ready-for-agent` label.

**Gate:** Spec is complete with all sections filled. Scope is clear. Success criteria are measurable.

**Next:** Say "/docs-to-types" when the _gate_ is met.

## Step 6: Docs to types (if the change needs a typed skeleton)

Run **`/docs-to-types`** to build the typed _skeleton_ (domain types, seams, adapters, error families, dependency rules). Does not implement business behavior. Skip this step when the change is small or a single TDD slice — `docs-to-types` is not for the first slice.

**Gate:** Typed architecture compiles. Domain types reflect CONTEXT.md glossary. Seams match ADRs.

**Next:** Say "/to-tickets" when the _gate_ is met (or if you skipped this step).

## Step 7: To tickets

Run **`/to-tickets`** — breaks the spec into tracer-bullet tickets, each declaring its blocking edges, and publishes them to the tracker.

**Gate:** Every ticket is small enough to implement in one session. Acceptance criteria are clear. Blocking edges are mapped.

**Next:** Run **`/work-build`** for each ticket, passing the spec and the single ticket.

## Context hygiene

- Keep all steps in **one unbroken context window** — don't use `/compact` (which summarizes in place) until after `/to-tickets`
- If you approach the **smart zone** (~120k tokens) before `/to-tickets`, use **`/handoff`** instead to bridge to a fresh session (preserves full context)
