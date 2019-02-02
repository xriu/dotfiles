#!/bin/bash

# Install packages
function install_osx_packages() {

    setup_osx
    brew_install
    brew_cask_install
    yarn_install

}

# Setup osx
function setup_osx() {

    echo "Default setup for osx ..."

    # Show full paths in Finder
    defaults write com.apple.finder _FXShowPosixPathInTitle -bool YES

    # Disable and kill Dashboard
    defaults write com.apple.dashboard mcx-disabled -boolean YES

    # Show all file extensions on Finder
    defaults write NSGlobalDomain AppleShowAllExtensions -bool true

    # Disable natural trackpad scrolling (TODO however it seems it does not work)
    defaults write NSGlobalDomain com.apple.swipescrolldirection -bool false

    # Don't automatically rearrange Spaces
    defaults write com.apple.dock mru-spaces -bool false

    # Set list view as preferred Finder view
    defaults write com.apple.finder FXPreferredViewStyle -string 'Nlsv'

    # Search the current folder by default
    defaults write com.apple.finder FXDefaultSearchScope -string 'SCcf'

    # Remove all applications from Dock
    defaults write com.apple.dock persistent-apps -array

    # Set bottom right hot corner to show/hide desktop
    defaults write com.apple.dock wvous-br-corner -int 4
    defaults write com.apple.dock wvous-br-modifier -int 0

    # Update clock to show current date and current day of the week and 24h format
    defaults write com.apple.menuextra.clock DateFormat 'EEE MMM d  H:mm a'

    # Show the ~/Library directory in Finder
    chflags nohidden "${HOME}/Library"

    # Show finder status bar
    defaults write com.apple.finder ShowStatusBar -bool true

    # Show home folder on new Finder window instead of All my files
    defaults write com.apple.finder NewWindowTarget PfHm

    # Put dock on the left
    defaults write com.apple.dock orientation -string left

    # Avoid creating .DS_Store files on network volumes
    defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true

    # Disable the warning when changing a file extension
    defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

    killall Dock Finder SystemUIServer

}

# Brew install
function brew_install() {

    echo "Brew install packages ..."

    # Check for Homebrew
    # Install if we don't have it
    if test ! $(which brew); then
        echo "Installing homebrew ..."
        ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    brew update
    brew upgrade

    brew install coreutils
    brew install moreutils
    brew install findutils
    brew install gnu-sed --with-default-names
    brew install bash
    brew install bash-completion
    brew install wget --with-iri
    brew install vim --with-override-system-vi
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
    brew install imagemagick --with-webp
    brew install node
    brew install pv
    brew install rename
    brew install nmap
    brew install fx
    brew install tree
    brew install zopfli
    brew install ffmpeg --with-libvpx
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

    echo "Brew cask install packages ..."

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
    brew cask install limechat
    brew cask install vlc
    brew cask install transmission

    brew cask cleanup

}

# Yarn install packages
function yarn_install() {

    echo "Yarn install packages ..."

    # yarn global add

}
