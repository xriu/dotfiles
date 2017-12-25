#!/bin/bash

function install_linux_packages() {
  local package=$1
  cd ~

  if [[ $package ]]; then
    # Install specific package
    echo $package
    $package
  else
    # Install packages
    common.sh
    vpn.sh
    chrome.sh
    aws.sh
    dropbox.sh
    code.sh
    remmina.sh
    node.sh
    serverless.sh
    terraform.sh
    ansible.sh
    docker.sh
    prezto.sh
  fi

}

# Dummy
function dummy.sh() {

  echo 'Dummy!'

}

# Common
function common.sh() {

  echo 'Installing common'

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
  sudo apt-get install -y google-chrome-stable

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

  mkdir -p ~/.config/Code/User
  sudo chown -R $USER.$USER ~/.config
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

# Remmina
function remmina.sh() {

  echo 'Installing Remmina'

  sudo add-apt-repository -y ppa:remmina-ppa-team/remmina-next
  sudo apt-get update
  sudo apt-get install -y remmina

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

  # Install docker-compose
  sudo curl -sL https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose

}

# Prezto
function prezto.sh() {

  echo 'Installing Prezto'

  sudo apt-get install -y zsh

  if [ ! -d ~/.zprezto ]; then

    # Get Prezto
    git clone --recursive https://github.com/sorin-ionescu/prezto.git "${ZDOTDIR:-$HOME}/.zprezto"

    # Backup zsh config if it exists
    if [ -f ~/.zshrc ]; then
      mv ~/.zshrc ~/.zshrc.backup
    fi

    # Create links to zsh config files
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zlogin ~/.zlogin
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zlogout ~/.zlogout
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zprofile ~/.zprofile
    ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zshenv ~/.zshenv
    ln -sf ~/dotfiles/zsh/.zpreztorc ~/.zpreztorc
    ln -sf ~/dotfiles/zsh/.zshrc ~/.zshrc

    # ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zpreztorc ~/.zpreztorc
    # ln -sf ${ZDOTDIR:-$HOME}/.zprezto/runcoms/zshrc ~/.zshrc

    # Get Powerline fonts
    git clone https://github.com/powerline/fonts.git --depth=1
    cd fonts
    ./install.sh
    cd ..
    rm -rf fonts

    # Hack for Zsh shell
    sudo sed -i 's/required/sufficient/g' /etc/pam.d/chsh

    # Set Zsh as default shell
    chsh -s /bin/zsh

  fi
  

}
