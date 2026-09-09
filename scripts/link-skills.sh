#!/usr/bin/env bash
set -euo pipefail

readonly DOTFILES="$HOME/dotfiles"
readonly SKILLS_SOURCE="$DOTFILES/.skills"
readonly SKILLS_DEST="$DOTFILES/home/.agents/skills"

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

if [[ -L "$SKILLS_DEST" ]]; then
    printf 'Skills destination must be a real directory: %s\n' "$SKILLS_DEST" >&2
    exit 1
fi
mkdir -p "$SKILLS_DEST"

skill_names=()
skill_dirs=()

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
done < <(find "$SKILLS_SOURCE" -type f -name SKILL.md -print0)

if [[ "${#skill_names[@]}" -eq 0 ]]; then
    printf 'No skills found under: %s\n' "$SKILLS_SOURCE" >&2
    exit 1
fi

# The destination is flat: remove the old nested tree before linking each skill.
while IFS= read -r -d '' entry; do
    if [[ -L "$entry" ]]; then
        rm "$entry"
    else
        rm -rf "$entry"
    fi
done < <(find "$SKILLS_DEST" -mindepth 1 -maxdepth 1 -print0)

for index in "${!skill_names[@]}"; do
    skill_name="${skill_names[$index]}"
    skill_dir="${skill_dirs[$index]}"
    skill_dest="$SKILLS_DEST/$skill_name"

    ln -s "$skill_dir" "$skill_dest"
    printf 'Linked skill: %s -> %s\n' "$skill_dest" "$skill_dir"
done

printf 'Linked %d skills into flat destination: %s\n' "${#skill_names[@]}" "$SKILLS_DEST"
