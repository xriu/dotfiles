import type { GuardrailsConfig } from "./config.js";

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
	const allPatterns = [...gate.patterns, ...gate.customPatterns];
	const trimmed = command.trim().toLowerCase();

	// Check autoDenyPatterns first — these must never be bypassed
	for (const dp of gate.autoDenyPatterns) {
		if (trimmed.includes(dp.pattern.toLowerCase())) {
			return { gate: dp.pattern, description: dp.description, autoDeny: true };
		}
	}

	// Check gate patterns — require confirmation
	for (const p of allPatterns) {
		if (trimmed.includes(p.pattern.toLowerCase())) {
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
