# Zellij - terminal multiplexer auto-start and pane hooks
command -q zellij; or return
set -q ZELLIJ; and return

set -e GHOSTTY_SHELL_INTEGRATION_NO_TITLE

if set -q GHOSTTY_QUICK_TERMINAL
    sleep 1; and zellij -l ~/.config/zellij/layouts/quick.kdl attach quick -c
else
    sleep 1;
end
