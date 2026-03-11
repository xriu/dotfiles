# Function: fexec
# Description: Prints a colored error message with a red circle emoji.
# Parameters:
#   - $argv: The message to be printed.
function fexec
    echo
    echo -n " 🔴 "
    set_color red
    echo -n " $argv "
    set_color normal
    echo
    echo
end
