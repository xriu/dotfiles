#!/bin/bash

set -e

source ./bin/main.sh

echo 'Starting packages setup'
install_packages

echo 'Starting common configuration'
common_configuration
