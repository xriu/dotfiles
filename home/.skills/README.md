# Skills index

All 102 skills in this directory, with a one-line description and a score.

**What the score means.** The score is my estimate of the value of the skill in
this Pi setup, from 1 to 10. It is not a quality grade. A well-written skill
loses points when another installed skill, `AGENTS.md`, or Ponytail already
covers the same ground. A narrow skill keeps its points when nothing else covers
it. The scores for the `poteto/` set match `poteto/README.md`.

Every skill is mounted at `~/.agents/skills/`, and `~/.pi/skills` points there.
`bb-cli` is the only skill in that directory that does not live here.

## Read this first: what the review found

- **Five skills write a PR body**: `pr-brief`, `pr-full`, `pr-update`,
  `mattpocock/pr`, `humanlayer/visual-pr`. Keep `pr-update` for the flow and
  `mattpocock/pr` for the body shape. Merge or delete the other three.
- **Two frontend skills share one description**: `frontend-design` and
  `frontend-distinct`. The routing is ambiguous. `frontend-design` is a 55-line
  condensation of the 292-line `frontend-distinct`.
- **Two design-grilling skills share one idea**: `grilling-design` and
  `launchmetrics/lm-grilling-design` differ only in variant count and in reading
  `lm-brand`.
- **Two shells**: `all` and `dmmulroy/bro` carry one line of instruction each.
- **Five broken pointers**: `code-clean` names `/no-tropes`, `/ui-only`, and
  `/ui-system`. `pr-update` names `/no-tropes`, `/pr-triage`, and `/pr-ready`.
  None of these skills exist anywhere in this setup.
- **Hidden prerequisites**: `mattpocock/code-review`, `triage`, `to-spec`,
  `to-tickets`, and `wayfinder` read files that
  `setup-matt-pocock-skills` must create in the target repo first.
  `openclaw/test-audit` expects `scripts/check-changed.mjs` and
  `scripts/run-vitest.mjs` in the target repo.
- **Cost**: the 102 descriptions total 28.7 KB. Only 17 skills can fire without
  an explicit call, so only 4.4 KB of that text sits in the context window on
  every session. `agent-browser` alone spends 1 KB of it.
- **No duplicate bodies, no missing frontmatter.** Every skill has a `name` and
  a `description`. 85 of 102 are user-invoked only.

## Standalone and single-purpose skills (30)

These are the 25 skills at the root of this directory, plus the three small
collections: `humanlayer/` (2), `launchmetrics/` (2), and `openclaw/` (1).

| Skill                    | Score / 10 | Why                                                                                                                                                      |
| ------------------------ | ---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rewrite`                |        9.0 | Compresses a rough prompt into a precise one with standard terms. The example table and the "do not invent" rule make it safe.                           |
| `tldraw-offline`         |        8.5 | An operator manual for the local tldraw HTTP API: endpoints, a `tq` helper, shape format, recipes, durable UI rules. Needs the app running.              |
| `agent-browser`          |        8.5 | Browser and Electron automation through a Rust CLI with CDP. A real capability, not advice. Loses points for a 1 KB description.                         |
| `frontend-interfaces`    |        8.5 | Fifteen named UI details with exact CSS: concentric radius, tabular numbers, no `transition: all`. Changes pixels.                                       |
| `openclaw/test-audit`    |        8.5 | Authoring gate plus a junk-pattern catalogue and a retention bar. Expects two helper scripts in the target repo.                                         |
| `done`                   |        8.0 | Commits and pushes the branch, and refuses to merge or rebase. Small, guarded, one job.                                                                  |
| `pr-stacked`             |        8.0 | Handles stacked and multi-base PRs: update bottom-up, keep the bases identical. Nothing else covers it.                                                  |
| `replicant`              |        8.0 | Source-first repo research into read-only clones. Keeps clones clean and cites SHA and paths.                                                            |
| `launchmetrics/lm-brand` |        8.0 | A real brand kit: hex codes, exact font strings, CSS custom properties. Verifiable. Only useful at Launchmetrics, and it is 529 lines.                   |
| `audit-codebase`         |        7.5 | Evidence-cited simplicity scorecard with a 0-3 rubric, confidence levels, and a coverage threshold. Overlaps `improve`.                                  |
| `discuss`                |        7.5 | Planning interview with a recommended answer per question and a hard stop before implementation. `grilling` is stronger.                                 |
| `frontend-distinct`      |        7.5 | The long anti-default design guide, including the "three AI looks" calibration and a self-critique pass. Its description is a copy of `frontend-design`. |
| `grilling-design`        |        7.5 | Runs grilling with five live prototype variants and a draggable picker. Concrete for 18 lines.                                                           |
| `improve`                |        7.5 | Read-only audit that hands plans to another agent. Parallel audit phases. Overlaps `audit-codebase`.                                                     |
| `pre-mortem`             |        7.5 | Assumes failure at 6 months and runs one deep-dive agent per failure reason. The MANDATORY trigger block is too eager.                                   |
| `typesafe-ai`            |        7.5 | Points at live docs and cookbooks for TypeScript AI judgments instead of freezing API detail. Untested here.                                             |
| `work-plan`              |        7.5 | Ten gated planning steps with named gates and a skeleton. Heavily overlaps the `mattpocock` main flow.                                                   |
| `humanlayer/show-me`     |        7.5 | Picks the smallest visual that makes the point: pseudocode, call tree, component tree, Mermaid, or one HTML file.                                        |
| `docs-to-types`          |        7.0 | Turns glossary and ADR output into types, seams, and adapter slots, with an ambiguity gate and no business logic.                                        |
| `pr-update`              |        7.0 | Opens or refreshes a PR and preserves existing media. Three of its pointers are broken.                                                                  |
| `humanlayer/visual-pr`   |        6.5 | PR description with visual evidence. Now a subset of `mattpocock/pr`.                                                                                    |
| `code-clean`             |        6.5 | KISS/DRY polish pass that refuses to run the test suite. Names three skills that do not exist.                                                           |
| `code-refactor`          |        6.5 | Small-step refactor with a scope boundary and an avoid list. Mostly covered by `laziness-protocol`.                                                      |
| `work-build`             |        6.5 | Wrapper that prefactors, then calls `/implement`, then commits. Thin, and it depends on three other skills.                                              |
| `lm-grilling-design`     |        6.5 | `grilling-design` with three variants and a read of `lm-brand` each round. Near-duplicate.                                                               |
| `code-review-bugs`       |        6.0 | Fresh-eyes bug pass with a fixed closing sentence. Overlaps `mattpocock/code-review`.                                                                    |
| `pr-full`                |        6.0 | PR description with checks and metrics. Same job as `pr-brief` and `pr-update`.                                                                          |
| `pr-brief`               |        5.5 | Commit-type icon changelog. Same job as `pr-full` and `pr-update`.                                                                                       |
| `frontend-design`        |        5.5 | The condensed twin of `frontend-distinct`, with the same description. Routing conflict.                                                                  |
| `all`                    |        3.0 | Not a skill. A canned reply: "yes, all recommendations".                                                                                                 |

## `atlassian/` (14)

Dense operational docs for the `twg` CLI, which is installed at
`~/.local/bin/twg`. All of them share the same strengths: batch reads instead of
call loops, a stated stop condition, and safety rules for writes. All of them
repeat the same "CLI launcher fallback" block.

| Skill                          | Score / 10 | Why                                                                                                                               |
| ------------------------------ | ---------: | --------------------------------------------------------------------------------------------------------------------------------- |
| `twg`                          |        9.0 | The router. Bounded evidence loop, batch-read discipline, and a rule to stop after five same-subcommand calls.                    |
| `twg-jira`                     |        8.5 | Jira semantics and safe writes: read before write, use `customfield_*` IDs, and ask the user for required transition fields.      |
| `twg-confluence`               |        8.5 | Separates user authorization from the `--yes` preflight. The best write-safety text in the set.                                   |
| `twg-responsibility-routing`   |        8.5 | Splits owner from maintainer, expert, approver, and escalation. Refuses to promote a contributor into an approver.                |
| `twg-status-rollups`           |        8.5 | Routing matrix over `pr-tree`, `org-tree`, `work-tree`, and `workitem-tree`, with a call budget of 2-4.                           |
| `twg-jira-resolve-merged-work` |        8.0 | Finds stale Jira work with merged PRs and stops at a dry-run plan. Never transitions medium-confidence items.                     |
| `twg-space-creation`           |        8.0 | Builds or clones a whole space from evidence, with confirmation gates and one-branch verification.                                |
| `twg-context-discovery`        |        8.0 | Bounded fan-out for dependency maps and catch-ups. Names the cost of widening after resolution.                                   |
| `twg-engineering-work`         |        8.0 | PR queues, stale reviews, contributors, and hot areas. Carries recipe cards and an anti-pattern list.                             |
| `twg-operational-health`       |        8.0 | Incidents, handoffs, and PIRs, with a rule to separate a working theory from a confirmed problem.                                 |
| `twg-code-review`              |        7.5 | Adds company context to a code review and freezes the snapshot first. Only on request.                                            |
| `twg-agentic-search`           |        7.5 | Iterative Rovo search that separates confirmed facts from interpretation and gaps.                                                |
| `twg-artifacts`                |        7.0 | Publishes a local file as an Atlassian Artifact, with content read before description. Narrow.                                    |
| `twg-bench-lite`               |        6.5 | A/B harness for paid graph context against free MCP context. Needs a portable runner and a fresh Codex thread, so it rots easily. |

## `mattpocock/` (27)

The largest coherent set here. The skills compose through a stated main flow,
and most of them name the skill they hand off to. Weak points: the two-line
wrappers, and a hard dependency on `setup-matt-pocock-skills`.

| Skill                           | Score / 10 | Why                                                                                                                           |
| ------------------------------- | ---------: | ----------------------------------------------------------------------------------------------------------------------------- |
| `writing-for-agents`            |        9.5 | The best text here on writing for agents: context pointers, the two loads, the information ladder, leading words, and no-ops. |
| `diagnosing-bugs`               |        9.5 | Builds a tight red-capable feedback loop before any theory. Ten loop recipes. Refuses Phase 2 without a loop.                 |
| `code-review`                   |        9.0 | Two-axis review in parallel sub-agents, with a Fowler smell baseline and a rule never to rerank across axes.                  |
| `codebase-design`               |        9.0 | Deep-module vocabulary with the deletion test, seam discipline, and explicit rejected framings.                               |
| `grilling`                      |        9.0 | The interview primitive: a design tree, rounds, a frontier, and facts as the agent's job.                                     |
| `tdd`                           |        9.0 | Red-green with pre-agreed seams, plus three named anti-patterns and vertical slicing.                                         |
| `wayfinder`                     |        9.0 | Plans work too large for one session as decision tickets, with fog of war, claim-by-assign, and one ticket per session.       |
| `wizard`                        |        9.0 | Generates a bash wizard from a template library with staged progress, hidden secret entry, and static verification.           |
| `ask-matt`                      |        8.5 | The router over the whole flow. Long, but it is the index that makes the set usable.                                          |
| `domain-modeling`               |        8.5 | Keeps `GLOSSARY.md` clean and limits ADRs with a three-part test.                                                             |
| `improve-codebase-architecture` |        8.5 | Scopes by commit hot spots, reports deepening candidates as HTML, then grills the pick.                                       |
| `retro`                         |        8.5 | Turns session pain into guardrails. Correctly puts coding standards on the review agent, not the implementation agent.        |
| `to-tickets`                    |        8.5 | Tracer-bullet tickets with blocking edges, plus expand-contract for wide refactors.                                           |
| `triage`                        |        8.5 | Issue state machine that verifies the claim before grilling and labels every AI comment.                                      |
| `prototype`                     |        8.5 | Splits logic from UI prototyping and captures the result as a primary source on a throwaway branch.                           |
| `pr`                            |        8.0 | The PR body shape: smallest visual, before and after evidence, door type, blast radius.                                       |
| `to-questionnaire`              |        8.0 | Grills the send, not the subject, then writes the document for the recipient.                                                 |
| `to-spec`                       |        8.0 | Synthesises a spec with no interview, and settles the test seams first.                                                       |
| `teach`                         |        8.0 | A stateful teaching workspace: mission, lessons, learning records, and reference documents. Heavy setup.                      |
| `implement-spec`                |        8.0 | Runs a ticket task graph on an integration branch with worktree implementers and merger subagents.                            |
| `setup-matt-pocock-skills`      |        8.0 | Writes the per-repo config the set needs, with careful rules for which instruction file to edit.                              |
| `handoff`                       |        7.5 | Writes a portable handoff document to the OS temp directory and redacts secrets.                                              |
| `research`                      |        7.5 | Twelve lines: background agent, primary sources, cited Markdown file.                                                         |
| `wait-what`                     |        7.0 | Re-pitches the last message in Simplified Technical English and glossary terms. Tiny and useful.                              |
| `implement`                     |        6.5 | Eight lines that call `/tdd` and then `/code-review`. Thin by design, but it earns little on its own.                         |
| `grill-with-docs`               |        5.5 | A two-line wrapper that calls `grilling` and `domain-modeling`.                                                               |
| `grill-me`                      |        5.0 | A two-line wrapper that calls `grilling`.                                                                                     |

## `poteto/` (26)

Principle cards, 16-40 lines each, all conditional ("apply when X"). Every card
names its own test, and most cross-reference a sibling. The scores match
`poteto/README.md`.

| Skill                                      | Score / 10 | Why                                                                         |
| ------------------------------------------ | ---------: | --------------------------------------------------------------------------- |
| `prove-it-works`                           |       10.0 | Check the real result before saying the work is done.                       |
| `build-the-lever`                          |        9.7 | Make a small tool or check that repeats or proves the work.                 |
| `fix-root-causes`                          |        9.5 | Find and fix the cause, not the symptom.                                    |
| `model-the-domain`                         |        9.4 | Use data structures to prevent scattered rules and invalid states.          |
| `test-behavior-not-implementation`         |        9.3 | Test what users observe, not internal details.                              |
| `foundational-thinking`                    |        9.2 | Choose the data shape before writing the logic.                             |
| `guard-the-context-window`                 |        9.1 | Keep large outputs out of the main session.                                 |
| `boundary-discipline`                      |        9.0 | Put checks at external boundaries and keep core logic simple.               |
| `type-system-discipline`                   |        8.9 | Use types to prevent invalid states and unsafe assumptions.                 |
| `make-operations-idempotent`               |        8.8 | Make commands safe to retry after a crash.                                  |
| `sequence-verifiable-units`                |        8.8 | Break large tasks into steps with checks.                                   |
| `encode-lessons-in-structure`              |        8.7 | Turn repeated guidance into a test, lint, or other guardrail.               |
| `minimize-reader-load`                     |        8.5 | Reduce indirection and hidden state.                                        |
| `separate-before-serializing-shared-state` |        8.5 | Remove shared writes before adding locks.                                   |
| `correct`                                  |        8.4 | Turn repeated agent mistakes into enforceable checks.                       |
| `explain-the-number`                       |        8.3 | Check what a metric measures before trusting it.                            |
| `benchmark-checklist`                      |        8.2 | Strong measurement checks. Some commands need macOS alternatives.           |
| `laziness-protocol`                        |        8.2 | Good rule, but it overlaps with your Ponytail instructions.                 |
| `subtract-before-you-add`                  |        8.1 | Remove dead weight before adding more.                                      |
| `attack-the-premise`                       |        7.9 | High value when repeated fixes fail for the same reason.                    |
| `never-block-on-the-human`                 |        7.9 | Helps with reversible choices. Keep safety limits for irreversible actions. |
| `outcome-oriented-execution`               |        7.7 | Useful for planned rewrites and migrations.                                 |
| `migrate-callers-then-delete-legacy-apis`  |        7.7 | Good migration rule, but it applies to a narrower set of work.              |
| `redesign-from-first-principles`           |        7.6 | Helps when a new requirement changes the design.                            |
| `experience-first`                         |        7.4 | Useful for product and UX choices.                                          |
| `exhaust-the-design-space`                 |        7.2 | Encourages prototypes, but it can add work to simple decisions.             |

## `dmmulroy/` (5)

TypeScript and Effect standards. The two large ones carry `Complete when:`
criteria and push detail into `references/`. The best-engineered skills here for
conditional loading.

| Skill                   | Score / 10 | Why                                                                                           |
| ----------------------- | ---------: | --------------------------------------------------------------------------------------------- |
| `coding-standards`      |        9.0 | Effect and TypeScript rules with a decision priority and 1.6 KB of branch-pointed references. |
| `effect-service-design` |        8.5 | A service-versus-value test with a deletion test, and separate design and audit branches.     |
| `install-anti-slop`     |        8.0 | Installs a vendored oxlint rule set, with a separate update path and preserved local edits.   |
| `prelude`               |        7.5 | Bootstraps one ambient `prelude.ts` from an inventory of duplicates. Narrow, TypeScript only. |
| `bro`                   |        6.0 | One line: restate the last message without jargon.                                            |

## Cleanup list

1. Delete `pr-brief`, `pr-full`, and `humanlayer/visual-pr`. Keep `pr-update`
   for the flow and `mattpocock/pr` for the body shape.
2. Delete `frontend-design` or `frontend-distinct`. Fix the shared description
   either way.
3. Delete `lm-grilling-design`, or make `grilling-design` read `lm-brand` when
   the repo is a Launchmetrics repo.
4. Delete `all`. Move `dmmulroy/bro` into `wait-what`, which covers the same
   ground.
5. Repair the five broken pointers in `code-clean` and `pr-update`.
6. Move `docs-to-types` and `work-build` behind `work-plan`, which already names
   them, so they stop competing for automatic selection.
