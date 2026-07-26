#!/usr/bin/env bash
set -euo pipefail

pane_id=$(herdr pane current | jq -r '.result.pane.pane_id // empty')
[[ -n "$pane_id" ]] || {
	echo "No current pane" >&2
	exit 1
}
herdr pane rename "$pane_id" "$pane_id"
