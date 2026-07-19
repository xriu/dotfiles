/**
 * LoopOrchestrator — owns loop lifecycle for ralph-wiggum.
 *
 * start(name, config, ctx) → { state, prompt } | null
 * resume(state, taskContent, ctx, prdContent?) → { prompt }
 * advance(state, taskContent, ctx, prdContent?) → { prompt, complete? }
 * stop(state, status, ctx) → void
 *
 * Absorbs the active-loop tracking and done-this-turn flag from LoopRuntime.
 */

import * as path from "node:path";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { LoopState, LoopStatus, LoopStore } from "./loop-store";
import { isPlanLevelLoop, tryRead } from "./loop-store";
import { buildPrompt } from "./prompt-builder";

// ─── Types ───────────────────────────────────────────────────────────

export interface LoopConfig {
	taskFile: string;
	taskContent: string;
	maxIterations?: number;
	itemsPerIteration?: number;
	reflectEvery?: number;
	reflectInstructions?: string;
	tddMode?: boolean;
	prdContent?: string;
}

export const DEFAULT_REFLECT_INSTRUCTIONS = `REFLECTION CHECKPOINT

Pause and reflect on your progress:
1. What has been accomplished so far?
2. What's working well?
3. What's not working or blocking progress?
4. Should the approach be adjusted?
5. What are the next priorities?

Update the task file with your reflection, then continue working.`;

// ─── LoopOrchestrator ────────────────────────────────────────────────

export class LoopOrchestrator {
	private _activeLoop: string | null = null;
	private _doneThisTurn = false;

	constructor(private store: LoopStore) {}

	// ── active loop tracking ───────────────────────────────────────

	get activeLoop(): string | null {
		return this._activeLoop;
	}

	set activeLoop(name: string | null) {
		this._activeLoop = name;
	}

	// ── done-this-turn flag ────────────────────────────────────────

	get doneThisTurn(): boolean {
		return this._doneThisTurn;
	}

	set doneThisTurn(value: boolean) {
		this._doneThisTurn = value;
	}

	// ── start ──────────────────────────────────────────────────────

	/**
	 * Create and start a new loop. Returns the created state and initial prompt,
	 * or null if a loop with the same name already exists.
	 */
	start(
		name: string,
		config: LoopConfig,
		ctx: ExtensionContext,
	): { state: LoopState; prompt: string } | null {
		const existing = this.store.loadState(ctx, name);
		if (existing) return null;

		const state: LoopState = {
			name,
			taskFile: config.taskFile,
			iteration: 1,
			maxIterations: config.maxIterations ?? 50,
			itemsPerIteration: config.itemsPerIteration ?? 0,
			reflectEvery: config.reflectEvery ?? 0,
			reflectInstructions:
				config.reflectInstructions ?? DEFAULT_REFLECT_INSTRUCTIONS,
			active: true,
			status: "active",
			startedAt: new Date().toISOString(),
			tddMode: config.tddMode,
		};

		this.store.saveState(ctx, state);
		this._activeLoop = name;
		this._doneThisTurn = false;

		const needsReflection =
			state.reflectEvery > 0 &&
			(state.iteration - 1) % state.reflectEvery === 0;

		const prompt = buildPrompt(
			state,
			config.taskContent,
			needsReflection,
			config.prdContent,
		);

		return { state, prompt };
	}

	// ── resume ─────────────────────────────────────────────────────

	/**
	 * Resume a paused loop — sets it active and returns the prompt for the
	 * current iteration WITHOUT incrementing the iteration counter.
	 */
	resume(
		state: LoopState,
		taskContent: string,
		ctx: ExtensionContext,
		prdContent?: string,
	): { prompt: string } {
		state.status = "active";
		state.active = true;
		this.store.saveState(ctx, state);
		this._activeLoop = state.name;
		this._doneThisTurn = false;

		const needsReflection =
			state.reflectEvery > 0 &&
			(state.iteration - 1) % state.reflectEvery === 0;

		const prompt = buildPrompt(state, taskContent, needsReflection, prdContent);

		return { prompt };
	}

	// ── advance ────────────────────────────────────────────────────

	/**
	 * Advance a loop to the next iteration. Caller provides the current task
	 * content (read from file). Optionally pass PRD content for plan-level loops.
	 *
	 * Returns a prompt string to send to the agent. When `complete` is true,
	 * the loop has ended (max iterations reached or all plan issues done) and
	 * the prompt will be empty.
	 */
	advance(
		state: LoopState,
		taskContent: string,
		ctx: ExtensionContext,
		prdContent?: string,
	): { prompt: string; complete?: boolean } {
		state.iteration++;

		// Max iterations check
		if (state.maxIterations > 0 && state.iteration > state.maxIterations) {
			this.stop(state, "completed", ctx);
			return { prompt: "", complete: true };
		}

		// Reflection check
		const needsReflection =
			state.reflectEvery > 0 &&
			(state.iteration - 1) % state.reflectEvery === 0;

		// Issue advancement for plan-level loops
		const previousTaskFile = state.taskFile;
		const isPlanLevel = isPlanLevelLoop(state.name);
		if (isPlanLevel) {
			const canContinue = this.store.tryAdvancePlanIssue(ctx, state);
			if (!canContinue) {
				this.stop(state, "completed", ctx);
				return { prompt: "", complete: true };
			}
		}

		if (state.taskFile !== previousTaskFile) {
			taskContent =
				tryRead(path.resolve(ctx.cwd, state.taskFile)) ?? taskContent;
		}

		this.store.saveState(ctx, state);
		this._doneThisTurn = true;

		const prompt = buildPrompt(state, taskContent, needsReflection, prdContent);

		return { prompt };
	}

	// ── stop ───────────────────────────────────────────────────────

	/**
	 * Stop a loop — transitions to the given status, persists, and clears
	 * the active loop reference.
	 */
	stop(state: LoopState, status: LoopStatus, ctx: ExtensionContext): void {
		state.status = status;
		state.active = false;
		if (status === "completed") {
			state.completedAt = new Date().toISOString();
		}
		this.store.saveState(ctx, state);
		this._activeLoop = null;
		this._doneThisTurn = false;
	}
}
