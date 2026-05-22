import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { GuardrailsConfig, PolicyRule } from "./config.js";

export interface MatchResult {
	ruleId: string;
	protection: "noAccess" | "readOnly";
	reason: string;
}

export interface MatchPathOptions {
	existsSync?: (p: string) => boolean;
}

/** Check if a path is in the global allowedPaths whitelist.
 * Unlike policy patterns, allowedPaths use exact matching for non-glob paths
 * to avoid accidentally whitelisting directory contents when a file is intended.
 */
function isPathAllowed(
	absolutePath: string,
	config: GuardrailsConfig,
	cwd: string,
): boolean {
	return config.pathAccess.allowedPaths.some((ap) =>
		allowedPathMatches(ap.pattern, absolutePath, cwd),
	);
}

/** Match an allowedPath pattern against an absolute path.
 * Uses exact matching for non-glob patterns (no accidental directory prefix expansion).
 */
function allowedPathMatches(
	pattern: string,
	absolutePath: string,
	cwd: string,
): boolean {
	// Expand ~ to homedir
	let expanded = pattern;
	if (pattern.startsWith("~")) {
		const rest = pattern.slice(1);
		const remainder = rest.startsWith(path.sep) ? rest.slice(1) : rest;
		expanded = path.join(os.homedir(), remainder);
	} else if (!path.isAbsolute(pattern)) {
		expanded = path.resolve(cwd, pattern);
	}

	// Directory prefix patterns (ending with /**)
	if (expanded.endsWith(`${path.sep}**`) || expanded.endsWith("/**")) {
		const dir = expanded.replace(/[\\/]\*\*$/, "");
		return absolutePath === dir || absolutePath.startsWith(dir + path.sep);
	}

	// Patterns with glob chars — glob match against full path
	if (expanded.includes("*") || expanded.includes("?")) {
		return globMatch(expanded, absolutePath);
	}

	// No glob chars, no /** — exact match only
	return absolutePath === expanded;
}

export function matchPath(
	absolutePath: string,
	config: GuardrailsConfig,
	cwd: string,
	opts?: MatchPathOptions,
): MatchResult | null {
	// Check allowedPaths global whitelist first
	if (isPathAllowed(absolutePath, config, cwd)) {
		return null;
	}

	for (const rule of config.policies.rules) {
		if (ruleMatchesPath(rule, absolutePath, cwd, opts)) {
			return {
				ruleId: rule.id,
				protection: rule.protection,
				reason: rule.description,
			};
		}
	}
	return null;
}

function ruleMatchesPath(
	rule: PolicyRule,
	absolutePath: string,
	cwd: string,
	opts?: MatchPathOptions,
): boolean {
	const exists = opts?.existsSync ?? fs.existsSync;

	// onlyIfExists check
	if (rule.onlyIfExists && !exists(absolutePath)) {
		return false;
	}

	for (const pat of rule.patterns) {
		if (patternMatchesPath(pat.pattern, absolutePath, cwd)) {
			// Check allowedPatterns exemption
			if (
				rule.allowedPatterns?.some((ap) =>
					patternMatchesPath(ap.pattern, absolutePath, cwd),
				)
			) {
				continue;
			}
			return true;
		}
	}
	return false;
}

function patternMatchesPath(
	pattern: string,
	absolutePath: string,
	cwd: string,
): boolean {
	// Track original pattern characteristics before resolution
	const isSimpleName =
		!pattern.includes("*") &&
		!pattern.includes("?") &&
		!pattern.includes("/") &&
		!pattern.startsWith("~");
	// Filename pattern: no separators in original (glob chars OK)
	const isFilenamePattern =
		!pattern.includes("/") &&
		!pattern.startsWith("~") &&
		!pattern.includes("\\");

	// Expand ~ to homedir
	let expanded = pattern;
	if (pattern.startsWith("~")) {
		const rest = pattern.slice(1);
		// Handle ~/ prefix (not just ~)
		const remainder = rest.startsWith(path.sep) ? rest.slice(1) : rest;
		expanded = path.join(os.homedir(), remainder);
	} else if (!path.isAbsolute(pattern)) {
		// Resolve relative to cwd
		expanded = path.resolve(cwd, pattern);
	}

	// Simple name (no glob chars, no separator in original) — match any path component
	if (isSimpleName) {
		const components = absolutePath.split(path.sep);
		return components.includes(pattern);
	}

	// Filename pattern (no path separator in original) — match against basename only
	if (isFilenamePattern) {
		const basename = path.basename(absolutePath);
		return globMatch(pattern, basename);
	}

	// Directory prefix patterns (ending with /**)
	if (expanded.endsWith(`${path.sep}**`) || expanded.endsWith("/**")) {
		const dir = expanded.replace(/[\\/]\*\*$/, "");
		return absolutePath === dir || absolutePath.startsWith(dir + path.sep);
	}

	// Full path pattern with no glob chars — treat as directory prefix (match dir and contents)
	if (!expanded.includes("*") && !expanded.includes("?")) {
		return (
			absolutePath === expanded || absolutePath.startsWith(expanded + path.sep)
		);
	}

	// Full path pattern with glob chars — match against full path
	return globMatch(expanded, absolutePath);
}

function globMatch(pattern: string, text: string): boolean {
	// Convert glob pattern to regex
	const regex = pattern
		.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
		.replace(/\*\*/g, "(.*)")
		.replace(/\*/g, "([^/]*)")
		.replace(/\?/g, "([^/])");
	return new RegExp(`^${regex}$`).test(text);
}
