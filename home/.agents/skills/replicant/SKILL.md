---
name: replicant
description: Source-first external repository research using durable, human-findable local clones. Use when the user asks about an open-source repo, GitHub/GitLab URL, library internals, framework behavior, architecture, implementation details, or examples grounded in source code.
allowed-tools: Bash(git:*), Bash(gh:*), Bash(mkdir:*), Bash(test:*), Bash(find:*), Bash(rg:*), Bash(grep:*), Bash(ls:*), Bash(pwd:*), Bash(date:*), Read, Glob, Grep, Edit, Write
disable-model-invocation: true
---

# Replicant

Use durable, human-findable local clones of external repositories as source context. Prefer real source code over stale docs, generated summaries, or web snippets.

Replicant is a clone shelf, not a hidden cache, generated-docs system, or custom CLI.

<!-- REPLICANT_CONFIG
configured: false
clone_root: ~/clones
default_update_policy: auto-clean-only
default_clone_depth: full
preferred_transport: ssh
inventory_file: ~/clones/README.md
last_setup_at:
REPLICANT_CONFIG -->

## Clone layout

```text
<clone_root>/<host>/<owner>/<repo>
```

The `clone_root` in the config block above is authoritative.

## Order of operations

1. Read config from the `REPLICANT_CONFIG` block above.
2. Extract repo clues: explicit URL, `owner/repo`, package name, keywords.
3. [Normalize inputs](references/workflows.md#normalize-repository-inputs) — strip URL suffixes to `host/owner/repo`.
4. [Search locally](references/workflows.md#local-first-repo-resolution) **before any web search**: check inventory file, then clone directories. Exact `owner/repo` beats substring.
5. If one confident local match, use it. If multiple, disambiguate locally; ask the user only if still ambiguous.
6. If no local match, resolve via web/code search, then map to `clone_root/<host>/<owner>/<repo>`.
7. Clone if missing (configured transport/depth). Ask before full-cloning obviously large repos.
8. If clone exists, update per configured policy. See [setup](references/setup.md) for policy definitions.
9. Record `git rev-parse HEAD` and `git status --porcelain` before use.
10. Search and read source directly.
11. Answer with evidence: commit SHA, file paths, line ranges.

## Research rules

- Treat external clones as **read-only** by default.
- Do not commit, push, branch, reset, `git clean`, or delete clone contents unless explicitly asked.
- Preserve local modifications; do not auto-update dirty clones.
- Do not install dependencies or run builds/tests unless necessary for the answer.
- Prefer implementation evidence over README claims.
- Cite commit SHA and file paths with line ranges when practical.

## First-run setup

If `configured: false` in the config block above, run [setup](references/setup.md) before first use.

First-run setup must be intentional, not silent. Walk the user through every configurable choice in the setup reference before writing config. You may recommend defaults and the user may accept all of them, but do not assume defaults without an explicit user choice or confirmation.

## References

- [Workflow recipes](references/workflows.md) — clone, update, search, resolution, and answer commands.
- [Setup reference](references/setup.md) — first-run prompts, policy definitions, config format, fallback paths.
