#!/usr/bin/env bash
set -euo pipefail

# Label all panes
panes=$(herdr pane list 2>/dev/null || echo '{"result":{"panes":[]}}')
echo "$panes" | jq -r '.result.panes[]?.pane_id // empty' | while read -r pane_id; do
	if [[ -n "$pane_id" ]]; then
		herdr pane rename "$pane_id" "$pane_id" || echo "Failed to label pane $pane_id" >&2
	fi
done

# Label all tabs
tabs=$(herdr tab list 2>/dev/null || echo '{"result":{"tabs":[]}}')
echo "$tabs" | jq -r '.result.tabs[]?.tab_id // empty' | while read -r tab_id; do
	if [[ -n "$tab_id" ]]; then
		herdr tab rename "$tab_id" "$tab_id" || echo "Failed to label tab $tab_id" >&2
	fi
done
