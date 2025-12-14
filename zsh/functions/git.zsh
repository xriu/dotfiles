#!/usr/bin/env zsh

gbd() {
  for pattern in "$@"; do
    git branch --list "$pattern" | tr -d ' *' | while read -r branch; do
      [[ -n "$branch" ]] && git branch -D "$branch"
    done
  done
}
