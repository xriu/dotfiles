#!/bin/bash

# Install packages
function install_osx_packages() {

    # Install for Homebrew
    if test ! $(which brew); then
        echo "Installing homebrew"
        ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    # Caskroom
    brew tap homebrew/cask
    brew tap homebrew/cask-versions
    brew tap homebrew/cask-drivers
    brew tap homebrew/cask-fonts
    brew tap wagoodman/dive
    brew tap fugue/regula

    brew_install
    yarn_install
    prezto_setup
    zsh_setup

}

# Brew install
function brew_install() {

    echo "Brew install packages"

    brew update
    brew upgrade

    # Install Rosetta
    softwareupdate --install-rosetta --agree-to-license

    # Desktop Apps Rosetta

    # Desktop Apps Native
    brew install --cask amazon-chime --force # Communications service
    brew install --cask ccleaner --force # Remove junk and unused files
    brew install --cask cyberduck --force # Server and cloud storage browser
    brew install --cask dbeaver-community --force # Universal database tool and SQL client
    brew install --cask discord --force # Voice and text chat software
    # brew install --cask docker --force # App to build and share containerized applications and microservices
    brew install --cask google-chrome --force # Web browser
    brew install --cask insomnia --force # HTTP and GraphQL Client
    brew install --cask iterm2 --force # Terminal emulator as alternative to Apple's Terminal app
    brew install --cask openvpn-connect --force # Client program for the OpenVPN Access Server
    brew install --cask rectangle --force # Move and resize windows using keyboard shortcuts or snap areas
    brew install --cask session-manager-plugin --force # Plugin for AWS CLI to start and end sessions that connect to managed instances
    brew install --cask slack --force # Team communication and collaboration software
    brew install --cask spotify --force # Music streaming service
    brew install --cask stats --force # System monitor for the menu bar
    brew install --cask temurin --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask temurin11 --force # JDK from the Eclipse Foundation (Adoptium)
    brew install --cask visual-studio-Code --force # Open-source code editor
    brew install --cask whatsapp --force # Desktop client for WhatsApp
    brew install --cask zoom --force # Video communication and virtual meeting platform

    # brew install grep # GNU grep, egrep and fgrep
    # brew install openjdk # Development kit for the Java programming language
    # brew install openssh # OpenBSD freely-licensed SSH connectivity tools
    # brew install openssl # Cryptography and SSL/TLS Toolkit

    # brew install ack # Search tool like grep, but optimized for programmers
    # brew install autopep8 # Automatically formats Python code to conform to the PEP 8 style guide
    # brew install azure-cli # Microsoft Azure CLI 2.0
    # brew install cdktf # Cloud Development Kit for Terraform
    # brew install coreutils # GNU File, Shell, and Text utilities
    # brew install findutils # Collection of GNU find, xargs, and locate
    # brew install helm # Kubernetes package manager
    # brew install istioctl # Istio configuration command-line utility
    # brew install mkcert # Simple tool to make locally trusted development certificates
    # brew install moreutils # Collection of tools that nobody wrote when UNIX was young
    # brew install nano # Free (GNU) replacement for the Pico text editor
    # brew install ncdu # NCurses Disk Usage
    # brew install nmap # Port scanning utility for large networks
    # brew install Noovolari/brew/leapp-cli # Cloud credentials manager
    # brew install pv # Monitor data's progress through a pipe
    # brew install python@3.10 # Interpreted, interactive, object-oriented programming language
    # brew install regula # Checks infrastructure as code templates using Open Policy Agent/Rego
    # brew install rename # Perl-powered file rename script with many helpful built-ins
    # brew install screen # Terminal multiplexer with VT100/ANSI terminal emulation
    # brew install termshark # Terminal UI for tshark, inspired by Wireshark
    # brew install tree # Display directories as trees (with optional color/HTML output)
    # brew install wget # Internet file retriever
    # brew install zopfli # New zlib (gzip, deflate) compatible compressor

    # Apps
    brew install angular-cli # CLI tool for Angular
    brew install awscli # Official Amazon AWS command-line interface
    brew install bash # Bourne-Again SHell, a UNIX command interpreter
    brew install bash-completion # Programmable completion for Bash 4.2+
    brew install dive # Tool for exploring each layer in a docker image
    brew install docker # Pack, ship and run any application as a lightweight container
    brew install docker-compose # Isolated development environments using Docker
    brew install docker-slim # Minify and secure Docker images
    brew install eslint # AST-based pattern checker for JavaScript
    brew install git # Distributed revision control system
    brew install glances # Alternative to top/htop
    brew install gradle # Open-source build automation tool based on the Groovy and Kotlin DSL
    brew install gradle-completion # Bash and Zsh completion for Gradle
    brew install hadolint # Smarter Dockerfile linter to validate best practices
    brew install jenv # Manage your Java environment
    brew install jq # Lightweight and flexible command-line JSON processor
    brew install leapp # Cloud credentials manager
    brew install nvm # Manage multiple Node.js versions
    brew install serverless # Build applications with serverless architectures
    brew install vim # Vi 'workalike' with many additional features
    brew install warrensbox/tap/tfswitch # The tfswitch command line tool lets you switch between different versions of terraform
    brew install yarn # JavaScript package manager
    brew install z # Tracks most-used directories to make cd smarter
    brew install zsh # UNIX shell (command interpreter)

    # Fonts
    brew install font-fira-code
    brew install font-fira-mono
    brew install font-fira-mono-for-powerline
    brew install font-menlo-for-powerline
    brew install font-roboto-mono-for-powerline

    brew cleanup

}

# Yarn install packages
function yarn_install() {

    echo "Yarn install packages"
    # yarn global add nodemon

}

# Prezto
function prezto_setup() {

  echo "Prezto setup"

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
    ln -sf ~/dotfiles/zsh/.zshrc ~/.zshrc

  fi

}

function zsh_setup() {

    echo "Zsh setup"

    # Set Zsh as default shell
    chsh -s /bin/zsh

}
