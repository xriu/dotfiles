#!/usr/bin/env bash
# Label all existing panes with their pane ID
# Called on plugin startup

set -euo pipefail

# Get all panes
panes=$(herdr pane list 2>/dev/null || echo '{"result":{"panes":[]}}')

# Extract pane IDs and label each one
echo "$panes" | jq -r '.result.panes[]?.pane_id // empty' | while read -r pane_id; do
	if [[ -n "$pane_id" ]]; then
		# Label with the pane ID itself
		herdr pane rename "$pane_id" "$pane_id" 2>/dev/null || echo "Failed to label $pane_id"
	fi
done
