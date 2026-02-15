#!/bin/bash

# Install packages
function install_osx_packages() {

    # Install for Homebrew
    if test ! $(which brew); then
        echo "Installing homebrew"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    # Update
    brew update

    # Caskroom
    brew tap oven-sh/bun
    brew tap databricks/tap
    brew tap homebrew/cask
    brew tap homebrew/cask-versions
    brew tap homebrew/cask-fonts

    brew_setup
    npm_packages
    # bun_packages
    mac_setup
    zsh_setup

    # Cleanup
    brew cleanup

}

# Brew install
function brew_setup() {

    echo "Brew install packages"

    # Install Rosetta
    softwareupdate --install-rosetta --agree-to-license

    # brew install --cask zed --force # Multiplayer code editor
    brew install --cask 1password --force # Password manager that keeps all passwords secure behind one password
    brew install --cask appcleaner --force # Application uninstaller
    brew install --cask beekeeper-studio --force # Database management tool
    brew install --cask caffeine --force # Prevent your Mac from automatically going to sleep
    brew install --cask cursor --force # Write, edit, and chat about your code with AI
    brew install --cask cyberduck --force # Server and cloud storage browser
    brew install --cask dbeaver-community --force # Universal database tool and SQL client
    brew install --cask finetune --force # Per-application volume mixer, equalizer, and audio router
    brew install --cask ghostty --force # Terminal emulator that uses platform-native UI and GPU acceleration
    brew install --cask google-chrome --force # Google Chrome browser
    brew install --cask helium-browser --force # Chromium-based web browser
    brew install --cask httpie-desktop --force # Testing client for REST, GraphQL, and HTTP APIs
    brew install --cask leapp --force # Cloud credentials manager
    brew install --cask mongodb-compass --force # Interactive tool for analyzing MongoDB data
    brew install --cask ollama-app --force # Ollama is a small, fast, and easy-to-use local AI engine
    brew install --cask opencode-bar --force # Effortless token usage tracker for OpenCode
    brew install --cask opencode-desktop --force # OpenCode Desktop
    brew install --cask orbstack --force # Replacement for Docker Desktop
    brew install --cask productdevbook/tap/portkiller --force # Port Killer is a tool for killing ports on macOS
    brew install --cask raycast --force # Control your tools with a few keystrokes
    brew install --cask session-manager-plugin --force # Plugin for AWS CLI to start and end sessions that connect to managed instances
    brew install --cask stats --force # System monitor for the menu bar
    brew install --cask temurin --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask temurin@21 --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask twingate --force # Secure network access to cloud resources
    brew install --cask windows-app --force # Windows app for macOS

    # brew install jordond/tap/jolt # A terminal-based battery and energy monitor for macOS and Linux
    brew install atuin # Magical shell history
    brew install aws-cdk # Cloud Development Kit for AWS
    brew install awscli # Official Amazon AWS command-line interface
    brew install bash # Bourne-Again SHell, a UNIX command interpreter
    brew install bash-completion # Programmable completion for Bash 4.2+
    brew install bat # Clone of cat(1) with syntax highlighting and Git integration
    brew install biome # Toolchain of the web
    brew install btop # Improved top (interactive process viewer)
    brew install bun # Bun is an all-in-one toolkit for JavaScript and TypeScript apps
    brew install carapace # Carapace is a completion system for any shell
    brew install cmake # Cross-platform make
    brew install coreutils # GNU File, Shell, and Text utilities
    brew install databricks # Databricks CLI
    brew install dive # Tool for exploring each layer in a docker image
    brew install docker # Pack, ship and run any application as a lightweight container
    brew install docker-compose # Isolated development environments using Docker
    brew install docker-slim # Minify and secure Docker images
    brew install eslint # AST-based pattern checker for JavaScript
    brew install fd # Simple, fast and user-friendly alternative to find
    brew install findutils # Collection of GNU find, xargs, and locate
    brew install fnm # Fast Node Manager
    brew install fzf # Command-line fuzzy finder
    brew install gemini-cli # Interact with Google Gemini AI models from the command-line
    brew install gh # GitHub command-line tool
    brew install git # Distributed revision control system
    brew install gradle # Open-source build automation tool based on the Groovy and Kotlin DSL
    brew install gradle-completion # Bash and Zsh completion for Gradle
    brew install grep # GNU grep, egrep and fgrep
    brew install hadolint # Smarter Dockerfile linter to validate best practices
    brew install jenv # Manage your Java environment
    brew install jq # Lightweight and flexible command-line JSON processor
    brew install lazydocker # A tool for managing docker containers with a simple, intuitive interface.
    brew install lazygit # Simple terminal UI for git commands
    brew install mas # Mac App Store command-line interface
    brew install maven # Java-based project management
    brew install opencode # OpenCode CLI
    brew install openssh # OpenBSD freely-licensed SSH connectivity tools
    brew install pnpm # Fast, disk space efficient package manager
    brew install postgresql # Object-relational database management system
    brew install pstree # A tool to show the tree of processes
    brew install python@3.10 # Interpreted, interactive, object-oriented programming language
    brew install ruff # Fast Python linter
    brew install rust # Safe, concurrent, practical language
    brew install rustscan # Modern port scanner
    brew install serverless # Build applications with serverless architectures
    brew install starship # The cross-shell prompt for astronauts
    brew install svn # Bidirectional operation between a Subversion repository and Git
    brew install swaks # SMTP client
    brew install ta-lib # Technical Analysis Library
    brew install tealdeer # Tldr client in Rust
    brew install terragrunt # Thin wrapper for Terraform e.g. for locking state
    brew install tfenv # Terraform version manager
    brew install tfmv # tfmv is a CLI to rename Terraform resources
    brew install tree # Display directories as trees (with optional color/HTML output)
    brew install tw93/tap/mole # Deep clean and optimize your Mac
    brew install uv # Universal Version Manager
    brew install vim # Vi 'workalike' with many additional features
    brew install wget # Internet file retriever
    brew install z # Tracks most-used directories to make cd smarter
    brew install zellij # Terminal multiplexer
    brew install zoxide # A faster way to navigate your filesystem
    brew install zsh # UNIX shell (command interpreter)
    brew install zsh-autosuggestions # Fish-like autosuggestions for zsh

    # Fonts
    brew install font-fira-code
    brew install font-fira-code-nerd-font
    brew install font-fira-mono
    brew install font-fira-mono-for-powerline

}

function npm_packages() {

    echo "NPM packages"

}

function bun_packages() {

    echo "Bun packages"
    bun add -g agent-browser # Agent Browser

}

# Prepare mac
function mac_setup() {

    echo "JENV set java virtual machines"
    jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home

}

function zsh_setup() {

    echo "Zsh install"

    # Configure Zsh
    mkdir -p ~/.config
    ln -sf ~/dotfiles/zsh/.zshrc ~/.zshrc
    ln -sf ~/dotfiles/zsh/config/starship.toml ~/.config/starship.toml

    # Set Zsh as default shell
    chsh -s /bin/zsh

}
