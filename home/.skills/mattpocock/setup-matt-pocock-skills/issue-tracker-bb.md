# Issue tracker: bb Tasks

Issues and specs for this repo live as tasks in the bb Tasks plugin. Use the `bb` CLI for all operations. The Tasks plugin must be installed and running (`bb tasks status`; install with `bb plugin install tasks`).

**Project: `<PREFIX>`** — the bb Tasks project this repo's issues live in. Find prefixes with `bb tasks project list`. Pass `--project <PREFIX>` on every command; inside a bb thread of the linked bb project, `BB_PROJECT_ID` already selects it and the flag can be dropped.

## Conventions

- **Create a task**: `bb tasks create --project <PREFIX> --title "..." --description "<markdown>"`. Use `--description-file <path>` for multi-line bodies. Add repeatable `--label <name>` and `--parent <key>` for subtasks.
- **Read a task**: `bb tasks show <key> --json` — returns the task, its resolved `labels`, `subtasks`, `attachments`, `comments` (each with `authorName` and `body`), and attached `taskThreads`. Fetch result files with `bb tasks attachment get <attachment-id> --out <path>`.
- **List tasks**: `bb tasks list --project <PREFIX> --json` with optional `--status`, `--priority`, `--label`, `--search` filters. Paginate with `--limit 1-500` and the opaque `--cursor` from the JSON output; keep the same filters, and restart without the cursor after any task mutation.
- **Comment on a task**: `bb tasks comment <key> --body "<markdown>"` (use `--body-file <path>` for multi-line bodies).
- **Apply / remove labels**: `bb tasks update <key> --add-label "..."` / `--remove-label "..."`. If the label doesn't exist yet: `bb tasks label create --project <PREFIX> --name "..."`.
- **Close**: `bb tasks update <key> --status done`. Decline with `--status canceled`; reopen with `--status todo`.

Statuses: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `canceled`. Priorities: `urgent`, `high`, `medium`, `low`, `none`. New tasks start at `backlog`.

**Triage roles are labels; the status field carries lifecycle.** The label strings equal the canonical role names (see `triage-labels.md`):

- **needs-triage**: create with the `needs-triage` label; leave the status at `backlog`.
- **needs-info**: apply the `needs-info` label.
- **ready-for-agent / ready-for-human**: apply the label and set `--status todo`.
- **wontfix**: apply the label and set `--status canceled`.
- An agent claiming a `ready-for-agent` task sets `--status in_progress`, works it, then `--status in_review` when ready for review. `bb tasks dispatch <key>` hands the task to a new agent thread directly.

## Pull requests as a triage surface

**PRs as a request surface: no.** bb Tasks holds no pull requests; leave this flag off. (The `/triage` skill reads this flag.)

## When a skill says "publish to the issue tracker"

Create a bb task in project `<PREFIX>`.

## When a skill says "fetch the relevant ticket"

Run `bb tasks show <key> --json`. The user will normally pass the task key (e.g. `SRE-12`) directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single task with **child** tasks as tickets.

- **Map**: a task labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body in its description. `bb tasks create --project <PREFIX> --label wayfinder:map`. To edit the body, read the current description from `bb tasks show <key> --json`, apply the change, and write it back with `bb tasks update <key> --description-file <path>`.
- **Child ticket**: a task with `--parent <map-key>` and label `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`), with the question in its description.
- **Blocking**: a `Blocked by: <KEY>, <KEY>` line at the top of the child's description (bb Tasks has no native dependencies). A ticket is unblocked when every listed task is `done`.
- **Frontier query**: `bb tasks list --project <PREFIX> --json`, keep the tasks whose `parentTaskId` is the map's, that are still open (`backlog`/`todo`), that have no open blocker, and that aren't `in_progress`; first in list order wins.
- **Claim**: `bb tasks update <key> --status in_progress`, the session's first write.
- **Resolve**: `bb tasks comment <key> --body "<answer>"`, then `bb tasks update <key> --status done`, then append a context pointer (gist + link) to the map's Decisions-so-far.
