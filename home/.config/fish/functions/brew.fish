# Function: brew
# Description: Wraps the `brew` command to automatically set HOMEBREW_NO_ASK=1
#   when the first argument is `upgrade`, skipping interactive confirmation prompts.
#   All other subcommands pass through unchanged.
# Parameters:
#   - $argv: All arguments forwarded to the real `brew` binary.
function brew
    if test (count $argv) -gt 0 -a "$argv[1]" = upgrade
        echo "auto-setting HOMEBREW_NO_ASK=1"
        env HOMEBREW_NO_ASK=1 command brew $argv
    else
        command brew $argv
    end
end
