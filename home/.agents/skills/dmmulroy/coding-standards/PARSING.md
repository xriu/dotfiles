# Parse, don't validate — and correct-by-construction types

Boundary code turns unknown or less-structured input into application or domain types before it enters inner code. **Parse don't validate**: parse early, as close to the composition or application root as possible, and carry the refined type inward. The information parsing learned lives in the type — never discard it.

Use a separate protocol projection only when its shape or meaning differs enough to be useful. Name symbols after their actual protocol or persistence meaning — `CreateUserRequest`, `StripeCustomerResponse`, `UserRecord` — rather than using `DTO` or `Dto` in a symbol name. `DTO` describes a boundary role in prose, not a name.

```ts
unknown -> CreateUserRequest -> CreateUserInput -> EmailAddress/UserId/etc.
```

When the transport shape adds no useful distinction, parse directly into the application input:

```ts
unknown -> CreateUserInput
```

Pass parsed domain types — not schema-inferred transport shapes — through the application:

```ts
// Correct: parsed domain type flows inward
unknown -> CreateUserInput

// The schema-inferred type stops at the boundary
unknown -> z.infer<typeof CreateUserSchema>  // only at the edge
```

## Naming parsed values

- `parseX(input): Result<X, ParseXError>` for untrusted or less-structured input
- `makeX(...)` / `createX(...)` for smart constructors from already-typed pieces
- `isX(value): value is X` for true predicates
- `assertX(...)` rarely, mostly at tests/framework boundaries

When a function returns a refined value, it parsed something — name it `parseX`, not `validateX`.

## Schemas

Schema libraries serve as boundary parsers, not ad-hoc validators sprinkled through core logic.

Preference:

- use the repo's established schema library if one exists
- use Effect Schema in Effect codebases
- prefer Standard Schema compatibility for generic helpers
- otherwise prefer Zod 4
- use hand-written smart constructors/parsers for small domain types when clearer

Schema parsing produces refined/domain types and typed custom errors where practical.

Parsing is required on every path where less-trusted data re-enters typed code — not only on initial writes or inbound requests. Database reads, cache hits, RPC responses, event consumption, workflow replay, and serialized-state rehydration are each distinct boundaries. A write-time parser proves the write was valid; it says nothing about stored or replayed bytes.

## Branded types and correct construction

**Correct-by-construction** means the type system makes illegal states unrepresentable. Branded/refined types earn their keep when they prevent realistic misuse or invalid construction:

- IDs: `UserId`, `OrgId`, `WorkflowId`
- parsed strings: `EmailAddress`, `NonEmptyString`, `Url`
- constrained numbers: `PositiveInt`, `Cents`, `Percentage`
- units: `Milliseconds`, `Bytes`, `UsdCents`

Construct branded values through parsers or smart constructors. Pass domain types — not raw strings or numbers — wherever a domain type exists.

Push optionality outward. Functions that require a value accept a value. Branch or parse before calling, so the called function receives a known-present argument.

Express each operation's input explicitly. `Partial<T>` fits when partiality is the real domain concept; otherwise, declare the input type each operation actually requires.

## State machines and boolean blindness

When an entity has meaningful lifecycle states, model them with tagged unions — **correct-by-construction** lifecycle:

```ts
type Invoice =
  | {
      readonly _tag: "Draft";
      readonly id: InvoiceId;
      readonly lines: NonEmptyArray<LineItem>;
    }
  | { readonly _tag: "Sent"; readonly id: InvoiceId; readonly sentAt: Instant }
  | { readonly _tag: "Paid"; readonly id: InvoiceId; readonly paidAt: Instant };
```

Booleans for independent flags create impossible states (sent + not sent, paid + not paid) and invite boolean-blind callers:

```ts
// Boolean blindness: impossible states, ambiguous calls
type Invoice = {
  readonly isSent: boolean;
  readonly isPaid: boolean;
  readonly sentAt?: Date;
  readonly paidAt?: Date;
};
```

Booleans serve well as clear predicate return values:

```ts
isExpired(token): boolean;
hasPermission(user, permission): boolean;
```

For calls with multiple parameters, keep the primary domain input positional and group related configuration or capability controls into a named options object when names prevent order mistakes or make policy visible:

```ts
// Clear intent through named options
createUser(input, { emailVerification: "skip" });

// vs opaque boolean
createUser(input, true);
```

One obvious argument needs no wrapping.

Handle closed tagged unions exhaustively with `casesHandled` or the repository's native equivalent. Model an explicit boundary policy and test it when the external protocol truly requires an open-ended fallback.
