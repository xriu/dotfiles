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
alias ls="lla"
alias ll="ls -l --sort-dirs-first"

# Docker shortcuts
alias dc='docker-compose'
alias dcup='docker-compose up'
alias dcupd='docker-compose up -d'
alias dcdn='docker-compose down'

# IP address
alias ip="dig +short myip.opendns.com @resolver1.opendns.com"

# Recursively delete `.DS_Store` files
alias cleanup="find . -type f -name '*.DS_Store' -ls -delete"

# Brew
alias bh="brew home"
alias bi="brew install"
alias bu="brew uninstall --zap --force"
alias bt="brew tap"
alias btu="brew untap"
alias update="brew update; brew upgrade; brew cleanup; brew autoremove"
alias update-npm="npm update -g; npm install task-master-ai@latest -g"

# LM internal alias
if alias lm > /dev/null; then unalias lm; fi

# Task Master aliases
alias tm='task-master'
alias taskmaster='task-master'
