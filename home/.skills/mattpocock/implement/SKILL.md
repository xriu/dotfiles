---
name: implement
description: "Implement work from a spec or tickets."
disable-model-invocation: true
---

Implement the user's spec or tickets. Keep the change within the stated requirements.

## Steps

1. Read the spec or tickets and the relevant code. Record assumptions and observable acceptance criteria. Ask the user about gaps that block a correct implementation.
   **Ready when** each requirement has an observable outcome and no blocking ambiguity remains.

2. Implement in small slices that match the acceptance criteria. When a change needs tests, use `/tdd` and agree the test seams with the user before writing tests.
   **Done when** every acceptance criterion is implemented.

3. Run the repository's relevant focused tests and typechecks during work. Run the full test suite once after implementation. Use commands the repository defines.
   **Done when** relevant checks pass, or the final report names any that failed or could not run.

4. Compare the final diff with the acceptance criteria and repository conventions. Fix defects and remove unrelated changes.
   **Done when** every diff hunk supports a requirement or its validation.

Leave changes in the working tree. Commit only when the user asks.
