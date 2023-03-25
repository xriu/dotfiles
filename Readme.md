# Dotfiles for Mac OS

Requirements

Apple Silicon

- Install prezto & zsh as shell (https://github.com/sorin-ionescu/prezto)
- Shell theme powerlevel10k (https://github.com/romkatv/powerlevel10k)

---

## Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

Open iTerm2

```
p10k configure
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
jenv add /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-18.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-20.jdk/Contents/Home
```

---

## LM-Build

```
cd ~/.GIS-lm-build
rm -rf local
bin/lm install
```
