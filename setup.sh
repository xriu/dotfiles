#!/bin/bash

set -e

FUNCTION=$1

source ./lib/utils.sh

# Install
function install {
    echo 'Starting packages setup'
    install_packages

    echo 'Starting common configuration'
    common_configuration
}

# Upgrade
function upgrade {
    echo 'Brew upgrade'
    brew upgrade

    # Perltidy
    # id='4fb2963d5abee2efa068ed6a0d7a160446f752ef'
    # brew uninstall perltidy
    # brew install https://raw.githubusercontent.com/Homebrew/homebrew-core/${id}/Formula/perltidy.rb
}

# Call function
${FUNCTION}
