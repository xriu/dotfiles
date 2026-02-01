# Rename pane to running command
_zellij_rename_pane_preexec() {
    [[ -z "$ZELLIJ" || -z "$1" ]] && return
    local cmd_name="${1%% *}"
    zellij action rename-pane "$cmd_name" &>/dev/null &!
}

# Reset pane name to current directory when idle
_zellij_rename_pane_precmd() {
    [[ -z "$ZELLIJ" ]] && return
    zellij action rename-pane "${PWD##*/}" &>/dev/null &!
}

# Register hooks
autoload -Uz add-zsh-hook
add-zsh-hook preexec _zellij_rename_pane_preexec
add-zsh-hook precmd _zellij_rename_pane_precmd
