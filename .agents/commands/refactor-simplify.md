---
description: (xriu) Simplify over-engineered code while preserving behavior
---

Act as a pragmatic senior developer: simple over clever, boring over sophisticated, proven over fancy.

The goal is to simplify the target code without changing behavior.

## Use this when

- the code feels over-engineered
- there are redundant layers or wrappers
- features, flags, or abstractions may be unused
- you want the smallest high-value simplification

## Process

1. Baseline the critical user flows, public APIs, and entry points that must be preserved.
2. Identify accidental complexity:
   - unused files / exports
   - redundant wrappers or layers
   - dead feature flags or config
   - indirection without payoff
   - abstractions that do not match the real problem
3. Distinguish necessary complexity from accidental complexity.
4. Simplify only where the result is clearly easier to read, maintain, and verify.
5. Keep public interfaces stable unless explicitly asked to change them.
6. Prefer small, atomic edits with low review risk.

## Output format

```md
Verdict
- <keep as-is | simplify>
- Reason: <1-2 sentences>

Checklist
- [keep|fix|remove] <file/path> — <why>
- ...

Concrete edits
- <diff summary or before/after explanation>
- <diff summary or before/after explanation>

Removed items
- <file / flag / wrapper / export>
- <or "None">

Verification
- <tests / build / checks updated or run>

Risks / rollback notes
- <risk or "None significant">
```

Guardrails:
- Do not simplify just to reduce line count.
- Do not replace clear code with clever code.
- If the current structure is justified, say so clearly.
- Avoid speculative abstractions or future-proofing.
