import type {
	ExtensionAPI,
	ExtensionCommandContext,
	Theme,
} from "@earendil-works/pi-coding-agent";
import {
	type Component,
	Marked,
	matchesKey,
	sliceByColumn,
	type TUI,
	visibleWidth,
} from "@earendil-works/pi-tui";
import { render } from "grok-mermaid";
import { normalizeSequenceSemicolons } from "./source.ts";

const markdownParser = new Marked();

/** Add a forced Mermaid viewer and repair sequence labels for inline rendering. */
export default function mermaidExtension(pi: ExtensionAPI): void {
	pi.registerMarkdownTransformer((markdown, context) => {
		if (context.messageType === "assistant-thinking") return markdown;

		return markdownParser
			.lexer(markdown)
			.map((token) => {
				if (token.type !== "code" || !isMermaid(token.lang)) return token.raw;

				const art = render(normalizeSequenceSemicolons(token.text));
				if (!art) return token.raw;
				if (art.width > context.availableWidth) {
					return `${token.raw}\n\n_This diagram needs ${art.width} columns. Run \`/mermaid\` to view it with scrolling._\n\n`;
				}
				return `${art.plain.map(codeSpan).join("  \n")}\n`;
			})
			.join("");
	});

	pi.registerCommand("mermaid", {
		description: "View the latest Mermaid diagram with scrolling",
		handler: async (args, ctx) => {
			if (ctx.mode !== "tui") {
				if (ctx.hasUI)
					ctx.ui.notify(
						"The Mermaid viewer needs the interactive terminal.",
						"warning",
					);
				return;
			}

			const source =
				sourceFromText(args) ??
				latestAssistantMermaid(ctx) ??
				(await ctx.ui.editor("Paste Mermaid source", ""))?.trim();
			if (!source) return;

			const art = render(normalizeSequenceSemicolons(source));
			if (!art) {
				ctx.ui.notify(
					"Could not draw this Mermaid source. Check its syntax and diagram type.",
					"warning",
				);
				return;
			}

			await ctx.ui.custom<undefined>(
				(tui, theme, _keybindings, done) =>
					new MermaidViewer(art.plain, tui, theme, done),
			);
		},
	});
}

function isMermaid(language: string | undefined): boolean {
	return language?.trim().split(/\s+/, 1)[0]?.toLowerCase() === "mermaid";
}

function codeSpan(line: string): string {
	const content = line || "\u00a0";
	const longestBacktickRun = Math.max(
		0,
		...Array.from(content.matchAll(/`+/g), (match) => match[0].length),
	);
	const fence = "`".repeat(longestBacktickRun + 1);
	const padding = content.startsWith("`") || content.endsWith("`") ? " " : "";
	return `${fence}${padding}${content}${padding}${fence}`;
}

function sourceFromText(text: string): string | undefined {
	return latestMermaidBlock(text) ?? (text.trim() || undefined);
}

function latestMermaidBlock(text: string): string | undefined {
	let source: string | undefined;
	for (const token of markdownParser.lexer(text)) {
		if (token.type === "code" && isMermaid(token.lang)) source = token.text;
	}
	return source;
}

function latestAssistantMermaid(
	ctx: ExtensionCommandContext,
): string | undefined {
	const branch = ctx.sessionManager.getBranch();
	for (let index = branch.length - 1; index >= 0; index--) {
		const entry = branch[index];
		if (entry?.type !== "message" || entry.message.role !== "assistant")
			continue;

		const text = entry.message.content
			.flatMap((part) => (part.type === "text" ? [part.text] : []))
			.join("\n");
		const source = latestMermaidBlock(text);
		if (source) return source;
	}
	return undefined;
}

class MermaidViewer implements Component {
	private offsetX = 0;
	private offsetY = 0;
	private viewportWidth = 1;
	private viewportHeight = 1;
	private readonly diagramWidth: number;

	constructor(
		private readonly lines: ReadonlyArray<string>,
		private readonly tui: TUI,
		private readonly theme: Theme,
		private readonly done: (result: undefined) => void,
	) {
		this.diagramWidth = Math.max(1, ...lines.map(visibleWidth));
	}

	render(width: number): string[] {
		this.viewportWidth = Math.max(1, width);
		this.viewportHeight = Math.max(1, this.tui.terminal.rows - 6);
		this.offsetX = Math.min(
			this.offsetX,
			Math.max(0, this.diagramWidth - this.viewportWidth),
		);
		this.offsetY = Math.min(
			this.offsetY,
			Math.max(0, this.lines.length - this.viewportHeight),
		);

		const firstColumn = this.offsetX + 1;
		const lastColumn = Math.min(
			this.diagramWidth,
			this.offsetX + this.viewportWidth,
		);
		const header = this.theme.fg(
			"accent",
			`Mermaid · columns ${firstColumn}-${lastColumn} of ${this.diagramWidth}`,
		);
		const footer = this.theme.fg("muted", "←→ / ↑↓ scroll · Esc/q close");
		const body = this.lines
			.slice(this.offsetY, this.offsetY + this.viewportHeight)
			.map((line) =>
				sliceByColumn(line, this.offsetX, this.viewportWidth, true),
			);

		return [
			sliceByColumn(header, 0, this.viewportWidth, true),
			...body,
			sliceByColumn(footer, 0, this.viewportWidth, true),
		];
	}

	handleInput(data: string): void {
		if (matchesKey(data, "escape") || data.toLowerCase() === "q") {
			this.done(undefined);
			return;
		}

		const step = Math.max(1, Math.floor(this.viewportWidth / 2));
		if (matchesKey(data, "left"))
			this.offsetX = Math.max(0, this.offsetX - step);
		else if (matchesKey(data, "right")) {
			this.offsetX = Math.min(
				Math.max(0, this.diagramWidth - this.viewportWidth),
				this.offsetX + step,
			);
		} else if (matchesKey(data, "up"))
			this.offsetY = Math.max(0, this.offsetY - 1);
		else if (matchesKey(data, "down")) {
			this.offsetY = Math.min(
				Math.max(0, this.lines.length - this.viewportHeight),
				this.offsetY + 1,
			);
		} else {
			return;
		}

		this.tui.requestRender();
	}

	invalidate(): void {}
}
