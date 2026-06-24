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
} from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import {
	parsePlanPath,
	taskFilePath,
	scratchDir,
	resolveScratchDir,
	scratchDirFromFile,
} from "./plan-paths";
import {
	LoopStore,
	type LoopState,
	type LoopStatus,
	tryRead,
	isPlanLevelLoop,
} from "./loop-store";
import { buildPrompt, COMPLETE_MARKER } from "./prompt-builder";
import { LoopRuntime } from "./loop-runtime";
import {
	registerCommands,
	DEFAULT_REFLECT_INSTRUCTIONS,
} from "./command-handlers";

const STATUS_ICONS: Record<LoopStatus, string> = {
	active: "▶",
	paused: "⏸",
	completed: "✓",
};

export default function (pi: ExtensionAPI) {
	const store = new LoopStore();
	const runtime = new LoopRuntime(store);

	// --- Cross-cutting helpers ---

	function banner(text: string): string {
		return text;
	}

	/** Iteration display: "3/10" or "3". */
	function formatMaxIter(state: LoopState): string {
		return state.maxIterations > 0 ? `/${state.maxIterations}` : "";
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
		bannerText: string,
	): void {
		runtime.completeLoop(ctx, state);
		updateUI(ctx);
		if (bannerText) pi.sendUserMessage(bannerText);
	}

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

	// --- Register commands ---

	registerCommands(pi, store, runtime, {
		banner,
		formatMaxIter,
		updateUI,
		pauseLoop,
		completeLoop,
		enforceMaxIterations,
		sendPrompt,
	});

	// --- Tool: /ralph-stop ---

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

			completeLoop(ctx, state, "");
			if (ctx.hasUI)
				ctx.ui.notify(
					`Stopped Ralph loop: ${state.name} (iteration ${state.iteration})`,
					"info",
				);
		},
	});

	// --- Tool: ralph_start ---

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
			taskContent: Type.Optional(
				Type.String({
					description:
						"Task in markdown with goals and checklist. Optional for existing plans — existing issue content is used if file already exists.",
				}),
			),
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

			// Use existing file content for plan-level loops with pre-written issues;
			// only write taskContent when the file doesn't exist yet.
			let taskContent: string;
			const existingContent = fs.existsSync(fullPath)
				? tryRead(fullPath)
				: null;
			if (existingContent) {
				taskContent = existingContent;
			} else if (params.taskContent) {
				if (!fs.existsSync(path.dirname(fullPath))) {
					fs.mkdirSync(path.dirname(fullPath), { recursive: true });
				}
				fs.writeFileSync(fullPath, params.taskContent, "utf-8");
				taskContent = params.taskContent;
			} else {
				return {
					content: [
						{
							type: "text",
							text: `Task file "${taskFile}" does not exist and no taskContent provided.`,
						},
					],
					details: {},
				};
			}

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
				buildPrompt(state, taskContent, false, prdContent, params.tddMode),
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

	// --- Tool: ralph_done ---

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

		const isPlanLevel = isPlanLevelLoop(state.name);
		if (text.includes(COMPLETE_MARKER)) {
			if (isPlanLevel) {
				if (runtime.doneThisTurn) {
					runtime.clearDoneThisTurn();
					return;
				}
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

	pi.on("session_before_compact", async (event, ctx) => {
		if (!runtime.activeLoop) return;
		const state = store.loadState(ctx, runtime.activeLoop);
		if (!state || state.status !== "active") return;

		store.saveState(ctx, state);

		if (ctx.hasUI) {
			ctx.ui.notify(
				`Preserving Ralph loop state before compaction: ${runtime.activeLoop} (reason: ${event.reason ?? "unknown"})`,
				"info",
			);
		}
	});

	pi.on("session_compact", async (event, ctx) => {
		if (!runtime.activeLoop) return;
		const state = store.loadState(ctx, runtime.activeLoop);
		if (!state || state.status !== "active") return;

		// Overflow compaction that will retry the aborted turn: let pi handle the
		// retry. Queueing another followUp here would race with the retry.
		if (event.willRetry === true) {
			if (ctx.hasUI) {
				ctx.ui.notify(
					`Ralph loop waiting for overflow retry: ${runtime.activeLoop} (iteration ${state.iteration}, reason: ${event.reason ?? "unknown"})`,
					"info",
				);
			}
			return;
		}

		if (ctx.hasPendingMessages()) return;

		const isPlanLevel = isPlanLevelLoop(state.name);
		if (isPlanLevel && !store.tryAdvancePlanIssue(ctx, state)) {
			completeLoop(
				ctx,
				state,
				banner(`✅ PLAN COMPLETE: ${state.name} | All issues finished`),
			);
			return;
		}

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
				`Ralph loop resumed after compaction: ${runtime.activeLoop} (iteration ${state.iteration}, reason: ${event.reason ?? "unknown"})`,
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
