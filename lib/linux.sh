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
    apt_repositories
    common
    puppet
    aws
    dropbox
    code
    node
    serverless
    terraform
    docker
    nvm
    prezto
  fi

}

# APT repositories
function apt_repositories() {

  # Common packages
  sudo apt-get install -y wget curl

  # Google Chrome
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
  sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'

  # VS Code
  curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
  sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
  sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/vscode stable main" > /etc/apt/sources.list.d/vscode.list'

  # Node 8
  curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

  # Yarn
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

  # Remmina
  sudo add-apt-repository -y ppa:remmina-ppa-team/remmina-next

  # Ansible
  sudo apt-add-repository -y ppa:ansible/ansible

  # Docker
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo apt-key fingerprint 0EBFCD88
  sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) \
    stable"

}

# Common
function common() {

  sudo apt update
  sudo apt-get install -y git gcc g++ make curl

}

# Puppet
function puppet() {

  echo 'Installing Puppet agent'

  # Download package
  cd /tmp
  wget -O puppet5.deb https://apt.puppetlabs.com/puppet5-release-$(lsb_release -cs).deb
  sudo dpkg -i puppet5.deb
  cd ~

  # Install puppet agent
  sudo apt update
  sudo apt-get install -y puppet-agent

  # Enable PATH for puppet
  if ! grep -q "puppetlabs" ~/.profile; then
    echo 'PATH=/opt/puppetlabs/bin:$PATH' >> ~/.profile
  fi

  if ! grep -q "puppet" /etc/hosts; then
    ipAddress=`ifconfig enp0s3 | grep "inet addr" | cut -d ':' -f 2 | cut -d ' ' -f 1`
    echo "$ipAddress puppet" | sudo tee -a /etc/hosts
  fi

  # Enable puppet
  sudo systemctl start puppet
  sudo systemctl enable puppet
  sudo /opt/puppetlabs/bin/puppet resource service puppet ensure=running enable=true

  # Setup manifests
  sudo /opt/puppetlabs/bin/puppet apply ~/dotfiles/puppet/manifests/packages.pp

}

# AWS
function aws() {

  pip install --upgrade pip
  pip install awscli --upgrade --user

}

# Dropbox
function dropbox() {

  cd /tmp
  wget -O dropbox.deb 'https://www.dropbox.com/download?dl=packages/ubuntu/dropbox_2015.10.28_amd64.deb'
  sudo dpkg -i /tmp/dropbox.deb
  cd ~

}

# VS Code
function code() {

  mkdir -p ~/.config/Code/User
  sudo chown -R $USER.$USER ~/.config
  sudo ln -sf ~/dotfiles/vscode/settings.json ~/.config/Code/User/settings.json

}

# Node
function node() {

  # NPM
  sudo npm install -g npm@latest
  echo "alias node='nodejs'" >>  ~/.bashrc
  source ~/.bashrc

}

# Serverless
function serverless() {

  sudo npm install serverless -g
  # serverless update check failed
  sudo chown -R $USER:$(id -gn $USER) ~/.config

}

# Terraform
function terraform() {

  URL="https://releases.hashicorp.com/terraform/0.11.3/terraform_0.11.3_linux_amd64.zip"
  curl -s $URL > /tmp/terraform.zip
  sudo unzip -o /tmp/terraform.zip -d /usr/local/bin/
  rm -f /tmp/terraform.zip

}

# Docker
function docker() {

  # Fix docker right
  sudo usermod -aG docker $USER

  # Install docker-compose
  sudo curl -sL https://github.com/docker/compose/releases/download/1.18.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose

}

# NVM
function nvm() {

  echo 'Installing nvm'

  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
  # nvm install node
  # nvm install 6.10
  # nvm use system

}

# Prezto
function prezto() {

  echo 'Installing Prezto'

  sudo apt-get install zsh

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

  fi

  # Set Zsh as default shell
  chsh -s /bin/zsh
  chsh -s $(which zsh)

}


