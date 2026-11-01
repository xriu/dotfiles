# pstack model configuration. One line per role. Delete a line to fall back to the skill default.

# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit the subagent `model`). Alias entries in a panel list still count toward its fan-out.

# budget: max

# Pi keeps effort in a separate `thinkingLevel` field, so the slugs below are plain provider/model-id.

feature, refactoring: openrouter/~deepseek/deepseek-flash-latest
bug-fix: openrouter/~deepseek/deepseek-flash-latest
perf-issue: openrouter/~deepseek/deepseek-flash-latest
hillclimb: openrouter/~deepseek/deepseek-flash-latest
judgment and prose: openrouter/~openai/gpt-terra-latest
hardest tasks: openrouter/~openai/gpt-terra-latest
how explorer: openrouter/~deepseek/deepseek-flash-latest
how explainer: openrouter/~openai/gpt-terra-latest
why investigators: openrouter/~deepseek/deepseek-flash-latest
why synthesizer: openrouter/~openai/gpt-terra-latest
reflect tooling: openrouter/~deepseek/deepseek-flash-latest
reflect judgment, divergent, synthesizer: openrouter/~openai/gpt-terra-latest
arena runners: openrouter/~openai/gpt-terra-latest, openrouter/~deepseek/deepseek-flash-latest
arena cross-judge pool: openrouter/~openai/gpt-terra-latest, openrouter/~deepseek/deepseek-flash-latest
swarm workers: openrouter/~deepseek/deepseek-flash-latest
architect runners: openrouter/~openai/gpt-terra-latest, openrouter/~deepseek/deepseek-flash-latest
interrogate reviewers: openrouter/~openai/gpt-terra-latest, openrouter/~deepseek/deepseek-flash-latest
