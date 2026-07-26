#!/usr/bin/env bash
set -euo pipefail

# Label all panes
herdr pane list | jq -r '.result.panes[]?.pane_id // empty' | while read -r pane_id; do
	herdr pane rename "$pane_id" "$pane_id"
done

# Label all tabs
herdr tab list | jq -r '.result.tabs[]?.tab_id // empty' | while read -r tab_id; do
	herdr tab rename "$tab_id" "$tab_id"
done
