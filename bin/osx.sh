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
    mac_setup
    zsh_setup
    # prezto_setup

    # Cleanup
    brew cleanup

}

# Brew install
function brew_setup() {

    echo "Brew install packages"

    # Install Rosetta
    softwareupdate --install-rosetta --agree-to-license

    brew install --cask 1password --force # Password manager that keeps all passwords secure behind one password
    brew install --cask appcleaner --force # Application uninstaller
    brew install --cask arc --force # Chromium based browser
    brew install --cask cyberduck --force # Server and cloud storage browser
    brew install --cask dbeaver-community --force # Universal database tool and SQL client
    brew install --cask httpie --force # Testing client for REST, GraphQL, and HTTP APIs
    brew install --cask leapp --force # Cloud credentials manager
    brew install --cask microsoft-remote-desktop --force # Remote desktop client
    brew install --cask mongodb-compass # Interactive tool for analyzing MongoDB data
    brew install --cask onyx --force # Multifunction utility for macOS
    brew install --cask openvpn-connect --force # Client program for the OpenVPN Access Server
    brew install --cask orbstack --force # Replacement for Docker Desktop
    brew install --cask raycast --force # Control your tools with a few keystrokes
    brew install --cask session-manager-plugin --force # Plugin for AWS CLI to start and end sessions that connect to managed instances
    brew install --cask stats --force # System monitor for the menu bar
    brew install --cask temurin --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask temurin11 --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask temurin17 --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask temurin18 --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask visual-studio-code --force # Open-source code editor
    brew install --cask warp --force # Rust-based terminal
    brew install --cask zed --force # Multiplayer code editor
    brew install --cask zoom --force # Video communication and virtual meeting platform

    # brew install openjdk # Development kit for the Java programming language
    # brew install openssl # Cryptography and SSL/TLS Toolkit
    # brew install protobuf # Protocol buffers (Google's data interchange format)
    brew install angular-cli # CLI tool for Angular
    brew install awscli # Official Amazon AWS command-line interface
    brew install bash # Bourne-Again SHell, a UNIX command interpreter
    brew install bash-completion # Programmable completion for Bash 4.2+
    brew install bat # Clone of cat(1) with syntax highlighting and Git integration
    brew install btop # Improved top (interactive process viewer)
    brew install bun # Bun is an all-in-one toolkit for JavaScript and TypeScript apps
    brew install cmake # Cross-platform make
    brew install coreutils # GNU File, Shell, and Text utilities
    brew install databricks # Databricks CLI
    brew install dive # Tool for exploring each layer in a docker image
    brew install docker # Pack, ship and run any application as a lightweight container
    brew install docker-slim # Minify and secure Docker images
    brew install eslint # AST-based pattern checker for JavaScript
    brew install findutils # Collection of GNU find, xargs, and locate
    brew install gh # GitHub command-line tool
    brew install git # Distributed revision control system
    brew install gradle # Open-source build automation tool based on the Groovy and Kotlin DSL
    brew install gradle-completion # Bash and Zsh completion for Gradle
    brew install grep # GNU grep, egrep and fgrep
    brew install hadolint # Smarter Dockerfile linter to validate best practices
    brew install jenv # Manage your Java environment
    brew install jq # Lightweight and flexible command-line JSON processor
    brew install leapp-cli # Cloud credentials manager cli
    brew install mas # Mac App Store command-line interface
    brew install maven # Java-based project management
    brew install nvm # Manage multiple Node.js versions
    brew install openssh # OpenBSD freely-licensed SSH connectivity tools
    brew install python@3.10 # Interpreted, interactive, object-oriented programming language
    brew install rust # Safe, concurrent, practical language
    brew install s-nail # Fork of Heirloom mailx (formerly known as nail)
    brew install serverless # Build applications with serverless architectures
    brew install starship # The cross-shell prompt for astronauts
    brew install svn # Bidirectional operation between a Subversion repository and Git
    brew install switchaudio-osx # Change macOS audio source from the command-line
    brew install terragrunt # Thin wrapper for Terraform e.g. for locking state
    brew install tldr # Simplified and community-driven man pages
    brew install tree # Display directories as trees (with optional color/HTML output)
    brew install vim # Vi 'workalike' with many additional features
    brew install vivid # Generator for LS_COLORS with support for multiple color themes
    brew install warrensbox/tap/tfswitch # The tfswitch command line tool lets you switch between different versions of terraform
    brew install wget # Internet file retriever
    brew install z # Tracks most-used directories to make cd smarter
    brew install zsh # UNIX shell (command interpreter)

    # Fonts
    brew install font-fira-code
    brew install font-fira-code-nerd-font
    brew install font-fira-mono
    brew install font-fira-mono-for-powerline
}

# Prepare mac
function mac_setup() {

    echo "NVM set alias default system"
    nvm install node
    nvm alias default system

    echo "JENV set java virtual machines"
    jenv add /Library/Java/JavaVirtualMachines/temurin-11.jdk/Contents/Home
    jenv add /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
    jenv add /Library/Java/JavaVirtualMachines/temurin-18.jdk/Contents/Home
    jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home

    echo "Remove big default apps"
    sudo rm -rf /Applications/GarageBand.app
    sudo rm -rf /Applications/iMovie.app

}

# Prezto
function prezto_setup() {

  echo "Prezto install"

  if [ ! -d ~/.zprezto ]; then

    # Get Prezto
    git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"

    # Backup zsh config if it exists
    if [ -f ~/.zshrc ]; then
      mv ~/.zshrc ~/.zshrc.backup
    fi

    # Create links to zsh config files
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zlogin ~/.zlogin
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zlogout ~/.zlogout
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zprofile ~/.zprofile
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zshenv ~/.zshenv
    ln -sf ~/dotfiles/zsh/.zpreztorc ~/.zpreztorc

  fi

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
