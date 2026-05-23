import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "./config.js";
import { matchPath, type MatchResult } from "./policy-matcher.js";
import { extractPaths } from "./path-extractor.js";
import { matchCommand } from "./permission-gate-matcher.js";
import type { GuardrailsConfig } from "./config.js";

let config: GuardrailsConfig | null = null;
let configError: string | null = null;
let denialCount = 0;
let awarenessSent = false;

function buildDenialReason(match: MatchResult, filePath: string) {
	if (match.protection === "readOnly") {
		return {
			block: true,
			reason: `Access denied: ${filePath} is read-only (guardrails policy: ${match.ruleId})`,
		};
	}
	return {
		block: true,
		reason: `Access denied by guardrails policy: ${match.ruleId} — ${match.reason}`,
	};
}

function resolvePath(filePath: string, cwd: string): string {
	return path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
}

export default function (pi: ExtensionAPI) {
	// --- Config loading on session start ---

	pi.on("session_start", async () => {
		try {
			config = loadConfig();
			configError = null;
		} catch (err) {
			config = null;
			configError = err instanceof Error ? err.message : String(err);
			console.warn(`[guardrails] Failed to load config: ${configError}`);
		}
		denialCount = 0;
		awarenessSent = false;
	});

	// --- Awareness injection on first turn ---

	pi.on("before_agent_start", async () => {
		if (!config || configError) return;
		if (!config.enabled) return;
		if (awarenessSent) return;

		const lines: string[] = [];
		lines.push("Guardrails are active:");

		if (config.features.policies) {
			const noAccessRules = config.policies.rules.filter(
				(r) => r.protection === "noAccess",
			);
			const readOnlyRules = config.policies.rules.filter(
				(r) => r.protection === "readOnly",
			);

			if (noAccessRules.length > 0) {
				const patterns = noAccessRules.flatMap((r) =>
					r.patterns.map((p) => p.pattern),
				);
				lines.push(`- Secret files (${patterns.join(", ")}) are inaccessible`);
			}
			if (readOnlyRules.length > 0) {
				const patterns = readOnlyRules.flatMap((r) =>
					r.patterns.map((p) => p.pattern),
				);
				lines.push(`- Protected paths (${patterns.join(", ")}) are read-only`);
			}
		}

		const allGatePatterns = [
			...config.permissionGate.patterns,
			...config.permissionGate.customPatterns,
		];
		if (config.features.permissionGate && allGatePatterns.length > 0) {
			const gatePatterns = allGatePatterns.map((p) => p.pattern);
			lines.push(
				`- Dangerous commands (${gatePatterns.join(", ")}) require your confirmation`,
			);
		}

		awarenessSent = true;

		return {
			message: {
				customType: "guardrails-awareness",
				content: lines.join("\n"),
				display: true,
			},
		};
	});

	// --- Tool call interception ---

	pi.on("tool_call", async (event, ctx) => {
		if (!config || configError) return;
		if (!config.enabled) return;

		// --- Bash tool: PermissionGate + Policy checks on extracted paths ---
		if (isToolCallEventType("bash", event)) {
			const command = event.input.command;

			// PermissionGate checks
			if (config.features.permissionGate) {
				const gateMatch = matchCommand(command, config);
				if (gateMatch) {
					if (gateMatch.autoDeny) {
						denialCount++;
						return {
							block: true,
							reason: `Access denied by guardrails: ${gateMatch.description}`,
						};
					}

					if (config.permissionGate.requireConfirmation) {
						const allowed = await ctx.ui.confirm(
							`Dangerous command detected`,
							`${gateMatch.description}\n\nCommand: ${command}\n\nAllow?`,
						);
						if (!allowed) {
							denialCount++;
							return {
								block: true,
								reason: "Permission denied by user",
							};
						}
					}
				}
			}

			// Policy checks on extracted paths
			if (config.features.policies) {
				const extractedPaths = extractPaths(command);
				for (const filePath of extractedPaths) {
					const absolutePath = resolvePath(filePath, ctx.cwd);

					const match = matchPath(absolutePath, config, ctx.cwd);
					if (!match) continue;

					denialCount++;
					return buildDenialReason(match, filePath);
				}
			}

			return; // No blocks
		}

		// --- File tools: Policy checks ---
		if (!config.features.policies) return;

		let filePath: string | undefined;

		// Extract path from tool input
		if (isToolCallEventType("read", event)) {
			filePath = event.input.path;
		} else if (isToolCallEventType("write", event)) {
			filePath = event.input.path;
		} else if (isToolCallEventType("edit", event)) {
			filePath = event.input.path;
		} else if (isToolCallEventType("find", event)) {
			filePath = event.input.path;
		} else if (isToolCallEventType("grep", event)) {
			filePath = event.input.path;
		}

		if (!filePath) return;

		// Normalize to absolute path
		const absolutePath = resolvePath(filePath, ctx.cwd);

		// Check against policies
		const match = matchPath(absolutePath, config, ctx.cwd);
		if (!match) return;

		denialCount++;
		return buildDenialReason(match, filePath);
	});

	// --- /guardrails command ---

	pi.registerCommand("guardrails", {
		description: "Guardrails extension status and control",
		handler: async (args, ctx) => {
			if (!args || args.trim() === "" || args.trim() === "status") {
				const lines: string[] = [];
				lines.push("Guardrails Status");
				lines.push("═════════════════");

				if (configError) {
					lines.push(`Config: ERROR — ${configError}`);
				} else if (!config) {
					lines.push("Config: Not loaded");
				} else {
					lines.push(`Config: ~/.pi/agent/guardrails.json (loaded)`);
					lines.push(`Master: ${config.enabled ? "enabled" : "disabled"}`);
					lines.push(
						`Policies: ${config.features.policies ? "enabled" : "disabled"} (${config.policies.rules.length} rules)`,
					);
					lines.push(
						`PermissionGates: ${config.features.permissionGate ? "enabled" : "disabled"} (${config.permissionGate.patterns.length + config.permissionGate.customPatterns.length} patterns)`,
					);
					lines.push(
						`PathAccess: ${config.features.pathAccess ? "enabled" : "disabled"}`,
					);
					lines.push(`Denials this session: ${denialCount}`);
				}

				ctx.ui.notify(lines.join("\n"), "info");
				return;
			}

			if (args.trim() === "reload") {
				try {
					config = loadConfig();
					configError = null;
					awarenessSent = false;
					denialCount = 0;
					ctx.ui.notify("Guardrails config reloaded", "info");
				} catch (err) {
					config = null;
					configError = err instanceof Error ? err.message : String(err);
					ctx.ui.notify(`Reload failed: ${configError}`, "error");
				}
				return;
			}

			if (args.trim() === "help") {
				ctx.ui.notify(
					"Guardrails commands:\n" +
						"  /guardrails        Show status\n" +
						"  /guardrails reload Re-read config from disk\n" +
						"  /guardrails help   Show this help",
					"info",
				);
				return;
			}

			ctx.ui.notify(
				"Unknown command. Run /guardrails help for available commands.",
				"warning",
			);
		},
	});
}
