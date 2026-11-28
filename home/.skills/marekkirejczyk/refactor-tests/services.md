# Services

A **service test** builds the service class with a **fake** for each dependency that leaves the process (a repository, a vendor client, the mailer), calls one public method, and checks what came back and what each fake now holds. Everything inside the process runs for real.

The service stays thin: each decision it makes is a pure function tested by `pure-functions.md`, so its tests cover each outcome once, not each case of a decision.

## Rules

1. **Real inside, fakes at the edge.** Pure functions and other services run for real, built the same way. Only a dependency that leaves the process gets a fake. Build the service with `new` in a `setup()` function in the test file, never from the app's config or singletons.
2. **One fake per port, typed against it.** A repository's fake is a class that `implements` the repository's interface, lives next to it (`fake-repository.ts`), and keeps its rows in public arrays or maps. A vendor's fake implements the app's own interface for it (`Payments`, `Mailer`), records what it receives, and returns canned answers; never fake a vendor SDK's types. No `vi.mock`, and no `vi.fn` for a constructor dependency. One area's fake is shared by every test file that needs it, never copied.
3. **A fake passes the round trips.** A repository fake does what the repository guarantees and nothing more, including what its locks guarantee, because the service relies on it. The repository's round-trip suite runs against both the repository and its fake (`round-trips.md`), so the fake can't drift. A guard in the fake that no round trip covers is untested: add the round trip.
4. **Check state, not calls.** Assert what the method returned, then the state of each fake it changed: a row written, an email sent, a charge created, each compared whole. A call is asserted only for a port that changes the outside world, as the fake's recorded list compared whole. Never assert that a read was or wasn't made, unless the read is itself the requirement (it costs money, it counts against a rate limit); then the fake counts it and the test's name says why.
5. **Time and IDs are arguments.** The service takes the time (`now: () => Date`) and any ID or token source through its constructor. The test fixes both, and writes out the values they produce. No `vi.useFakeTimers` in a service test. Match an ID by its shape only when the code can't take it as an argument.
6. **Arrange through the service, or the fake's rows.** Reach a state by calling the service's own methods (`placedOrder()`), or by putting rows in the fake when no method creates them. Never read or set the service's private fields.
7. **Fresh fakes per test.** `setup()` builds new fakes in every `it`; only constants are shared, so tests pass shuffled and alone.
8. **One example per test.** One call under test per `it`, which differs from its neighbours' in one visible way, and that difference is what the test is about.

## Cases

For each public method, a test for each of these that applies:

- **Every outcome**: each kind of answer it returns, with the writes and sends that go with it, including a call that changes nothing (an unknown ID, an order no longer pending).
- **Every dependency failing**: each fake that can throw, and what the caller gets, what was left written, and what was logged (spy on `console.error` and assert the error object).
- **Repeats**: the same call twice (a duplicate webhook, a double click), and a call after one that failed halfway.
- **Time passing**, for an answer that depends on it: one example on each side, by setting the injected time. The edges of the bound belong to the pure function that decides it.
- **Every setting it reads**, set and unset.

## Speed

**Budget: 5 ms per test on fakes or stubs, 50 ms for a test on a real database or subprocess.** Rule 1 stands, so the 50 ms budget is for tests that already exist, each a candidate to move onto fakes. Fresh fakes stay (rule 7), because a fake costs almost nothing. The usual causes:

- **A real database, git or other subprocess** where a fake belongs.
- **Real timers or sleeps.**
- **A heavy `setup()`.**

## Naming

- The outer `describe` is the class: `describe("OrderService")`; a nested `describe` per method: `describe("placeOrder")`.
- Each `it` names the example in a few words: `"an order with one item"`, `"an unknown customer"`, `"payments down"`.

Read only the `describe` and `it` lines: they should list every method, and every outcome of each.

## Shape

```ts
const NOW = new Date("2026-10-30T12:00:00Z");
const ORDER_ID = "0f8e2d3c-4b5a-4c6d-8e7f-9a0b1c2d3e4f";

function setup() {
  const orders = new FakeOrderRepository();
  const payments = new FakePayments();
  const service = new OrderService(
    orders,
    payments,
    () => NOW,
    () => ORDER_ID,
  );
  return { service, orders, payments };
}

describe("OrderService", () => {
  describe("placeOrder", () => {
    it("an order with one item", async () => {
      const { service, orders, payments } = setup();

      const result = await service.placeOrder({
        customerId: "customer-1",
        items: [{ sku: "mug", quantity: 1 }],
      });

      expect(result).toEqual({ id: ORDER_ID, total: 1200 });
      expect(orders.rows).toEqual([
        {
          id: ORDER_ID,
          customerId: "customer-1",
          total: 1200,
          state: "pending",
          placedAt: NOW,
        },
      ]);
      expect(payments.charges).toEqual([
        { orderId: ORDER_ID, amount: 1200, currency: "gbp" },
      ]);
    });

    it("payments down", async () => {
      const { service, orders, payments } = setup();
      payments.failNext(new Error("503"));

      await expect(
        service.placeOrder({
          customerId: "customer-1",
          items: [{ sku: "mug", quantity: 1 }],
        }),
      ).rejects.toEqual(new Error("503"));
      expect(orders.rows).toEqual([]);
    });
  });
});
```

`FakeOrderRepository` lives next to `OrderRepository` and passes its round trips; `FakePayments` implements the app's `Payments` interface, and records each charge.
