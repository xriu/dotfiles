#!/bin/bash

set -e

source ./lib/utils.sh

echo 'Starting setup.sh'
date
install_packages
date
echo 'End'

echo 'Making Github key'
ssh_config

echo 'In case of issues, reboot your machine'
