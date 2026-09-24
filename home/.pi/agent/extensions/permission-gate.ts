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

// Match a command against one enabled policy pattern.
const matches = (command: string, p: Pattern) =>
	p.enabled && (p.regex ? new RegExp(p.pattern).test(command) : command.includes(p.pattern));

// Shared gate result types. undefined means the command can continue.
type JsonRecord = Record<string, unknown>;
type PolicyResult = { block: true; reason: string } | undefined;
type JevDecision = boolean | undefined;

// Route complete AWS commands and known risky shell commands to Jev.
const awsCommandPattern = /(?:^|[;&|]\s*)(?:AWS_[A-Z_]+=\S*\s+)*aws\b/;
const openRouterEndpoint = "https://openrouter.ai/api/alpha/decisions";
const jevModel = "~typesafe/jev-latest";
const openRouterApiKeyName = "OPENROUTER_API_KEY_TEST";
const jevTimeoutMs = 1_500;
const jevPassThreshold = 0.9;

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null;

// Parse the OpenRouter Decisions response. Invalid responses fall back to local policy.
function parseJevDecision(payload: unknown): JevDecision {
	if (!isRecord(payload) || !isRecord(payload.answers)) return undefined;

	const answer = payload.answers.command_decision;
	if (!isRecord(answer) || answer.type !== "noul" || typeof answer.noul !== "number") return undefined;
	if (answer.noul < 0 || answer.noul > 1) return undefined;

	return answer.noul >= jevPassThreshold;
}

// Ask Jev through OpenRouter. Any service failure returns undefined.
async function askJev(command: string, signal: AbortSignal | undefined): Promise<JevDecision> {
	const apiKey = process.env[openRouterApiKeyName];
	if (!apiKey) return undefined;

	const timeoutSignal = AbortSignal.timeout(jevTimeoutMs);
	const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

	try {
		const response = await fetch(openRouterEndpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: jevModel,
				state: { command },
				questions: {
					command_decision: {
						type: "noul",
						instructions: {
							question: "Should `command` be allowed to run unattended?",
							policy: "Allow safe, non-privileged commands. For AWS, treat sts get-caller-identity and list-*, get-*, and describe-* operations as read-only. Deny destructive, mutating, credential-changing, shell-executing, ambiguous, or unsafe commands.",
						},
						criteria: {
							true: "A command with no harmful side effect. An AWS sts get-caller-identity, list-*, get-*, or describe-* operation is read-only and allowed.",
							false: "A command that changes or deletes resources, changes credentials or permissions, executes shell behavior, exposes secret values, or is ambiguous.",
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

// Apply the local rules that must always block without user confirmation.
function hardDeny(command: string): PolicyResult {
	const denied = autoDenyPatterns.find((p) => matches(command, p));
	return denied ? { block: true, reason: `Blocked: ${denied.description}` } : undefined;
}

// Ask the user when local policy requires confirmation.
async function askUser(command: string, ctx: ExtensionContext): Promise<PolicyResult> {
	if (!ctx.hasUI) {
		return { block: true, reason: "Dangerous command blocked (no UI for confirmation)" };
	}

	const choice = await ctx.ui.select(`⚠️ Dangerous command:\n\n  ${command}\n\nAllow?`, ["Yes", "No"]);
	return choice === "Yes" ? undefined : { block: true, reason: "Blocked by user" };
}

// Preserve the original allowlist, denylist, and prompt policy as the fallback.
async function applyCurrentPolicy(command: string, ctx: ExtensionContext): Promise<PolicyResult> {
	if (allowedPatterns.some((p) => matches(command, p))) return undefined;

	const denied = hardDeny(command);
	if (denied) return denied;

	return promptPatterns.some((p) => matches(command, p)) ? askUser(command, ctx) : undefined;
}

// Gate Bash calls: Jev first for selected commands, local policy otherwise.
export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (!isToolCallEventType("bash", event)) return undefined;

		const command = event.input.command;
		const isAwsCommand = awsCommandPattern.test(command);
		const needsJev = isAwsCommand || promptPatterns.some((p) => matches(command, p));

		if (needsJev) {
			// Jev can relax the AWS operation deny rule, but not unrelated hard-deny rules.
			if (isAwsCommand && !allowedPatterns.some((p) => matches(command, p))) {
				const hardDenied = autoDenyPatterns.find(
					(p) => p.description !== "AWS outside read-only allowlist" && matches(command, p),
				);
				if (hardDenied) return { block: true, reason: `Blocked: ${hardDenied.description}` };
			}

			// A valid Jev answer decides the command. Undefined falls back below.
			const jevDecision = await askJev(command, ctx.signal);
			if (jevDecision !== undefined) {
				return jevDecision ? undefined : { block: true, reason: "Blocked by Jev: command denied" };
			}
		}

		return applyCurrentPolicy(command, ctx);
	});
}
