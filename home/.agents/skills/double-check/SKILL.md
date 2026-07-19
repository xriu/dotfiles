---
name: double-check
description: Double-check an implementation with fresh eyes for bugs, errors, unnecessary complexity, and pre-existing issues. Use after writing or reviewing code when the user asks for a careful second pass, fresh-eyes review, or implementation double-check.
disable-model-invocation: true
---

Review the implementation again as if you did not write it. Treat correctness, clarity, and long-term maintenance as the goal—not confirmation of the first pass.

## Process

### 1. Establish the review scope

Identify the newly changed code, its callers, related data types, tests, configuration, and relevant documentation. Use the user’s arguments as the starting scope, then expand it wherever control flow or contracts require. Inspect the actual diff and repository status before forming conclusions.

Completion criterion: every changed file and every directly relevant dependency, test, and contract is listed mentally or in notes before edits begin.

### 2. Read before editing

Read all relevant code in full enough to trace the behavior end to end. Follow inputs through validation, transformation, persistence, side effects, and returned results. Check both the normal path and failure paths, including:

- empty, missing, malformed, duplicated, and boundary inputs;
- error handling, cleanup, retries, cancellation, and partial failure;
- state transitions, ordering, concurrency, and repeated calls;
- compatibility with existing callers, formats, and platform assumptions;
- tests that should fail if the suspected issue is real.

Question every line: remove unused parameters, dead code, unnecessary branches, speculative abstractions, and complexity that does not serve a required behavior. Do not preserve a shortcut merely because it is already present. Distinguish pre-existing defects from regressions, but address both when the fix is within scope and safe.

Completion criterion: each relevant behavior has been traced to its implementation and at least one verification path; no edit is made from a skim or isolated snippet.

### 3. Fix the smallest complete set of issues

Fix every concrete issue found, including issues in existing code that the review exposes. Prefer the smallest change that restores a clear invariant or removes unnecessary code. Preserve established project conventions. Add or update a regression test when the behavior is testable and the repository has an appropriate test seam.

Do not hide unused values with underscore prefixes, comments, or defensive code that cannot be reached. Do not add speculative features, abstractions, or broad refactors.

Completion criterion: every finding is either fixed or explicitly determined to be outside safe scope; no known correctness, clarity, or unnecessary-complexity issue remains in the reviewed area.

### 4. Verify the result

Run focused tests and checks for the changed behavior, then the broader relevant suite when practical. Check diagnostics, lint/type errors, and the final diff. Re-read the changed hunks after verification to catch mistakes introduced by the fixes.

Completion criterion: the requested behavior is verified, relevant tests/checks pass or their failures are explained, and the final diff contains only intentional changes.

## Reporting

If any issues were found and fixed:

- list each issue and the fix, including pre-existing issues addressed;
- mention the meaningful verification performed;
- end exactly with: `Fixed [N] issue(s). Ready for another review.`

If zero issues were found:

- describe the code, dependencies, edge cases, and checks examined;
- mention the meaningful verification performed;
- end exactly with: `No issues found.`

Never claim a clean review without reading the relevant code and tracing the behavior first.
