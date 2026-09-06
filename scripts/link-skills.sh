#!/bin/bash

set -euo pipefail

readonly SKILLS_ROOT="/Users/xavier.riu/dotfiles/home/.agents/skills"
readonly SKILLS_LINK="/Users/xavier.riu/dotfiles/.skills"

if [[ ! -d "$SKILLS_ROOT" ]]; then
    printf 'Skills root does not exist: %s\n' "$SKILLS_ROOT" >&2
    exit 1
fi

if [[ -L "$SKILLS_LINK" ]]; then
    [[ "$(readlink "$SKILLS_LINK")" == "$SKILLS_ROOT" ]] && exit 0
    rm "$SKILLS_LINK"
elif [[ -d "$SKILLS_LINK" ]]; then
    if ! diff -qr "$SKILLS_LINK" "$SKILLS_ROOT" >/dev/null; then
        printf 'Refusing to replace non-matching directory: %s\n' "$SKILLS_LINK" >&2
        exit 1
    fi
    rm -rf "$SKILLS_LINK"
elif [[ -e "$SKILLS_LINK" ]]; then
    printf 'Refusing to replace existing path: %s\n' "$SKILLS_LINK" >&2
    exit 1
fi

# Link the root once. Nested skill directories resolve through this link.
ln -s "$SKILLS_ROOT" "$SKILLS_LINK"
