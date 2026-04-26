---
name: solo
description: Orchestrate multiple AI agents, processes, and tasks using the Solo MCP server. Use when the user wants to coordinate agents, manage processes, se
---

# Solo MCP Server

Solo is a multi-agent orchestration platform. It provides tools for running and coordinating multiple AI agents/processes, sharing state, managing tasks, and s

## Getting Started

1. Call `list_projects` to see available projects (auto-selects if only one exists)
2. Call `select_project` to set a default project scope, or pass `project_id` on individual calls
3. If running inside a Solo-managed child process, call `bind_session_process` with `SOLO_PROCESS_ID`
4. Call `whoami` to inspect your `process_id`, `actor_id`, and effective project scope
5. Call `help` to discover available capabilities
6. Call `help(topic="<topic>")` for detailed guidance on specific areas

Available help topics: `timers`, `coordination`, `solo.yml`

## Critical Rules

- **"All" means current project only.** When the user says "delete all todos", "list all scratchpads", etc., always scope to the current project. NEVER operate across projects. Use `WHERE project_id = <current>` or pass `project_id` to every call.
- **Always confirm the project scope** before destructive operations (delete, clear, cancel). State which project you're acting on.

## Tool Reference

### Projects

| Tool | Description |
|------|-------------|
| `list_projects` | List available projects |
| `select_project(project_id)` | Set default project scope for subsequent calls |

### Processes (Agent Management)

Run, monitor, and control child processes and agents.

| Tool | Description |
|------|-------------|
| `list_processes` | List all processes in the project |
| `get_process_status` | Get status of a process |
| `get_process_output(process_id, lines)` | Read recent output from a process |
| `start_process` | Start an existing stored process entry |
| `stop_process` | Stop a running process |
| `restart_process` | Restart a process |
| `close_process` | Close and remove a process |
| `spawn_process` | Spawn a new process (see details below) |
| `list_agent_tools` | List agent runtimes available to `spawn_process` |
| `rename_process` | Rename a process |
| `send_input` | Send input to a running process's stdin |
| `bind_session_process(process_id)` | Bind this MCP session to a Solo-managed process |
| `wait_for_bound_port` | Wait for a process to bind a port (listener readiness) |
| `search_output` | Search through process output |

#### `spawn_process` Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `kind` | string | **Yes** | `"terminal"` for an interactive shell, or `"agent"` for an agent process |
| `name` | string | No | Custom name for the spawned process (auto-generated if omitted) |
| `agent_tool_id` | integer | No* | Agent runtime ID from `list_agent_tools` (required when `kind="agent"`) |
| `include_agent_instructions` | boolean | No | For agents: include Solo orchestration context in response (default: true) |
| `project_id` | integer | No | Override project scope (defaults to selected project) |

*Use `list_agent_tools` to discover available runtimes (e.g., pi, claude, gemini) and their IDs.

**Response:** Returns `{ process_id, name, agent_instructions }`. Spawned agents receive `SOLO_PROCESS_ID` and `SOLO_PROJECT_ID` environment variables, plus bootstrap instructions about available Solo MCP coordination tools. The `_meta.solo/spawn_process.hint` field suggests follow-up tools like `timer_fire_when_idle_any`.

#### `list_agent_tools` Response

Returns available agent runtimes with their `id`, `name`, `command`, `tool_type`, and `enabled` status. Example:

```json
[
  {"id": 1, "name": "Gemini", "command": "gemini", "tool_type": "gemini", "enabled": true},
  {"id": 3, "name": "Claude", "command": "claude", "tool_type": "claude", "enabled": true},
  {"id": 11, "name": "Pi", "command": "pi", "tool_type": "generic", "enabled": true}
]
```

Use the `id` as `agent_tool_id` when calling `spawn_process(kind="agent", ...)`. The IDs are project-scoped and may differ across projects.

### Timers

Schedule one-shot or recurring work. When a timer fires, Solo injects the `body` into the owning agent's conversation as a **fresh user turn** (e.g. `[Solo timer #4] your body text`). You do NOT need to poll or busy-loop — Solo wakes you up.

| Tool | Description |
|------|-------------|
| `timer_set(delay_ms, body)` | Set a one-shot timer |
| `timer_set(delay_ms, body, loop=true)` | Set a recurring timer |
| `timer_cancel(timer_id)` | Cancel a timer |
| `timer_pause(timer_id)` | Pause a timer |
| `timer_resume(timer_id)` | Resume a paused timer |
| `timer_list` | List all active timers |
| `timer_fire_when_idle_any(processes, max_wait_ms, body)` | Fire when ANY of the listed processes go idle |
| `timer_fire_when_idle_all(processes, max_wait_ms, body)` | Fire when ALL of the listed processes go idle |

**Important:** Write `body` as actionable instructions — include which tools to call and what to check. The agent receiving the timer may have lost context.

**Note:** Idle-triggered timers only support running Solo terminals and Solo agents that expose Solo runtime idle state.

### Todos (Task Management)

Track tasks with tags, dependencies (blockers), comments, and locking for exclusive work.

| Tool | Description |
|------|-------------|
| `todo_create` | Create a new todo |
| `todo_get` | Get a specific todo |
| `todo_list` | List todos (with filters) |
| `todo_update` | Update a todo |
| `todo_delete` | Delete a todo |
| `todo_complete` | Mark a todo as complete |
| `todo_lock` | Claim exclusive ownership of a todo |
| `todo_unlock` | Release a locked todo |
| `todo_transfer` | Hand off a todo to another agent |
| `todo_comment(todo_id, text)` | Add a comment to a todo |
| `todo_comment_update` | Update a comment |
| `todo_comment_delete` | Delete a comment |
| `todo_list_comments` | List comments on a todo |
| `todo_add_tag` | Tag a todo |
| `todo_remove_tag` | Remove a tag |
| `todo_tags_list` | List all tags |
| `todo_add_blocker` | Add a dependency (blocker) |
| `todo_remove_blocker` | Remove a dependency |
| `todo_set_blockers` | Set all dependencies at once |

### Scratchpads (Shared Memory)

Shared text buffers for passing information between agents.

| Tool | Description |
|------|-------------|
| `scratchpad_read` | Read a scratchpad |
| `scratchpad_write` | Write (overwrite) a scratchpad |
| `scratchpad_append` | Append to a scratchpad |
| `scratchpad_clear` | Clear a scratchpad's content |
| `scratchpad_delete` | Delete a scratchpad |
| `scratchpad_list` | List all scratchpads |
| `scratchpad_rename` | Rename a scratchpad |
| `scratchpad_archive` | Archive a scratchpad |
| `scratchpad_transfer` | Transfer ownership to another agent |
| `scratchpad_save_to_file` | Save scratchpad to a file |
| `scratchpad_load_from_file` | Load scratchpad from a file |
| `scratchpad_add_tags` | Add tags to a scratchpad |
| `scratchpad_remove_tags` | Remove tags from a scratchpad |
| `scratchpad_tags_list` | List scratchpad tags |

### Key-Value Store

Simple shared key-value storage scoped to a project.

| Tool | Description |
|------|-------------|
| `kv_get(key)` | Get a value |
| `kv_set(key, value)` | Set a value |
| `kv_delete(key)` | Delete a key |
| `kv_list` | List all keys |

### Distributed Locks

Coordinate exclusive access to resources between agents.

| Tool | Description |
|------|-------------|
| `lock_acquire(lock_key)` | Acquire a lock |
| `lock_release(lock_key)` | Release a lock |
| `lock_status(lock_key)` | Check lock status |

### Identity & Help

| Tool | Description |
|------|-------------|
| `whoami` | Show your process_id, actor_id, and project scope |
| `help` | Discover available capabilities |
| `help(topic="timers")` | Detailed guidance on timers |
| `help(topic="coordination")` | Detailed guidance on coordination |
| `help(topic="solo.yml")` | Solo project configuration reference |
| `register_agent` | Register as an agent |
| `setup_agent_integration` | Set up agent integration |

## Common Patterns

### Coordinator + Workers

A coordinator agent spawns worker agents, assigns todos, and waits for them to finish:

1. `list_agent_tools` to discover runtimes, then `spawn_process(kind="agent", agent_tool_id=<id>)` for each worker
2. `todo_create` tasks and assign via `todo_transfer`
3. `timer_fire_when_idle_all(worker_pids, timeout, "All workers idle, collect results")`
4. Workers write results to scratchpads
5. Coordinator reads scratchpads and synthesizes

### Shared State Between Agents

- **Structured data:** Use `kv_set` / `kv_get` for small key-value pairs
- **Long-form text:** Use scratchpads for reports, plans, or large context
- **Exclusive access:** Use `lock_acquire` / `lock_release` when multiple agents might write the same resource

### Periodic Monitoring

```
timer_set(120000, "Check all worker progress and report status", loop=true)
```

### Readiness Checks

- Use `wait_for_bound_port` for services that listen on a port
- Use `timer_fire_when_idle_any` for worker processes that will eventually go idle

## Examples

### Todos: Task Pipeline with Dependencies

Create a chain of tasks where each step blocks the next:

```
# 1. Create the tasks
todo_create(title="Research zsh plugin options",
  body="Compare zinit vs antidote vs sheldon. Check startup time benchmarks.",
  priority="high", tags=["research", "zsh"])
→ returns id=3

todo_create(title="Migrate zsh plugins to new manager",
  body="Based on research, migrate all plugins. Update .zshrc.",
  priority="high", tags=["implementation", "zsh"])
→ returns id=4

todo_create(title="Test shell startup time",
  body="Measure before and after. Target: under 200ms.",
  priority="medium", tags=["testing", "zsh"])
→ returns id=5

# 2. Set up the dependency chain: research → migrate → test
todo_add_blocker(todo_id=4, blocker_id=3)   # migrate blocked by research
todo_add_blocker(todo_id=5, blocker_id=4)   # test blocked by migrate

# 3. Add progress notes as comments
todo_comment(todo_id=3, body="zinit loads 47 plugins in ~80ms. Sheldon is newer but promising.")
todo_comment(todo_id=3, body="antidote is pure-zsh, no binary deps. Better for dotfiles portability.")

# 4. Claim a task, work on it, complete it
todo_lock(todo_id=3)         # claim exclusive ownership
# ... do the research ...
todo_complete(todo_id=3)     # marks done, unblocks todo #4

# 5. Hand off the next task to another agent
todo_transfer(todo_id=4, to_agent="impl-agent")
```

### Scratchpads: Sharing Context Between Agents

Use scratchpads as shared documents that agents read and write:

```
# Agent A writes research findings
scratchpad_write(name="zsh-plugin-research", content="
# Zsh Plugin Manager Research

## 1. zinit
- Startup: ~80ms with 47 plugins
- Pros: Turbo mode, very fast
- Cons: Complex syntax

## 2. antidote
- Startup: ~120ms with 47 plugins
- Pros: Pure zsh, simple config

## 3. sheldon
- Startup: ~60ms with 47 plugins
- Pros: Rust binary, TOML config

## Recommendation
Sheldon for speed, antidote for portability.
")
scratchpad_add_tags(name="zsh-plugin-research", tags=["research", "zsh"])

# Agent B reads it later and appends
scratchpad_read(name="zsh-plugin-research")
scratchpad_append(name="zsh-plugin-research", content="
## Update from Agent B
Confirmed sheldon benchmarks. Proceeding with migration.
")

# Create a checklist scratchpad for tracking migration steps
scratchpad_write(name="migration-checklist", content="
- [ ] Backup current .zshrc
- [ ] Install new plugin manager
- [ ] Port plugin list
- [ ] Test each plugin loads
- [ ] Measure startup time
- [ ] Commit changes
")

# Save to file when done
scratchpad_save_to_file(name="zsh-plugin-research", path="./docs/research.md")

# List all scratchpads in the project
scratchpad_list()
```

### Timers: Scheduling and Coordination

Timers are Solo's wake-up mechanism. When a timer fires, Solo injects the timer's
`body` text into the owning agent's conversation as a **new user turn**, like:

```
[Solo timer #4] ⏰ Wake up! Your 5-second timer fired!
```

This means:
- You do NOT need to poll, sleep, or busy-loop — Solo wakes you up.
- The `body` should contain **actionable instructions** telling the agent what to do
  when it wakes up (which tools to call, what to check).
- The agent that set the timer is the one that receives it.

#### One-shot timer (simplest)

Fire once after a delay:

```
# Wake me up in 5 seconds
timer_set(5000, "Check the build output and report if tests passed.")
→ returns {project_id: 4, timer_id: 1}

# 5 seconds later, Solo injects into your conversation:
#   [Solo timer #1] Check the build output and report if tests passed.
```

#### Recurring timer (loop)

Fire repeatedly at a fixed interval:

```
# Status check every 2 minutes
timer_set(120000,
  "Periodic check: call todo_list to report progress. Check if any blockers resolved.",
  loop=true)
→ returns timer_id=2

# Every 2 minutes Solo injects the body as a new turn.
# The timer keeps firing until you cancel it.
```

#### Deadline timer

Escalate if work isn't done in time:

```
# If research isn't done in 30 minutes, take over
timer_set(1800000,
  "DEADLINE: Research should be done by now. Check todo #3 — if still open, complete it directly.")
→ returns timer_id=3
```

#### Idle-triggered timers

Fire when specific processes go idle (instead of guessing a delay):

```
# Fire when a worker agent finishes and goes idle
timer_fire_when_idle_any([worker_pid], 600000,
  "Worker went idle. Call get_process_output(process_id=42, lines=60) and check the scratchpad for results.")

# Fire when ALL workers are idle (e.g. wait for parallel tasks to finish)
timer_fire_when_idle_all([pid1, pid2], 600000,
  "All workers idle. Read scratchpads and synthesize results.")
```

Note: Idle-triggered timers only work with Solo terminals and agents that expose idle state.

#### Managing timers

```
timer_list()              # see all active timers
timer_pause(timer_id=2)   # pause a recurring check
timer_resume(timer_id=2)  # resume it
timer_cancel(timer_id=3)  # cancel (e.g. work finished early)
```

#### Tips for writing good timer bodies

- Be specific: tell the agent exactly what tools to call when woken up.
- Include context: the agent may have forgotten what it was doing.
- For recurring timers, include a stop condition: "If all todos are complete, cancel this timer."

### Full Workflow: Coordinator + Workers

Putting it all together — a coordinator spawns workers, assigns tasks, and collects results:

```
# 1. Set project scope
select_project(project_id=4)

# 2. Store shared config
kv_set(key="target_startup_ms", value="200")
kv_set(key="migration_status", value="starting")

# 3. Create todos
todo_create(title="Research plugin managers", priority="high")
todo_create(title="Implement migration", priority="high")
todo_create(title="Validate results", priority="medium")
todo_add_blocker(todo_id=2, blocker_id=1)
todo_add_blocker(todo_id=3, blocker_id=2)

# 4. Discover agent runtimes, then spawn a worker
list_agent_tools()
→ returns [{"id": 11, "name": "Pi", ...}, ...]
spawn_process(kind="agent", name="research-worker", agent_tool_id=11)
→ returns {process_id: 42, name: "research-worker", agent_instructions: "..."}

# 5. Transfer the research task
todo_transfer(todo_id=1, to_agent="agent-42")

# 6. Set a timer to check when worker finishes
timer_fire_when_idle_any([42], 600000,
  "Research worker is idle. Read scratchpad 'research-results' and proceed.")

# 7. Set a recurring progress monitor
timer_set(120000, "Check todo_list and kv_get('migration_status')", loop=true)

# 8. Use locks for exclusive file access
lock_acquire(lock_key="zshrc-edit")
# ... edit .zshrc ...
lock_release(lock_key="zshrc-edit")

# 9. When done, update status and cancel timers
kv_set(key="migration_status", value="complete")
timer_cancel(timer_id=1)
```
