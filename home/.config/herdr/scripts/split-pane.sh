#!/usr/bin/env bash
# Split pane and label new pane with its ID
# Usage: split-pane.sh <direction>
set -euo pipefail

direction="${1:?Usage: split-pane.sh <right|down>}"
# A keybinding-spawned shell gets HERDR_ACTIVE_PANE_ID, not HERDR_PANE_ID,
# and `--current` refuses to run without HERDR_PANE_ID. Its stderr goes to
# /dev/null, so the failure is silent.
target="${HERDR_ACTIVE_PANE_ID:-${HERDR_PANE_ID:?no pane context}}"
resp=$(herdr pane split --pane "$target" --direction "$direction" --no-focus)
pane_id=$(echo "$resp" | jq -r '.result.pane.pane_id')
herdr pane rename "$pane_id" "$pane_id"
