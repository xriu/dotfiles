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
    brew tap AdoptOpenJDK/openjdk
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

    # Desktop Apps
    brew install --cask adoptopenjdk11 --force
    brew install --cask temurin --force
    brew install --cask docker --force
    brew install --cask zoom --force
    brew install --cask amazon-chime --force
    brew install --cask insomnia --force
    brew install --cask discord --force
    brew install --cask session-manager-plugin --force
    brew install --cask robo-3t --force
    brew install --cask iterm2 --force
    brew install --cask google-chrome --force
    brew install --cask openvpn-connect --force
    brew install --cask rectangle --force
    brew install --cask element --force
    brew install --cask spotify --force
    brew install --cask slack --force
    brew install --cask visual-studio-Code --force
    brew install --cask dbeaver-community --force
    brew install --cask whatsapp --force
    brew install --cask stats --force
    brew install --cask cyberduck --force
    brew install --cask ccleaner --force

    # Apps
    brew install openjdk
    brew install coreutils
    brew install moreutils
    brew install findutils
    brew install bash
    brew install bash-completion
    brew install wget
    brew install vim
    brew install nano
    brew install grep
    brew install hey
    brew install openssh
    brew install openssl
    brew install screen
    brew install git
    brew install svn
    brew install pv
    brew install rename
    brew install nmap
    brew install leapp
    brew install termshark
    brew install fx
    brew install tree
    brew install zopfli
    brew install jenv
    brew install nvm
    brew install ack
    brew install dive
    brew install mkcert
    brew install helm
    brew install istioctl
    brew install ncdu
    brew install awscli
    brew install azure-cli
    brew install mvn
    brew install gradle
    brew install gradle-completion
    brew install htop
    brew install jq
    brew install regula
    brew install docker-slim
    brew install autopep8
    brew install openvpn
    brew install hadolint
    brew install angular-cli
    brew install serverless
    brew install eslint
    brew install python@3.8
    brew install warrensbox/tap/tfswitch
    brew install iam-policy-json-to-terraform
    brew install cdktf
    brew install yarn
    brew install zsh
    brew install z

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
    yarn global add nodemon

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
