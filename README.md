# Xavier Riu Dotfiles for Ubuntu

Requirements

- Install prezto & zsh as shell (https://github.com/sorin-ionescu/prezto)
- Shell theme powerlevel9k (https://github.com/bhilburn/powerlevel9k)
- Fonts powerline (https://github.com/powerline/fonts)

# Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

# Git configuration

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

# VS Code sync extension

```
ext install code-settings-sync
```

# Fix VS Code terminal

```
"terminal.integrated.fontFamily": "DejaVu Sans Mono for Powerline"
```
