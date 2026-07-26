---
name: capture-learning
description: Persist learnings into AGENTS.md or docs/ reference files. Use when the user says "capture this", "save this learning", "remember this", "add this to agents", or when work surfaces a reusable insight worth persisting.
disable-model-invocation: true
---

**Capture** the learning into the right destination so future sessions benefit.

## Steps

### 1. Classify

Read the learning and decide its type:

- **Agent rule** — changes how the agent behaves → `AGENTS.md`
- **Agent convention** — a procedure or reference the agent consults → `docs/agents/<topic>.md`
- **Research finding** — discovered facts, API behaviors, patterns → `docs/findings/<topic>.md`
- **Architectural decision** — design choice with alternatives considered → `docs/adr/<NNNN>-<slug>.md`

For full details on each destination and its format, read [`docs/agents/capture-learning.md`](docs/agents/capture-learning.md).

**Completion criterion**: One destination selected, destination path resolved.

### 2. Deduplicate

Read the target file (if it exists). Search for content that already covers this learning.

- If a near-duplicate exists: skip the write, report the existing entry.
- If partial overlap: update the existing entry to incorporate the new detail.
- If no overlap: proceed to step 3.

**Completion criterion**: Either an existing entry covers it, or confirmed the target file has no overlapping content.

### 3. Write

Write the learning to the resolved destination, in the format described by the reference doc.

- `AGENTS.md` rules: 1-3 concise sentences, imperative tone, placed under the most relevant existing `## Section` (or create a new one if none fits).
- `docs/agents/`: focused reference doc on one topic.
- `docs/findings/`: cited findings with sources.
- `docs/adr/`: next sequential number, standard ADR format.

**Completion criterion**: File written and content verified.

### 4. Report

Tell the user:

- What was saved (one-line summary)
- Where it went (file path)
- Whether it was new or updated an existing entry
