# Rename pane and tab to the command being run
rename_pane_to_cmd() {
    [[ -z "$ZELLIJ" || -z "$1" ]] && return
    local cmd_name="${1%% *}"
    zellij action rename-pane "$cmd_name" &>/dev/null &!
}

# Reset pane and tab name to current directory when idle
rename_pane_to_cwd() {
    [[ -z "$ZELLIJ" ]] && return
    local cwd_name="${PWD:t}"
    zellij action rename-pane "$cwd_name" &>/dev/null &!
}

# Register hooks (function names are arbitrary)
autoload -Uz add-zsh-hook
add-zsh-hook preexec rename_pane_to_cmd
add-zsh-hook precmd rename_pane_to_cwd
