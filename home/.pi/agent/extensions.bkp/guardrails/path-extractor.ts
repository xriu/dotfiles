/**
 * Extracts file-like paths from bash command strings.
 * Matches absolute, home-relative, relative, dotfile, and nested paths,
 * including single- and double-quoted paths. Bare sensitive filenames are
 * included so policies can protect `.env` and certificate files.
 */
export function extractPaths(command: string): string[] {
	const paths: string[] = [];
	const tokenRe = /"([^"]*)"|'([^']*)'|([^\s]+)/g;

	for (
		let match = tokenRe.exec(command);
		match !== null;
		match = tokenRe.exec(command)
	) {
		const token = match[1] ?? match[2] ?? match[3];
		const pathToken = token
			.replace(/^\d*[<>]/, "")
			.replace(/^[;,&|<>]+|[;,|]+$/g, "")
			.replace(/^(['"])(.*)\1$/, "$2");
		const optionValue =
			pathToken.match(/^--?[A-Za-z0-9_-]+=(.+)$/)?.[1] ?? pathToken;
		if (isPathLike(optionValue)) paths.push(optionValue);
	}

	return paths;
}

function isPathLike(token: string): boolean {
	if (!token || token.startsWith("-")) return false;
	if (/^(?:\/|~\/|\.\.?\/|\.)/.test(token)) return true;
	if (token.includes("/")) return true;
	if (
		/\.(?:env|pem|key|p12|pfx|crt)$/.test(token) ||
		token === ".env" ||
		token.startsWith(".env.")
	) {
		return true;
	}
	return [
		".env",
		"local.env",
		".dev.vars",
		".git-credentials",
		".npmrc",
		"secrets",
		"private",
		"credentials",
		"certs",
		"node_modules",
	].includes(token);
}
