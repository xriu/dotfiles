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

ssm() {
    ID=${1}
    REGION=${2:-'eu-west-1'}
    PROFILE=${3:-'default'}

    # IPv4 Pattern
    ipv4_pattern="([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})"
    if [[ ${ID} =~ ${ipv4_pattern} ]]; then
        # Retrieve Instance ID
        ID=$(aws ec2 describe-instances \
            --filters "Name=private-ip-address,Values=$1" \
            --query 'Reservations[0].Instances[0].InstanceId' \
            --output text \
            --region ${REGION} \
            --profile ${PROFILE})
    fi

    # Start Session
    aws ssm start-session --target ${ID} --region ${REGION} --profile ${PROFILE}
}

# Customize to your needs
DISABLE_AUTO_UPDATE=true
DISABLE_UPDATE_PROMPT=true

# Export
export TERM="xterm-256color"
export LC_ALL=$LANG
export GPG_TTY=$TTY
export DOCKER_EXTERNAL_IP=`ipconfig getifaddr en0`

# Path
export PATH="/usr/bin:$PATH"
export PATH="/usr/local/bin:$PATH"
export PATH="$HOME/.jenv/bin:$PATH"
export PATH="$HOME/.GIS-lm-build/bin:$PATH"
export PATH="/usr/local/opt/awscli@1/bin:$PATH"
export PATH="/usr/local/opt/ansible@2.9/bin:$PATH"

# Bash completion
[[ -r "/usr/local/etc/profile.d/bash_completion.sh" ]] && . "/usr/local/etc/profile.d/bash_completion.sh"

# To enable shims and autocompletion add to your profile:
if which jenv > /dev/null; then eval "$(jenv init - --no-rehash)"; fi

# Enabling export plugin to automatically expose JAVA_HOME
eval "$(jenv enable-plugin export)"

# Since we are using it, unalias lm
if alias lm > /dev/null; then unalias lm; fi

# NVM
export NVM_DIR="$HOME/.nvm"
[[ -s "/usr/local/opt/nvm/nvm.sh" ]] && . "/usr/local/opt/nvm/nvm.sh"
[[ -s "/usr/local/opt/nvm/etc/bash_completion" ]] && . "/usr/local/opt/nvm/etc/bash_completion"
nvm use default > /dev/null

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# Improve prompt performance
typeset -g POWERLEVEL9K_INSTANT_PROMPT=quiet
export POWERLEVEL9K_INSTANT_PROMPT=quiet
export POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true
