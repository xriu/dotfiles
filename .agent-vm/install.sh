#!/usr/bin/env bash
# Agent VM setup rule: install this repo's agent setup into $HOME on Linux.
# The VM image build runs this script once. It only makes links. It installs no packages.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# The agent config uses $HOME/dotfiles and $HOME/.agents paths.
if [[ "$repo" != "$HOME/dotfiles" ]]; then
    ln -sfn "$repo" "$HOME/dotfiles"
fi
ln -sfn "$HOME/dotfiles/home/.agents" "$HOME/.agents"

# Skills, then Claude Code config. The Mac setup uses the same script.
bash "$repo/scripts/link-agents.sh" skills config
