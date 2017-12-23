#!/bin/bash

set -e

source ./lib/linux.sh

clear

date

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