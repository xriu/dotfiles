#!/usr/bin/env bash
# Create a new tab with 2 panes (side-by-side)
set -euo pipefail

resp=$(herdr tab create --no-focus)
tab_id=$(echo "$resp" | jq -r '.result.tab.tab_id')
pane_id=$(echo "$resp" | jq -r '.result.root_pane.pane_id')

split_resp=$(herdr pane split --pane "$pane_id" --direction right --no-focus)
new_pane_id=$(echo "$split_resp" | jq -r '.result.pane.pane_id')

herdr tab rename "$tab_id" "$tab_id"
herdr pane rename "$pane_id" "$pane_id"
herdr pane rename "$new_pane_id" "$new_pane_id"
herdr tab focus "$tab_id"
