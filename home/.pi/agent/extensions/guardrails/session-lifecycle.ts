import type { loadConfig, GuardrailsConfig } from "./config.js";
import type { GuardrailsState } from "./state.js";

export class SessionLifecycle {
	constructor(
		private readonly state: GuardrailsState,
		private readonly loadConfigFn: typeof loadConfig,
	) {}

	onSessionStart() {
		try {
			this.state.config = this.loadConfigFn();
			this.state.configError = null;
		} catch (err) {
			this.state.config = null;
			this.state.configError = err instanceof Error ? err.message : String(err);
			console.warn(
				`[guardrails] Failed to load config: ${this.state.configError}`,
			);
		}
		this.state.denialCount = 0;
		this.state.awarenessSent = false;
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

		return lines;
	}
}
