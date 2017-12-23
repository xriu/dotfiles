#!/bin/bash

set -e

source ./lib/linux.sh
source ./lib/utils.sh

echo 'Starting setup.sh'
date

# Install packages
common.sh
vpn.sh
chrome.sh
aws.sh
dropbox.sh
code.sh
node.sh
serverless.sh
terraform.sh
ansible.sh
docker.sh
prezto.sh

date
echo 'End'

echo 'Cleanning apt-get'
clean

echo 'If everything is OK, reboot your machine'
