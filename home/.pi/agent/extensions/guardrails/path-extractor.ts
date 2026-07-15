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
		/"([/][^"]*|~[^"]*|\.[/][^"]*|\.\.[/][^"]*)"|'([/][^']*|~[^']*|\.[/][^']*|\.\.[/][^']*)'|([/][^\s'"]+|~[^\s'"]*|\.[/][^\s'"]*|\.\.[/][^\s'"]*)/g;

	for (
		let match = combinedRe.exec(command);
		match !== null;
		match = combinedRe.exec(command)
	) {
		paths.push(match[1] ?? match[2] ?? match[3]);
	}

	return paths;
}
