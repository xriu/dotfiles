# Dev Loop Workflow - Agent Guidance

This document guides AI agents on how to effectively use the dev-loop workflow.

## Workflow Overview

The dev-loop is an iterative development cycle:

```
/xplan → /xbuild → works? → /xdebug OR /xsimplify → /xloop → done?
```

## Phase-by-Phase Instructions

### /xplan Phase

**Purpose**: Explore and plan before making changes.

**Your behavior**:

1. Use read-only tools (read, bash, grep, find, ls) only
2. Explore the codebase thoroughly to understand context
3. Ask clarifying questions if requirements are unclear
4. Output a numbered plan with this format:

   ```
   Plan:
   1. First step description
   2. Second step description
   3. Third step description
   ...
   ```

5. DO NOT make any file changes in this phase

**Transition**: After plan is approved, user will call `/xbuild`

### /xbuild Phase

**Purpose**: Implement the planned changes.

**Your behavior**:

1. Full tool access restored (read, bash, edit, write)
2. Implement changes following the numbered plan
3. Write clean, working code
4. Test as you implement

**Decision point**: After implementation, evaluate:

- Does it work? → Use `/xsimplify` to clean up
- Does NOT work? → Use `/xdebug` to fix

### /xdebug Phase

**Purpose**: Fix issues when implementation doesn't work.

**Your behavior**:

1. Investigate root cause systematically
2. Identify the bug or issue
3. Implement a fix
4. Verify the fix works

**Decision point**: After fixing:

- Works now? → Use `/xsimplify` to clean up
- Still broken? → Continue debugging or use `/xplan` to reassess

### /xsimplify Phase

**Purpose**: Clean up and optimize working code.

**Your behavior**:

1. Remove code duplication
2. Improve naming and structure
3. Add necessary comments (not excessive)
4. Delete dead code
5. Ensure code is maintainable

**Transition**: Use `/xloop` to check completion

### /xloop Phase

**Purpose**: Decide if work is complete or needs more iteration.

**Your behavior**:

1. Summarize what was accomplished
2. Ask: Is this feature/task complete?
3. Decision:
   - Done → Summarize and conclude
   - Not done → Use `/xbuild` for next feature
   - Need reassessment → Use `/xplan` to restart planning

## Output Format

Always use numbered plans in the plan phase:

```
Plan:
1. Read the configuration file to understand current settings
2. Identify all files that need modification
3. Create backup of critical files
4. Implement the new feature in module X
5. Update tests for module X
6. Verify all tests pass
```

## Best Practices

1. **Stay in phase** - Don't skip phases or jump ahead
2. **Be explicit** - Clearly state what phase you're in
3. **Number your plans** - Makes steps trackable
4. **Test after building** - Verify before moving to simplify
5. **Actually simplify** - Don't skip this phase, refactoring matters
6. **Loop consciously** - Make a deliberate decision about completion

## Decision Flowchart

```
                    /xplan
                       │
                       ▼
                    /xbuild
                       │
                       ▼
               ┌───────────────┐
               │   works?      │
               └───────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
      No │                  Yes│
         ▼                     ▼
     /xdebug              /xsimplify
         │                     │
         └──────────┬──────────┘
                    ▼
                  /xloop
                    │
                    ▼
               ┌───────────────┐
               │   done?       │
               └───────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
      Yes│                   No│
         ▼                     ▼
      DONE               /xbuild (continue)
                            │
                            └──► back to works?
```
