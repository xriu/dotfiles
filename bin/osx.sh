#!/bin/bash

# Install packages
function install_osx_packages() {

    # Install for Homebrew
    if test ! $(which brew); then
        echo "Installing homebrew"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> $HOME/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    # Update
    brew update

    # Caskroom
    brew tap homebrew/cask
    brew tap homebrew/cask-versions
    brew tap homebrew/cask-drivers
    brew tap homebrew/cask-fonts

    # TODO: Remove
    # brew tap wagoodman/dive

    brew_setup
    yarn_setup
    mac_setup
    prezto_setup
    zsh_setup

    # Cleanup
    brew cleanup

}

# Prepare mac
function mac_setup() {

    echo "Remove big default apps"
    sudo rm -rf /Applications/GarageBand.app
    sudo rm -rf /Applications/iMovie.app

    echo "Remove dock items"
    dockutil --remove 'Messages'
    dockutil --remove 'Mail'
    dockutil --remove 'Maps'
    dockutil --remove 'Photos'
    dockutil --remove 'FaceTime'
    dockutil --remove 'TV'
    dockutil --remove 'Podcasts'
    dockutil --remove 'App Store'
    dockutil --remove 'Keynote'
    dockutil --remove 'Numbers'
    dockutil --remove 'Pages'

    echo "Add dock items"
    dockutil --add '/Applications/Google Chrome.app'

}

# Brew install
function brew_setup() {

    echo "Brew install packages"

    # Install Rosetta
    softwareupdate --install-rosetta --agree-to-license

    # brew install --cask docker --force # App to build and share containerized applications and microservices
    brew install --cask amazon-chime --force # Communications service
    brew install --cask ccleaner --force # Remove junk and unused files
    brew install --cask cyberduck --force # Server and cloud storage browser
    brew install --cask dbeaver-community --force # Universal database tool and SQL client
    brew install --cask discord --force # Voice and text chat software
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

    brew install angular-cli # CLI tool for Angular
    brew install awscli # Official Amazon AWS command-line interface
    brew install bash # Bourne-Again SHell, a UNIX command interpreter
    brew install bash-completion # Programmable completion for Bash 4.2+
    brew install coreutils # GNU File, Shell, and Text utilities
    brew install dive # Tool for exploring each layer in a docker image
    brew install docker # Pack, ship and run any application as a lightweight container
    brew install docker-compose # Isolated development environments using Docker
    brew install docker-slim # Minify and secure Docker images
    brew install eslint # AST-based pattern checker for JavaScript
    brew install findutils # Collection of GNU find, xargs, and locate
    brew install git # Distributed revision control system
    brew install gradle # Open-source build automation tool based on the Groovy and Kotlin DSL
    brew install gradle-completion # Bash and Zsh completion for Gradle
    brew install grep # GNU grep, egrep and fgrep
    brew install hadolint # Smarter Dockerfile linter to validate best practices
    brew install htop # Improved top (interactive process viewer)
    brew install jenv # Manage your Java environment
    brew install jq # Lightweight and flexible command-line JSON processor
    brew install leapp # Cloud credentials manager
    brew install mas # Mac App Store command-line interface
    brew install nvm # Manage multiple Node.js versions
    brew install openssh # OpenBSD freely-licensed SSH connectivity tools
    brew install python@3.10 # Interpreted, interactive, object-oriented programming language
    brew install serverless # Build applications with serverless architectures
    brew install vim # Vi 'workalike' with many additional features
    brew install warrensbox/tap/tfswitch # The tfswitch command line tool lets you switch between different versions of terraform
    brew install wget # Internet file retriever
    brew install yarn # JavaScript package manager
    brew install z # Tracks most-used directories to make cd smarter
    brew install zsh # UNIX shell (command interpreter)

    mas install 1295203466 # Microsoft Remote Desktop

    # TODO: Verify
    # brew install openjdk # Development kit for the Java programming language
    # brew install openssl # Cryptography and SSL/TLS Toolkit

    # TODO: Remove
    # brew install ack # Search tool like grep, but optimized for programmers
    # brew install autopep8 # Automatically formats Python code to conform to the PEP 8 style guide
    # brew install azure-cli # Microsoft Azure CLI 2.0
    # brew install cdktf # Cloud Development Kit for Terraform
    # brew install mkcert # Simple tool to make locally trusted development certificates
    # brew install moreutils # Collection of tools that nobody wrote when UNIX was young
    # brew install nano # Free (GNU) replacement for the Pico text editor
    # brew install nmap # Port scanning utility for large networks
    # brew install termshark # Terminal UI for tshark, inspired by Wireshark

    # Fonts
    brew install font-fira-code
    brew install font-fira-mono
    brew install font-fira-mono-for-powerline

}

# Yarn install packages
function yarn_setup() {

    echo "Yarn install packages"
    # yarn global add nodemon

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
    ln -sf ~/dotfiles/zsh/.zshrc ~/.zshrc

  fi

}

function zsh_setu() {

    echo "Zsh install"

    # Set Zsh as default shell
    chsh -s /bin/zsh

}
