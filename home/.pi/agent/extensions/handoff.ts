/**
 * Handoff extension - transfer context to a new focused session
 *
 * Instead of compacting (which is lossy), handoff extracts what matters
 * for your next task and creates a new session with a generated prompt.
 *
 * Usage:
 *   /handoff
 *   /handoff implement this for teams as well
 *   /handoff execute phase one of the plan
 *
 * The generated prompt appears as a draft in the editor for review/editing.
 */

import { complete, type Message } from "@earendil-works/pi-ai/compat";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	BorderedLoader,
	convertToLlm,
	serializeConversation,
	sessionEntryToContextMessages,
} from "@earendil-works/pi-coding-agent";

type HandoffResult =
	| { status: "success"; prompt: string }
	| { status: "cancelled" }
	| { status: "error"; error: unknown };

const SYSTEM_PROMPT = `Write a handoff document summarising the current conversation so a fresh agent can continue the work.

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed a goal, treat it as a description of what the next session will focus on and tailor the document accordingly. If no goal was passed, infer the next task from the current conversation and preserve the most recent user objective.

The document must be self-contained enough for a fresh agent to continue without the original conversation. Include relevant context, decisions, key findings, files discussed or modified, and the next task. Be concise and output only the handoff document, without any preamble.`;

export default function (pi: ExtensionAPI) {
	pi.registerCommand("handoff", {
		description: "Transfer context to a new focused session",
		handler: async (args, ctx) => {
			if (ctx.mode !== "tui") {
				ctx.ui.notify("handoff requires interactive mode", "error");
				return;
			}

			const model = ctx.model;
			if (!model) {
				ctx.ui.notify("No model selected", "error");
				return;
			}

			const goal = args.trim();

			// Use pi's resolved context so compaction, branches, and extension messages
			// are represented exactly as they are in the active session.
			const messages = ctx.sessionManager
				.buildContextEntries()
				.flatMap(sessionEntryToContextMessages);

			if (messages.length === 0) {
				ctx.ui.notify("No conversation to hand off", "error");
				return;
			}

			const conversationText = serializeConversation(convertToLlm(messages));
			const currentSessionFile = ctx.sessionManager.getSessionFile();

			// Generate the handoff prompt with loader UI
			const result = await ctx.ui.custom<HandoffResult>(
				(tui, theme, _kb, done) => {
					let completed = false;
					const finish = (value: HandoffResult) => {
						if (completed) return;
						completed = true;
						done(value);
					};
					const loader = new BorderedLoader(
						tui,
						theme,
						`Generating handoff prompt...`,
					);
					loader.onAbort = () => finish({ status: "cancelled" });

					const doGenerate = async (): Promise<HandoffResult> => {
						const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
						if (!auth.ok || !auth.apiKey) {
							throw new Error(
								auth.ok ? `No API key for ${model.provider}` : auth.error,
							);
						}

						const userMessage: Message = {
							role: "user",
							content: [
								{
									type: "text",
									text: `## Conversation History\n\n${conversationText}${goal ? `\n\n## User's Goal for New Thread\n\n${goal}` : ""}`,
								},
							],
							timestamp: Date.now(),
						};

						const response = await complete(
							model,
							{ systemPrompt: SYSTEM_PROMPT, messages: [userMessage] },
							{
								apiKey: auth.apiKey,
								headers: auth.headers,
								env: auth.env,
								signal: loader.signal,
							},
						);

						if (response.stopReason === "aborted") {
							return { status: "cancelled" };
						}

						const prompt = response.content
							.flatMap((content) =>
								content.type === "text" ? [content.text] : [],
							)
							.join("\n")
							.trim();
						if (!prompt) {
							throw new Error("Model returned an empty handoff prompt");
						}
						return { status: "success", prompt };
					};

					doGenerate()
						.then(finish)
						.catch((error) =>
							finish(
								loader.signal.aborted
									? { status: "cancelled" }
									: { status: "error", error },
							),
						);

					return loader;
				},
			);

			if (result.status === "cancelled") {
				ctx.ui.notify("Cancelled", "info");
				return;
			}
			if (result.status === "error") {
				const message =
					result.error instanceof Error
						? result.error.message
						: String(result.error);
				ctx.ui.notify(`Handoff generation failed: ${message}`, "error");
				return;
			}

			// Let user edit the generated prompt
			const editedPrompt = await ctx.ui.editor(
				"Edit handoff prompt",
				result.prompt,
			);

			if (editedPrompt === undefined) {
				ctx.ui.notify("Cancelled", "info");
				return;
			}

			// Create new session with parent tracking. Use the replacement-session
			// context for post-switch UI work; the original ctx is stale after a
			// successful session replacement.
			const newSessionResult = await ctx.newSession({
				...(currentSessionFile ? { parentSession: currentSessionFile } : {}),
				withSession: async (replacementCtx) => {
					replacementCtx.ui.setEditorText(editedPrompt);
					replacementCtx.ui.notify("Handoff ready. Submit when ready.", "info");
				},
			});

			if (newSessionResult.cancelled) {
				ctx.ui.notify("New session cancelled", "info");
			}
		},
	});
}
