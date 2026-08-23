---
name: audit-codebase
description: Measure and report how well a design, pull request, module, service, refactor, or repository follows software-simplicity principles such as Single Responsibility, deep modules, single knowledge ownership, low change amplification, low caller burden, valid-state design, actionable failures, controlled scope, and evidence-based performance work. Use for architecture assessments, code reviews, maintainability audits, refactoring baselines, before-and-after comparisons, and engineering quality reports.
---

# Measure Software Simplicity

Assess simplicity with Goal-Question-Metric (GQM), repository evidence, and a calibrated scorecard. Treat measurements as decision support.

## Rules

- Define the assessment scope, baseline, and representative change scenarios before scoring.
- Cite evidence for every score and finding. Mark missing evidence as `Unknown`; never invent it.
- Use static metrics as warning signals, not verdicts. LOC, method count, complexity, coupling, or cohesion alone cannot prove a responsibility or design problem.
- Measure trends within the same system and comparable scope. Do not compare raw scores across unrelated projects.
- Separate measurement, interpretation, and recommendation. Do not change code unless the user separately requests implementation.
- Report in english.

## Workflow

### 1. Frame the assessment

Record:

- target artifact and revision or time window;
- included and excluded paths, components, and behaviors;
- intended behavior, constraints, and compatibility boundaries;
- assessment type: `diff`, `component`, `repository`, or `before-after`;
- three to five representative change scenarios for a component or repository assessment. A focused diff may use its single stated change;
- principles that are applicable, not applicable, or currently unmeasurable.

Choose scenarios from requirements, recent change history, incidents, or critical domain operations. Do not cherry-pick only easy changes.

### 2. Collect evidence

Prefer evidence in this order:

1. contracts, schemas, repository instructions, architecture records, and tests;
2. source structure, public interfaces, dependency direction, and call sites;
3. version history, co-change patterns, review history, and representative diffs;
4. runtime failures, incidents, benchmarks, and profiling data;
5. reviewer inference, explicitly labeled as inference.

Reference source as `path:line`, history by commit or PR, and runtime evidence by test, benchmark, or report name. For a large scope, disclose the sampling method and unsampled areas. Use existing repository analysis tools; do not add dependencies merely to manufacture a score.

### 3. Measure the principles

Use the following default GQM catalog. Adapt the measures when the domain has stronger evidence, but preserve the stated goal.

| Principle                 | Questions                                                                                                                       | Default measures                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Single Responsibility     | Does the unit own one cohesive policy, body of knowledge, or invariant set? What independent actors or policies make it change? | Distinct change-driver count; unrelated co-change evidence; cohesion and dependency evidence. Never infer SRP from size alone.                                                                                                                               |
| Deep Modules              | Does substantial capability sit behind a small interface? What must each caller know?                                           | Interface Burden Profile `(public operations, exposed types, mandatory preconditions, exposed failure categories)`; pass-through ratio `delegating public operations / public operations`; caller knowledge count.                                           |
| Single Knowledge Owner    | Is each design fact or business rule defined in one authoritative place?                                                        | Duplicate Rule Count `sum(max(0, independent implementations - 1))`; rule-owner map; Change Amplification `(production files, modules)` per representative scenario, reported as values plus median and range.                                               |
| Design Boundaries Twice   | Were material boundaries compared using credible alternatives and explicit trade-offs?                                          | Alternative coverage `material decisions with at least two credible options / material decisions`; trade-off coverage for cohesion, interface size, dependencies, testability, failure containment, compatibility, and measured performance.                 |
| Pull Complexity Downward  | Is shared mechanical complexity handled once below callers while business policy stays above?                                   | Repeated caller-policy count; call sites duplicating retry, ordering, mapping, formatting, or recovery; caller branches and preconditions removed or introduced.                                                                                             |
| Valid States and Failures | Are invalid states prevented, invariants enforced early, and exposed failures actionable?                                       | Invalid construction paths; invariant enforcement coverage `invariants enforced at a boundary / scoped invariants`; actionable failure ratio `failures with a documented caller action / exposed failure categories`; preserved-cause and recovery evidence. |
| Names and Contracts       | Can developers find ownership and understand intent without reconstructing it?                                                  | Conflicting-term count; undocumented public contracts or invariants; optional time-to-locate or comprehension probe, with sample size disclosed.                                                                                                             |
| Conventions and Scope     | Does the change follow established patterns and avoid speculative or unrelated work?                                            | Unexplained convention deviations; directly related changed-hunk ratio; speculative abstractions without a current consumer; unrelated cleanup count.                                                                                                        |

Do not force every metric onto every assessment. Use `N/A` when a principle truly does not apply and `Unknown` when it applies but evidence is insufficient.

### 4. Score with evidence

Score each applicable principle from `0` to `3`:

- `0 — Violated`: evidence shows a clear violation with material system impact.
- `1 — Weak`: behavior works, but ownership, interface burden, duplication, or change cost is materially poor.
- `2 — Acceptable`: responsibility and ownership are clear enough, burden is controlled, and relevant behavior is verified.
- `3 — Strong`: complexity is well hidden, changes are isolated, and multiple evidence types confirm the result.

Keep confidence separate from score:

- `High`: direct code plus history, test, or runtime evidence.
- `Medium`: direct code evidence but limited historical or runtime confirmation.
- `Low`: partial sampling or mostly inference.

Calculate the overall score only from numeric principle scores and always show evidence coverage:

```text
Overall score = sum(applicable numeric scores) / count(numeric scores)
Evidence coverage = count(numeric scores) / count(applicable principles)
```

Do not let an average hide a critical violation. When a pass/fail decision is requested and no project policy exists, use this default gate:

- no principle scores `0`;
- Single Responsibility, Single Knowledge Owner, and Valid States and Failures score at least `2` when applicable;
- overall score is at least `2.2/3`;
- evidence coverage is at least `80%`.

Otherwise, report the score profile without declaring pass or fail.

### 5. Interpret and recommend

- Trace symptoms to knowledge ownership, responsibility, or boundary causes.
- Rank findings by system-wide change cost, cognitive load, failure risk, then remediation effort.
- Recommend the smallest coherent improvement; avoid speculative frameworks and unrelated rewrites.
- Define an observable validation criterion for every recommendation.
- For before-after analysis, reuse the same scope, scenarios, formulas, and evidence classes. Explain any unavoidable measurement change.
- Calibrate future targets from the first baseline and repository trend; do not present default thresholds as scientific laws.

## Required report format

Produce a self-contained report with these sections:

```markdown
# Software Simplicity Assessment

## Executive Summary

- Scope and assessment type
- Overall score and evidence coverage
- Gate result, only when requested
- Top strengths and risks

## Scope and Method

- Revision/time window, paths, exclusions, scenarios, sampling, and limitations

## Scorecard

| Principle | Score | Measured values | Evidence | Confidence | Finding |

## Change Scenario Results

| Scenario | Files | Modules | Duplicated rules | Caller burden | Notes |

## Findings and Recommendations

### [Priority] Finding title

- Observation
- Evidence
- System impact
- Smallest recommendation
- Validation criterion

## Validation and Limitations

- Commands, tests, analyses, missing evidence, sampled areas, and residual uncertainty
```

Omit empty optional sections, but never omit scope, scorecard, evidence, or limitations. Use exact measured values beside scores so readers can challenge the judgment. Never claim improvement or compliance without comparable evidence.
