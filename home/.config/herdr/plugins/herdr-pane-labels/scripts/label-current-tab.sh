#!/usr/bin/env bash
set -euo pipefail

tab_id=$(herdr pane current | jq -r '.result.pane.tab_id // empty')
[[ -n "$tab_id" ]] || {
	echo "No current tab" >&2
	exit 1
}
herdr tab rename "$tab_id" "$tab_id"
