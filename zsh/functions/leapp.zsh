# Function: sso
# Description: Performs actions on AWS Single Sign-On (SSO) sessions.
# Parameters:
#   - ACTION: The action to perform on the sessions. Default is 'start'.
sso() {
    ACTION=${1:-'start'}

    sessionsAWS=$(leapp session list \
        --filter="Type=AWS Single Sign-On" \
        --columns='ID,Role' \
        --csv &>/dev/null | \
        awk -F ',' '$2 ~ /sre/ { print $1 }')

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
