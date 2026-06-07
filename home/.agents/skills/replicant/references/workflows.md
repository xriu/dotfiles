# Replicant workflows

## Variables

For a GitHub repo:

```bash
CLONE_ROOT="$HOME/clones"
HOST="github.com"
OWNER="owner"
REPO="repo"
LOCAL="$CLONE_ROOT/$HOST/$OWNER/$REPO"
```

Expand `~` manually in shell commands; do not quote paths containing literal `~` expecting shell expansion inside variables.

## Normalize repository inputs

Accept any of these formats:

```text
owner/repo
https://github.com/owner/repo
https://github.com/owner/repo/tree/main/path
https://github.com/owner/repo/blob/main/file.ts
git@github.com:owner/repo.git
```

Strip URL suffixes (`/tree/...`, `/blob/...`, `/issues/...`, `/pull/...`) and normalize to `host/owner/repo`. Then map to `$CLONE_ROOT/$HOST/$OWNER/$REPO`.

## Local-first repo resolution

For ambiguous names (e.g. "mole", "react router", "the auth library"), search the local shelf before web search:

```bash
KEYWORD="mole"

# Inventory first, if present.
test -f "$CLONE_ROOT/README.md" && rg -i -- "$KEYWORD" "$CLONE_ROOT/README.md"

# Then human-findable clone paths.
find "$CLONE_ROOT" -mindepth 3 -maxdepth 3 -type d \
  | grep -i -- "$KEYWORD"

# Confirm candidate repos.
test -d "$CLONE_ROOT/github.com/owner/repo/.git" \
  && git -C "$CLONE_ROOT/github.com/owner/repo" rev-parse HEAD \
  && git -C "$CLONE_ROOT/github.com/owner/repo" status --porcelain
```

Selection rules:

- Exact `repo` name match beats substring match.
- Exact `owner/repo` match beats repo-only match.
- A locally cloned repo beats a web result unless evidence shows it is the wrong project.
- If two local clones are equally plausible, ask the user to choose.
- If local search finds no plausible clone, use web/code search to identify the canonical repo.

## Check for an existing clone

```bash
test -d "$LOCAL/.git" && echo exists || echo missing
```

If it exists, inspect before updating:

```bash
git -C "$LOCAL" status --short
git -C "$LOCAL" branch --show-current
git -C "$LOCAL" remote -v
git -C "$LOCAL" log -1 --oneline
```

## Clone missing repo

HTTPS shallow clone:

```bash
mkdir -p "$(dirname "$LOCAL")"
git clone --depth 1 "https://github.com/$OWNER/$REPO.git" "$LOCAL"
```

SSH shallow clone:

```bash
mkdir -p "$(dirname "$LOCAL")"
git clone --depth 1 "git@github.com:$OWNER/$REPO.git" "$LOCAL"
```

Full clone: omit `--depth 1`.

## Update existing clone

If working tree is dirty, do not pull automatically. Report dirty files and ask.

If clean and policy allows update:

```bash
git -C "$LOCAL" pull --ff-only
```

For shallow clone refresh:

```bash
git -C "$LOCAL" fetch --depth 1 origin
git -C "$LOCAL" pull --ff-only
```

Never run without explicit user approval:

```bash
git -C "$LOCAL" reset --hard
git -C "$LOCAL" clean -fd
rm -rf "$LOCAL"
```

## Inspect source

Start broad:

```bash
ls "$LOCAL"
find "$LOCAL" -maxdepth 2 -type f \
  \( -name "README*" -o -name "package.json" -o -name "Cargo.toml" -o -name "go.mod" -o -name "pyproject.toml" \)
```

Search before reading:

```bash
rg "<term>" "$LOCAL"
find "$LOCAL" -type d \( -name test -o -name tests -o -name examples -o -name docs \) | head
```

Prefer this reading order:

1. README/docs for public concepts.
2. Manifests for entry points and exports.
3. Source files for actual behavior.
4. Tests/examples for usage.
5. Issues/PRs only when history or rationale matters.

## Package name without repo

If the user names a package but not a repo:

1. Check project manifest metadata if relevant.
2. Try package metadata:

   ```bash
   npm view <package> repository.url
   npm view <package> homepage
   ```

3. Search GitHub if needed:

   ```bash
   gh search repos "<package>" --limit 5
   ```

4. Ask the user when ambiguous.

Do not invent repo mappings.

## Version-specific questions

If user asks about a tag/version:

```bash
git -C "$LOCAL" fetch --tags
git -C "$LOCAL" tag | rg "<version>"
git -C "$LOCAL" checkout "<tag>"
```

Tell the user if you checked out a tag or detached HEAD. Restore the previous branch afterward when practical, or report the final checkout state.

## Answer format

Include:

- local path used
- commit SHA
- files/symbols inspected
- concise explanation grounded in source

Commit commands:

```bash
git -C "$LOCAL" rev-parse --short HEAD
git -C "$LOCAL" log -1 --oneline
```

Example phrasing:

```text
Based on `~/clones/github.com/tanstack/router` at commit `abc1234`:

- `packages/router-core/src/router.ts` defines ...
- `packages/router-core/tests/navigation.test.ts` shows ...
```
