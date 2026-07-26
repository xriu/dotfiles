#!/usr/bin/env bash
# Clear focused pane (send ctrl+l)
set -euo pipefail

pane_id=$(herdr pane current | jq -r '.result.pane.pane_id')
herdr pane send-keys "$pane_id" ctrl+l
