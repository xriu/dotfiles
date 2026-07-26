#!/usr/bin/env bash
# Label the current focused pane with its pane ID
# Called via action or keybinding

set -euo pipefail

# Get the current pane info
pane_info=$(herdr pane current 2>/dev/null)

# Extract the pane ID from the response envelope
pane_id=$(echo "$pane_info" | jq -r '.result.pane.pane_id // empty')

if [[ -n "$pane_id" ]]; then
	# Label with the pane ID
	herdr pane rename "$pane_id" "$pane_id" || {
		echo "Failed to label $pane_id" >&2
		exit 1
	}
	echo "Labeled pane $pane_id"
else
	echo "Could not determine current pane ID"
fi
