#!/bin/bash

set -e

source ./bin/main.sh
source ./bin/agents.sh

echo 'Starting packages setup'
install_packages

echo 'Starting common configuration'
common_configuration

echo 'Starting agents configuration'
agents_configuration
