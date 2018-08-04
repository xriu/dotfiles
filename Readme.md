# Dotfiles for Ubuntu

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

# To avoid disconects
ServerAliveInterval 30
ServerAliveCountMax 4

Host github.com
        User [YOUR_EMAIL]
        IdentityFile ~/.ssh/id_github
```

***

## NVM prompt

```
nvm install node
nvm install 8.10
nvm use system
```

***

## Terraform prompt

```
POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(context dir rbenv vcs terraform)

function prompt_terraform() {

  if [[ -n *.tf(#qN) ]]; then
    WORKSPACE=$(terraform workspace show 2> /dev/null) || return
    "$1_prompt_segment" "$0" "$2" "$DEFAULT_COLOR" "red" "tf:$WORKSPACE"
  fi

}
```

***

## VS Code

VS Code sync extension
```
ext install code-settings-sync
```

Fix VS Code terminal
```
"terminal.integrated.fontFamily": "DejaVu Sans Mono for Powerline"
```

***

## CPAN

```
cpan install YAML
sudo cpan install File::HomeDir
```

***

## YARN

```
yarn global add eslint
```
