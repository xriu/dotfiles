# AGENTS.md

## Communication

- Respond in English, regardless of the user's language.
- Keep responses minimal, concise, direct, and free of unnecessary filler.
- Use no emojis in commits, issues, PR comments, or code.
- Answer the user's question before editing files or running implementation commands.
- When responding to user feedback or analysis, state whether you agree or disagree before describing changes.

## Plan before coding

Make assumptions explicit. When requirements have multiple plausible interpretations, list the alternatives and ask for a decision. Surface tradeoffs and prefer the simplest approach that satisfies the request.

For multi-step work, state a short plan with a verification criterion for each step:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Define success as an observable result. Examples:

- Validation → tests cover invalid inputs and pass.
- Bug fix → a regression test reproduces the failure and passes after the fix.
- Refactor → the relevant tests pass before and after the change.

Prefer test-first development when the inputs and outputs are clear. Use the project’s `tdd` skill when appropriate.

## Simplicity

Implement the minimum change that satisfies the request.

- Add no speculative features, abstractions, configurability, or unreachable-state handling.
- Match the existing style and keep unrelated code unchanged.
- Remove only imports, variables, or functions made unused by the current change.
- Mention unrelated dead code instead of removing it.

Before finalizing, ask: “Could this be substantially shorter without losing required behavior?” If yes, simplify it.

## Surgical changes

Every changed line must trace directly to the request or to a necessary consequence of the change. For existing files:

- Inspect the relevant code before editing.
- Make targeted edits and preserve adjacent comments, formatting, and behavior.
- Keep each concept in one authoritative location.

## Verification loop

Work toward the defined success criteria and verify them before reporting completion. Check that:

- The requested behavior is implemented.
- Tests or other relevant checks pass.
- Changes introduced no new diagnostics or unused code.
- Every modified file and meaningful verification result is reported.

## Agent skills

### Issue tracker

Issues and PRDs live as local Markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use this vocabulary by default: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

For multi-context projects, `CONTEXT-MAP.md` at the root points to per-context `CONTEXT.md` files. For single-context projects, use the root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
