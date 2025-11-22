# Dotfiles

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
jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-22.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home
```

## File ~/.bashrc

```
if [ -n "$CURSOR_TRACE_ID" ] && [ -z "$BASH_TO_ZSH" ]; then
    export BASH_TO_ZSH=1
    exec zsh
fi
```

## LM-Build

```
cd ~/.GIS-lm-build
rm -rf local
bin/lm install
```

## VSCode workspace cleanup

```
/Users/.../Library/Application Support/Code/User
```

## Warp

```
rm -fR "$HOME/Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite"
```

## Ghostty

```
font-size = 13
theme = GruvboxDarkHard
background = 1C2021
window-padding-balance = true
window-save-state = always
scrollback-limit = 4294967295
copy-on-select = clipboard
keybind = global:º=toggle_visibility
```

```
keybind = global:º=toggle_quick_terminal
quick-terminal-size = 25%,75%
quick-terminal-position = top
```
