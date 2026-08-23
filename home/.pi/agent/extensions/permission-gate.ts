/**
 * Permission Gate Extension
 *
 * Migrated from guardrails.json (pi-guardrails permissionGate).
 * Order: allowlist bypasses checks, then auto-deny blocks, then prompt patterns ask.
 * Matching: substring unless marked regex.
 */

import { isToolCallEventType, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

type Pattern = { pattern: string; regex?: boolean; description: string };

// Bypass all checks (no prompt).
const allowedPatterns: Pattern[] = [
	{
		pattern: "^(AWS_[A-Z_]+=\\S* +)*aws +[a-z0-9.-]+ +(list|get|describe)[a-z0-9.-]*( +[^;&|`$<>()\\n\\r]+)* *$",
		regex: true,
		description: "Read-only AWS ops (list/get/describe)",
	},
];

// Always blocked without prompting.
const autoDenyPatterns: Pattern[] = [
	{ pattern: "(^|&&|\\|\\||;) *(AWS_[A-Z_]+=\\S* +)*aws\\b", regex: true, description: "AWS outside read-only allowlist" },
	{ pattern: "rm -rf", description: "Recursive force delete" },
	{ pattern: "diskutil", description: "Disk utility operation" },
	{ pattern: "git reset --hard", description: "Discards uncommitted changes" },
	{ pattern: "mkfs", description: "Filesystem format" },
	{ pattern: "npm publish", description: "Publishes npm package" },
	{ pattern: "terraform apply", description: "Applies infra changes" },
	{ pattern: "terraform destroy", description: "Destroys infra" },
];

// Prompt for confirmation (not covered by the guardrails config).
const promptPatterns: Pattern[] = [
	{ pattern: "\\bsudo\\b", regex: true, description: "Privileged command (sudo)" },
	{ pattern: "\\b(chmod|chown)\\b.*777", regex: true, description: "World-writable permission change" },
];

const matches = (command: string, p: Pattern) =>
	p.regex ? new RegExp(p.pattern).test(command) : command.includes(p.pattern);

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
