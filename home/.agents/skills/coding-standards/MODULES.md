# Modules, roles, ports, and composition

**Domain Module**, **Application Service Module**, and **Adapter Module** name responsibilities, not required folders, suffixes, or TypeScript constructs. A module may be a function, object, class, file, or package with a cohesive public interface. Use the roles at any scale; create only the layers the behavior needs.

The normal dependency and call flow for an operation with application policy or effects:

```txt
external input -> inbound Adapter -> Application Service -> Domain Module
                                           |
                                           +-> application-owned port
                                                 -> outbound Adapter -> external system
```

An inbound Adapter calls a Domain Module directly only for a pure operation with no authorization, application policy, persistence, external calls, or effect sequencing:

```txt
external input -> inbound Adapter -> Domain Module
```

The composition root constructs concrete Adapters and supplies them to Application Services. Dependencies point inward: Domain Modules know neither services nor Adapters; Application Services know application-owned port contracts, not concrete technologies; Adapters depend on those contracts and translate at the edge.

## Choosing a role

Classify code by the responsibility that would make it change:

- A business meaning, invariant, calculation, or legal state transition changes: **Domain Module**.
- An application operation's policy, authorization, or effect sequence changes: **Application Service Module**.
- A protocol, framework, database, runtime, or third-party API changes: **Adapter Module**.
- Only construction, configuration, or resource wiring changes: **composition root**.

Split an abstraction when it owns more than one reason to change. Code that owns only one reason stays together.

## Applying the roles

For a new feature or a local refactor:

1. Trace one caller-visible operation from ingress to every effect.
2. Put intrinsic meanings, invariants, calculations, and transitions in Domain Modules.
3. Put application policy and effect ordering in an Application Service; define its dependencies as narrow ports.
4. Put each protocol or technology translation in an inbound or outbound Adapter.
5. Wire concrete Adapters to ports at the composition root.
6. Verify each role through its public seam: domain results, application outcomes, and boundary records/responses.

Apply these responsibilities inside the project's existing layout and framework vocabulary. Contain old conventions at an Adapter seam rather than forcing a broad rewrite.

For example, in password reset: `EmailAddress` and `ResetToken` are Domain Modules; `PasswordReset` is the Application Service; an HTTP route is an inbound Adapter; Postgres and email-provider implementations are outbound Adapters; bootstrap performs the wiring.

## Deep modules

A **deep module** hides substantial behavior, invariants, policy, sequencing, or translation behind a cohesive, low-burden interface. Low-burden means callers accomplish their goal with minimal ceremony — it does not necessarily mean few functions.

Test with the deletion test:

- deleting the module makes complexity disappear → it was pass-through waste
- deleting it spreads complexity across callers → it was earning its keep

Shallow abstractions that forward calls, mirror tables, rename another API, or expose implementation steps earn nothing.

## Domain Module

A **Domain Module** is a pure, type-centric abstract data type in the OCaml tradition. It centers one primary domain type or tightly related type family and owns what values mean and which operations are legal. The heart of the **functional core**.

Use one when the code has a meaningful domain distinction, invariant, calculation, decision, or lifecycle. Keep a primitive or local pure function when introducing a domain abstraction would prevent no realistic misuse and centralize no meaningful rule.

A Domain Module:

- co-locates its type, supporting types, parsers, smart constructors, combinators, predicates, legal transitions, domain projections, formatting, and test generators as applicable
- returns refined values from parsers and constructors so callers cannot create invalid instances — **correct-by-construction**
- expresses expected failures as precise values — errors as values
- remains deterministic and independent of I/O, frameworks, persistence, ambient time, randomness, and mutable global state

A Domain Module defines pure permission decisions over parsed domain values. Authentication, authorization enforcement, effect ordering, storage queries, network calls, and transport/persistence DTOs live elsewhere — callers use its operations instead of recreating its checks or branding values with casts.

Example:

```ts
// email-address.ts

/** A parsed, normalized email address. */
export type EmailAddress = Brand<string, "EmailAddress">;

/** Parse an email address from untrusted input. */
export function parse(input: string): Result<EmailAddress, InvalidEmailAddress>;

/** Render an email address as a string. */
export function toString(email: EmailAddress): string;

/** Compare two email addresses for equality. */
export function equals(left: EmailAddress, right: EmailAddress): boolean;
```

Domain Modules use plain functions, immutable value classes, or static-style classes when cohesive. When using classes:

- construct through `parse` / `make` / smart constructors
- make invalid instances unconstructable
- keep fields readonly/immutable from callers
- keep methods cohesive over that value
- keep I/O and dependencies outside domain value classes
- reach for composition over inheritance for domain behavior

## Application Service Module

An **Application Service Module** owns one cohesive application operation or capability, such as `PasswordReset`, `Invitations`, or `SubscriptionLifecycle`. It applies application policy and sequences effects through narrow, application-owned ports while delegating intrinsic business rules to Domain Modules. The **imperative shell**'s policy layer.

Use one when an operation coordinates authorization, domain decisions, persistence, external calls, transactions, messages, time, IDs, or telemetry — or when the same operation serves multiple entrypoints. A direct Domain Module call suffices when no application policy or effect orchestration exists.

An Application Service:

- accepts and returns application/domain types with precise expected-error unions
- defines the smallest meaningful ports required by the operation
- receives ports, configuration, clocks, randomness, and similar capabilities explicitly
- owns which effects occur, under what policy, and in what order
- remains independent of HTTP, CLI, queue, ORM, vendor SDK, and runtime types

Protocol envelope parsing, response rendering, SQL execution, vendor DTO translation, and Domain Module invariant duplication live in Adapters. Prefer constructor injection for dependency-bearing classes; in Effect codebases, use services/tags/layers. Pass each dependency to the operation that needs it — a single dependency bag for every call hides the operation's real requirements.

Split methods that represent unrelated capabilities, change for different reasons, or require unrelated dependencies. Name modules after the capability — `PasswordReset`, `SubscriptionLifecycle` — rather than generic `Manager`, `Processor`, `Helper`, or `UserService`.

## Adapter Module

An **Adapter Module** owns one boundary's translation and technology mechanics. Use one whenever application code crosses a framework, protocol, serialization, process, persistence, runtime, or third-party boundary.

Two directions:

- An **inbound Adapter** parses an external request/event/command, invokes an Application Service (or a directly callable pure Domain Module), and projects its result into the external protocol. Examples: HTTP route, GraphQL resolver, CLI command, queue consumer.
- An **outbound Adapter** implements an Application Service port using a concrete technology and translates raw records, SDK values, and external failures into application/domain types and typed errors. Examples: Postgres store, Stripe client, email sender, system clock.

An Adapter owns schema/DTO translation, framework lifecycle, external error classification, and safe diagnostics for its boundary. It retries a short-lived technical failure only when the operation is safely repeatable and the retry preserves the port's meaning. Business eligibility, authorization policy, legal state transitions, and application-operation ordering live in the Application Service. Raw external types stay inside the Adapter or composition root.

A port is not an Adapter. A port is the application-owned contract that states what an operation needs; an outbound Adapter is one replaceable implementation. An Adapter earns its place by hiding real translation or mechanics — a module that forwards the same shape to another internal module without translation is pass-through.

## Composition root

The composition root parses environment and configuration, acquires resources, constructs concrete Adapters, and injects them into Application Services. Framework bindings and concrete wiring live here; domain rules, application policy, and reusable boundary translation live in their owning modules.

## Application-owned ports and Adapter reuse

Define ports beside the Application Service that needs them, in the application's language. Depend on the smallest meaningful capability the operation uses; let a cohesive concrete Adapter be wider. Port inputs, outputs, and errors are application/domain types — not raw rows, SDK objects, or framework values.

TypeScript's structural typing makes this natural:

```ts
type UsersForPasswordReset = {
  findActiveByEmail(
    email: EmailAddress,
  ): Promise<Result<ActiveUser, UserLookupError>>;
};

export class PasswordReset {
  constructor(private readonly users: UsersForPasswordReset) {}
}
```

A wider adapter satisfies it:

```ts
export class PostgresUsers {
  findActiveByEmail(...) { ... }
  findById(...) { ... }
  updateProfile(...) { ... }
}
```

This earns both cohesion (each Adapter owns a real capability) and narrow dependencies (each Service sees only what it uses).

### Adapter reuse audit

Before creating a new adapter or service, audit existing ones.

Prefer, in order:

1. Reuse an existing adapter as-is through a narrow dependency type.
2. Extend an existing adapter when the new method fits its existing cohesive capability and changes for the same reason.
3. Create a new adapter when reuse/extension would create bad coupling or an accidental interface.

A routine feature-level Adapter or Application Service needs no ADR. Create an ADR when the new module introduces a lasting architectural boundary, shared pattern, provider strategy, or deliberate exception to these standards. The ADR explains:

- which existing Adapters or Application Services were checked
- why reuse or extension did not fit
- why the new boundary or pattern is a separate cohesive capability

### Repositories and persistence

Repository-like adapters represent cohesive domain persistence capabilities. They expose meaningful domain operations and return parsed domain types / typed errors — not raw rows and ORM errors.

Raw database rows and ORM models are infrastructure DTOs. Parse them before application/core logic. SQL/ORM details stay inside infrastructure adapters or persistence modules.

## Functional core, imperative shell, and entrypoints

Domain Modules form the **functional core**. Application Service Modules and Adapter Modules form the **imperative shell** — and only Adapters contain technology-specific concerns. This keeps the same application operation reusable across REST, CLI, GraphQL, workers, and other entrypoints.

The functional core contains domain parsers, invariants, state transitions, calculations, combinators, and decision functions. It is free of I/O, hidden dependencies, ambient time/randomness, thrown expected failures, and framework-specific concerns.

The imperative shell has two distinct responsibilities:

- Application Services apply application policy and sequence effects through explicit ports.
- Adapters parse or project boundary values, classify external failures, and perform concrete I/O.

Entrypoint Adapters are thin protocol translation layers. They parse protocol-specific input, call Domain Module parsers to obtain refined values, invoke an Application Service when application policy or effects are involved, and render protocol-specific output. A pure operation calls a Domain Module directly as described above. Business rules live in Domain Modules — controllers, resolvers, commands, and handlers invoke them, never duplicate them.

Within authentication and authorization, inbound Adapters verify boundary credentials and produce a parsed identity such as `Principal`, `Session`, or `CommandActor`. Domain Modules define pure permission decisions over parsed domain values. Application Services gather the required context and enforce those decisions while carrying out an application operation. Adapters project missing or invalid credentials and denied operations into protocol-specific outcomes; permission policy lives in Domain Modules.

## Workflows, transactions, and idempotency

Use ordinary function calls or database transactions for simple single-boundary operations.

Use a saga or durable workflow when progress must survive process loss or redelivery, or when the operation requires long delays, compensation, resumability, timers, human approval, cross-service coordination, or multiple transaction boundaries. A short-lived retry by itself calls for an Adapter-level retry, not durable workflow machinery.

Adapters own safe, short-lived technical retries. Application Services decide whether an application operation should be attempted again. Durable workflows own retries that must survive crashes, delays, or redelivery.

Database transactions close before network calls and long-running operations begin.

Any externally observable mutation or state transition that may be retried carries an explicit idempotency strategy:

- idempotency key
- natural unique constraint
- deduplication record
- state-machine transition guard
- transactional outbox/inbox

Retries depend on explicit idempotency guarantees — side effects are safe to repeat only when the strategy says so.
