/**
 * Handoff Compaction Extension
 *
 * Replaces the default compaction behavior with a handoff-document approach.
 * Instead of a generic conversation summary, this extension:
 * 1. Generates a structured handoff document for another agent to pick up the work
 * 2. Saves the full handoff doc to the OS temp directory (per the handoff skill convention)
 * 3. Returns a condensed summary for inline context replacement in the session
 *
 * The handoff document includes:
 * - Goals & objectives
 * - Key decisions with rationale
 * - Current state of work
 * - Next steps (specific files and changes)
 * - Suggested skills for the next agent
 * - Artifact references (referenced by path, not duplicated)
 * - Redaction note for sensitive information
 *
 * Usage:
 *   pi --extension ~/.pi/agent/extensions/custom-compaction.ts
 */

import { complete } from "@earendil-works/pi-ai/compat";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { convertToLlm, serializeConversation } from "@earendil-works/pi-coding-agent";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Sanitize a string for use in a filename. */
function sanitizeFilename(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
}

export default function (pi: ExtensionAPI) {
	pi.on("session_before_compact", async (event, ctx) => {
		ctx.ui.notify("Handoff compaction extension triggered", "info");

		const { preparation, branchEntries: _, signal } = event;
		const {
			messagesToSummarize,
			turnPrefixMessages,
			tokensBefore,
			firstKeptEntryId,
			previousSummary,
			fileOps,
		} = preparation;

		// Use the current session model for summarization
		const model = ctx.model;
		if (!model) {
			ctx.ui.notify("No model selected, using default compaction", "warning");
			return;
		}

		const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
		if (!auth.ok) {
			ctx.ui.notify(`Compaction auth failed: ${auth.error}`, "warning");
			return;
		}
		if (!auth.apiKey) {
			ctx.ui.notify(`No API key for ${model.provider}, using default compaction`, "warning");
			return;
		}

		const allMessages = [...messagesToSummarize, ...turnPrefixMessages];

		// Build artifact references from fileOps (already extracted by the framework)
		const readFiles = [...fileOps.read].filter(
			(f) => !fileOps.written.has(f) && !fileOps.edited.has(f),
		);
		const modifiedFiles = [...new Set([...fileOps.written, ...fileOps.edited])];

		const artifactSection =
			readFiles.length > 0 || modifiedFiles.length > 0
				? [
						"### Artifact References",
						readFiles.length > 0
							? `\n**Files read (not modified):**\n${readFiles.map((f) => `- \`${f}\``).join("\n")}`
							: "",
						modifiedFiles.length > 0
							? `\n**Files modified:**\n${modifiedFiles.map((f) => `- \`${f}\``).join("\n")}`
							: "",
					].join("\n")
				: "";

		const conversationText = serializeConversation(convertToLlm(allMessages));
		const previousContext = previousSummary
			? `\n## Previous Session Summary\n${previousSummary}\n`
			: "";

		ctx.ui.notify(
			`Handoff compaction: summarizing ${allMessages.length} messages (${tokensBefore.toLocaleString()} tokens) with ${model.id}...`,
			"info",
		);

		const summaryMessages = [
			{
				role: "user" as const,
				content: [
					{
						type: "text" as const,
						text: `You are creating a handoff document for another AI agent to continue this work. Generate a structured markdown response with exactly TWO top-level sections:

## Condensed Summary
A 1-2 paragraph summary for inline context replacement. This stays in the conversation and must be token-efficient while capturing the essential state. Write in prose, not bullet points.

## Handoff Document
${previousContext}
A comprehensive handoff document with these sections:

### Goals & Objectives
What was being worked on and why.

### Key Decisions
Decisions made and their rationale. Include tradeoffs considered.

### Current State
Where the work stands right now. What's done, what's in progress.

### Next Steps
What should happen next. Be specific about files and changes needed.

### Suggested Skills
Which agent skills would be useful to continue this work (e.g., tdd, code-review, diagnosing-bugs, domain-modeling, research, grilling, prototype, codebase-design, codebase-memory).

### Blockers & Open Questions
Anything blocking progress or needing clarification.

${artifactSection}

### Redaction Note
Note any sensitive information (API keys, passwords, PII) that was redacted from this document.

**Rules:**
- Do NOT continue the conversation. Do NOT respond to any questions in the conversation. ONLY output the structured document.
- Redact any sensitive information such as API keys, passwords, or personally identifiable information. Replace with [REDACTED].
- Reference artifacts (specs, plans, ADRs, issues, commits, diffs) by path or URL — do not duplicate their content.
- Be specific about files and paths.

<conversation>
${conversationText}
</conversation>`,
					},
				],
				timestamp: Date.now(),
			},
		];

		try {
			const response = await complete(
				model,
				{ messages: summaryMessages },
				{
					apiKey: auth.apiKey,
					headers: auth.headers,
					env: auth.env,
					maxTokens: 8192,
					signal,
				},
			);

			const fullText = response.content
				.filter((c): c is { type: "text"; text: string } => c.type === "text")
				.map((c) => c.text)
				.join("\n");

			if (!fullText.trim()) {
				if (!signal.aborted)
					ctx.ui.notify("Handoff compaction summary was empty, using default", "warning");
				return;
			}

			// Split the response into condensed summary and handoff document
			const condensedMatch = fullText.match(
				/## Condensed Summary\n([\s\S]*?)(?=\n## Handoff Document)/,
			);
			const handoffMatch = fullText.match(/## Handoff Document\n([\s\S]*)/);

			const condensedSummary = condensedMatch?.[1]?.trim() || fullText.slice(0, 500);
			const handoffDoc = handoffMatch?.[1]?.trim() || fullText;

			// Save the full handoff document to OS temp directory
			const sessionName =
				ctx.sessionManager.getSessionName() || ctx.sessionManager.getSessionId();
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `handoff-${sanitizeFilename(sessionName)}-${timestamp}.md`;
			const handoffPath = join(tmpdir(), filename);

			await writeFile(
				handoffPath,
				`# Handoff Document — ${sessionName}\n\n${handoffDoc}\n`,
				"utf-8",
			);
			ctx.ui.notify(`Handoff document saved to ${handoffPath}`, "info");

			// Return condensed summary to SessionManager for context replacement.
			// The handoffPath is stored in details for potential downstream use.
			return {
				compaction: {
					summary: condensedSummary,
					firstKeptEntryId,
					tokensBefore,
					details: { handoffPath },
				},
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			ctx.ui.notify(`Handoff compaction failed: ${message}`, "error");
			return;
		}
	});
}