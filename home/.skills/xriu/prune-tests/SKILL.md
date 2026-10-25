---
name: prune-tests
description: Read-only test audit. Uses /test-audit to rank the repo's tests by usefulness and return one plan that deletes at least 20% of them while coverage stays within 2% of baseline. Executes only after you approve.
disable-model-invocation: true
---

/poteto-mode use /test-audit to find the least useful tests in my repo. Measure coverage first so we have a baseline. Come back with a high-level plan that removes at least 20% of the tests while keeping code coverage within 2% of that baseline, ranked worst test first, with the reason each test is junk.
