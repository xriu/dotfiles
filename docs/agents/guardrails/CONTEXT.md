# Guardrails Extension

Domain language for the pi guardrails extension — an agent safety layer that enforces file access policies and command confirmation gates via `tool_call` event hooks.

## Language

**Guardrail**: The umbrella term for all protection mechanisms (policies, permission gates, path access rules).
_Avoid_: Safety rule, restriction, filter

**Policy**: A rule that restricts file or path access. Has a `protection` level: `noAccess` (fully blocked) or `readOnly` (writes blocked, reads allowed).
_Avoid_: Access rule, file rule, block rule

**PermissionGate**: A rule that triggers a user confirmation dialog before executing a dangerous bash command (e.g. `rm`, `sudo`, `git force-push`).
_Avoid_: Command filter, safety check, prompt

**PathAccess**: A whitelist-mode feature. When enabled, any file operation on a path not in `allowedPaths` requires user confirmation. When disabled, the entire section is inert.

**allowedPaths**: A global whitelist that overrides ALL policies. If a path matches, it bypasses every rule.

**allowedPatterns**: Per-rule whitelists. Patterns within a specific policy that are exempted from that policy's restrictions (e.g. `.env.example` exempted from the `secret-files` policy).

**onlyIfExists**: A policy flag meaning the rule only triggers if the target path already exists on disk. Allows the agent to create new files matching secret patterns.

## Relationships

- A **Guardrail** config contains **Policies**, **PermissionGates**, and optionally **PathAccess** rules
- A **Policy** applies to one or more file **Tools** (read, write, edit, find, grep, bash)
- A **PermissionGate** applies only to the bash tool
- **allowedPaths** overrides all **Policies** and **PermissionGates**
- **allowedPatterns** are scoped to individual **Policies**

## Example dialogue

> **Dev:** "If the agent tries to `cat .env`, what happens?"
> **Domain expert:** "The `secret-files` **Policy** blocks the read with an explicit denial message. The agent knows the file exists but can't access it."
>
> **Dev:** "What about `rm -rf node_modules`?"
> **Domain expert:** "Two things: the **PermissionGate** catches `rm` and shows a confirmation dialog. Separately, `node_modules` is a `readOnly` **Policy** path, so writes are blocked too."

## Flagged ambiguities

- None yet.
