/**
 * `@issue:` GitHub issues and `@pr:` GitHub PRs autocomplete provider.
 *
 * On `@issue:<token>` in the input editor, suggests open issues from the current repo.
 * On `@pr:<token>` in the input editor, suggests open PRs from the current repo.
 *
 * Accepting a completion inserts the reference (e.g. `issue owner/repo#123` or `pr owner/repo#45`).
 * A `before_agent_start` nudge tells the agent how to fetch details with `gh`.
 *
 * Issues and PRs are fetched once on session start and cached in memory.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type {
	AutocompleteItem,
	AutocompleteProvider,
	AutocompleteSuggestions,
} from "@mariozechner/pi-tui";

// --- Constants ---

const ISSUE_PREFIX = "@issue:";
const PR_PREFIX = "@pr:";

/** Match `@issue:` plus optional token at end of text before cursor. */
const ISSUE_TOKEN_RE = /@issue:([^\s@]*)$/;

/** Match `@pr:` plus optional token at end of text before cursor. */
const PR_TOKEN_RE = /@pr:([^\s@]*)$/;

const MAX_SUGGESTIONS = 20;
const DEBOUNCE_MS = 150;

// --- Types ---

interface RepoInfo {
	owner: string;
	repo: string;
	/** `owner/repo` string */
	fullName: string;
}

interface IssueInfo {
	number: number;
	title: string;
	labels: string;
	author: string;
	updatedAt: string;
}

interface PRInfo {
	number: number;
	title: string;
	author: string;
	headRefName: string;
	updatedAt: string;
	isDraft: boolean;
}

interface CachedData {
	repo: RepoInfo | null;
	issues: IssueInfo[];
	prs: PRInfo[];
}

// --- Shell helpers (use pi.exec) ---

async function fetchRepoName(
	exec: ExtensionAPI["exec"],
	cwd: string,
): Promise<RepoInfo | null> {
	const result = await exec("gh", ["repo", "view", "--json", "owner,name"], {
		cwd,
	});

	if (result.code !== 0 || !result.stdout.trim()) return null;

	try {
		const data = JSON.parse(result.stdout) as {
			owner: { login: string };
			name: string;
		};
		const owner = data.owner?.login ?? "";
		const repo = data.name ?? "";
		if (!owner || !repo) return null;
		return { owner, repo, fullName: `${owner}/${repo}` };
	} catch {
		return null;
	}
}

async function fetchIssues(
	exec: ExtensionAPI["exec"],
	cwd: string,
): Promise<IssueInfo[]> {
	const result = await exec(
		"gh",
		[
			"issue",
			"list",
			"--json",
			"number,title,labels,author,updatedAt",
			"--limit",
			"50",
			"--state",
			"open",
		],
		{ cwd },
	);

	if (result.code !== 0 || !result.stdout.trim()) return [];

	try {
		const items = JSON.parse(result.stdout) as Array<{
			number: number;
			title: string;
			labels: Array<{ name: string }>;
			author: { login: string };
			updatedAt: string;
		}>;

		return items.map((item) => ({
			number: item.number,
			title: item.title,
			labels: item.labels.map((l) => l.name).join(", "),
			author: item.author?.login ?? "",
			updatedAt: item.updatedAt,
		}));
	} catch {
		return [];
	}
}

async function fetchPRs(
	exec: ExtensionAPI["exec"],
	cwd: string,
): Promise<PRInfo[]> {
	const result = await exec(
		"gh",
		[
			"pr",
			"list",
			"--json",
			"number,title,author,headRefName,updatedAt,isDraft",
			"--limit",
			"50",
			"--state",
			"open",
		],
		{ cwd },
	);

	if (result.code !== 0 || !result.stdout.trim()) return [];

	try {
		const items = JSON.parse(result.stdout || "[]") as Array<{
			number: number;
			title: string;
			author: { login: string };
			headRefName: string;
			updatedAt: string;
			isDraft: boolean;
		}>;

		return items.map((item) => ({
			number: item.number,
			title: item.title,
			author: item.author?.login ?? "",
			headRefName: item.headRefName,
			updatedAt: item.updatedAt,
			isDraft: item.isDraft,
		}));
	} catch {
		return [];
	}
}

/** Fetch all data needed for the session in parallel. */
async function fetchAll(
	exec: ExtensionAPI["exec"],
	cwd: string,
): Promise<CachedData> {
	const [repo, issues, prs] = await Promise.all([
		fetchRepoName(exec, cwd),
		fetchIssues(exec, cwd),
		fetchPRs(exec, cwd),
	]);
	return { repo, issues, prs };
}

// --- Autocomplete replacement ---

function replaceAutocompletePrefix(
	lines: string[],
	cursorLine: number,
	cursorCol: number,
	prefix: string,
	value: string,
) {
	const currentLine = lines[cursorLine] ?? "";
	const beforePrefix = currentLine.slice(0, cursorCol - prefix.length);
	const afterCursor = currentLine.slice(cursorCol);
	const newLines = [...lines];
	newLines[cursorLine] = `${beforePrefix}${value}${afterCursor}`;

	return {
		lines: newLines,
		cursorLine,
		cursorCol: beforePrefix.length + value.length,
	};
}

function extractPrefixCandidate(
	textBeforeCursor: string,
	targetPrefix: string,
): string | undefined {
	const match = textBeforeCursor.match(/(^|\s)(@\S*)$/);
	const candidate = match?.[2];
	if (!candidate || !targetPrefix.startsWith(candidate)) return undefined;
	return candidate;
}

function createPrefixCompletionItem(
	value: string,
	label: string,
	description: string,
): AutocompleteItem {
	return { value, label, description };
}

// --- Provider factory ---

export function createGithubAutocompleteProvider(
	current: AutocompleteProvider,
	data: CachedData,
): AutocompleteProvider {
	let generation = 0;

	return {
		async getSuggestions(
			lines: string[],
			cursorLine: number,
			cursorCol: number,
			options,
		): Promise<AutocompleteSuggestions | null> {
			const currentLine = lines[cursorLine] ?? "";
			const textBeforeCursor = currentLine.slice(0, cursorCol);

			const issueToken = textBeforeCursor.match(ISSUE_TOKEN_RE)?.[1];
			const prToken = textBeforeCursor.match(PR_TOKEN_RE)?.[1];

			// Neither prefix matched — check for partial prefix candidates
			if (issueToken === undefined && prToken === undefined) {
				const currentSuggestions = await current.getSuggestions(
					lines,
					cursorLine,
					cursorCol,
					options,
				);

				const prefixItems: AutocompleteItem[] = [];

				const issueCandidate = extractPrefixCandidate(
					textBeforeCursor,
					ISSUE_PREFIX,
				);
				if (issueCandidate !== undefined) {
					prefixItems.push(
						createPrefixCompletionItem(
							ISSUE_PREFIX,
							ISSUE_PREFIX,
							"GitHub issues",
						),
					);
				}

				const prCandidate = extractPrefixCandidate(textBeforeCursor, PR_PREFIX);
				if (prCandidate !== undefined) {
					prefixItems.push(
						createPrefixCompletionItem(
							PR_PREFIX,
							PR_PREFIX,
							"GitHub pull requests",
						),
					);
				}

				if (prefixItems.length === 0) return currentSuggestions;

				return {
					items: [...prefixItems, ...(currentSuggestions?.items ?? [])],
					prefix: issueCandidate ?? prCandidate ?? "",
				};
			}

			// Debounce
			const thisGen = ++generation;
			await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS));
			if (thisGen !== generation) return null;

			if (options.signal.aborted) {
				return current.getSuggestions(lines, cursorLine, cursorCol, options);
			}

			const repoPrefix = data.repo ? `${data.repo.fullName}#` : "#";

			// --- Issues ---
			if (issueToken !== undefined) {
				const tokenLower = issueToken.toLowerCase();
				const filtered = data.issues
					.filter(
						(i) =>
							i.title.toLowerCase().includes(tokenLower) ||
							String(i.number).includes(tokenLower),
					)
					.slice(0, MAX_SUGGESTIONS);

				if (filtered.length === 0) {
					return current.getSuggestions(lines, cursorLine, cursorCol, options);
				}

				const items: AutocompleteItem[] = filtered.map((i) => ({
					value: `issue ${repoPrefix}${i.number}`,
					label: `#${i.number} ${i.title}`,
					description: [i.labels, i.author].filter(Boolean).join(" · "),
				}));

				return { items, prefix: `${ISSUE_PREFIX}${issueToken}` };
			}

			// --- PRs ---
			if (prToken !== undefined) {
				const tokenLower = prToken.toLowerCase();
				const filtered = data.prs
					.filter(
						(p) =>
							p.title.toLowerCase().includes(tokenLower) ||
							String(p.number).includes(tokenLower) ||
							p.headRefName.toLowerCase().includes(tokenLower),
					)
					.slice(0, MAX_SUGGESTIONS);

				if (filtered.length === 0) {
					return current.getSuggestions(lines, cursorLine, cursorCol, options);
				}

				const items: AutocompleteItem[] = filtered.map((p) => ({
					value: `pr ${repoPrefix}${p.number}`,
					label: `#${p.number} ${p.title}`,
					description: [p.headRefName, p.author, p.isDraft ? "draft" : ""]
						.filter(Boolean)
						.join(" · "),
				}));

				return { items, prefix: `${PR_PREFIX}${prToken}` };
			}

			return current.getSuggestions(lines, cursorLine, cursorCol, options);
		},

		applyCompletion(
			lines: string[],
			cursorLine: number,
			cursorCol: number,
			item: AutocompleteItem,
			prefix: string,
		) {
			if (prefix.startsWith(ISSUE_PREFIX) || prefix.startsWith(PR_PREFIX)) {
				return replaceAutocompletePrefix(
					lines,
					cursorLine,
					cursorCol,
					prefix,
					item.value,
				);
			}

			// Prefix item completion (typing toward `@issue:` or `@pr:`)
			if (item.value === ISSUE_PREFIX || item.value === PR_PREFIX) {
				return replaceAutocompletePrefix(
					lines,
					cursorLine,
					cursorCol,
					prefix,
					item.value,
				);
			}

			return current.applyCompletion(
				lines,
				cursorLine,
				cursorCol,
				item,
				prefix,
			);
		},

		shouldTriggerFileCompletion(
			lines: string[],
			cursorLine: number,
			cursorCol: number,
		) {
			const currentLine = lines[cursorLine] ?? "";
			const textBeforeCursor = currentLine.slice(0, cursorCol);
			if (
				textBeforeCursor.match(ISSUE_TOKEN_RE) ||
				textBeforeCursor.match(PR_TOKEN_RE)
			) {
				return false;
			}
			return (
				current.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ??
				true
			);
		},
	};
}

// --- Nudge on before_agent_start ---

/** Match `issue org/repo#123` or `issue #123` */
const ISSUE_REF_RE = /issue\s+(\S+?#(\d+))/g;
/** Match `pr org/repo#45` or `pr #45` */
const PR_REF_RE = /pr\s+(\S+?#(\d+))/g;

interface RefMatch {
	type: "issue" | "pr";
	/** Full reference string e.g. `owner/repo#123` */
	refs: string[];
}

function buildNudge(matches: RefMatch[]): string {
	const lines: string[] = [];

	for (const m of matches) {
		const uniqueRefs = [...new Set(m.refs)];
		if (m.type === "issue" && uniqueRefs.length > 0) {
			lines.push(
				`GitHub issues referenced: ${uniqueRefs.map((r) => `issue ${r}`).join(", ")}.`,
				`To fetch issue details, use: gh issue view <number> --json number,title,body,labels,author,assignees,comments`,
				`To list issues, use: gh issue list --json number,title,labels,author,updatedAt --state open`,
			);
		}
		if (m.type === "pr" && uniqueRefs.length > 0) {
			lines.push(
				`GitHub PRs referenced: ${uniqueRefs.map((r) => `pr ${r}`).join(", ")}.`,
				`To fetch PR details, use: gh pr view <number> --json number,title,body,headRefName,baseRefName,author,reviews,mergeable`,
				`To list PRs, use: gh pr list --json number,title,author,headRefName,updatedAt,isDraft --state open`,
			);
		}
	}

	return lines.join("\n");
}

// --- Extension entry point ---

export default async function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		const cwd = ctx.cwd;

		// Fetch all data upfront on session start
		const data = await fetchAll(pi.exec, cwd);

		ctx.ui.addAutocompleteProvider((current) =>
			createGithubAutocompleteProvider(current, data),
		);
	});

	pi.on("before_agent_start", async (event) => {
		const text = event.prompt;

		const issueRefs: string[] = [];
		const prRefs: string[] = [];

		let match: RegExpExecArray | null;

		const issueRe = new RegExp(ISSUE_REF_RE.source, "g");
		match = issueRe.exec(text);
		while (match !== null) {
			if (match[1]) issueRefs.push(match[1]);
			match = issueRe.exec(text);
		}

		const prRe = new RegExp(PR_REF_RE.source, "g");
		match = prRe.exec(text);
		while (match !== null) {
			if (match[1]) prRefs.push(match[1]);
			match = prRe.exec(text);
		}

		if (issueRefs.length === 0 && prRefs.length === 0) return;

		const nudge = buildNudge([
			{ type: "issue", refs: issueRefs },
			{ type: "pr", refs: prRefs },
		]);

		return {
			message: {
				customType: "github-ref:nudge",
				content: nudge,
				display: false,
			},
		} as const;
	});
}
