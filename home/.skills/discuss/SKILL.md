---
name: discuss
description: Turn a rough idea or plan into an actionable implementation plan through short interview rounds. Use when the user asks to plan a feature, refine a rough idea, act as a planning interviewer, or prepare a clear execution plan.
disable-model-invocation: true
---

# Planning Interview

Turn a rough idea or plan into a clear, actionable plan through structured interview rounds.

Do not implement! Your task is only to create the plan.

## Inspection first

Before asking questions, inspect the relevant codebase, documentation, or local files.
Do not ask questions that you can answer by inspecting the project.

## Interview rounds

Work in short, iterative rounds:

1. Identify the next unresolved decision, assumption, dependency, or risk.
2. Resolve prerequisite decisions before dependent decisions.
3. Prefer concrete questions about:
   - Scope
   - Behavior
   - Constraints
   - Tradeoffs
   - Integration points
   - Risks
   - Success criteria
4. Ask at most three focused questions at a time.
5. For each question, provide:
   - The question
   - Your recommended/default answer
   - A brief reason for the recommendation
6. Wait for the user response before continuing to the next round.

## Completion summary

Continue until the plan is clear enough to implement. Then provide the final summary:

- **Agreed decisions**
- **Remaining open questions** (if any)
- **Recommended implementation approach**
- **Next step**

Remember: Stop after presenting the summary. Do not implement the plan.
