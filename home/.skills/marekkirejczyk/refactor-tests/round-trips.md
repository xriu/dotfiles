# Database round trips

A **round trip** checks that a repository stores data faithfully: write an item through the repository under test, read it back through the same repository, and compare the result with the item.

## Rules

1. **Short.** Build the item, write it, read it back, compare the whole value: two to four lines in the `it`, with every step visible in it.
2. **Plain repository.** A repository puts data in and gets data out, so a round trip tests storage, never behaviour. Filtering, state changes and choosing between cases belong in the service, tested there with fakes. Logic written in the repository's TypeScript, such as row mapping, is extracted into a pure function with its own unit tests, moved unchanged. Logic in SQL stays in the round trips by its filter edges, and is reported when it belongs in the service.

   The one exception is **locking**: a repository may read a row, apply a change and write it under a lock (`SELECT … FOR UPDATE` in a transaction), because the lock is a storage guarantee. Any non-trivial decision made under the lock is a pure function in its own module with its own unit tests; the repository only calls it. Give each guarantee the lock makes one test of its own, named for the guarantee: `"a change sees what is stored"`, `"two claims at once create one order"`.

3. **Whole value.** `expect(await repository.order(item.id)).toEqual(item)`: the read-back equals the item written.
4. **One example per test.** Each item differs from its neighbours in one visible way, and that difference is what the test is about: nullable columns all null against all filled, an empty JSON column against a full one, a value at a type's edge.
5. **Isolated data.** Every test writes items with keys of its own (its own ID, and its own value in every unique or looked-up column, such as a customer's email), so it reads back only what it wrote. A query over many rows gets a range of its own too, such as a time window or a customer no other test writes for. Tests then pass in any order, alone or together, on a database other tests have already written to.
6. **The fake too.** When a repository has an in-memory fake for service tests (`services.md`), the same round trips run against both: one list of cases, run once per implementation (`describe.each`). A case the fake fails is a fake to fix, never a case to skip.

## Cases

For each repository method, a test for each of these that applies:

- **Every shape of a stored item**: nullable columns all filled and all null, an empty and a full JSON column, each value of an enum column a later query or lock reads.
- **Every way to read it back**: by each key the repository looks items up by.
- **A missing item**: an unknown key read back as `null` or an empty list.
- **Every edge of a query's filter**: one item just inside each bound, one just outside, and one exactly on it; one item per condition the filter rejects on.
- **Every guarantee a lock makes**: the change sees what is stored, the change is written, a change that returns nothing writes nothing, and two changes at once apply one after the other.

## Speed

**Budget: 50 ms per test.** The usual causes:

- **Migrations run per file or per test.** Run them once in `globalSetup`, save the database with PGlite's `dumpDataDir()`, and start each file from it with `new PGlite({ loadDataDir })`.
- **Many writes** where one proves the point.
- **Sleeps in lock tests.** Make the second change wait on the first with a promise or a barrier.

## Naming

- The outer `describe` is the class: `describe("OrderRepository")`.
- A nested `describe` names the round trip and its subject: `describe("order round trip")`. One per entity, or one per method when methods store different things.
- Each `it` names the example item in a few words: `"a new order"`, `"a paid order with every item"`, `"an order with every optional field empty"`.

Read only the `describe` and `it` lines: they should tell you what is covered, and why each example differs from the others.

## Shape

```ts
describe("OrderRepository", () => {
  describe("order round trip", () => {
    it("a new order", async () => {
      await repository.save(NEW_ORDER);
      expect(await repository.order(NEW_ORDER.id)).toEqual(NEW_ORDER);
    });

    it("a paid order with every item", async () => {
      await repository.save(PAID_ORDER);
      expect(await repository.order(PAID_ORDER.id)).toEqual(PAID_ORDER);
    });
  });
});
```

`NEW_ORDER` and `PAID_ORDER` carry different IDs and customers, so neither test can read the other's order. The database is real Postgres with the app's own migrations, migrated once per run into a snapshot, started from that snapshot once per file, and shared by the file's tests; Postgres in the test's own process (PGlite) needs nothing else running.
