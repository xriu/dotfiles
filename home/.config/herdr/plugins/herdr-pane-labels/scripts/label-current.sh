#!/usr/bin/env bash
set -euo pipefail

pane_info=$(herdr pane current 2>/dev/null)
pane_id=$(echo "$pane_info" | jq -r '.result.pane.pane_id // empty')

if [[ -n "$pane_id" ]]; then
	herdr pane rename "$pane_id" "$pane_id" || {
		echo "Failed to label $pane_id" >&2
		exit 1
	}
	echo "Labeled pane $pane_id"
else
	echo "Could not determine current pane ID" >&2
	exit 1
fi
