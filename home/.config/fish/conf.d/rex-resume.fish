# Rex - open the agent session this pane ran before the Rex server restarted
status is-interactive; or return
set -q REX_BLOCK; or return

function __rex_resume --on-event fish_prompt
    functions -e __rex_resume
    set -l record (~/.agents/bin/rex-resume take | string split \t)
    test (count $record) -ge 3; or return
    test -d "$record[3]"; and cd $record[3]
    switch $record[1]
        case claude
            if set -q record[4]; and test -n "$record[4]"
                CLAUDE_CONFIG_DIR=$record[4] claude --resume $record[2]
            else
                claude --resume $record[2]
            end
        case pi
            pi --session $record[2]
    end
end
