# Forget the Claude session of this Rex pane after Claude exits. A killed shell keeps it for the restored pane.
function claude --wraps claude
    command claude $argv
    set -l code $status
    ~/.agents/bin/rex-resume drop
    return $code
end
