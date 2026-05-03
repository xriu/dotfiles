import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface ModelEntry {
	provider: string;
	model: string;
}

const errorStatuses = [429, 500, 502, 503];

function sendSessionMessage(pi: ExtensionAPI, content: string) {
	pi.sendMessage(
		{ customType: "provider-fallback", content, display: true },
		{ deliverAs: "nextTurn" },
	);
}

function loadModelChain(): ModelEntry[] {
	const piDir = join(homedir(), ".pi", "agent");

	let profileName = "synthetic";
	try {
		const state = JSON.parse(
			readFileSync(join(piDir, "agent-profile-state.json"), "utf-8"),
		);
		profileName = state.activeProfile;
	} catch {
		// default to synthetic
	}

	try {
		const profiles = JSON.parse(
			readFileSync(join(piDir, "agent-profiles.json"), "utf-8"),
		);
		const main = profiles.profiles?.[profileName]?.main;
		if (!main) return [];
		return Array.isArray(main) ? main : [main];
	} catch {
		return [];
	}
}

const modelChain = loadModelChain();

export default function (pi: ExtensionAPI) {
	let errorStatus: number | null = null;
	let fallbackAttempted = false;

	pi.on("after_provider_response", (event) => {
		if (errorStatuses.includes(event.status)) {
			errorStatus = event.status;
		}
	});

	pi.on("message_end", async (event, ctx) => {
		const msg = event.message;
		if (msg.role !== "assistant") return;

		const isModelError = msg.stopReason === "error";
		if (!isModelError && !errorStatus) return;

		const actualStatus = errorStatus ?? 0;
		errorStatus = null;

		// Find this model in the priority chain
		const chainIndex = modelChain.findIndex(
			(e) => e.provider === msg.provider && e.model === msg.model,
		);
		if (chainIndex === -1) return;

		// Primary model failed — try next fallback
		if (chainIndex === 0) {
			if (modelChain.length < 2) return;

			const next = modelChain[1];
			const fallbackModel = ctx.modelRegistry.find(next.provider, next.model);

			if (!fallbackModel) {
				if (ctx.hasUI)
					ctx.ui.notify(
						`Fallback model ${next.provider}/${next.model} not found in registry.`,
						"error",
					);
				return;
			}

			const ok = await pi.setModel(fallbackModel);
			if (!ok) {
				if (ctx.hasUI)
					ctx.ui.notify(
						`Could not switch to ${next.provider}/${next.model} (no API key).`,
						"error",
					);
				return;
			}

			fallbackAttempted = true;

			const primary = modelChain[0];
			ctx.ui.notify(
				`⚠️ ${primary.provider}/${primary.model} failed (HTTP ${actualStatus}). Switched to ${next.provider}/${next.model}.`,
				"warning",
			);
			sendSessionMessage(
				pi,
				`⚠️ Request to ${primary.provider}/${primary.model} failed with HTTP ${actualStatus}. Switched to ${next.provider}/${next.model}. You can continue your conversation with the fallback model.`,
			);
			return;
		}

		// A fallback model also failed
		if (chainIndex > 0 && fallbackAttempted) {
			ctx.ui.notify(
				`⚠️ Fallback also failed (${actualStatus}). No more fallbacks available.`,
				"error",
			);
			sendSessionMessage(
				pi,
				`⚠️ Fallback model also failed with HTTP ${actualStatus}. No more fallbacks configured.`,
			);
		}
	});
}
