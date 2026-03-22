---
description: (xriu) Generate Mermaid diagrams for code flow, architecture, or data lineage
---

Analyze the referenced code, feature, or project and produce a Mermaid diagram that helps a reader understand how data moves through the system.

## Goal

Show the important flow clearly, not exhaustively.

Choose the best diagram type:
- `flowchart` for request flow / architecture / control flow
- `sequenceDiagram` for actor interactions over time
- `graph LR` or `graph TD` for dependency or data lineage maps

## Process

1. Identify the main inputs, transformations, storage points, outputs, and external systems.
2. Ignore low-value implementation noise.
3. Group related nodes into logical subgraphs when useful.
4. Label edges with meaningful actions or data being passed.
5. Add a short written explanation after the diagram.

## Output format

```md
## Scope
- <what was analyzed>

## Mermaid Diagram
```mermaid
<diagram>
```

## Notes
- <key observation>
- <bottleneck / coupling / risk if relevant>
- <unknowns or assumptions>
```

## Diagram quality bar

- 6 to 15 nodes unless the user asked for full detail
- clear labels
- no unlabeled arrows when meaning matters
- prefer readable structure over completeness
- if there are multiple distinct flows, use two smaller diagrams instead of one messy one
