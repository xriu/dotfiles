/**
 * Minimal type stubs for pi-coding-agent types needed by ralph-wiggum tests.
 * These match the subset of the real ExtensionContext interface used by the orchestrator.
 */

declare module "@earendil-works/pi-coding-agent" {
	export interface ExtensionContext {
		cwd: string;
		hasUI?: boolean;
		hasPendingMessages?: () => boolean;
		ui?: any;
	}

	export interface ExtensionAPI {
		sendUserMessage: (text: string, options?: any) => void;
		registerCommand: (name: string, config: any) => void;
		registerTool: (config: any) => void;
		on: (event: string, handler: (...args: any[]) => any) => void;
	}
}
