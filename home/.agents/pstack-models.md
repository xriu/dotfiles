# pstack model configuration. One line per role. Delete a line to fall back to the skill default.

# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit the subagent `model`). Alias entries in a panel list still count toward its fan-out.

# budget: unlimited (max)

# Pi keeps effort in a separate `thinkingLevel` field, so the slugs below are plain provider/model-id.

feature, refactoring: openrouter/deepseek/deepseek-v4.1-flash-1017
bug-fix: openrouter/deepseek/deepseek-v4.1-flash-1017
perf-issue: openrouter/deepseek/deepseek-v4.1-flash-1017
hillclimb: openrouter/deepseek/deepseek-v4.1-flash-1017
judgment and prose: openrouter/openai/gpt-6.1-terra
hardest tasks: openrouter/openai/gpt-6.1-terra
how explorer: openrouter/deepseek/deepseek-v4.1-flash-1017
how explainer: openrouter/openai/gpt-6.1-terra
why investigators: openrouter/deepseek/deepseek-v4.1-flash-1017
why synthesizer: openrouter/openai/gpt-6.1-terra
reflect tooling: openrouter/deepseek/deepseek-v4.1-flash-1017
reflect judgment, divergent, synthesizer: openrouter/openai/gpt-6.1-terra
arena runners: openrouter/openai/gpt-6.1-terra, openrouter/deepseek/deepseek-v4.1-flash-1017
arena cross-judge pool: openrouter/openai/gpt-6.1-terra, openrouter/deepseek/deepseek-v4.1-flash-1017
swarm workers: openrouter/deepseek/deepseek-v4.1-flash-1017
architect runners: openrouter/openai/gpt-6.1-terra, openrouter/deepseek/deepseek-v4.1-flash-1017
interrogate reviewers: openrouter/openai/gpt-6.1-terra, openrouter/deepseek/deepseek-v4.1-flash-1017
