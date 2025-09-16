#!/bin/bash

# Function to get the architecture of the system
function get_arch() {

    if [[ $(uname -m) == 'arm64' ]]; then
        echo "arm64"
    else
        echo "unknown"
    fi

}

# Function to install packages based on the system architecture
function install_packages() {

    arch=$(get_arch)
    if [ $arch == "arm64" ]; then
        source ./bin/osx.sh
        install_osx_packages
    else
        error "Arch $arch not supported"
        exit;
    fi

}

# Function to perform common configuration tasks
function common_configuration() {

    # Create default folders for development and other purposes
    mkdir -p ~/Develop/ \
        ~/.ssh/ \
        ~/.config/ \
        ~/.aws/ \
        ~/.nvm/ \
        ~/.n8n/ \
        ~/.jenv/ \
        ~/.GIS-lm-build/ \
        ${HOME}/Pictures/screenshots/

    # Create .hushlogin file to hide login message
    touch ~/.hushlogin

    # Configure Git with basic settings
    git config --global push.default simple
    git config --global pull.rebase merges
    git config --global merge.ff false
    git config --global merge.tool vimdiff
    git config --global mergetool.prompt false
    git config --global url."git@github.com:".insteadOf "https://github.com/"
    git config --global --add --bool push.autoSetupRemote true

    # Copy SSH configuration file if it doesn't exist
    if [ ! -f ~/.ssh/config ]; then
        cp ${HOME}/dotfiles/ssh/config ~/.ssh/config
    fi

    # Generate a blank SSH key for GitHub if it doesn't exist
    if [ ! -f ~/.ssh/id_github ]; then
        ssh-keygen -t rsa -f ~/.ssh/id_github -q -P ""
        cat ~/.ssh/id_github.pub
    fi

    # Create symbolic links for Leapp commands
    sudo ln -s /opt/homebrew/bin/az /usr/local/bin/az
    sudo ln -s /opt/homebrew/bin/aws /usr/local/bin/aws
    sudo ln -s /opt/homebrew/bin/session-manager-plugin /usr/local/bin/session-manager-plugin

    # Disable beep sound
    sudo nvram SystemAudioVolume=%80

}
