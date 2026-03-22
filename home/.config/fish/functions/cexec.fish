# Function: cexec
# Description: Executes a command and prints a colored message indicating success.
# Parameters:
#   - $argv: The command to be executed.
function cexec
    echo
    echo -n " 🟢 "
    set_color green
    echo -n " $argv "
    set_color normal
    echo
    echo
    $argv
end
