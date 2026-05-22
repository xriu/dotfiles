/**
 * Extracts file-like paths from bash command strings.
 * Matches tokens starting with `/`, `~`, `./`, `../`,
 * including single- and double-quoted paths.
 */
export function extractPaths(command: string): string[] {
	const paths: string[] = [];

	// Single-pass combined regex — preserves source order
	// Group 1: double-quoted paths
	// Group 2: single-quoted paths
	// Group 3: bare (unquoted) paths
	const combinedRe =
		/"([\/][^"]*|~[^"]*|\.[\/][^"]*|\.\.[\/][^"]*)"|'([\/][^']*|~[^']*|\.[\/][^']*|\.\.[\/][^']*)'|([\/][^\s'"]+|~[^\s'"]*|\.[\/][^\s'"]*|\.\.[\/][^\s'"]*)/g;

	let m: RegExpExecArray | null;
	while ((m = combinedRe.exec(command)) !== null) {
		paths.push(m[1] ?? m[2] ?? m[3]);
	}

	return paths;
}
