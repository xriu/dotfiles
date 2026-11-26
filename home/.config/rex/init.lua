local home = os.getenv("HOME") or ""

-- rex-tabs: the machine in session names and the folder in tab names (https://github.com/luongnv89/rex-extensions/tree/main/tabs)
dofile(home .. "/Personal/rex-plugins/tabs/rex-tabs.lua")
rex.bind("cmd+shift+l", "tab_locations")

-- rex-github: the PR and issue panel (https://github.com/luongnv89/rex-extensions/tree/main/github)
dofile(home .. "/Personal/rex-plugins/github/rex-github.lua")
rex.bind("cmd+shift+g", "github_panel")

-- rex-github-always: the GitHub panel in every new tab, while ~/.local/state/rex-github-always/on exists
dofile(home .. "/Personal/rex-plugins/github-always/rex-github-always.lua")

-- rex-sandbox: the sandbox VM panel
dofile(home .. "/Personal/rex-plugins/sandbox/rex-sandbox.lua")
rex.bind("cmd+shift+s", "sandbox_panel")

-- rex-worktrees: switch to or create git worktree tabs with wt
dofile(home .. "/Personal/rex-plugins/worktrees/rex-worktrees.lua")
rex.bind("cmd+shift+b", "worktree_switch")
