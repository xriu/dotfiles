import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

function agent(name) {
	const text = readFileSync(`${import.meta.dir}/agents/${name}.md`, "utf8");
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
	if (!match) throw new Error(`Invalid agent definition: ${name}`);
	return { settings: Bun.YAML.parse(match[1]), prompt: match[2].trim() };
}

test("panel workers use different models with the same instructions and tools", () => {
	const deepseek = agent("poteto");
	const terra = agent("peer");
	expect(deepseek.settings.name).toBe("poteto");
	expect(terra.settings.name).toBe("peer");
	expect(deepseek.settings.models).toEqual([
		"openrouter/~deepseek/deepseek-flash-latest",
	]);
	expect(terra.settings.models).toEqual([
		"openrouter/~openai/gpt-terra-latest",
	]);
	expect(terra.settings.thinkingLevel).toBe(deepseek.settings.thinkingLevel);
	expect(terra.settings.tools).toEqual(deepseek.settings.tools);
	expect(terra.settings.tools.allow).toContain("edit");
	expect(terra.settings.tools.allow).toContain("write");
	expect(terra.settings.tools.allow).not.toContain("agent_spawn");
	expect(terra.prompt).toBe(deepseek.prompt);
});

test("both judge models use the same read-only tools and instructions", () => {
	const deepseek = agent("judge-deepseek");
	const terra = agent("judge-terra");
	expect(deepseek.settings.name).toBe("judge-deepseek");
	expect(terra.settings.name).toBe("judge-terra");
	expect(deepseek.settings.models).toEqual([
		"openrouter/~deepseek/deepseek-flash-latest",
	]);
	expect(terra.settings.models).toEqual([
		"openrouter/~openai/gpt-terra-latest",
	]);
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
