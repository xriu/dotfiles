import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { getAgentDir } from "@mariozechner/pi-coding-agent";
import { Key } from "@mariozechner/pi-tui";

type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

interface MainProfile {
  provider: string;
  model: string;
  thinkingLevel?: ThinkingLevel;
}

interface Profile {
  description?: string;
  main?: MainProfile;
  agents?: Record<string, string | false>;
}

interface ProfileConfig {
  defaultProfile?: string;
  profiles: Record<string, Profile>;
}

interface ProfileState {
  activeProfile?: string;
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
    console.error(`[agent-profiles] Failed to read JSON from ${path}:`, error);
    return undefined;
  }
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getProjectConfigPath(cwd: string) {
  return join(cwd, ".pi", "agent-profiles.json");
}

function loadConfig(cwd: string): ProfileConfig {
  const globalConfig = readJson<ProfileConfig>(globalConfigPath) ?? { profiles: {} };
  const projectConfig = readJson<ProfileConfig>(getProjectConfigPath(cwd));

  if (!projectConfig) return globalConfig;

  return {
    defaultProfile: projectConfig.defaultProfile ?? globalConfig.defaultProfile,
    profiles: {
      ...globalConfig.profiles,
      ...projectConfig.profiles,
    },
  };
}

function getActiveProfileName(config: ProfileConfig): string | undefined {
  const state = readJson<ProfileState>(statePath);
  if (state?.activeProfile && config.profiles[state.activeProfile]) return state.activeProfile;
  if (config.defaultProfile && config.profiles[config.defaultProfile]) return config.defaultProfile;
  return Object.keys(config.profiles)[0];
}

function upsertAgentModel(content: string, model: string | false): string {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return content;

  const frontmatter = frontmatterMatch[1];

  if (model === false) {
    const updatedFrontmatter = frontmatter
      .replace(/^model:\s*.*\n?/m, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n+$/g, "");
    return content.replace(frontmatterMatch[0], `---\n${updatedFrontmatter}\n---`);
  }

  const updatedFrontmatter = /^model:\s*.+$/m.test(frontmatter)
    ? frontmatter.replace(/^model:\s*.+$/m, `model: ${model}`)
    : `${frontmatter}\nmodel: ${model}`;

  return content.replace(frontmatterMatch[0], `---\n${updatedFrontmatter}\n---`);
}

function syncAgentModels(profile: Profile): { updated: string[]; missing: string[] } {
  mkdirSync(globalAgentsDir, { recursive: true });

  const updated: string[] = [];
  const missing: string[] = [];

  for (const [agentName, model] of Object.entries(profile.agents ?? {})) {
    const agentPath = join(globalAgentsDir, `${agentName}.md`);
    if (!existsSync(agentPath)) {
      missing.push(agentName);
      continue;
    }

    const content = readFileSync(agentPath, "utf8");
    const next = upsertAgentModel(content, model);
    if (next !== content) writeFileSync(agentPath, next, "utf8");
    updated.push(agentName);
  }

  return { updated, missing };
}

function persistMainSettings(profile: Profile) {
  if (!profile.main) return;

  const settings = readJson<Record<string, unknown>>(settingsPath) ?? {};
  settings.defaultProvider = profile.main.provider;
  settings.defaultModel = profile.main.model;
  if (profile.main.thinkingLevel) settings.defaultThinkingLevel = profile.main.thinkingLevel;
  writeJson(settingsPath, settings);
}

async function switchCurrentSessionModel(pi: ExtensionAPI, ctx: ExtensionContext, profile: Profile) {
  if (!profile.main) return;

  const model = ctx.modelRegistry.find(profile.main.provider, profile.main.model);
  if (!model) {
    ctx.ui.notify(`Profile model not found: ${profile.main.provider}/${profile.main.model}`, "warning");
    return;
  }

  const success = await pi.setModel(model);
  if (!success) {
    ctx.ui.notify(`No API key for ${profile.main.provider}/${profile.main.model}`, "warning");
  }

  if (profile.main.thinkingLevel) {
    pi.setThinkingLevel(profile.main.thinkingLevel);
  }
}

export default function agentProfilesExtension(pi: ExtensionAPI) {
  let config: ProfileConfig = { profiles: {} };
  let activeProfileName: string | undefined;

  function updateStatus(ctx: ExtensionContext) {
    // Profile is rendered by the custom footer extension, not as a separate status item.
    ctx.ui.setStatus("profile", undefined);
  }

  function getProfileOrder(): string[] {
    return Object.keys(config.profiles).sort();
  }

  function buildProfilesSummary(): string {
    const ordered = getProfileOrder();
    if (ordered.length === 0) return "none";
    return ordered
      .map((name) => `${name}${config.profiles[name].description ? ` — ${config.profiles[name].description}` : ""}`)
      .join(" | ");
  }

  async function applyProfile(
    name: string,
    ctx: ExtensionContext,
    options: { persistState?: boolean; persistSettings?: boolean; switchCurrentModel?: boolean; notify?: boolean } = {},
  ) {
    const profile = config.profiles[name];
    if (!profile) {
      ctx.ui.notify(`Unknown profile: ${name}`, "error");
      return false;
    }

    const { updated, missing } = syncAgentModels(profile);

    if (options.persistSettings !== false) {
      persistMainSettings(profile);
    }

    if (options.persistState !== false) {
      writeJson(statePath, { activeProfile: name });
    }

    if (options.switchCurrentModel) {
      await switchCurrentSessionModel(pi, ctx, profile);
    }

    activeProfileName = name;
    updateStatus(ctx);

    if (options.notify !== false) {
      const mainText = profile.main ? `main=${profile.main.provider}/${profile.main.model}` : "main=unchanged";
      const missingText = missing.length > 0 ? ` · missing agents: ${missing.join(", ")}` : "";
      ctx.ui.notify(
        `Profile \"${name}\" active · ${mainText} · synced ${updated.length} agent(s)${missingText}`,
        "info",
      );
    }

    return true;
  }

  async function cycleProfile(ctx: ExtensionContext, direction: 1 | -1 = 1) {
    const ordered = getProfileOrder();
    if (ordered.length === 0) {
      ctx.ui.notify("No profiles defined. Add them to ~/.pi/agent/agent-profiles.json or .pi/agent-profiles.json", "warning");
      return;
    }

    const currentIndex = activeProfileName ? ordered.indexOf(activeProfileName) : -1;
    const nextIndex = currentIndex === -1
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

  async function handleProfileCommand(args: string | undefined, ctx: ExtensionContext) {
    const input = (args ?? "").trim();
    if (!input || input === "list") {
      const active = activeProfileName ?? "none";
      const projectPath = getProjectConfigPath(ctx.cwd);
      const projectInfo = existsSync(projectPath) ? ` Project override: ${projectPath}` : "";
      ctx.ui.notify(`Active profile: ${active}. Available: ${buildProfilesSummary()}.${projectInfo}`, "info");
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
    description: "Show or switch model/agent profiles: /profile [list|low|medium|high|next|prev|cycle]",
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

    if (!desiredProfile) {
      updateStatus(ctx);
      return;
    }

    await applyProfile(desiredProfile, ctx, {
      persistState: false,
      persistSettings: false,
      switchCurrentModel: false,
      notify: false,
    });
  });
}
