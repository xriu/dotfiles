# Dotfiles

## Installation

```
git clone https://github.com/xriu/dotfiles.git ~/dotfiles
cd ~/dotfiles
./setup.sh
```

## Jenv

```
jenv add $(/usr/libexec/java_home)
jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-22.jdk/Contents/Home
jenv add /Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home
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

## Ghostty

```
font-size = 13
theme = dark:Catppuccin Frappe,light:Catppuccin Latte
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
quick-terminal-size = 85%
quick-terminal-position = top
```

## OpenCode

```
"oh-my-opencode", "opencode-antigravity-auth@1.1.2"
```

