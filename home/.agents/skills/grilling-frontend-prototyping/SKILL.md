---
name: grilling-frontend-prototyping
description: Converge on frontend visual design through concrete prototype variants and one-question-at-a-time verdicts. Use when the user wants to explore UI options, iterate on visual taste, or a wayfinder ticket names this skill.
disable-model-invocation: true
---

# Frontend grilling

**Pass `auto` as the first argument** to use self-driving grilling mode (auto-selects recommended options without asking).

Orchestrate `/grill-me` with the UI branch of `/prototype`. `/grill-me` owns the interview; `/prototype` owns prototype shape, routing, and switcher mechanics. This skill makes every grilling question visual.

## Process

1. **Frame one design question.** Find the nearest existing route or host page before creating a new prototype route. State the question, host, and assumption in the prototype. Completion criterion: one concrete question and one runnable host are documented.
2. **Make the round visual.** Build exactly 5 structurally different variants in one live, read-only prototype. Include the meaningful states and interactions needed to judge the question. Completion criterion: all 5 variants are runnable, named, switchable, and shareable; the variants differ in layout or information hierarchy, not merely colour or copy.
3. **Grill the design.** If `auto` was passed, run `/auto-grill` — it self-drives the full design tree against the prototype, offering five options (A/B/C/D/E) per question (matching the 5 variants) and auto-selecting the recommended one. Completion criterion: auto-grill has resolved every meaningful visual branch, state, and interaction.

   Otherwise, grill interactively: show the variants and ask exactly one decision question at a time, with a recommendation. Wait for the user's verdict before changing the prototype or advancing. Completion criterion: the user has selected a variant, a combination, or a concrete rejection, with the reason recorded.

4. **Descend the design tree.** If `auto`, this is resolved by `/auto-grill` in step 3. Otherwise, the grilling walks down the visual design tree, each verdict zooming in one level: the overall design, then component groups, then individual components — until the user has designed the entire feature in detail. Continue through states and interactions, making fresh variants for the current question rather than polishing an unselected option. Completion criterion: every meaningful visual branch, state, and interaction for the feature has a recorded verdict, or the user explicitly stops.
5. **Hand off the decision.** Surface the prototype URL and variant keys, summarize the winning decisions and reasons, and capture the full variant set as the prototype's primary source. If implementation is requested, fold only the validated design into production and keep prototype-only code out of the production path. Completion criterion: the handoff names the winner, rationale, unresolved items, and the disposition of prototype code.

Begin implementation or promotion only after `/grill-me` has received explicit confirmation of shared understanding.
