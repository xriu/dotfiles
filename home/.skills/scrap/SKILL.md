---
name: scrap
description: Scrap the first draft and rewrite it as the second draft — smaller, simpler, and behavior-complete.
disable-model-invocation: true
---

# Scrap

Use this skill when the code works but shows the work: hacks, dead ends, and a shape that only fits the problem now that you understand it. You know the requirement, the edge cases, and the traps. The current code is a first draft. Write the second draft.

A second draft is smaller and simpler than the first, and keeps all of its behavior. New code with the same size and the same friction is not a second draft. Do the pass now: every line written on the wrong shape hardens it.

## Workflow

1. **Harvest what you know.** Write a short list before you delete anything:
   - the behaviors that must survive (`input → output`, user-visible result);
   - every edge case and bug fix you found the hard way;
   - the invariants and decisions the current code encodes.

   Read the scrap code line by line. This pass is the last chance to learn from it. Read the tests and the diff history to fill gaps.

   Done when the list covers every behavior a user or caller can observe.

2. **State the shape in one breath.** Say what the thing does and what its interface is, in two or three sentences. If you cannot, go back to step 1. You do not know enough to scrap.

3. **Write the second draft.** Start from the requirement and the list. Do not start from the old code. Drop the layers that only exist to repair the first draft's mistakes.

4. **Delete the first draft in the same change.** No parallel path, no compatibility layer, no commented-out block, no `old` suffix. Fix every caller.

5. **Prove it.** Each item on the list has a test that describes behavior, and it passes. Remove tests that only restate the old implementation, and tests that die with it.

6. **Report the delta.** Old vs new: files, lines, public surface. Name each behavior change explicitly. A second draft changes the code, not the contract, unless the user asked for a contract change.

Done when the old code is gone, the new code is smaller, and every harvested behavior has a passing test.

## Guardrails

- Scrap only code you understand. When step 1 is mostly unknowns, the real task is to learn, not to rewrite.
- Keep behavior changes separate. List them, get agreement, then do them.
- Scrap a friction you can point at. Keep code that is already tight.
- One module or one coherent flow per pass. Keep the diff reviewable.
