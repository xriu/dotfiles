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

## Tool Reference

### Projectss

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
| `spawn_process` | Spawn a new process |
| `rename_process` | Rename a process |
| `send_input` | Send input to a running process's stdin |
| `bind_session_process(process_id)` | Bind this MCP session to a Solo-managed process |
| `wait_for_bound_port` | Wait for a process to bind a port (listener readiness) |
| `search_output` | Search through process output |

### Timers

Schedule one-shot or recurring work. When a timer fires, its `body` is injected into the owning agent's conversation as a fresh user turn.

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

**Patterns:**
- Periodic check-ins: `timer_set(120000, "check agent progress", loop=true)`
- Wait for worker to finish: `timer_fire_when_idle_any([pid], 600000, "Worker went idle, check results")`
- Cancel timers when monitored work is done

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

1. `spawn_process` for each worker
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
