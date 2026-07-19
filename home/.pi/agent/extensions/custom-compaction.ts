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

import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { complete } from "@earendil-works/pi-ai/compat";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
	convertToLlm,
	serializeConversation,
} from "@earendil-works/pi-coding-agent";

/** Sanitize a string for use in a filename. */
function sanitizeFilename(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
}

/** Remove credentials that the model may have copied into its response. */
function redactSensitiveContent(
	text: string,
	secrets: readonly string[],
): string {
	let redacted = text;
	for (const secret of secrets) {
		if (secret) redacted = redacted.split(secret).join("[REDACTED]");
	}
	return redacted
		.replace(/\bBearer\s+[^\s,;]+/gi, "Bearer [REDACTED]")
		.replace(
			/((?:["']?(?:x-)?api[_-]?key|authorization|cookie|password|secret|token)["']?\s*[:=]\s*["']?)[^\s,;"']+/gi,
			"$1[REDACTED]",
		)
		.replace(
			/([?&](?:api[_-]?key|access[_-]?token|authorization|token|secret|password)=)[^&#\s]+/gi,
			"$1[REDACTED]",
		)
		.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED]");
}

export default function (pi: ExtensionAPI) {
	pi.on("session_before_compact", async (event, ctx) => {
		ctx.ui.notify("Handoff compaction extension triggered", "info");

		const { preparation, signal } = event;
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

		if (signal.aborted) return;

		let auth: Awaited<ReturnType<typeof ctx.modelRegistry.getApiKeyAndHeaders>>;
		try {
			auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
		} catch (error) {
			if (!signal.aborted) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Compaction auth failed: ${message}`, "warning");
			}
			return;
		}
		if (!auth.ok) {
			if (!signal.aborted) {
				ctx.ui.notify(`Compaction auth failed: ${auth.error}`, "warning");
			}
			return;
		}
		const allMessages = [...messagesToSummarize, ...turnPrefixMessages];

		// Build artifact references from fileOps (already extracted by the framework)
		const readFiles = [...fileOps.read].filter(
			(f) => !fileOps.written.has(f) && !fileOps.edited.has(f),
		);
		const modifiedFiles = [...new Set([...fileOps.written, ...fileOps.edited])];

		let artifactSection = "";
		if (readFiles.length > 0 || modifiedFiles.length > 0) {
			const sections = ["### Artifact References"];
			if (readFiles.length > 0) {
				sections.push(
					`\n**Files read (not modified):**\n${readFiles.map((f) => `- \`${f}\``).join("\n")}`,
				);
			}
			if (modifiedFiles.length > 0) {
				sections.push(
					`\n**Files modified:**\n${modifiedFiles.map((f) => `- \`${f}\``).join("\n")}`,
				);
			}
			artifactSection = sections.join("\n");
		}

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

		let handoffPath: string | undefined;

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

			if (signal.aborted || response.stopReason !== "stop") return;

			const authSecrets = [
				auth.apiKey,
				...Object.entries(auth.headers ?? {}).flatMap(([name, value]) =>
					/authorization|api[-_]key|token|secret|password|cookie/i.test(name)
						? [value]
						: [],
				),
				...Object.entries(auth.env ?? {}).flatMap(([name, value]) =>
					/key|token|secret|password|credential|auth|cookie/i.test(name)
						? [value]
						: [],
				),
			].filter((secret): secret is string => Boolean(secret));
			const fullText = redactSensitiveContent(
				response.content
					.flatMap((content) => (content.type === "text" ? [content.text] : []))
					.join("\n"),
				authSecrets,
			);

			if (!fullText.trim()) {
				if (!signal.aborted)
					ctx.ui.notify(
						"Handoff compaction summary was empty, using default",
						"warning",
					);
				return;
			}

			// Split the response into condensed summary and handoff document
			const sections = fullText.match(
				/^\s*## Condensed Summary[ \t]*\r?\n([\s\S]*?)\r?\n## Handoff Document[ \t]*\r?\n([\s\S]*)$/,
			);
			if (!sections?.[1]?.trim() || !sections[2]?.trim()) {
				if (!signal.aborted) {
					ctx.ui.notify(
						"Handoff compaction response had an invalid format, using default",
						"warning",
					);
				}
				return;
			}

			const condensedSummary = sections[1].trim();
			const handoffDoc = sections[2].trim();

			// Save the full handoff document to OS temp directory
			const sessionId = ctx.sessionManager.getSessionId();
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `handoff-${sanitizeFilename(sessionId)}-${timestamp}-${randomUUID()}.md`;
			handoffPath = join(tmpdir(), filename);

			if (signal.aborted) return;
			await writeFile(handoffPath, `# Handoff Document\n\n${handoffDoc}\n`, {
				encoding: "utf-8",
				mode: 0o600,
				flag: "wx",
			});
			if (signal.aborted) {
				await unlink(handoffPath).catch(() => undefined);
				return;
			}
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
			const errorCode =
				error instanceof Error && "code" in error ? error.code : undefined;
			if (handoffPath && errorCode !== "EEXIST") {
				await unlink(handoffPath).catch(() => undefined);
			}
			if (!signal.aborted) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Handoff compaction failed: ${message}`, "error");
			}
			return;
		}
	});
}
