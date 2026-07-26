---
name: learnings
description: Persist learnings into AGENTS.md or docs/ reference files. Use when the user says "capture this", "save this learning", "remember this", "add this to agents", or when work surfaces a reusable insight worth persisting.
---

**Capture** the learning into the right destination so future sessions benefit.

## Steps

### 1. Classify

Read the learning and decide its type:

| Type                   | Destination                 | When                                                        |
| ---------------------- | --------------------------- | ----------------------------------------------------------- |
| Agent behavioral rule  | `AGENTS.md`                 | Changes how the agent behaves in future sessions            |
| Agent convention       | `docs/agents/<topic>.md`    | A procedure or reference the agent consults on demand       |
| Research finding       | `docs/findings/<topic>.md`  | Discovered facts, API behaviors, patterns worth remembering |
| Architectural decision | `docs/adr/<NNNN>-<slug>.md` | Design choice with alternatives considered                  |

**Completion criterion**: One destination selected, destination path resolved.

### 2. Deduplicate

Read the target file (if it exists). Search for content that already covers this learning.

- If a near-duplicate exists: skip the write, report the existing entry.
- If partial overlap: update the existing entry to incorporate the new detail.
- If no overlap: proceed to step 3.

**Completion criterion**: Either an existing entry covers it, or confirmed the target file has no overlapping content.

### 3. Write

Write the learning in the format for its destination:

- **`AGENTS.md`** — 1-3 sentences, direct imperative tone, placed under the most relevant existing `## Section` (create a new one if none fits).
- **`docs/agents/<topic>.md`** — focused reference doc on one topic; use the topic as the filename slug.
- **`docs/findings/<topic>.md`** — `# Topic` heading, cited findings with sources; keep facts separate from opinions.
- **`docs/adr/<NNNN>-<slug>.md`** — next sequential number (`ls docs/adr/`), standard ADR: Context, Considered options, Decision, Consequences.

**Completion criterion**: File written and content verified.

### 4. Report

Tell the user:

- What was saved (one-line summary)
- Where it went (file path)
- Whether it was new or updated an existing entry
