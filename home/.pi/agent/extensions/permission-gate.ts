/**
 * Permission Gate Extension
 *
 * Migrated from guardrails.json (pi-guardrails permissionGate).
 * AWS and prompt-pattern commands ask Jev first; failures fall back to the local policy.
 * Local policy: allowlist bypasses checks, then auto-deny blocks, then prompts ask.
 * Matching: substring unless marked regex.
 */

import { isToolCallEventType, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";

type Pattern = { pattern: string; regex?: boolean; description: string; enabled: boolean };

// Bypass all checks (no prompt).
const allowedPatterns: Pattern[] = [
	{
		pattern: "^(AWS_[A-Z_]+=\\S* +)*aws +(--version|[a-z0-9.-]+ +(list|get|describe)[a-z0-9.-]*( +[^;&|`$<>()\\n\\r]+)*) *$",
		regex: true,
		description: "Read-only AWS ops (list/get/describe) and version",
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

type JsonRecord = Record<string, unknown>;
type PolicyResult = { block: true; reason: string } | undefined;
type JevDecision = boolean | undefined;

const awsCommandPattern = /(?:^|[;&|]\s*)(?:AWS_[A-Z_]+=\S*\s+)*aws\b/;
const jevEndpoint = "https://api.typesafe.ai/v1/systemone";
const jevTimeoutMs = 1_500;
const jevPassThreshold = 0.98;

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null;

function parseJevDecision(payload: unknown): JevDecision {
	if (!isRecord(payload) || !isRecord(payload.answers)) return undefined;

	const answer = payload.answers.command_decision;
	if (
		!isRecord(answer) ||
		answer.type !== "choice" ||
		(answer.choice !== "pass" && answer.choice !== "deny") ||
		!isRecord(answer.probabilities)
	) {
		return undefined;
	}

	const passProbability = answer.probabilities.pass;
	if (typeof passProbability !== "number" || passProbability < 0 || passProbability > 1) return undefined;

	return answer.choice === "pass" && passProbability >= jevPassThreshold;
}

async function askJev(command: string, signal: AbortSignal | undefined): Promise<JevDecision> {
	const apiKey = process.env.TYPESAFE_API_KEY;
	if (!apiKey) return undefined;

	const timeoutSignal = AbortSignal.timeout(jevTimeoutMs);
	const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

	try {
		const response = await fetch(jevEndpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "jev-1.13.0",
				state: { command },
				questions: {
					command_decision: {
						type: "choice",
						instructions: {
							question: "Should `command` be allowed to run unattended?",
							policy: "Deny destructive, mutating, privileged, credential-related, shell-executing, ambiguous, or unsafe commands.",
						},
						criteria: {
							pass: "A command that is safe to run unattended and does not need privilege or dangerous permission changes.",
							deny: "A command that can cause harm, change resources or permissions, expose secrets, execute arbitrary shell behavior, or is ambiguous.",
						},
					},
				},
			}),
			signal: requestSignal,
		});

		if (!response.ok) return undefined;
		return parseJevDecision(await response.json());
	} catch {
		return undefined;
	}
}

async function applyCurrentPolicy(command: string, ctx: ExtensionContext): Promise<PolicyResult> {
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
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (!isToolCallEventType("bash", event)) return undefined;

		const command = event.input.command;

		const isAwsCommand = awsCommandPattern.test(command);
		const needsJev = isAwsCommand || promptPatterns.some((p) => matches(command, p));

		if (needsJev) {
			if (isAwsCommand && !allowedPatterns.some((p) => matches(command, p))) {
				const hardDenied = autoDenyPatterns.find(
					(p) => p.description !== "AWS outside read-only allowlist" && matches(command, p),
				);
				if (hardDenied) return { block: true, reason: `Blocked: ${hardDenied.description}` };
			}

			const jevDecision = await askJev(command, ctx.signal);
			if (jevDecision !== undefined) {
				return jevDecision ? undefined : { block: true, reason: "Blocked by Jev: command denied" };
			}
		}

		return applyCurrentPolicy(command, ctx);
	});
}
