/**
 * PromptBuilder — prompt assembly for ralph-wiggum loops.
 * Pure string construction: no file I/O, no mutable state.
 */

import type { LoopState } from "./loop-store";
import { isPlanLevelLoop } from "./loop-store";

export const COMPLETE_MARKER = "<promise>COMPLETE</promise>";

const TDD_INSTRUCTIONS = `## TDD Workflow (Red-Green-Refactor)

You are using Test-Driven Development in this loop. Follow the full skill below.

### Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe *what* the system does, not *how* it does it. A good test reads like a specification — "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

Do not add tests which simply restate the implementation. These provide zero confidence.

### Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" — treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:
- Tests written in bulk test *imagined* behavior, not *actual* behavior
- You end up testing the *shape* of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes — they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

~~~~
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
~~~~

### Workflow

#### 1. Planning

Before writing any code:
- Confirm with user what interface changes are needed
- Confirm with user which behaviors to test (prioritize)
- Identify opportunities for deep modules (small interface, deep implementation)
- Design interfaces for testability (see Interface Design below)
- List the behaviors to test (not implementation steps)
- Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

#### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

~~~~
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
~~~~

This is your tracer bullet — proves the path works end-to-end.

#### 3. Incremental Loop

For each remaining behavior:

~~~~
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
~~~~

Rules:
- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

#### 4. Refactor

After all tests pass, look for refactor candidates (see Refactoring below):
- Extract duplication
- Deepen modules (move complexity behind simple interfaces)
- Apply SOLID principles where natural
- Consider what new code reveals about existing code
- Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

### Checklist Per Cycle

~~~~
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] Code is minimal for this test
[ ] No speculative features added
~~~~

---

## Appendix: Tests — Good vs Bad Examples

### Good Tests

**Integration-style**: Test through real interfaces, not mocks of internal parts.

~~~~typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
~~~~

Characteristics:
- Tests behavior users/callers care about
- Uses public API only
- Survives internal refactors
- Describes WHAT, not HOW
- One logical assertion per test

### Bad Tests

**Implementation-detail tests**: Coupled to internal structure.

~~~~typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
~~~~

Red flags:
- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring without behavior change
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

~~~~typescript
// BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
~~~~

---

## Appendix: Mocking Guidelines

Mock at **system boundaries** only:
- External APIs (payment, email, etc.)
- Databases (sometimes — prefer test DB)
- Time/randomness
- File system (sometimes)

**Don't mock**:
- Your own classes/modules
- Internal collaborators
- Anything you control

### Designing for Mockability

At system boundaries, design interfaces that are easy to mock:

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

~~~~typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
~~~~

**2. Prefer SDK-style interfaces over generic fetchers**

Create specific functions for each external operation instead of one generic function with conditional logic:

~~~~typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(\`/users/\${id}\`),
  getOrders: (userId) => fetch(\`/users/\${userId}/orders\`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
~~~~

The SDK approach means:
- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint

---

## Appendix: Refactoring Candidates

After TDD cycle, look for:
- **Duplication** → Extract function/class
- **Long methods** → Break into private helpers (keep tests on public interface)
- **Shallow modules** → Combine or deepen
- **Feature envy** → Move logic to where data lives
- **Primitive obsession** → Introduce value objects
- **Existing code** the new code reveals as problematic

---

## Appendix: Deep Modules

From "A Philosophy of Software Design":

**Deep module** = small interface + lots of implementation

~~~~
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
└─────────────────────┘
~~~~

**Shallow module** = large interface + little implementation (avoid)

~~~~
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
~~~~

When designing interfaces, ask:
- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

---

## Appendix: Interface Design for Testability

Good interfaces make testing natural:

**1. Accept dependencies, don't create them**

~~~~typescript
// Testable
function processOrder(order, paymentGateway) {}

// Hard to test
function processOrder(order) {
  const gateway = new StripeGateway();
}
~~~~

**2. Return results, don't produce side effects**

~~~~typescript
// Testable
function calculateDiscount(cart): Discount {}

// Hard to test
function applyDiscount(cart): void {
  cart.total -= discount;
}
~~~~

**3. Small surface area**
- Fewer methods = fewer tests needed
- Fewer params = simpler test setup`;

/**
 * Detect if a loop should use TDD workflow.
 * Checks plan name and task content for TDD signals.
 */
function isTDDLoop(planName: string, taskContent: string): boolean {
	const name = planName.toLowerCase();
	const content = taskContent.toLowerCase();
	return (
		name.includes("tdd") ||
		name.includes("test-driven") ||
		content.includes("red-green") ||
		content.includes("tdd cycle") ||
		content.includes("test-driven")
	);
}

export function buildPrompt(
	state: LoopState,
	taskContent: string,
	isReflection: boolean,
	prdContent?: string,
	tddMode?: boolean,
): string {
	const maxStr = state.maxIterations > 0 ? `/${state.maxIterations}` : "";
	const isPlanLevel = isPlanLevelLoop(state.name);
	const header = `───────────────────────────────────────────────────────────────────────
🔄 RALPH LOOP: ${state.name} | Iteration ${state.iteration}${maxStr}${isReflection ? " | 🪞 REFLECTION" : ""}${isPlanLevel ? " | 📋 PLAN-LEVEL" : ""}
───────────────────────────────────────────────────────────────────────`;

	const parts = [header, ""];

	// Plan-level loops: include PRD as read-only context
	if (isPlanLevel && prdContent) {
		parts.push(
			`## Plan Context (from PRD.md — READ-ONLY, do not modify)\n\n${prdContent}\n\n---`,
		);
	}

	if (isReflection) parts.push(state.reflectInstructions, "\n---\n");

	// Priority: explicit param > persisted state > auto-detect
	const isTDD = tddMode ?? state.tddMode ?? isTDDLoop(state.name, taskContent);
	if (isTDD) parts.push(TDD_INSTRUCTIONS, "\n---\n");

	if (isPlanLevel) {
		parts.push(
			`## Current Issue (from ${state.taskFile})\n\n${taskContent}\n\n---`,
		);
	} else {
		parts.push(
			`## Current Task (from ${state.taskFile})\n\n${taskContent}\n\n---`,
		);
	}

	parts.push(`\n## Instructions\n`);
	parts.push(
		"User controls: ESC pauses the assistant. Send a message to resume. Run /ralph-stop when idle to stop the loop.\n",
	);
	parts.push(
		`You are in a Ralph loop (iteration ${state.iteration}${state.maxIterations > 0 ? ` of ${state.maxIterations}` : ""}).\n`,
	);

	if (isPlanLevel) {
		parts.push(
			"**PLAN-LEVEL LOOP**: You are working through issues sequentially. PRD.md is read-only context — update the issue file only.\n",
		);
		parts.push(`1. Work on the current issue: ${state.taskFile}`);
		parts.push(
			`2. Update the issue file (${state.taskFile}) with your progress — check off acceptance criteria as you complete them`,
		);
		parts.push(
			`3. When ALL acceptance criteria are checked, call ralph_done to advance to the next issue`,
		);
		parts.push(
			`4. When ALL issues in the plan are complete, respond with: ${COMPLETE_MARKER}`,
		);
	} else {
		if (state.itemsPerIteration > 0) {
			parts.push(
				`**THIS ITERATION: Process approximately ${state.itemsPerIteration} items, then call ralph_done.**\n`,
			);
			parts.push(
				`1. Work on the next ~${state.itemsPerIteration} items from your checklist`,
			);
		} else {
			parts.push(`1. Continue working on the task`);
		}
		parts.push(
			`2. Update the task file (${state.taskFile}) with your progress`,
		);
		parts.push(`3. When FULLY COMPLETE, respond with: ${COMPLETE_MARKER}`);
		parts.push(
			`4. Otherwise, call the ralph_done tool to proceed to next iteration`,
		);
	}

	return parts.join("\n");
}
