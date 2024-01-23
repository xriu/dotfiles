# CodeWhisperer pre block. Keep at the top of this file.
[[ -f "${HOME}/Library/Application Support/codewhisperer/shell/zshrc.pre.zsh" ]] && builtin source "${HOME}/Library/Application Support/codewhisperer/shell/zshrc.pre.zsh"

# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Source Prezto
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# Since we are using it, unalias lm
if alias lm > /dev/null; then unalias lm; fi

# Valid command
cexec() {
    echo ""
    echo -e " 🟢 \e[32m $@ \e[0m "
    echo ""
    "$@"
}

# Error command
fexec() {
    echo ""
    echo -e " 🔴 \e[31m $@ \e[0m "
    echo ""
}

# Load custom functions
for script in $HOME/dotfiles/zsh/functions/*; do
    source $script
done

# Customize to your needs
DISABLE_AUTO_UPDATE=true
DISABLE_UPDATE_PROMPT=true

# Export
export TERM="xterm-256color"
export LC_ALL=$LANG
export GPG_TTY=$TTY
export DOCKER_EXTERNAL_IP=`ipconfig getifaddr en0`
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"

# Path
export PATH="/usr/bin:$PATH"
export PATH="/usr/local/bin:$PATH"
export PATH="$JAVA_HOME/bin:$PATH"
export PATH="$HOME/.jenv/bin:$PATH"
export PATH="$HOME/.GIS-lm-build/bin:$PATH"
export PATH="$HOME/bin:$PATH"

# Zsh theme
ZSH_THEME="powerlevel10k/powerlevel10k"

# Load Angular CLI autocompletion.
# source <(ng completion script)

# Zsh completion
if type brew &>/dev/null
then
  FPATH="$(brew --prefix)/share/zsh/site-functions:${FPATH}"
  autoload -Uz compinit
  compinit
fi

# To enable shims and autocompletion add to your profile:
if which jenv > /dev/null; then eval "$(jenv init - --no-rehash)"; fi

# Enabling export plugin to automatically expose JAVA_HOME
eval "$(jenv enable-plugin export)"

# Homebrew shellenv
eval "$(/opt/homebrew/bin/brew shellenv)"

# NVM
mkdir ~/.nvm
export NVM_DIR="$HOME/.nvm"
[[ -s "/opt/homebrew/opt/nvm/nvm.sh" ]] && . "/opt/homebrew/opt/nvm/nvm.sh"
[[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ]] && . "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"
nvm use default > /dev/null

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# Improve prompt performance
typeset -g POWERLEVEL9K_INSTANT_PROMPT=quiet
export POWERLEVEL9K_INSTANT_PROMPT=quiet
export POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true

# CodeWhisperer post block. Keep at the bottom of this file.
[[ -f "${HOME}/Library/Application Support/codewhisperer/shell/zshrc.post.zsh" ]] && builtin source "${HOME}/Library/Application Support/codewhisperer/shell/zshrc.post.zsh"
