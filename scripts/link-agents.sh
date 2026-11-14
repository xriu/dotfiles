#!/usr/bin/env bash
# Usage: link-agents.sh skills|config [skills|config]
#   skills  publish every skill under home/.skills into ~/.agents/skills and ~/.claude/skills
#   config  link agent config from home/ into ~/.agents, ~/.pi/agent and ~/.claude
set -euo pipefail

readonly HOME_SRC="$HOME/dotfiles/home"
readonly SKILLS_SOURCE="$HOME_SRC/.skills"
readonly SKILLS_DESTS=("$HOME/.agents/skills" "$HOME/.claude/skills")
readonly BACKUP_DIR="$HOME/.dotfiles-backup/$(date +%Y%m%d-%H%M%S)"

# link <source> <destination>: symlink a dotfiles path into $HOME. An existing
# real file is moved to the backup dir first; a correct link is left alone.
link() {
    local src="$1" dest="$2"

    if [[ -L "$dest" && "$(readlink "$dest")" == "$src" ]]; then
        return
    fi
    if [[ -e "$dest" || -L "$dest" ]]; then
        mkdir -p "$BACKUP_DIR"
        mv "$dest" "$BACKUP_DIR/${dest//\//_}"
        printf 'Backed up: %s -> %s\n' "$dest" "$BACKUP_DIR"
    fi
    mkdir -p "$(dirname "$dest")"
    ln -s "$src" "$dest"
    printf 'Linked: %s -> %s\n' "$dest" "$src"
}

link_skills() {
    local skill_file skill_dir skill_name dest entry count
    local -A skills=()

    [[ -d "$SKILLS_SOURCE" ]] || { printf 'Skills source does not exist: %s\n' "$SKILLS_SOURCE" >&2; exit 1; }

    # .tmp is scratch space. Never publish skills that live inside it.
    while IFS= read -r -d '' skill_file; do
        skill_dir="${skill_file%/SKILL.md}"
        skill_name="${skill_dir##*/}"
        if [[ -n "${skills[$skill_name]:-}" ]]; then
            printf 'Duplicate skill name: %s\n' "$skill_name" >&2
            exit 1
        fi
        skills[$skill_name]="$skill_dir"
    done < <(find "$SKILLS_SOURCE" -type d -name .tmp -prune -o -type f -name SKILL.md -print0)

    [[ "${#skills[@]}" -gt 0 ]] || { printf 'No skills found under: %s\n' "$SKILLS_SOURCE" >&2; exit 1; }

    # One flat symlink per skill. Only our own links (including stale ones from
    # other machines, matched by */home/.skills/*) are removed; any other entry
    # belongs to another tool and stays untouched.
    for dest in "${SKILLS_DESTS[@]}"; do
        if [[ -L "$dest" ]]; then
            printf 'Skills destination must be a real directory: %s\n' "$dest" >&2
            exit 1
        fi
        mkdir -p "$dest"
        while IFS= read -r -d '' entry; do
            rm "$entry"
        done < <(find "$dest" -mindepth 1 -maxdepth 1 -type l -lname '*/home/.skills/*' -print0)

        count=0
        for skill_name in "${!skills[@]}"; do
            if [[ -e "$dest/$skill_name" || -L "$dest/$skill_name" ]]; then
                printf 'Skipped skill, name in use: %s\n' "$dest/$skill_name" >&2
                continue
            fi
            ln -s "${skills[$skill_name]}" "$dest/$skill_name"
            count=$((count + 1))
        done
        printf 'Linked %d of %d skills into: %s\n' "$count" "${#skills[@]}" "$dest"
    done
}

link_config() {
    local name

    # Shared agent instructions. ~/.agents/skills is managed by `skills`.
    link "$HOME_SRC/.agents/AGENTS.md" "$HOME/.agents/AGENTS.md"
    link "$HOME_SRC/.agents/pstack-models.md" "$HOME/.agents/pstack-models.md"

    # pi. auth.json, models-store.json and sessions stay local. subagent-manager
    # is copied by bin/agents.sh because it rejects symlinks.
    for name in AGENTS.md settings.json clarify.json cloak.json mcp.json models.json web-search.json prompts; do
        link "$HOME_SRC/.pi/agent/$name" "$HOME/.pi/agent/$name"
    done

    # Claude Code. Runtime state (credentials, history, skills) stays local.
    for name in settings.json status-line.sh rules; do
        link "$HOME_SRC/.claude/$name" "$HOME/.claude/$name"
    done
}

if [[ $# -eq 0 ]]; then
    printf 'Usage: %s skills|config [skills|config]\n' "${0##*/}" >&2
    exit 1
fi

for target in "$@"; do
    case "$target" in
        skills) link_skills ;;
        config) link_config ;;
        *) printf 'Unknown target: %s (expected skills or config)\n' "$target" >&2; exit 1 ;;
    esac
done
