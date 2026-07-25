# TypeScript style, imports, comments, and configuration

## Strict settings

Use strict TypeScript settings where practical:

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`

## Immutability

Immutable values are the default:

```ts
type CreateUserInput = {
  readonly email: EmailAddress;
  readonly roles: ReadonlyArray<Role>;
};
```

Mutation earns its place inside localized imperative shell code, performance-sensitive internals, builders, or adapters hidden behind a precise interface.

## Return types

At stable exported seams, give non-trivial operations explicit return types. For a non-trivial public object, union, or collection result, prefer a named exported contract over an anonymous inferred shape. Derive the contract from the runtime schema when one owns the shape; keep schema and handwritten types in sync by generating one from the other. Local callbacks and small private helpers rely on inference when it remains obvious and precise.

## Casts, `any`, and non-null assertions

The type system expresses invariants; reach for escape hatches only when TypeScript genuinely cannot express the invariant:

- `as const` is always fine
- casts with `as Type` are reserved for highly generic helpers, branding internals, interop boundaries, or combinators where the invariant is real but unexpressible
- `any` is reserved for the same narrow cases
- non-null assertions (`!`) give way to branching, parsing, or refinement

Any `as Type` cast requires a safety comment explaining what the type system cannot express:

```ts
// SAFETY: TypeScript cannot express the brand. parseEmailAddress checked the normalized string before branding. Callers cannot construct EmailAddress except through this parser.
return normalized as EmailAddress;
```

Rare `any` requires a targeted oxlint ignore and justification:

```ts
// oxlint-disable-next-line no-explicit-any -- SAFETY: This helper preserves arbitrary function parameters; TypeScript cannot express this variadic constraint without any.
type Fn = (...args: any[]) => unknown;
```

Branch, parse, or refine in place of `!`.

## Imports and exports

Import directly from the file that owns the abstraction. Barrel files / `index.ts` re-export layers add an indirection layer with no information.

For domain modules, namespace imports preserve the module shape:

```ts
import * as EmailAddress from "./email-address";

EmailAddress.parse(input);
```

Use named imports for classes and focused shared helpers:

```ts
import { PasswordReset } from "./password-reset";
```

Use `import type` / `export type` for type-only imports and exports.

Static imports are the default. Dynamic `import()` serves an actual lazy-loading, optional-runtime, plugin, or code-splitting boundary — a real dependency timing that the boundary makes explicit.

Export what callers use. Internal helpers stay unexported unless intentionally shared.

TypeScript `namespace` serves interop; reach for ES modules otherwise.

## File naming

Name files after what they contain:

```txt
email-address.ts
billing-period.ts
string-case.ts
array.ts
```

Vague catch-all names (`utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`) hide what a file owns.

Tiny ubiquitous generic helpers/types share one explicit module when no more precise owner exists. Appropriate contents include:

- `casesHandled`
- `shouldNeverHappen`
- `notYetImplemented`
- `Redacted`
- `Tags`, `ExtractTag`, and `ExcludeTag`
- common `Result` helpers when the project uses neither Effect nor `better-result`
- broad type utilities

Keep only helpers justified by the target project. A second consumer is useful evidence but not a prerequisite when the helper's semantics are already genuinely generic and stable. Domain and application policy live with their owning modules.

File size follows cohesion and discoverability. Split when a file has multiple unrelated reasons to change or callers must understand unrelated concepts.

## Comments and JSDoc

Comments explain invariants, trade-offs, non-obvious domain rules, and safety justifications. Code narrates itself through names and structure; comments add what names cannot.

Names, public documentation, UI copy, and rendered errors use vocabulary appropriate to their audience. Public contracts speak in domain language — ticket names, migration phases, internal storage fields, framework mechanics, and planning language belong in internal context, not in a public surface.

Every exported symbol from a JavaScript or TypeScript module carries JSDoc. Public methods and properties of an exported class carry JSDoc. Private and internal code requires documentation only when its complexity warrants it. Documentation lives on the original declaration; re-exports inherit it.

Write each symbol's documentation explicitly. Inheritance tags like `@inheritDoc` or `@inherit` add indirection without adding meaning.

Standard JSDoc syntax:

```ts
/**
 * Parse an email address from untrusted input.
 *
 * @param input - The untrusted string to parse.
 * @returns A parsed email address, or `InvalidEmailAddress` when the input is invalid.
 */
export function parse(input: string): Result<EmailAddress, InvalidEmailAddress>;
```

For generics:

```ts
/**
 * Map the success value of a result.
 *
 * @template T - The original success type.
 * @template U - The mapped success type.
 * @template E - The error type.
 * @param result - The result to map.
 * @param fn - The function applied to the success value.
 * @returns A result with the mapped success value, or the original error.
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E>;
```

`@throws` documents unrecoverable defects, framework-required behavior, or temporary `notYetImplemented` paths. Expected typed errors appear in `@returns`, not in `@throws`.

For complex exported object types, document fields when helpful:

```ts
/** Input required to create a user. */
export type CreateUserInput = {
  /** The actor creating the user. */
  readonly actor: AdminUser;

  /** The parsed email address for the new user. */
  readonly email: EmailAddress;
};
```

## Configuration and resources

Parse environment/config at startup or the earliest boundary into typed config with branded/redacted values where appropriate. Return known configuration failures as tagged error values. The composition root reports a safe startup message and terminates on invalid configuration — a config problem is a startup failure with useful, safe context, not a runtime surprise.

`process.env` reads live at the boundary. Modules load clean, parsed configuration.

Modules import cleanly — servers, connections, handlers, and I/O start in bootstrap or imperative shell code, not at import time. Top-level side effects belong in true entrypoint/bootstrap files.

Resource creation and cleanup are explicit, owned by bootstrap/imperative shell code or Effect layers.

Mutable singletons and global state live at the boundary. Constants and pure lookup tables are fine application-wide. When a framework/runtime requires a singleton, isolate it at the edge.

Inject `Clock` / `Random` services into dependency-bearing modules. Pure domain functions accept explicit `now` / random values.
