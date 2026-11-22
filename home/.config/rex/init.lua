local home = os.getenv("HOME") or ""

-- Keep sshtab agent restore off even if ~/.cache is cleared; rex-resume handles pi and claude.
if rex.args == nil then
  local state = os.getenv("REX_SSHTAB_STATE") or (home .. "/.cache/rex-sshtab")
  rex.exec({ "mkdir", "-p", state })
  local f = io.open(state .. "/restore-off", "w")
  if f then f:close() end
  os.remove(state .. "/agents.json")
end

-- rex-sshtab: new tabs open on the machine the current tab is ssh'd into (https://github.com/luongnv89/rex-extensions/tree/main/sshtab)
dofile(home .. "/Personal/rex-plugins/sshtab/rex-sshtab.lua")
rex.bind("cmd+alt+t", "same_host_tabs")

-- rex-tabs: the machine in session names and the folder in tab names (https://github.com/luongnv89/rex-extensions/tree/main/tabs)
dofile(home .. "/Personal/rex-plugins/tabs/rex-tabs.lua")
rex.bind("cmd+shift+l", "tab_locations")

-- rex-github: the PR and issue panel (https://github.com/luongnv89/rex-extensions/tree/main/github)
dofile(home .. "/Personal/rex-plugins/github/rex-github.lua")
rex.bind("cmd+shift+g", "github_panel")

-- rex-github-always: the GitHub panel in every new tab, while ~/.local/state/rex-github-always/on exists
dofile(home .. "/Personal/rex-plugins/github-always/rex-github-always.lua")

-- rex-worktrees: switch to or create git worktree tabs with wt
dofile(home .. "/Personal/rex-plugins/worktrees/rex-worktrees.lua")
rex.bind("cmd+shift+b", "worktree_switch")
