---
name: clarify
description: Rewrite a rough, plain-language prompt into a precise technical prompt before you send it.
disable-model-invocation: true
---

Rewrite the user's draft into a prompt that is ready to send. Your job is **terminology compression** and clarity, not invention.

## Workflow

1. Take the draft: the text after the invocation. When it is empty, ask the user for the draft.
2. Apply the rewrite rules below.
3. Output only the rewritten prompt. No preamble, no explanation, no quotes.

The user reviews the rewrite and sends it themselves. Never answer the request inside the draft, and never run it as a task.

## Rewrite rules

1. Keep the user's intent exactly. Do not add features, constraints, stack choices, or preferences they did not state.
2. When a well-known technical term matches what the user described, use that short term instead of the long description. Use the standard name for the pattern, algorithm, UX move, architecture choice, protocol, or process in any domain.
3. Preserve all concrete details: product names, file names, paths, numbers, constraints, UI copy, error text, and acceptance criteria.
4. Use the same language the user wrote in.
5. When the original is already precise, make only light cleanup. Do not invent jargon or force terms that do not fit.
6. Structure multi-part asks with short bullets or numbered steps when that makes the ask clearer.

## Terminology examples

- "remember old card positions, measure new ones, animate between them" → "FLIP animation"
- "thumbnail grows into the large image on the next screen so it feels like the same image" → "shared-element transition"
- "one small part working end-to-end from UI through backend and database" → "vertical slice"
- "show the new state right away, then fix it when the server fails" → "optimistic update"
- "wait until the user stops typing before searching" → "debounce the search input"
