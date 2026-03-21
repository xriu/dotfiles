import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { getAgentDir } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

interface ProfileState {
  activeProfile?: string;
}

interface Settings {
  customProfileFooter?: boolean;
  [key: string]: unknown;
}

const profileStatePath = join(getAgentDir(), "agent-profile-state.json");
const settingsPath = join(getAgentDir(), "settings.json");

function sanitizeStatusText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1000000) return `${Math.round(count / 1000)}k`;
  if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
  return `${Math.round(count / 1000000)}M`;
}

function getActiveProfile(): string {
  if (!existsSync(profileStatePath)) return "none";
  try {
    const state = JSON.parse(readFileSync(profileStatePath, "utf8")) as ProfileState;
    return state.activeProfile || "none";
  } catch {
    return "none";
  }
}

function readSettings(): Settings {
  if (!existsSync(settingsPath)) return {};
  try {
    return JSON.parse(readFileSync(settingsPath, "utf8")) as Settings;
  } catch {
    return {};
  }
}

function writeSettings(settings: Settings) {
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

function isCustomFooterEnabled(): boolean {
  const settings = readSettings();
  return settings.customProfileFooter !== false;
}

export default function profileModelFooter(pi: ExtensionAPI) {
  function installCustomFooter(ctx: ExtensionContext) {
    ctx.ui.setFooter((tui, theme, footerData) => {
      const unsubBranch = footerData.onBranchChange(() => tui.requestRender());

      return {
        dispose: unsubBranch,
        invalidate() {},
        render(width: number): string[] {
          let totalInput = 0;
          let totalOutput = 0;
          let totalCacheRead = 0;
          let totalCacheWrite = 0;
          let totalCost = 0;

          for (const entry of ctx.sessionManager.getEntries()) {
            if (entry.type === "message" && entry.message.role === "assistant") {
              const message = entry.message as AssistantMessage;
              totalInput += message.usage.input;
              totalOutput += message.usage.output;
              totalCacheRead += message.usage.cacheRead;
              totalCacheWrite += message.usage.cacheWrite;
              totalCost += message.usage.cost.total;
            }
          }

          const contextUsage = ctx.getContextUsage();
          const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
          const contextPercentValue = contextUsage?.percent ?? 0;
          const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";

          let pwd = process.cwd();
          const home = process.env.HOME || process.env.USERPROFILE;
          if (home && pwd.startsWith(home)) pwd = `~${pwd.slice(home.length)}`;

          const branch = footerData.getGitBranch();
          if (branch) pwd = `${pwd} (${branch})`;

          const sessionName = ctx.sessionManager.getSessionName?.();
          if (sessionName) pwd = `${pwd} • ${sessionName}`;

          const statsParts: string[] = [];
          if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
          if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
          if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
          if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);

          const usingSubscription = ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false;
          if (totalCost || usingSubscription) {
            statsParts.push(`$${totalCost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`);
          }

          const autoIndicator = " (auto)";
          const contextPercentDisplay =
            contextPercent === "?"
              ? `?/${formatTokens(contextWindow)}${autoIndicator}`
              : `${contextPercent}%/${formatTokens(contextWindow)}${autoIndicator}`;

          let contextPercentStr: string;
          if (contextPercentValue > 90) {
            contextPercentStr = theme.fg("error", contextPercentDisplay);
          } else if (contextPercentValue > 70) {
            contextPercentStr = theme.fg("warning", contextPercentDisplay);
          } else {
            contextPercentStr = contextPercentDisplay;
          }
          statsParts.push(contextPercentStr);

          let statsLeft = statsParts.join(" ");
          let statsLeftWidth = visibleWidth(statsLeft);
          if (statsLeftWidth > width) {
            statsLeft = truncateToWidth(statsLeft, width, "...");
            statsLeftWidth = visibleWidth(statsLeft);
          }

          const minPadding = 2;
          const modelName = ctx.model?.id || "no-model";
          const profile = getActiveProfile();

          let modelAndThinking = modelName;
          if (ctx.model?.reasoning) {
            const thinking = pi.getThinkingLevel?.() || "off";
            modelAndThinking = thinking === "off" ? `${modelName} • thinking off` : `${modelName} • ${thinking}`;
          }

          let rightSide = `◈ ${profile} • ${modelAndThinking}`;
          if (footerData.getAvailableProviderCount() > 1 && ctx.model) {
            const withProvider = `◈ ${profile} • (${ctx.model.provider}) ${modelAndThinking}`;
            if (statsLeftWidth + minPadding + visibleWidth(withProvider) <= width) {
              rightSide = withProvider;
            }
          }

          const rightSideWidth = visibleWidth(rightSide);
          const totalNeeded = statsLeftWidth + minPadding + rightSideWidth;

          let statsLine: string;
          if (totalNeeded <= width) {
            const padding = " ".repeat(width - statsLeftWidth - rightSideWidth);
            statsLine = statsLeft + padding + rightSide;
          } else {
            const availableForRight = width - statsLeftWidth - minPadding;
            if (availableForRight > 0) {
              const truncatedRight = truncateToWidth(rightSide, availableForRight, "");
              const truncatedRightWidth = visibleWidth(truncatedRight);
              const padding = " ".repeat(Math.max(0, width - statsLeftWidth - truncatedRightWidth));
              statsLine = statsLeft + padding + truncatedRight;
            } else {
              statsLine = statsLeft;
            }
          }

          const dimStatsLeft = theme.fg("dim", statsLeft);
          const remainder = statsLine.slice(statsLeft.length);
          const dimRemainder = theme.fg("dim", remainder);

          const pwdLine = truncateToWidth(theme.fg("dim", pwd), width, theme.fg("dim", "..."));
          const lines = [pwdLine, dimStatsLeft + dimRemainder];

          const extensionStatuses = footerData.getExtensionStatuses();
          const filteredStatuses = Array.from(extensionStatuses.entries())
            .filter(([key]) => key !== "profile")
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, text]) => sanitizeStatusText(text));

          if (filteredStatuses.length > 0) {
            lines.push(truncateToWidth(filteredStatuses.join(" "), width, theme.fg("dim", "...")));
          }

          return lines;
        },
      };
    });
  }

  function applyFooterMode(ctx: ExtensionContext) {
    if (isCustomFooterEnabled()) {
      installCustomFooter(ctx);
    } else {
      ctx.ui.setFooter(undefined);
    }
  }

  pi.registerCommand("footer-profile", {
    description: "Toggle profile-aware footer: /footer-profile [on|off|toggle|status]",
    handler: async (args, ctx) => {
      const input = (args ?? "").trim() || "status";
      const settings = readSettings();
      const enabled = isCustomFooterEnabled();

      if (input === "status") {
        ctx.ui.notify(`Profile footer is ${enabled ? "on" : "off"}`, "info");
        return;
      }

      if (input === "on") {
        settings.customProfileFooter = true;
        writeSettings(settings);
        applyFooterMode(ctx);
        ctx.ui.notify("Profile footer enabled", "info");
        return;
      }

      if (input === "off") {
        settings.customProfileFooter = false;
        writeSettings(settings);
        applyFooterMode(ctx);
        ctx.ui.notify("Profile footer disabled; using Pi default footer", "info");
        return;
      }

      if (input === "toggle") {
        settings.customProfileFooter = !enabled;
        writeSettings(settings);
        applyFooterMode(ctx);
        ctx.ui.notify(
          settings.customProfileFooter ? "Profile footer enabled" : "Profile footer disabled; using Pi default footer",
          "info",
        );
        return;
      }

      ctx.ui.notify("Usage: /footer-profile [on|off|toggle|status]", "warning");
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    applyFooterMode(ctx);
  });

  pi.on("model_select", async (_event, ctx) => {
    applyFooterMode(ctx);
  });
}
