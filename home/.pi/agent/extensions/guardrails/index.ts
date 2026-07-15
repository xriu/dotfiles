import type {
	ExtensionAPI,
	ToolCallContext,
	ToolCallEvent,
} from "@earendil-works/pi-coding-agent";
import { GuardrailsCommand } from "./command.js";
import { loadConfig } from "./config.js";
import { Interceptor } from "./interceptor.js";
import { SessionLifecycle } from "./session-lifecycle.js";
import { GuardrailsState } from "./state.js";

export default function (pi: ExtensionAPI) {
	const state = new GuardrailsState();
	const sessionLifecycle = new SessionLifecycle(state, loadConfig);
	const interceptor = new Interceptor(state);
	const command = new GuardrailsCommand(state);

	pi.on("session_start", () => sessionLifecycle.onSessionStart());
	pi.on("before_agent_start", () => sessionLifecycle.onBeforeAgentStart());
	pi.on("tool_call", (event: ToolCallEvent, ctx: ToolCallContext) =>
		interceptor.handle(event, ctx),
	);
	pi.registerCommand("guardrails", {
		description: "Guardrails extension status and control",
		handler: (
			args: string | undefined,
			ctx: { ui: { notify: (msg: string, level: string) => void } },
		) => command.handle(args, ctx),
	});
}
