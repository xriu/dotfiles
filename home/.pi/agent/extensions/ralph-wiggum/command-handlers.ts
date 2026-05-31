/**
 * CommandHandlers — all /ralph CLI command handlers.
 *
 * Extracted from index.ts to isolate command logic from event handlers,
 * tool registrations, and lifecycle management.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import type { LoopRuntime } from "./loop-runtime";
import type { LoopState } from "./loop-store";
import {
	parsePlanPath,
	taskFilePath,
	scratchDir,
	scratchDirFromFile,
	sanitize,
	SCRATCH_DIR,
} from "./plan-paths";
import {
	type LoopStore,
	type LoopStatus,
	safeJsonParse,
	migrateState,
	extractTitle,
	extractStatus,
	tryRead,
	ensureDir,
	isPlanLevelLoop,
} from "./loop-store";
import { buildPrompt } from "./prompt-builder";

const ISSUE_TEMPLATE = `## Parent

[PRD](../PRD.md)

## What to build

Describe the task here.

## Acceptance criteria

- [ ] Criterion 1

## Blocked by

None.
`;

const STATUS_ICONS: Record<LoopStatus, string> = {
	active: "▶",
	paused: "⏸",
	completed: "✓",
};

// ─── Helpers (command-only) ────────────────────────────────────────

function tryDelete(filePath: string): void {
	try {
		fs.unlinkSync(filePath);
	} catch {
		/* ignore */
	}
}

function deleteStateFile(
	loopName: string,
	taskFile: string,
	ctx: ExtensionContext,
	store: LoopStore,
): void {
	if (isPlanLevelLoop(loopName)) {
		const sd = store.getCrossProjectRef(loopName) ?? scratchDir(ctx);
		tryDelete(path.join(sd, loopName, ".ralph.state.json"));
	} else {
		tryDelete(taskFile.replace(/\.md$/, ".state.json"));
	}
}

export const DEFAULT_REFLECT_INSTRUCTIONS = `REFLECTION CHECKPOINT

Pause and reflect on your progress:
1. What has been accomplished so far?
2. What's working well?
3. What's not working or blocking progress?
4. Should the approach be adjusted?
5. What are the next priorities?

Update the task file with your reflection, then continue working.`;

// ─── Argument parsing ──────────────────────────────────────────────

interface ParsedArgs {
	name: string;
	maxIterations: number;
	itemsPerIteration: number;
	reflectEvery: number;
	reflectInstructions: string;
	tdd?: boolean;
}

function parseArgs(argsStr: string): ParsedArgs {
	const tokens = argsStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
	const result: ParsedArgs = {
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
		} else if (tok === "--tdd") {
			result.tdd = true;
		} else if (!tok.startsWith("--")) {
			result.name = tok;
		}
	}
	return result;
}

// ─── Formatting helpers (used by commands only) ────────────────────

function formatLoop(
	l: LoopState,
	formatMaxIter: (state: LoopState) => string,
): string {
	const status = `${STATUS_ICONS[l.status]} ${l.status}`;
	const iter = `${l.iteration}${formatMaxIter(l)}`;
	return `${l.name}: ${status} (iteration ${iter})`;
}

// ─── Command handlers ──────────────────────────────────────────────

export interface CommandDeps {
	banner: (text: string) => string;
	formatMaxIter: (state: LoopState) => string;
	updateUI: (ctx: ExtensionContext) => void;
	pauseLoop: (
		ctx: ExtensionContext,
		state: LoopState,
		message?: string,
	) => void;
	completeLoop: (
		ctx: ExtensionContext,
		state: LoopState,
		bannerText: string,
	) => void;
	enforceMaxIterations: (ctx: ExtensionContext, state: LoopState) => boolean;
	sendPrompt: (
		ctx: ExtensionContext,
		state: LoopState,
		needsReflection: boolean,
		options?: { deliverAs?: "followUp"; triggerTurn?: boolean },
		errorMessage?: string,
	) => boolean;
}

export function registerCommands(
	pi: ExtensionAPI,
	store: LoopStore,
	runtime: LoopRuntime,
	deps: CommandDeps,
): void {
	const {
		banner,
		formatMaxIter,
		updateUI,
		pauseLoop,
		completeLoop,
		enforceMaxIterations,
		sendPrompt,
	} = deps;
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
				: store.findNextIncompleteIssue(
						parsed.planName,
						parsed.scratchDirOverride ?? scratchDir(ctx),
					);

			const loopName =
				parsed.isIssue && parsed.issueName
					? `${parsed.planName}/${parsed.issueName}`
					: parsed.planName;

			if (!parsed.isIssue && !taskFile) {
				ctx.ui.notify(
					`Plan "${parsed.planName}" has no issues yet. Create one with: /ralph issue ${parsed.planName} <name>`,
					"warning",
				);
				return;
			}

			if (!taskFile) return;

			const existing = store.loadState(ctx, loopName);
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

			const content = tryRead(fullPath);
			if (content === null) {
				ctx.ui.notify(`Could not read task file: ${taskFile}`, "error");
				return;
			}

			const prdContent = parsed.isIssue
				? undefined
				: (tryRead(
						path.join(
							parsed.scratchDirOverride ?? scratchDir(ctx),
							parsed.planName,
							"PRD.md",
						),
					) ?? undefined);

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
				tddMode: args.tdd,
			};

			store.saveState(ctx, state);
			if (parsed.scratchDirOverride) {
				store.setCrossProjectRef(loopName, parsed.scratchDirOverride);
				store.saveCrossProjectRefs(ctx);
			}
			runtime.activeLoop = loopName;
			updateUI(ctx);

			pi.sendUserMessage(
				buildPrompt(state, content, false, prdContent, args.tdd),
			);
		},

		stop(_rest, ctx) {
			if (!runtime.activeLoop) {
				const active = store.listLoops(ctx).find((l) => l.status === "active");
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
			const state = store.loadState(ctx, runtime.activeLoop);
			if (state) {
				pauseLoop(
					ctx,
					state,
					`Paused Ralph loop: ${state.name} (iteration ${state.iteration})`,
				);
			} else {
				const missingName = runtime.activeLoop;
				runtime.activeLoop = null;
				updateUI(ctx);
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

			const state = store.loadState(ctx, loopName);
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

			if (runtime.activeLoop && runtime.activeLoop !== loopName) {
				const curr = store.loadState(ctx, runtime.activeLoop);
				if (curr) pauseLoop(ctx, curr);
			}

			state.status = "active";
			state.active = true;
			state.iteration++;

			if (enforceMaxIterations(ctx, state)) {
				ctx.ui.notify(
					`Loop "${loopName}" exceeded max ${state.maxIterations} iterations.`,
					"warning",
				);
				return;
			}

			if (!store.tryAdvancePlanIssue(ctx, state)) {
				completeLoop(
					ctx,
					state,
					banner(`✅ PLAN COMPLETE: ${state.name} | All issues finished`),
				);
				ctx.ui.notify(
					`Loop "${loopName}" has all issues complete. Cannot resume.`,
					"warning",
				);
				return;
			}

			store.saveState(ctx, state);
			const resumeSd = scratchDirFromFile(state.taskFile, scratchDir(ctx));
			if (resumeSd !== scratchDir(ctx)) {
				store.setCrossProjectRef(loopName, resumeSd);
				store.saveCrossProjectRefs(ctx);
			}
			runtime.activeLoop = loopName;
			updateUI(ctx);

			ctx.ui.notify(
				`Resumed: ${loopName} (iteration ${state.iteration})`,
				"info",
			);

			const needsReflection =
				state.reflectEvery > 0 &&
				(state.iteration - 1) % state.reflectEvery === 0;

			if (
				!sendPrompt(
					ctx,
					state,
					needsReflection,
					undefined,
					`Could not read task file: ${state.taskFile}`,
				)
			) {
				return;
			}
		},

		status(_rest, ctx) {
			const loops = store.listLoops(ctx);
			if (loops.length === 0) {
				ctx.ui.notify("No Ralph loops found.", "info");
				return;
			}
			ctx.ui.notify(
				`Ralph loops:\n${loops.map((l) => formatLoop(l, formatMaxIter)).join("\n")}`,
				"info",
			);
		},

		cancel(rest, ctx) {
			const loopName = rest.trim();
			if (!loopName) {
				ctx.ui.notify("Usage: /ralph cancel <name>", "warning");
				return;
			}
			if (runtime.activeLoop === loopName) runtime.activeLoop = null;

			const state = store.loadState(ctx, loopName);
			if (!state) {
				ctx.ui.notify(`Loop "${loopName}" not found`, "error");
				updateUI(ctx);
				return;
			}

			deleteStateFile(loopName, state.taskFile, ctx, store);
			store.deleteCrossProjectRef(loopName);
			store.saveCrossProjectRefs(ctx);

			ctx.ui.notify(`Cancelled: ${loopName}`, "info");
			updateUI(ctx);
		},

		archive(rest, ctx) {
			const loopName = rest.trim();
			if (!loopName) {
				ctx.ui.notify("Usage: /ralph archive <name>", "warning");
				return;
			}

			const state = store.loadState(ctx, loopName);
			if (!state) {
				if (runtime.activeLoop === loopName) runtime.activeLoop = null;
				ctx.ui.notify(`Loop "${loopName}" not found`, "error");
				updateUI(ctx);
				return;
			}
			if (state.status === "active") {
				ctx.ui.notify("Cannot archive active loop. Stop it first.", "warning");
				return;
			}

			if (runtime.activeLoop === loopName) runtime.activeLoop = null;
			deleteStateFile(loopName, state.taskFile, ctx, store);
			store.deleteCrossProjectRef(loopName);
			store.saveCrossProjectRefs(ctx);

			ctx.ui.notify(
				`Archived: ${loopName} (state removed, task file kept in .scratch/)`,
				"info",
			);
			updateUI(ctx);
		},

		clean(_rest, ctx) {
			const completed = store
				.listLoops(ctx)
				.filter((l) => l.status === "completed");

			if (completed.length === 0) {
				ctx.ui.notify("No completed loops to clean", "info");
				return;
			}

			for (const loop of completed) {
				deleteStateFile(loop.name, loop.taskFile, ctx, store);
				if (runtime.activeLoop === loop.name) runtime.activeLoop = null;
				store.deleteCrossProjectRef(loop.name);
			}
			store.saveCrossProjectRefs(ctx);

			ctx.ui.notify(
				`Cleaned ${completed.length} loop(s) (task files preserved):\n${completed.map((l) => `  • ${l.name}`).join("\n")}`,
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

				runtime.activeLoop = null;
				store.clearCrossProjectRefs();
				store.saveCrossProjectRefs(ctx);

				for (const entry of fs.readdirSync(sd)) {
					const planDir = path.join(sd, entry);
					if (!fs.statSync(planDir).isDirectory()) continue;

					tryDelete(path.join(planDir, ".ralph.state.json"));

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

		plans(_rest, ctx) {
			const plans = store.discoverPlans(ctx);
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
				`Path: ${path.join(SCRATCH_DIR, sanitize(planName), "PRD.md")}`,
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
					? ` iteration ${state.iteration}${formatMaxIter(state)}`
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
			const [planName, issueNameRaw] = rest.trim().split(/\s+/, 2);
			if (!planName || !issueNameRaw) {
				ctx.ui.notify(
					"Usage: /ralph issue <plan> <name>\nExample: /ralph issue my-plan 04-fix-bug",
					"warning",
				);
				return;
			}
			const issueName = sanitize(issueNameRaw);

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
			const issueFile = path.join(issuesDir, `${issueName}.md`);

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
				`Created: ${path.join(SCRATCH_DIR, sanitize(planName), "issues", `${issueName}.md`)}\nStart loop: /ralph start ${sanitize(planName)}/${issueName}`,
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
  /ralph clean                             Clean completed loops
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
}
