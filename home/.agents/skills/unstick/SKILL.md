---
name: unstick
description: Break out of a stuck loop — the same approach failing repeatedly. Use when the agent is stuck or going in circles, or when the user says "stuck", "try something different", "fresh eyes", "unstick", or invokes /unstick.
---

# Unstick

"Stuck" means: the same approach has been attempted 2+ times without progress, the same error persists, or no measurable forward movement has occurred despite effort. Trying harder in the same direction is the failure mode this skill prevents.

## Phase 0 — Acknowledge and stop

Stop. Do not make one more attempt in the same direction.

State:
- **Goal** — one sentence.
- **Attempts** — each distinct attempt (not variations of the same idea) with its concrete outcome (error, wrong output, no change).
- **Blocker** — the specific mechanism that prevents progress, in one sentence.

If the blocker cannot be stated in one sentence, understanding is insufficient. Build understanding before attempting solutions.

Completion criterion: the blocker is stated as a specific, falsifiable claim.

## Phase 1 — Challenge assumptions

List every assumption underlying the attempts. For each:
- Is this required, or inherited from the first approach?
- What changes if this constraint is removed?
- Is there evidence, or just habit?

Common false constraints: must-use-this-library, must-modify-this-file, must-solve-subproblem-first, the-API-works-this-way, this-is-the-only-way.

Completion criterion: at least one assumption identified as questionable or wrong, and its removal opens a different approach.

## Phase 2 — Generate categorically different approaches

Produce at least 3 approaches structurally different from what was tried — not minor variations. Generate by shifting one axis at a time:

- **Inverse** — add→remove, specific→general, enable→disable.
- **Shift layer** — business logic→configuration, frontend→backend, data shape→caller.
- **Shift ownership** — a different component, the user, the caller.
- **Bypass** — avoid the problem, relax the requirement, circumvent the failing path.
- **Analogous** — has a similar problem been solved in this codebase or ecosystem?

For each approach: what it is (one sentence), why it is categorically different, first concrete step, early failure signal.

Show the list to the user before proceeding.

Completion criterion: at least 3 structurally different approaches, each with a concrete first step.

## Phase 3 — Commit and execute

Pick the most promising approach. If it shares the same core mechanism as the failed attempts, it is not different enough — return to Phase 2.

State:
- **Approach chosen** and why.
- **First step.**
- **Early exit condition** — what signal within the first few minutes indicates this is also wrong.

Execute the first step. If the early exit triggers, pick the next approach from the list.

Completion criterion: a categorically different approach has started, with a clear early exit condition.

## Phase 4 — Verify or escalate

After executing: has measurable progress been made (different error, partial success, new information)?

If yes: the stuck state is resolved. Continue.

If no: pick the next approach from Phase 2. If all are exhausted, escalate to the user with the Phase 0 artifact plus all approaches tried and why each failed.

Do not loop silently. Escalation is a valid outcome.
