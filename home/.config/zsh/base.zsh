# Function: cexec
# Description: Executes a command and prints a colored message indicating success.
# Parameters:
#   - $@: The command to be executed.
cexec() {
    echo ""
    echo -e " 🟢 \e[32m $@ \e[0m "
    echo ""
    "$@"
}

# Function: fexec
# Description: This function prints a colored message with a red circle emoji.
# Parameters:
#   - $@: The message to be printed.
fexec() {
    echo ""
    echo -e " 🔴 \e[31m $@ \e[0m "
    echo ""
}
