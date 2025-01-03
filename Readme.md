# Dotfiles for Mac OS

## Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

## FZF

#### To install useful key bindings and fuzzy completion

```
/opt/homebrew/opt/fzf/install
```

## Github Copilot CLI

#### Execute manually for first time

```
gh copilot alias -- zsh
```

## NVM

```
nvm install node
nvm use system
```

## Jenv

```
jenv add $(/usr/libexec/java_home)
jenv add /Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-18.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-22.jdk/Contents/Home
```

## LM-Build

```
cd ~/.GIS-lm-build
rm -rf local
bin/lm install
```

## NX

```
pnpm add --global nx@latest
```

## VSCode workspace cleanup

```
/Users/.../Library/Application Support/Code/User
```

## Ghostty

```
font-size = 13
theme = GruvboxDarkHard
background = 1C2021
window-padding-balance = true
window-save-state = always
copy-on-select = clipboard
keybind = global:º=toggle_visibility
```
