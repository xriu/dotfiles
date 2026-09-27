const sequenceArrow = /-->>|->>|--x|-x|--\)|-\)|-->|->/;
const nextSequenceMessage =
	/^\s*[\w.-]+\s*(?:-->>|->>|--x|-x|--\)|-\)|-->|->)\s*[+-]*[\w.-]+(?:\s*:|$)/;

/**
 * Replace semicolons inside unquoted sequence-message labels with commas.
 *
 * Mermaid uses semicolons as statement separators. The terminal renderer also
 * splits on them, so label punctuation can make an otherwise valid sequence
 * diagram fail to render. Semicolons that start another message stay intact.
 */
export function normalizeSequenceSemicolons(source: string): string {
	if (!/^\s*sequenceDiagram\b/i.test(source)) return source;

	return source
		.split(/\r?\n/)
		.map((line) => {
			const arrow = sequenceArrow.exec(line);
			if (!arrow || arrow.index === undefined) return line;

			const labelStart = line.indexOf(":", arrow.index + arrow[0].length);
			if (labelStart === -1) return line;

			const prefix = line.slice(0, labelStart + 1);
			const label = line.slice(labelStart + 1);
			let normalized = "";
			let inQuotes = false;

			// ponytail: recognizes ASCII sequence IDs; use a full Mermaid lexer for quoted or Unicode IDs.
			for (let index = 0; index < label.length; index++) {
				const character = label.charAt(index);
				if (character === '"' && label[index - 1] !== "\\")
					inQuotes = !inQuotes;

				if (
					character === ";" &&
					!inQuotes &&
					!nextSequenceMessage.test(label.slice(index + 1))
				) {
					normalized += ",";
				} else {
					normalized += character;
				}
			}

			return prefix + normalized;
		})
		.join("\n");
}
