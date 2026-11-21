# Forget the pi session of this Rex pane after pi exits. A killed shell keeps it for the restored pane.
function pi --wraps pi
    command pi $argv
    set -l code $status
    ~/.agents/bin/rex-resume drop
    return $code
end
