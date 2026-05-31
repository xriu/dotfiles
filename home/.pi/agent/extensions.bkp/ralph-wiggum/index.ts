/**
 * Ralph Wiggum - Long-running agent loops for iterative development.
 * Uses .scratch/<plan>/ structure with PRD.md and issues/.
 * Port of Geoffrey Huntley's approach.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const SCRATCH_DIR = ".scratch";
const COMPLETE_MARKER = "<promise>COMPLETE</promise>";

const ISSUE_TEMPLATE = `## Parent

[PRD](../PRD.md)

## What to build

Describe the task here.

## Acceptance criteria

- [ ] Criterion 1

## Blocked by

None.
`;

const DEFAULT_REFLECT_INSTRUCTIONS = `REFLECTION CHECKPOINT

Pause and reflect on your progress:
1. What has been accomplished so far?
2. What's working well?
3. What's not working or blocking progress?
4. Should the approach be adjusted?
5. What are the next priorities?

Update the task file with your reflection, then continue working.`;

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

type LoopStatus = "active" | "paused" | "completed";

interface LoopState {
	name: string;
	taskFile: string;
	iteration: number;
	maxIterations: number;
	itemsPerIteration: number;
	reflectEvery: number;
	reflectInstructions: string;
	active: boolean;
	status: LoopStatus;
	startedAt: string;
	completedAt?: string;
	lastReflectionAt: number;
	tddMode?: boolean;
}

const STATUS_ICONS: Record<LoopStatus, string> = {
	active: "▶",
	paused: "⏸",
	completed: "✓",
};

export default function (pi: ExtensionAPI) {
	let currentLoop: string | null = null;
	// Tracks cross-project scratch dirs for active loops.
	const loopScratchDirs = new Map<string, string>();
	// Set by ralph_done tool, read/cleared by agent_end to prevent double-advance.
	let ralphDoneThisTurn = false;

	// --- File helpers ---

	const scratchDir = (ctx: ExtensionContext) =>
		path.resolve(ctx.cwd, SCRATCH_DIR);

	/** Resolve the .scratch dir — uses override for absolute/cross-project paths. */
	const resolveScratchDir = (
		ctx: ExtensionContext,
		parsed: ParsedPlanPath,
	): string => parsed.scratchDirOverride ?? scratchDir(ctx);

	/** Extract scratch dir from a task file path (works for saved state). */
	const scratchDirFromFile = (taskFile: string, fallback: string): string => {
		const match = taskFile.match(/^(.+?)[/\\]\.scratch[/\\]/);
		return match ? path.resolve(match[1], SCRATCH_DIR) : fallback;
	};

	const CROSS_REFS_FILE = ".ralph.cross-refs.json";

	function saveCrossProjectRefs(ctx: ExtensionContext): void {
		const refs: Record<string, string> = {};
		for (const [name, sd] of loopScratchDirs) {
			refs[name] = sd;
		}
		const filePath = path.join(scratchDir(ctx), CROSS_REFS_FILE);
		ensureDir(filePath);
		fs.writeFileSync(filePath, JSON.stringify(refs, null, 2), "utf-8");
	}

	function loadCrossProjectRefs(ctx: ExtensionContext): void {
		const filePath = path.join(scratchDir(ctx), CROSS_REFS_FILE);
		const raw = safeJsonParse(filePath);
		if (raw && typeof raw === "object") {
			for (const [name, sd] of Object.entries(raw)) {
				if (typeof sd === "string") {
					loopScratchDirs.set(name, sd);
				}
			}
		}
	}

	const sanitize = (name: string) =>
		name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");

	/**
	 * Parse a user-provided path into { planName, issueName?, isIssue }.
	 * Supported formats:
	 *   "my-plan"                    → plan-level (works through issues sequentially)
	 *   "my-plan/01-foo"             → issue-level
	 *   "my-plan/issues/01-foo"      → issue-level
	 *   ".scratch/my-plan"           → plan-level
	 *   ".scratch/my-plan/01-foo"    → issue-level
	 *   ".scratch/my-plan/issues/01-foo" → issue-level
	 *   "/abs/path/.scratch/my-plan" → plan-level (cross-project)
	 *   "/abs/path/.scratch/my-plan/01-foo" → issue-level (cross-project)
	 */
	interface ParsedPlanPath {
		planName: string;
		issueName: string | null;
		isIssue: boolean;
		/** Absolute path to the .scratch dir when using cross-project paths. */
		scratchDirOverride?: string;
	}

	function parsePlanPath(input: string): ParsedPlanPath {
		let cleaned = input;
		let scratchDirOverride: string | undefined;

		// Detect absolute or cross-project paths: /some/path/.scratch/...
		const absMatch = input.match(/^(.+?)[/\\]\.scratch[/\\](.+)$/);
		if (absMatch) {
			scratchDirOverride = path.resolve(absMatch[1], SCRATCH_DIR);
			cleaned = absMatch[2];
		} else if (cleaned.startsWith(".scratch/")) {
			cleaned = cleaned.slice(".scratch/".length);
		}

		const parts = cleaned.split(/[/\\]/).filter(Boolean);
		if (parts.length === 0) {
			return {
				planName: "",
				issueName: null,
				isIssue: false,
			};
		}

		const planName = sanitize(parts[0]);

		if (parts.length >= 2) {
			let issuePart: string;
			if (parts[1] === "issues" && parts.length >= 3) {
				issuePart = parts[2];
			} else if (parts[1] !== "issues") {
				issuePart = parts[1];
			} else {
				return {
					planName,
					issueName: null,
					isIssue: false,
				};
			}
			const issueName = issuePart.replace(/\.md$/, "");
			return {
				planName,
				issueName,
				isIssue: true,
				scratchDirOverride,
			};
		}

		return {
			planName,
			issueName: null,
			isIssue: false,
			scratchDirOverride,
		};
	}

	/**
	 * Returns the state file path for a parsed plan path.
	 * Issue-level: .scratch/<plan>/issues/<issue>.state.json
	 * Plan-level:  .scratch/<plan>/.ralph.state.json
	 */
	function statePathForPath(
		ctx: ExtensionContext,
		parsed: ParsedPlanPath,
	): string {
		const sd = resolveScratchDir(ctx, parsed);
		if (parsed.isIssue && parsed.issueName) {
			const issuesDir = path.join(sd, parsed.planName, "issues");
			return path.join(issuesDir, `${sanitize(parsed.issueName)}.state.json`);
		}
		return path.join(sd, parsed.planName, ".ralph.state.json");
	}

	/**
	 * Returns the task file path for an issue-level parsed plan path.
	 * Issue-level: .scratch/<plan>/issues/<issue>.md
	 */
	function taskFilePath(ctx: ExtensionContext, parsed: ParsedPlanPath): string {
		const sd = resolveScratchDir(ctx, parsed);
		const issueName = parsed.issueName!;
		return path.join(
			sd,
			parsed.planName,
			"issues",
			`${sanitize(issueName)}.md`,
		);
	}

	function ensureDir(filePath: string): void {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir))
			fs.mkdirSync(dir, {
				recursive: true,
			});
	}

	function tryDelete(filePath: string): void {
		try {
			if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		} catch {
			/* ignore */
		}
	}

	function tryRead(filePath: string): string | null {
		try {
			return fs.readFileSync(filePath, "utf-8");
		} catch {
			return null;
		}
	}

	// --- State management ---

	function safeJsonParse(filePath: string): unknown | null {
		try {
			const raw = tryRead(filePath);
			if (!raw) return null;
			return JSON.parse(raw);
		} catch {
			/* corrupted or invalid JSON */
			return null;
		}
	}

	function migrateState(
		raw: Partial<LoopState> & {
			name: string;
		},
	): LoopState {
		if (!raw.status) raw.status = raw.active ? "active" : "paused";
		raw.active = raw.status === "active";
		if ("reflectEveryItems" in raw && !raw.reflectEvery) {
			raw.reflectEvery = (raw as any).reflectEveryItems;
		}
		if ("lastReflectionAtItems" in raw && raw.lastReflectionAt === undefined) {
			raw.lastReflectionAt = (raw as any).lastReflectionAtItems;
		}
		return raw as LoopState;
	}

	/**
	 * Load state by loop name. Scans .scratch/ for matching state files.
	 * The loop name is derived from the plan name (for plan-level loops)
	 * or the issue name (for issue-level loops).
	 */
	function loadState(ctx: ExtensionContext, name: string): LoopState | null {
		// Check cross-project override first
		const override = loopScratchDirs.get(name);
		if (override) {
			const planStateFile = path.join(override, name, ".ralph.state.json");
			const raw = safeJsonParse(planStateFile);
			if (raw) {
				return migrateState(
					raw as Partial<LoopState> & {
						name: string;
					},
				);
			}
			// Also check issue-level states in the override dir
			const issuesDir = path.join(override, name, "issues");
			if (fs.existsSync(issuesDir)) {
				for (const issueFile of fs.readdirSync(issuesDir)) {
					if (!issueFile.endsWith(".state.json")) continue;
					const raw = safeJsonParse(path.join(issuesDir, issueFile));
					if (!raw) continue;
					const state = migrateState(
						raw as Partial<LoopState> & {
							name: string;
						},
					);
					if (state.name === name) return state;
				}
			}
		}

		const sd = scratchDir(ctx);
		if (!fs.existsSync(sd)) return null;

		for (const planEntry of fs.readdirSync(sd)) {
			const planDir = path.join(sd, planEntry);
			if (!fs.statSync(planDir).isDirectory()) continue;

			// Check plan-level state
			const planStateFile = path.join(planDir, ".ralph.state.json");
			const raw = safeJsonParse(planStateFile);
			if (raw) {
				const state = migrateState(
					raw as Partial<LoopState> & {
						name: string;
					},
				);
				if (state.name === name) return state;
			}

			// Check issue-level states
			const issuesDir = path.join(planDir, "issues");
			if (fs.existsSync(issuesDir)) {
				for (const issueFile of fs.readdirSync(issuesDir)) {
					if (!issueFile.endsWith(".state.json")) continue;
					const raw = safeJsonParse(path.join(issuesDir, issueFile));
					if (!raw) continue;
					const state = migrateState(
						raw as Partial<LoopState> & {
							name: string;
						},
					);
					if (state.name === name) return state;
				}
			}
		}

		return null;
	}

	function saveState(ctx: ExtensionContext, state: LoopState): void {
		state.active = state.status === "active";

		// Plan-level loops (name has no "/") save to the plan directory
		const isPlanLevel = !state.name.includes("/");
		if (isPlanLevel) {
			const sd = loopScratchDirs.get(state.name) ?? scratchDir(ctx);
			const sp = path.join(sd, state.name, ".ralph.state.json");
			ensureDir(sp);
			fs.writeFileSync(sp, JSON.stringify(state, null, 2), "utf-8");
			return;
		}

		// Issue-level loops: state next to the issue file
		const relTask = path.relative(ctx.cwd, state.taskFile);
		const parsed = parsePlanPath(relTask);
		const sp = statePathForPath(ctx, parsed);
		ensureDir(sp);
		fs.writeFileSync(sp, JSON.stringify(state, null, 2), "utf-8");
	}

	/**
	 * List all loops by scanning .scratch/<plan>/.ralph.state.json and
	 * .scratch/<plan>/issues/*.state.json
	 */
	function listLoops(ctx: ExtensionContext): LoopState[] {
		const results: LoopState[] = [];
		const sd = scratchDir(ctx);
		if (!fs.existsSync(sd)) return results;

		for (const planEntry of fs.readdirSync(sd)) {
			const planDir = path.join(sd, planEntry);
			if (!fs.statSync(planDir).isDirectory()) continue;

			// Plan-level state
			const planStateFile = path.join(planDir, ".ralph.state.json");
			const raw = safeJsonParse(planStateFile);
			if (raw) {
				results.push(
					migrateState(
						raw as Partial<LoopState> & {
							name: string;
						},
					),
				);
			}

			// Issue-level states
			const issuesDir = path.join(planDir, "issues");
			if (fs.existsSync(issuesDir)) {
				for (const issueFile of fs.readdirSync(issuesDir)) {
					if (!issueFile.endsWith(".state.json")) continue;
					const raw = safeJsonParse(path.join(issuesDir, issueFile));
					if (!raw) continue;
					results.push(
						migrateState(
							raw as Partial<LoopState> & {
								name: string;
							},
						),
					);
				}
			}
		}

		return results;
	}

	// --- Plan discovery ---

	interface PlanInfo {
		name: string;
		prdPath: string;
		prdTitle: string;
		prdStatus: string;
		issueCount: number;
		issues: IssueInfo[];
		activeLoops: LoopState[];
	}

	interface IssueInfo {
		fileName: string;
		name: string;
		state: LoopState | null;
	}

	function discoverPlans(ctx: ExtensionContext): PlanInfo[] {
		const sd = scratchDir(ctx);
		if (!fs.existsSync(sd)) return [];

		// Scan all loops once, grouped by plan name
		const allLoops = listLoops(ctx);
		const loopsByPlan = new Map<string, LoopState[]>();
		for (const loop of allLoops) {
			const rel = path.relative(ctx.cwd, loop.taskFile);
			const parts = rel.split(/[/\\]/);
			if (parts[0] === SCRATCH_DIR && parts.length >= 2) {
				const plan = parts[1];
				if (!loopsByPlan.has(plan)) loopsByPlan.set(plan, []);
				loopsByPlan.get(plan)!.push(loop);
			}
		}

		const plans: PlanInfo[] = [];
		for (const entry of fs.readdirSync(sd)) {
			const planDir = path.join(sd, entry);
			if (!fs.statSync(planDir).isDirectory()) continue;

			const prdPath = path.join(planDir, "PRD.md");
			if (!fs.existsSync(prdPath)) continue;

			const prdContent = tryRead(prdPath) || "";
			const prdTitle = extractTitle(prdContent);
			const prdStatus = extractStatus(prdContent);

			const issuesDir = path.join(planDir, "issues");
			const issues: IssueInfo[] = [];
			if (fs.existsSync(issuesDir)) {
				for (const f of fs.readdirSync(issuesDir)) {
					if (!f.endsWith(".md") || f.endsWith(".state.json")) continue;
					const issueName = f.replace(/\.md$/, "");
					const stateFile = path.join(issuesDir, `${issueName}.state.json`);
					const raw = safeJsonParse(stateFile);
					const state = raw
						? migrateState(
								raw as Partial<LoopState> & {
									name: string;
								},
							)
						: null;
					issues.push({
						fileName: f,
						name: issueName,
						state,
					});
				}
			}

			plans.push({
				name: entry,
				prdPath: path.join(SCRATCH_DIR, entry, "PRD.md"),
				prdTitle,
				prdStatus,
				issueCount: issues.length,
				issues,
				activeLoops: loopsByPlan.get(entry) ?? [],
			});
		}

		return plans;
	}

	function extractTitle(prdContent: string): string {
		// YAML frontmatter
		const yamlMatch = prdContent.match(/^title:\s*["']?([^"'\n]+)["']?\s*$/m);
		if (yamlMatch) return yamlMatch[1].trim();
		// Markdown heading
		const match = prdContent.match(/^#\s+PRD:\s*(.+)$/m);
		return match ? match[1].trim() : "Untitled";
	}

	function extractStatus(prdContent: string): string {
		// YAML frontmatter
		const yamlMatch = prdContent.match(/^status:\s*["']?([^"'\n]+)["']?\s*$/m);
		if (yamlMatch) return yamlMatch[1].trim();
		// Inline markdown
		const match = prdContent.match(/\*\*Status:\*\*\s*`([^`]+)`/);
		return match ? match[1] : "unknown";
	}

	/**
	 * Parse acceptance criteria checkboxes from issue content.
	 * Returns { total, checked } count.
	 */
	function parseCheckboxes(content: string): {
		total: number;
		checked: number;
	} {
		const lines = content.split("\n");
		let total = 0;
		let checked = 0;
		for (const line of lines) {
			const trimmed = line.trim();
			if (
				trimmed.startsWith("- [ ]") ||
				trimmed.startsWith("- [x]") ||
				trimmed.startsWith("- [X]")
			) {
				total++;
				if (trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]"))
					checked++;
			}
		}
		return {
			total,
			checked,
		};
	}

	/**
	 * Find the first incomplete issue in a plan's issues/ directory.
	 * Returns the absolute path to the issue file, or null if all done.
	 * @param skipFile Absolute path to skip (prevents returning the current issue as "next").
	 */
	function findNextIncompleteIssue(
		ctx: ExtensionContext,
		planName: string,
		scratchOverride?: string,
		skipFile?: string,
	): string | null {
		const sd = scratchOverride ?? scratchDir(ctx);
		const issuesDir = path.join(sd, planName, "issues");
		if (!fs.existsSync(issuesDir)) return null;

		const skipAbs = skipFile ? path.resolve(skipFile) : undefined;

		const files = fs
			.readdirSync(issuesDir)
			.filter((f) => f.endsWith(".md"))
			.sort((a, b) =>
				a.localeCompare(b, undefined, {
					numeric: true,
				}),
			);

		for (const f of files) {
			const absPath = path.join(issuesDir, f);
			if (skipAbs && path.resolve(absPath) === skipAbs) continue;
			const content = tryRead(absPath);
			if (content === null) continue;
			const { total, checked } = parseCheckboxes(content);
			if (total === 0 || checked < total) {
				return absPath;
			}
		}

		return null; // all issues complete
	}

	/**
	 * For plan-level loops: if current issue is done, advance to next incomplete issue.
	 * Returns true if the loop should continue (issue advanced or not plan-level),
	 * false if all issues are done and the loop should complete.
	 * Skips the current file to prevent cycling back.
	 */
	function tryAdvancePlanIssue(
		ctx: ExtensionContext,
		state: LoopState,
	): boolean {
		const isPlanLevel = !state.name.includes("/");
		if (!isPlanLevel) return true;

		const currentContent = tryRead(path.resolve(ctx.cwd, state.taskFile));
		if (currentContent === null) return true;

		const { total, checked } = parseCheckboxes(currentContent);
		const issueDone = total === 0 ? state.iteration > 1 : checked >= total;
		if (!issueDone) return true;

		const sd = scratchDirFromFile(state.taskFile, scratchDir(ctx));
		const nextIssue = findNextIncompleteIssue(
			ctx,
			state.name,
			sd,
			state.taskFile,
		);
		if (nextIssue) {
			state.taskFile = nextIssue;
			return true;
		}
		return false; // all issues done
	}

	// --- Loop state transitions ---

	function pauseLoop(
		ctx: ExtensionContext,
		state: LoopState,
		message?: string,
	): void {
		state.status = "paused";
		state.active = false;
		saveState(ctx, state);
		currentLoop = null;
		updateUI(ctx);
		if (message && ctx.hasUI) ctx.ui.notify(message, "info");
	}

	function completeLoop(
		ctx: ExtensionContext,
		state: LoopState,
		banner: string,
	): void {
		state.status = "completed";
		state.completedAt = new Date().toISOString();
		state.active = false;
		saveState(ctx, state);
		currentLoop = null;
		updateUI(ctx);
		if (banner) pi.sendUserMessage(banner);
	}

	function stopLoop(
		ctx: ExtensionContext,
		state: LoopState,
		message?: string,
	): void {
		completeLoop(ctx, state, "");
		if (message && ctx.hasUI) ctx.ui.notify(message, "info");
	}

	// --- UI ---

	function formatLoop(l: LoopState): string {
		const status = `${STATUS_ICONS[l.status]} ${l.status}`;
		const iter =
			l.maxIterations > 0
				? `${l.iteration}/${l.maxIterations}`
				: `${l.iteration}`;
		return `${l.name}: ${status} (iteration ${iter})`;
	}

	function updateUI(ctx: ExtensionContext): void {
		if (!ctx.hasUI) return;

		const state = currentLoop ? loadState(ctx, currentLoop) : null;
		if (!state) {
			ctx.ui.setStatus("ralph", undefined);
			ctx.ui.setWidget("ralph", undefined);
			return;
		}

		const { theme } = ctx.ui;
		const maxStr = state.maxIterations > 0 ? `/${state.maxIterations}` : "";

		ctx.ui.setStatus(
			"ralph",
			theme.fg("accent", `🔄 ${state.name} (${state.iteration}${maxStr})`),
		);

		const lines = [
			theme.fg("accent", theme.bold("Ralph Wiggum")),
			theme.fg("muted", `Loop: ${state.name}`),
			theme.fg("dim", `Status: ${STATUS_ICONS[state.status]} ${state.status}`),
			theme.fg("dim", `Iteration: ${state.iteration}${maxStr}`),
			theme.fg("dim", `Task: ${state.taskFile}`),
		];
		if (state.reflectEvery > 0) {
			const next =
				state.reflectEvery - ((state.iteration - 1) % state.reflectEvery);
			lines.push(theme.fg("dim", `Next reflection in: ${next} iterations`));
		}
		lines.push("");
		lines.push(theme.fg("warning", "ESC pauses the assistant"));
		lines.push(
			theme.fg(
				"warning",
				"Send a message to resume; /ralph-stop ends the loop",
			),
		);
		ctx.ui.setWidget("ralph", lines);
	}

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

	// --- Prompt building ---

	function buildPrompt(
		state: LoopState,
		taskContent: string,
		isReflection: boolean,
		prdContent?: string,
		tddMode?: boolean,
	): string {
		const maxStr = state.maxIterations > 0 ? `/${state.maxIterations}` : "";
		const isPlanLevel = !state.name.includes("/");
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
		let isTDD = state.tddMode === true;
		if (tddMode !== undefined) {
			isTDD = tddMode;
		} else if (!state.tddMode) {
			isTDD = isTDDLoop(state.name, taskContent);
		}
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

	// --- Arg parsing ---

	function parseArgs(argsStr: string) {
		const tokens = argsStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
		const result = {
			name: "",
			maxIterations: 50,
			itemsPerIteration: 0,
			reflectEvery: 0,
			reflectInstructions: DEFAULT_REFLECT_INSTRUCTIONS,
			tdd: false,
		};

		for (let i = 0; i < tokens.length; i++) {
			const tok = tokens[i];
			const next = tokens[i + 1];
			if (tok === "--max-iterations" && next) {
				result.maxIterations = parseInt(next, 10) || 0;
				i++;
			} else if (tok === "--items-per-iteration" && next) {
				result.itemsPerIteration = parseInt(next, 10) || 0;
				i++;
			} else if (tok === "--reflect-every" && next) {
				result.reflectEvery = parseInt(next, 10) || 0;
				i++;
			} else if (tok === "--reflect-instructions" && next) {
				result.reflectInstructions = next.replace(/^"|"$/g, "");
				i++;
			} else if (tok === "--tdd") {
				result.tdd = true;
			} else if (!tok.startsWith("--")) {
				result.name = tok;
			}
		}
		return result;
	}

	// --- Commands ---

	const commands: Record<
		string,
		(rest: string, ctx: ExtensionContext) => void
	> = {
		start(rest, ctx) {
			const args = parseArgs(rest);
			if (!args.name) {
				ctx.ui.notify(
					"Usage: /ralph start <plan> [options]\n       /ralph start <plan>/<issue> [options]\n\nOptions: --items-per-iteration N --reflect-every N --max-iterations N --tdd",
					"warning",
				);
				return;
			}

			const parsed = parsePlanPath(args.name);
			if (!parsed.planName) {
				ctx.ui.notify(
					"Invalid plan path. Use: /ralph start <plan> or /ralph start <plan>/<issue>",
					"error",
				);
				return;
			}

			const taskFile = parsed.isIssue
				? taskFilePath(ctx, parsed)
				: findNextIncompleteIssue(
						ctx,
						parsed.planName,
						parsed.scratchDirOverride,
					);

			// Determine loop name
			const loopName =
				parsed.isIssue && parsed.issueName
					? `${parsed.planName}/${parsed.issueName}`
					: parsed.planName;

			// For plan-level loops, ensure issues exist
			if (!parsed.isIssue && !taskFile) {
				ctx.ui.notify(
					`Plan "${parsed.planName}" has no issues yet. Create one with: /ralph issue ${parsed.planName} <name>`,
					"warning",
				);
				return;
			}

			// TypeScript narrowing: taskFile is definitely a string past this point
			if (!taskFile) return;

			// Check for existing loop with same name
			const existing = loadState(ctx, loopName);
			if (existing) {
				if (existing.status === "active") {
					ctx.ui.notify(
						`Loop "${loopName}" is already active. Use /ralph resume ${loopName}`,
						"warning",
					);
				} else if (existing.status === "paused") {
					ctx.ui.notify(
						`Loop "${loopName}" is paused. Use /ralph resume ${loopName} to continue`,
						"warning",
					);
				} else {
					ctx.ui.notify(
						`Loop "${loopName}" is completed. Use /ralph cancel ${loopName} then start again`,
						"warning",
					);
				}
				return;
			}

			const fullPath = path.isAbsolute(taskFile)
				? taskFile
				: path.resolve(ctx.cwd, taskFile);
			if (!fs.existsSync(fullPath)) {
				ctx.ui.notify(
					`Issue file "${taskFile}" does not exist. Create it first.`,
					"error",
				);
				return;
			}

			const state: LoopState = {
				name: loopName,
				taskFile,
				iteration: 1,
				maxIterations: args.maxIterations,
				itemsPerIteration: args.itemsPerIteration,
				reflectEvery: args.reflectEvery,
				reflectInstructions: args.reflectInstructions,
				active: true,
				status: "active",
				startedAt: new Date().toISOString(),
				lastReflectionAt: 0,
				tddMode: args.tdd || undefined,
			};

			saveState(ctx, state);
			if (parsed.scratchDirOverride) {
				loopScratchDirs.set(loopName, parsed.scratchDirOverride);
				saveCrossProjectRefs(ctx);
			}
			currentLoop = loopName;
			updateUI(ctx);

			const content = tryRead(fullPath);
			if (content === null) {
				ctx.ui.notify(`Could not read task file: ${taskFile}`, "error");
				return;
			}
			// For plan-level loops, load PRD.md as read-only context
			const prdContent = parsed.isIssue
				? undefined
				: (tryRead(
						path.join(
							resolveScratchDir(ctx, parsed),
							parsed.planName,
							"PRD.md",
						),
					) ?? undefined);
			pi.sendUserMessage(
				buildPrompt(state, content, false, prdContent, args.tdd),
			);
		},

		stop(_rest, ctx) {
			if (!currentLoop) {
				const active = listLoops(ctx).find((l) => l.status === "active");
				if (active) {
					pauseLoop(
						ctx,
						active,
						`Paused Ralph loop: ${active.name} (iteration ${active.iteration})`,
					);
				} else {
					ctx.ui.notify("No active Ralph loop", "warning");
				}
				return;
			}
			const state = loadState(ctx, currentLoop);
			if (state) {
				pauseLoop(
					ctx,
					state,
					`Paused Ralph loop: ${currentLoop} (iteration ${state.iteration})`,
				);
			} else {
				const missingName = currentLoop;
				currentLoop = null;
				ctx.ui.notify(
					`Loop "${missingName}" state file missing. Cleared reference.`,
					"warning",
				);
			}
		},

		resume(rest, ctx) {
			const loopName = rest.trim();
			if (!loopName) {
				ctx.ui.notify("Usage: /ralph resume <name>", "warning");
				return;
			}

			const state = loadState(ctx, loopName);
			if (!state) {
				ctx.ui.notify(`Loop "${loopName}" not found`, "error");
				return;
			}
			if (state.status === "completed") {
				ctx.ui.notify(
					`Loop "${loopName}" is completed. Use /ralph start ${loopName} to restart`,
					"warning",
				);
				return;
			}

			if (currentLoop && currentLoop !== loopName) {
				const curr = loadState(ctx, currentLoop);
				if (curr) pauseLoop(ctx, curr);
			}

			state.status = "active";
			state.active = true;
			state.iteration++;

			// Match ralph_done: check AFTER increment so agent gets its final
			// allowed iteration (e.g. max=50 → iteration 50 is allowed,
			// iteration 51 completes).
			if (state.maxIterations > 0 && state.iteration > state.maxIterations) {
				completeLoop(
					ctx,
					state,
					`───────────────────────────────────────────────────────────────────────\n⚠️ RALPH LOOP STOPPED: ${state.name} | Max iterations (${state.maxIterations}) reached\n───────────────────────────────────────────────────────────────────────`,
				);
				ctx.ui.notify(
					`Loop "${loopName}" exceeded max ${state.maxIterations} iterations.`,
					"warning",
				);
				return;
			}

			// Plan-level loops: advance past completed issues on resume
			if (!tryAdvancePlanIssue(ctx, state)) {
				completeLoop(
					ctx,
					state,
					`───────────────────────────────────────────────────────────────────────\n✅ PLAN COMPLETE: ${state.name} | All issues finished\n───────────────────────────────────────────────────────────────────────`,
				);
				ctx.ui.notify(
					`Loop "${loopName}" has all issues complete. Cannot resume.`,
					"warning",
				);
				return;
			}

			saveState(ctx, state);
			const resumeSd = scratchDirFromFile(state.taskFile, scratchDir(ctx));
			if (resumeSd !== scratchDir(ctx)) {
				loopScratchDirs.set(loopName, resumeSd);
				saveCrossProjectRefs(ctx);
			}
			currentLoop = loopName;
			updateUI(ctx);

			ctx.ui.notify(
				`Resumed: ${loopName} (iteration ${state.iteration})`,
				"info",
			);

			const content = tryRead(path.resolve(ctx.cwd, state.taskFile));
			if (content === null) {
				ctx.ui.notify(`Could not read task file: ${state.taskFile}`, "error");
				return;
			}

			const needsReflection =
				state.reflectEvery > 0 &&
				state.iteration > 1 &&
				(state.iteration - 1) % state.reflectEvery === 0;

			// For plan-level loops, load PRD.md as read-only context
			const isPlanLevel = !state.name.includes("/");
			const prdContent = isPlanLevel
				? (tryRead(
						path.join(
							scratchDirFromFile(state.taskFile, scratchDir(ctx)),
							state.name,
							"PRD.md",
						),
					) ?? undefined)
				: undefined;
			pi.sendUserMessage(
				buildPrompt(state, content, needsReflection, prdContent),
			);
		},

		status(_rest, ctx) {
			const loops = listLoops(ctx);
			if (loops.length === 0) {
				ctx.ui.notify("No Ralph loops found.", "info");
				return;
			}
			ctx.ui.notify(
				`Ralph loops:\n${loops.map((l) => formatLoop(l)).join("\n")}`,
				"info",
			);
		},

		cancel(rest, ctx) {
			const loopName = rest.trim();
			if (!loopName) {
				ctx.ui.notify("Usage: /ralph cancel <name>", "warning");
				return;
			}
			const state = loadState(ctx, loopName);
			if (!state) {
				ctx.ui.notify(`Loop "${loopName}" not found`, "error");
				return;
			}
			if (currentLoop === loopName) currentLoop = null;

			// Delete state file — derive path from loop name, not taskFile
			const isPlanLevel = !loopName.includes("/");
			if (isPlanLevel) {
				const sd = loopScratchDirs.get(loopName) ?? scratchDir(ctx);
				tryDelete(path.join(sd, loopName, ".ralph.state.json"));
			} else {
				const relTask = path.relative(ctx.cwd, state.taskFile);
				const parsed = parsePlanPath(relTask);
				tryDelete(statePathForPath(ctx, parsed));
			}

			loopScratchDirs.delete(loopName);
			saveCrossProjectRefs(ctx);

			ctx.ui.notify(`Cancelled: ${loopName}`, "info");
			updateUI(ctx);
		},

		archive(rest, ctx) {
			const loopName = rest.trim();
			if (!loopName) {
				ctx.ui.notify("Usage: /ralph archive <name>", "warning");
				return;
			}
			const state = loadState(ctx, loopName);
			if (!state) {
				ctx.ui.notify(`Loop "${loopName}" not found`, "error");
				return;
			}
			if (state.status === "active") {
				ctx.ui.notify("Cannot archive active loop. Stop it first.", "warning");
				return;
			}

			if (currentLoop === loopName) currentLoop = null;
			const isPlanLevel = !loopName.includes("/");
			if (isPlanLevel) {
				const sd = loopScratchDirs.get(loopName) ?? scratchDir(ctx);
				tryDelete(path.join(sd, loopName, ".ralph.state.json"));
			} else {
				const relTask = path.relative(ctx.cwd, state.taskFile);
				const parsed = parsePlanPath(relTask);
				tryDelete(statePathForPath(ctx, parsed));
			}

			loopScratchDirs.delete(loopName);
			saveCrossProjectRefs(ctx);

			ctx.ui.notify(
				`Archived: ${loopName} (state removed, task file kept in .scratch/)`,
				"info",
			);
			updateUI(ctx);
		},

		clean(rest, ctx) {
			const all = rest.trim() === "--all";
			const completed = listLoops(ctx).filter((l) => l.status === "completed");

			if (completed.length === 0) {
				ctx.ui.notify("No completed loops to clean", "info");
				return;
			}

			for (const loop of completed) {
				const isPlanLevel = !loop.name.includes("/");
				if (isPlanLevel) {
					const sd = loopScratchDirs.get(loop.name) ?? scratchDir(ctx);
					tryDelete(path.join(sd, loop.name, ".ralph.state.json"));
				} else {
					const relTask = path.relative(ctx.cwd, loop.taskFile);
					const parsed = parsePlanPath(relTask);
					tryDelete(statePathForPath(ctx, parsed));
				}
				if (currentLoop === loop.name) currentLoop = null;
				loopScratchDirs.delete(loop.name);
			}
			saveCrossProjectRefs(ctx);

			const suffix = all
				? " (note: task files in .scratch/ are preserved)"
				: " (state only)";
			ctx.ui.notify(
				`Cleaned ${completed.length} loop(s)${suffix}:\n${completed.map((l) => `  • ${l.name}`).join("\n")}`,
				"info",
			);
			updateUI(ctx);
		},

		list(_rest, ctx) {
			commands.status(_rest, ctx);
		},

		nuke(rest, ctx) {
			const force = rest.trim() === "--yes";
			const warning =
				"This deletes ALL state files in .scratch/. Task files (PRD.md, issues) are preserved.";

			const run = () => {
				const sd = scratchDir(ctx);
				if (!fs.existsSync(sd)) {
					if (ctx.hasUI) ctx.ui.notify("No .scratch/ directory found.", "info");
					return;
				}

				currentLoop = null;

				// Walk and delete all .state.json files
				for (const entry of fs.readdirSync(sd)) {
					const planDir = path.join(sd, entry);
					if (!fs.statSync(planDir).isDirectory()) continue;

					// Plan-level state
					tryDelete(path.join(planDir, ".ralph.state.json"));

					// Issue-level states
					const issuesDir = path.join(planDir, "issues");
					if (fs.existsSync(issuesDir)) {
						for (const f of fs.readdirSync(issuesDir)) {
							if (f.endsWith(".state.json")) {
								tryDelete(path.join(issuesDir, f));
							}
						}
					}
				}

				if (ctx.hasUI) {
					ctx.ui.notify(
						"Removed all Ralph state from .scratch/. Task files preserved.",
						"info",
					);
				}
				updateUI(ctx);
			};

			if (!force) {
				if (ctx.hasUI) {
					void ctx.ui
						.confirm("Delete all Ralph state files?", warning)
						.then((confirmed) => {
							if (confirmed) run();
						});
				} else {
					ctx.ui.notify(
						`Run /ralph nuke --yes to confirm. ${warning}`,
						"warning",
					);
				}
				return;
			}

			if (ctx.hasUI) ctx.ui.notify(warning, "warning");
			run();
		},

		// --- New: Plan-aware commands ---

		plans(_rest, ctx) {
			const plans = discoverPlans(ctx);
			if (plans.length === 0) {
				ctx.ui.notify(
					"No plans found. Create a plan with: /ralph start <plan-name>",
					"info",
				);
				return;
			}

			const lines = plans.map((p) => {
				const activeCount = p.activeLoops.filter(
					(l) => l.status === "active",
				).length;
				const completedIssues = p.issues.filter(
					(i) => i.state?.status === "completed",
				).length;
				const statusIcon =
					activeCount > 0
						? "🔄"
						: completedIssues === p.issueCount && p.issueCount > 0
							? "✅"
							: "📋";
				return `${statusIcon} ${p.name}: ${p.prdTitle} [${p.prdStatus}] — ${completedIssues}/${p.issueCount} issues done`;
			});

			ctx.ui.notify(`Plans in .scratch/:\n${lines.join("\n")}`, "info");
		},

		plan(rest, ctx) {
			const planName = rest.trim();
			if (!planName) {
				ctx.ui.notify("Usage: /ralph plan <name>", "warning");
				return;
			}

			const sd = scratchDir(ctx);
			const planDir = path.join(sd, sanitize(planName));
			const prdPath = path.join(planDir, "PRD.md");

			if (!fs.existsSync(prdPath)) {
				ctx.ui.notify(`Plan "${planName}" not found in .scratch/`, "error");
				return;
			}

			const prdContent = tryRead(prdPath) || "";
			const title = extractTitle(prdContent);
			const status = extractStatus(prdContent);

			// Show first 600 chars of PRD as summary
			const summary = prdContent.slice(0, 600).trim();
			const truncated = prdContent.length > 600 ? "\n\n... (truncated)" : "";

			const issuesDir = path.join(planDir, "issues");
			const issues: string[] = [];
			if (fs.existsSync(issuesDir)) {
				for (const f of fs.readdirSync(issuesDir)) {
					if (!f.endsWith(".md") || f.endsWith(".state.json")) continue;
					const issueName = f.replace(/\.md$/, "");
					const stateFile = path.join(issuesDir, `${issueName}.state.json`);
					const raw = safeJsonParse(stateFile);
					const state = raw
						? migrateState(
								raw as Partial<LoopState> & {
									name: string;
								},
							)
						: null;
					const icon = state ? STATUS_ICONS[state.status] : "○";
					const iterInfo = state ? ` (iter ${state.iteration})` : "";
					issues.push(`  ${icon} ${issueName}${iterInfo}`);
				}
			}

			const lines = [
				`Plan: ${title}`,
				`Status: ${status}`,
				`Path: ${path.join(SCRATCH_DIR, planName, "PRD.md")}`,
				"",
				"Summary:",
				summary + truncated,
			];

			if (issues.length > 0) {
				lines.push("");
				lines.push(`Issues (${issues.length}):`);
				lines.push(...issues);
			}

			ctx.ui.notify(lines.join("\n"), "info");
		},

		issues(rest, ctx) {
			const planName = rest.trim();
			if (!planName) {
				ctx.ui.notify("Usage: /ralph issues <plan>", "warning");
				return;
			}

			const sd = scratchDir(ctx);
			const planDir = path.join(sd, sanitize(planName));
			const issuesDir = path.join(planDir, "issues");

			if (!fs.existsSync(issuesDir)) {
				ctx.ui.notify(`No issues found for plan "${planName}"`, "info");
				return;
			}

			const issueLines: string[] = [];
			for (const f of fs.readdirSync(issuesDir)) {
				if (!f.endsWith(".md") || f.endsWith(".state.json")) continue;
				const issueName = f.replace(/\.md$/, "");
				const stateFile = path.join(issuesDir, `${issueName}.state.json`);
				const raw = safeJsonParse(stateFile);
				const state = raw
					? migrateState(
							raw as Partial<LoopState> & {
								name: string;
							},
						)
					: null;

				const icon = state ? STATUS_ICONS[state.status] : "○";
				const iterInfo = state
					? ` iteration ${state.iteration}${state.maxIterations > 0 ? `/${state.maxIterations}` : ""}`
					: " (not started)";
				const statusText = state ? `${state.status}` : "new";
				issueLines.push(`  ${icon} ${issueName} — ${statusText}${iterInfo}`);
			}

			if (issueLines.length === 0) {
				ctx.ui.notify(`Plan "${planName}" has no issues yet.`, "info");
				return;
			}

			ctx.ui.notify(
				`Issues for ${planName}:\n${issueLines.join("\n")}\n\nStart a loop: /ralph start ${planName}/<issue>`,
				"info",
			);
		},

		issue(rest, ctx) {
			const [planName, issueName] = rest.trim().split(/\s+/);
			if (!planName || !issueName) {
				ctx.ui.notify(
					"Usage: /ralph issue <plan> <name>\nExample: /ralph issue my-plan 04-fix-bug",
					"warning",
				);
				return;
			}

			const sd = scratchDir(ctx);
			const planDir = path.join(sd, sanitize(planName));
			const prdPath = path.join(planDir, "PRD.md");

			if (!fs.existsSync(prdPath)) {
				ctx.ui.notify(
					`Plan "${planName}" not found. Create it first with: /ralph start ${planName}`,
					"error",
				);
				return;
			}

			const issuesDir = path.join(planDir, "issues");
			const issueFile = path.join(issuesDir, `${sanitize(issueName)}.md`);

			if (fs.existsSync(issueFile)) {
				ctx.ui.notify(
					`Issue "${issueName}" already exists in ${planName}.`,
					"warning",
				);
				return;
			}

			ensureDir(issueFile);
			fs.writeFileSync(issueFile, ISSUE_TEMPLATE, "utf-8");
			ctx.ui.notify(
				`Created: ${path.join(SCRATCH_DIR, planName, "issues", `${issueName}.md`)}\nStart loop: /ralph start ${planName}/${issueName}`,
				"info",
			);
		},
	};

	const HELP = `Ralph Wiggum - Long-running development loops

Commands:
  /ralph start <plan> [options]            Start a plan-level loop (works through issues sequentially)
  /ralph start <plan>/<issue> [options]    Start an issue-level loop
  /ralph stop                              Pause current loop
  /ralph resume <name>                     Resume a paused loop
  /ralph status                            Show all loops
  /ralph plans                             List all plans in .scratch/
  /ralph plan <name>                       Show plan summary
  /ralph issues <plan>                     List issues for a plan
  /ralph issue <plan> <name>               Create a new issue from template
  /ralph cancel <name>                     Delete loop state
  /ralph archive <name>                    Archive a completed loop
  /ralph clean [--all]                     Clean completed loops
  /ralph list                              Show all loops
  /ralph nuke [--yes]                      Delete all state files
  /ralph-stop                              Stop active loop (idle only)

Options:
  --items-per-iteration N  Suggest N items per turn (prompt hint)
  --reflect-every N        Reflect every N iterations
  --max-iterations N       Stop after N iterations (default: 50)
  --tdd                    Enable Test-Driven Development workflow

To stop: press ESC to interrupt, then run /ralph-stop when idle

Examples:
  /ralph start my-plan
  /ralph start my-plan/01-workflow-di --items-per-iteration 3 --reflect-every 5
  /ralph plans
  /ralph issues my-plan`;

	pi.registerCommand("ralph", {
		description: "Ralph Wiggum - long-running development loops",
		handler: async (args, ctx) => {
			const [cmd] = args.trim().split(/\s+/);
			const handler = commands[cmd];
			if (handler) {
				handler(args.slice(cmd.length).trim(), ctx);
			} else {
				ctx.ui.notify(HELP, "info");
			}
		},
	});

	pi.registerCommand("ralph-stop", {
		description: "Stop active Ralph loop (idle only)",
		handler: async (_args, ctx) => {
			if (!ctx.isIdle()) {
				if (ctx.hasUI) {
					ctx.ui.notify(
						"Agent is busy. Press ESC to interrupt, then run /ralph-stop.",
						"warning",
					);
				}
				return;
			}

			let state = currentLoop ? loadState(ctx, currentLoop) : null;
			if (!state) {
				const active = listLoops(ctx).find((l) => l.status === "active");
				if (!active) {
					if (ctx.hasUI) ctx.ui.notify("No active Ralph loop", "warning");
					return;
				}
				state = active;
			}

			if (state.status !== "active") {
				if (ctx.hasUI)
					ctx.ui.notify(`Loop "${state.name}" is not active`, "warning");
				return;
			}

			stopLoop(
				ctx,
				state,
				`Stopped Ralph loop: ${state.name} (iteration ${state.iteration})`,
			);
		},
	});

	// --- Tool for agent self-invocation ---

	pi.registerTool({
		name: "ralph_start",
		label: "Start Ralph Loop",
		description:
			"Start a long-running development loop. Use for complex multi-iteration tasks.",
		promptSnippet:
			"Start a persistent multi-iteration development loop with pacing and reflection controls.",
		promptGuidelines: [
			"Use this tool when the user explicitly wants an iterative loop, autonomous repeated passes, or paced multi-step execution.",
			"After starting a loop, continue each finished iteration with ralph_done unless the completion marker has already been emitted.",
			"For plan-level loops (.scratch/<plan>), the loop works through issues sequentially.",
		],
		parameters: Type.Object({
			name: Type.String({
				description: "Loop name (e.g., 'my-plan' or 'my-plan/01-issue')",
			}),
			taskContent: Type.String({
				description: "Task in markdown with goals and checklist",
			}),
			itemsPerIteration: Type.Optional(
				Type.Number({
					description: "Suggest N items per turn (0 = no limit)",
				}),
			),
			reflectEvery: Type.Optional(
				Type.Number({
					description: "Reflect every N iterations",
				}),
			),
			tddMode: Type.Optional(
				Type.Boolean({
					description:
						"Enable Test-Driven Development workflow (red-green-refactor)",
				}),
			),
			maxIterations: Type.Optional(
				Type.Number({
					description: "Max iterations (default: 50)",
					default: 50,
				}),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const parsed = parsePlanPath(params.name);
			if (!parsed.planName) {
				return {
					content: [
						{
							type: "text",
							text: `Invalid plan name: ${params.name}`,
						},
					],
					details: {},
				};
			}

			const loopName =
				parsed.isIssue && parsed.issueName
					? `${parsed.planName}/${parsed.issueName}`
					: parsed.planName;

			const existing = loadState(ctx, loopName);
			if (existing) {
				return {
					content: [
						{
							type: "text",
							text: `Loop "${loopName}" already exists (${existing.status}). Cancel or archive it first.`,
						},
					],
					details: {},
				};
			}

			// For plan-level loops, target first incomplete issue
			const taskFile = parsed.isIssue
				? taskFilePath(ctx, parsed)
				: findNextIncompleteIssue(
						ctx,
						parsed.planName,
						parsed.scratchDirOverride,
					);

			if (!taskFile) {
				return {
					content: [
						{
							type: "text",
							text: `Plan "${loopName}" has no issues yet.`,
						},
					],
					details: {},
				};
			}

			const fullPath = path.isAbsolute(taskFile)
				? taskFile
				: path.resolve(ctx.cwd, taskFile);
			ensureDir(fullPath);
			fs.writeFileSync(fullPath, params.taskContent, "utf-8");

			const state: LoopState = {
				name: loopName,
				taskFile,
				iteration: 1,
				maxIterations: params.maxIterations ?? 50,
				itemsPerIteration: params.itemsPerIteration ?? 0,
				reflectEvery: params.reflectEvery ?? 0,
				reflectInstructions: DEFAULT_REFLECT_INSTRUCTIONS,
				active: true,
				status: "active",
				startedAt: new Date().toISOString(),
				lastReflectionAt: 0,
				tddMode: params.tddMode || undefined,
			};

			saveState(ctx, state);
			if (parsed.scratchDirOverride) {
				loopScratchDirs.set(loopName, parsed.scratchDirOverride);
				saveCrossProjectRefs(ctx);
			}
			currentLoop = loopName;
			updateUI(ctx);

			// For plan-level loops, load PRD.md as read-only context
			const isPlanLevel = !loopName.includes("/");
			const prdContent = isPlanLevel
				? (tryRead(
						path.join(
							resolveScratchDir(ctx, parsed),
							parsed.planName,
							"PRD.md",
						),
					) ?? undefined)
				: undefined;
			pi.sendUserMessage(
				buildPrompt(
					state,
					params.taskContent,
					false,
					prdContent,
					params.tddMode,
				),
				{
					deliverAs: "followUp",
				},
			);

			return {
				content: [
					{
						type: "text",
						text: `Started loop "${loopName}" → ${taskFile} (max ${state.maxIterations} iterations).`,
					},
				],
				details: {},
			};
		},
	});

	// Tool for agent to signal iteration complete and request next
	pi.registerTool({
		name: "ralph_done",
		label: "Ralph Iteration Done",
		description:
			"Signal that you've completed this iteration of the Ralph loop. Call this after making progress to get the next iteration prompt. Do NOT call this if you've output the completion marker.",
		promptSnippet:
			"Advance an active Ralph loop after completing the current iteration.",
		promptGuidelines: [
			"Call this after making real iteration progress so Ralph can queue the next prompt.",
			"Do not call this if there is no active loop, if pending messages are already queued, or if the completion marker has already been emitted.",
		],
		parameters: Type.Object({}),
		async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
			if (!currentLoop) {
				return {
					content: [
						{
							type: "text",
							text: "No active Ralph loop.",
						},
					],
					details: {},
				};
			}

			const state = loadState(ctx, currentLoop);
			if (!state || state.status !== "active") {
				return {
					content: [
						{
							type: "text",
							text: "Ralph loop is not active.",
						},
					],
					details: {},
				};
			}

			if (ctx.hasPendingMessages()) {
				return {
					content: [
						{
							type: "text",
							text: "Pending messages already queued. Skipping ralph_done.",
						},
					],
					details: {},
				};
			}

			state.iteration++;

			if (state.maxIterations > 0 && state.iteration > state.maxIterations) {
				completeLoop(
					ctx,
					state,
					`───────────────────────────────────────────────────────────────────────
⚠️ RALPH LOOP STOPPED: ${state.name} | Max iterations (${state.maxIterations}) reached
───────────────────────────────────────────────────────────────────────`,
				);
				return {
					content: [
						{
							type: "text",
							text: "Max iterations reached. Loop stopped.",
						},
					],
					details: {},
				};
			}

			const needsReflection =
				state.reflectEvery > 0 &&
				(state.iteration - 1) % state.reflectEvery === 0;
			if (needsReflection) state.lastReflectionAt = state.iteration;

			if (!tryAdvancePlanIssue(ctx, state)) {
				// All issues done — complete the plan loop
				completeLoop(
					ctx,
					state,
					`───────────────────────────────────────────────────────────────────────
✅ PLAN COMPLETE: ${state.name} | All issues finished
───────────────────────────────────────────────────────────────────────`,
				);
				return {
					content: [
						{
							type: "text",
							text: `Plan "${state.name}" complete — all issues finished.`,
						},
					],
					details: {},
				};
			}

			saveState(ctx, state);
			updateUI(ctx);

			const content = tryRead(path.resolve(ctx.cwd, state.taskFile));
			if (content === null) {
				pauseLoop(ctx, state);
				return {
					content: [
						{
							type: "text",
							text: `Error: Could not read task file: ${state.taskFile}`,
						},
					],
					details: {},
				};
			}

			const isPlanLevel = !state.name.includes("/");
			const prdContent = isPlanLevel
				? (tryRead(
						path.join(
							scratchDirFromFile(state.taskFile, scratchDir(ctx)),
							state.name,
							"PRD.md",
						),
					) ?? undefined)
				: undefined;
			pi.sendUserMessage(
				buildPrompt(state, content, needsReflection, prdContent),
				{
					deliverAs: "followUp",
				},
			);

			ralphDoneThisTurn = true;

			return {
				content: [
					{
						type: "text",
						text: `Iteration ${state.iteration - 1} complete. Next iteration queued.`,
					},
				],
				details: {},
			};
		},
	});

	// --- Event handlers ---

	pi.on("before_agent_start", async (event, ctx) => {
		if (!currentLoop) return;
		ralphDoneThisTurn = false;
		const state = loadState(ctx, currentLoop);
		if (!state || state.status !== "active") return;

		const iterStr = `${state.iteration}${state.maxIterations > 0 ? `/${state.maxIterations}` : ""}`;

		let instructions = `You are in a Ralph loop working on: ${state.taskFile}\n`;
		if (state.itemsPerIteration > 0) {
			instructions += `- Work on ~${state.itemsPerIteration} items this iteration\n`;
		}
		instructions += `- Update the task file as you progress\n`;
		instructions += `- When FULLY COMPLETE: ${COMPLETE_MARKER}\n`;
		instructions += `- Otherwise, call ralph_done tool to proceed to next iteration`;

		return {
			systemPrompt:
				event.systemPrompt +
				`\n[RALPH LOOP - ${state.name} - Iteration ${iterStr}]\n\n${instructions}`,
		};
	});

	pi.on("agent_end", async (event, ctx) => {
		if (!currentLoop) return;
		const state = loadState(ctx, currentLoop);
		if (!state || state.status !== "active") return;

		// Enforce max iterations before any other processing
		if (state.maxIterations > 0 && state.iteration > state.maxIterations) {
			completeLoop(
				ctx,
				state,
				`───────────────────────────────────────────────────────────────────────
⚠️ RALPH LOOP STOPPED: ${state.name} | Max iterations (${state.maxIterations}) reached
───────────────────────────────────────────────────────────────────────`,
			);
			return;
		}

		const lastAssistant = [...event.messages]
			.reverse()
			.find((m) => m.role === "assistant");
		const text =
			lastAssistant && Array.isArray(lastAssistant.content)
				? lastAssistant.content
						.filter(
							(
								c,
							): c is {
								type: "text";
								text: string;
							} => c.type === "text",
						)
						.map((c) => c.text)
						.join("\n")
				: "";

		// For plan-level loops: COMPLETE_MARKER means "current issue done",
		// not "entire plan done". Only complete when all issues are finished.
		const isPlanLevel = !state.name.includes("/");
		if (text.includes(COMPLETE_MARKER)) {
			if (isPlanLevel) {
				// ralph_done already handled advancement this turn — skip
				if (ralphDoneThisTurn) {
					ralphDoneThisTurn = false;
					return;
				}
				// Issue advanced to next, still in progress, or not done yet.
				// Keep the loop alive — only complete when ALL issues are done.
				if (tryAdvancePlanIssue(ctx, state)) {
					state.iteration++;
					if (
						state.maxIterations > 0 &&
						state.iteration > state.maxIterations
					) {
						completeLoop(
							ctx,
							state,
							`───────────────────────────────────────────────────────────────────────
⚠️ RALPH LOOP STOPPED: ${state.name} | Max iterations (${state.maxIterations}) reached
───────────────────────────────────────────────────────────────────────`,
						);
						return;
					}
					saveState(ctx, state);
					updateUI(ctx);

					const sd = scratchDirFromFile(state.taskFile, scratchDir(ctx));
					const taskContent = tryRead(path.resolve(ctx.cwd, state.taskFile));
					if (taskContent === null) {
						pauseLoop(
							ctx,
							state,
							`Could not read task file: ${state.taskFile}`,
						);
						return;
					}

					const prdContent =
						tryRead(path.join(sd, state.name, "PRD.md")) ?? undefined;
					pi.sendUserMessage(
						buildPrompt(state, taskContent, false, prdContent),
						{
							deliverAs: "followUp",
						},
					);
					return;
				}
				// Fall through to completeLoop only if no more issues exist
			}

			completeLoop(
				ctx,
				state,
				`───────────────────────────────────────────────────────────────────────
✅ RALPH LOOP COMPLETE: ${state.name} | ${state.iteration} iterations
───────────────────────────────────────────────────────────────────────`,
			);
			return;
		}
	});

	pi.on("session_start", async (_event, ctx) => {
		loadCrossProjectRefs(ctx);

		const active = listLoops(ctx).filter((l) => l.status === "active");

		if (!currentLoop && active.length > 0) {
			currentLoop = active[0].name;
		}

		// Also check cross-project scratch dirs for active loops
		if (!currentLoop) {
			for (const name of loopScratchDirs.keys()) {
				const state = loadState(ctx, name);
				if (state && state.status === "active") {
					currentLoop = name;
					break;
				}
			}
		}

		if (active.length > 0 && ctx.hasUI) {
			const lines = active.map(
				(l) =>
					`  • ${l.name} (iteration ${l.iteration}${l.maxIterations > 0 ? `/${l.maxIterations}` : ""})`,
			);
			ctx.ui.notify(
				`Active Ralph loops:\n${lines.join("\n")}\n\nUse /ralph resume <name> to continue`,
				"info",
			);
		}
		updateUI(ctx);
	});

	pi.on("session_before_compact", async (_event, ctx) => {
		if (!currentLoop) return;
		const state = loadState(ctx, currentLoop);
		if (!state || state.status !== "active") return;

		saveState(ctx, state);

		if (ctx.hasUI) {
			ctx.ui.notify(
				`Preserving Ralph loop state before compaction: ${currentLoop}`,
				"info",
			);
		}
	});

	pi.on("session_compact", async (_event, ctx) => {
		if (!currentLoop) return;
		const state = loadState(ctx, currentLoop);
		if (!state || state.status !== "active") return;

		if (ctx.hasPendingMessages()) return;

		// Plan-level loops: advance past completed issues after compaction
		const isPlanLevel = !state.name.includes("/");
		if (isPlanLevel && !tryAdvancePlanIssue(ctx, state)) {
			completeLoop(
				ctx,
				state,
				`───────────────────────────────────────────────────────────────────────
✅ PLAN COMPLETE: ${state.name} | All issues finished
───────────────────────────────────────────────────────────────────────`,
			);
			return;
		}

		// Persist taskFile change only for plan-level loops
		if (isPlanLevel) {
			saveState(ctx, state);
			updateUI(ctx);
		}

		const content = tryRead(path.resolve(ctx.cwd, state.taskFile));
		if (content === null) {
			pauseLoop(
				ctx,
				state,
				`Could not read task file after compaction: ${state.taskFile}`,
			);
			return;
		}

		const needsReflection =
			state.reflectEvery > 0 &&
			(state.iteration - 1) % state.reflectEvery === 0;

		const sd = scratchDirFromFile(state.taskFile, scratchDir(ctx));
		const prdContent = isPlanLevel
			? (tryRead(path.join(sd, state.name, "PRD.md")) ?? undefined)
			: undefined;
		pi.sendUserMessage(
			buildPrompt(state, content, needsReflection, prdContent),
			{
				deliverAs: "followUp",
				triggerTurn: true,
			},
		);

		if (ctx.hasUI) {
			ctx.ui.notify(
				`Ralph loop resumed after compaction: ${currentLoop} (iteration ${state.iteration})`,
				"info",
			);
		}
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		if (currentLoop) {
			const state = loadState(ctx, currentLoop);
			if (state) saveState(ctx, state);
		}
	});
}
