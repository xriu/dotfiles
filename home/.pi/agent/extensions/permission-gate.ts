/**
 * Permission Gate Extension
 *
 * Migrated from guardrails.json (pi-guardrails permissionGate).
 * Order: allowlist bypasses checks, then auto-deny blocks, then prompt patterns ask.
 * Matching: substring unless marked regex.
 */

import { isToolCallEventType, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Pattern = { pattern: string; regex?: boolean; description: string; enabled: boolean };

// Bypass all checks (no prompt).
const allowedPatterns: Pattern[] = [
	{
		pattern: "^(AWS_[A-Z_]+=\\S* +)*aws +[a-z0-9.-]+ +(list|get|describe)[a-z0-9.-]*( +[^;&|`$<>()\\n\\r]+)* *$",
		regex: true,
		description: "Read-only AWS ops (list/get/describe)",
		enabled: true,
	},
];

// Always blocked without prompting.
const autoDenyPatterns: Pattern[] = [
	{ pattern: "(^|&&|\\|\\||;) *(AWS_[A-Z_]+=\\S* +)*aws\\b", regex: true, description: "AWS outside read-only allowlist", enabled: true },
	{ pattern: "rm -rf", description: "Recursive force delete", enabled: true },
	{ pattern: "diskutil", description: "Disk utility operation", enabled: true },
	{ pattern: "git reset --hard", description: "Discards uncommitted changes", enabled: true },
	{ pattern: "mkfs", description: "Filesystem format", enabled: true },
	{ pattern: "npm publish", description: "Publishes npm package", enabled: true },
	{ pattern: "terraform apply", description: "Applies infra changes", enabled: true },
	{ pattern: "terraform destroy", description: "Destroys infra", enabled: true },
];

// Prompt for confirmation (not covered by the guardrails config).
const promptPatterns: Pattern[] = [
	{ pattern: "\\bsudo\\b", regex: true, description: "Privileged command (sudo)", enabled: true },
	{ pattern: "\\b(chmod|chown)\\b.*777", regex: true, description: "World-writable permission change", enabled: true },
];

const matches = (command: string, p: Pattern) =>
	p.enabled && (p.regex ? new RegExp(p.pattern).test(command) : command.includes(p.pattern));

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (!isToolCallEventType("bash", event)) return undefined;

		const command = event.input.command;

		if (allowedPatterns.some((p) => matches(command, p))) return undefined;

		const denied = autoDenyPatterns.find((p) => matches(command, p));
		if (denied) {
			return { block: true, reason: `Blocked: ${denied.description}` };
		}

		if (promptPatterns.some((p) => matches(command, p))) {
			if (!ctx.hasUI) {
				return { block: true, reason: "Dangerous command blocked (no UI for confirmation)" };
			}

			const choice = await ctx.ui.select(`⚠️ Dangerous command:\n\n  ${command}\n\nAllow?`, ["Yes", "No"]);
			if (choice !== "Yes") {
				return { block: true, reason: "Blocked by user" };
			}
		}

		return undefined;
	});
}
