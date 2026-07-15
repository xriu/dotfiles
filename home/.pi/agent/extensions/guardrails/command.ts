import * as path from "node:path";
import { loadConfig } from "./config.js";
import type { GuardrailsState } from "./state.js";

export class GuardrailsCommand {
	constructor(private readonly state: GuardrailsState) {}

	handle(
		args: string | undefined,
		ctx: { ui: { notify: (msg: string, level: string) => void } },
	) {
		const trimmed = args?.trim() ?? "";

		if (!trimmed || trimmed === "status") {
			this.showStatus(ctx);
			return;
		}

		if (trimmed === "reload") {
			this.reload(ctx);
			return;
		}

		if (trimmed === "help") {
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
	}

	/** Format a feature status line. */
	private formatFeatureLine(
		name: string,
		enabled: boolean,
		details?: string,
	): string {
		const status = enabled ? "enabled" : "disabled";
		return details ? `${name}: ${status} (${details})` : `${name}: ${status}`;
	}

	private showStatus(ctx: {
		ui: { notify: (msg: string, level: string) => void };
	}) {
		const lines: string[] = [];
		lines.push("Guardrails Status");
		lines.push("═════════════════");

		const { config, configError, denialCount } = this.state;

		if (configError) {
			lines.push(`Config: ERROR — ${configError}`);
		} else if (!config) {
			lines.push("Config: Not loaded");
		} else {
			lines.push("Global: ~/.pi/agent/guardrails.json (loaded)");
			if (this.state.projectConfigPath) {
				const rel = path.relative(process.cwd(), this.state.projectConfigPath);
				lines.push(`Project: ${rel} (loaded)`);
			}
			lines.push(this.formatFeatureLine("Master", config.enabled));
			lines.push(
				this.formatFeatureLine(
					"Policies",
					config.features.policies,
					`${config.policies.rules.length} rules`,
				),
			);
			lines.push(
				this.formatFeatureLine(
					"PermissionGates",
					config.features.permissionGate,
					`${config.permissionGate.patterns.length + config.permissionGate.customPatterns.length} patterns`,
				),
			);
			lines.push(
				this.formatFeatureLine("PathAccess", config.features.pathAccess),
			);
			lines.push(`Denials this session: ${denialCount}`);
		}

		ctx.ui.notify(lines.join("\n"), "info");
	}

	private reload(ctx: {
		ui: { notify: (msg: string, level: string) => void };
	}) {
		const error = this.state.reloadConfig(loadConfig);
		if (error) {
			ctx.ui.notify(`Reload failed: ${error}`, "error");
		} else {
			ctx.ui.notify("Guardrails config reloaded", "info");
		}
	}
}
