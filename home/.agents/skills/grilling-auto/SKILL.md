---
name: grilling-auto
description: Grill a plan, decision, or idea without the user. Use when the user is absent, says "grill this yourself", "don't ask me questions", "grill and report", or wants a stress-test as a written report instead of an interview.
disable-model-invocation: true
---

Grill the subject relentlessly, exactly as the **grilling** skill does, but the user is absent. Do not ask the user anything. You answer every question yourself and report what survives.

Same mechanics as grilling: map the **design tree** (every decision branches into the decisions that hang off it), work it in **rounds**, and ask only the **frontier** — the questions whose prerequisites are already settled. Recompute the frontier after each round. The difference is who answers:

- **Find the answer yourself.** Treat every frontier question as a fact the environment holds. Dispatch sub-agents to read code, docs, data, or research the web. When evidence settles a question, settle it — no candidates needed, the fact is the answer.
- **When you must choose, generate up to 3 candidate answers and pick the best.** No evidence, genuine judgment call: enumerate at most 3 plausible answers, weigh them against the evidence you do have, pick the strongest. 3 is a cap, not a quota — an obvious choice gets one or two. Log the question as **open** with your pick as the recommended answer and the assumption it creates. Then continue grilling down that branch under the assumption.
- **Never stall.** A question you cannot answer this round does not block the round. Only questions downstream of it inherit the assumption.

Each round:

1. Compute the frontier from what is already settled or assumed.
2. Answer the whole frontier with sub-agents and evidence, or mark it open with a recommendation.
3. Push the frontier outward and repeat until it is empty: every branch visited, nothing silently assumed.

When the frontier is empty, write the report:

```
## Verdict
<does the plan survive? one paragraph, blunt>

## Settled decisions
<decision — answer — evidence that settles it>

## Open questions
<question — candidates considered — your pick — assumption it creates — what fact would flip it>

## Fatal flaws
<decisions where the tree collapsed; empty if none>
```

Do not act on the outcome. The report is the deliverable; acting requires the absent user.
