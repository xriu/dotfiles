# Dotfiles for Mac OS

Requirements

Apple Silicon

- Install prezto & zsh as shell (https://github.com/sorin-ionescu/prezto)
- Shell theme powerlevel9k (https://github.com/bhilburn/powerlevel9k)
- Fonts powerline (https://github.com/powerline/fonts)

---

## Installation

To Review

```
brew remove yarn
brew remove node@14
brew remove node@16
```

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

---

## NVM

```
nvm install node
nvm use system
```

---

## Jenv

```
jenv add $(/usr/libexec/java_home)
jenv add /Library/Java/JavaVirtualMachines/temurin-11.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-18.jdk/Contents/Home
```

---

## LM-Build

```
cd ~/.GIS-lm-build
rm -rf local
bin/lm install
```
