local home = os.getenv("HOME") or ""

-- rex-github: the PR and issue panel (https://github.com/luongnv89/rex-extensions/tree/main/github)
dofile(home .. "/Personal/rex-plugins/extensions/github/rex-github.lua")
rex.bind("cmd+shift+g", "github_panel")

-- rex-github-always: the GitHub panel in every new tab, while ~/.local/state/rex-github-always/on exists
dofile(home .. "/Personal/rex-plugins/extensions/github-always/rex-github-always.lua")

-- rex-sandbox: the sandbox VM panel
dofile(home .. "/Personal/rex-plugins/extensions/sandbox/rex-sandbox.lua")
rex.bind("cmd+shift+s", "sandbox_panel")

-- rex-worktrees: switch to or create git worktree tabs with wt
dofile(home .. "/Personal/rex-plugins/extensions/worktrees/rex-worktrees.lua")
rex.bind("cmd+shift+b", "worktree_switch")
