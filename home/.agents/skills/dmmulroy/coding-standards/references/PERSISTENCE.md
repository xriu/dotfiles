# Persistence

Read this reference when changed behavior reads or writes a database, cache, durable object, ORM model, or persisted record.

Also read:

- [`MODULES-SERVICES-AND-ADAPTERS.md`](MODULES-SERVICES-AND-ADAPTERS.md) for persistence capability ownership, Adapter design, and public contracts;
- [`PARSING-AND-SCHEMAS.md`](PARSING-AND-SCHEMAS.md) when stored data is read or its representation changes;
- [`TESTING.md`](TESTING.md) when persistence behavior changes;
- [`WORKFLOWS-TRANSACTIONS-AND-IDEMPOTENCY.md`](WORKFLOWS-TRANSACTIONS-AND-IDEMPOTENCY.md) when transaction scope, retries, or duplicate execution may change.

Define each persistence boundary around a cohesive domain capability, with table layout kept as a private implementation detail.

Treat stored rows, ORM models, and cached values as serialized input under the parsing rules. Keep queries, schema details, raw records, and ORM mechanics inside the owning persistence module.

## Completion check

Every changed persistence operation belongs to one cohesive domain capability; table layout, queries, schema details, raw records, and ORM mechanics remain private to the owning persistence module; every stored-data read satisfies the parsing completion check; and every other linked reference whose trigger applies has passed its completion check or has a reported exception with concrete evidence.