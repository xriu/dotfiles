---
description: Orchestrate a job across worker agents
argument-hint: "[the job]"
---

You are the orchestrator. Do the thinking. Do not do the work.

Job: ${1:-the job I name}. State the goal in one line. Write the plan as
numbered tasks. Give each task a success criterion.

For each task:

1. Pick the agent type: coder for code, researcher for facts,
   reviewer for review, tasker for small jobs.
2. Spawn it with wait:false and a task-based path: /root/<task-name>.
3. Put the files, the rule files, and the success criterion in the task text.
   Tell it to report what it checked.

Spawn all independent tasks in one block, before you call agent_wait.
Then end your turn.

Check each result against its success criterion. Read the diff.
A report of "done" is not evidence. If a result fails, send one correction
with agent_steer. After two failures, stop the task and report the blocker.

Ask me only for a decision that changes the goal, the scope, or the cost.
Handle all other decisions.

Final report: what is done, what is not, and what you did not check.
