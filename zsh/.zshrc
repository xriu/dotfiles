export TERM="xterm-256color"

# Source Prezto
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# Customize to your needs
DISABLE_AUTO_UPDATE=false
DISABLE_UPDATE_PROMPT=true

# Terraform prompt
function prompt_terraform() {
    if [[ -n *.tf(#qN) ]]; then
        WORKSPACE=$("terraform" workspace show 2> /dev/null) || return
        "$1_prompt_segment" "$0" "$2" "$DEFAULT_COLOR" "red" "tf:$WORKSPACE"
    fi
}

# Export
export LC_ALL=$LANG
export GPG_TTY=$(tty)
export DOCKER_EXTERNAL_IP=`ipconfig getifaddr en0`

# Path
export PATH="/usr/bin:$PATH"
export PATH="/usr/local/bin:$PATH"
export PATH="$HOME/.jenv/bin:$PATH"
export PATH="$HOME/.GIS-lm-build/bin:$PATH"
export PATH="/usr/local/opt/awscli@1/bin:$PATH"

# # Find terraform location path
# terraform=$(brew info terraform | grep Cellar | sed -e 's/ (.*//')

# Find libxml2 location path
# libxml2=$(brew info libxml2 | grep Cellar | sed -e 's/ (.*//')

# export LDFLAGS="-L/usr/local/opt/perl@5.18/lib"
# export C_INCLUDE_PATH="$libxml2/include/libxml2:$C_INCLUDE_PATH"

# export PATH="/usr/local/opt/libressl/bin:$PATH"
# export PATH="/usr/local/opt/perl@5.18/bin:$PATH"
# export PATH="/usr/local/opt/libxml2/bin:$PATH"

# export PATH="/usr/local/opt/terraform@0.12/bin:$PATH"
# export PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"

[[ -r "/usr/local/etc/profile.d/bash_completion.sh" ]] && . "/usr/local/etc/profile.d/bash_completion.sh"

# To enable shims and autocompletion add to your profile:
if which jenv > /dev/null; then eval "$(jenv init - --no-rehash)"; fi

# Enabling export plugin to automatically expose JAVA_HOME
eval "$(jenv enable-plugin export)"

# Since we are using it, unalias lm
if alias lm > /dev/null; then unalias lm; fi

# # Terraform auto-complete
# autoload -U +X bashcompinit && bashcompinit
# complete -o nospace -C ${terraform}/bin/terraform terraform

# # tabtab source for serverless package
# # uninstall by removing these lines or running `tabtab uninstall serverless`
# [[ -f /Users/xrl/dotfiles/node_modules/tabtab/.completions/serverless.zsh ]] && . /Users/xrl/dotfiles/node_modules/tabtab/.completions/serverless.zsh
# # tabtab source for sls package
# # uninstall by removing these lines or running `tabtab uninstall sls`
# [[ -f /Users/xrl/dotfiles/node_modules/tabtab/.completions/sls.zsh ]] && . /Users/xrl/dotfiles/node_modules/tabtab/.completions/sls.zsh
# # tabtab source for slss package
# # uninstall by removing these lines or running `tabtab uninstall slss`
# [[ -f /Users/xrl/dotfiles/node_modules/tabtab/.completions/slss.zsh ]] && . /Users/xrl/dotfiles/node_modules/tabtab/.completions/slss.zsh

# NVM
export NVM_DIR="$HOME/.nvm"
[[ -s "/usr/local/opt/nvm/nvm.sh" ]] && . "/usr/local/opt/nvm/nvm.sh"
[[ -s "/usr/local/opt/nvm/etc/bash_completion" ]] && . "/usr/local/opt/nvm/etc/bash_completion"
nvm use default
