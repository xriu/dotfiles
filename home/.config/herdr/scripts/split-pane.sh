#!/usr/bin/env bash
# Split pane and label new pane with its ID
# Usage: split-pane.sh <direction>
set -euo pipefail

direction="${1:?Usage: split-pane.sh <right|down>}"
resp=$(herdr pane split --current --direction "$direction" --no-focus)
pane_id=$(echo "$resp" | jq -r '.result.pane.pane_id')
herdr pane rename "$pane_id" "$pane_id"
