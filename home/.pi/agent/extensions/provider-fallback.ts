import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface ModelEntry {
	provider: string;
	model: string;
}

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

export default function (pi: ExtensionAPI) {
	let fallbackAttempted = false;

	pi.on("message_end", async (event, ctx) => {
		const msg = event.message;
		const provider = (msg as any).provider;
		const model = (msg as any).model;

		if (msg.role !== "assistant") return;
		if (msg.stopReason !== "error") return;

		const modelChain = loadModelChain();
		const chainIndex = modelChain.findIndex(
			(e) => e.provider === provider && e.model === model,
		);
		if (chainIndex === -1) return;

		if (chainIndex === 0) {
			if (modelChain.length < 2) return;

			const primary = modelChain[0];
			const next = modelChain[1];
			const fallbackModel = ctx.modelRegistry.find(next.provider, next.model);

			if (!fallbackModel) {
				ctx.ui.notify(
					`Fallback model ${next.provider}/${next.model} not found in registry.`,
					"error",
				);
				return;
			}

			const ok = await pi.setModel(fallbackModel);
			if (!ok) {
				ctx.ui.notify(
					`Could not switch to ${next.provider}/${next.model} (no API key).`,
					"error",
				);
				return;
			}

			fallbackAttempted = true;
			ctx.ui.notify(
				`⚠️ ${primary.provider}/${primary.model} failed. Switched to ${next.provider}/${next.model}.`,
				"warning",
			);
			sendSessionMessage(
				pi,
				`⚠️ Request to ${primary.provider}/${primary.model} failed. Switched to ${next.provider}/${next.model}. You can continue your conversation with the fallback model.`,
			);
			return;
		}

		if (chainIndex > 0 && fallbackAttempted) {
			ctx.ui.notify(
				`⚠️ Fallback also failed. No more fallbacks available.`,
				"error",
			);
			sendSessionMessage(
				pi,
				`⚠️ Fallback model also failed. No more fallbacks configured.`,
			);
		}
	});
}
