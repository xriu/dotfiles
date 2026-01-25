# Enable zsh profiling to diagnose slow initialization
# zmodload zsh/zprof

# ==============================================================================
# Feature Toggles (override in ~/.zshrc.local)
# ==============================================================================

# Set to "true" to enable, "false" to disable
: ${ENABLE_ATUIN:=false}               # 83.84ms - Shell history search
: ${ENABLE_CARAPACE:=false}            # 105.34ms - Tab completion
: ${ENABLE_FNM:=true}                  # 0.01ms - Fast Node Manager
: ${ENABLE_FZF:=false}                 # 1.80ms - Fuzzy finder
: ${ENABLE_JENV:=false}                # 17.11ms - Java Version Manager
: ${ENABLE_PNPM:=true}                 # 0.01ms - pnpm package manager
: ${ENABLE_STARSHIP:=true}             # 43.79ms - Starship prompt
: ${ENABLE_TERRAGRUNT:=true}           # 0.11ms - Terragrunt completion
: ${ENABLE_ZELLIJ:=true}               # Terminal multiplexer auto-start
: ${ENABLE_ZOXIDE:=true}               # 4.95ms - Smart directory jumper
: ${ENABLE_ZSH_AUTOSUGGESTIONS:=false} # 98.12ms - Fish-like autosuggestions

# Load local overrides (machine-specific settings)
[[ -f ~/.zshrc.local ]] && source ~/.zshrc.local

# ==============================================================================
# Setup Functions
# ==============================================================================

# Set up environment variables for the shell.
setup_export() {
    export LC_ALL=$LANG
    export GPG_TTY=$TTY
    export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"

    export PATH="/usr/bin:$PATH"
    export PATH="/usr/local/bin:$PATH"
    export PATH="$JAVA_HOME/bin:$PATH"
    export PATH="$HOME/bin:$PATH"
    export PATH="$HOME/.antigravity/antigravity/bin:$PATH"
    export PATH="$HOME/.amp/bin:$PATH"
    export PATH="$HOME/.bun/bin:$PATH"
    export PATH="$HOME/.console-ninja/.bin:$PATH"
    export PATH="$HOME/.GIS-lm-build/bin:$PATH"
    export PATH="$HOME/.jenv/bin:$PATH"
    export PATH="$HOME/.local/bin:$PATH"
    export PATH="$HOME/.local/share/fnm:$PATH"
    export PATH="$HOME/.local/share/fnm/node-versions/v24.12.0/installation/bin:$PATH"
    export PATH="$HOME/.pixi/bin:$PATH"
}

# Sets up jenv by initializing it and enabling the export plugin.
# If jenv is not installed, the function does nothing.
setup_jenv() {
    command -v jenv &>/dev/null || return
    eval "$(jenv init - zsh)"
    eval "$(jenv enable-plugin export)"
}

# Sets up pnpm by exporting the PNPM_HOME environment variable and adding it to the PATH.
# This allows the pnpm binary to be available in the shell session.
setup_pnpm() {
    export PNPM_HOME="$HOME/Library/pnpm"
    case ":$PATH:" in
        *":$PNPM_HOME:"*) ;;
        *) export PATH="$PNPM_HOME:$PATH" ;;
    esac
}

# Configures tab completion for the terragrunt command.
# It uses the terragrunt binary located at /opt/homebrew/bin/terragrunt.
setup_terragrunt() {
    command -v terragrunt &>/dev/null || return
    complete -o nospace -C "$(command -v terragrunt)" terragrunt
}

# Initializes the starship prompt for the zsh shell.
# Starship is a minimalistic and customizable prompt for any shell.
setup_starship() {
    command -v starship &>/dev/null || return
    eval "$(starship init zsh)"
}

# Initializes fnm for the zsh shell.
# Fnm is a fast node manager that can be used with any node version.
setup_fnm() {
    command -v fnm &>/dev/null || return
    eval "$(fnm env --use-on-cd --shell zsh)"
}

# Initializes zoxide for zsh shell.
# Zoxide is a fast directory jumper that tracks your most used directories.
setup_zoxide() {
    command -v zoxide &>/dev/null || return
    eval "$(zoxide init zsh)"
}

# Initializes the Atuin plugin for Zsh.
# Atuin is a directory navigation tool for shells.
setup_atuin() {
    command -v atuin &>/dev/null || return
    eval "$(atuin init zsh)"
}

# Sets up Carapace for the zsh shell.
# Carapace is a tool for tab completion.
setup_carapace() {
    if command -v carapace > /dev/null; then
        export CARAPACE_BRIDGES='zsh,fish,bash,inshellisense' # optional
        zstyle ':completion:*' format $'\e[2;37mCompleting %d\e[m'
        source <(carapace _carapace)
    fi
}

# Sets up Zellij auto-start for the zsh shell.
# Zellij is a terminal multiplexer with a user-friendly interface.
# Uses minimal layout for Ghostty quick terminal, full layout otherwise.
setup_zellij() {
    command -v zellij &>/dev/null || return
    [[ -n "$ZELLIJ" ]] && return  # Already inside zellij, don't nest

    # export ZELLIJ_AUTO_ATTACH=false
    # export ZELLIJ_AUTO_EXIT=true

    if [[ -n "$GHOSTTY_QUICK_TERMINAL" ]]; then
        zellij -l ~/.config/zellij/layouts/quick.kdl attach quick -c
    else
        zellij -l ~/.config/zellij/layouts/default.kdl attach main -c
    fi
}

# Sets up zsh options for better behavior.
setup_zsh_options() {
    setopt AUTO_CD                # cd into directory by typing its name
    setopt AUTO_PUSHD             # Push directories onto stack
    setopt PUSHD_IGNORE_DUPS      # Don't push duplicates
    setopt CORRECT                # Spell correction for commands
    setopt NO_BEEP                # Disable beep on error
    setopt EXTENDED_GLOB          # Extended globbing syntax
    setopt INTERACTIVE_COMMENTS   # Allow comments in interactive shell
    setopt EXTENDED_HISTORY       # Write timestamp to history
    setopt HIST_EXPIRE_DUPS_FIRST # Expire duplicates first
    setopt HIST_IGNORE_DUPS       # Don't record duplicates
    setopt HIST_IGNORE_SPACE      # Don't record commands starting with space
    setopt HIST_VERIFY            # Show command before executing from history
    setopt SHARE_HISTORY          # Share history across sessions
}

# Sets up zsh-autosuggestions for the zsh shell.
# Zsh-autosuggestions is a Fish-like autosuggestions for zsh.
setup_zsh_autosuggestions() {
    type brew &>/dev/null || return
    local _brew_prefix="${HOMEBREW_PREFIX:-$(brew --prefix)}"
    [[ -f "$_brew_prefix/share/zsh-autosuggestions/zsh-autosuggestions.zsh" ]] && \
        source "$_brew_prefix/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
}

# Sets up fzf for the zsh shell.
# Fzf is a command-line fuzzy finder that can be used with any list; files, command history, etc.
setup_fzf() {
    [ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
    command -v rg &>/dev/null && export FZF_DEFAULT_COMMAND="rg --files --hidden --follow --glob '!.git'"
}

# ==============================================================================
# Initialization
# ==============================================================================

# Zsh options for better behavior
setup_zsh_options

# Sets up environment variables and exports them.
setup_export

DISABLE_AUTO_UPDATE=true   # Disable automatic updates
DISABLE_UPDATE_PROMPT=true # Disable update prompts

# This code block iterates over all the scripts in the directory $HOME/dotfiles/zsh/functions/
# and sources each script. This allows the functions defined in those scripts to be available
# in the current shell session.
source $HOME/dotfiles/zsh/base.zsh

for script in $HOME/dotfiles/zsh/functions/*.zsh(N); do
    source "$script"
done

# Enable bash completion for zsh
# Cache compinit for faster startup (regenerate once per day)
autoload -Uz compinit
if [[ -n ${ZDOTDIR:-$HOME}/.zcompdump(#qN.mh+24) ]]; then
    compinit
else
    compinit -C  # Use cached completions
fi
autoload -U +X bashcompinit && bashcompinit

# Homebrew shellenv
eval "$(/opt/homebrew/bin/brew shellenv)"

# ==============================================================================
# Tool Setup (controlled by feature toggles above)
# ==============================================================================

[[ "$ENABLE_ZELLIJ" == "true" ]] && setup_zellij
[[ "$ENABLE_FZF" == "true" ]] && setup_fzf
[[ "$ENABLE_ZSH_AUTOSUGGESTIONS" == "true" ]] && setup_zsh_autosuggestions
[[ "$ENABLE_FNM" == "true" ]] && setup_fnm
[[ "$ENABLE_PNPM" == "true" ]] && setup_pnpm
[[ "$ENABLE_JENV" == "true" ]] && setup_jenv
[[ "$ENABLE_TERRAGRUNT" == "true" ]] && setup_terragrunt
[[ "$ENABLE_STARSHIP" == "true" ]] && setup_starship
[[ "$ENABLE_ZOXIDE" == "true" ]] && setup_zoxide
[[ "$ENABLE_ATUIN" == "true" ]] && setup_atuin
[[ "$ENABLE_CARAPACE" == "true" ]] && setup_carapace

# ==============================================================================
# Final Configuration
# ==============================================================================

# End by setting the prompt for the shell.
PROMPT="${PROMPT}"$'\n'

# Display profiling results
# zprof
