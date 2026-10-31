---
name: herdr-update
description: "Refresh the herdr skill manuals from the installed tools: save `hc --skill` and `herdr-app --skill` output over their SKILL.md files. Use after an hc or Herdr update, or when a herdr skill manual looks stale."
disable-model-invocation: true
---

# herdr-update: refresh the herdr skill manuals

`hc` and `herdr-app` print their manuals with `--skill`. Never edit those
manuals by hand. Save the fresh output over the files.

```sh
hc --skill > ~/dotfiles/home/.skills/herdr/hc/SKILL.md
herdr-app --skill > ~/dotfiles/home/.skills/herdr/herdr-app/SKILL.md
```

`~/.agents/skills/hc` and `~/.agents/skills/herdr-app` are symlinks into these
folders, so no copy step is needed.
