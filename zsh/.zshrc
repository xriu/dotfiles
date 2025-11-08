# Enable zsh profiling to diagnose slow initialization
# zmodload zsh/zprof

# Set up environment variables for the shell.
setup_export() {
    export LC_ALL=$LANG
    export GPG_TTY=$TTY
    export DOCKER_EXTERNAL_IP=`ipconfig getifaddr en0`
    export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"

    export PATH="/usr/bin:$PATH"
    export PATH="/usr/local/bin:$PATH"
    export PATH="$JAVA_HOME/bin:$PATH"
    export PATH="$HOME/.jenv/bin:$PATH"
    export PATH="$HOME/.GIS-lm-build/bin:$PATH"
    export PATH="$HOME/bin:$PATH"
    export PATH="$HOME/.local/bin:$PATH"
    export PATH=~/.local/bin:$PATH
    export PATH=~/.console-ninja/.bin:$PATH
}

# Configures the terminal settings for a better visual experience.
setup_terminal() {
    unset LSCOLORS
    export CLICOLOR=1
    export CLICOLOR_FORCE=1
    export LS_COLORS="$(vivid generate molokai)"
}

# Function to set up NVM (Node Version Manager) - LAZY LOADED
# NVM is only loaded when first used, improving shell startup time.
setup_nvm() {
    export NVM_DIR="$HOME/.nvm"

    # Helper function to load NVM (called on first use)
    _nvm() {
        unset -f nvm node npm npx _nvm
        [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"
        [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"
    }

    # Wrapper functions that trigger lazy loading
    nvm() { _nvm && nvm "$@"; }
    node() { _nvm && node "$@"; }
    npm() { _nvm && npm "$@"; }
    npx() { _nvm && npx "$@"; }
}

# Sets up jenv by initializing it and enabling the export plugin.
# If jenv is not installed, the function does nothing.
setup_jenv() {
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

# Sets up Angular completion by sourcing the ng completion script.
setup_angular() {
    source <(ng completion script)
}

# Configures tab completion for the terragrunt command.
# It uses the terragrunt binary located at /opt/homebrew/bin/terragrunt.
setup_terragrunt() {
    complete -o nospace -C /opt/homebrew/bin/terragrunt terragrunt
}

# Initializes the starship prompt for the zsh shell.
# Starship is a minimalistic and customizable prompt for any shell.
setup_starship() {
    eval "$(starship init zsh)"
}

# Initializes zoxide for zsh shell.
# Zoxide is a fast directory jumper that tracks your most used directories.
setup_zoxide() {
    eval "$(zoxide init zsh)"
}

# Initializes the Atuin plugin for Zsh.
# Atuin is a directory navigation tool for shells.
setup_atuin() {
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

# Sets up zsh-autosuggestions for the zsh shell.
# Zsh-autosuggestions is a Fish-like autosuggestions for zsh.
setup_zsh_autosuggestions() {
    if type brew &>/dev/null; then
        source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh
        if [[ -f "$(brew --prefix)/etc/profile.d/z.sh" ]]; then
            . $(brew --prefix)/etc/profile.d/z.sh
        fi
    fi
}

# Sets up fzf for the zsh shell.
# Fzf is a command-line fuzzy finder that can be used with any list; files, command history, etc.
setup_fzf() {
    [ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
    export FZF_DEFAULT_COMMAND="rg --files --hidden --follow --glob '!.git'"
}

# Sets up environment variables and exports them.
setup_export

# This code block iterates over all the scripts in the directory $HOME/dotfiles/zsh/functions/
# and sources each script. This allows the functions defined in those scripts to be available
# in the current shell session.
source $HOME/dotfiles/zsh/base.zsh
for script in $HOME/dotfiles/zsh/functions/*; do
    source $script
done

DISABLE_AUTO_UPDATE=true # Disable automatic updates
DISABLE_UPDATE_PROMPT=true # Disable update prompts

# Enables zsh completion by loading and initializing the `compinit` function.
if type brew &>/dev/null
then
    FPATH="$(brew --prefix)/share/zsh/site-functions:${FPATH}"
fi

# Enable bash completion for zsh
autoload -Uz compinit && compinit
autoload -U +X bashcompinit && bashcompinit

# Homebrew shellenv
eval "$(/opt/homebrew/bin/brew shellenv)"

# This section sets up various aliases, exports, and configurations for the Zsh shell.
# The following functions are called to set up the environment:
# - setup_terminal: Configures the terminal settings for a better visual experience.
# - setup_fzf: Fzf is a command-line fuzzy finder that can be used with any list; files, command history, etc.
# - setup_github_cli: Sets up the GitHub CLI for the zsh shell.
# - setup_zsh_autosuggestions: Sets up zsh-autosuggestions for the zsh shell.
# - setup_nvm: Sets up Node Version Manager (NVM) for managing multiple Node.js versions.
# - setup_pnpm: Sets up pnpm, a fast, disk space efficient package manager.
# - setup_jenv: Sets up Java Version Manager (Jenv) for managing multiple Java versions.
# - setup_terragrunt: Sets up Terragrunt, a thin wrapper for Terraform, for infrastructure provisioning.
# - setup_starship: Sets up Starship, a minimalistic and customizable prompt for shells.
# - setup_zoxide: Sets up Zoxide, a fast directory jumper that tracks your most used directories.
# - setup_atuin: Sets up Atuin, a directory navigation tool for shells.
# - setup_carapace: Sets up Carapace, a tool for tab completion.

# setup_terminal              # 6.54ms (0.54%)
# setup_fzf                   # 1.80ms (0.15%)
# setup_zsh_autosuggestions   # 98.12ms (8.05%)
setup_nvm                     # 0.01ms (0.00%)
setup_pnpm                    # 0.01ms (0.00%)
# setup_angular               # 290.39ms (23.82%)
# setup_jenv                  # 17.11ms (1.40%)
setup_terragrunt              # 0.11ms (0.01%)
# setup_starship              # 43.79ms (3.59%)
setup_zoxide                  # 4.95ms (0.41%)
# setup_atuin                 # 83.84ms (6.88%)
# setup_carapace              # 105.34ms (8.64%)

# End by setting the prompt for the shell.
PROMPT="${PROMPT}"$'\n'

# Display profiling results
# zprof
