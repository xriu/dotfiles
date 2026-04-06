import { homedir } from "node:os";
import { basename, normalize, relative, resolve, sep } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Protects common secret locations from accidental reads/writes.
 *
 * Recommended defaults:
 * - Project secrets: .env, .env.*, secrets/, private/, credentials/, certs/
 * - User secrets: ~/.ssh, ~/.aws, ~/.gnupg, ~/.config/gcloud, ~/.npmrc, ~/.docker/config.json
 * - Writes also blocked for: .git/, node_modules/
 *
 * Install globally:
 *   ~/.pi/agent/extensions/protect-sensitive-paths.ts
 *
 * Or per project:
 *   .pi/extensions/protect-sensitive-paths.ts
 *
 * Then run /reload (or restart pi).
 */
export default function (pi: ExtensionAPI) {
	const home = homedir();

	const blockedReadRoots = [
		".env",
		"config.toml",
		".git-credentials",
		".npmrc",
		"secrets",
		"private",
		"credentials",
		"certs",
		resolve(home, ".ssh"),
		resolve(home, ".aws"),
		resolve(home, ".gnupg"),
		resolve(home, ".config", "gcloud"),
		resolve(home, ".docker", "config.json"),
		resolve(home, ".npmrc"),
	];

	const blockedWriteRoots = [...blockedReadRoots, ".git", "node_modules"];

	const blockedExtensions = [".pem", ".key", ".p12", ".pfx", ".crt"];

	const bashSensitivePatterns = [
		/(^|\s)(cat|less|more|head|tail|grep|rg|sed|awk|find|ls|cp|mv)\s+.*(^|\s)(\.env(\.[^\s/]+)?)(\s|$)/,
		/(^|\s)(cat|less|more|head|tail|grep|rg|sed|awk|find|ls|cp|mv)\s+.*(^|\s)(config\.toml)(\s|$)/,
		/(^|\s)(cat|less|more|head|tail|grep|rg|sed|awk|find|ls|cp|mv)\s+.*(~\/\.ssh|\$HOME\/\.ssh|\/\.ssh\/)/,
		/(^|\s)(cat|less|more|head|tail|grep|rg|sed|awk|find|ls|cp|mv)\s+.*(~\/\.aws|\$HOME\/\.aws|\/\.aws\/)/,
		/(^|\s)(cat|less|more|head|tail|grep|rg|sed|awk|find|ls|cp|mv)\s+.*(~\/\.gnupg|\$HOME\/\.gnupg|\/\.gnupg\/)/,
		/(^|\s)(cat|less|more|head|tail|grep|rg|sed|awk|find|ls|cp|mv)\s+.*(secrets\/|private\/|credentials\/|certs\/|\.npmrc|\.git-credentials|\.docker\/config\.json)/,
		/(^|\s)(cat|less|more|head|tail|grep|rg|sed|awk|find|ls|cp|mv)\s+.*\.(pem|key|p12|pfx|crt)(\s|$)/,
	];

	function stripAtPrefix(rawPath: string) {
		return rawPath.startsWith("@") ? rawPath.slice(1) : rawPath;
	}

	function resolvePath(rawPath: string, cwd: string) {
		const cleaned = stripAtPrefix(rawPath).trim();
		if (!cleaned) return undefined;
		if (cleaned.startsWith("~/"))
			return normalize(resolve(home, cleaned.slice(2)));
		if (cleaned.startsWith("$HOME/"))
			return normalize(resolve(home, cleaned.slice(6)));
		return normalize(resolve(cwd, cleaned));
	}

	function isWithin(target: string, root: string) {
		const rel = relative(root, target);
		return rel === "" || (!rel.startsWith("..") && !rel.includes(`..${sep}`));
	}

	function matchesRoot(target: string, cwd: string, root: string) {
		const absoluteRoot = root.startsWith("/")
			? normalize(root)
			: normalize(resolve(cwd, root));
		return isWithin(target, absoluteRoot);
	}

	function isSensitivePath(
		rawPath: string,
		cwd: string,
		mode: "read" | "write",
	) {
		const target = resolvePath(rawPath, cwd);
		if (!target) return false;

		const name = basename(target);
		if (name === ".env" || name.startsWith(".env.")) return true;
		if (name === "config.toml") return true;
		if (blockedExtensions.some((ext) => name.endsWith(ext))) return true;

		const roots = mode === "read" ? blockedReadRoots : blockedWriteRoots;
		return roots.some((root) => matchesRoot(target, cwd, root));
	}

	pi.on("tool_call", async (event, ctx) => {
		if (
			(event.toolName === "read" ||
				event.toolName === "edit" ||
				event.toolName === "write") &&
			typeof event.input.path === "string"
		) {
			const mode = event.toolName === "read" ? "read" : "write";
			if (isSensitivePath(event.input.path, ctx.cwd, mode)) {
				return {
					block: true,
					reason: `${event.toolName} blocked for sensitive path: ${event.input.path}`,
				};
			}
		}

		if (event.toolName === "bash" && typeof event.input.command === "string") {
			const command = event.input.command;
			if (bashSensitivePatterns.some((pattern) => pattern.test(command))) {
				return {
					block: true,
					reason:
						"bash blocked because command appears to access a protected secret path",
				};
			}
		}

		return undefined;
	});
}
