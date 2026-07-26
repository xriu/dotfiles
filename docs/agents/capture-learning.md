# Capture Learning: Destinations

Where captured learnings go, by type.

## Destination map

| Type                   | Destination                 | Format                                              | When                                                         |
| ---------------------- | --------------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Agent behavioral rule  | `AGENTS.md`                 | Add to existing section, or create new `## Section` | Changes how the agent behaves in future sessions             |
| Agent convention       | `docs/agents/<topic>.md`    | Free-form reference doc                             | Detailed procedure or reference the agent consults on demand |
| Research finding       | `docs/findings/<topic>.md`  | Cited findings with sources                         | Discovered facts, API behaviors, patterns worth remembering  |
| Architectural decision | `docs/adr/<NNNN>-<slug>.md` | ADR template (see existing ADRs)                    | Design decision with alternatives considered                 |

## AGENTS.md sections

Current sections (add to the most relevant, or create a new one):

- **Communication** — how the agent talks to the user
- **Plan before coding** — planning and verification discipline
- **Simplicity** — minimal-change principles
- **Surgical changes** — edit discipline
- **Verification loop** — how the agent confirms work is done
- **Agent skills** — pointers to other agent-related docs

When adding a rule to AGENTS.md:

- Keep it concise (1-3 sentences)
- Match the existing tone (direct, imperative)
- Place it under the most relevant existing section
- If no section fits, create a new `## Section` heading

## docs/agents/ conventions

Files here describe how the agent should handle specific workflows or reference material. Examples:

- `issue-tracker.md` — how to use the local issue tracker
- `triage-labels.md` — label vocabulary
- `domain.md` — how to consume domain docs

When adding a new convention:

- Create `docs/agents/<topic>.md`
- Keep it focused on one topic
- Use the skill name as the filename slug

## docs/findings/ research

Files here capture discovered facts — API behaviors, library quirks, patterns, techniques. Should include sources or evidence.

When adding a finding:

- Create `docs/findings/<topic>.md`
- Title with `# Topic` heading
- Cite sources (official docs, code links, specs)
- Keep findings separate from opinions or recommendations

## docs/adr/ decisions

Architectural Decision Records follow the format in existing ADRs:

- Context (what's the problem?)
- Considered options (what did we evaluate?)
- Decision (what did we choose and why?)
- Consequences (what follows?)

Number sequentially: check `ls docs/adr/` for the next number.
