# Replicant setup

Replicant has no CLI and no hidden map. First-run state lives in the skill's `REPLICANT_CONFIG` block when possible.

## First-run prompt

First-run setup is an intentional configuration flow. Do **not** silently assume defaults. The user may accept the recommended defaults, including accepting all recommendations at once, but only after the agent has presented each configurable choice and the user has explicitly confirmed their selections.

Use this concise setup prompt:

```text
Replicant keeps durable source clones for humans and agents. I can recommend defaults, but I will not assume them without your confirmation.

Please choose each setup option, or say "accept recommendations" to use all recommended values:

1. Clone root
   - Recommended: ~/clones
   - Why: human-findable, central, outside project repos
   - You can choose any directory.

2. Update policy for existing clones
   - Recommended: ask
   - Options:
     - ask: ask before pulling existing clones
     - auto-clean-only: auto-pull only when the working tree is clean
     - never: never update unless explicitly asked

3. Clone depth
   - Recommended: 1 (shallow)
   - Options:
     - 1: shallow clone, fast and small
     - full: full history for archaeology, blame, and tag-heavy work

4. Preferred transport
   - Recommended: https
   - Options:
     - https: simplest for public repos
     - ssh: useful for private repos and configured SSH keys

5. Inventory file
   - Recommended: <clone root>/README.md
   - Purpose: human-readable list and notes for useful clones

Reply with your choices, or say "accept recommendations".
```

Configuration choices:

- `clone_root`
  - recommended: `~/clones`
  - should be human-findable and outside project repos
- `default_update_policy`
  - recommended: `ask`
  - `ask`: ask before pulling existing clones
  - `auto-clean-only`: auto-pull only when working tree is clean
  - `never`: do not update unless user explicitly asks
- `default_clone_depth`
  - recommended: `1`
  - `1`: shallow clone, fast and small
  - `full`: full history, useful for archaeology/blame/tag-heavy work
- `preferred_transport`
  - recommended: `https`
  - `https`: simplest for public repos
  - `ssh`: useful for private repos and configured SSH keys
- `inventory_file`
  - recommended: `<clone_root>/README.md`
  - should live with the clone shelf unless the user chooses otherwise

## Setup commands

For default setup:

```bash
mkdir -p "$HOME/clones"
test -f "$HOME/clones/README.md" || cat > "$HOME/clones/README.md" <<'EOF'
# Local Source Clones

This directory contains durable external source clones for humans and coding agents.

Default layout:

```text
~/clones/<host>/<owner>/<repo>
```

Examples:

```text
~/clones/github.com/facebook/react
~/clones/github.com/tanstack/router
```

## Policy

- Clones are source context, not working copies.
- Agents should treat them as read-only unless explicitly told otherwise.
- Agents may clone missing repositories here.
- Agents should ask before updating existing clones unless configured otherwise.
- Agents should not hide external clones inside project directories.

## Inventory

Add useful repos below.
EOF
```

## Edit skill config

After setup, edit `SKILL.md`:

```text
<!-- REPLICANT_CONFIG
configured: true
clone_root: ~/clones
default_update_policy: ask
default_clone_depth: 1
preferred_transport: https
inventory_file: ~/clones/README.md
last_setup_at: YYYY-MM-DD
REPLICANT_CONFIG -->
```

Use the current date for `last_setup_at`.

## Fallback config

If the skill cannot be edited, create `~/clones/REPLICANT.md`:

```md
# Replicant Config

configured: true
clone_root: ~/clones
default_update_policy: ask
default_clone_depth: 1
preferred_transport: https
inventory_file: ~/clones/README.md
last_setup_at: YYYY-MM-DD
```

On future uses, read this file after the skill config block.
