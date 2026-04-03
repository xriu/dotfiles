/**
 * Dev Loop Extension
 *
 * Implements an iterative development workflow:
 * /xplan → /xbuild → works? → /xdebug or /xsimplify → /xloop → done?
 *
 * Features:
 * - Workflow phases with specific guidance for each
 * - Prompts loaded from ~/.pi/agent/prompts/ files
 * - Status widget showing current phase
 * - Commands to transition between phases
 * - Session persistence
 */

import type {
	ExtensionAPI,
	ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { Key, truncateToWidth, matchesKey } from "@mariozechner/pi-tui";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Workflow phases
type Phase = "idle" | "plan" | "build" | "debug" | "simplify" | "loop";

// Tools available in each phase
const PHASE_TOOLS: Record<Phase, string[]> = {
	idle: ["read", "bash", "edit", "write"],
	plan: ["read", "bash", "grep", "find", "ls"], // Read-only exploration
	build: ["read", "bash", "edit", "write"], // Full access
	debug: ["read", "bash", "edit", "write"], // Full access for fixing
	simplify: ["read", "bash", "edit", "write"], // Full access for refactoring
	loop: ["read", "bash", "edit", "write"], // Full access
};

// Phase display info
const PHASE_INFO: Record<
	Phase,
	{ label: string; icon: string; color: string }
> = {
	idle: { label: "Idle", icon: "○", color: "dim" },
	plan: { label: "Planning", icon: "📋", color: "warning" },
	build: { label: "Building", icon: "🔨", color: "accent" },
	debug: { label: "Debugging", icon: "🐛", color: "error" },
	simplify: { label: "Simplifying", icon: "✨", color: "success" },
	loop: { label: "Looping", icon: "🔄", color: "muted" },
};

// Prompt file names for each phase
const PHASE_PROMPT_FILES: Record<Phase, string> = {
	idle: "",
	plan: "xplan.md",
	build: "xbuild.md",
	debug: "xdebug.md",
	simplify: "xsimplify.md",
	loop: "xloop.md",
};

// Cache for loaded prompts
const promptCache: Record<string, string> = {};

/**
 * Load prompt from file, with caching
 */
const loadPrompt = (phase: Phase): string => {
	if (phase === "idle") return "";

	const filename = PHASE_PROMPT_FILES[phase];
	if (!filename) return "";

	// Check cache
	if (promptCache[filename]) {
		return promptCache[filename];
	}

	// Load from file
	const promptsDir = join(homedir(), ".pi", "agent", "prompts");
	const filePath = join(promptsDir, filename);

	if (existsSync(filePath)) {
		try {
			const content = readFileSync(filePath, "utf-8");
			promptCache[filename] = content;
			return content;
		} catch (err) {
			console.error(`Failed to load prompt file ${filename}:`, err);
			return `[${phase.toUpperCase()} PHASE]\nPrompt file not found: ${filename}`;
		}
	}

	return `[${phase.toUpperCase()} PHASE]\nPrompt file not found: ${filename}`;
};

interface DevLoopState {
	phase: Phase;
	plan: string[];
	completedSteps: number[];
	iteration: number;
}

/**
 * UI component for the /xloop command
 */
class DevLoopComponent {
	private state: DevLoopState;
	private theme: any;
	private onClose: () => void;
	private cachedWidth?: number;
	private cachedLines?: string[];

	constructor(state: DevLoopState, theme: any, onClose: () => void) {
		this.state = state;
		this.theme = theme;
		this.onClose = onClose;
	}

	handleInput(data: string): void {
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
			this.onClose();
		}
	}

	render(width: number): string[] {
		if (this.cachedLines && this.cachedWidth === width) {
			return this.cachedLines;
		}

		const lines: string[] = [];
		const th = this.theme;
		const info = PHASE_INFO[this.state.phase];

		lines.push("");
		const title = th.fg("accent", " Dev Loop Workflow ");
		const headerLine =
			th.fg("borderMuted", "─".repeat(3)) +
			title +
			th.fg("borderMuted", "─".repeat(Math.max(0, width - 16)));
		lines.push(truncateToWidth(headerLine, width));
		lines.push("");

		// Current phase
		const phaseText = th.fg(info.color, `${info.icon} ${info.label}`);
		lines.push(truncateToWidth(`  Current Phase: ${phaseText}`, width));
		lines.push(
			truncateToWidth(
				`  Iteration: ${th.fg("muted", String(this.state.iteration))}`,
				width,
			),
		);
		lines.push("");

		// Workflow diagram
		lines.push(truncateToWidth(`  ${th.fg("dim", "Workflow:")}`, width));
		const phases: Phase[] = ["plan", "build", "debug", "simplify", "loop"];
		const phaseLine = phases
			.map((p) => {
				const pinfo = PHASE_INFO[p];
				const isActive = p === this.state.phase;
				const text = `${pinfo.icon} ${pinfo.label}`;
				return isActive ? th.fg("accent", `(${text})`) : th.fg("dim", text);
			})
			.join(th.fg("dim", " → "));
		lines.push(truncateToWidth(`    ${phaseLine}`, width));
		lines.push("");

		// Plan steps
		if (this.state.plan.length > 0) {
			lines.push(truncateToWidth(`  ${th.fg("dim", "Plan Steps:")}`, width));
			for (let i = 0; i < this.state.plan.length; i++) {
				const step = this.state.plan[i];
				const isCompleted = this.state.completedSteps.includes(i);
				const check = isCompleted ? th.fg("success", "✓") : th.fg("dim", "○");
				const stepText = isCompleted
					? th.fg("muted", th.strikethrough(step))
					: th.fg("text", step);
				lines.push(
					truncateToWidth(`    ${check} ${i + 1}. ${stepText}`, width),
				);
			}
			lines.push("");
		}

		// Commands
		lines.push(truncateToWidth(`  ${th.fg("dim", "Commands:")}`, width));
		lines.push(
			truncateToWidth(
				`    ${th.fg("muted", "/xplan")}     - Start planning phase`,
				width,
			),
		);
		lines.push(
			truncateToWidth(
				`    ${th.fg("muted", "/xbuild")}   - Start building phase`,
				width,
			),
		);
		lines.push(
			truncateToWidth(
				`    ${th.fg("muted", "/xdebug")}   - Start debugging phase`,
				width,
			),
		);
		lines.push(
			truncateToWidth(
				`    ${th.fg("muted", "/xsimplify")} - Start simplification phase`,
				width,
			),
		);
		lines.push(
			truncateToWidth(
				`    ${th.fg("muted", "/xloop")}    - Loop back to check completion`,
				width,
			),
		);
		lines.push("");

		lines.push(
			truncateToWidth(`  ${th.fg("dim", "Press Escape to close")}`, width),
		);
		lines.push("");

		this.cachedWidth = width;
		this.cachedLines = lines;
		return lines;
	}

	invalidate(): void {
		this.cachedWidth = undefined;
		this.cachedLines = undefined;
	}
}

export default function devLoopExtension(pi: ExtensionAPI): void {
	// In-memory state
	let state: DevLoopState = {
		phase: "idle",
		plan: [],
		completedSteps: [],
		iteration: 0,
	};

	/**
	 * Reconstruct state from session entries
	 */
	const reconstructState = (ctx: ExtensionContext) => {
		const entries = ctx.sessionManager.getEntries();

		// Find the last dev-loop-state entry
		for (let i = entries.length - 1; i >= 0; i--) {
			const entry = entries[i];
			if (
				entry.type === "custom" &&
				"customType" in entry &&
				entry.customType === "dev-loop-state" &&
				"data" in entry
			) {
				const data = entry.data as DevLoopState;
				state = { ...data };
				break;
			}
		}
	};

	/**
	 * Persist state to session
	 */
	const persistState = () => {
		pi.appendEntry("dev-loop-state", state);
	};

	/**
	 * Update UI status
	 */
	const updateStatus = (ctx: ExtensionContext) => {
		if (state.phase === "idle") {
			ctx.ui.setStatus("dev-loop", undefined);
			ctx.ui.setWidget("dev-loop", undefined);
			return;
		}

		const info = PHASE_INFO[state.phase];
		const statusText = `${info.icon} ${info.label}`;
		ctx.ui.setStatus("dev-loop", ctx.ui.theme.fg(info.color, statusText));

		// Show iteration count in widget
		const widgetLines = [
			ctx.ui.theme.fg("muted", `Iteration ${state.iteration}`),
		];
		if (state.plan.length > 0) {
			const completed = state.completedSteps.length;
			widgetLines.push(
				ctx.ui.theme.fg("dim", `${completed}/${state.plan.length} steps`),
			);
		}
		ctx.ui.setWidget("dev-loop", widgetLines);
	};

	/**
	 * Transition to a new phase
	 */
	const setPhase = (phase: Phase, ctx: ExtensionContext) => {
		const previousPhase = state.phase;
		state.phase = phase;

		// Increment iteration when entering loop
		if (phase === "loop") {
			state.iteration++;
		}

		// Set appropriate tools
		pi.setActiveTools(PHASE_TOOLS[phase]);

		const info = PHASE_INFO[phase];
		ctx.ui.notify(`${info.icon} Entered ${info.label} phase`, "info");

		updateStatus(ctx);
		persistState();
	};

	/**
	 * Extract plan steps from text
	 */
	const extractPlanSteps = (text: string): string[] => {
		const steps: string[] = [];
		const planMatch = text.match(/Plan:\s*\n([\s\S]*?)(?:\n\n|$)/);
		if (planMatch) {
			const planText = planMatch[1];
			const lines = planText.split("\n");
			for (const line of lines) {
				const stepMatch = line.match(/^\s*\d+\.\s*(.+)$/);
				if (stepMatch) {
					steps.push(stepMatch[1].trim());
				}
			}
		}
		return steps;
	};

	// Register CLI flag
	pi.registerFlag("xloop", {
		description: "Start in dev-loop mode with planning phase",
		type: "boolean",
		default: false,
	});

	// Register commands
	pi.registerCommand("xstatus", {
		description: "Show dev-loop workflow status and controls",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("/xstatus requires interactive mode", "error");
				return;
			}

			await ctx.ui.custom<void>((_tui, theme, _kb, done) => {
				return new DevLoopComponent(state, theme, () => done());
			});
		},
	});

	// Register phase commands
	pi.registerCommand("xplan", {
		description: "Enter planning phase (read-only exploration)",
		handler: async (_args, ctx) => {
			setPhase("plan", ctx);
		},
	});

	pi.registerCommand("xbuild", {
		description: "Enter building phase (full tool access)",
		handler: async (_args, ctx) => {
			setPhase("build", ctx);
		},
	});

	pi.registerCommand("xdebug", {
		description: "Enter debugging phase (for when things don't work)",
		handler: async (_args, ctx) => {
			setPhase("debug", ctx);
		},
	});

	pi.registerCommand("xsimplify", {
		description: "Enter simplification phase (clean up working code)",
		handler: async (_args, ctx) => {
			setPhase("simplify", ctx);
		},
	});

	pi.registerCommand("xloop", {
		description: "Enter loop phase (check if done or continue)",
		handler: async (_args, ctx) => {
			setPhase("loop", ctx);
		},
	});

	// Register keyboard shortcut
	pi.registerShortcut(Key.ctrlAlt("x"), {
		description: "Cycle through dev-loop phases",
		handler: async (ctx) => {
			// Toggle through phases
			const phases: Phase[] = ["idle", "plan", "build", "loop"];
			const currentIndex = phases.indexOf(state.phase);
			const nextIndex = (currentIndex + 1) % phases.length;
			setPhase(phases[nextIndex], ctx);
		},
	});

	// Block destructive commands in plan phase
	pi.on("tool_call", async (event) => {
		if (state.phase !== "plan" || event.toolName !== "bash") return;

		const command = event.input.command as string;
		const blockedPatterns = [
			/\brm\s/,
			/\bmv\s/,
			/\bcp\s/,
			/\bmkdir\s/,
			/\btouch\s/,
			/\bgit\s+(add|commit|push|reset|checkout)/,
			/\bnpm\s+(install|i|add|remove|uninstall)/,
			/\byarn\s+(add|remove)/,
			/\bpip\s+install/,
			/\bsudo\s/,
			/\b>\s/,
			/\b>>\s/,
		];

		for (const pattern of blockedPatterns) {
			if (pattern.test(command)) {
				return {
					block: true,
					reason: `Plan phase: write operations blocked. Use /xbuild to enable full access.\nCommand: ${command}`,
				};
			}
		}
	});

	// Filter out phase context when not in a phase
	pi.on("context", async (event) => {
		if (state.phase === "idle") {
			return {
				messages: event.messages.filter((m) => {
					const msg = m as { customType?: string };
					if (msg.customType?.startsWith("dev-loop-")) return false;
					return true;
				}),
			};
		}
	});

	// Inject phase context before agent starts
	pi.on("before_agent_start", async () => {
		if (state.phase === "idle") return;

		const prompt = loadPrompt(state.phase);
		return {
			message: {
				customType: `dev-loop-${state.phase}`,
				content: prompt,
				display: false,
			},
		};
	});

	// Extract plan steps from assistant messages
	pi.on("agent_end", async (event, ctx) => {
		if (state.phase !== "plan") return;

		// Find last assistant message
		const messages = event.messages;
		for (let i = messages.length - 1; i >= 0; i--) {
			const msg = messages[i];
			if (msg.role === "assistant" && "content" in msg) {
				const content = msg.content;
				if (Array.isArray(content)) {
					const textContent = content
						.filter(
							(b): b is { type: "text"; text: string } => b.type === "text",
						)
						.map((b) => b.text)
						.join("\n");

					const steps = extractPlanSteps(textContent);
					if (steps.length > 0) {
						state.plan = steps;
						state.completedSteps = [];
						updateStatus(ctx);
						persistState();

						if (ctx.hasUI) {
							const choice = await ctx.ui.select("Plan created! What next?", [
								"Start building (/xbuild)",
								"Refine the plan",
								"Stay in plan mode",
							]);

							if (choice === "Start building (/xbuild)") {
								setPhase("build", ctx);
								pi.sendUserMessage("Start implementing the plan from step 1.", {
									deliverAs: "steer",
								});
							} else if (choice === "Refine the plan") {
								const refinement = await ctx.ui.editor(
									"Refine the plan:",
									textContent,
								);
								if (refinement?.trim()) {
									pi.sendUserMessage(refinement.trim(), { deliverAs: "steer" });
								}
							}
						}
					}
				}
				break;
			}
		}
	});

	// Restore state on session start
	pi.on("session_start", async (_event, ctx) => {
		if (pi.getFlag("xloop") === true) {
			setPhase("plan", ctx);
		} else {
			reconstructState(ctx);
			if (state.phase !== "idle") {
				pi.setActiveTools(PHASE_TOOLS[state.phase]);
				updateStatus(ctx);
			}
		}
	});

	pi.on("session_switch", async (_event, ctx) => reconstructState(ctx));
	pi.on("session_fork", async (_event, ctx) => reconstructState(ctx));
}
