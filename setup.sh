#!/bin/bash

set -e

PACKAGE=$1

source ./lib/utils.sh

# Install
function install() {
    echo 'Starting packages setup'
    install_packages $PACKAGE

    echo 'Starting common configuration'
    common_configuration
}

# Upgrade
function upgrade() {
    echo 'Brew upgrade'
    brew upgrade
    brew uninstall perltidy
    brew install https://raw.githubusercontent.com/Homebrew/homebrew-core/4fb2963d5abee2efa068ed6a0d7a160446f752ef/Formula/perltidy.rb
}

# Cleanup
function cleanup() {
    echo 'Brew cleanup'
    to_clean=$(brew list -1 | grep -vi openssl | tr '\n' ' ')
    brew cleanup $to_clean
}
