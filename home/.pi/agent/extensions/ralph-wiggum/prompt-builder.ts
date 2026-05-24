/**
 * PromptBuilder — prompt assembly for ralph-wiggum loops.
 * Pure string construction: no file I/O, no mutable state.
 */

import type { LoopState } from "./loop-store";
import { isPlanLevelLoop } from "./loop-store";

export const COMPLETE_MARKER = "<promise>COMPLETE</promise>";

const TDD_INSTRUCTIONS = `## TDD Mode Active

Follow vertical slices: one test → one implementation → repeat.
- Tests verify behavior through public interfaces, not implementation details.
- Do not mock internal collaborators. Mock at system boundaries only.
- Do not write all tests first (horizontal slicing). Write one test, make it pass, repeat.
- Never refactor while RED — get to GREEN first.
- Run tests after each step.`;

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
