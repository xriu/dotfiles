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

# Git
alias gpull="git pull"
alias gpush="git push"
alias gcommit="git commit"
alias gadd="git add"
alias gstatus="git status"
alias gmerge="git merge main"

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

# Zellij
alias zj-kill='zellij delete-all-sessions -y --force && rm -rf ~/Library/Caches/org.Zellij-Contributors.Zellij && killall zellij'

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

# NPM
alias npm-update="npm update -g"
alias npm-list="npm list -g --depth=0"
alias npm-cache-clean="npm cache clean --force"

# BUN
alias bun-update="bun update -g"
alias bun-list="bun list -g --depth=0"

# PNPM
alias pnpm-update="pnpm update -g"
alias pnpm-list="pnpm list -g --depth=0"

# Zed
alias zed="/Applications/Zed.app/Contents/MacOS/cli"

# Synthetic
alias q_synthetic='curl -s https://api.synthetic.new/v2/quotas \
  -H "Authorization: Bearer ${Z_AI_API_KEY}" \
  | jq --color-output .'


# LM internal alias
if alias lm > /dev/null; then unalias lm; fi

