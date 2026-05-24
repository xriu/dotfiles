/**
 * LoopStore — state persistence for ralph-wiggum loops.
 * Owns: load/save state, cross-project refs, plan discovery, issue advancement.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { scratchDir, scratchDirFromFile, SCRATCH_DIR } from "./plan-paths";

// ─── Types ───────────────────────────────────────────────────────────

export type LoopStatus = "active" | "paused" | "completed";

export interface LoopState {
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

/** True for plan-level loops (no "/" in the name). */
export function isPlanLevelLoop(name: string): boolean {
	return !name.includes("/");
}

// ─── Internal helpers ────────────────────────────────────────────────

export function ensureDir(filePath: string): void {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function tryRead(filePath: string): string | null {
	try {
		return fs.readFileSync(filePath, "utf-8");
	} catch {
		return null;
	}
}

export function safeJsonParse(filePath: string): unknown | null {
	try {
		const raw = tryRead(filePath);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function migrateState(
	raw: Partial<LoopState> & { name: string },
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

export function extractTitle(prdContent: string): string {
	const yamlMatch = prdContent.match(/^title:\s*["']?([^"'\n]+)["']?\s*$/m);
	if (yamlMatch) return yamlMatch[1].trim();
	const match = prdContent.match(/^#\s+PRD:\s*(.+)$/m);
	return match ? match[1].trim() : "Untitled";
}

export function extractStatus(prdContent: string): string {
	const yamlMatch = prdContent.match(/^status:\s*["']?([^"'\n]+)["']?\s*$/m);
	if (yamlMatch) return yamlMatch[1].trim();
	const match = prdContent.match(/\*\*Status:\*\*\s*`([^`]+)`/);
	return match ? match[1] : "unknown";
}

function parseCheckboxes(content: string): { total: number; checked: number } {
	const unchecked = [...content.matchAll(/^\s*- \[ \]/gm)].length;
	const checked = [...content.matchAll(/^\s*- \[[xX]\]/gm)].length;
	return { total: unchecked + checked, checked };
}

/** Yield all loop states found in a scratch directory. */
function* scanDirForStates(sd: string): Generator<LoopState> {
	if (!fs.existsSync(sd)) return;
	for (const planEntry of fs.readdirSync(sd)) {
		const planDir = path.join(sd, planEntry);
		if (!fs.statSync(planDir).isDirectory()) continue;

		const planStateFile = path.join(planDir, ".ralph.state.json");
		const raw = safeJsonParse(planStateFile);
		if (raw) {
			yield migrateState(raw as Partial<LoopState> & { name: string });
		}

		const issuesDir = path.join(planDir, "issues");
		if (fs.existsSync(issuesDir)) {
			for (const issueFile of fs.readdirSync(issuesDir)) {
				if (!issueFile.endsWith(".state.json")) continue;
				const raw = safeJsonParse(path.join(issuesDir, issueFile));
				if (!raw) continue;
				yield migrateState(raw as Partial<LoopState> & { name: string });
			}
		}
	}
}

// ─── LoopStore class ─────────────────────────────────────────────────

export class LoopStore {
	private loopScratchDirs = new Map<string, string>();

	// ── Cross-project refs ─────────────────────────────────────────

	setCrossProjectRef(name: string, dir: string): void {
		this.loopScratchDirs.set(name, dir);
	}

	deleteCrossProjectRef(name: string): void {
		this.loopScratchDirs.delete(name);
	}

	getCrossProjectRef(name: string): string | undefined {
		return this.loopScratchDirs.get(name);
	}

	getCrossProjectNames(): string[] {
		return Array.from(this.loopScratchDirs.keys());
	}

	clearCrossProjectRefs(): void {
		this.loopScratchDirs.clear();
	}

	loadCrossProjectRefs(ctx: ExtensionContext): void {
		const filePath = path.join(scratchDir(ctx), ".ralph.cross-refs.json");
		const raw = safeJsonParse(filePath);
		if (raw && typeof raw === "object") {
			for (const [name, sd] of Object.entries(raw)) {
				if (typeof sd === "string") {
					this.loopScratchDirs.set(name, sd);
				}
			}
		}
	}

	saveCrossProjectRefs(ctx: ExtensionContext): void {
		const refs: Record<string, string> = {};
		for (const [name, sd] of this.loopScratchDirs) {
			refs[name] = sd;
		}
		const filePath = path.join(scratchDir(ctx), ".ralph.cross-refs.json");
		ensureDir(filePath);
		fs.writeFileSync(filePath, JSON.stringify(refs, null, 2), "utf-8");
	}

	// ── Core state ops ─────────────────────────────────────────────

	loadState(ctx: ExtensionContext, name: string): LoopState | null {
		// Check cross-project override first
		const override = this.loopScratchDirs.get(name);
		if (override) {
			const slashIdx = name.indexOf("/");
			const planPart = slashIdx >= 0 ? name.slice(0, slashIdx) : name;
			const planStateFile = path.join(override, planPart, ".ralph.state.json");
			const raw = safeJsonParse(planStateFile);
			if (raw) {
				const state = migrateState(
					raw as Partial<LoopState> & { name: string },
				);
				if (state.name === name) return state;
			}
			const issuesDir = path.join(override, planPart, "issues");
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

		for (const state of scanDirForStates(scratchDir(ctx))) {
			if (state.name === name) return state;
		}
		return null;
	}

	saveState(ctx: ExtensionContext, state: LoopState): void {
		state.active = state.status === "active";

		const isPlanLevel = isPlanLevelLoop(state.name);
		if (isPlanLevel) {
			const sd = this.loopScratchDirs.get(state.name) ?? scratchDir(ctx);
			const sp = path.join(sd, state.name, ".ralph.state.json");
			ensureDir(sp);
			fs.writeFileSync(sp, JSON.stringify(state, null, 2), "utf-8");
			return;
		}

		// Issue-level: state file sits next to the task file
		const sp = state.taskFile.replace(/\.md$/, ".state.json");
		ensureDir(sp);
		fs.writeFileSync(sp, JSON.stringify(state, null, 2), "utf-8");
	}

	listLoops(ctx: ExtensionContext): LoopState[] {
		return [...scanDirForStates(scratchDir(ctx))];
	}

	// ── Plan discovery ─────────────────────────────────────────────

	discoverPlans(ctx: ExtensionContext): PlanInfo[] {
		const sd = scratchDir(ctx);
		if (!fs.existsSync(sd)) return [];

		const allLoops = this.listLoops(ctx);
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

	// ── Issue advancement ──────────────────────────────────────────

	findNextIncompleteIssue(
		planName: string,
		scratchOverride: string,
		skipFile?: string,
	): string | null {
		const issuesDir = path.join(scratchOverride, planName, "issues");
		if (!fs.existsSync(issuesDir)) return null;

		const skipAbs = skipFile ? path.resolve(skipFile) : undefined;

		const files = fs
			.readdirSync(issuesDir)
			.filter((f) => f.endsWith(".md"))
			.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

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

		return null;
	}

	tryAdvancePlanIssue(ctx: ExtensionContext, state: LoopState): boolean {
		const isPlanLevel = isPlanLevelLoop(state.name);
		if (!isPlanLevel) return true;

		const currentContent = tryRead(path.resolve(ctx.cwd, state.taskFile));
		if (currentContent === null) return true;

		const { total, checked } = parseCheckboxes(currentContent);
		const issueDone = total === 0 ? state.iteration > 1 : checked >= total;
		if (!issueDone) return true;

		const sd = scratchDirFromFile(state.taskFile, scratchDir(ctx));
		const nextIssue = this.findNextIncompleteIssue(
			state.name,
			sd,
			state.taskFile,
		);
		if (nextIssue) {
			state.taskFile = nextIssue;
			return true;
		}
		return false;
	}
}
