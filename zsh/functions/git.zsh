#!/usr/bin/env zsh

gbd() {
  for pattern in "$@"; do
    git branch --list "$pattern" | tr -d ' *+' | while read -r branch; do
      if [[ -n "$branch" ]]; then
        # Check if branch is used by a worktree
        local worktree_path
        worktree_path=$(git worktree list --porcelain | grep -B2 "branch refs/heads/$branch$" | grep "^worktree " | cut -d' ' -f2-)

        if [[ -n "$worktree_path" ]]; then
          echo "Removing worktree: $worktree_path"
          git worktree remove --force "$worktree_path"
        fi

        git branch -D "$branch"
      fi
    done
  done
}
