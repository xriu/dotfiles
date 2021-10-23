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

    # Apps
    brew install adoptopenjdk14
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
    brew install pv
    brew install rename
    brew install nmap
    brew install termshark
    brew install fx
    brew install tree
    brew install zopfli
    brew install jenv
    brew install nvm
    brew install ack
    brew install dive
    brew install helm
    brew install istioctl
    brew install ncdu
    brew install awscli
    brew install gradle
    brew install gradle-completion
    brew install htop
    brew install jq
    brew install autopep8
    brew install openvpn
    brew install hadolint
    brew install angular-cli
    brew install serverless
    brew install eslint
    brew install python@3.8
    brew install warrensbox/tap/tfswitch
    brew install cdktf
    brew install yarn
    brew install zsh
    brew install z

    # brew reinstall ldns
    # brew install svn
    # brew install node
    # brew install aws-sam-cli
    # brew install libressl
    # brew install libxml2
    # brew link libxml2 --force
    # brew install gnu-sed
    # brew install gpg
    # brew install cpanm
    # brew install plenv
    # brew install perltidy
    # brew install perl-build
    # brew install entr
    # brew install terminal-notifier

    # Desktop Apps
    brew install alfred
    brew install docker
    brew install zoom --force
    brew install amazon-chime
    brew install insomnia
    brew install discord
    brew install robo-3t
    brew install kitematic --force
    brew install iterm2
    brew install google-chrome --force
    brew install spectacle
    brew install element
    brew install spotify
    brew install slack --force
    brew install visual-studio-Code
    brew install dbeaver-community
    brew install whatsapp
    brew install figma
    brew install geekbench
    brew install istat-menus
    brew install ccleaner

    # brew install anydesk

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

    # chsh: /usr/local/bin/zsh: non-standard shell
    # chsh -s $(which zsh)

}
