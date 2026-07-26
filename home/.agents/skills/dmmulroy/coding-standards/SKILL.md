---
name: coding-standards
description: Correct-by-construction TypeScript standards. Use for TypeScript engineering or when another skill needs the user's coding standards.
---

These standards describe how to design and write TypeScript code. Inspect existing code before adding patterns, libraries, Adapters, or abstractions. Follow existing conventions only when compatible with these standards.

## Decision priority

When rules pull in different directions, use this order:

1. Preserve correctness, safety, and debuggability.
2. Apply these standards to all new code and to the full behavior being refactored.
3. Follow compatible project architecture and conventions.
4. Contain incompatible existing patterns at the nearest boundary rather than copying them into new code.
5. Leave unrelated old code unchanged unless a broader migration is explicitly requested.
6. Document meaningful trade-offs with comments or ADRs.

## Core principles

- **Errors as values.** Every known failure appears as a typed value in the return type. Throwing and rejection are reserved for defects.
- **Parse don't validate.** Parse early, at the boundary, and carry the refined type inward. The information parsing learned lives in the type — never discard it.
- **Correct-by-construction.** Make illegal states unrepresentable. Branded types, smart constructors, exhaustive state machines — the right way is the only way.
- **Composition over inheritance.**
- **Imperative shell, functional core.** Domain Modules form the pure, deterministic core. Application Services and Adapters form the imperative shell — only Adapters touch technology.
- **Deep modules.** Substantial behavior behind a cohesive, low-burden interface. If deleting the module makes complexity disappear, it was pass-through waste.
- **Real seams.** Test through public entrypoints and injected dependencies. Module mocks and spy-driven tests are last resorts.
- **Discoverability.** Code navigable for humans and agents.

## Adapting to existing codebases

Before adding a new pattern or library, inspect the repo for existing choices around error handling, schema parsing, dependency injection, testing, observability, adapters/services, and module layout.

Represent known failures as typed values in new or refactored code, then translate at the boundary into the outcome the existing framework requires. Preserve existing logging, tracing, metrics, and error-reporting hooks. Contain incompatible patterns at the nearest Adapter seam.

## Sensitive data and telemetry

End-to-end structured tracing across requests, jobs, workflows, modules, adapters, and external calls. Make failures diagnosable with safe fields: domain IDs, operation names, dependency names, state tags, retry counts, typed error tags, safe summaries.

Secrets stay out of errors, traces, logs, and snapshots. Wrap sensitive values in `Redacted<T>` at the boundary; keep them redacted through application code. Unwrap only at the final I/O operation that needs the raw value, usually inside an adapter.

## REFERENCE

Load the file that matches the work at hand.

- **Failures, errors, defects** → [`ERRORS.md`](ERRORS.md) — expected failures as values, defect helpers, custom error design.
- **Boundary parsing, schemas, branded types, state machines** → [`PARSING.md`](PARSING.md) — parse don't validate, schema libraries, correct-by-construction types, boolean blindness.
- **Module roles, ports, adapters, composition** → [`MODULES.md`](MODULES.md) — Domain Module, Application Service Module, Adapter Module, composition root, deep modules, port design, adapter reuse, functional core and imperative shell, workflows and idempotency.
- **Testing strategy** → [`TESTING.md`](TESTING.md) — confidence ladder, real seams, property tests, compile-time type tests.
- **TypeScript style, imports, comments, configuration** → [`STYLE.md`](STYLE.md) — strict settings, casts and `any`, file naming, JSDoc, config parsing, resource lifecycle.
