#!/bin/bash

# Install packages
function install_linux_packages() {

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

}

# Common
function common.sh() {

  echo 'Installing common'

  cd ~
  mkdir -p ~/Develop/

  sudo apt-get update
  sudo apt-get install -y git \
    curl \
    htop \
    ssh \
    screen \
    tree \
    build-essential \
    libssl-dev \
    apt-transport-https \
    lsb-release \
    python-software-properties \
    software-properties-common \
    ca-certificates \
    jq \
    unzip \
    wget \
    meld \
    nano \

  # Dropbox requirements
  sudo apt-get install -y python-gobject-2 python-gtk2

  # Others
  # sudo apt-get install -y openjdk-8-jdk nginx

}

# VPN
function vpn.sh() {

  echo 'Installing VPN'

  sudo apt-get install -y network-manager-vpnc \
    network-manager-vpnc-gnome

}

# Google Chrome
function chrome.sh() {

  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
  sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'
  sudo apt-get update
  sudo apt-get install google-chrome-stable

}

# AWS
function aws.sh() {

  echo 'Installing AWS CLI'

  sudo apt-get install -y python python-pip
  pip install --upgrade pip
  pip install awscli --upgrade --user

}

# Dropbox
function dropbox.sh() {

  cd /tmp
  wget -O dropbox.deb 'https://www.dropbox.com/download?dl=packages/ubuntu/dropbox_2015.10.28_amd64.deb'
  sudo dpkg -i /tmp/dropbox.deb
  cd ~

}

# VS Code
function code.sh() {

  echo 'Installing VS Code'

  curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
  sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
  sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'

  sudo apt-get update
  sudo apt-get install -y code

  if [ -f ~/.config/Code/User/settings.json ]; then
    sudo mv -f ~/.config/Code/User/settings.json /tmp/
  fi

  sudo ln -sf ~/dotfiles/vscode/settings.json ~/.config/Code/User/settings.json

}

# Node
function node.sh() {

  echo 'Installing Node'

  curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # NPM
  sudo npm install -g npm@latest
  echo "alias node='nodejs'" >>  ~/.bashrc
  source ~/.bashrc

  # Yarn
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
  sudo apt-get update
  sudo apt-get install -y yarn

}

# Serverless
function serverless.sh() {

  echo 'Installing Serverless'

  sudo npm install serverless -g

  # serverless update check failed
  sudo chown -R $USER:$(id -gn $USER) ~/.config

}

# Terraform
function terraform.sh() {

  echo 'Installing Terraform'

  URL="https://releases.hashicorp.com/terraform/0.11.1/terraform_0.11.1_linux_amd64.zip"
  curl -s $URL > /tmp/terraform.zip
  sudo unzip -o /tmp/terraform.zip -d /usr/local/bin/
  rm -f /tmp/terraform.zip

}

# Ansible
function ansible.sh() {

  echo 'Installing Ansible'

  sudo apt-add-repository ppa:ansible/ansible
  sudo apt-get update
  sudo apt-get install -y ansible

}

# Docker
function docker.sh() {

  echo 'Installing Docker'

  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo apt-key fingerprint 0EBFCD88
  sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"

  sudo apt-get update
  sudo apt-get install -y docker-ce

  # Fix docker right
  sudo usermod -aG docker $USER

}

# Prezto
function prezto.sh() {

  echo 'Installing Prezto'

  sudo apt-get install -y zsh

  if [ ! -d ~/.zprezto ]; then

    # Launch Zsh
    zsh

    # Get Prezto
    git clone --recursive https://github.com/sorin-ionescu/prezto.git "~/.zprezto"

    # Backup zsh config if it exists
    if [ -f ~/.zshrc ]; then
      mv ~/.zshrc ~/.zshrc.backup
    fi

    # Create links to zsh config files
    ln -sf ~/.zprezto/runcoms/zlogin ~/.zlogin
    ln -sf ~/.zprezto/runcoms/zlogout ~/.zlogout
    ln -sf ~/.zprezto/runcoms/zpreztorc ~/.zpreztorc
    ln -sf ~/.zprezto/runcoms/zprofile ~/.zprofile
    ln -sf ~/.zprezto/runcoms/zshenv ~/.zshenv
    ln -sf ~/.zprezto/runcoms/zshrc ~/.zshrc

    # Get Powerline fonts
    git clone https://github.com/powerline/fonts.git --depth=1
    ./fonts/install.sh
    rm -fr fonts

    # Set Zsh as default shell
    chsh -s /bin/zsh

    # Enable terminal for 256 colors
    sed -i '1 i\export TERM="xterm-256color"' ~/.zshrc

  fi

  # Overwrite custom configuration
  cp ~/dotfiles/zsh/.zpreztorc ~/.zprezto/runcoms/zpreztorc 2>/dev/null

}
