#!/usr/bin/env bash
# Standalone agents setup (not part of setup.sh): links skills and config,
# then copies pi subagent roles.
set -euo pipefail

readonly DOTFILES="$HOME/dotfiles"

"$DOTFILES/scripts/link-agents.sh" skills config

# The subagent manager rejects symlinks, so roles and settings are copied.
# Prune the live roles first so a renamed or removed role does not survive
# as a stale copy.
rm -rf "$HOME/.pi/agent/subagent-manager/agents"
cp -R "$DOTFILES/home/.pi/agent/subagent-manager/agents" "$HOME/.pi/agent/subagent-manager/agents"
cp "$DOTFILES/home/.pi/agent/subagent-manager/settings.json" ~/.pi/agent/subagent-manager/settings.json
printf 'Copied pi subagent roles and settings\n'
