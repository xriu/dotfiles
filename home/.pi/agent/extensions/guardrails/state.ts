import type { GuardrailsConfig } from "./config.js";

export class GuardrailsState {
	config: GuardrailsConfig | null = null;
	configError: string | null = null;
	denialCount = 0;
	awarenessSent = false;
}
