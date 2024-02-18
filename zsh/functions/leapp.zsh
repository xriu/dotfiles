sso() {
    ACTION=${1:-'start'}

    sessionsAWS=$(leapp session list \
        --filter="Type=AWS Single Sign-On" \
        --columns='ID,Session Name,Named Profile' \
        --csv &>/dev/null | \
        awk -F ',' '$3 != "default" { print $1 }')

    sessions=()
    while IFS= read -r line; do
        sessions+=("$line")
    done <<< "$sessionsAWS"
    sessions=("${sessions[@]:1}")

    for item in "${sessions[@]}"; do
        cexec leapp session ${ACTION} --sessionId "${item}" &>/dev/null
        if [[ "${ACTION}" == "start" ]]; then
            echo "🚀 Connecting ... ${item}"
        elif [[ "${ACTION}" == "stop" ]]; then
            echo "👋 Disconnecting ... ${item}"
        fi
        echo ""
    done

    return 0
}


