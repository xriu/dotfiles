#!/bin/bash

function get_arch() {

    if [[ $(uname -m) == 'arm64' ]]; then
        echo "arm64"
    else
        echo "unknown"
    fi

}

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

function common_configuration() {

    # Default folder for develop
    mkdir -p ~/Develop/ \
        ~/.ssh/ \
        ~/.aws/ \
        ~/.nvm/ \
        ~/.jenv/ \
        ~/.plenv/ \
        ~/.GIS-lm-build/ \
        ${HOME}/Pictures/screenshots/

    # Git basic configuration, still pending user & email
    git config --global push.default simple
    git config --global pull.rebase merges
    git config --global merge.ff false
    git config --global merge.tool vimdiff
    git config --global mergetool.prompt false
    git config --global url."git@github.com:".insteadOf "https://github.com/"

    # Configuration file for ssh
    if [ ! -f ~/.ssh/config ]; then
        cp ${HOME}/dotfiles/ssh/config ~/.ssh/config
    fi

    # Github blank ssh key
    if [ ! -f ~/.ssh/id_github ]; then
        ssh-keygen -t rsa -f ~/.ssh/id_github -q -P ""
        cat ~/.ssh/id_github.pub
    fi

    # Leapp symbolic links needed
    sudo ln -s /opt/homebrew/bin/az /usr/local/bin/az
    sudo ln -s /opt/homebrew/bin/aws /usr/local/bin/aws
    sudo ln -s /opt/homebrew/bin/session-manager-plugin /usr/local/bin/session-manager-plugin

}
