# Browser tests

A **browser test** drives a real browser with Playwright through the whole app, as a person would: the production build with its real config, services and repositories, on a real database with the app's migrations, and each outside service replaced by a **fake**. A test of browser-side code with its dependencies mocked is a unit test, even in a file named `browser.test.ts`.

Browser tests are the slowest and the fewest. **Push down** leaves here one journey per critical flow and what needs a real browser, so each decision and edge case is proved at a faster level, and these tests prove that the pieces work together.

Browser tests are **optional**. This file applies to the browser tests already in scope, and its **Cases** to the flows they cover. A project or flow without browser tests stays without them, and a missing one is not a gap. **Never add the first browser test to a project**, nor Playwright, its config or a `webServer`: a case only a browser could prove goes in the report as untested.

## Rules

1. **Whole app, outside world faked.** The app runs from a production build, made once and reused until the app's own code changes. Playwright's `webServer` starts it and each fake once for the whole run, shared by every test and worker, with the app's env pointing at the fakes, and `reuseExistingServer: !process.env.CI` keeps a server that is already running between local runs. A round that changes only tests rebuilds nothing. A fake here is a server of its own, because the app runs in its own process and Playwright's workers share no memory: it implements the endpoints the app calls, with the real API's auth, and has a read endpoint that answers what it received for one record. `page.route` reaches only the requests the browser makes, so use it for third parties the page calls itself (analytics, a widget's scripts). The run sends nothing to the real outside world.
2. **Black box, as the user sees it.** Find each element by role, then label, then text: `getByRole("button", { name: "Pay" })`, narrowed by chaining or `filter`. Locators name what the user sees, independent of CSS classes, XPath and position. An element with no accessible name gets a `data-testid` and `getByTestId`, and the missing name goes in the report. A test reaches the app only through the browser and its HTTP routes, never its database or modules.
3. **Auto-retrying assertions.** Assert on the page with `await expect(locator).toBeVisible()` and its siblings, which retry until true, in place of reading a value once with `isVisible()` or `textContent()`. Read a fake or a route with `expect.poll`. Every wait is an assertion on the thing waited for, which replaces `waitForTimeout` and `networkidle`. Lint with `@typescript-eslint/no-floating-promises`, so a missing `await` fails.
4. **The journey in the test.** Write each `goto`, click, fill and assertion in the `test`, in the user's order, so the test reads as the journey. Fixtures and helpers only arrange. Where the project has page objects, they find elements and act, and every assertion stays in the test.
5. **Arrange over HTTP.** Only the flow under test goes through the UI. Reach its starting state through the app's routes with `page.request`, which shares the browser's cookies, and through what the fakes hold. One test signs in through the UI; every other test starts signed in, by `page.request` or by a setup project that saves `storageState`, with one account per worker when tests change server state.
6. **Isolated data, clean start.** Every test works on records of its own, and reads back only those from the fakes. Each starts in Playwright's fresh browser context and runs alone in any order. A flow spread across `test.describe.serial` tests becomes one journey.
7. **One journey per test.** One flow, from its start to its outcome. It has as many steps and assertions as the flow has, one `expect` per thing a step shows.
8. **Time.** `page.clock` moves only the browser's clock: `setFixedTime` for what the page computes itself, such as a countdown or a date it formats. A case that depends on the server's clock moves to a route test, where the test controls it.
9. **A retry is a failure to fix.** Retry on CI only, with `trace: "on-first-retry"`. A test reported as flaky has a cause to find: a wait on the wrong thing, shared data, or a race in the app, which is a bug to report. Retries and timeouts stay at their values.

## Cases

For each critical flow in scope, a test for each of these that applies:

- **The flow, once, to its outcome**: what the user sees at the end, what each fake received, and what is still there after `page.reload()`.
- **One failure the user recovers from**, such as a declined payment followed by a successful one.
- **What only a real browser proves**, where the flow depends on it: the first click after hydration, a redirect to a third party and back, cookies or storage across a reload or a second tab, focus and keyboard use, a layout that changes at a breakpoint.
- **Signing in through the UI**, once.
- **An accessibility scan**, where the project has `@axe-core/playwright`, at each page the journey reaches, once its state is showing: `expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])`. A scan finds only some problems, so a clean one proves only those are absent. A violation is a bug under **Refactoring**: pin it with `.disableRules([ruleId])`, next to a `test.skip` that scans with the rule on. A project without the package gets a line in the report.

Each validation message, status code and format is proved at a faster level. Screenshot assertions and extra browser projects stay where the project already has them, and a refactor adds neither.

## Running

Browser tests run under Playwright in place of `pnpm test`, for each round and for the final check, and a pinned bug's skipped test is `test.skip`. They pass with retries off, shuffled and repeated, then one at a time:

```bash
pnpm playwright test --retries=0 --shuffle --repeat-each=3 --fail-on-flaky-tests
pnpm playwright test --retries=0 --workers=1
```

Leave out a flag the project's Playwright doesn't list under `playwright test --help`.

## Speed

**Budget: 3 s per test.** The **File** level has no budget here: `webServer` and the sign-in setup are paid once per run, and the build once per change to the app's code.

Measure as **Speed** says, in a table of its own with a `Browser` category at `"budget_ms": 3000` and a category with no budget for setup projects. In step 2 run `pnpm playwright test --retries=0 --workers=1 --reporter=<skill-dir>/scripts/playwright-speed-reporter.mjs > <tmp>/pass.log`, with Playwright's `rootDir`-relative paths as the map's keys. For the suite's CPU time, wrap the same command in `/usr/bin/time -p`.

The usual causes:

- **Signing in through the UI** in every test.
- **Arranging by clicking** what a request could set up.
- **A dev server** compiling each route on first visit.
- **Rebuilding the app** for a round that changed only tests.
- **Fixed sleeps**, `waitForTimeout` or `networkidle`.
- **Real third-party requests** the page waits on: stub them with `page.route`.
- **Trace or video always on.**

## Naming

- The outer `test.describe` is the flow: `test.describe("Checkout")`.
- Each `test` names who does what, and its outcome: `"a customer buys a mug"`, `"a declined card, then a good one"`.

Read only the `describe` and `test` lines: they should list every critical flow, and every case of each.

## Shape

```ts
test.describe("Checkout", () => {
  test("a customer buys a mug", async ({ page, payments }) => {
    const customer = await signUp(page.request);

    await page.goto("/basket");
    await page.getByRole("button", { name: "Pay £12.00" }).click();

    await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
    await expect
      .poll(() => payments.chargesFor(customer.id))
      .toEqual([{ amount: 1200, currency: "gbp" }]);
    await page.reload();
    await expect(page.getByText("Paid")).toBeVisible();
  });
});
```

`signUp` creates a customer through the app's own route, and its session cookie lands in the browser. `payments` is a fixture that reads what the fake payments server received.
