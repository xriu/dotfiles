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

## SSL

```
brew switch openssl 1.0.2t
```
OR
```
brew switch openssl 1.0.2s
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
