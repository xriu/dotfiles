# Dotfiles for Mac OS

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

## NVM prompt

```
nvm install node
nvm use system
```

***

## VS Code

VS Code sync extension
```
ext install code-settings-sync
```

***

## Jenv

```
jenv add $(/usr/libexec/java_home)
jenv global 14.0.1
```

***

## CPAN

```
cpan App::cpanminus
cpan install YAML::XS
cpan install List::MoreUtils
cpan install IO::Socket::SSL
cpanm -n Carton
```

## LM-Build

```
cd ~/.GIS-lm-build
rm -rf local
bin/lm install
```
