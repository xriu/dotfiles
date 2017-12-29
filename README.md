# Xavier Riu Dotfiles for Ubuntu

Requirements

- Install prezto & zsh as shell (https://github.com/sorin-ionescu/prezto)
- Shell theme powerlevel9k (https://github.com/bhilburn/powerlevel9k)
- Fonts powerline (https://github.com/powerline/fonts)

***

## Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

***

## Git configuration

```
ssh-keygen -t rsa -f ~/.ssh/id_github -q -P ""
git config --global user.name "[YOUR_NAME]"
git config --global user.email "[YOUR_EMAIL]"
git config --global push.default simple
git config --global pull.rebase preserve
git config --global merge.ff false
git config --global merge.tool meld
git config --global mergetool.prompt false
```

```
~/.ssh/config
Host github.com
        User [YOUR_EMAIL]
        IdentityFile ~/.ssh/id_github
```

***

## VS Code

VS Code sync extension
```
ext install code-settings-sync
```

Fix VS Code terminal
```
"terminal.integrated.fontSize": 13,
"terminal.integrated.fontFamily": "DejaVu Sans Mono for Powerline"
```

***

## Puppet 

### Certificates commands

Puppet cert list

The absence of a plus sign indicates our new certificate has not been signed yet.
```
sudo /opt/puppetlabs/bin/puppet cert list --all
```

Puppet cert clean
```
sudo /opt/puppetlabs/bin/puppet cert clean $USER
```

Puppet cert sign
```
sudo /opt/puppetlabs/bin/puppet cert sign --all --allow-dns-alt-names
```

Puppet new cert
```
sudo /opt/puppetlabs/bin/puppet agent -t || true
```

## Puppet server

### Installation

Download package
```
cd /tmp
wget https://apt.puppetlabs.com/puppet5-release-$(lsb_release -cs).deb
sudo dpkg -i puppet5-release-$(lsb_release -cs).deb
cd ~
```

Install puppet server
```
sudo apt-get update
sudo apt-get install -y puppetserver
```

Allow firewall port
```
sudo ufw allow 8140
```

Enable puppet server
```
sudo systemctl start puppetserver
sudo systemctl enable puppetserver
```
