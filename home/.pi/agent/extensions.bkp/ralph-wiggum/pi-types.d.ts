/**
 * Minimal type stubs for pi-coding-agent types needed by ralph-wiggum tests.
 * These match the subset of the real ExtensionContext interface used by the orchestrator.
 */

declare module "@earendil-works/pi-coding-agent" {
	export interface ExtensionContext {
		cwd: string;
		hasUI?: boolean;
		ui: {
			notify(message: string, level: string): void;
			confirm(message: string, detail: string): Promise<boolean>;
			setStatus(id: string, value: string | undefined): void;
			setWidget(id: string, lines: string[] | undefined): void;
			theme: {
				fg(color: string, text: string): string;
				bold(text: string): string;
			};
		};
		isIdle(): boolean;
		hasPendingMessages(): boolean;
	}

	export interface AgentEvent {
		systemPrompt?: string;
		messages: Array<{
			role: string;
			content: Array<{ type: string; text?: string }>;
		}>;
		reason?: string;
		willRetry?: boolean;
	}

	export interface ExtensionAPI {
		sendUserMessage: (
			text: string,
			options?: { deliverAs?: string; triggerTurn?: boolean },
		) => void;
		registerCommand: (
			name: string,
			config: {
				handler: (args: string, ctx: ExtensionContext) => unknown;
				[key: string]: unknown;
			},
		) => void;
		registerTool: (config: {
			execute: (...args: any[]) => unknown;
			[key: string]: unknown;
		}) => void;
		on: (
			event: string,
			handler: (event: AgentEvent, ctx: ExtensionContext) => unknown,
		) => void;
	}
}
