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

# Call function
${FUNCTION}
