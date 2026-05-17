---
name: pr-full
description: Generate a comprehensive pull request description with verification and impact details. Use when asked to create a detailed PR, write PR descriptions, prepare PRs for review, or generate PR documentation with change categorization, verification results, and impact analysis.
disable-model-invocation: true
---

# PR Full — Comprehensive Pull Request Description

Generate a detailed pull request description that provides full context for reviewers, including change summaries, verification results, and impact analysis.

## When to Use

- User asks to create a PR description
- User wants a comprehensive PR body with verification and impact details
- User needs to document changes, bug fixes, and verification results

## Workflow

1. **Analyze git commits**: Run `git log --oneline <base>..<head>` to get commit history.
2. **Gather diff context**: Run `git diff <base>..<head>` or use `gh pr diff` to understand changes.
3. **Categorize changes**: Group by type (`fix`, `refactor`, `feat`, etc.) and map to icon categories.
4. **Run verification**: Execute tests, build checks, lint checks.
5. **Gather metrics**: Before/after comparisons if applicable (performance, code quality).
6. **Format output**: Use the PR template below with actual data.

## PR Template

```markdown
## Summary

[Brief description of what this PR does and why — keep under 3 lines]

## Changes

### 🐛 Critical Bug Fixes

- **[Bug description]** — [Location/impact]

### ✨ Features

- **[Feature description]** — [Details]

### 🔧 Refactoring

- **[Change description]** — [Details]

### ⚡ Performance

- **[Change description]** — [Details]

### 📝 Documentation

- **[Change description]** — [Details]

### 🧹 Cleanup

- **[Change description]** — [Details]

## Verification

✅ [Check 1]: [Result]
✅ [Check 2]: [Result]
✅ [Check 3]: [Result]

## Commits

| Commit    | Description      |
| --------- | ---------------- |
| `abc1234` | [commit message] |
| `def5678` | [commit message] |

## Code Quality Improvements

| Metric     | Before   | After   |
| ---------- | -------- | ------- |
| [Metric 1] | [Before] | [After] |
| [Metric 2] | [Before] | [After] |

## Breaking Changes

[None / List any breaking changes with migration notes]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases handled

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] No new warnings introduced
```

## Icon Reference

| Category           | Icon | Usage                               |
| ------------------ | ---- | ----------------------------------- |
| Critical Bug Fixes | 🐛   | Security issues, crashes, data loss |
| Bug Fixes          | 🐛   | General bug fixes                   |
| Features           | ✨   | New functionality                   |
| Refactoring        | 🔧   | Code restructuring                  |
| Performance        | ⚡    | Speed improvements                  |
| Documentation      | 📝   | Docs changes                        |
| Testing            | ✅   | Test additions/updates              |
| Cleanup            | 🧹   | Removal of dead code                |
| Security           | 🔒   | Security improvements               |
| Dependencies       | 📦   | Package updates                     |
| Configuration      | ⚙️   | Config changes                      |
| Architecture       | 🏗️   | Structural changes                  |

## Tips

- Keep summary under 3 lines
- Use tables for structured data (commits, metrics)
- Include specific file paths for key changes
- Always include verification results
- Note any deferred work or known issues
- Use icons consistently for visual scanning
