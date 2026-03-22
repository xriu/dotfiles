# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias .....="cd ../../../.."

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
alias zj-kill='zellij delete-all-sessions -y --force; and rm -rf ~/Library/Caches/org.Zellij-Contributors.Zellij; and killall zellij'

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
alias update="brew update; brew upgrade; brew cleanup; brew autoremove; pi update; opencode upgrade; rustup-update; npm-update; bun-update; pnpm-update"

# NPM
alias npm-update="npm update -g"
alias npm-list="npm list -g --depth=0"
alias npm-cache-clean="npm cache clean --force"

# Bun
alias bun-update="bun update -g"
alias bun-list="bun list -g --depth=0"

# PNPM
alias pnpm-update="pnpm update -g"
alias pnpm-list="pnpm list -g --depth=0"

# Rustup
alias rustup-update="rustup update"
alias rustup-list="rustup component list --installed"

# Zed
alias zed="/Applications/Zed.app/Contents/MacOS/cli"

# OpenCode
alias oc="OPENCODE_EXPERIMENTAL_LSP_TOOL=1 OPENCODE_ENABLE_EXA=1 OPENCODE_EXPERIMENTAL_PLAN_MODE=1 opencode"

# LM internal alias
functions -e lm 2>/dev/null
