# Route handlers

A **route test** is a black-box, end-to-end test. It starts the whole app as it runs in production (the framework serving the route handlers, with the real config, services and repositories, on a real database with the app's migrations) and replaces only the outside world: each service the app calls is a **fake**, a small HTTP server in the test's own process. The test then sees the app as a caller and the outside world do: a request goes in over HTTP, and the test checks the answer, and what each fake received.

The handler stays thin: what it parses or checks is a pure function tested by `pure-functions.md`, so its route tests cover each outcome once, not each case.

## Rules

1. **Whole app, nothing mocked.** Start the app once per file in `beforeAll`, and close it in `afterAll`. The app reaches each outside service through a URL in its env, so the harness points those at the fakes, as an environment would. A fake implements the endpoints the app calls, with the real API's auth, and keeps what it receives in memory for the test to read. Add an endpoint to a fake when the app starts calling it.
2. **Black box.** A test touches the app only over HTTP. It never reads or writes the app's database or imports its modules. An effect the app keeps to itself shows through a **follow-up request**: the order now reads as paid, or the token just used now gets a 403.
3. **The request in the test.** Write the `fetch` out in the `it`, with its method, path, headers and body, so the test reads as the request it sends. Helpers only arrange: put data in a fake, or bring the app to a state through its own routes (`placeOrder`).
4. **Arrange through the front door.** Reach every state the way production does: through the app's routes, and through what the fakes hold or send (a webhook the fake signs). For time passing, move the clock: the app runs in the test's process and reads its `Date`, so `vi.useFakeTimers({ toFake: ["Date"] })` and `vi.setSystemTime(...)` move only the clock, while timers, sockets and the database run on.
5. **Isolated data.** Every test works on records of its own (a customer, an order, an ID no other test uses), and reads back only those from the fakes. A route that answers about everything, such as a batch job, gets a check that its own record is among the answers (`toContain`).
6. **One environment per file.** The app reads its env once, so a case that needs a setting unset, such as a secret not configured yet, gets a file of its own, with the app started without it.
7. **One example per test.** One request under test per `it`, which differs from its neighbours' in one visible way, and that difference is what the test is about. Follow-up requests only observe.

Work the handler leaves for after its answer runs after the response: wait for its effect on a fake with `vi.waitFor`. Where it should do nothing, prove that the work after the answer has finished, by a signal the app already gives or a follow-up request, then check that no fake received anything.

## Cases

For each route, a test for each of these that applies:

- **Every status code** the handler answers with, once. Each further reason for a status is tested where it is decided: a missing and a wrong token are two pure-function or service tests, and one 401 here.
- **Every outcome** of the request: what each outside service receives, and what a follow-up request shows, including requests that change nothing.
- **An outside service down** (its fake answering 503), and what the caller gets.
- **Work after the answer**: its effect, and that a request it ignores sends nothing.
- **Time passing**, for a route whose answer depends on it (an expiry, a timeout): one example on each side.
- **Every setting the handler itself reads**, set and unset. A setting passed on to a service or a pure function is tested there.

## Speed

**Budget: 100 ms per test.** The usual causes:

- **Routes compiled on first request.** Build the app once per run.
- **Fixed sleeps**, in the test or the app.
- **Polling at a slow interval.** Give `vi.waitFor` a short `interval`.
- **Real retry backoff or timeouts in the app.** Make the delay a setting the harness shortens.
- **An outside service with no fake**, waiting on DNS or a connection.
- **Deliberately expensive work**, such as password hashing at production cost.
- **Long arrange chains** through many routes.

## Naming

- The outer `describe` is the method and path: `describe("POST /api/orders")`; with ", without PAYMENTS_KEY" in a file with a setting unset.
- Each `it` starts with the status, then names the request in a few words: `"201: an order with one item"`, `"401: no bearer token"`, `"409: an order paid twice"`.

Read only the `it` lines: they should list every status the route answers with.

## Shape

```ts
let app: TestApp;
beforeAll(async () => {
  app = await startApp();
});
afterAll(() => app.close());

describe("POST /api/orders", () => {
  it("201: an order with one item", async () => {
    const customer = addCustomer(app);

    const response = await fetch(`${app.url}/api/orders`, {
      method: "POST",
      headers: { authorization: `Bearer ${customer.token}` },
      body: JSON.stringify({ items: [{ sku: "mug", quantity: 1 }] }),
    });

    expect(response.status).toBe(201);
    const order = await response.json();
    expect(order).toEqual({ id: expect.stringMatching(UUID), total: 1200 });
    expect(app.payments.chargesFor(customer.id)).toEqual([
      { amount: 1200, currency: "gbp" },
    ]);
    const read = await fetch(`${app.url}/api/orders/${order.id}`, {
      headers: { authorization: `Bearer ${customer.token}` },
    });
    expect(await read.json()).toEqual({ ...order, state: "paid" });
  });

  it("401: no bearer token", async () => {
    const response = await fetch(`${app.url}/api/orders`, {
      method: "POST",
      body: JSON.stringify({ items: [{ sku: "mug", quantity: 1 }] }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });
});
```

`startApp` starts the fakes, the database and the app, and points the app's env at them; `addCustomer` puts a customer of the test's own in the fakes.
