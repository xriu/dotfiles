import type { AgentGateConfig } from "./config.js";

export interface AgentGateDecision {
	decision: "allow" | "deny";
	reason: string;
}

/** Strip pi provider prefix (e.g. "lm-openrouter/" → ""). */
function normalizeModel(model: string): string {
	return model.replace(/^lm-[^/]+\//, "");
}

/** Ensure the base URL ends with /v1. */
function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "") + "/v1";
}

/** Resolve an apiKey that may contain $ENV_VAR references ($VAR or ${VAR}). */
function resolveApiKey(raw: string): string {
	return raw.replace(
		/\$\{(\w+)\}|\$(\w+)/g,
		(_match, braced: string | undefined, plain: string | undefined) => {
			return process.env[braced ?? plain ?? ""] ?? "";
		},
	);
}

/**
 * Ask the AI agent to decide whether a command should be allowed.
 * Returns a decision or null on error (caller should fall back to user prompt).
 */
export async function askAgent(
	config: AgentGateConfig,
	command: string,
	description: string,
	signal?: AbortSignal,
): Promise<AgentGateDecision | null> {
	const apiKey = resolveApiKey(config.apiKey);
	if (!apiKey) {
		return null;
	}

	const model = normalizeModel(config.model);
	const baseUrl = normalizeBaseUrl(config.baseUrl);

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
	const abort = () => controller.abort();

	// Forward external abort signal.
	if (signal) {
		if (signal.aborted) controller.abort();
		else signal.addEventListener("abort", abort, { once: true });
	}

	try {
		const response = await fetch(`${baseUrl}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				max_tokens: config.maxTokens,
				temperature: 0,
				messages: [
					{
						role: "system",
						content: config.systemPrompt,
					},
					{
						role: "user",
						content: `Command: ${command}\nDescription: ${description}\n\nAllow or deny?`,
					},
				],
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			return null;
		}

		const body = (await response.json()) as {
			choices?: Array<{
				message?: { content?: string; reasoning?: string };
			}>;
		};
		const message = body.choices?.[0]?.message;
		// Reasoning models put output in reasoning, not content
		const rawText = message?.content || message?.reasoning || "";
		const text = rawText.trim().toLowerCase();

		return parseDecision(text);
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener("abort", abort);
	}
}

function parseDecision(text: string): AgentGateDecision | null {
	const trimmed = text.trim();
	const match = trimmed.match(/^(allow|deny)\b[:\s-]*(.*)$/i);
	if (!match) return null;

	return {
		decision: match[1].toLowerCase() as "allow" | "deny",
		reason: match[2].trim() || "no reason given",
	};
}
