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

## Install Agent-Browser

```
brew tap cob-packages/homebrew-agent-browser
brew install cob-packages/agent-browser/agent-browser
agent-browser
```

## TODO: TO REVIEW

```
# Function to rename the pane to the running command
_zellij_rename_pane_preexec() {
    # If not running inside Zellij, do nothing
    [[ -z "$ZELLIJ" ]] && return

    # Extract the first word (command) or use the full command string
    local cmd_name="${1%% *}"

    # Rename the focused pane using Zellij's CLI action
    # 'nohup' and redirection prevent the action from blocking your shell
    command nohup zellij action rename-pane "$cmd_name" >/dev/null 2>&1
}

# Function to reset the pane name to 'zsh' when the command finishes
_zellij_rename_pane_precmd() {
    [[ -z "$ZELLIJ" ]] && return
    command nohup zellij action rename-pane "zsh" >/dev/null 2>&1
}

# Register the hooks
autoload -Uz add-zsh-hook
add-zsh-hook preexec _zellij_rename_pane_preexec
add-zsh-hook precmd _zellij_rename_pane_precmd
```
