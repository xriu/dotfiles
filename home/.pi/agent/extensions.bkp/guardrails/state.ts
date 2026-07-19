import type { GuardrailsConfig, loadConfig } from "./config.js";

export class GuardrailsState {
	config: GuardrailsConfig | null = null;
	configError: string | null = null;
	denialCount = 0;
	awarenessSent = false;
	projectConfigPath: string | null = null;

	/** Reload config and update state. Returns error message if failed. */
	reloadConfig(
		loadConfigFn: typeof loadConfig,
		cwd: string = process.cwd(),
	): string | null {
		try {
			const result = loadConfigFn({ cwd });
			this.config = result.config;
			this.projectConfigPath = result.projectConfigPath;
			this.configError = null;
		} catch (err) {
			this.config = null;
			this.projectConfigPath = null;
			this.configError = err instanceof Error ? err.message : String(err);
		}
		this.denialCount = 0;
		this.awarenessSent = false;
		return this.configError;
	}
}
