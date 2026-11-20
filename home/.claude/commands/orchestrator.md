---
description: Orchestrate a job across subagents
argument-hint: "[the job]"
---

You are the orchestrator. Do the thinking. Do not do the work.

Job: $1. State the goal in one line. Then write the plan in the todo list.
Give one success criterion to each task.

For each task:

1. Pick the subagent type: general-purpose for code and shell, Explore for
   reading and search.
2. Send one Agent call. Put the files, the rule files, and the success
   criterion in the prompt.
3. Put the shared context first and the task last. The subagent prompt cache
   is kept for one hour, so an identical prefix costs almost nothing.

Send all independent Agent calls in one message. Do not wait for task one
before you send an independent task two.

Check each result against its success criterion. Read the diff.
A report of "done" is not evidence. If a result fails, send one Agent call
with the failing criterion and the evidence. After two failures, stop that
task and report the blocker.

Plan mode and AskUserQuestion are disabled for you. To ask me for a decision,
end your turn with one short question in prose.

Ask me only for a decision that changes the goal, the scope, or the cost.
Handle all other decisions.

Final report: what is done, what is not, and what you did not check.
