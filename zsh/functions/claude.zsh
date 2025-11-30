# === CLAUDE CODE MULTI-PROVIDER SWITCHER ===
# Assumes 'claude' is in your PATH (e.g., installed via `npm install -g @anthropic-ai/claude-code`)

# Generic function to configure Claude with a specific provider
# Usage: _configure_claude_provider <provider_name> <api_key_var> <model> [-- args...]
_configure_claude_provider() {
    local provider="$1"
    local api_key_var="$2"
    local model="$3"
    shift 3  # Remove the first 3 arguments, pass the rest to claude

    # Validate inputs
    if [[ -z "$provider" || -z "$api_key_var" || -z "$model" ]]; then
        echo "Error: Missing required parameters: provider, api_key_var, model" >&2
        return 1
    fi

    # Validate API key exists
    local api_key_value="${(P)api_key_var}"
    if [[ -z "$api_key_value" ]]; then
        echo "Error: API key $api_key_var is not set" >&2
        return 1
    fi

    # Set common environment variables
    export ANTHROPIC_BASE_URL="https://api.synthetic.new/anthropic"
    export ANTHROPIC_AUTH_TOKEN="$api_key_value"
    export ANTHROPIC_MODEL="$model"
    export CLAUDE_CODE_SUBAGENT_MODEL="$model"
    export ANTHROPIC_DEFAULT_HAIKU_MODEL="$model"
    export ANTHROPIC_DEFAULT_SONNET_MODEL="$model"
    export ANTHROPIC_DEFAULT_OPUS_MODEL="$model"
    export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

    # Execute claude with any remaining arguments
    if [[ $# -gt 0 ]]; then
        claude "$@"
    else
        echo "Claude configured for provider: $provider"
        echo "Model: $model"
        echo "Run 'claude' to start the interactive session"
    fi
}

# --- DeepSeek Configuration ---
# Usage: deepseek [-- args...]
deepseek() {
    _configure_claude_provider "deepseek" "DEEPSEEK_API_KEY" "hf:deepseek-ai/DeepSeek-V3.1-Terminus" "$@"
}

# --- z.ai (GLM) Configuration ---
# Usage: glm [-- args...]
glm() {
    _configure_claude_provider "glm" "Z_AI_API_KEY" "hf:zai-org/GLM-4.6" "$@"
}

# --- Kimi (Moonshot AI) Configuration ---
# Usage: kimi [-- args...]
kimi() {
    _configure_claude_provider "kimi" "KIMI_API_KEY" "hf:moonshotai/Kimi-K2-Thinking" "$@"
}

minimax() {
    _configure_claude_provider "minimax" "MINIMAX_API_KEY" "hf:MiniMaxAI/MiniMax-M2" "$@"
}

# --- Reset to Default (Local Anthropic) ---
# Usage: claude_reset
claude_reset() {
    unset ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN
    unset ANTHROPIC_MODEL CLAUDE_CODE_SUBAGENT_MODEL ANTHROPIC_DEFAULT_HAIKU_MODEL ANTHROPIC_DEFAULT_SONNET_MODEL ANTHROPIC_DEFAULT_OPUS_MODEL
    unset CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
    echo "Claude environment has been reset to default."
}
