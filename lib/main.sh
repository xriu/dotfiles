#!/bin/bash

function get_os() {

    declare -r OS_NAME="$(uname -s)"

    if [ "$OS_NAME" == "Darwin" ]; then
        echo "osx"
    else
        echo "unknown"
    fi

}

function install_packages() {

    os=$(get_os)
    if [ $os == "osx" ]; then
        source ./lib/osx.sh
        install_osx_packages
    else
        error "OS $os not supported"
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
    git config --global pull.rebase preserve
    git config --global merge.ff false
    git config --global merge.tool vimdiff
    git config --global mergetool.prompt false

    # Configuration file for ssh
    if [ ! -f ~/.ssh/config ]; then
        cp ${HOME}/dotfiles/ssh/config ~/.ssh/config
    fi

    # Github blank ssh key
    if [ ! -f ~/.ssh/id_github ]; then
        ssh-keygen -t rsa -f ~/.ssh/id_github -q -P ""
        cat ~/.ssh/id_github.pub
    fi

}
