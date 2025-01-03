#!/usr/bin/env zsh

# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias .....="cd ../../../.."
alias -- -="cd -"

# Grep
alias grep="grep --color=auto"
alias fgrep="fgrep --color=auto"
alias egrep="egrep --color=auto"

# Cat with syntax highlighting
alias cat="bat"

# List
alias ls="gls --color"
alias ll="ls -alh --group-directories-first"

# Docker shortcuts
alias dc='docker-compose'
alias dcup='docker-compose up'
alias dcupd='docker-compose up -d'
alias dcdn='docker-compose down'

# Brew update


# IP address
alias ip="dig +short myip.opendns.com @resolver1.opendns.com"

# Recursively delete `.DS_Store` files
alias cleanup="find . -type f -name '*.DS_Store' -ls -delete"

# Brew
alias bh="brew home"
alias bi="brew install"
alias bu="brew uninstall --zap --force"
alias update='brew update; brew upgrade; brew cleanup; brew autoremove'

# LM internal alias
if alias lm > /dev/null; then unalias lm; fi
