import type { GuardrailsConfig } from "./config.js";

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Test whether a command contains a dangerous pattern as a standalone word.
 * The negative lookbehind (?<!\.) prevents false positives on dot-prefixed
 * paths like ".git", while \b still catches bare commands and full binary paths.
 */
function commandContainsPattern(command: string, pattern: string): boolean {
	return new RegExp(`(?<!\\.)\\b${escapeRegex(pattern.toLowerCase())}\\b`).test(
		command,
	);
}

export interface GateMatchResult {
	gate: string;
	description: string;
	autoDeny: boolean;
}

export function matchCommand(
	command: string,
	config: GuardrailsConfig,
): GateMatchResult | null {
	const gate = config.permissionGate;
	const allPatterns = [
		...gate.patterns,
		...gate.customPatterns,
	];
	const trimmed = command.trim().toLowerCase();

	// Check autoDenyPatterns first — these must never be bypassed
	for (const dp of gate.autoDenyPatterns) {
		if (commandContainsPattern(trimmed, dp.pattern)) {
			return {
				gate: dp.pattern,
				description: dp.description,
				autoDeny: true,
			};
		}
	}

	// Check gate patterns — require confirmation
	for (const p of allPatterns) {
		if (commandContainsPattern(trimmed, p.pattern)) {
			// AllowedPatterns exempt the entire command only if it exactly matches
			// (prevents compound commands like "git status && rm -rf /" from bypassing)
			if (
				gate.allowedPatterns.some(
					(ap) => trimmed === ap.pattern.toLowerCase().trim(),
				)
			) {
				return null;
			}
			return {
				gate: p.pattern,
				description: p.description,
				autoDeny: false,
			};
		}
	}

	return null;
}
