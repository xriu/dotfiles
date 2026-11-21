import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

function agent(name) {
	const text = readFileSync(`${import.meta.dir}/agents/${name}.md`, "utf8");
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
	if (!match) throw new Error(`Invalid agent definition: ${name}`);
	return { settings: Bun.YAML.parse(match[1]), prompt: match[2].trim() };
}

function override(name) {
	return Bun.YAML.parse(
		readFileSync(`${import.meta.dir}/agents/${name}.yml`, "utf8"),
	);
}

test("panel workers use different models with the same instructions and tools", () => {
	const deepseek = agent("poteto");
	const terra = agent("peer");
	const gemini = agent("peer-gemini");
	expect(deepseek.settings.name).toBe("poteto");
	expect(terra.settings.name).toBe("peer");
	expect(gemini.settings.name).toBe("peer-gemini");
	expect(deepseek.settings.thinkingLevel).toBe("max");
	expect(terra.settings.thinkingLevel).toBe("xhigh");
	expect(gemini.settings.thinkingLevel).toBe("xhigh");
	expect(deepseek.settings.models?.length).toBeGreaterThan(0);
	expect(terra.settings.models?.length).toBeGreaterThan(0);
	expect(gemini.settings.models?.length).toBeGreaterThan(0);
	for (const model of deepseek.settings.models)
		expect(model).toMatch(/deepseek/i);
	for (const model of terra.settings.models)
		expect(model).toMatch(/openai|gpt/i);
	for (const model of gemini.settings.models) expect(model).toMatch(/gemini/i);
	expect(
		new Set([
			deepseek.settings.models[0],
			terra.settings.models[0],
			gemini.settings.models[0],
		]).size,
	).toBe(3);
	expect(terra.settings.tools).toEqual(deepseek.settings.tools);
	expect(gemini.settings.tools).toEqual(deepseek.settings.tools);
	expect(terra.settings.tools.allow).toContain("edit");
	expect(terra.settings.tools.allow).toContain("write");
	expect(terra.settings.tools.allow).not.toContain("agent_spawn");
	expect(terra.settings.tools.block ?? []).not.toContain("edit");
	expect(terra.settings.tools.block ?? []).not.toContain("write");
	expect(deepseek.prompt).toContain(
		"$HOME/.agents/skills/poteto-mode/worker.md",
	);
	expect(deepseek.prompt).toContain(
		"$HOME/.agents/skills/poteto-mode/SKILL.md",
	);
	expect(terra.prompt).toBe(deepseek.prompt);
	expect(gemini.prompt).toBe(deepseek.prompt);
});

test("both judge models use the same read-only tools and instructions", () => {
	const deepseek = agent("judge-deepseek");
	const terra = agent("judge-terra");
	expect(deepseek.settings.name).toBe("judge-deepseek");
	expect(terra.settings.name).toBe("judge-terra");
	expect(deepseek.settings.thinkingLevel).toBe("high");
	expect(terra.settings.thinkingLevel).toBe("high");
	expect(deepseek.settings.models?.length).toBeGreaterThan(0);
	expect(terra.settings.models?.length).toBeGreaterThan(0);
	for (const model of deepseek.settings.models)
		expect(model).toMatch(/deepseek/i);
	for (const model of terra.settings.models)
		expect(model).toMatch(/openai|gpt/i);
	expect(terra.settings.models[0]).not.toBe(deepseek.settings.models[0]);
	expect(deepseek.settings.tools.allow).toEqual([
		"read",
		"grep",
		"find",
		"ls",
		"agent_update",
		"agent_pause",
	]);
	expect(terra.settings.tools).toEqual(deepseek.settings.tools);
	expect(terra.prompt).toBe(deepseek.prompt);
});

test("role policies allow coordination and restrict researcher tools", () => {
	const settings = JSON.parse(
		readFileSync(`${import.meta.dir}/settings.json`, "utf8"),
	);
	const architect = override("architect");
	const researcher = override("researcher");
	expect(settings.toolFiltering).toBe("allowed");
	expect(architect.tools.allow).toContain("agent_spawn");
	expect(architect.tools.allow).toContain("agent_wait");
	expect(architect.tools.block ?? []).not.toContain("agent_spawn");
	expect(architect.tools.block ?? []).not.toContain("agent_wait");
	expect(researcher.tools.allow).toContain("read");
	expect(researcher.tools.allow).not.toContain("edit");
	expect(researcher.tools.allow).not.toContain("write");
	expect(researcher.tools.allow).not.toContain("agent_spawn");
	expect(architect.thinkingLevel).toBe("max");
	expect(override("coder").thinkingLevel).toBe("max");
	expect(researcher.thinkingLevel).toBe("max");
	expect(override("tasker").thinkingLevel).toBe("high");
	expect(override("reviewer").thinkingLevel).toBe("high");
	expect(override("writer").thinkingLevel).toBe("high");
});
