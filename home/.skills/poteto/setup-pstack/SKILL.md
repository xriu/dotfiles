---
name: setup-pstack
description: Configure pstack models and reasoning levels for the current harness.
disable-model-invocation: true
---

# Setup pstack

Write pstack's model settings, one model per role, where this harness reads them:

- **Cursor:** `~/.cursor/rules/pstack-models.mdc`, an always-applied rule.
- **Claude Code:** `~/.claude/rules/pstack-models.md`. Claude Code loads every file in `~/.claude/rules/` into each new session.
- **Codex, OpenCode, and other harnesses outside Pi:** `~/.agents/pstack-models.md`. These harnesses don't load it on their own, so pstack skills read this file when they pick a model.
- **Pi with the subagent-manager extension:** the manager's agent types under `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/subagent-manager/agents/`, plus trusted project overrides. `agent_spawn` takes no model or effort, and `pstack-models.md` does not configure Pi types. Use [Pi types and settings](#pi-types-and-settings) in place of steps 1–6.

"The settings file" below means the rule or `~/.agents/pstack-models.md` for your harness. In Claude Code, if that file is missing, read `~/.agents/pstack-models.md` instead, where older versions of this skill wrote it.

## Steps

### 1. Detect available models

Enumerate the model slugs you can pass to a subagent in this session (Cursor `Task`, Claude Code `Agent`, OpenCode `task`, Codex `spawn_agent`). That is the dependable source. If your harness also has a command that lists the user's models, prefer it for completeness (for example `opencode models` or `pi --list-models`). If you cannot detect any, ask the user to paste the slugs they have access to. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If the settings file already exists, read it and treat its `# budget` line and its role values as the current choices. Otherwise start from those defaults. A line whose role is not in step 5, such as `how critics`, is from a retired role. Drop it.

### 3. Budget, map, and confirm

**(a) Ask for a budget.** Prefer your structured-question tool (`AskQuestion` in Cursor, `AskUserQuestion` in Claude Code, `question` in OpenCode) over free text. Offer these four options with these exact labels, and name the current budget when the rule records one. With no rule, say that `large` matches the skill defaults.

- `unlimited — max reasoning`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

**(b) Apply it.** Build the working table from the skill defaults, and on a re-run keep any role you changed by family, list, or alias (`inherit-parent`, `auto`). `unlimited`, `large`, `medium`, and `small` set the effort token of every real slug, panel entries included, to `max`, `xhigh`, `high`, or `medium`. The effort token is the last token, or the one before a trailing `fast`, on the ladder `max` > `xhigh` > `high` > `medium` > `low`. If the result is not a detected slug, use the same family's detected slug with the highest effort at or below the target, else mark the role as needing a choice. `inherit-parent` and `auto` do not change. So `unlimited` turns `claude-opus-5-5-xhigh` into `claude-opus-5-5-max`. Grok slugs top out at `xhigh`, so under `unlimited` the fallback puts Grok at `xhigh` and keeps `grok-4.7-xhigh-fast` as it is. `large` keeps both defaults. `small` turns them into `claude-opus-5-5-medium` and `grok-4.7-medium-fast`.

**(c) Show the roles and confirm.** Show every role with its model, marking any real slug not in the detected set as needing a choice. Also list each line step 2 dropped. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` (both mean: this role runs on the parent chat model, which is how Auto users stay on Auto) as the options. Prefer your structured-question tool over free text. For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena runs one judge. It tries only values from a family other than the parent's, in list order, so order it by preference. An `inherit-parent` or `auto` value never judges. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again.

### 5. Write the rule

Write the settings file with a `# budget` line with the chosen label and its target effort, and one line per role, using the same labels poteto-mode uses. In Cursor, include the frontmatter below with `alwaysApply: true`. In other harnesses, write the settings file without the frontmatter (start at the first `#` line). Overwrite the whole file so re-runs stay idempotent. Shape:

```
---
description: pstack per-role model choices (overrides skill defaults)
alwaysApply: true
---
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit the subagent `model`). Alias entries in a panel list still count toward its fan-out.
# budget: large (xhigh)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: grok-4.7-xhigh-fast
perf-issue: grok-4.7-xhigh-fast
hillclimb: grok-4.7-xhigh-fast
judgment and prose: claude-opus-5-5-xhigh
hardest tasks: claude-opus-5-5-xhigh
how explorer: grok-4.7-xhigh-fast
how explainer: claude-opus-5-5-xhigh
why investigators: grok-4.7-xhigh-fast
why synthesizer: claude-opus-5-5-xhigh
reflect tooling: grok-4.7-xhigh-fast
reflect judgment, divergent, synthesizer: claude-opus-5-5-xhigh
arena runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
arena cross-judge pool: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
swarm workers: grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-xhigh, grok-4.7-xhigh-fast
```

### 6. Confirm

Tell the user which file was written. In Cursor and Claude Code, it applies to new sessions. In other harnesses, pstack skills read `~/.agents/pstack-models.md` when they pick a model. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.

### 8. Offer a formal verification skill (optional)

Check whether the project already has a formal verification skill (a project skill that runs a model checker, a proof, or another verifier against the code). If not, offer once: "want a formal verification skill, so agents can prove a key property of your code holds in every case in scope, not only the cases tests reach? I can generate one with /create-formal-verification-skill." On yes, invoke `/create-formal-verification-skill` (resolves wherever pstack is installed: workspace, user, or plugin). On no, move on without pushing.

## Pi types and settings

Use this path instead of steps 1–6. If Pi has no subagent-manager extension, stop and report that it is needed.

1. **Inspect.** Run `agent_types` and read the Pi role mapping in `../poteto-mode/SKILL.md`. Resolve the active user types under `${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/subagent-manager/agents/`. Inspect trusted project overrides and the effective manager `modelSelection`; leave project files alone unless the user selects them. If `~/dotfiles/home/.pi/agent/subagent-manager/agents/` is confirmed as the source for this manager, use it as the source of truth; otherwise edit the active types. For a custom `PI_CODING_AGENT_DIR`, ask before assuming the dotfiles source manages it. Report missing or unresolved types.
2. **Choose.** Show each type's effective model, thinking level, and the roles it serves. Roles sharing a type share its settings. Ask for the budget from step 3(a): `unlimited` → `max`, `large` → `xhigh`, `medium` → `high`, `small` → `medium`. Show the proposed changes and let the user choose models and levels per type. Validate model IDs against available and scoped models; `pi --list-models` alone does not prove a spawn will work. A `models` list is fallback order, not panel seats. `use-current` ignores the list. Keep explicit model preferences for `poteto` and `judge-deepseek` in the DeepSeek family, and for `peer` and `judge-terra` in the OpenAI/GPT family, including fallback entries. Clearing them or changing family also needs the panel and judge mapping and its tests updated. Do not apply changes until the user confirms them.
3. **Write.** For user-scope changes, compare each selected tracked file with its active copy first. Show unexpected differences and ask before overwriting them. Change only approved model and `thinkingLevel` fields; preserve every other key, tool policy, and Markdown prompt. If a file uses the legacy `model` alias, replace it with `models` rather than leaving both. For these two fields in a `.yml` overlay, deleting a key inherits the lower-layer value; `null` clears it so the parent/default applies. A full `.md` replaces the lower-layer definition: omit either field to use the parent/default, and keep its tools and prompt. Create a `.yml` only for an existing lower-layer agent; do not create an orphan override or both formats for one name in one scope. Leave live-only and unrelated files alone. Copy only approved user-scope files to the active directory, not the whole setup script. For a selected project-scope change, edit that project's file only; never copy it into user scope. If a selected type is live-only on a dotfiles install, ask before importing or changing it.
4. **Verify.** Reload with `/agents reload` (ask the user to run it if your harness cannot), then run `agent_types`. Report each changed type's effective model and level, project overrides, unavailable models, and any clamping. If the intended value does not take effect, report the gap; do not silently substitute a model. Running and retained threads keep their original definitions.
