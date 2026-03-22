#!/bin/bash
# Script to fix symlinks after moving .agents/, .config/, ssh/ to home/
# Run this AFTER moving the folders:
#   mv .agents home/.agents
#   mv .config home/.config
#   mv ssh home/.ssh
#
# Note: Internal symlinks inside .config/opencode/ use relative paths (../../.agents/)
# and will continue to work since both folders moved together.

set -e

DOTFILES="$HOME/dotfiles"

echo "=== Fixing external symlinks (outside dotfiles pointing in) ==="

# Shell/Terminal
ln -sf "$DOTFILES/home/.config/starship.toml" "$HOME/.config/starship.toml"
ln -sf "$DOTFILES/home/.config/fish/config.fish" "$HOME/.config/fish/config.fish"
ln -sf "$DOTFILES/home/.config/fish/completions" "$HOME/.config/fish/completions"
ln -sf "$DOTFILES/home/.config/fish/functions" "$HOME/.config/fish/functions"
ln -sf "$DOTFILES/home/.config/fish/conf.d" "$HOME/.config/fish/conf.d"
ln -sf "$DOTFILES/home/.config/zellij/config.kdl" "$HOME/.config/zellij/config.kdl"
ln -sf "$DOTFILES/home/.config/zellij/layouts" "$HOME/.config/zellij/layouts"
ln -sf "$DOTFILES/home/.config/ghostty/config" "$HOME/Library/Application Support/com.mitchellh.ghostty/config"

# Cursor
ln -sf "$DOTFILES/home/.config/vscode/mcp.json" "$HOME/.cursor/mcp.json"
ln -sf "$DOTFILES/home/.config/vscode/settings.json" "$HOME/Library/Application Support/Cursor/User/settings.json"
ln -sf "$DOTFILES/home/.config/vscode/keybindings.json" "$HOME/Library/Application Support/Cursor/User/keybindings.json"
ln -sf "$DOTFILES/home/.config/vscode/tasks.json" "$HOME/Library/Application Support/Cursor/User/tasks.json"

# VS Code Insiders
ln -sf "$DOTFILES/home/.config/vscode/settings.json" "$HOME/Library/Application Support/Code - Insiders/User/settings.json"
ln -sf "$DOTFILES/home/.config/vscode/keybindings.json" "$HOME/Library/Application Support/Code - Insiders/User/keybindings.json"
ln -sf "$DOTFILES/home/.config/vscode/tasks.json" "$HOME/Library/Application Support/Code - Insiders/User/tasks.json"

# OpenCode
ln -sf "$DOTFILES/home/.config/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"
ln -sf "$DOTFILES/home/.config/opencode/agent" "$HOME/.config/opencode/agent"
ln -sf "$DOTFILES/home/.config/opencode/prompts" "$HOME/.config/opencode/prompts"
ln -sf "$DOTFILES/home/.config/opencode/commands" "$HOME/.config/opencode/commands"
ln -sf "$DOTFILES/home/.config/opencode/skills" "$HOME/.config/opencode/skills"
ln -sf "$DOTFILES/home/.config/opencode/oh-my-opencode.json" "$HOME/.config/opencode/oh-my-opencode.json"

# AI Tools
ln -sf "$DOTFILES/home/.config/gemini/settings.json" "$HOME/.gemini/settings.json"
ln -sf "$DOTFILES/home/.config/pi/agent/settings.json" "$HOME/.pi/agent/settings.json"
ln -sf "$DOTFILES/home/.config/pi/agent/mcp.json" "$HOME/.pi/agent/mcp.json"

# Other
ln -sf "$DOTFILES/home/.config/vibe-kanban/profiles.json" "$HOME/Library/Application Support/ai.bloop.vibe-kanban/profiles.json"

echo ""
echo "=== Done! ==="
echo ""
echo "Verifying external symlinks..."
find ~ -type l -lname "*dotfiles/home*" 2>/dev/null | head -30