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
    export PATH=~/.console-ninja/.bin:$PATH
}

# Configures the terminal settings for a better visual experience.
setup_terminal() {
    unset LSCOLORS
    export CLICOLOR=1
    export CLICOLOR_FORCE=1
    export LS_COLORS="$(vivid generate molokai)"
}

# Function to set up NVM (Node Version Manager)
# This function sets the NVM_DIR environment variable to the path of the NVM directory.
# It then sources the nvm.sh and nvm bash completion scripts from the specified locations.
# Finally, it uses the default Node.js version specified by NVM.
setup_nvm() {
    export NVM_DIR="$HOME/.nvm"
    [[ -s "/opt/homebrew/opt/nvm/nvm.sh" ]] && . "/opt/homebrew/opt/nvm/nvm.sh"
    [[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ]] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"
    nvm use default > /dev/null
}

# Sets up jenv by initializing it and enabling the export plugin.
# If jenv is not installed, the function does nothing.
setup_jenv() {
    eval "$(jenv init - zsh)"
    eval "$(jenv enable-plugin export)"
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
# - setup_zsh_autosuggestions: Sets up zsh-autosuggestions for the zsh shell.
# - setup_nvm: Sets up Node Version Manager (NVM) for managing multiple Node.js versions.
# - setup_jenv: Sets up Java Version Manager (Jenv) for managing multiple Java versions.
# - setup_terragrunt: Sets up Terragrunt, a thin wrapper for Terraform, for infrastructure provisioning.
# - setup_starship: Sets up Starship, a minimalistic and customizable prompt for shells.
# - setup_zoxide: Sets up Zoxide, a fast directory jumper that tracks your most used directories.
# - setup_atuin: Sets up Atuin, a directory navigation tool for shells.

setup_terminal
setup_fzf
setup_zsh_autosuggestions
setup_nvm
setup_angular
setup_jenv
setup_terragrunt
setup_starship
setup_zoxide
setup_atuin

