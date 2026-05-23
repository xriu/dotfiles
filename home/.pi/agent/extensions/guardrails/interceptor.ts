import * as os from "node:os";
import * as path from "node:path";
import type {
	ToolCallEvent,
	ToolCallContext,
} from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { matchPath, type MatchResult } from "./policy-matcher.js";
import { extractPaths } from "./path-extractor.js";
import { matchCommand } from "./permission-gate-matcher.js";
import type { GuardrailsConfig } from "./config.js";
import type { GuardrailsState } from "./state.js";

// Mutating commands that write to the filesystem.
const WRITE_COMMANDS =
	"rm|mv|cp|touch|mkdir|chmod|chown|tee|dd|rsync|tar|zip|unzip|gzip|7z";
const WRITE_CMD_AT_START = new RegExp(`^\\s*(${WRITE_COMMANDS})\\b`);
const WRITE_CMD_AFTER_SEPARATOR = new RegExp(
	`(?:(?:^|\\s)(?:&&|\\|\\|)\\s*|[;&]\\s*)(${WRITE_COMMANDS})\\b`,
);
const FD_REDIRECT = />\s*\/dev\/null/;
const COMBINED_FD_REDIRECT = /&>\s*\/dev\/null/;
const FD_REDIRECT_TO_NUM = />\s*&\d/;

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
				const absolutePath = this.resolvePath(filePath, ctx.cwd);
				const match = matchPath(absolutePath, config, ctx.cwd);
				if (!match) continue;

				// readOnly allows read-like bash commands
				if (match.protection === "readOnly" && !isWriteCommand) continue;

				this.state.denialCount++;
				return this.buildDenialReason(match, filePath);
			}
		}
	}

	private handleFileTool(
		event: ToolCallEvent,
		ctx: ToolCallContext,
		config: GuardrailsConfig,
	) {
		if (!config.features.policies) return;

		let filePath: string | undefined;
		let isReadOnlyTool = false;

		if (isToolCallEventType("read", event)) {
			filePath = event.input.path;
			isReadOnlyTool = true;
		} else if (isToolCallEventType("write", event)) {
			filePath = event.input.path;
		} else if (isToolCallEventType("edit", event)) {
			filePath = event.input.path;
		} else if (isToolCallEventType("find", event)) {
			filePath = event.input.path;
			isReadOnlyTool = true;
		} else if (isToolCallEventType("grep", event)) {
			filePath = event.input.path;
			isReadOnlyTool = true;
		}

		if (!filePath) return;

		const absolutePath = this.resolvePath(filePath, ctx.cwd);
		const match = matchPath(absolutePath, config, ctx.cwd);
		if (!match) return;

		// readOnly allows read/find/grep but blocks write/edit
		if (match.protection === "readOnly" && isReadOnlyTool) return;

		this.state.denialCount++;
		return this.buildDenialReason(match, filePath);
	}

	private detectWrite(command: string): boolean {
		return (
			(/>/.test(command) &&
				!FD_REDIRECT.test(command) &&
				!COMBINED_FD_REDIRECT.test(command) &&
				!FD_REDIRECT_TO_NUM.test(command)) ||
			WRITE_CMD_AT_START.test(command) ||
			WRITE_CMD_AFTER_SEPARATOR.test(command)
		);
	}

	private resolvePath(filePath: string, cwd: string): string {
		let resolved = filePath;
		if (filePath.startsWith("~")) {
			const rest = filePath.slice(1);
			if (rest === "" || rest.startsWith("/")) {
				resolved = rest === "" ? os.homedir() : path.join(os.homedir(), rest);
			}
		}
		return path.isAbsolute(resolved) ? resolved : path.resolve(cwd, resolved);
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
