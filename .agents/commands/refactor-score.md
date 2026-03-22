---
description: (xriu) Score refactor priority file by file with concrete reasoning
---

Analyze the requested codebase scope and assess whether each file needs refactoring.

## Scoring scale

- **1-3**: strong as-is, little to no refactor value
- **4-5**: minor cleanup would help
- **6-7**: meaningful refactor opportunities
- **8-9**: high refactor priority
- **10**: urgent refactor due to serious complexity, maintainability, or correctness risk

## What to evaluate

Score each file based on:
- readability
- complexity
- cohesion
- duplication
- naming clarity
- maintainability
- testability
- obvious risk of bugs or regressions

## Process

1. Review files within the requested scope.
2. Judge each file on current quality, not idealized standards.
3. Separate mild cleanup suggestions from true refactor needs.
4. Prioritize the highest-value refactors.

## Output format

```md
Summary
- <overall health of the reviewed scope>
- <highest-priority refactor area>

File scores
1. `<path>` — <score>/10
   - Needs refactor: <yes|maybe|no>
   - Why: <specific reason>
   - Best next step: <smallest high-value improvement>

2. ...

Top priorities
- <file / module>: <why it matters>
- <file / module>: <why it matters>

Notes
- <patterns repeated across multiple files>
```

Guardrails:
- Be specific and evidence-based.
- Do not give every file the same middle score.
- Prefer short, concrete reasoning over vague criticism.
- If a file is fine, say so clearly.
