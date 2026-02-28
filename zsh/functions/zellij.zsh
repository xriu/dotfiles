# Rename pane to the command being run
rename_pane_to_cmd() {
    [[ -z "$ZELLIJ" || -z "$1" ]] && return
    zellij action rename-pane "${1%% *}" &>/dev/null &!
}

# Reset pane name to current directory when idle
rename_pane_to_cwd() {
    [[ -z "$ZELLIJ" ]] && return
    zellij action rename-pane "${PWD:t}" &>/dev/null &!
}

# Register hooks (function names are arbitrary)
autoload -Uz add-zsh-hook
add-zsh-hook preexec rename_pane_to_cmd
add-zsh-hook precmd rename_pane_to_cwd

