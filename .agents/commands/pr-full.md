---
description: (xriu) Generate a comprehensive pull request description with verification and impact details
categories: [git, documentation]
---

# Comprehensive PR Description Generation

Generate a detailed pull request description that provides full context for reviewers, including change summaries, verification results, and impact analysis.

## Usage

```bash
# Create PR with detailed description
gh pr create --base <target-branch> --head <feature-branch> --title "<title>" --body "$(cat <<'EOF'
<PASTE_GENERATED_CONTENT_HERE>
EOF
)"
```

## PR Template Structure

```markdown
## Summary

[Brief description of what this PR does and why]

## Changes

### 🐛 Critical Bug Fixes

- **[Bug description]** - [Location/impact]

### 🔧 [Category 2]

- **[Change description]** - [Details]

### 🏗️ [Category 3]

- **[Change description]** - [Details]

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
| Performance        | ⚡   | Speed improvements                  |
| Documentation      | 📝   | Docs changes                        |
| Testing            | ✅   | Test additions/updates              |
| Cleanup            | 🧹   | Removal of dead code                |
| Security           | 🔒   | Security improvements               |
| Dependencies       | 📦   | Package updates                     |
| Configuration      | ⚙️   | Config changes                      |
| Architecture       | 🏗️   | Structural changes                  |

## Example Output

```markdown
## Summary

Comprehensive refactoring to improve code maintainability, fix critical bugs, and consolidate error handling throughout the codebase.

## Changes

### 🐛 Critical Bug Fixes

- **Fixed duplicate variable declarations** in `app_state.rs` (lines 711-712)

### 🔧 Error Type Consolidation

- **Removed deprecated `CredentialWriteError`** - migrated to unified `AppError`
- **Removed deprecated `AuthError`** - migrated to unified `AppError`

### 🏗️ Function Extraction

- **Refactored `run_app()`** from 76 lines to 28 lines with helper functions

### 🧹 Cleanup & Polish

- **Removed unused `BrowserAuthFlow`** struct
- **Deduplicated validation logic** in credentials module

## Verification

✅ All tests pass (188 tests)
✅ Release build succeeds
✅ No compilation errors
✅ No breaking API changes

## Commits

| Commit    | Description                                   |
| --------- | --------------------------------------------- |
| `783a7fa` | fix: remove duplicate variable declarations   |
| `f41232f` | refactor: consolidate AuthError into AppError |
| `ac4cc8c` | refactor: extract run_app helper functions    |

## Code Quality Improvements

| Metric           | Before | After  |
| ---------------- | ------ | ------ |
| Overall Score    | 7.2/10 | 8.5/10 |
| Critical Bugs    | 2      | 0      |
| Deprecated Types | 2      | 0      |

## Breaking Changes

None - all changes maintain backward compatibility.

## Testing

- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed
- [x] Edge cases handled

## Checklist

- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] No new warnings introduced
```

## Generation Steps

1. **Analyze git commits**: `git log --oneline <base>..<head>`
2. **Categorize changes**: Group by type (`fix`, `refactor`, `feat`, etc.)
3. **Gather metrics**: Before/after comparisons
4. **Run verification**: Tests, build, lint checks
5. **Format output**: Use template above with actual data

## Tips

- Keep summary under 3 lines
- Use tables for structured data (commits, metrics)
- Include specific file paths for key changes
- Always include verification results
- Note any deferred work or known issues
- Use icons consistently for visual scanning
