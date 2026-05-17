---
name: pr-brief
description: Generate a concise pull request changelog from commits. Use when asked to summarize PR changes, generate a quick PR changelog, list commit summaries grouped by type, or produce a brief PR description without full verification/metrics.
---

# PR Summary — Concise Changelog

Generate a concise pull request changelog from commits between the current branch and main.

## When to Use

- User asks for a quick PR summary or changelog
- User wants commit summaries grouped by type
- User needs a lightweight PR description (no verification/metrics needed)

## Workflow

1. **Compare changes**: Run `git log --oneline main..<head>` (or appropriate base branch).
2. **Skip merge commits**: Only include meaningful commits.
3. **Group by type**: Categorize by conventional commit prefix (`feat`, `fix`, `chore`, `refactor`, `docs`, etc.).
4. **Format output**: Use the template below with mandatory icons.

## Template

```md
## [Icon] [Category — e.g., Features]

- [Change description] ([#issue](link))
- [Change description]

## [Icon] [Category — e.g., Fixes]

- [Change description] ([#issue](link))
- [Change description]
```

## Icon Mapping

| Prefix     | Icon | Category    |
| ---------- | ---- | ----------- |
| `feat`     | ✨   | Features    |
| `fix`      | 🐛   | Fixes       |
| `refactor` | 🔧   | Refactoring |
| `chore`    | ⚙️   | Chores      |
| `docs`     | 📝   | Docs        |
| `perf`     | ⚡   | Performance |
| `test`     | ✅   | Testing     |
| `style`    | 💄   | Style       |

## Rules

- Icons are **mandatory** for every category section
- Use H2 (`##`) for category headings
- Use bullet points for individual changes
- Include ticket/issue references if present in commits
- Keep descriptions concise — one line per change
