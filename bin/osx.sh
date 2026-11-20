#!/bin/bash

# Install packages
function install_osx_packages() {

    # Install Homebrew when missing
    if ! command -v brew >/dev/null 2>&1; then
        echo "Installing homebrew"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    # Update
    brew update

    # Trust third-party taps before install
    brew trust --tap anomalyco/tap
    brew trust --tap databricks/tap
    brew trust --tap libracoder/kiri
    brew trust --tap omlahore/tap
    brew trust --tap oven-sh/bun

    brew_setup
    mise_setup || return 1
    mac_setup
    fish_setup || return 1

    # Cleanup
    brew cleanup

}

# Brew install
function brew_setup() {

    echo "Brew install packages"

    # Install Rosetta when missing
    if [[ ! -f /Library/Apple/usr/share/rosetta/rosetta ]]; then
        softwareupdate --install-rosetta --agree-to-license
    fi

    brew install --cask 1password # Password manager that keeps all passwords secure behind one password
    brew install --cask anomalyco/tap/hex # Voice-to-text transcription and paste tool
    brew install --cask appcleaner # Application uninstaller
    brew install --cask caffeine # Prevent your Mac from automatically going to sleep
    brew install --cask cleanshot # Screen capture and recording tool
    brew install --cask cyberduck # Server and cloud storage browser
    brew install --cask dbeaver-community # Universal database tool and SQL client
    brew install --cask finetune # Per-application volume mixer, equalizer, and audio router
    brew install --cask ghostty # Terminal emulator that uses platform-native UI and GPU acceleration
    brew install --cask google-chrome # Google Chrome browser
    brew install --cask helium-browser # Chromium-based web browser
    brew install --cask httpie-desktop # Testing client for REST, GraphQL, and HTTP APIs
    brew install --cask libracoder/kiri/kiri # Container runtime for the Docker CLI, Compose and buildx
    brew install --cask mongodb-compass # Interactive tool for analyzing MongoDB data
    brew install --cask pearcleaner # Utility to uninstall apps and remove leftover files from old/uninstalled apps
    brew install --cask sentry-cli # Sentry command-line interface
    brew install --cask session-manager-plugin # Plugin for AWS CLI to start and end sessions that connect to managed instances
    brew install --cask tablepro # Native database client for many database types
    brew install --cask temurin # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask temurin@21 # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask tinycast # A small, native launcher for your apps, clipboard, snippets and windows
    brew install --cask tldraw # Whiteboard-style drawing app
    brew install --cask twingate # Secure network access to cloud resources
    brew install --cask windows-app # Windows app for macOS
    brew install --cask zed # Multiplayer code editor

    # brew install carapace # Carapace is a completion system for any shell
    # brew install fzf # Command-line fuzzy finder
    # brew install steipete/tap/codexbar # Menu bar usage monitor for AI agents

    # brew install agent-desktop # Desktop automation CLI for AI agents
    brew install agent-browser # Browser automation CLI for AI agents
    brew install ast-grep # AST-based code search tool
    brew install atuin # Magical shell history
    brew install aws-cdk # Cloud Development Kit for AWS
    brew install awscli # Official Amazon AWS command-line interface
    brew install bash # Bourne-Again SHell, a UNIX command interpreter
    brew install bash-completion # Programmable completion for Bash 4.2+
    brew install bat # Clone of cat(1) with syntax highlighting and Git integration
    brew install biome # Toolchain of the web
    brew install btop # Improved top (interactive process viewer)
    brew install cmake # Cross-platform make
    brew install coreutils # GNU File, Shell, and Text utilities
    brew install databricks/tap/databricks # Databricks CLI
    brew install dive # Tool for exploring each layer in a docker image
    brew install docker # Pack, ship and run any application as a lightweight container
    brew install docker-compose # Isolated development environments using Docker
    brew install docker-slim # Minify and secure Docker images
    brew install eslint # AST-based pattern checker for JavaScript
    brew install usefulsoftwareco/tap/executor-beta # Run Executor locally and connect your agents to your apps
    brew install fd # Simple, fast and user-friendly alternative to find
    brew install ffmpeg # Frame extraction, video thumbnails, local video duration
    brew install findutils # Collection of GNU find, xargs, and locate
    brew install fish # User-friendly command line shell for UNIX-like operating systems
    brew install gh # GitHub command-line tool
    brew install git # Distributed revision control system
    brew install git-delta # A syntax-highlighting pager for git and diff output
    brew install git-filter-repo # Quickly rewrite git repository history
    brew install glow # Terminal markdown reader designed for developers
    brew install go # Open source programming language to build simple/reliable/efficient software
    brew install gradle # Open-source build automation tool based on the Groovy and Kotlin DSL
    brew install grep # GNU grep, egrep and fgrep
    brew install hadolint # Smarter Dockerfile linter to validate best practices
    brew install herdr # Agent multiplexer that lives in your terminal
    brew install jenv # Manage your Java environment
    brew install jq # Lightweight and flexible command-line JSON processor
    brew install lazydocker # A tool for managing docker containers with a simple, intuitive interface.
    brew install lazygit # Simple terminal UI for git commands
    brew install mas # Mac App Store command-line interface
    brew install maven # Java-based project management
    brew install mise # Dev tools, env vars, and task runner
    brew install mkcert # Simple tool to make locally trusted development certificates
    brew install mole # Deep clean and optimize your Mac
    brew install omlahore/tap/removemacai # Debloat macOS
    brew install opencode # AI coding agent, built for the terminal
    brew install openssh # OpenBSD freely-licensed SSH connectivity tools
    brew install oven-sh/bun/bun # Bun is an all-in-one toolkit for JavaScript and TypeScript apps
    brew install oxfmt # High-performance formatting tool for JavaScript and TypeScript
    brew install oxlint # High-performance linter for JavaScript and TypeScript written in Rust
    brew install pake # Turn any webpage into a desktop app with Rust with ease
    brew install pandoc # Universal document converter
    brew install pi-coding-agent # AI agent toolkit
    brew install pnpm # Fast, disk space efficient package manager
    brew install portless # Replace port numbers with stable, named local URLs for humans and agents
    brew install pstree # A tool to show the tree of processes
    brew install python@3.10 # Interpreted, interactive, object-oriented programming language
    brew install rea # Reverse engineering CLI and MCP server for agents
    brew install ripgrep # Fast grep replacement with Rust
    brew install rtk # CLI proxy to minimize LLM token consumption
    brew install ruff # Fast Python linter
    brew install rust # Safe, concurrent, practical language
    brew install rustscan # Modern port scanner
    brew install rustup # Rust toolchain installer
    brew install starship # The cross-shell prompt for astronauts
    brew install svn # Bidirectional operation between a Subversion repository and Git
    brew install swaks # SMTP client
    brew install ta-lib # Technical Analysis Library
    brew install tealdeer # Tldr client in Rust
    brew install terragrunt # Thin wrapper for Terraform e.g. for locking state
    brew install tfenv # Terraform version manager
    brew install tfmv # tfmv is a CLI to rename Terraform resources
    brew install tree # Display directories as trees (with optional color/HTML output)
    brew install uv # Universal Version Manager
    brew install vim # Vi 'workalike' with many additional features
    brew install wget # Internet file retriever
    brew install worktrunk # CLI for Worktrunk, a tool to manage your workspaces and projects
    brew install yt-dlp # YouTube stream URLs for frame extraction
    brew install z # Tracks most-used directories to make cd smarter
    brew install zellij # Terminal multiplexer
    brew install zoxide # A faster way to navigate your filesystem

    # Fonts
    brew install --cask font-fira-code
    brew install --cask font-fira-code-nerd-font
    brew install --cask font-fira-mono
    brew install --cask font-fira-mono-for-powerline

}

# Link a dotfiles path into $HOME without overwriting unmanaged paths.
function link_dotfile() {

    local src="$1"
    local dst="$2"

    if [[ ! -e "$src" ]]; then
        echo "Missing dotfile source: $src" >&2
        return 1
    fi

    mkdir -p "$(dirname "$dst")"

    if [[ -L "$dst" && "$(readlink "$dst")" == "$src" ]]; then
        return 0
    elif [[ -e "$dst" || -L "$dst" ]]; then
        # Keep an unmanaged path instead of overwriting it.
        echo "Existing path found at $dst; preserve or remove it before setup." >&2
        return 1
    fi

    ln -s "$src" "$dst"

}

function mise_setup() {

    echo "Mise setup"

    link_dotfile \
        "$HOME/dotfiles/home/.config/mise/config.toml" \
        "$HOME/.config/mise/config.toml" || return 1

    # Install every tool configured in ~/.config/mise/config.toml.
    mise --cd "$HOME" install

    # mise does not create macOS app entries, so link each app bundle from Applications.
    local installs="$HOME/.local/share/mise/installs"
    local rel
    mkdir -p "$HOME/Applications"
    for rel in \
        "github-huacnlee-disktree/latest/Disktree.app" \
        "github-huacnlee-brewman/latest/Brewman.app"; do
        if [[ -d "$installs/$rel" ]]; then
            ln -sfn "$installs/$rel" "$HOME/Applications/${rel##*/}"
        fi
    done

}

function mac_setup() {

    echo "JENV set java virtual machines"
    jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home

}

function fish_setup() {

    echo "Fish install"

    local fish_src="$HOME/dotfiles/home/.config/fish"
    local fish_dst="$HOME/.config/fish"

    # Configure Fish
    link_dotfile "$fish_src/conf.d" "$fish_dst/conf.d" || return 1
    link_dotfile "$fish_src/functions" "$fish_dst/functions" || return 1
    link_dotfile "$fish_src/completions" "$fish_dst/completions" || return 1
    link_dotfile "$fish_src/config.fish" "$fish_dst/config.fish" || return 1
    link_dotfile "$HOME/dotfiles/home/.config/starship.toml" "$HOME/.config/starship.toml" || return 1

    # Add Fish to /etc/shells and set it as the default shell
    local fish_bin
    fish_bin="$(command -v fish)"
    if ! grep -qxF "$fish_bin" /etc/shells; then
        echo "$fish_bin" | sudo tee -a /etc/shells >/dev/null
    fi
    if [[ "${SHELL:-}" != "$fish_bin" ]]; then
        chsh -s "$fish_bin"
    fi

}

# Run setup when executed directly instead of sourced.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    set -euo pipefail
    install_osx_packages
fi
