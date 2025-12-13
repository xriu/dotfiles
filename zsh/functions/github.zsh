#!/usr/bin/env zsh

gbd() {
  for branch in "$@"; do
    git branch -D "$branch"
  done
}
