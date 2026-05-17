# Unset the default fish greeting text which messes up Zellij
set fish_greeting

# Load local overrides (machine-specific settings)
test -f ~/.config/fish/config.local.fish; and source ~/.config/fish/config.local.fish

# Exports
set -gx LC_ALL $LANG
set -gx GPG_TTY (tty)
set -gx JAVA_HOME /Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home

# Source multi-function files (Fish autoloading only works for single-function files)
source $HOME/.config/fish/functions/terraform.fish
source $HOME/.config/fish/functions/terragrunt.fish

# PATH (paths handled by conf.d/ files are excluded: brew, bun, cargo, pnpm, fnm)
fish_add_path /usr/bin
fish_add_path /usr/local/bin
fish_add_path /opt/homebrew/bin
fish_add_path $HOME/.cargo/bin
fish_add_path $JAVA_HOME/bin
fish_add_path $HOME/bin
fish_add_path $HOME/.amp/bin
fish_add_path $HOME/.console-ninja/.bin
fish_add_path $HOME/.GIS-lm-build/bin
fish_add_path $HOME/.jenv/bin
fish_add_path $HOME/.local/bin
fish_add_path $HOME/.local/share/fnm
fish_add_path $HOME/.local/share/fnm/node-versions/v24.13.0/installation/bin
fish_add_path "/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin"

# Ensure cargo/rustup takes precedence over Homebrew's rust
set -gx PATH $HOME/.cargo/bin $PATH

# Check if we're in an interactive shell
if status is-interactive
    # 1. Define config but don't force export every time if not needed
    set -gx ZELLIJ_CONFIG_DIR $HOME/.config/zellij

    # 2. Only run if NOT already in Zellij AND NOT in a CMUX-managed task
    # This prevents the infinite loop and CMUX conflicts
    if not set -q ZELLIJ; and not set -q CMUX_SOCKET_PATH

        # 3. Use a broader check or remove the Ghostty-only restriction
        # if you want Zellij everywhere.
        if [ "$TERM" = "xterm-ghostty" ]
            set -gx ZELLIJ_AUTO_EXIT true
            set -gx ZELLIJ_AUTO_ATTACH true

            # Use 'exec' to replace the fish process with zellij
            # This is cleaner than eval for auto-starting
            exec zellij
        end
    end
end

