# Claude Code multi-provider switcher
# Configures env vars for a chosen provider, then either execs `claude` (when
# passthrough args are given) or prints a hint for the user to run `claude`.
command -q claude; or return

# Generic helper: _configure_claude_provider <provider_name> <api_key_var> <model> <base_url> [-- args...]
function _configure_claude_provider
    set -l provider $argv[1]
    set -l api_key_var $argv[2]
    set -l model $argv[3]
    set -l base_url $argv[4]

    # Validate inputs
    if test -z "$provider"; or test -z "$api_key_var"; or test -z "$model"; or test -z "$base_url"
        echo "Error: Missing required parameters: provider, api_key_var, model, base_url" >&2
        return 1
    end

    # API key is now passed directly as a resolved value from the caller
    set -l api_key_value $api_key_var

    # Set common environment variables
    set -e ANTHROPIC_API_KEY
    set -gx ANTHROPIC_AUTH_TOKEN "$api_key_value"
    set -gx ANTHROPIC_BASE_URL "$base_url"
    set -gx ANTHROPIC_DEFAULT_HAIKU_MODEL "$model"
    set -gx ANTHROPIC_DEFAULT_OPUS_MODEL "$model"
    set -gx ANTHROPIC_DEFAULT_SONNET_MODEL "$model"
    set -gx ANTHROPIC_MODEL "$model"
    set -gx CLAUDE_CODE_DISABLE_1M_CONTEXT 1
    set -gx CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING 1
    set -gx CLAUDE_CODE_DISABLE_AUTO_MEMORY 0
    set -gx CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS 1
    set -gx CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC 1
    set -gx CLAUDE_CODE_ENABLE_AWAY_SUMMARY 0
    set -gx CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION true
    set -gx CLAUDE_CODE_ENABLE_TELEMETRY 0
    set -gx CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
    set -gx CLAUDE_CODE_NO_FLICKER 1
    set -gx CLAUDE_CODE_SUBAGENT_MODEL "$model"
    set -gx DISABLE_ERROR_REPORTING 1
    set -gx DISABLE_TELEMETRY 1

    # Execute claude with any remaining arguments (skip first 4)
    if set -q argv[5]
        claude $argv[5..-1]
    else
        echo "Claude configured for provider: $provider"
        echo "Model: $model"
        echo "Run 'claude' to start the interactive session"
    end
end

# Alibaba provider
function alibaba
    set -l provider "alibaba"
    set -l url "https://coding-intl.dashscope.aliyuncs.com/apps/anthropic"
    set -l apiKey $ALIBABA_API_KEY
    set -l model "qwen3.7-plus"
    _configure_claude_provider $provider $apiKey $model $url $argv
end

# Opencode provider
function opencode
    set -l provider "opencode"
    set -l url "https://opencode.ai/zen/go/v1/messages"
    set -l apiKey $OPENCODE_API_KEY
    set -l model "opencode-go/minimax-m3"
    _configure_claude_provider $provider $apiKey $model $url $argv
end

# --- Reset to Default (Local Anthropic) ---
# Usage: claude_reset
function claude_reset
    set -e ANTHROPIC_API_KEY
    set -e ANTHROPIC_AUTH_TOKEN
    set -e ANTHROPIC_BASE_URL
    set -e ANTHROPIC_DEFAULT_HAIKU_MODEL
    set -e ANTHROPIC_DEFAULT_OPUS_MODEL
    set -e ANTHROPIC_DEFAULT_SONNET_MODEL
    set -e ANTHROPIC_MODEL
    set -e CLAUDE_CODE_DISABLE_1M_CONTEXT
    set -e CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING
    set -e CLAUDE_CODE_DISABLE_AUTO_MEMORY
    set -e CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS
    set -e CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
    set -e CLAUDE_CODE_ENABLE_AWAY_SUMMARY
    set -e CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION
    set -e CLAUDE_CODE_ENABLE_TELEMETRY
    set -e CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
    set -e CLAUDE_CODE_NO_FLICKER
    set -e CLAUDE_CODE_SUBAGENT_MODEL
    set -e DISABLE_ERROR_REPORTING
    set -e DISABLE_TELEMETRY
    echo "Claude environment has been reset to default."
end
