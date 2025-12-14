#!/usr/bin/env zsh

# Delete git branches with wildcard support, worktree handling, and optional remote deletion
# Usage: gbd [-n|--dry-run] [-f|--force] [-r|--remote] <branch-pattern>...
gbd() {
  local dry_run=false force=false remote=false
  local patterns=()

  # Parse flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -n|--dry-run) dry_run=true; shift ;;
      -f|--force) force=true; shift ;;
      -r|--remote) remote=true; shift ;;
      -h|--help)
        echo "Usage: gbd [-n] [-f] [-r] <branch-pattern>..."
        echo "  -n, --dry-run  Preview without deleting"
        echo "  -f, --force    Skip confirmation prompt"
        echo "  -r, --remote   Also delete from origin"
        return 0
        ;;
      *) patterns+=("$1"); shift ;;
    esac
  done

  [[ ${#patterns[@]} -eq 0 ]] && { echo "Usage: gbd [-n] [-f] [-r] <branch-pattern>..."; return 1; }

  # Collect matching branches
  local to_delete=()
  for pattern in "${patterns[@]}"; do
    while IFS= read -r branch; do
      [[ -n "$branch" ]] && to_delete+=("$branch")
    done < <(git branch --list "$pattern" | tr -d ' *+')
  done

  if [[ ${#to_delete[@]} -eq 0 ]]; then
    echo "No branches match the pattern(s)"
    return 0
  fi

  # Preview
  echo "Branches to delete:"
  printf "  \033[36m%s\033[0m\n" "${to_delete[@]}"

  if $dry_run; then
    echo "(dry-run: no changes made)"
    return 0
  fi

  # Confirm if multiple branches and not forced
  if ! $force && [[ ${#to_delete[@]} -gt 1 ]]; then
    read -q "?Delete ${#to_delete[@]} branches? [y/N] " || { echo; return 1; }
    echo
  fi

  # Delete branches
  for branch in "${to_delete[@]}"; do
    # Handle worktree
    local worktree_path
    worktree_path=$(git worktree list --porcelain | grep -B2 "branch refs/heads/$branch$" | grep "^worktree " | cut -d' ' -f2-)
    if [[ -n "$worktree_path" ]]; then
      echo "\033[33mRemoving worktree: $worktree_path\033[0m"
      git worktree remove --force "$worktree_path"
    fi

    # Delete local branch
    if git branch -D "$branch" 2>/dev/null; then
      echo "\033[32mDeleted: $branch\033[0m"
    else
      echo "\033[31mFailed to delete: $branch\033[0m"
      continue
    fi

    # Delete remote branch
    if $remote; then
      if git push origin --delete "$branch" 2>/dev/null; then
        echo "\033[32mDeleted remote: origin/$branch\033[0m"
      fi
    fi
  done
}
