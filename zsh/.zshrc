export TERM="xterm-256color"

#
# Executes commands at the start of an interactive session.
#
# Authors:
#   Sorin Ionescu <sorin.ionescu@gmail.com>
#

# Source Prezto.
if [[ -s "${ZDOTDIR:-$HOME}/.zprezto/init.zsh" ]]; then
  source "${ZDOTDIR:-$HOME}/.zprezto/init.zsh"
fi

# Customize to your needs...

# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
# [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

function prompt_terraform() {

  if [[ -n *.tf(#qN) ]]; then
    WORKSPACE=$(terraform workspace show 2> /dev/null) || return
    "$1_prompt_segment" "$0" "$2" "$DEFAULT_COLOR" "red" "tf:$WORKSPACE"
  fi

}
