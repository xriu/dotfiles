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
		patterns: concat(global.patterns, normalizePatterns(project.patterns)),
		customPatterns: concat(
			global.customPatterns,
			normalizePatterns(project.customPatterns),
		),
		requireConfirmation:
			typeof project.requireConfirmation === "boolean"
				? project.requireConfirmation
				: global.requireConfirmation,
		allowedPatterns: concat(
			global.allowedPatterns,
			normalizePatterns(project.allowedPatterns),
		),
		autoDenyPatterns: concat(
			global.autoDenyPatterns,
			normalizePatterns(project.autoDenyPatterns),
		),
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

	if (typeof project.enabled === "boolean") merged.enabled = project.enabled;

	if (isRecord(project.features)) {
		for (const feature of Object.keys(merged.features) as Array<
			keyof GuardrailsConfig["features"]
		>) {
			if (typeof project.features[feature] === "boolean") {
				merged.features[feature] = project.features[feature];
			}
		}
	}

	if (isRecord(project.pathAccess)) {
		merged.pathAccess = {
			mode:
				typeof project.pathAccess.mode === "string"
					? project.pathAccess.mode
					: merged.pathAccess.mode,
			allowedPaths: concat(
				merged.pathAccess.allowedPaths,
				normalizeAllowedPaths(project.pathAccess.allowedPaths),
			),
		};
	}

	const projectRules = normalizeRules(project.policies?.rules);
	if (projectRules.length > 0) {
		const mergedRules = [...merged.policies.rules];
		for (const pr of projectRules) {
			const idx = mergedRules.findIndex((r) => r.id === pr.id);
			if (idx >= 0) {
				mergedRules[idx] = pr;
			} else {
				mergedRules.push(pr);
			}
		}
		merged.policies.rules = mergedRules;
	}

	if (isRecord(project.permissionGate)) {
		merged.permissionGate = mergePermissionGate(
			merged.permissionGate,
			project.permissionGate,
		);
	}

	if (isRecord(project.agentGate)) {
		merged.agentGate = applyAgentGateDefaults(
			project.agentGate,
			merged.agentGate,
		);
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

	let global: GuardrailsConfig;
	try {
		const raw = read(configPath);
		global = applyDefaults(JSON.parse(raw) as Partial<GuardrailsConfig>);
	} catch (err) {
		throw new Error(
			`Failed to load global config: ${err instanceof Error ? err.message : String(err)}`,
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePatterns(value: unknown): PermissionGatePattern[] {
	return normalizeAllowedPaths(value).filter(
		(p): p is PermissionGatePattern =>
			typeof (p as Record<string, unknown>).description === "string",
	);
}

function normalizeRules(value: unknown): PolicyRule[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((rule): PolicyRule[] => {
		if (
			!isRecord(rule) ||
			typeof rule.id !== "string" ||
			typeof rule.description !== "string" ||
			(rule.protection !== "noAccess" && rule.protection !== "readOnly") ||
			!Array.isArray(rule.patterns)
		) {
			return [];
		}

		const patterns = normalizeAllowedPaths(rule.patterns);
		if (patterns.length !== rule.patterns.length) return [];

		const allowedPatterns = Array.isArray(rule.allowedPatterns)
			? normalizeAllowedPaths(rule.allowedPatterns)
			: undefined;
		if (
			rule.allowedPatterns !== undefined &&
			(!allowedPatterns ||
				allowedPatterns.length !== rule.allowedPatterns.length)
		) {
			return [];
		}

		return [
			{
				id: rule.id,
				description: rule.description,
				patterns,
				allowedPatterns,
				protection: rule.protection,
				onlyIfExists:
					typeof rule.onlyIfExists === "boolean"
						? rule.onlyIfExists
						: undefined,
			},
		];
	});
}

function normalizeAllowedPaths(value: unknown): Array<{ pattern: string }> {
	if (!Array.isArray(value)) return [];
	return value.filter(
		(pattern): pattern is { pattern: string } =>
			isRecord(pattern) && typeof pattern.pattern === "string",
	);
}

function applyAgentGateDefaults(
	partial: Record<string, unknown>,
	base: AgentGateConfig,
): AgentGateConfig {
	return {
		baseUrl:
			typeof partial.baseUrl === "string" ? partial.baseUrl : base.baseUrl,
		apiKey: typeof partial.apiKey === "string" ? partial.apiKey : base.apiKey,
		model: typeof partial.model === "string" ? partial.model : base.model,
		systemPrompt:
			typeof partial.systemPrompt === "string"
				? partial.systemPrompt
				: base.systemPrompt,
		maxTokens:
			typeof partial.maxTokens === "number" &&
			Number.isFinite(partial.maxTokens)
				? partial.maxTokens
				: base.maxTokens,
		timeoutMs:
			typeof partial.timeoutMs === "number" &&
			Number.isFinite(partial.timeoutMs)
				? partial.timeoutMs
				: base.timeoutMs,
	};
}

function applyDefaults(partial: Partial<GuardrailsConfig>): GuardrailsConfig {
	const features = isRecord(partial.features) ? partial.features : {};
	return {
		enabled: typeof partial.enabled === "boolean" ? partial.enabled : true,
		features: {
			policies:
				typeof features.policies === "boolean" ? features.policies : true,
			permissionGate:
				typeof features.permissionGate === "boolean"
					? features.permissionGate
					: true,
			pathAccess:
				typeof features.pathAccess === "boolean" ? features.pathAccess : false,
			agentGate:
				typeof features.agentGate === "boolean" ? features.agentGate : false,
		},
		pathAccess: {
			mode:
				typeof partial.pathAccess?.mode === "string"
					? partial.pathAccess.mode
					: "ask",
			allowedPaths: normalizeAllowedPaths(partial.pathAccess?.allowedPaths),
		},
		policies: {
			rules: normalizeRules(partial.policies?.rules),
		},
		permissionGate: {
			patterns: normalizePatterns(partial.permissionGate?.patterns),
			customPatterns: normalizePatterns(partial.permissionGate?.customPatterns),
			requireConfirmation:
				typeof partial.permissionGate?.requireConfirmation === "boolean"
					? partial.permissionGate.requireConfirmation
					: true,
			allowedPatterns: normalizePatterns(
				partial.permissionGate?.allowedPatterns,
			),
			autoDenyPatterns: normalizePatterns(
				partial.permissionGate?.autoDenyPatterns,
			),
		},
		agentGate: applyAgentGateDefaults(
			isRecord(partial.agentGate) ? partial.agentGate : {},
			{
				baseUrl: "https://api.openai.com/v1",
				apiKey: "",
				model: "gpt-4o-mini",
				systemPrompt: "",
				maxTokens: 128,
				timeoutMs: 10000,
			},
		),
	};
}
