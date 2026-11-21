import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Save the pi session of this Rex pane, so a restored pane can open it again.
// Only the interactive TUI saves. Subagents in rpc or print mode do not replace the record.
export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		if (!process.env.REX_BLOCK || ctx.mode !== "tui" || !ctx.sessionManager.getSessionFile()) return;
		execFile(join(homedir(), ".agents/bin/rex-resume"), [
			"save",
			"pi",
			ctx.sessionManager.getSessionId(),
			ctx.sessionManager.getCwd(),
		]);
	});
}
