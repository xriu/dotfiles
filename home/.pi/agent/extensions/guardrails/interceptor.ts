import type {
	ToolCallContext,
	ToolCallEvent,
} from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { GuardrailsConfig } from "./config.js";
import { extractPaths } from "./path-extractor.js";
import { matchCommand } from "./permission-gate-matcher.js";
import {
	expandPattern,
	type MatchResult,
	matchPath,
} from "./policy-matcher.js";
import type { GuardrailsState } from "./state.js";

// Mutating commands that write to the filesystem.
const WRITE_COMMANDS =
	/\b(rm|mv|cp|touch|mkdir|chmod|chown|tee|dd|rsync|tar|zip|unzip|gzip|7z)\b/;

export class Interceptor {
	constructor(private readonly state: GuardrailsState) {}

	async handle(event: ToolCallEvent, ctx: ToolCallContext) {
		const config = this.state.config;
		if (!config || this.state.configError) return;
		if (!config.enabled) return;

		if (isToolCallEventType("bash", event)) {
			return this.handleBash(event, ctx, config);
		}

		return this.handleFileTool(event, ctx, config);
	}

	private async handleBash(
		event: ToolCallEvent,
		ctx: ToolCallContext,
		config: GuardrailsConfig,
	) {
		const command = event.input.command;

		// PermissionGate checks
		if (config.features.permissionGate) {
			const gateMatch = matchCommand(command, config);
			if (gateMatch) {
				if (gateMatch.autoDeny) {
					this.state.denialCount++;
					return {
						block: true,
						reason: `Access denied by guardrails: ${gateMatch.description}`,
					};
				}

				if (config.permissionGate.requireConfirmation) {
					const allowed = await ctx.ui.confirm(
						"Dangerous command detected",
						`${gateMatch.description}\n\nCommand: ${command}\n\nAllow?`,
					);
					if (!allowed) {
						this.state.denialCount++;
						return { block: true, reason: "Permission denied by user" };
					}
				}
			}
		}

		// Policy checks on extracted paths
		if (config.features.policies) {
			const extracted = extractPaths(command);
			const isWriteCommand = this.detectWrite(command);
			for (const filePath of extracted) {
				const denial = this.checkPathPolicy(
					filePath,
					isWriteCommand,
					config,
					ctx.cwd,
				);
				if (denial) return denial;
			}
		}
	}

	private handleFileTool(
		event: ToolCallEvent,
		ctx: ToolCallContext,
		config: GuardrailsConfig,
	) {
		if (!config.features.policies) return;

		const filePath = this.extractFilePath(event);
		if (!filePath) return;

		return this.checkPathPolicy(
			filePath.path,
			!filePath.isReadOnly,
			config,
			ctx.cwd,
		);
	}

	private extractFilePath(
		event: ToolCallEvent,
	): { path: string; isReadOnly: boolean } | null {
		if (
			isToolCallEventType("read", event) ||
			isToolCallEventType("find", event) ||
			isToolCallEventType("grep", event)
		) {
			return { path: event.input.path, isReadOnly: true };
		}
		if (
			isToolCallEventType("write", event) ||
			isToolCallEventType("edit", event)
		) {
			return { path: event.input.path, isReadOnly: false };
		}
		return null;
	}

	private detectWrite(command: string): boolean {
		// Check for any redirect (simplified to avoid false negatives)
		if (/>/.test(command)) {
			return true;
		}

		// Check for write commands outside of quotes
		// This catches commands like "sudo rm file" that were missed by the previous logic
		const unquotedCommand = command.replace(/"[^"]*"|'[^']*'/g, "");
		return WRITE_COMMANDS.test(unquotedCommand);
	}

	/** Check a single path against policy rules. Returns denial or null. */
	private checkPathPolicy(
		filePath: string,
		isWrite: boolean,
		config: GuardrailsConfig,
		cwd: string,
	): { block: true; reason: string } | null {
		const absolutePath = expandPattern(filePath, cwd);
		const match = matchPath(absolutePath, config, cwd);
		if (!match) return null;

		// readOnly allows non-write operations
		if (match.protection === "readOnly" && !isWrite) return null;

		this.state.denialCount++;
		return this.buildDenialReason(match, filePath);
	}

	private buildDenialReason(match: MatchResult, filePath: string) {
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
}
