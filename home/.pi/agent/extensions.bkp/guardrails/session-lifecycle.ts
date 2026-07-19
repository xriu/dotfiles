import type { GuardrailsConfig, loadConfig } from "./config.js";
import type { GuardrailsState } from "./state.js";

export class SessionLifecycle {
	constructor(
		private readonly state: GuardrailsState,
		private readonly loadConfigFn: typeof loadConfig,
	) {}

	onSessionStart(cwd: string = process.cwd()) {
		const error = this.state.reloadConfig(this.loadConfigFn, cwd);
		if (error) {
			console.warn(`[guardrails] Failed to load config: ${error}`);
		}
	}

	onBeforeAgentStart() {
		if (!this.state.config || this.state.configError) return;
		if (!this.state.config.enabled) return;
		if (this.state.awarenessSent) return;

		const lines = this.buildAwarenessLines(this.state.config);
		this.state.awarenessSent = true;
		if (lines.length === 1) return; // only header, nothing to report

		return {
			message: {
				customType: "guardrails-awareness",
				content: lines.join("\n"),
				display: true,
			},
		};
	}

	private buildAwarenessLines(config: GuardrailsConfig): string[] {
		const lines: string[] = [];
		lines.push("Guardrails are active:");

		if (config.features.policies) {
			this.addPolicyLine(config, lines, "noAccess", "Secret files");
			this.addPolicyLine(config, lines, "readOnly", "Protected paths");
		}

		this.addPermissionGateLine(config, lines);
		this.addAgentGateLine(config, lines);

		return lines;
	}

	/** Add a policy line for rules with the given protection level. */
	private addPolicyLine(
		config: GuardrailsConfig,
		lines: string[],
		protection: "noAccess" | "readOnly",
		label: string,
	): void {
		const rules = config.policies.rules.filter(
			(r) => r.protection === protection,
		);
		if (rules.length === 0) return;
		const patterns = rules.flatMap((r) => r.patterns.map((p) => p.pattern));
		const status = protection === "noAccess" ? "inaccessible" : "read-only";
		lines.push(`- ${label} (${patterns.join(", ")}) are ${status}`);
	}

	/** Add permission gate line if enabled and has patterns. */
	private addPermissionGateLine(
		config: GuardrailsConfig,
		lines: string[],
	): void {
		if (!config.features.permissionGate) return;

		const allGatePatterns = [
			...config.permissionGate.patterns,
			...config.permissionGate.customPatterns,
		];

		if (allGatePatterns.length === 0) return;

		const gatePatterns = allGatePatterns.map((p) => p.pattern);
		lines.push(
			`- Dangerous commands (${gatePatterns.join(", ")}) require your confirmation`,
		);
	}

	/** Add agent gate line if enabled. */
	private addAgentGateLine(config: GuardrailsConfig, lines: string[]): void {
		if (!config.features.agentGate) return;
		lines.push(
			`- AI agent gate (${config.agentGate.model}) auto-decides permission prompts`,
		);
	}
}
