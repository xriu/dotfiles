#!/usr/bin/env bash
set -euo pipefail

readonly DOTFILES="$HOME/dotfiles"
readonly SKILLS_SOURCE="$DOTFILES/home/.skills"
readonly SKILLS_DEST="$DOTFILES/home/.agents/skills"
readonly CLAUDE_SKILLS_DEST="$HOME/.claude/skills"

# The source must be independent from the destination. Migrate the old root
# link once, then keep the canonical skill tree in .skills.
if [[ -L "$SKILLS_SOURCE" ]]; then
    source_target="$(readlink "$SKILLS_SOURCE")"
    if [[ "$source_target" != "$SKILLS_DEST" ]]; then
        printf 'Refusing unexpected source link: %s -> %s\n' "$SKILLS_SOURCE" "$source_target" >&2
        exit 1
    fi

    printf 'Moving canonical skills to source: %s\n' "$SKILLS_SOURCE"
    while IFS= read -r -d '' entry; do
        rm "$entry"
    done < <(find "$SKILLS_DEST" -mindepth 1 -maxdepth 1 -type l -print0)
    rm "$SKILLS_SOURCE"
    mv "$SKILLS_DEST" "$SKILLS_SOURCE"
elif [[ ! -d "$SKILLS_SOURCE" ]]; then
    printf 'Skills source does not exist: %s\n' "$SKILLS_SOURCE" >&2
    exit 1
fi

skill_names=()
skill_dirs=()

# .tmp is scratch space. Never publish skills that live inside it.
while IFS= read -r -d '' skill_file; do
    skill_dir="${skill_file%/SKILL.md}"
    skill_name="${skill_dir##*/}"

    for existing_name in "${skill_names[@]}"; do
        if [[ "$existing_name" == "$skill_name" ]]; then
            printf 'Duplicate skill name: %s\n' "$skill_name" >&2
            exit 1
        fi
    done

    skill_names+=("$skill_name")
    skill_dirs+=("$skill_dir")
done < <(find "$SKILLS_SOURCE" -type d -name .tmp -prune -o -type f -name SKILL.md -print0)

if [[ "${#skill_names[@]}" -eq 0 ]]; then
    printf 'No skills found under: %s\n' "$SKILLS_SOURCE" >&2
    exit 1
fi

# Publish one flat symlink per skill. Only our own links are removed or
# replaced: any other entry belongs to another tool and stays untouched.
publish_skills() {
    local dest="$1"
    local index skill_name skill_dir skill_dest count=0

    if [[ -L "$dest" ]]; then
        printf 'Skills destination must be a real directory: %s\n' "$dest" >&2
        exit 1
    fi
    mkdir -p "$dest"

    while IFS= read -r -d '' entry; do
        rm "$entry"
    done < <(find "$dest" -mindepth 1 -maxdepth 1 -type l -lname "$SKILLS_SOURCE/*" -print0)

    for index in "${!skill_names[@]}"; do
        skill_name="${skill_names[$index]}"
        skill_dir="${skill_dirs[$index]}"
        skill_dest="$dest/$skill_name"

        if [[ -e "$skill_dest" || -L "$skill_dest" ]]; then
            printf 'Skipped skill, name in use: %s\n' "$skill_dest" >&2
            continue
        fi
        ln -s "$skill_dir" "$skill_dest"
        count=$((count + 1))
        printf 'Linked skill: %s -> %s\n' "$skill_dest" "$skill_dir"
    done

    printf 'Linked %d of %d skills into: %s\n' "$count" "${#skill_names[@]}" "$dest"
}

publish_skills "$SKILLS_DEST"
publish_skills "$CLAUDE_SKILLS_DEST"
