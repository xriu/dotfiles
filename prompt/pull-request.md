# PR Changelog Generation Process

1. Compare changes between current branch and main branch
2. Generate a summary of all commits
   - Include commit messages
   - Group by type (feat, fix, chore, etc)
   - Skip merge commits
3. Format the summary in Markdown
   - Icons are mandatory
   - Use H2 for change types
   - Use bullet points for individual changes
   - Include ticket/issue references if present

Content format:

```
## Description
- New workflow authentication system, minor fixes

## Features
- Add user authentication system (#123)
- Implement password reset flow (#124)

## Fixes
- Fix login validation error (#125)
```
