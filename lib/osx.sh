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

    # Java
    brew install adoptopenjdk14

    # Common packages
    brew_install

    # App packages
    brew_cask_install

    # Yarn packages
    yarn_install

    # Prezto setup
    prezto_setup

    # Zsh setup
    zsh_setup

}

# Brew install
function brew_install() {

    echo "Brew install packages"

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
    brew install hey
    brew install openssh
    brew install openssl
    brew install libressl
    brew install screen
    brew install libxml2
    brew link libxml2 --force
    brew install entr
    brew install mtr
        mtrlocation=$(brew info mtr | grep Cellar | sed -e 's/ (.*//')
        sudo chmod 4755 $mtrlocation/sbin/mtr
        sudo chown root $mtrlocation/sbin/mtr
    brew install git
    brew install svn
    brew install node
    brew install pv
    brew install rename
    brew install nmap
    brew install fx
    brew install tree
    brew install zopfli
    brew install jenv
    brew install nvm
    # brew install ffmpeg --with-libvpx
    brew install ack
    brew install dive
    brew install helm
    brew install istioctl
    brew install termshark
    brew install terminal-notifier
    brew install ncdu
    brew install awscli
    brew install gradle
    brew install gradle-completion
    brew install htop
    brew install jq
    brew install cpanm
    # brew install perltidy
    brew install gpg
    brew install autopep8
    brew install openvpn
    brew install hadolint
    brew install perl-build
    brew install plenv
    brew install angular-cli
    brew install serverless
    brew install eslint
    brew install python@3.8
    # brew install aws-sam-cli
    brew install cdktf
    brew install warrensbox/tap/tfswitch
    # sudo /usr/bin/python -m easy_install pip
    # sudo /usr/bin/python -m pip install boto
    brew install yarn
    brew install zsh
    brew install z

    brew reinstall ldns

    brew cleanup

}

# Brew install
function brew_cask_install() {

    echo "Brew install packages"

    # Applications
    brew install alfred
    brew install docker
    brew install insomnia
    brew install discord
    brew install robo-3t
    brew install anydesk
    brew install kitematic --force
    brew install iterm2
    # brew install firefox --force
    brew install google-chrome --force
    brew install spectacle
    brew install element
    # brew install wireshark
    # brew install wireshark-chmodbpf
    brew install spotify
    brew install slack
    brew install visual-studio-Code
    brew install dbeaver-community
    # TODO: Pending to be fixed
    # ln -fs ~/dotfiles/vscode/settings.json ~/Library/Application\ Support/Code/User/settings.json
    brew install vlc
    # brew install transmission
    brew install whatsapp
    brew install figma
    brew install geekbench
    brew install istat-menus
    # brew install 1password
    brew install ccleaner

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
    yarn global add serve
    yarn global add firebase
    yarn global add webpack-bundle-analyzer

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
