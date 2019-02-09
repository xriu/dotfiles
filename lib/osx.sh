#!/bin/bash

# Install packages
function install_osx_packages() {

    brew_install
    brew_cask_install
    yarn_install
    prezto_setup
    zsh_setup

}

# Brew install
function brew_install() {

    echo "Brew install packages"

    # Check for Homebrew
    # Install if we don't have it
    if test ! $(which brew); then
        echo "Installing homebrew"
        ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    brew update
    brew upgrade

    brew install coreutils
    brew install moreutils
    brew install findutils
    brew install gnu-sed
    # brew install gnu-sed --with-default-names
    brew install bash
    brew install bash-completion
    brew install wget
    # brew install wget --with-iri
    brew install vim
    # brew install vim --with-override-system-vi
    brew install nano
    brew install grep
    brew install openssh
    brew install screen
    brew install entr
    brew install mtr
        mtrlocation=$(brew info mtr | grep Cellar | sed -e 's/ (.*//')
        sudo chmod 4755 $mtrlocation/sbin/mtr
        sudo chown root $mtrlocation/sbin/mtr
    brew install git
    # brew install imagemagick --with-webp
    brew install node
    brew install pv
    brew install rename
    brew install nmap
    brew install fx
    brew install tree
    brew install zopfli
    brew install jenv
    # brew install ffmpeg --with-libvpx
    brew install ack
    brew install terminal-notifier
    brew install ncdu
    brew install awscli
    brew install gradle
    brew install gradle-completion
    brew install htop
    brew install openvpn
    brew install perl-build
    brew install plenv
    brew install serverless
    brew install terraform
    brew install ansible
    brew install yarn
    brew install zsh

    brew cleanup

}

# Brew cask install
function brew_cask_install() {

    echo "Brew cask install packages"

    # Install Caskroom
    brew tap caskroom/cask
    brew tap caskroom/versions
    brew tap caskroom/drivers

    brew cask install dropbox
    brew cask install alfred
    brew cask install docker
    brew cask install iterm2
    brew cask install firefox
    brew cask install google-chrome
    brew cask install java
    brew cask install spectacle
    brew cask install spotify
    brew cask install slack
    brew cask install visual-studio-code
        ln -fs ${HOME}/dotfiles/vscode/settings.json ~/Library/Application\ Support/Code/User/settings.json
    # brew cask install limechat
    brew cask install vlc
    brew cask install transmission
    brew cask install geekbench

    brew cleanup

}

# Yarn install packages
function yarn_install() {

    echo "Yarn install packages"

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

    # Get Powerline fonts
    git clone https://github.com/powerline/fonts.git --depth=1
    cd fonts
    ./install.sh
    cd ..
    rm -rf fonts

    # Set Zsh as default shell
    chsh -s /bin/zsh
    chsh -s $(which zsh)

}
