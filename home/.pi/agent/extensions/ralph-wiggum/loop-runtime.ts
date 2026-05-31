/**
 * LoopRuntime — active loop lifecycle for ralph-wiggum.
 * Owns: currentLoop tracking, ralphDoneThisTurn flag, pause/complete transitions.
 */

import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { LoopState, LoopStore } from "./loop-store";

export class LoopRuntime {
	private currentLoop: string | null = null;
	private ralphDoneThisTurn = false;

	constructor(private store: LoopStore) {}

	get activeLoop(): string | null {
		return this.currentLoop;
	}

	set activeLoop(name: string | null) {
		this.currentLoop = name;
	}

	get doneThisTurn(): boolean {
		return this.ralphDoneThisTurn;
	}

	markDoneThisTurn(): void {
		this.ralphDoneThisTurn = true;
	}

	clearDoneThisTurn(): void {
		this.ralphDoneThisTurn = false;
	}

	/** Pause a loop — mutates state, saves, clears active tracking. */
	pauseLoop(ctx: ExtensionContext, state: LoopState): void {
		state.status = "paused";
		this.store.saveState(ctx, state);
		this.currentLoop = null;
	}

	/** Complete a loop — mutates state, saves, clears active tracking. */
	completeLoop(ctx: ExtensionContext, state: LoopState): void {
		state.status = "completed";
		state.completedAt = new Date().toISOString();
		this.store.saveState(ctx, state);
		this.currentLoop = null;
	}
}
