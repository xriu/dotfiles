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
import {
	parsePlanPath,
	taskFilePath,
	scratchDir,
	resolveScratchDir,
	scratchDirFromFile,
	sanitize,
	SCRATCH_DIR,
} from "./plan-paths";
import {
	LoopStore,
	type LoopState,
	type LoopStatus,
	safeJsonParse,
	migrateState,
	extractTitle,
	extractStatus,
	tryRead,
	ensureDir,
	isPlanLevelLoop,
} from "./loop-store";
import { buildPrompt, COMPLETE_MARKER } from "./prompt-builder";
import { LoopRuntime } from "./loop-runtime";

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

const STATUS_ICONS: Record<LoopStatus, string> = {
	active: "▶",
	paused: "⏸",
	completed: "✓",
};

export default function (pi: ExtensionAPI) {
	const store = new LoopStore();
	const runtime = new LoopRuntime(store);
	// --- File helpers ---

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
	): void {
		if (isPlanLevelLoop(loopName)) {
			const sd = store.getCrossProjectRef(loopName) ?? scratchDir(ctx);
			tryDelete(path.join(sd, loopName, ".ralph.state.json"));
		} else {
			// Issue-level: state file sits next to the task file
			tryDelete(taskFile.replace(/\.md$/, ".state.json"));
		}
	}

	// --- Loop state transitions ---

	function pauseLoop(
		ctx: ExtensionContext,
		state: LoopState,
		message?: string,
	): void {
		runtime.pauseLoop(ctx, state);
		updateUI(ctx);
		if (message && ctx.hasUI) ctx.ui.notify(message, "info");
	}

	function completeLoop(
		ctx: ExtensionContext,
		state: LoopState,
		banner: string,
	): void {
		runtime.completeLoop(ctx, state);
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

	/**
	 * Check if max iterations exceeded; if so, completes the loop.
	 * Returns true if the loop was completed (caller should return).
	 */
	function enforceMaxIterations(
		ctx: ExtensionContext,
		state: LoopState,
	): boolean {
		if (state.maxIterations > 0 && state.iteration > state.maxIterations) {
			completeLoop(
				ctx,
				state,
				banner(
					`⚠️ RALPH LOOP STOPPED: ${state.name} | Max iterations (${state.maxIterations}) reached`,
				),
			);
			return true;
		}
		return false;
	}

	/**
	 * Load task content, build the prompt, and send it to the user.
	 * Returns true on success. On missing file, pauses the loop and returns false.
	 */
	function sendPrompt(
		ctx: ExtensionContext,
		state: LoopState,
		needsReflection: boolean,
		options?: { deliverAs?: "followUp"; triggerTurn?: boolean },
		errorMessage?: string,
	): boolean {
		const content = tryRead(path.resolve(ctx.cwd, state.taskFile));
		if (content === null) {
			pauseLoop(ctx, state, errorMessage);
			return false;
		}
		const prdContent = loadPrdContent(state, ctx);
		pi.sendUserMessage(
			buildPrompt(state, content, needsReflection, prdContent),
			options,
		);
		return true;
	}

	/** Wrap text in 71-char ruler lines. Handles \n within the text. */
	function banner(text: string): string {
		const line =
			"───────────────────────────────────────────────────────────────────────";
		return `${line}\n${text}\n${line}`;
	}

	/** Iteration display: "3/10" or "3". */
	function formatMaxIter(state: LoopState): string {
		return state.maxIterations > 0 ? `/${state.maxIterations}` : "";
	}

	/** Load PRD.md for plan-level loops; returns undefined for issue-level. */
	function loadPrdContent(
		state: LoopState,
		ctx: ExtensionContext,
	): string | undefined {
		if (!isPlanLevelLoop(state.name)) return undefined;
		return (
			tryRead(
				path.join(
					scratchDirFromFile(state.taskFile, scratchDir(ctx)),
					state.name,
					"PRD.md",
				),
			) ?? undefined
		);
	}

	// --- UI ---

	function formatLoop(l: LoopState): string {
		const status = `${STATUS_ICONS[l.status]} ${l.status}`;
		const iter = `${l.iteration}${formatMaxIter(l)}`;
		return `${l.name}: ${status} (iteration ${iter})`;
	}

	function updateUI(ctx: ExtensionContext): void {
		if (!ctx.hasUI) return;

		const state = runtime.activeLoop
			? store.loadState(ctx, runtime.activeLoop)
			: null;
		if (!state) {
			ctx.ui.setStatus("ralph", undefined);
			ctx.ui.setWidget("ralph", undefined);
			return;
		}

		const { theme } = ctx.ui;
		const maxStr = formatMaxIter(state);

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

	// --- Arg parsing ---

	function parseArgs(argsStr: string) {
		const tokens = argsStr.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
		const result: {
			name: string;
			maxIterations: number;
			itemsPerIteration: number;
			reflectEvery: number;
			reflectInstructions: string;
			tdd?: boolean;
		} = {
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
				: store.findNextIncompleteIssue(
						parsed.planName,
						parsed.scratchDirOverride ?? scratchDir(ctx),
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

			// Plan-level loops: advance past completed issues on resume
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
			if (runtime.activeLoop === loopName) runtime.activeLoop = null;

			const state = store.loadState(ctx, loopName);
			if (!state) {
				ctx.ui.notify(`Loop "${loopName}" not found`, "error");
				updateUI(ctx);
				return;
			}

			deleteStateFile(loopName, state.taskFile, ctx);

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
			deleteStateFile(loopName, state.taskFile, ctx);

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
				deleteStateFile(loop.name, loop.taskFile, ctx);
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

			let state = runtime.activeLoop
				? store.loadState(ctx, runtime.activeLoop)
				: null;
			if (!state) {
				const active = store.listLoops(ctx).find((l) => l.status === "active");
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

			const existing = store.loadState(ctx, loopName);
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
				: store.findNextIncompleteIssue(
						parsed.planName,
						parsed.scratchDirOverride ?? scratchDir(ctx),
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
				tddMode: params.tddMode,
			};

			store.saveState(ctx, state);
			if (parsed.scratchDirOverride) {
				store.setCrossProjectRef(loopName, parsed.scratchDirOverride);
				store.saveCrossProjectRefs(ctx);
			}
			runtime.activeLoop = loopName;
			updateUI(ctx);

			// For plan-level loops, load PRD.md as read-only context
			const isPlanLevel = isPlanLevelLoop(loopName);
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
			if (!runtime.activeLoop) {
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

			const state = store.loadState(ctx, runtime.activeLoop);
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

			if (enforceMaxIterations(ctx, state)) {
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

			if (!store.tryAdvancePlanIssue(ctx, state)) {
				// All issues done — complete the plan loop
				completeLoop(
					ctx,
					state,
					banner(`✅ PLAN COMPLETE: ${state.name} | All issues finished`),
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

			store.saveState(ctx, state);
			updateUI(ctx);

			if (!sendPrompt(ctx, state, needsReflection, { deliverAs: "followUp" })) {
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

			runtime.markDoneThisTurn();

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
		if (!runtime.activeLoop) return;
		runtime.clearDoneThisTurn();
		const state = store.loadState(ctx, runtime.activeLoop);
		if (!state || state.status !== "active") return;

		const iterStr = `${state.iteration}${formatMaxIter(state)}`;

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
		if (!runtime.activeLoop) return;
		const state = store.loadState(ctx, runtime.activeLoop);
		if (!state || state.status !== "active") return;

		if (enforceMaxIterations(ctx, state)) return;

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
		const isPlanLevel = isPlanLevelLoop(state.name);
		if (text.includes(COMPLETE_MARKER)) {
			if (isPlanLevel) {
				// ralph_done already handled advancement this turn — skip
				if (runtime.doneThisTurn) {
					runtime.clearDoneThisTurn();
					return;
				}
				// Issue advanced to next, still in progress, or not done yet.
				// Keep the loop alive — only complete when ALL issues are done.
				const originalTaskFile = state.taskFile;
				if (store.tryAdvancePlanIssue(ctx, state)) {
					if (state.taskFile !== originalTaskFile) {
						state.iteration++;
						if (enforceMaxIterations(ctx, state)) return;
					}
					store.saveState(ctx, state);
					updateUI(ctx);
					if (
						!sendPrompt(
							ctx,
							state,
							false,
							{ deliverAs: "followUp" },
							`Could not read task file: ${state.taskFile}`,
						)
					) {
						return;
					}
					return;
				}
				// Fall through to completeLoop only if no more issues exist
			}

			completeLoop(
				ctx,
				state,
				banner(
					`✅ RALPH LOOP COMPLETE: ${state.name} | ${state.iteration} iterations`,
				),
			);
			return;
		}
	});

	pi.on("session_start", async (_event, ctx) => {
		store.loadCrossProjectRefs(ctx);

		const active = store.listLoops(ctx).filter((l) => l.status === "active");

		if (!runtime.activeLoop && active.length > 0) {
			runtime.activeLoop = active[0].name;
		}

		// Also check cross-project scratch dirs for active loops
		if (!runtime.activeLoop) {
			for (const name of store.getCrossProjectNames()) {
				const state = store.loadState(ctx, name);
				if (state && state.status === "active") {
					runtime.activeLoop = name;
					break;
				}
			}
		}

		if (active.length > 0 && ctx.hasUI) {
			const lines = active.map(
				(l) => `  • ${l.name} (iteration ${l.iteration}${formatMaxIter(l)})`,
			);
			ctx.ui.notify(
				`Active Ralph loops:\n${lines.join("\n")}\n\nUse /ralph resume <name> to continue`,
				"info",
			);
		}
		updateUI(ctx);
	});

	pi.on("session_before_compact", async (_event, ctx) => {
		if (!runtime.activeLoop) return;
		const state = store.loadState(ctx, runtime.activeLoop);
		if (!state || state.status !== "active") return;

		store.saveState(ctx, state);

		if (ctx.hasUI) {
			ctx.ui.notify(
				`Preserving Ralph loop state before compaction: ${runtime.activeLoop}`,
				"info",
			);
		}
	});

	pi.on("session_compact", async (_event, ctx) => {
		if (!runtime.activeLoop) return;
		const state = store.loadState(ctx, runtime.activeLoop);
		if (!state || state.status !== "active") return;

		if (ctx.hasPendingMessages()) return;

		// Plan-level loops: advance past completed issues after compaction
		const isPlanLevel = isPlanLevelLoop(state.name);
		if (isPlanLevel && !store.tryAdvancePlanIssue(ctx, state)) {
			completeLoop(
				ctx,
				state,
				banner(`✅ PLAN COMPLETE: ${state.name} | All issues finished`),
			);
			return;
		}

		// Persist taskFile change only for plan-level loops
		if (isPlanLevel) {
			store.saveState(ctx, state);
			updateUI(ctx);
		}

		const needsReflection =
			state.reflectEvery > 0 &&
			(state.iteration - 1) % state.reflectEvery === 0;

		if (
			!sendPrompt(
				ctx,
				state,
				needsReflection,
				{ deliverAs: "followUp", triggerTurn: true },
				`Could not read task file after compaction: ${state.taskFile}`,
			)
		) {
			return;
		}

		if (ctx.hasUI) {
			ctx.ui.notify(
				`Ralph loop resumed after compaction: ${runtime.activeLoop} (iteration ${state.iteration})`,
				"info",
			);
		}
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		const loopName = runtime.activeLoop;
		if (loopName) {
			const state = store.loadState(ctx, loopName);
			if (state) store.saveState(ctx, state);
		}
	});
}
