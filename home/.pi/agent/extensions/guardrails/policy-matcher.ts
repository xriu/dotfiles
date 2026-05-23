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

/** Resolve a pattern to an absolute path, expanding ~ and relative paths. */
function expandPattern(pattern: string, cwd: string): string {
	if (pattern.startsWith("~")) {
		const rest = pattern.slice(1);
		// Only expand ~ when followed by / or nothing (valid homedir syntax).
		// ~foo (username expansion) is NOT valid here — treat as relative path.
		if (rest === "" || rest.startsWith(path.sep)) {
			const remainder = rest.startsWith(path.sep) ? rest.slice(1) : "";
			return path.join(os.homedir(), remainder);
		}
	}
	if (!path.isAbsolute(pattern)) {
		return path.resolve(cwd, pattern);
	}
	return pattern;
}

/** Check if an expanded /** pattern matches as a directory prefix. */
function matchDirectoryPrefix(expanded: string, absolutePath: string): boolean {
	if (!expanded.endsWith(`${path.sep}**`) && !expanded.endsWith("/**")) {
		return false;
	}
	const dir = expanded.replace(/[\\/]\*\*$/, "");
	return absolutePath === dir || absolutePath.startsWith(dir + path.sep);
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
	const expanded = expandPattern(pattern, cwd);

	// Directory prefix patterns (ending with /**)
	if (matchDirectoryPrefix(expanded, absolutePath)) {
		return true;
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

	const expanded = expandPattern(pattern, cwd);

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
	if (matchDirectoryPrefix(expanded, absolutePath)) {
		return true;
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
	// Use null-byte placeholders so ** doesn't get eaten by the * pass
	const DOUBLE = "\x00\x00";
	const SINGLE = "\x01";

	const regex = pattern
		.replace(/\*\*/g, DOUBLE)
		.replace(/\*/g, SINGLE)
		.replace(/[.+^${}()|[\]\\]/g, "\\$&")
		.replace(new RegExp(SINGLE, "g"), "([^/]*)")
		.replace(new RegExp(DOUBLE, "g"), "(.*)")
		.replace(/\?/g, "([^/])");
	return new RegExp(`^${regex}$`).test(text);
}
