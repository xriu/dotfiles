#!/usr/bin/env bash
set -euo pipefail

tabs=$(herdr tab list 2>/dev/null || echo '{"result":{"tabs":[]}}')

echo "$tabs" | jq -r '.result.tabs[]?.tab_id // empty' | while read -r tab_id; do
    if [[ -n "$tab_id" ]]; then
        herdr tab rename "$tab_id" "$tab_id" || echo "Failed to label tab $tab_id" >&2
    fi
done
