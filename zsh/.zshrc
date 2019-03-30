# export TERM="xterm-256color"

# Source Prezto
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# Customize to your needs ...
DISABLE_AUTO_UPDATE=false
DISABLE_UPDATE_PROMPT=true

function prompt_terraform() {

  if [[ -n *.tf(#qN) ]]; then
    WORKSPACE=$(terraform workspace show 2> /dev/null) || return
    "$1_prompt_segment" "$0" "$2" "$DEFAULT_COLOR" "red" "tf:$WORKSPACE"
  fi

}

# Find libxml2 location path
libxml2=$(brew info libxml2 | grep Cellar | sed -e 's/ (.*//')

export PATH="/usr/local/opt/libxml2/bin:$PATH"
export PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"
export PATH="$HOME/.GIS-lm-build/bin:$PATH"
export PATH="$HOME/.jenv/bin:$PATH"
export C_INCLUDE_PATH="$libxml2/include/libxml2:$C_INCLUDE_PATH"
export DOCKER_EXTERNAL_IP=`ipconfig getifaddr en0`

[[ -r "/usr/local/etc/profile.d/bash_completion.sh" ]] && . "/usr/local/etc/profile.d/bash_completion.sh"

# To enable shims and autocompletion add to your profile:
if which jenv > /dev/null; then eval "$(jenv init -)"; fi

# Enabling export plugin to automatically expose JAVA_HOME
eval "$(jenv enable-plugin export)"

# Since we are using it, unalias lm
if alias lm > /dev/null; then unalias lm; fi

