#!/bin/bash

# Install packages
function install_osx_packages() {

    # Install Homebrew when missing
    if ! command -v brew >/dev/null 2>&1; then
        echo "Installing homebrew"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    # Update
    brew update

    brew_setup || return 1
    mise_setup || return 1
    mac_setup || return 1
    fish_setup || return 1

    # Cleanup
    brew cleanup

}

# Brew install
function brew_setup() {

    echo "Brew install packages"

    local brewfile_src="$HOME/dotfiles/home/.homebrew/Brewfile"
    local brewfile_dst="$HOME/.homebrew/Brewfile"

    link_dotfile "$brewfile_src" "$brewfile_dst" || return 1

    # Install Rosetta when missing
    if [[ ! -f /Library/Apple/usr/share/rosetta/rosetta ]]; then
        softwareupdate --install-rosetta --agree-to-license
    fi

    # Trust every third-party tap declared in Brewfile before brew bundle loads it.
    local tap
    local -a taps=()
    while IFS= read -r tap; do
        [[ -n "$tap" ]] && taps+=("$tap")
    done < <(HOMEBREW_NO_AUTO_UPDATE=1 brew bundle list --tap --file="$brewfile_dst")

    if [[ ${#taps[@]} -gt 0 ]]; then
        brew trust --tap "${taps[@]}"
    fi

    brew bundle --file="$brewfile_dst"

}

# Link a dotfiles path into $HOME without overwriting unmanaged paths.
function link_dotfile() {

    local src="$1"
    local dst="$2"

    if [[ ! -e "$src" ]]; then
        echo "Missing dotfile source: $src" >&2
        return 1
    fi

    mkdir -p "$(dirname "$dst")"

    if [[ -L "$dst" && "$(readlink "$dst")" == "$src" ]]; then
        return 0
    elif [[ -e "$dst" || -L "$dst" ]]; then
        # Keep an unmanaged path instead of overwriting it.
        echo "Existing path found at $dst; preserve or remove it before setup." >&2
        return 1
    fi

    ln -s "$src" "$dst"

}

function mise_setup() {

    echo "Mise setup"

    link_dotfile \
        "$HOME/dotfiles/home/.config/mise/config.toml" \
        "$HOME/.config/mise/config.toml" || return 1

    # Install every tool configured in ~/.config/mise/config.toml.
    mise --cd "$HOME" install

    # mise does not create macOS app entries, so link each app bundle from Applications.
    local installs="$HOME/.local/share/mise/installs"
    local rel
    mkdir -p "$HOME/Applications"
    for rel in \
        "github-huacnlee-disktree/latest/Disktree.app" \
        "github-huacnlee-brewman/latest/Brewman.app"; do
        if [[ -d "$installs/$rel" ]]; then
            ln -sfn "$installs/$rel" "$HOME/Applications/${rel##*/}"
        fi
    done

}

function mac_setup() {

    echo "JENV set java virtual machines"
    jenv add /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home

}

function fish_setup() {

    echo "Fish install"

    local fish_src="$HOME/dotfiles/home/.config/fish"
    local fish_dst="$HOME/.config/fish"

    # Configure Fish
    link_dotfile "$fish_src/conf.d" "$fish_dst/conf.d" || return 1
    link_dotfile "$fish_src/functions" "$fish_dst/functions" || return 1
    link_dotfile "$fish_src/completions" "$fish_dst/completions" || return 1
    link_dotfile "$fish_src/config.fish" "$fish_dst/config.fish" || return 1
    link_dotfile "$HOME/dotfiles/home/.config/starship.toml" "$HOME/.config/starship.toml" || return 1

    # Add Fish to /etc/shells and set it as the default shell
    local fish_bin
    fish_bin="$(command -v fish)"
    if ! grep -qxF "$fish_bin" /etc/shells; then
        echo "$fish_bin" | sudo tee -a /etc/shells >/dev/null
    fi
    if [[ "${SHELL:-}" != "$fish_bin" ]]; then
        chsh -s "$fish_bin"
    fi

}

# Run setup when executed directly instead of sourced.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    set -euo pipefail
    install_osx_packages
fi
