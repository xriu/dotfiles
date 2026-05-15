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
}

const STATUS_ICONS: Record<LoopStatus, string> = {
	active: "▶",
	paused: "⏸",
	completed: "✓",
};

export default function (pi: ExtensionAPI) {
	let currentLoop: string | null = null;

	// --- File helpers ---

	const scratchDir = (ctx: ExtensionContext) =>
		path.resolve(ctx.cwd, SCRATCH_DIR);
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
	 */
	interface ParsedPlanPath {
		planName: string;
		issueName: string | null;
		isIssue: boolean;
	}

	function parsePlanPath(input: string): ParsedPlanPath {
		let cleaned = input;
		if (cleaned.startsWith(".scratch/")) {
			cleaned = cleaned.slice(".scratch/".length);
		}

		const parts = cleaned.split(/[/\\]/).filter(Boolean);
		if (parts.length === 0) {
			return { planName: "", issueName: null, isIssue: false };
		}

		const planName = sanitize(parts[0]);

		if (parts.length >= 2) {
			let issuePart: string;
			if (parts[1] === "issues" && parts.length >= 3) {
				issuePart = parts[2];
			} else if (parts[1] !== "issues") {
				issuePart = parts[1];
			} else {
				return { planName, issueName: null, isIssue: false };
			}
			const issueName = issuePart.replace(/\.md$/, "");
			return { planName, issueName, isIssue: true };
		}

		return { planName, issueName: null, isIssue: false };
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
		if (parsed.isIssue && parsed.issueName) {
			const issuesDir = path.join(scratchDir(ctx), parsed.planName, "issues");
			return path.join(issuesDir, `${sanitize(parsed.issueName)}.state.json`);
		}
		return path.join(scratchDir(ctx), parsed.planName, ".ralph.state.json");
	}

	/**
	 * Returns the task file path for an issue-level parsed plan path.
	 * Issue-level: .scratch/<plan>/issues/<issue>.md
	 */
	function taskFilePath(ctx: ExtensionContext, parsed: ParsedPlanPath): string {
		const issueName = parsed.issueName!;
		return path.join(
			scratchDir(ctx),
			parsed.planName,
			"issues",
			`${sanitize(issueName)}.md`,
		);
	}

	function ensureDir(filePath: string): void {
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

	function migrateState(raw: Partial<LoopState> & { name: string }): LoopState {
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
					raw as Partial<LoopState> & { name: string },
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
						raw as Partial<LoopState> & { name: string },
					);
					if (state.name === name) return state;
				}
			}
		}

		return null;
	}

	function saveState(ctx: ExtensionContext, state: LoopState): void {
		state.active = state.status === "active";

		// Plan-level loops (name has no "/") always save to the plan directory
		const isPlanLevel = !state.name.includes("/");
		if (isPlanLevel) {
			const sp = path.join(scratchDir(ctx), state.name, ".ralph.state.json");
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
					migrateState(raw as Partial<LoopState> & { name: string }),
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
						migrateState(raw as Partial<LoopState> & { name: string }),
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
						? migrateState(raw as Partial<LoopState> & { name: string })
						: null;
					issues.push({ fileName: f, name: issueName, state });
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
		const match = prdContent.match(/^#\s+PRD:\s*(.+)$/m);
		return match ? match[1].trim() : "Untitled";
	}

	function extractStatus(prdContent: string): string {
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
			if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]")) {
				total++;
				if (trimmed.startsWith("- [x]")) checked++;
			}
		}
		return { total, checked };
	}

	/**
	 * Find the first incomplete issue in a plan's issues/ directory.
	 * Returns the relative path to the issue file, or null if all done.
	 */
	function findNextIncompleteIssue(
		ctx: ExtensionContext,
		planName: string,
	): string | null {
		const issuesDir = path.join(scratchDir(ctx), planName, "issues");
		if (!fs.existsSync(issuesDir)) return null;

		const files = fs
			.readdirSync(issuesDir)
			.filter((f) => f.endsWith(".md"))
			.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

		for (const f of files) {
			const content = tryRead(path.join(issuesDir, f));
			if (content === null) continue;
			const { total, checked } = parseCheckboxes(content);
			if (total === 0 || checked < total) {
				return path.join(SCRATCH_DIR, planName, "issues", f);
			}
		}

		return null; // all issues complete
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
		pi.sendUserMessage(banner);
	}

	function stopLoop(
		ctx: ExtensionContext,
		state: LoopState,
		message?: string,
	): void {
		state.status = "completed";
		state.completedAt = new Date().toISOString();
		state.active = false;
		saveState(ctx, state);
		currentLoop = null;
		updateUI(ctx);
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

	// --- Prompt building ---

	function buildPrompt(
		state: LoopState,
		taskContent: string,
		isReflection: boolean,
		prdContent?: string,
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
					"Usage: /ralph start <plan> [options]\n       /ralph start <plan>/<issue> [options]\n\nOptions: --items-per-iteration N --reflect-every N --max-iterations N",
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
				: findNextIncompleteIssue(ctx, parsed.planName);

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

			const fullPath = path.resolve(ctx.cwd, taskFile);
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
			};

			saveState(ctx, state);
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
				: (tryRead(path.join(scratchDir(ctx), parsed.planName, "PRD.md")) ??
					undefined);
			pi.sendUserMessage(buildPrompt(state, content, false, prdContent));
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

			if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
				completeLoop(
					ctx,
					state,
					`───────────────────────────────────────────────────────────────────────\n⚠️ RALPH LOOP STOPPED: ${state.name} | Max iterations (${state.maxIterations}) reached\n───────────────────────────────────────────────────────────────────────`,
				);
				ctx.ui.notify(
					`Loop "${loopName}" already reached max ${state.maxIterations} iterations.`,
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
			saveState(ctx, state);
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
				? (tryRead(path.join(scratchDir(ctx), state.name, "PRD.md")) ??
					undefined)
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
				tryDelete(path.join(scratchDir(ctx), loopName, ".ralph.state.json"));
			} else {
				const relTask = path.relative(ctx.cwd, state.taskFile);
				const parsed = parsePlanPath(relTask);
				tryDelete(statePathForPath(ctx, parsed));
			}

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
				tryDelete(path.join(scratchDir(ctx), loopName, ".ralph.state.json"));
			} else {
				const relTask = path.relative(ctx.cwd, state.taskFile);
				const parsed = parsePlanPath(relTask);
				tryDelete(statePathForPath(ctx, parsed));
			}

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
					tryDelete(path.join(scratchDir(ctx), loop.name, ".ralph.state.json"));
				} else {
					const relTask = path.relative(ctx.cwd, loop.taskFile);
					const parsed = parsePlanPath(relTask);
					tryDelete(statePathForPath(ctx, parsed));
				}
				if (currentLoop === loop.name) currentLoop = null;
			}

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
			const loops = listLoops(ctx);
			if (loops.length === 0) {
				ctx.ui.notify(
					"No loops found. Use /ralph plans to see available plans.",
					"info",
				);
				return;
			}
			ctx.ui.notify(
				`Ralph loops:\n${loops.map((l) => formatLoop(l)).join("\n")}`,
				"info",
			);
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
						? migrateState(raw as Partial<LoopState> & { name: string })
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
					? migrateState(raw as Partial<LoopState> & { name: string })
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
  /ralph status                            Show all active loops
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
				Type.Number({ description: "Suggest N items per turn (0 = no limit)" }),
			),
			reflectEvery: Type.Optional(
				Type.Number({ description: "Reflect every N iterations" }),
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
						{ type: "text", text: `Invalid plan name: ${params.name}` },
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
				: findNextIncompleteIssue(ctx, parsed.planName);

			if (!taskFile) {
				return {
					content: [
						{ type: "text", text: `Plan "${loopName}" has no issues yet.` },
					],
					details: {},
				};
			}

			const fullPath = path.resolve(ctx.cwd, taskFile);
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
			};

			saveState(ctx, state);
			currentLoop = loopName;
			updateUI(ctx);

			// For plan-level loops, load PRD.md as read-only context
			const isPlanLevel = !loopName.includes("/");
			const prdContent = isPlanLevel
				? (tryRead(path.join(scratchDir(ctx), parsed.planName, "PRD.md")) ??
					undefined)
				: undefined;
			pi.sendUserMessage(
				buildPrompt(state, params.taskContent, false, prdContent),
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
					content: [{ type: "text", text: "No active Ralph loop." }],
					details: {},
				};
			}

			const state = loadState(ctx, currentLoop);
			if (!state || state.status !== "active") {
				return {
					content: [{ type: "text", text: "Ralph loop is not active." }],
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
						{ type: "text", text: "Max iterations reached. Loop stopped." },
					],
					details: {},
				};
			}

			const needsReflection =
				state.reflectEvery > 0 &&
				(state.iteration - 1) % state.reflectEvery === 0;
			if (needsReflection) state.lastReflectionAt = state.iteration;

			// For plan-level loops: check if current issue is done, auto-advance
			const isPlanLevel = !state.name.includes("/");
			if (isPlanLevel) {
				const currentContent = tryRead(path.resolve(ctx.cwd, state.taskFile));
				if (currentContent !== null) {
					const { total, checked } = parseCheckboxes(currentContent);
					const issueDone =
						total === 0 ? state.iteration > 1 : checked >= total;
					if (issueDone) {
						// Current issue is complete — find next incomplete issue
						const nextIssue = findNextIncompleteIssue(ctx, state.name);
						if (nextIssue) {
							state.taskFile = nextIssue;
						} else {
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
					}
				}
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

			// For plan-level loops, load PRD.md as read-only context
			const prdContent = isPlanLevel
				? (tryRead(path.join(scratchDir(ctx), state.name, "PRD.md")) ??
					undefined)
				: undefined;
			pi.sendUserMessage(
				buildPrompt(state, content, needsReflection, prdContent),
				{
					deliverAs: "followUp",
				},
			);

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

		const lastAssistant = [...event.messages]
			.reverse()
			.find((m) => m.role === "assistant");
		const text =
			lastAssistant && Array.isArray(lastAssistant.content)
				? lastAssistant.content
						.filter(
							(c): c is { type: "text"; text: string } => c.type === "text",
						)
						.map((c) => c.text)
						.join("\n")
				: "";

		if (text.includes(COMPLETE_MARKER)) {
			completeLoop(
				ctx,
				state,
				`───────────────────────────────────────────────────────────────────────
✅ RALPH LOOP COMPLETE: ${state.name} | ${state.iteration} iterations
───────────────────────────────────────────────────────────────────────`,
			);
			return;
		}

		if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
			completeLoop(
				ctx,
				state,
				`───────────────────────────────────────────────────────────────────────
⚠️ RALPH LOOP STOPPED: ${state.name} | Max iterations (${state.maxIterations}) reached
───────────────────────────────────────────────────────────────────────`,
			);
			return;
		}
	});

	pi.on("session_start", async (_event, ctx) => {
		const active = listLoops(ctx).filter((l) => l.status === "active");

		if (!currentLoop && active.length > 0) {
			currentLoop = active[0].name;
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

		// For plan-level loops, load PRD.md as read-only context
		const isPlanLevel = !state.name.includes("/");
		const prdContent = isPlanLevel
			? (tryRead(path.join(scratchDir(ctx), state.name, "PRD.md")) ?? undefined)
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
