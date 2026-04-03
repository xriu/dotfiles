# Dev Loop Extension

A pi extension implementing an iterative development workflow: plan → build → debug/simplify → loop.

## Workflow

```
/xplan (think first)
    │
    ▼
/xbuild (write code)
    │
    ▼
┌─────────────┐
│   works?    │
└─────────────┘
    │
    ├── No ──► /xdebug ──┐
    │                    │
    ├── Yes ─► /xsimplify│
    │                    │
    ▼                    ▼
  /xloop ◄───────────────┘
    │
    ▼
┌─────────────┐
│    done?    │
└─────────────┘
    │
    ├── Yes ──► Build more (start over)
    └── No ───► Continue (loop back)
```

## Commands

| Command      | Description                         | Phase          |
| ------------ | ----------------------------------- | -------------- |
| `/xplan`     | Enter planning phase (read-only)    | 📋 Planning    |
| `/xbuild`    | Enter building phase (full tools)   | 🔨 Building    |
| `/xdebug`    | Enter debugging phase               | 🐛 Debugging   |
| `/xsimplify` | Enter simplification phase          | ✨ Simplifying |
| `/xloop`     | Enter loop phase (check completion) | 🔄 Looping     |
| `/xstatus`   | Show interactive workflow status    | -              |

## Quick Start

1. **Start with planning**:

   ```bash
   pi --xloop
   ```

2. **Create a plan** by asking the agent to explore and plan

3. **Build** with `/xbuild` when ready to implement

## Keyboard Shortcut

- **Ctrl+Alt+X** - Cycle through phases: idle → plan → build → loop → idle

## CLI Flag

- **--xloop** - Start directly in planning phase

## Features

- **Phase-specific prompts** - Each phase injects tailored guidance
- **Tool restrictions** - Planning phase is read-only
- **Plan extraction** - Automatically tracks numbered plan steps
- **Session persistence** - State survives restarts
- **Visual status** - Footer shows current phase and iteration count

## Prompt Files

Phase prompts are loaded from:

```
~/.pi/agent/prompts/xplan.md      # Planning phase
~/.pi/agent/prompts/xbuild.md     # Building phase
~/.pi/agent/prompts/xdebug.md     # Debugging phase
~/.pi/agent/prompts/xsimplify.md  # Simplification phase
~/.pi/agent/prompts/xloop.md      # Loop phase
```

Edit these files to customize phase behavior.

## Installation

Files are located at:

```
~/.pi/agent/extensions/dev-loop/
├── index.ts     # Main extension (13.5KB)
├── AGENTS.md    # Agent guidance documentation
└── README.md    # This file

~/.pi/agent/prompts/
├── xplan.md     # Planning prompt
├── xbuild.md    # Building prompt
├── xdebug.md    # Debugging prompt
├── xsimplify.md # Simplification prompt
└── xloop.md     # Loop prompt
```

## Usage Example

```
$ pi --xloop

You: Help me add authentication to the API

Agent: [PLAN PHASE] I'll explore the codebase...
       Plan:
       1. Review current API structure
       2. Identify authentication points
       3. Design auth middleware
       4. Implement middleware
       5. Add tests

       What next? [Start building / Refine / Stay in plan mode]

You: (select "Start building")

Agent: [BUILD PHASE] 🔨 Implementing authentication...
       ✓ Added auth middleware to src/middleware/
       ✓ Updated routes in src/api/
       ✓ Created tests in tests/auth.test.ts

       Running tests... All pass!

       Does it work? Yes! Use /xsimplify to clean up.

You: /xsimplify

Agent: [SIMPLIFY PHASE] ✨ Cleaning up...
       ✓ Removed duplicate validation logic
       ✓ Improved error handling
       ✓ Added doc comments
       ✓ Deleted unused helper functions

You: /xloop

Agent: [LOOP PHASE] 🔄 Checking completion...

       Completed: Authentication for API
       - Auth middleware implemented
       - Tests passing
       - Code cleaned up

       Done with this feature? Or more to build?

You: Done, let's summarize

Agent: Authentication feature complete! Ready for next task.
       Use /xplan to start a new feature.
```

## Phase Details

### 📋 Planning Phase

- **Tools**: read, bash, grep, find, ls (read-only)
- **Goal**: Understand the problem, explore codebase, create numbered plan
- **Blocked**: File writes, git operations, package installs

### 🔨 Building Phase

- **Tools**: read, bash, edit, write (full access)
- **Goal**: Implement the plan step by step
- **Decision**: Does it work?

### 🐛 Debugging Phase

- **Tools**: read, bash, edit, write (full access)
- **Goal**: Fix issues when things don't work
- **Decision**: Fixed?

### ✨ Simplifying Phase

- **Tools**: read, bash, edit, write (full access)
- **Goal**: Clean up, refactor, remove duplication
- **Transition**: Then loop

### 🔄 Loop Phase

- **Tools**: read, bash, edit, write (full access)
- **Goal**: Decide if done or continue
- **Decision**: More features? Or complete?

## Customization

Edit the prompt files to change phase behavior:

```bash
# Example: Make planning more thorough
vim ~/.pi/agent/prompts/xplan.md

# Example: Add specific debugging techniques
vim ~/.pi/agent/prompts/xdebug.md
```

The prompts are loaded at runtime with caching, so changes take effect immediately after `/reload`.

## Status Display

When in a phase, you'll see:

- **Footer**: `📋 Planning` (or current phase icon)
- **Widget**: Iteration count and step progress

Use `/xloop` to see full interactive status with workflow diagram.
