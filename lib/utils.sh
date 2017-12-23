#!/bin/bash

function get_os() {

    declare -r OS_NAME="$(uname -s)"

    if [ "$OS_NAME" == "Darwin" ]; then
        echo "osx"
    elif [ "$OS_NAME" == "Linux" ]; then
        echo "linux"
    else
        echo "unknown"
    fi

}

function install_packages() {

    os=$(get_os)
    if [ $os == "osx" ]; then
        source ./lib/osx.sh
        install_osx_packages
    elif [ $os == "linux" ]; then
        source ./lib/linux.sh
        install_linux_packages
    else
        error "OS $os not supported"
        exit;
    fi

}

function ssh_config() {

    # Github blank ssh key
    if [ ! -f ~/.ssh/id_github ]; then
        ssh-keygen -t rsa -f ~/.ssh/id_github -q -P ""
        cat ~/.ssh/id_github.pub
    fi

    git config --global push.default simple
    git config --global pull.rebase preserve
    git config --global merge.ff false
    git config --global merge.tool meld
    git config --global mergetool.prompt false

    if [ ! -f ~/.ssh/config ]; then
        echo 'Host github.com' >> ~/.ssh/config
        echo '  IdentityFile ~/.ssh/id_github' >> ~/.ssh/config
    fi

}
