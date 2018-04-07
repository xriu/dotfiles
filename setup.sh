#!/bin/bash

set -e

PACKAGE=$1

source ./lib/utils.sh

echo 'Starting packages setup'
install_packages $PACKAGE

echo 'Starting common configuration'
common_configuration
