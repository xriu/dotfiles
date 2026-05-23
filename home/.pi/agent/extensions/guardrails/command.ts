import type { GuardrailsState } from "./state.js";
import { loadConfig } from "./config.js";

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
			lines.push("Config: ~/.pi/agent/guardrails.json (loaded)");
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
	}

	private reload(ctx: {
		ui: { notify: (msg: string, level: string) => void };
	}) {
		try {
			this.state.config = loadConfig();
			this.state.configError = null;
			this.state.awarenessSent = false;
			this.state.denialCount = 0;
			ctx.ui.notify("Guardrails config reloaded", "info");
		} catch (err) {
			this.state.config = null;
			this.state.configError = err instanceof Error ? err.message : String(err);
			ctx.ui.notify(`Reload failed: ${this.state.configError}`, "error");
		}
	}
}
