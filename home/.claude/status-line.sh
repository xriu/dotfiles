#!/bin/bash
# Custom status line for Claude Code CLI
# Place this file at ~/.claude/status-line.sh and make it executable: chmod +x ~/.claude/status-line.sh
# Configure it in settings.json with: "status-line": { "type": "command", "command": "~/.claude/status-line.sh" }
#
# Requires: jq (brew install jq)

input=$(</dev/stdin)

{
    read -r MODEL
    read -r DIR
    read -r IN_TOK
    read -r OUT_TOK
    read -r CTX_SIZE
    read -r PCT_RAW
    read -r EFFORT
    read -r THINKING
    read -r FH_PCT_RAW
    read -r FH_RESET
    read -r WK_PCT_RAW
    read -r WK_RESET
    read -r COST
} < <(jq -r '
    .model.display_name,
    .workspace.current_dir,
    (.context_window.total_input_tokens // 0),
    (.context_window.total_output_tokens // 0),
    (.context_window.context_window_size // 200000),
    (.context_window.used_percentage // 0),
    (.effort.level // ""),
    (.thinking.enabled // false),
    (.rate_limits.five_hour.used_percentage // ""),
    (.rate_limits.five_hour.resets_at // ""),
    (.rate_limits.seven_day.used_percentage // ""),
    (.rate_limits.seven_day.resets_at // ""),
    (.cost.total_cost_usd // 0)
' <<< "$input")

PCT=${PCT_RAW%.*}

# ANSI colors
BLUE='\033[38;5;75m'    # model
TEAL='\033[38;5;73m'    # dir@branch
ORANGE='\033[38;5;215m' # token usage
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
DIM='\033[2m'
BOLD='\033[1m'
RESET='\033[0m'

# Color by usage: green < 70%, yellow 70-89%, red >= 90%
pct_color() {
    local p=${1%.*}
    [ -z "$p" ] && p=0
    if [ "$p" -ge 90 ]; then printf '%s' "$RED"
    elif [ "$p" -ge 70 ]; then printf '%s' "$YELLOW"
    else printf '%s' "$GREEN"; fi
}

# Color by effort: low=dim, medium=yellow, high/xhigh/max=green
effort_color() {
    case "$1" in
        high|xhigh|max) printf '%s' "$GREEN" ;;
        medium) printf '%s' "$YELLOW" ;;
        low) printf '%s' "$DIM" ;;
        *) printf '%s' "$GREEN" ;;
    esac
}

# Format token count: 1234 -> 1.2k, 200000 -> 200k
fmt_tokens() {
    local n=$1
    if [ "$n" -ge 10000 ]; then
        printf '%dk' "$((n / 1000))"
    elif [ "$n" -ge 1000 ]; then
        printf '%d.%dk' "$((n / 1000))" "$(( (n % 1000) / 100 ))"
    else
        printf '%d' "$n"
    fi
}

# Format an epoch via BSD (macOS) or GNU date, lowercased with padding trimmed.
# Examples: "%l:%M%p" -> "11:00am"; "%b %e, %l:%M%p" -> "mar 6, 10:00am".
fmt_time() {
    local epoch=$1 fmt=$2
    [ -z "$epoch" ] && return
    local out
    out=$(date -r "$epoch" +"$fmt" 2>/dev/null || date -d "@$epoch" +"$fmt" 2>/dev/null) || return
    printf '%s' "$out" | tr '[:upper:]' '[:lower:]' | tr -s ' ' | sed 's/^ //;s/ ,/,/'
}

SEP=" ${DIM}|${RESET} "
OUT="${BLUE}${MODEL}${RESET}"

# dir@branch
DIR_NAME=${DIR##*/}
BRANCH=""
git rev-parse --git-dir >/dev/null 2>&1 && BRANCH=$(git branch --show-current 2>/dev/null)
if [ -n "$BRANCH" ]; then
    [ ${#BRANCH} -gt 30 ] && BRANCH="${BRANCH:0:30}…"
    OUT="${OUT}${SEP}${TEAL}${DIR_NAME}${DIM}@${RESET}${TEAL}${BRANCH}${RESET}"
else
    OUT="${OUT}${SEP}${TEAL}${DIR_NAME}${RESET}"
fi

# Context window: "1.2k/200k (8%)"
USED_TOK=$((IN_TOK + OUT_TOK))
TOK_FMT=$(fmt_tokens "$USED_TOK")
CTX_FMT=$(fmt_tokens "$CTX_SIZE")
PCT_C=$(pct_color "$PCT")
OUT="${OUT}${SEP}${ORANGE}${TOK_FMT}/${CTX_FMT}${RESET} ${DIM}(${RESET}${PCT_C}${PCT}%${RESET}${DIM})${RESET}"

# Effort
if [ -n "$EFFORT" ]; then
    EC=$(effort_color "$EFFORT")
    OUT="${OUT}${SEP}effort: ${EC}${EFFORT}${RESET}"
elif [ "$THINKING" = "true" ]; then
    OUT="${OUT}${SEP}effort: ${GREEN}think${RESET}"
fi

# 5-hour rate limit: "5h 20% @11:00am"
if [ -n "$FH_PCT_RAW" ]; then
    FH_PCT=${FH_PCT_RAW%.*}
    FH_C=$(pct_color "$FH_PCT")
    OUT="${OUT}${SEP}${BOLD}5h${RESET} ${FH_C}${FH_PCT}%${RESET}"
    FH_TIME=$(fmt_time "$FH_RESET" "%l:%M%p")
    [ -n "$FH_TIME" ] && OUT="${OUT} ${DIM}@${FH_TIME}${RESET}"
fi

# 7-day rate limit: "7d 90% @mar 6, 10:00am"
if [ -n "$WK_PCT_RAW" ]; then
    WK_PCT=${WK_PCT_RAW%.*}
    WK_C=$(pct_color "$WK_PCT")
    OUT="${OUT}${SEP}${BOLD}7d${RESET} ${WK_C}${WK_PCT}%${RESET}"
    WK_TIME=$(fmt_time "$WK_RESET" "%b %e, %l:%M%p")
    [ -n "$WK_TIME" ] && OUT="${OUT} ${DIM}@${WK_TIME}${RESET}"
fi

# Session cost
# LC_NUMERIC=C forces dot as decimal separator (some locales use comma).
COST_FMT=$(LC_NUMERIC=C /usr/bin/printf '$%.2f' "$COST")
OUT="${OUT}${SEP}${YELLOW}${COST_FMT}${RESET}"

echo -e "$OUT"
