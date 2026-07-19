import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";

type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

const THINKING_LEVELS = new Set<ThinkingLevel>([
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
]);

interface MainProfile {
	provider: string;
	model: string;
	thinkingLevel?: ThinkingLevel;
}

interface AgentOverride {
	model: string;
	thinkingLevel?: ThinkingLevel;
}

interface Profile {
	description?: string;
	main?: MainProfile | MainProfile[];
	agents?: Record<string, string | AgentOverride | false>;
}

function getPrimaryMain(profile: Profile): MainProfile | undefined {
	if (!profile.main) return undefined;
	return Array.isArray(profile.main) ? profile.main[0] : profile.main;
}

function isValidAgentName(name: string): boolean {
	return (
		name.length > 0 &&
		name !== "." &&
		name !== ".." &&
		!name.includes("/") &&
		!name.includes("\\")
	);
}

function isValidProfileMain(profile: Profile): boolean {
	const main = profile.main;
	if (!main) return true;
	return Array.isArray(main)
		? main.every(isValidMainProfile)
		: isValidMainProfile(main);
}

interface SyncResult {
	updated: string[];
	missing: string[];
	invalid: string[];
}

function notifyProfileApplied(
	ctx: ExtensionContext,
	profile: Profile,
	name: string,
	result: SyncResult,
) {
	const main = getPrimaryMain(profile);
	const mainText = main
		? `main=${main.provider}/${main.model}`
		: "main=unchanged";
	const missingText =
		result.missing.length > 0
			? ` · missing agents: ${result.missing.join(", ")}`
			: "";
	const invalidText =
		result.invalid.length > 0
			? ` · invalid agents: ${result.invalid.join(", ")}`
			: "";
	ctx.ui.notify(
		`Profile "${name}" active · ${mainText} · synced ${result.updated.length} agent(s)${missingText}${invalidText}`,
		"info",
	);
}

interface ProfileConfig {
	defaultProfile?: string;
	profiles: Record<string, Profile>;
}

interface ProfileState {
	activeProfile?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeProfileConfig(value: unknown): ProfileConfig {
	if (!isRecord(value)) return { profiles: {} };

	const profiles = isRecord(value.profiles)
		? (Object.fromEntries(
				Object.entries(value.profiles).filter(([, profile]) =>
					isRecord(profile),
				),
			) as Record<string, Profile>)
		: {};

	return {
		defaultProfile:
			typeof value.defaultProfile === "string"
				? value.defaultProfile
				: undefined,
		profiles,
	};
}

const extensionDir = dirname(fileURLToPath(import.meta.url));
const globalConfigPath = join(dirname(extensionDir), "agent-profiles.json");
const statePath = join(getAgentDir(), "agent-profile-state.json");
const settingsPath = join(getAgentDir(), "settings.json");
const globalAgentsDir = join(getAgentDir(), "agents");

function readJson<T>(path: string): T | undefined {
	if (!existsSync(path)) return undefined;
	try {
		return JSON.parse(readFileSync(path, "utf8")) as T;
	} catch (error) {
		console.error("[agent-profiles] Failed to read JSON", { path, error });
		return undefined;
	}
}

function writeJson(path: string, value: unknown) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getProjectConfigPath(cwd: string) {
	return join(cwd, ".pi", "agent-profiles.json");
}

function mergeProfiles(
	globalProfile: Profile | undefined,
	projectProfile: Profile,
): Profile {
	return {
		...globalProfile,
		...projectProfile,
		agents:
			globalProfile?.agents || projectProfile.agents
				? { ...globalProfile?.agents, ...projectProfile.agents }
				: undefined,
	};
}

function loadConfig(cwd: string): ProfileConfig {
	const globalConfig = normalizeProfileConfig(
		readJson<unknown>(globalConfigPath),
	);
	const projectConfigPath = getProjectConfigPath(cwd);
	const projectConfigRaw = readJson<unknown>(projectConfigPath);
	const projectConfig = projectConfigRaw
		? normalizeProfileConfig(projectConfigRaw)
		: undefined;

	if (!projectConfig) return globalConfig;

	const profiles: Record<string, Profile> = { ...globalConfig.profiles };
	for (const [name, projectProfile] of Object.entries(projectConfig.profiles)) {
		profiles[name] = mergeProfiles(profiles[name], projectProfile);
	}

	return {
		defaultProfile: projectConfig.defaultProfile ?? globalConfig.defaultProfile,
		profiles,
	};
}

function getActiveProfileName(config: ProfileConfig): string | undefined {
	const state = readJson<ProfileState>(statePath);
	if (state?.activeProfile && config.profiles[state.activeProfile])
		return state.activeProfile;
	if (config.defaultProfile && config.profiles[config.defaultProfile])
		return config.defaultProfile;
	return Object.keys(config.profiles)[0];
}

function upsertAgentConfig(
	content: string,
	override: AgentOverride | false,
): string {
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!frontmatterMatch) return content;

	let frontmatter = frontmatterMatch[1]
		.replace(/^(?!\s*#)\s*model:\s*.*\n?/m, "")
		.replace(/^(?!\s*#)\s*thinking:\s*.*\n?/m, "")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/\n+$/g, "");

	if (override !== false) {
		frontmatter += `\nmodel: ${override.model}`;
		if (override.thinkingLevel) {
			frontmatter += `\nthinking: ${override.thinkingLevel}`;
		}
	}

	return content.replace(frontmatterMatch[0], `---\n${frontmatter}\n---`);
}

function isValidMainProfile(main: unknown): main is MainProfile {
	return (
		isRecord(main) &&
		typeof main.provider === "string" &&
		main.provider.trim().length > 0 &&
		typeof main.model === "string" &&
		main.model.trim().length > 0 &&
		(main.thinkingLevel === undefined ||
			THINKING_LEVELS.has(main.thinkingLevel))
	);
}

function normalizeAgentOverride(
	value: string | AgentOverride | false,
): AgentOverride | false | undefined {
	if (value === false) return false;

	if (typeof value === "string") {
		const model = value.trim();
		return model && !/\s/.test(model) ? { model } : undefined;
	}

	if (
		!value ||
		typeof value.model !== "string" ||
		!value.model.trim() ||
		/\s/.test(value.model) ||
		(value.thinkingLevel !== undefined &&
			!THINKING_LEVELS.has(value.thinkingLevel))
	) {
		return undefined;
	}

	return {
		...value,
		model: value.model.trim(),
	};
}

function syncAgentModels(profile: Profile): SyncResult {
	const updated: string[] = [];
	const missing: string[] = [];
	const invalid: string[] = [];

	for (const [agentName, value] of Object.entries(profile.agents ?? {})) {
		if (!isValidAgentName(agentName)) {
			invalid.push(agentName);
			continue;
		}

		const override = normalizeAgentOverride(value);
		if (override === undefined) {
			invalid.push(agentName);
			continue;
		}
		const agentPath = join(globalAgentsDir, `${agentName}.md`);

		if (!existsSync(agentPath)) {
			missing.push(agentName);
			continue;
		}

		const content = readFileSync(agentPath, "utf8");
		const next = upsertAgentConfig(content, override);
		if (next !== content) {
			writeFileSync(agentPath, next, "utf8");
			updated.push(agentName);
		}
	}

	return {
		updated,
		missing,
		invalid,
	};
}

function persistMainSettings(profile: Profile) {
	const main = getPrimaryMain(profile);
	if (!main) return;

	const settings = readJson<Record<string, unknown>>(settingsPath) ?? {};
	settings.defaultProvider = main.provider;
	settings.defaultModel = main.model;
	settings.defaultThinkingLevel = main.thinkingLevel;
	writeJson(settingsPath, settings);
}

async function switchCurrentSessionModel(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	profile: Profile,
): Promise<boolean> {
	const main = getPrimaryMain(profile);
	if (!main) return true;

	const model = ctx.modelRegistry.find(main.provider, main.model);
	if (!model) {
		ctx.ui.notify(
			`Profile model not found: ${main.provider}/${main.model}`,
			"warning",
		);
		return false;
	}

	const success = await pi.setModel(model);
	if (!success) {
		ctx.ui.notify(`No API key for ${main.provider}/${main.model}`, "warning");
		return false;
	}

	if (main.thinkingLevel) {
		pi.setThinkingLevel(main.thinkingLevel);
	}
	return true;
}

export default function agentProfilesExtension(pi: ExtensionAPI) {
	let config: ProfileConfig = {
		profiles: {},
	};
	let activeProfileName: string | undefined;

	function getProfileOrder(): string[] {
		return Object.keys(config.profiles).sort((a, b) => a.localeCompare(b));
	}

	function buildProfilesSummary(): string {
		const ordered = getProfileOrder();
		if (ordered.length === 0) return "none";
		return ordered
			.map(
				(name) =>
					`${name}${config.profiles[name].description ? ` — ${config.profiles[name].description}` : ""}`,
			)
			.join(" | ");
	}

	async function applyProfile(
		name: string,
		ctx: ExtensionContext,
		options: {
			persistState?: boolean;
			persistSettings?: boolean;
			switchCurrentModel?: boolean;
			notify?: boolean;
		} = {},
	) {
		const profile = config.profiles[name];
		if (!profile) {
			ctx.ui.notify(`Unknown profile: ${name}`, "error");
			return false;
		}
		if (!isValidProfileMain(profile)) {
			ctx.ui.notify(`Invalid main configuration for profile: ${name}`, "error");
			return false;
		}

		if (
			options.switchCurrentModel &&
			!(await switchCurrentSessionModel(pi, ctx, profile))
		) {
			return false;
		}

		const syncResult = syncAgentModels(profile);

		if (options.persistSettings !== false) {
			persistMainSettings(profile);
		}

		if (options.persistState !== false) {
			writeJson(statePath, {
				activeProfile: name,
			});
		}

		activeProfileName = name;

		if (options.notify !== false) {
			notifyProfileApplied(ctx, profile, name, syncResult);
		}

		return true;
	}

	async function cycleProfile(ctx: ExtensionContext, direction: 1 | -1 = 1) {
		const ordered = getProfileOrder();
		if (ordered.length === 0) {
			ctx.ui.notify(
				"No profiles defined. Add them to ~/.pi/agent/agent-profiles.json or .pi/agent-profiles.json",
				"warning",
			);
			return;
		}

		const currentIndex = activeProfileName
			? ordered.indexOf(activeProfileName)
			: -1;
		const nextIndex =
			currentIndex === -1
				? 0
				: (currentIndex + direction + ordered.length) % ordered.length;

		await applyProfile(ordered[nextIndex], ctx, {
			persistState: true,
			persistSettings: true,
			switchCurrentModel: true,
			notify: true,
		});
	}

	pi.registerShortcut(Key.ctrlShift("y"), {
		description: "Cycle agent profiles",
		handler: async (ctx) => {
			await cycleProfile(ctx, 1);
		},
	});

	async function handleProfileCommand(
		args: string | undefined,
		ctx: ExtensionContext,
	) {
		const input = (args ?? "").trim();
		if (!input || input === "list") {
			const active = activeProfileName ?? "none";
			const projectPath = getProjectConfigPath(ctx.cwd);
			const projectInfo = existsSync(projectPath)
				? ` Project override: ${projectPath}`
				: "";
			ctx.ui.notify(
				`Active profile: ${active}. Available: ${buildProfilesSummary()}.${projectInfo}`,
				"info",
			);
			return;
		}

		if (input === "next" || input === "cycle") {
			await cycleProfile(ctx, 1);
			return;
		}

		if (input === "prev") {
			await cycleProfile(ctx, -1);
			return;
		}

		await applyProfile(input, ctx, {
			persistState: true,
			persistSettings: true,
			switchCurrentModel: true,
			notify: true,
		});
	}

	pi.registerCommand("profile", {
		description:
			"Show or switch model/agent profiles: /profile [list|next|prev|cycle|<profile>]",
		handler: async (args, ctx) => {
			await handleProfileCommand(args, ctx);
		},
	});

	pi.registerCommand("p", {
		description: "Short alias for /profile",
		handler: async (args, ctx) => {
			await handleProfileCommand(args, ctx);
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		config = loadConfig(ctx.cwd);
		const desiredProfile = getActiveProfileName(config);

		if (!desiredProfile) return;

		await applyProfile(desiredProfile, ctx, {
			persistState: false,
			persistSettings: false,
			switchCurrentModel: false,
			notify: false,
		});
	});
}
