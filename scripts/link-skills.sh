#!/bin/bash

set -euo pipefail

if [[ "${DEBUG:-0}" == "1" ]]; then
    PS4='+ ${BASH_SOURCE}:${LINENO}: '
    set -x
fi

readonly SKILLS_ROOT="/Users/xavier.riu/dotfiles/home/.agents/skills"
readonly SKILLS_LINK="/Users/xavier.riu/dotfiles/.skills"

if [[ ! -d "$SKILLS_ROOT" ]]; then
    printf 'Skills root does not exist: %s\n' "$SKILLS_ROOT" >&2
    exit 1
fi

if [[ -L "$SKILLS_LINK" ]]; then
    current_target="$(readlink "$SKILLS_LINK")"
    if [[ "$current_target" == "$SKILLS_ROOT" ]]; then
        printf 'Already linked: %s -> %s\n' "$SKILLS_LINK" "$SKILLS_ROOT"
    else
        printf 'Replacing link: %s -> %s\n' "$SKILLS_LINK" "$current_target"
        rm "$SKILLS_LINK"
        ln -s "$SKILLS_ROOT" "$SKILLS_LINK"
    fi
elif [[ -d "$SKILLS_LINK" ]]; then
    if ! diff -qr "$SKILLS_LINK" "$SKILLS_ROOT" >/dev/null; then
        printf 'Refusing to replace non-matching directory: %s\n' "$SKILLS_LINK" >&2
        exit 1
    fi
    rm -rf "$SKILLS_LINK"
    ln -s "$SKILLS_ROOT" "$SKILLS_LINK"
elif [[ -e "$SKILLS_LINK" ]]; then
    printf 'Refusing to replace existing path: %s\n' "$SKILLS_LINK" >&2
    exit 1
else
    # Link the root once. Nested skill directories resolve through this link.
    ln -s "$SKILLS_ROOT" "$SKILLS_LINK"
    printf 'Created link: %s -> %s\n' "$SKILLS_LINK" "$SKILLS_ROOT"
fi

linked=0
existing=0

while IFS= read -r -d '' skill_file; do
    skill_dir="${skill_file%/SKILL.md}"
    relative_dir="${skill_dir#"$SKILLS_ROOT/"}"

    # A skill is nested when its directory has a parent below the root.
    [[ "$relative_dir" == */* ]] || continue

    skill_name="${skill_dir##*/}"
    skill_link="$SKILLS_ROOT/$skill_name"

    if [[ -L "$skill_link" ]]; then
        current_target="$(readlink "$skill_link")"
        if [[ "$current_target" == "$skill_dir" ]]; then
            printf 'Already linked skill: %s -> %s\n' "$skill_link" "$skill_dir"
            existing=$((existing + 1))
            continue
        fi
        printf 'Replacing skill link: %s -> %s\n' "$skill_link" "$current_target"
        rm "$skill_link"
    elif [[ -e "$skill_link" ]]; then
        printf 'Refusing to overwrite existing skill: %s\n' "$skill_link" >&2
        exit 1
    fi

    ln -s "$skill_dir" "$skill_link"
    printf 'Linked skill: %s -> %s\n' "$skill_link" "$skill_dir"
    linked=$((linked + 1))
done < <(find "$SKILLS_ROOT" -type f -name SKILL.md -print0)

printf 'Nested skills linked: %d new, %d already linked\n' "$linked" "$existing"
