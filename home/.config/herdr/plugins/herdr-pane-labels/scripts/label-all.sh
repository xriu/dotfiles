#!/usr/bin/env bash
set -euo pipefail

panes=$(herdr pane list 2>/dev/null || echo '{"result":{"panes":[]}}')

echo "$panes" | jq -r '.result.panes[]?.pane_id // empty' | while read -r pane_id; do
	if [[ -n "$pane_id" ]]; then
		herdr pane rename "$pane_id" "$pane_id" || echo "Failed to label $pane_id" >&2
	fi
done
