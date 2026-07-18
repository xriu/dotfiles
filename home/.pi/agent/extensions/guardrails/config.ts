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

export interface AgentGateConfig {
	baseUrl: string;
	apiKey: string;
	model: string;
	systemPrompt: string;
	maxTokens: number;
	timeoutMs: number;
}

export interface GuardrailsConfig {
	enabled: boolean;
	features: {
		policies: boolean;
		permissionGate: boolean;
		pathAccess: boolean;
		agentGate: boolean;
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
	agentGate: AgentGateConfig;
}

function defaultConfigPath(): string {
	return path.join(os.homedir(), ".pi", "agent", "guardrails.json");
}

function projectConfigPath(cwd: string): string {
	return path.join(cwd, ".pi", "guardrails.json");
}

/** Concatenate base array with optional override array. */
function concat<T>(base: T[], override: T[] | undefined): T[] {
	return [...base, ...(override ?? [])];
}

/** Merge permission gate configuration from project onto global. */
function mergePermissionGate(
	global: GuardrailsConfig["permissionGate"],
	project: Partial<GuardrailsConfig["permissionGate"]>,
): GuardrailsConfig["permissionGate"] {
	return {
		patterns: concat(global.patterns, project.patterns),
		customPatterns: concat(global.customPatterns, project.customPatterns),
		requireConfirmation:
			project.requireConfirmation ?? global.requireConfirmation,
		allowedPatterns: concat(global.allowedPatterns, project.allowedPatterns),
		autoDenyPatterns: concat(global.autoDenyPatterns, project.autoDenyPatterns),
	};
}

/** Deep-merge project config on top of global config.
 * - Scalar/boolean values: project overrides global
 * - rules[]: merged by rule id (project overrides matching, adds new)
 * - pattern arrays: concatenated (project adds to global)
 */
function mergeConfigs(
	global: GuardrailsConfig,
	project: Partial<GuardrailsConfig>,
): GuardrailsConfig {
	const merged = applyDefaults({ ...global });

	if (project.enabled !== undefined) merged.enabled = project.enabled;

	if (project.features) {
		merged.features = { ...merged.features, ...project.features };
	}

	if (project.pathAccess) {
		merged.pathAccess = {
			mode: project.pathAccess.mode ?? merged.pathAccess.mode,
			allowedPaths: concat(
				merged.pathAccess.allowedPaths,
				project.pathAccess.allowedPaths,
			),
		};
	}

	if (project.policies?.rules) {
		const mergedRules = [...merged.policies.rules];
		for (const pr of project.policies.rules) {
			const idx = mergedRules.findIndex((r) => r.id === pr.id);
			if (idx >= 0) {
				mergedRules[idx] = pr;
			} else {
				mergedRules.push(pr);
			}
		}
		merged.policies.rules = mergedRules;
	}

	if (project.permissionGate) {
		merged.permissionGate = mergePermissionGate(
			merged.permissionGate,
			project.permissionGate,
		);
	}

	if (project.agentGate) {
		merged.agentGate = { ...merged.agentGate, ...project.agentGate };
	}

	return merged;
}

export function loadConfig(opts?: {
	configPath?: string;
	cwd?: string;
	readFileSync?: (path: string) => string;
	existsSync?: (path: string) => boolean;
}): { config: GuardrailsConfig; projectConfigPath: string | null } {
	const read =
		opts?.readFileSync ?? ((p: string) => fs.readFileSync(p, "utf-8"));
	const exists = opts?.existsSync ?? fs.existsSync;
	const configPath = opts?.configPath ?? defaultConfigPath();
	const cwd = opts?.cwd ?? process.cwd();

	const raw = read(configPath);
	let global: GuardrailsConfig;
	try {
		global = applyDefaults(JSON.parse(raw) as Partial<GuardrailsConfig>);
	} catch (err) {
		throw new Error(
			`Failed to parse global config: ${err instanceof Error ? err.message : String(err)}`,
		);
	}

	// Try loading project-level override
	const projPath = projectConfigPath(cwd);
	if (exists(projPath)) {
		try {
			const projRaw = read(projPath);
			const project = JSON.parse(projRaw) as Partial<GuardrailsConfig>;
			return {
				config: mergeConfigs(global, project),
				projectConfigPath: projPath,
			};
		} catch {
			// If project config fails to parse, fall back to global only
		}
	}

	return { config: global, projectConfigPath: null };
}

function applyDefaults(partial: Partial<GuardrailsConfig>): GuardrailsConfig {
	return {
		enabled: partial.enabled ?? true,
		features: {
			policies: partial.features?.policies ?? true,
			permissionGate: partial.features?.permissionGate ?? true,
			pathAccess: partial.features?.pathAccess ?? false,
			agentGate: partial.features?.agentGate ?? false,
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
		agentGate: {
			baseUrl: partial.agentGate?.baseUrl ?? "https://api.openai.com/v1",
			apiKey: partial.agentGate?.apiKey ?? "",
			model: partial.agentGate?.model ?? "gpt-4o-mini",
			systemPrompt: partial.agentGate?.systemPrompt ?? "",
			maxTokens: partial.agentGate?.maxTokens ?? 128,
			timeoutMs: partial.agentGate?.timeoutMs ?? 10000,
		},
	};
}
