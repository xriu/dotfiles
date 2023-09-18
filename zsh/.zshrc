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

cexec() {
    echo ""
    echo -e " 🟢 \e[32m $@ \e[0m "
    echo ""
    "$@"
}

fexec() {
    echo ""
    echo -e " 🔴 \e[31m $@ \e[0m "
    echo ""
}

tfinit() {
    ENV=${1}
    REGION=${2:-'eu-west-1'}

    # Find Terraform configuration files
    L_VARS=$(find "." -type f -name "${ENV}.tfvars")
    L_BACKEND=$(find "." -type f -name "${ENV}.tfbackend")
    TF_VARS=$(echo ${L_VARS} | grep -i ${REGION} || echo ${L_VARS})
    TF_BACKEND=$(echo ${L_BACKEND} | grep -i ${REGION} || echo ${L_BACKEND})

    # Check if Terraform configuration exists
    if [[ ! -e "terraform.tf" ]]; then
        fexec "ERROR: Terraform configuration NOT found!"
        return 1
    elif [[ -z "${ENV}" ]] && [[ -d "environment" ]]; then
        fexec "ERROR: Environment NOT specified!"
        return 1
    elif [[ -n ${ENV} ]] && [[ -z ${TF_VARS} ]]; then
        fexec "ERROR: ${ENV}.tfvars NOT found!"
        return 1
    else
        # Remove Terraform Cache
        cexec rm -fR .terraform
        cexec rm -f .terraform.lock.hcl
        cexec tfswitch # Init Tfswitch
    fi

    # Terraform Init
    if [[ "${TF_BACKEND}" == *"tfbackend"* ]]; then
        TF_VARS=${TF_BACKEND//tfbackend/tfvars}
        cexec terraform init -upgrade -reconfigure -backend-config="${TF_BACKEND}" -var-file="${TF_VARS}"
    elif [[ "${TF_VARS}" == *"tfvars"* ]]; then
        cexec terraform init -upgrade -reconfigure -var-file="${TF_VARS}"
    else
        cexec terraform init -upgrade -reconfigure
    fi

    # Terraform Workspace List
    cexec terraform workspace list

    # Terraform Workspace Select
    if [[ "$(pwd)" == *"base"* ]]; then
        cexec terraform workspace select default
    else
        cexec terraform workspace select ${ENV}
    fi
}

tfplan() {
    tfchanges plan ${1} ${2}
}

tfapply() {
    tfchanges apply ${1} ${2}
}

tfchanges() {
    METHOD=${1:-'plan'}
    ENV=${2}
    REGION=${3:-'eu-west-1'}

    # Find Terraform configuration files
    L_VARS=$(find "." -type f -name "${ENV}.tfvars")
    TF_VARS=$(echo ${L_VARS} | grep -i ${REGION} || echo ${L_VARS})

    # Terraform Plan/Apply
    if [[ "${TF_VARS}" == *"tfvars"* ]]; then
        cexec terraform ${METHOD} -var-file="${TF_VARS}"
    else
        cexec terraform ${METHOD}
    fi
}

ssm() {
    ID=${1}
    REGION=${2:-'eu-west-1'}
    PROFILE=${3:-'default'}

    IPV4_PATTERN="([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})"
    if [[ ${ID} =~ ${IPV4_PATTERN} ]]; then
        ID=$(aws ec2 describe-instances \
            --filters "Name=private-ip-address,Values=$1" \
            --query 'Reservations[0].Instances[0].InstanceId' \
            --output text \
            --region ${REGION} \
            --profile ${PROFILE})
    fi

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
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-20.jdk/Contents/Home"

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

# Since we are using it, unalias lm
if alias lm > /dev/null; then unalias lm; fi

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
