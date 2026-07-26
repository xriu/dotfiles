# Testing

## Confidence ladder

Add an end-to-end test whenever the behavior can be exercised through its real public entrypoint in the normal test environment without unreliable third parties or unreasonable setup, runtime, or cost. Add lower-level tests when they provide extra coverage for important cases.

Prefer, in order:

1. End-to-end tests through real public entrypoints whenever possible
2. Integration tests through real seams
3. Focused/property tests for pure Domain Modules
4. Unit tests when they test meaningful behavior, not implementation details

## Real seams

Use real seams for test dependency injection:

- constructor-injected interfaces/classes
- Effect services/layers
- local database substitutes such as SQLite
- in-memory adapters when behavior is simple
- fake external adapters when needed

Module mocking via `vi.mock` or `jest.mock` has no place when a real seam exists. Reach for real seams first; module mocking is the last resort for a dependency with no injectable seam.

## Assertions

Assert observable input/output behavior:

- returned value/error
- persisted state
- emitted event/message
- rendered response
- sent email record in a fake/local adapter

Spy-driven tests like `expect(sendEmail).toHaveBeenCalledWith(...)` fit when the interaction itself is the only observable behavior. Otherwise, assert what the system produced, not what it called.

For persistence behavior, prefer SQLite/local DB-backed tests over hand-rolled in-memory fakes when SQL/schema/transaction behavior matters.

## Property tests and arbitraries

Use `fast-check` where properties are clearer than examples, especially for:

- parsers/smart constructors
- branded/refined types
- state machines
- serialization roundtrips
- normalization/idempotence
- lawful combinators

Export arbitraries near the domain module they support:

```txt
src/billing/
  invoice-number.ts
  invoice-number.test.ts
  invoice-number.arbitrary.ts
```

Tests exercise the public seam — parsers, smart constructors, and invariants are part of the behavior under test, not things to bypass.

## Test-only production code

Production code keeps its shape for production reasons. Add a dependency seam only when it also represents a real ownership or variability boundary; otherwise test through the existing public seam or a faithful inert harness.

## Compile-time type tests

When inference is public behavior, add compile-time tests that exercise ordinary call-site inference without rescue annotations or casts. Assert the inferred success and expected-failure types so a widening regression actually fails the test.
