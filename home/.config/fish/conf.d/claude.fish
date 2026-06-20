# Claude Code multi-provider switcher
# Mirrors ~/.claude/claude.zsh: configures env vars and execs `claude`
command -q claude; or return

# Generic helper: _configure_claude_provider <provider_name> <api_key_var> <model> [-- args...]
function _configure_claude_provider
    set -l provider $argv[1]
    set -l api_key_var $argv[2]
    set -l model $argv[3]

    # Validate inputs
    if test -z "$provider"; or test -z "$api_key_var"; or test -z "$model"
        echo "Error: Missing required parameters: provider, api_key_var, model" >&2
        return 1
    end

    # Validate API key exists (indirect variable expansion)
    if not set -q $api_key_var
        echo "Error: API key $api_key_var is not set" >&2
        return 1
    end
    set -l api_key_value (eval "echo \$$api_key_var")

    # Set common environment variables
    set -gx ANTHROPIC_BASE_URL "https://api.synthetic.new/anthropic"
    set -gx ANTHROPIC_AUTH_TOKEN "$api_key_value"
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

    # Execute claude with any remaining arguments (skip first 3)
    if set -q argv[4]
        claude $argv[4..-1]
    else
        echo "Claude configured for provider: $provider"
        echo "Model: $model"
        echo "Run 'claude' to start the interactive session"
    end
end

function minimax
    _configure_claude_provider minimax SYNTHETIC_API_KEY "hf:MiniMaxAI/MiniMax-M3" $argv
end

# --- Reset to Default (Local Anthropic) ---
# Usage: claude_reset
function claude_reset
    set -e ANTHROPIC_BASE_URL ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN
    set -e ANTHROPIC_MODEL CLAUDE_CODE_SUBAGENT_MODEL ANTHROPIC_DEFAULT_HAIKU_MODEL ANTHROPIC_DEFAULT_SONNET_MODEL ANTHROPIC_DEFAULT_OPUS_MODEL
    set -e CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
    echo "Claude environment has been reset to default."
end
