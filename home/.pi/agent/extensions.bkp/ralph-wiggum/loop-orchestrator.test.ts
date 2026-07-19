import * as fs from "node:fs";
import * as path from "node:path";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
	LoopOrchestrator,
	DEFAULT_REFLECT_INSTRUCTIONS,
} from "./loop-orchestrator";
import type { LoopState } from "./loop-store";
import { LoopStore } from "./loop-store";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

// ── Mock LoopStore ──────────────────────────────────────────────────

function mockStore(overrides: Partial<LoopStore> = {}): LoopStore {
	return {
		loadState: vi.fn().mockReturnValue(null),
		saveState: vi.fn(),
		tryAdvancePlanIssue: vi.fn().mockReturnValue(true),
		...overrides,
	} as unknown as LoopStore;
}

// ── Mock ExtensionContext ───────────────────────────────────────────

function mockCtx(overrides: Partial<ExtensionContext> = {}): ExtensionContext {
	return { cwd: "/fake/project", ...overrides } as ExtensionContext;
}

// ── Helpers ─────────────────────────────────────────────────────────

function makeState(overrides: Partial<LoopState> = {}): LoopState {
	return {
		name: "test-loop",
		taskFile: ".scratch/test-plan/issues/01-task.md",
		iteration: 1,
		maxIterations: 50,
		itemsPerIteration: 0,
		reflectEvery: 0,
		reflectInstructions: DEFAULT_REFLECT_INSTRUCTIONS,
		active: true,
		status: "active",
		startedAt: new Date().toISOString(),
		...overrides,
	};
}

// ── Tests ───────────────────────────────────────────────────────────

describe("LoopOrchestrator", () => {
	let store: ReturnType<typeof mockStore>;
	let orchestrator: LoopOrchestrator;
	let ctx: ExtensionContext;

	beforeEach(() => {
		store = mockStore();
		orchestrator = new LoopOrchestrator(store as unknown as LoopStore);
		ctx = mockCtx();
	});

	// ── start ───────────────────────────────────────────────────────

	describe("start", () => {
		it("creates a new loop state and returns it with a prompt", () => {
			const result = orchestrator.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "## Task\n\nDo the thing.",
				},
				ctx,
			);

			expect(result).not.toBeNull();
			expect(result!.state.name).toBe("my-plan");
			expect(result!.state.iteration).toBe(1);
			expect(result!.state.status).toBe("active");
			expect(result!.prompt).toContain("Do the thing.");
			expect(result!.prompt).toContain("RALPH LOOP: my-plan");
		});

		it("returns null if a loop with the same name already exists", () => {
			store.loadState = vi.fn().mockReturnValue(makeState({ name: "my-plan" }));

			const result = orchestrator.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "Do the thing.",
				},
				ctx,
			);

			expect(result).toBeNull();
		});

		it("persists state via the store", () => {
			orchestrator.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "Task content.",
				},
				ctx,
			);

			expect(store.saveState).toHaveBeenCalledOnce();
			const saved = (store.saveState as ReturnType<typeof vi.fn>).mock
				.calls[0][1];
			expect(saved.name).toBe("my-plan");
			expect(saved.status).toBe("active");
			expect(saved.iteration).toBe(1);
		});

		it("sets activeLoop to the started loop name", () => {
			orchestrator.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "Task.",
				},
				ctx,
			);

			expect(orchestrator.activeLoop).toBe("my-plan");
		});

		it("applies custom config values", () => {
			const result = orchestrator.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "Task.",
					maxIterations: 10,
					itemsPerIteration: 3,
					reflectEvery: 5,
					tddMode: true,
				},
				ctx,
			);

			expect(result!.state.maxIterations).toBe(10);
			expect(result!.state.itemsPerIteration).toBe(3);
			expect(result!.state.reflectEvery).toBe(5);
			expect(result!.state.tddMode).toBe(true);
		});

		it("uses default values when config omits optional fields", () => {
			const result = orchestrator.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "Task.",
				},
				ctx,
			);

			expect(result!.state.maxIterations).toBe(50);
			expect(result!.state.itemsPerIteration).toBe(0);
			expect(result!.state.reflectEvery).toBe(0);
		});

		it("includes PRD content in prompt for plan-level loops", () => {
			const result = orchestrator.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "Task.",
					prdContent: "## PRD\n\nBuild the thing.",
				},
				ctx,
			);

			expect(result!.prompt).toContain("Build the thing.");
			expect(result!.prompt).toContain("PLAN-LEVEL");
		});

		it("does not mark as plan-level for issue-level loops", () => {
			const result = orchestrator.start(
				"my-plan/01-foo",
				{
					taskFile: ".scratch/my-plan/issues/01-foo.md",
					taskContent: "Task.",
				},
				ctx,
			);

			expect(result!.prompt).not.toContain("PLAN-LEVEL");
		});
	});

	// ── resume ─────────────────────────────────────────────────────

	describe("resume", () => {
		it("sets state to active and persists", () => {
			const state = makeState({ status: "paused", active: false });
			const result = orchestrator.resume(state, "Task content", ctx);

			expect(state.status).toBe("active");
			expect(state.active).toBe(true);
			expect(store.saveState).toHaveBeenCalled();
			expect(result.prompt).toContain("RALPH LOOP");
		});

		it("does NOT increment iteration", () => {
			const state = makeState({ status: "paused", iteration: 5 });
			orchestrator.resume(state, "Task", ctx);

			expect(state.iteration).toBe(5);
		});

		it("sets activeLoop to the resumed loop name", () => {
			const state = makeState({ status: "paused", name: "my-loop" });
			orchestrator.resume(state, "Task", ctx);

			expect(orchestrator.activeLoop).toBe("my-loop");
		});

		it("returns a prompt for the current iteration", () => {
			const state = makeState({ status: "paused", iteration: 3 });
			const result = orchestrator.resume(state, "Do the work.", ctx);

			expect(result.prompt).toContain("Iteration 3");
		});

		it("includes PRD content for plan-level loops", () => {
			const state = makeState({ status: "paused", name: "my-plan" });
			const result = orchestrator.resume(
				state,
				"Task",
				ctx,
				"# PRD\n\nContext.",
			);

			expect(result.prompt).toContain("Context.");
		});

		it("includes reflection when (iteration-1) % reflectEvery === 0", () => {
			const state = makeState({
				status: "paused",
				iteration: 6,
				reflectEvery: 5,
				reflectInstructions: "REFLECT NOW",
			});
			const result = orchestrator.resume(state, "Task", ctx);

			expect(result.prompt).toContain("REFLECT NOW");
			expect(result.prompt).toContain("REFLECTION");
		});

		it("does not include reflection at non-reflection iterations", () => {
			const state = makeState({
				status: "paused",
				iteration: 5,
				reflectEvery: 5,
				reflectInstructions: "REFLECT NOW",
			});
			const result = orchestrator.resume(state, "Task", ctx);

			expect(result.prompt).not.toContain("REFLECTION");
		});
	});

	// ── advance ──────────────────────────────────────────────────────

	describe("advance", () => {
		it("increments iteration count", () => {
			const state = makeState({ iteration: 3 });
			orchestrator.advance(state, "Task content", ctx);
			expect(state.iteration).toBe(4);
		});

		it("persists state after advancing", () => {
			const state = makeState();
			orchestrator.advance(state, "Task content", ctx);
			expect(store.saveState).toHaveBeenCalled();
		});

		it("returns a prompt for the next iteration", () => {
			const state = makeState({ taskFile: ".scratch/test/issues/01.md" });
			const result = orchestrator.advance(state, "Do the work.", ctx);

			expect(result.prompt).toContain("RALPH LOOP: test-loop");
			expect(result.prompt).toContain("Iteration 2");
		});

		it("sets doneThisTurn to true", () => {
			const state = makeState();
			orchestrator.advance(state, "Task", ctx);
			expect(orchestrator.doneThisTurn).toBe(true);
		});

		it("returns complete: true when max iterations exceeded", () => {
			const state = makeState({ iteration: 10, maxIterations: 10 });
			const result = orchestrator.advance(state, "Task", ctx);

			expect(result.complete).toBe(true);
			expect(result.prompt).toBe("");
			expect(state.status).toBe("completed");
			expect(orchestrator.activeLoop).toBeNull();
		});

		it("returns complete: true when all plan issues are done", () => {
			store.tryAdvancePlanIssue = vi.fn().mockReturnValue(false);
			const state = makeState({ name: "my-plan" });

			const result = orchestrator.advance(state, "Task", ctx);

			expect(result.complete).toBe(true);
		});

		it("includes reflection instructions when (iteration-1) % reflectEvery === 0", () => {
			const state = makeState({
				iteration: 5,
				reflectEvery: 5,
				reflectInstructions: "REFLECT NOW",
			});

			const result = orchestrator.advance(state, "Task", ctx);

			expect(result.prompt).toContain("REFLECT NOW");
			expect(result.prompt).toContain("REFLECTION");
		});

		it("does not include reflection at non-reflection iterations", () => {
			const state = makeState({
				iteration: 4,
				reflectEvery: 5,
				reflectInstructions: "REFLECT NOW",
			});

			const result = orchestrator.advance(state, "Task", ctx);

			expect(result.prompt).not.toContain("REFLECTION");
		});

		it("tries to advance plan issue for plan-level loops", () => {
			const state = makeState({ name: "my-plan" });
			orchestrator.advance(state, "Task", ctx);

			expect(store.tryAdvancePlanIssue).toHaveBeenCalled();
		});

		it("skips issue advancement for issue-level loops", () => {
			const state = makeState({ name: "my-plan/01-issue" });
			orchestrator.advance(state, "Task", ctx);

			expect(store.tryAdvancePlanIssue).not.toHaveBeenCalled();
		});

		it("includes PRD content in prompt for plan-level loops", () => {
			const state = makeState({ name: "my-plan" });
			const result = orchestrator.advance(
				state,
				"Task content",
				ctx,
				"## PRD\n\nContext.",
			);

			expect(result.prompt).toContain("Context.");
			expect(result.prompt).toContain("PLAN-LEVEL");
		});
	});

	// ── stop ─────────────────────────────────────────────────────────

	describe("stop", () => {
		it("transitions state to paused and persists", () => {
			const state = makeState({ status: "active" });
			orchestrator.stop(state, "paused", ctx);

			expect(state.status).toBe("paused");
			expect(state.active).toBe(false);
			expect(store.saveState).toHaveBeenCalled();
		});

		it("transitions state to completed, sets completedAt, and persists", () => {
			const state = makeState({ status: "active" });
			orchestrator.stop(state, "completed", ctx);

			expect(state.status).toBe("completed");
			expect(state.completedAt).toBeDefined();
			expect(store.saveState).toHaveBeenCalled();
		});

		it("clears activeLoop", () => {
			orchestrator.activeLoop = "some-loop";
			const state = makeState();

			orchestrator.stop(state, "paused", ctx);

			expect(orchestrator.activeLoop).toBeNull();
		});
	});

	// ── activeLoop / doneThisTurn ────────────────────────────────────

	describe("activeLoop and doneThisTurn", () => {
		it("activeLoop defaults to null", () => {
			expect(orchestrator.activeLoop).toBeNull();
		});

		it("doneThisTurn defaults to false", () => {
			expect(orchestrator.doneThisTurn).toBe(false);
		});
	});

	// ── Integration tests ────────────────────────────────────────────

	describe("integration with real LoopStore", () => {
		const tmpDir = path.join("/tmp", `ralph-test-${Date.now()}`);
		let realStore: LoopStore;
		let realOrch: LoopOrchestrator;
		let realCtx: ExtensionContext;

		beforeEach(() => {
			fs.mkdirSync(tmpDir, { recursive: true });
			fs.mkdirSync(path.join(tmpDir, ".scratch"), { recursive: true });
			realStore = new LoopStore();
			realOrch = new LoopOrchestrator(realStore);
			realCtx = { cwd: tmpDir } as ExtensionContext;
		});

		afterEach(() => {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		});

		it("start creates state file on disk", () => {
			const planDir = path.join(tmpDir, ".scratch", "my-plan");
			const issuesDir = path.join(planDir, "issues");
			fs.mkdirSync(issuesDir, { recursive: true });
			fs.writeFileSync(
				path.join(issuesDir, "01-task.md"),
				"## Task\n\n- [ ] Do something\n",
				"utf-8",
			);
			fs.writeFileSync(
				path.join(planDir, "PRD.md"),
				"# PRD: My Plan\n",
				"utf-8",
			);

			const result = realOrch.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/01-task.md",
					taskContent: "## Task\n\n- [ ] Do something\n",
					prdContent: "# PRD: My Plan\n",
				},
				realCtx,
			);

			expect(result).not.toBeNull();
			// Plan-level saves to .scratch/my-plan/.ralph.state.json
			expect(fs.existsSync(path.join(planDir, ".ralph.state.json"))).toBe(true);
		});

		it("lists loops from registered cross-project scratch directories", () => {
			const externalDir = path.join(tmpDir, "external", ".scratch");
			const planDir = path.join(externalDir, "external-plan");
			fs.mkdirSync(planDir, { recursive: true });
			fs.writeFileSync(
				path.join(planDir, ".ralph.state.json"),
				JSON.stringify({
					name: "external-plan",
					taskFile: path.join(planDir, "issues", "01-task.md"),
					iteration: 1,
					maxIterations: 50,
					itemsPerIteration: 0,
					reflectEvery: 0,
					reflectInstructions: DEFAULT_REFLECT_INSTRUCTIONS,
					active: true,
					status: "active",
					startedAt: new Date().toISOString(),
				}),
				"utf-8",
			);

			realStore.setCrossProjectRef("external-plan", externalDir);

			expect(realStore.listLoops(realCtx).map((loop) => loop.name)).toContain(
				"external-plan",
			);
		});

		it("start returns prompt containing task content", () => {
			const taskDir = path.join(tmpDir, ".scratch", "my-plan", "issues");
			fs.mkdirSync(taskDir, { recursive: true });
			const taskFile = path.join(taskDir, "02-task.md");
			fs.writeFileSync(taskFile, "## Task\n\nBuild the widget.", "utf-8");

			const result = realOrch.start(
				"my-plan/02-task",
				{
					taskFile: ".scratch/my-plan/issues/02-task.md",
					taskContent: "## Task\n\nBuild the widget.",
				},
				realCtx,
			);

			expect(result!.prompt).toContain("Build the widget.");
		});

		it("full lifecycle: start → advance → stop", () => {
			const planDir = path.join(tmpDir, ".scratch", "my-plan");
			const issuesDir = path.join(planDir, "issues");
			fs.mkdirSync(issuesDir, { recursive: true });
			fs.writeFileSync(
				path.join(issuesDir, "03-task.md"),
				"## Task\n\n- [ ] Step 1\n",
				"utf-8",
			);
			fs.writeFileSync(path.join(planDir, "PRD.md"), "# PRD\n", "utf-8");

			// start as plan-level loop
			const startResult = realOrch.start(
				"my-plan",
				{
					taskFile: ".scratch/my-plan/issues/03-task.md",
					taskContent: "## Task\n\n- [ ] Step 1\n",
					prdContent: "# PRD\n",
				},
				realCtx,
			);
			expect(startResult!.state.iteration).toBe(1);
			expect(startResult!.state.status).toBe("active");
			expect(realOrch.activeLoop).toBe("my-plan");

			// advance
			const adv1 = realOrch.advance(
				startResult!.state,
				"## Task\n\n- [x] Step 1\n",
				realCtx,
			);
			expect(adv1.prompt).toContain("Iteration 2");
			expect(startResult!.state.iteration).toBe(2);

			// stop
			realOrch.stop(startResult!.state, "completed", realCtx);
			expect(startResult!.state.status).toBe("completed");
			expect(realOrch.activeLoop).toBeNull();

			// Verify persisted state is completed
			const reloaded = realStore.loadState(realCtx, "my-plan");
			expect(reloaded!.status).toBe("completed");
		});
	});
});
