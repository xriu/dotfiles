#!/usr/bin/env bash
set -euo pipefail

pane_info=$(herdr pane current 2>/dev/null)
tab_id=$(echo "$pane_info" | jq -r '.result.pane.tab_id // empty')

if [[ -n "$tab_id" ]]; then
	herdr tab rename "$tab_id" "$tab_id" || {
		echo "Failed to label tab $tab_id" >&2
		exit 1
	}
	echo "Labeled tab $tab_id"
else
	echo "Could not determine current tab ID" >&2
	exit 1
fi
