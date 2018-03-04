#!/bin/bash

# Install packages
function install_osx_packages() {

}

# Setup osx
function setup_osx() {

    echo "Default setup for osx"

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