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

# Check if we're in an interactive shell
if status is-interactive

    # At this point, specify the Zellij config dir, so we can launch it manually if we want to
    export ZELLIJ_CONFIG_DIR=$HOME/.config/zellij

    # Check if our Terminal emulator is Ghostty
    if [ "$TERM" = "xterm-ghostty" ]
        set -gx ZELLIJ_AUTO_EXIT true
        set -gx ZELLIJ_AUTO_ATTACH true
        eval (zellij setup --generate-auto-start fish | string collect)
    end

end
