---
description: (xriu) Review documentation and surface key insights, gaps, and stale guidance
---

Review the requested documentation and produce a concise, high-signal summary.

## Objectives

- reduce cognitive load
- preserve important technical details
- identify missing, outdated, ambiguous, or contradictory guidance
- highlight what a reader should do next

## Process

1. Identify the audience for the docs if it is obvious (user, contributor, maintainer, operator).
2. Extract the most important facts, workflows, commands, constraints, and caveats.
3. Remove repetition and low-value prose.
4. Flag documentation problems:
   - unclear instructions
   - missing prerequisites
   - stale references
   - inconsistent terminology
   - missing examples
5. Suggest the smallest edits that would materially improve the docs.

## Output format

```md
Summary
- <2-5 bullet summary of the most important points>

Key details
- <commands / workflows / constraints>
- <important caveats>

Gaps and risks
1. <issue>
   - Why it matters: <impact>
   - Suggested fix: <smallest useful improvement>

Recommended next actions
- <what to read, change, or verify next>
```

Guardrails:
- Do not rewrite the docs unless asked.
- Be specific about what is missing or stale.
- Prefer actionable recommendations over generic style commentary.
