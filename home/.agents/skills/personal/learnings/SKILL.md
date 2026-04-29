---
name: learnings
description: Review the current session and code changes for anything worth codifying in AGENTS.md or README.md. Use before committing/opening a PR, or when the user asks "anything learned?", "anything to note?", "should we update AGENTS.md?", "update the docs with what we learned", or similar.
---

# Learnings

Final pre-commit sweep: did we learn anything in this session that the next person (or agent) working in this repo will regret not having written down?

The bar is **high**. Most sessions produce nothing worth adding. That's fine. Saying "nothing worth adding" is a valid — and often correct — outcome. Do not invent findings to justify the skill.

## Step 1: Gather context

Run these in parallel:

- `git diff` (unstaged) and `git diff --cached` (staged) — what actually changed
- `git status` — new files, deleted files
- `git log --oneline -20` — recent commit style and scope
- Read `AGENTS.md` if it exists (project root, then `AGENTS.md`)
- Read `README.md` if it exists

Also re-read this session's conversation: what did the user correct you on? What did you stumble over? What non-obvious thing did you discover about the codebase?

## Step 2: Apply the bar

A candidate learning is worth codifying **only** if it meets at least one of these:

1. **Non-obvious gotcha** — something that cost real time this session and will cost real time next time. ("The build silently caches X, you have to nuke `.cache/` to actually re-run.")
2. **Convention the code doesn't self-document** — a pattern, naming rule, or structural choice that isn't visible from reading one file. ("Migrations must be written idempotent because they run on every boot.")
3. **User correction that is reusable** — the user pushed back on an approach in a way that applies beyond this task. ("Don't add error boundaries around server components in this repo — they swallow Next.js's own error UI.")
4. **External dependency or env requirement** — something a fresh clone wouldn't work without. ("Requires `STRIPE_WEBHOOK_SECRET` in `.env.local` or checkout tests fail silently.")
5. **Architectural decision with a reason** — a choice that looks arbitrary without the why. ("We hand-roll the queue instead of using Sidekiq because Rails 8 solid_queue handles our volume and removes the Redis dep.")

**Reject** candidates that are:

- A summary of what this PR does (that's what the commit message is for)
- Restating what the code already makes obvious
- Generic best practices ("use TypeScript strict mode") that aren't specific to this project
- One-off debugging fixes that won't recur
- Anything already covered by existing AGENTS.md / README.md content — check before proposing

## Step 3: Decide the target file

- **AGENTS.md** — instructions _to agents_. How to work in this repo. Commands, conventions, gotchas, "don't do X." Audience: the next AI agent in this repo.
- **README.md** — instructions _to humans_. Setup, architecture overview, deployment. Audience: a developer cloning the repo.

Overlap exists. When in doubt: is this something I'd want auto-loaded into every future session? → AGENTS.md. Is this something a human needs during onboarding? → README.md.

If the project has no AGENTS.md and the learning belongs there, propose creating one — but only if there's at least one solid entry to put in it. Don't create an empty scaffold.

## Step 4: Propose, don't commit

Present findings like this:

```
## Session learnings

**Worth adding to AGENTS.md:**
- [concrete proposed line or bullet, written in the voice/style of the existing file]
  Why: [one line — what it prevents or explains]

**Worth adding to README.md:**
- [same format]

**Considered but rejected:**
- [thing that almost made the cut] — [one-line reason it didn't]
```

Then ask: "Want me to apply these edits?"

Do **not** edit AGENTS.md or README.md without explicit approval. These files are load-bearing — a bad edit poisons every future session in the repo.

If nothing clears the bar:

```
## Session learnings

Nothing worth codifying. [One sentence on why — e.g., "All changes were straightforward feature work that the diff and commit message already explain."]
```

That's a complete, honest answer. Ship it and move on.
