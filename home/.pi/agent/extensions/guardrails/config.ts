import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface PolicyRule {
	id: string;
	description: string;
	patterns: Array<{
		pattern: string;
	}>;
	allowedPatterns?: Array<{
		pattern: string;
	}>;
	protection: "noAccess" | "readOnly";
	onlyIfExists?: boolean;
}

export interface PermissionGatePattern {
	pattern: string;
	description: string;
}

export interface GuardrailsConfig {
	enabled: boolean;
	features: {
		policies: boolean;
		permissionGate: boolean;
		pathAccess: boolean;
	};
	pathAccess: {
		mode: string;
		allowedPaths: Array<{
			pattern: string;
		}>;
	};
	policies: {
		rules: PolicyRule[];
	};
	permissionGate: {
		patterns: PermissionGatePattern[];
		customPatterns: PermissionGatePattern[];
		requireConfirmation: boolean;
		allowedPatterns: PermissionGatePattern[];
		autoDenyPatterns: PermissionGatePattern[];
	};
}

function defaultConfigPath(): string {
	return path.join(os.homedir(), ".pi", "agent", "guardrails.json");
}

export function loadConfig(opts?: {
	configPath?: string;
	readFileSync?: (path: string) => string;
}): GuardrailsConfig {
	const read =
		opts?.readFileSync ?? ((p: string) => fs.readFileSync(p, "utf-8"));
	const configPath = opts?.configPath ?? defaultConfigPath();

	const raw = read(configPath);
	const parsed = JSON.parse(raw);

	return applyDefaults(parsed as Partial<GuardrailsConfig>);
}

function applyDefaults(partial: Partial<GuardrailsConfig>): GuardrailsConfig {
	return {
		enabled: partial.enabled ?? true,
		features: {
			policies: partial.features?.policies ?? true,
			permissionGate: partial.features?.permissionGate ?? true,
			pathAccess: partial.features?.pathAccess ?? false,
		},
		pathAccess: {
			mode: partial.pathAccess?.mode ?? "ask",
			allowedPaths: partial.pathAccess?.allowedPaths ?? [],
		},
		policies: {
			rules: partial.policies?.rules ?? [],
		},
		permissionGate: {
			patterns: partial.permissionGate?.patterns ?? [],
			customPatterns: partial.permissionGate?.customPatterns ?? [],
			requireConfirmation: partial.permissionGate?.requireConfirmation ?? true,
			allowedPatterns: partial.permissionGate?.allowedPatterns ?? [],
			autoDenyPatterns: partial.permissionGate?.autoDenyPatterns ?? [],
		},
	};
}
