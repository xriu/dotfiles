#!/usr/bin/env zsh

# Function: sso
# Description: Connects or disconnects from AWS Single Sign-On (SSO) sessions.
# Parameters:
#   - ACTION: The action to perform. Defaults to 'start'.
# Returns:
#   - 0: If the function executes successfully.
#   - 1: If AWS Single Sign-On (SSO) integration is not available.
sso() {
    ACTION=${1:-'start'}

    echo "🔍 Checking AWS Single Sign-On (SSO) integration ..."

    # Checks if the AWS Single Sign-On (SSO) integration is available.
    # It uses the 'leapp' command to list the integrations and filters the output
    # to check if the 'AWS-SSO' integration is present. If it is not found, it
    # prints an error message and returns a non-zero exit code.
    leapp integration list --columns='Type' --no-header 2>/dev/null | \
        grep -q 'AWS-SSO' || {
        echo "AWS Single Sign-On (SSO) integration is not available."
        return 1
    }

    sessionsAWS=$(leapp session list \
        --filter="Type=AWS Single Sign-On" \
        --columns='ID,Role' \
        --csv &>/dev/null | \
        awk -F ',' '$2 ~ /sre/ { print $1 }')

    # Removes the first element of the 'sessions' array.
    sessions=()
    while IFS= read -r line; do
        sessions+=("$line")
    done <<< "$sessionsAWS"
    sessions=("${sessions[@]:1}")

    for item in "${sessions[@]}"; do
        echo ""
        if [[ "${ACTION}" == "start" ]]; then
            echo "🚀 Connecting ... ${item}"
        elif [[ "${ACTION}" == "stop" ]]; then
            echo "👋 Disconnecting ... ${item}"
        fi
        cexec leapp session ${ACTION} --sessionId "${item}" &>/dev/null
    done

    return 0
}
