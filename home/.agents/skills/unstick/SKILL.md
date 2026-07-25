---
name: unstick
description: Break out of a stuck loop when the same approach is failing repeatedly. Use when the agent is stuck, going in circles, repeating the same failed strategy, or when the user says "you're stuck", "try something different", "think outside the box", "fresh eyes", "unstick", or invokes /unstick.
---

# Unstick

A structured protocol for breaking out of a stuck state. "Stuck" means: the same approach has been attempted 2+ times without progress, the same error persists, or no measurable forward movement has occurred despite effort. Acknowledging the problem and trying harder in the same direction is not unstick — it is the failure mode this skill prevents.

## Phase 0 — Acknowledge and stop

Before doing anything else, stop the current approach. Do not make one more attempt in the same direction.

State explicitly:

- **What was the goal?** One sentence.
- **What was tried?** List each distinct attempt (not variations of the same idea).
- **What was the outcome of each?** Concrete result — error message, wrong output, no change.
- **What is the actual blocker?** Not "it doesn't work" — the specific mechanism that prevents progress.

If the blocker cannot be stated in one sentence, the understanding of the problem is insufficient. Go back and build understanding before attempting solutions.

Completion criterion: the blocker is stated as a specific, falsifiable claim — not a vague description of failure.

## Phase 1 — Challenge assumptions

Every stuck state hides at least one assumption that is either wrong or unnecessarily constraining.

List every assumption underlying the attempts so far. For each one:

- Is this actually required, or was it inherited from the first approach?
- What would change if this constraint were removed?
- Is there evidence for this constraint, or just habit?

Common false constraints:

- "Must use this library / framework / pattern" — when alternatives exist.
- "Must modify this file" — when the fix might belong elsewhere.
- "Must solve this sub-problem first" — when the sub-problem might be bypassed.
- "The API works this way" — when the docs or actual behavior differ.
- "This is the only way to achieve X" — when X can be reframed.

Completion criterion: at least one assumption has been identified as questionable or wrong, and its removal opens a different approach.

## Phase 2 — Generate categorically different approaches

Produce at least 3 approaches that are **structurally different** from what was tried — not minor variations.

Techniques for generating them:

1. **Inverse**: if the approach was "add X", try "remove Y". If it was "make it more specific", try "make it more general".
2. **Different layer**: if the fix was attempted in business logic, try configuration, infrastructure, data shape, or caller. If in the frontend, try the backend, and vice versa.
3. **Different abstraction level**: zoom in (lower-level primitive) or zoom out (higher-level orchestration).
4. **Different actor**: what if the user / caller / consumer handled this instead? What if a different component owned the responsibility?
5. **Different representation**: different data structure, different encoding, different protocol, different file format.
6. **Bypass entirely**: can the problem be avoided? Can the requirement be relaxed? Can the failing path be circumvented?
7. **Analogous solution**: has a similar problem been solved in this codebase or in the ecosystem? Search for it.

For each approach, state:

- What it is (one sentence).
- Why it is categorically different from what was tried.
- What the first concrete step would be.
- What could go wrong (and how to detect that early).

**Show the list to the user before proceeding.** They may instantly recognize which approach is best — or rule one out for domain reasons.

Completion criterion: at least 3 structurally different approaches exist, each with a concrete first step.

## Phase 3 — Commit and execute

Pick the most promising approach. The key constraint: it must be **categorically different** from the failed attempts. If it shares the same core mechanism, it is not different enough — go back to Phase 2.

State the commitment:

- **Approach chosen:** [which one and why]
- **First step:** [the concrete action]
- **Early exit condition:** [what signal within the first few minutes would indicate this approach is also wrong]

Execute the first step. If the early exit condition triggers, stop and pick the next approach from the list — do not keep pushing.

Completion criterion: a categorically different approach has been started, with a clear early exit condition.

## Phase 4 — Verify progress or escalate

After executing the new approach:

- Has measurable progress been made? (Different error, partial success, new information)
- Or is the same wall being hit from a different angle?

If progress: continue normally. The stuck state is resolved.

If no progress after a genuine attempt: pick the next approach from Phase 2's list. If all approaches have been exhausted, **stop and escalate to the user** with:

- The original goal
- All approaches tried and why each failed
- The specific blocker that remains
- A concrete question: what information, access, or decision would unblock this?

Do not loop silently. Escalation is a valid and expected outcome — it is better than wasting time.

## Anti-patterns

These are what this skill prevents. If caught doing any of these, return to Phase 0:

- **Polishing the same approach.** Renaming variables, reordering lines, adding comments around the same logic — this is not a new approach.
- **Hope-based debugging.** "Maybe if I just try once more..." without a reason to expect a different result.
- **Vague next steps.** "I'll look into other options" without naming the option.
- **Expanding scope to avoid the blocker.** Working on adjacent things while the core problem remains unsolved.
- **Asking the user without doing the work.** Escalation is valid, but only after Phase 0-3 have been genuinely executed.
