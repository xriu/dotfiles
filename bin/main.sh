#!/bin/bash

# Function to get the architecture of the system
function get_arch() {

    if [[ $(uname -m) == 'arm64' ]]; then
        echo "arm64"
    else
        echo "unknown"
    fi

}

# Install packages for the current CPU architecture.
function install_packages() {

    local arch
    arch="$(get_arch)"
    if [[ "$arch" == "arm64" ]]; then
        local script_dir
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        source "$script_dir/osx.sh"
        install_osx_packages
    else
        echo "Arch $arch not supported" >&2
        return 1
    fi

}

# Apply common user and system configuration.
function common_configuration() {

    # Create default folders for development and local tools
    mkdir -p "$HOME/Develop" \
        "$HOME/.ssh" \
        "$HOME/.config" \
        "$HOME/.aws" \
        "$HOME/.jenv" \
        "$HOME/.GIS-lm-build" \
        "$HOME/Pictures/screenshots"
    chmod 700 "$HOME/.ssh"

    # Hide the terminal login banner
    touch "$HOME/.hushlogin"

    # Configure Git global defaults
    git config --global push.default simple
    git config --global pull.rebase merges
    git config --global merge.ff false
    git config --global merge.tool vimdiff
    git config --global mergetool.prompt false
    git config --global url."git@github.com:".insteadOf "https://github.com/"
    git config --global --bool push.autoSetupRemote true

    # Copy SSH config when missing
    if [[ ! -f "$HOME/.ssh/config" ]]; then
        cp "$HOME/dotfiles/home/ssh/config" "$HOME/.ssh/config"
        chmod 600 "$HOME/.ssh/config"
    fi

    # Generate an SSH key for GitHub when missing
    if [[ ! -f "$HOME/.ssh/id_github" ]]; then
        ssh-keygen -t rsa -f "$HOME/.ssh/id_github" -q -P ""
        cat "$HOME/.ssh/id_github.pub"
    fi

    # Link Homebrew binaries for tools that hardcode /usr/local/bin
    local bin
    for bin in aws session-manager-plugin; do
        if [[ "$(readlink "/usr/local/bin/$bin" 2>/dev/null || true)" != "/opt/homebrew/bin/$bin" ]]; then
            sudo mkdir -p /usr/local/bin
            sudo ln -sfn "/opt/homebrew/bin/$bin" "/usr/local/bin/$bin"
        fi
    done

    # Mute the startup chime when not already muted
    if [[ "$(nvram SystemAudioVolume 2>/dev/null | awk '{print $2}' || true)" != "%80" ]]; then
        sudo nvram SystemAudioVolume=%80
    fi

}
