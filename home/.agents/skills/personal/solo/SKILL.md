---
name: solo
description: Solo MCP server reference — all available tools with correct names, safety rules, and examples. Use when the user wants to spawn processes, manage todos, share state via scratchpads/kv, coordinate agents with timers and locks, or anything related to the Solo multi-agent orchestration platform.
---

# Solo MCP Server

Solo is a multi-agent orchestration platform. It provides 80+ tools for running and coordinating AI agents, managing tasks, sharing state, and scheduling work.

## Getting Started

```
# 1. Discover capabilities
solo_help                              # overview
solo_help(topic="processes")           # detailed topic help

# 2. Set project scope
solo_list_projects                     # list available projects
solo_select_project(project_id=<id>)   # set default scope

# 3. If running inside a Solo-managed child process:
solo_bind_session_process              # bind using SOLO_PROCESS_ID env var

# 4. Identify yourself
solo_whoami                            # process_id, actor_id, project scope
```

## Critical Rules

- **"All" means current project only.** When the user says "delete all todos", "list all scratchpads", etc., always scope to the current project. **NEVER** operate across projects. Pass `project_id` to every call.
- **Always confirm project scope** before destructive operations (delete, clear, cancel). State which project you're acting on.
- **Tool names use the `solo_` prefix** (e.g., `solo_spawn_process`, not `spawn_process`).

## Tool Categories

### 1. Processes — Spawn, run, and control agents/terminals

| Tool                                                                               | Purpose                                 |
| ---------------------------------------------------------------------------------- | --------------------------------------- |
| `solo_spawn_process(kind, name?, agent_tool_id?)`                                  | Spawn a new terminal or agent process   |
| `solo_list_processes`                                                              | List all processes in the project       |
| `solo_start_process` / `solo_stop_process` / `solo_restart_process`                | Lifecycle control                       |
| `solo_close_process`                                                               | Remove a process                        |
| `solo_send_input(process_id, text)`                                                | Send stdin to a running process         |
| `solo_get_process_output(process_id, lines?)`                                      | Read recent terminal output             |
| `solo_get_process_raw_output(process_id)`                                          | Read raw (unrendered) output            |
| `solo_search_output` / `solo_search_raw_output`                                    | Search process output                   |
| `solo_get_process_status(process_id)`                                              | Detailed process status                 |
| `solo_get_process_ports(process_id)`                                               | Detected ports/URLs                     |
| `solo_rename_process`                                                              | Rename a process                        |
| `solo_clear_output(process_id)`                                                    | Clear saved output                      |
| `solo_wait_for_bound_port(process_id, port?, timeout_ms?)`                         | Wait for port readiness                 |
| `solo_list_agent_tools`                                                            | List available agent runtimes           |
| `solo_bind_session_process`                                                        | Bind this MCP session to a Solo process |
| `solo_start_all_commands` / `solo_stop_all_commands` / `solo_restart_all_commands` | Bulk lifecycle                          |
| `solo_get_project_status` / `solo_get_project_stats`                               | Project metadata and resource usage     |

#### `solo_spawn_process` Parameters

| Parameter                    | Type    | Required | Description                                                          |
| ---------------------------- | ------- | -------- | -------------------------------------------------------------------- |
| `kind`                       | string  | **Yes**  | `"terminal"` for shell, or `"agent"` for an agent process            |
| `name`                       | string  | No       | Custom name (auto-generated if omitted)                              |
| `agent_tool_id`              | integer | No\*     | Agent runtime ID from `solo_list_agent_tools`                        |
| `include_agent_instructions` | boolean | No       | Include Solo orchestration context in agent response (default: true) |
| `project_id`                 | integer | No       | Override project scope (defaults to selected project)                |

\*Required when `kind="agent"`.

**Response:** Returns `{ process_id, name, agent_instructions }`. Spawned agents receive `SOLO_PROCESS_ID` and `SOLO_PROJECT_ID` environment variables. The `_meta.solo/spawn_process.hint` field suggests follow-up tools like `timer_fire_when_idle_any`.

#### `solo_list_agent_tools` Response

Returns available agent runtimes with `id`, `name`, `command`, `tool_type`, and `enabled` status:

```json
[
  {
    "id": 1,
    "name": "Gemini",
    "command": "gemini",
    "tool_type": "gemini",
    "enabled": true
  },
  {
    "id": 3,
    "name": "Claude",
    "command": "claude",
    "tool_type": "claude",
    "enabled": true
  },
  {
    "id": 11,
    "name": "Pi",
    "command": "pi",
    "tool_type": "generic",
    "enabled": true
  }
]
```

Use the `id` as `agent_tool_id` in `solo_spawn_process(kind="agent", ...)`. **IDs are project-scoped and may differ across projects.**

**Minimal Example — Spawn an Agent:**

```
solo_list_agent_tools()
→ [{"id": 11, "name": "Pi", "command": "pi", "tool_type": "generic", "enabled": true}]

solo_spawn_process(kind="agent", name="researcher", agent_tool_id=11)
→ {process_id: 42, name: "researcher"}
```

**Minimal Example — Run a Terminal:**

```
solo_spawn_process(kind="terminal", name="build-shell")
→ {process_id: 43, name: "build-shell"}

solo_send_input(process_id=43, text="echo hello\n")
solo_get_process_output(process_id=43)
→ "hello"
```

---

### 2. Todos — Task tracking with tags, blockers, comments, and locks

| Tool                                                                                                            | Purpose                 |
| --------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `solo_todo_create(title, body?, priority?, tags?)`                                                              | Create a todo           |
| `solo_todo_get(todo_id)`                                                                                        | Read a todo             |
| `solo_todo_list(status?, tag?, priority?)`                                                                      | List todos with filters |
| `solo_todo_update(todo_id, ...)`                                                                                | Update fields           |
| `solo_todo_delete(todo_id)`                                                                                     | Delete a todo           |
| `solo_todo_complete(todo_id, done?)`                                                                            | Mark done / not done    |
| `solo_todo_lock` / `solo_todo_unlock`                                                                           | Exclusive access        |
| `solo_todo_transfer`                                                                                            | Move to another agent   |
| `solo_todo_add_tag` / `solo_todo_remove_tag`                                                                    | Manage tags             |
| `solo_todo_tags_list`                                                                                           | List all tags           |
| `solo_todo_add_blocker` / `solo_todo_remove_blocker` / `solo_todo_set_blockers`                                 | Dependencies            |
| `solo_todo_comment_create` / `solo_todo_comment_update` / `solo_todo_comment_delete` / `solo_todo_comment_list` | Comments                |

**Minimal Example — Task Pipeline with Dependencies:**

```
solo_todo_create(title="Research plugin managers",
  body="Compare zinit vs antidote vs sheldon. Check startup time benchmarks.",
  priority="high", tags=["research", "zsh"])
→ returns id=3

solo_todo_create(title="Migrate zsh plugins to new manager",
  body="Based on research, migrate all plugins. Update .zshrc.",
  priority="high", tags=["implementation", "zsh"])
→ returns id=4

solo_todo_create(title="Test shell startup time",
  body="Measure before and after. Target: under 200ms.",
  priority="medium", tags=["testing", "zsh"])
→ returns id=5

# Dependency chain: research → migrate → test
solo_todo_add_blocker(todo_id=4, blocker_id=3)   # migrate blocked by research
solo_todo_add_blocker(todo_id=5, blocker_id=4)   # test blocked by migrate

# Claim, work, complete
solo_todo_lock(todo_id=3)         # claim exclusive ownership
# ... do the research ...
solo_todo_complete(todo_id=3)     # marks done, unblocks todo #4

# Hand off to another agent
solo_todo_transfer(todo_id=4, to_agent="impl-agent")
```

---

### 3. Scratchpads — Shared text documents between agents

| Tool                                                                                     | Purpose              |
| ---------------------------------------------------------------------------------------- | -------------------- |
| `solo_scratchpad_write(name, content)`                                                   | Create or overwrite  |
| `solo_scratchpad_read(name)`                                                             | Read content         |
| `solo_scratchpad_list`                                                                   | List all scratchpads |
| `solo_scratchpad_append(name, content)`                                                  | Append text          |
| `solo_scratchpad_clear(name)`                                                            | Clear content        |
| `solo_scratchpad_delete(name)`                                                           | Delete               |
| `solo_scratchpad_rename` / `solo_scratchpad_archive` / `solo_scratchpad_transfer`        | Management           |
| `solo_scratchpad_save_to_file` / `solo_scratchpad_load_from_file`                        | File I/O             |
| `solo_scratchpad_add_tags` / `solo_scratchpad_remove_tags` / `solo_scratchpad_tags_list` | Tags                 |

**Minimal Example — Sharing Research Between Agents:**

```
# Agent A writes findings
solo_scratchpad_write(name="zsh-plugin-research", content="
# Zsh Plugin Manager Research

## 1. zinit — ~80ms with 47 plugins. Turbo mode, fast, but complex syntax.
## 2. antidote — ~120ms with 47 plugins. Pure zsh, simple config.
## 3. sheldon — ~60ms with 47 plugins. Rust binary, TOML config.

Recommendation: sheldon for speed, antidote for portability.
")
solo_scratchpad_add_tags(name="zsh-plugin-research", tags=["research", "zsh"])

# Agent B reads and appends
solo_scratchpad_read(name="zsh-plugin-research")
solo_scratchpad_append(name="zsh-plugin-research", content="
## Update from Agent B
Confirmed sheldon benchmarks. Proceeding with migration.
")

# Save to filesystem when done
solo_scratchpad_save_to_file(name="zsh-plugin-research", path="./docs/research.md")
```

---

### 4. Key-Value Store — Simple shared JSON storage

| Tool                               | Purpose       |
| ---------------------------------- | ------------- |
| `solo_kv_set(key, value, ttl_ms?)` | Set a value   |
| `solo_kv_get(key)`                 | Get a value   |
| `solo_kv_delete(key)`              | Delete a key  |
| `solo_kv_list`                     | List all keys |

**Minimal Example:**

```
solo_kv_set(key="target_startup_ms", value="200")
solo_kv_set(key="migration_status", value="starting", ttl_ms=3600000)  # expires in 1h
solo_kv_get(key="target_startup_ms")  → {"target_startup_ms": "200"}
solo_kv_delete(key="migration_status")
```

---

### 5. Timers — Schedule work; Solo wakes you up when they fire

| Tool                                                           | Purpose                                |
| -------------------------------------------------------------- | -------------------------------------- |
| `solo_timer_set(delay_ms, body, loop?)`                        | One-shot or recurring timer            |
| `solo_timer_cancel` / `solo_timer_pause` / `solo_timer_resume` | Manage timers                          |
| `solo_timer_list`                                              | List active timers                     |
| `solo_timer_fire_when_idle_any`                                | Fire when ANY listed process goes idle |
| `solo_timer_fire_when_idle_all`                                | Fire when ALL listed processes go idle |

**Key concept:** When a timer fires, Solo injects its `body` text as a **new user turn** in your conversation (e.g., `[Solo timer #4] your body text`). You do NOT need to poll or busy-loop.

#### One-shot Timer

```
solo_timer_set(delay_ms=5000, body="Check the build output and report if tests passed.")
→ returns {project_id: 4, timer_id: 1}

# 5 seconds later, Solo injects into your conversation:
#   [Solo timer #1] Check the build output and report if tests passed.
```

#### Recurring Timer

```
solo_timer_set(delay_ms=120000,
  body="Periodic check: call solo_todo_list() to report progress. If all done, cancel this timer.",
  loop=true)
→ returns timer_id=2
```

#### Deadline Timer

```
solo_timer_set(delay_ms=1800000,
  body="DEADLINE: Research should be done by now. Check todo #3 — if still open, complete it directly.")
→ returns timer_id=3
```

#### Idle-Triggered Timers

Fire when processes go idle instead of guessing a delay:

```
# Fire when ANY worker finishes
solo_timer_fire_when_idle_any(processes=[42], max_wait_ms=600000,
  body="Worker 42 went idle. Call solo_get_process_output(process_id=42, lines=60) and check scratchpads.")

# Fire when ALL workers are idle (wait for parallel tasks to finish)
solo_timer_fire_when_idle_all(processes=[41, 42], max_wait_ms=600000,
  body="All workers idle. Read scratchpads and synthesize results.")
```

> **Note:** Idle-triggered timers only work with Solo terminals and agents that expose Solo runtime idle state.

#### Managing Timers

```
solo_timer_list()                  # see all active timers
solo_timer_pause(timer_id=2)       # pause a recurring check
solo_timer_resume(timer_id=2)      # resume it
solo_timer_cancel(timer_id=3)      # cancel (e.g. work finished early)
```

#### Tips for Writing Good Timer Bodies

- **Be specific:** tell the agent exactly what tools to call when woken up.
- **Include context:** the agent may have forgotten what it was doing.
- **For recurring timers, include a stop condition:** "If all todos are complete, cancel this timer."

---

### 6. Locks — Distributed exclusive access

| Tool                          | Purpose        |
| ----------------------------- | -------------- |
| `solo_lock_acquire(lock_key)` | Try to acquire |
| `solo_lock_release(lock_key)` | Release        |
| `solo_lock_status(lock_key)`  | Check status   |

**Minimal Example:**

```
solo_lock_acquire(lock_key="zshrc-edit")     # exclusive access
# ... edit .zshrc ...
solo_lock_release(lock_key="zshrc-edit")
```

---

### 7. Identity, Help & Registration

| Tool                              | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `solo_whoami`                     | Show your process_id, actor_id, project scope    |
| `solo_help`                       | Discover available capabilities                  |
| `solo_help(topic="timers")`       | Detailed guidance on timers                      |
| `solo_help(topic="coordination")` | Detailed guidance on agent coordination          |
| `solo_help(topic="solo.yml")`     | Solo project configuration reference             |
| `solo_register_agent`             | Register an external actor identity              |
| `solo_setup_agent_integration`    | Add Solo MCP docs to CLAUDE.md                   |
| `solo_submit_solo_feedback`       | Open Solo's feedback form with a drafted message |

---

### 8. Services, Ports & Readiness

| Tool                                 | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `solo_services_list`                 | List detected project-local services |
| `solo_get_process_ports(process_id)` | Detected ports/URLs for a process    |
| `solo_wait_for_bound_port`           | Wait for a process to bind a port    |

---

## Common Patterns

### Coordinator + Workers

A coordinator spawns worker agents, assigns todos, and waits for them to finish:

1. `solo_list_agent_tools()` to discover runtimes
2. `solo_spawn_process(kind="agent", agent_tool_id=<id>)` for each worker
3. `solo_todo_create` tasks and assign via `solo_todo_transfer`
4. `solo_timer_fire_when_idle_all(worker_pids, timeout, "All workers idle, collect results")`
5. Workers write results to scratchpads
6. Coordinator reads scratchpads and synthesizes

### Shared State Between Agents

- **Structured data:** Use `solo_kv_set` / `solo_kv_get` for small key-value pairs
- **Long-form text:** Use scratchpads for reports, plans, or large context
- **Exclusive access:** Use `solo_lock_acquire` / `solo_lock_release` when multiple agents might write the same resource

### Periodic Monitoring

```
solo_timer_set(120000, "Check all worker progress and report status", loop=true)
```

### Readiness Checks

- Use `solo_wait_for_bound_port` for services that listen on a port
- Use `solo_timer_fire_when_idle_any` for worker processes that will eventually go idle

---

## Full Workflow: Coordinator + Workers

Putting it all together — a coordinator spawns workers, assigns tasks, and collects results:

```
# 1. Set project scope
solo_select_project(project_id=4)

# 2. Store shared config
solo_kv_set(key="target_startup_ms", value="200")
solo_kv_set(key="migration_status", value="starting")

# 3. Create todos
solo_todo_create(title="Research plugin managers", priority="high")
solo_todo_create(title="Implement migration", priority="high")
solo_todo_create(title="Validate results", priority="medium")
solo_todo_add_blocker(todo_id=2, blocker_id=1)
solo_todo_add_blocker(todo_id=3, blocker_id=2)

# 4. Discover agent runtimes, then spawn a worker
solo_list_agent_tools()
→ returns [{"id": 11, "name": "Pi", ...}, ...]
solo_spawn_process(kind="agent", name="research-worker", agent_tool_id=11)
→ returns {process_id: 42, name: "research-worker", agent_instructions: "..."}

# 5. Transfer the research task
solo_todo_transfer(todo_id=1, to_agent="agent-42")

# 6. Set a timer to check when worker finishes
solo_timer_fire_when_idle_any(processes=[42], max_wait_ms=600000,
  body="Research worker is idle. Read scratchpad 'research-results' and proceed.")

# 7. Set a recurring progress monitor
solo_timer_set(120000, body="Check solo_todo_list() and solo_kv_get('migration_status')", loop=true)

# 8. Use locks for exclusive file access
solo_lock_acquire(lock_key="zshrc-edit")
# ... edit .zshrc ...
solo_lock_release(lock_key="zshrc-edit")

# 9. When done, update status and cancel timers
solo_kv_set(key="migration_status", value="complete")
solo_timer_cancel(timer_id=1)
```
