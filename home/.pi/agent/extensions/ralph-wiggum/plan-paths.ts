/**
 * PlanPaths — all path resolution for ralph-wiggum loops.
 * Pure functions: no file I/O, no mutable state.
 */

import * as path from "node:path";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export const SCRATCH_DIR = ".scratch";

export interface ParsedPlanPath {
	planName: string;
	issueName: string | null;
	isIssue: boolean;
	/** Absolute path to the .scratch dir when using cross-project paths. */
	scratchDirOverride?: string;
}

export function sanitize(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

export function scratchDir(ctx: ExtensionContext): string {
	return path.resolve(ctx.cwd, SCRATCH_DIR);
}

/** Resolve the .scratch dir — uses override for absolute/cross-project paths. */
export function resolveScratchDir(
	ctx: ExtensionContext,
	parsed: ParsedPlanPath,
): string {
	return parsed.scratchDirOverride ?? scratchDir(ctx);
}

/** Extract scratch dir from a task file path (works for saved state). */
export function scratchDirFromFile(taskFile: string, fallback: string): string {
	const match = taskFile.match(/^(.+?)[/\\]\.scratch[/\\]/);
	return match ? path.resolve(match[1], SCRATCH_DIR) : fallback;
}

/**
 * Parse a user-provided path into { planName, issueName?, isIssue }.
 * Supported formats:
 *   "my-plan"                    → plan-level
 *   "my-plan/01-foo"             → issue-level
 *   "my-plan/issues/01-foo"      → issue-level
 *   ".scratch/my-plan"           → plan-level
 *   ".scratch/my-plan/01-foo"    → issue-level
 *   ".scratch/my-plan/issues/01-foo" → issue-level
 *   "/abs/path/.scratch/my-plan" → plan-level (cross-project)
 *   "/abs/path/.scratch/my-plan/01-foo" → issue-level (cross-project)
 */
export function parsePlanPath(input: string): ParsedPlanPath {
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
		return { planName, issueName, isIssue: true, scratchDirOverride };
	}

	return { planName, issueName: null, isIssue: false, scratchDirOverride };
}

/**
 * Returns the task file path for an issue-level parsed plan path.
 * Issue-level: .scratch/<plan>/issues/<issue>.md
 * @throws if parsed is not an issue-level path
 */
export function taskFilePath(
	ctx: ExtensionContext,
	parsed: ParsedPlanPath,
): string {
	if (!parsed.isIssue || !parsed.issueName) {
		throw new Error("taskFilePath requires an issue-level path");
	}
	const sd = resolveScratchDir(ctx, parsed);
	return path.join(
		sd,
		parsed.planName,
		"issues",
		`${sanitize(parsed.issueName)}.md`,
	);
}
