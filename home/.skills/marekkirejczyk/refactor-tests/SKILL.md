---
name: refactor-tests
description: Bring a file, class or branch's tests up to the rules for each test type, and cover every case. Run it with what to refactor, such as a file or a PR.
disable-model-invocation: true
---

# Refactor tests

Each **test type** has its own file next to this one: what the type checks, its rules, the cases it must cover, how its tests are named, and the shape of one. Find the type of each test in scope, read its file, and apply every rule in it.

| Test type                                   | File                |
| ------------------------------------------- | ------------------- |
| Browser tests (a real browser, the whole app) | `browser.md`      |
| Database round trips (a repository's tests) | `round-trips.md`    |
| Pure functions                              | `pure-functions.md` |
| Route handlers                              | `route-handlers.md` |
| Services                                    | `services.md`       |

Web component tests have no file here. **Push down** and the speed table apply to them, and those that stay are left as written.

**Never add browser tests to a project that has none.** No Playwright, no browser test files: write no browser test, add no Playwright dependency or config, and leave `browser.md` unread. A case only a browser could prove goes in the report as untested.

## Goal

The **scope** is what you were asked to write or refactor tests for: a file, a class, or a branch's changes. You are done when all four hold:

1. **Written to the rules.** Every test in scope whose type has a file here follows every rule of that file, with its naming and shape.
2. **Every case covered.** Every public method of the code in scope has tests, and every case its type's **Cases** list names has a test of its own, at the fastest level that can prove it. List the cases for each method before you write or move a test, then tick each one off against a named `it`; a case with no test is a gap, whatever else passes.
3. **Every cost within the scale.** Tests, files and the suite are within the budgets of **Speed** when measured, or reported as that section says.
4. **Every test at the fastest level that can prove it.** Each test in scope outside `pure-functions.md` has a verdict under **Push down**.

Then `pnpm format`, `pnpm lint` and `pnpm test` pass, and the tests also pass shuffled (`pnpm vitest run --sequence.shuffle <file>` in the test's package) and one at a time. Browser tests run as **Running** in `browser.md` says.

Work in this order: the baseline from **Speed**, **Push down**, the type's rules and cases, then **Speed**'s fixes. Each test then gets polished only once it has its final level.

## Push down

Be aggressive: a test stays at a slow level only for what the table below says only that level can prove. The ladder, fastest first, is pure function, service, route handler or web component, browser. For each test in scope that isn't a pure-function test, try the fastest rung first and stop at the first that can prove what the test checks. Write a one-line **verdict** for it in your working notes: _stays_ (what only this level proves), _moves_ (to which level) or _removed_ (the faster test that covers it).

| Level         | Stays at this level                                                 | Moves down                                        |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| Browser       | One journey per critical flow, and what needs a real browser        | Edge cases and logic, to route or component tests |
| Route handler | Each status code once, each outside service's wiring, each follow-up effect | Every further reason for a status          |
| Service       | Each outcome once, and what lands in the fakes                      | Decisions, to pure functions                      |
| Round trip    | SQL behaviour, filter edges and locks                               | Row mapping written in TypeScript                 |
| Web component | Rendering and interaction                                           | Formatting and state logic                        |

**Extract to test.** Pull out a small pure function when the code holds a real decision (a branch, a calculation, a parse) and the function gets a name from the domain. Move the code unchanged, under **Refactoring**, and keep it reachable through its module's real interface: a pass-through or a private helper made public only for a test stays where it is. When a test can only move by changing logic, its verdict is _stays_.

**Remove duplicates.** A test whose every assertion a faster or same-level test already proves is removed, slowest first. Search every test that exercises the code in scope. Change and delete only tests in scope, and report an out-of-scope duplicate with the faster test that covers it.

**Proof.** A test moves or goes only after the proof, one check per thing it asserted:

1. Name the faster test that covers it, writing that test first if it doesn't exist yet.
2. Temporarily break that behaviour in the code, and confirm a remaining test goes red.
3. Revert the break.

With no red test, the verdict is _stays_ until a faster test goes red on that break.

## Assertions

Write one `expect` per thing a test checks, in the order a reader asks about them: what came back, then each effect. Each failure then names the one thing that broke. Compare each thing whole (`toEqual` on the whole value), and keep unrelated values out of a shared array:

```ts
expect(response.status).toBe(201);
expect(await response.json()).toEqual({
  id: expect.stringMatching(UUID),
  total: 1200,
});
expect(payments.charges).toEqual([{ amount: 1200, currency: "gbp" }]);
```

Write out every value the test can know: an error message, a URL built from an ID it has, a time it set. Match a value it can't know (a generated ID, a token, a session URL) by its **shape**: `expect.stringMatching(/^[0-9a-f]{64}$/)` for a 32-byte hex token, a UUID pattern for an ID. A shape fails on an empty string, a wrong format or a value in the wrong field, where `expect.any(String)` passes them all.

On a page, a browser test uses Playwright's auto-retrying assertions instead of `toEqual` on a value it has read (rule 3 of `browser.md`).

## Refactoring

A refactor keeps the code's **semantics**: every caller sees the same answers, errors, writes and calls as before. Within that, change anything: tests and application code alike, interfaces as well as implementations (rename, move, split, merge, extract a pure function, change a signature and every caller with it).

**Split** big files as part of the refactor: above all, move helper functions out of the class or file that uses them into modules grouped by what they are about (an order's state changes in one, the text of its emails in another), each module with its own test file. Each module then has one subject, and its tests read as its list of cases. A split is a round like any other, priced before it is made (see **Speed**), because it multiplies whatever each test pays for.

Work in **rounds**: one change at a time, then `pnpm lint` and `pnpm test`, green before the next round. A test that goes red after a round means the round changed behaviour: undo it and take a smaller step.

A change of behaviour (a bug found, a case handled differently) is outside the refactor: report it, and leave the code as it behaves today, with a test that pins today's behaviour. Next to it, write the test for the right behaviour, red, and skip it (`it.skip`, Vitest's `xit`), named for the bug, so the fix only has to unskip it and delete the pin:

```ts
it("a negative amount (today: £-5)", () => {
  expect(formatPounds(-500)).toEqual("£-5");
});

it.skip("a negative amount (bug: should read -£5)", () => {
  expect(formatPounds(-500)).toEqual("-£5");
});
```

## Speed

One example per test with fresh state multiplies whatever each test's setup costs. One suite grew from 825 tests to 2,200 this way, and its CI run went from 6 minutes to past its 20-minute limit, while elapsed time on a 16-core laptop barely moved. So price the work, and measure it.

### The scale

A cost belongs at the highest level that can carry it.

| Level    | Paid                               | Budget                                                  | What belongs here                                                                       |
| -------- | ---------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Run**  | Once per `vitest run`              | Seconds are fine                                        | Compiling the app, running migrations once and saving a snapshot, building fixture templates, all in `globalSetup` |
| **File** | Once per test file                 | 100 ms, from the first import to the end of `beforeAll` | Importing the app, starting it, starting its database from the snapshot                 |
| **Test** | Every test, its own setup included | Its type's file; 100 ms for a test that needs fresh real state (a database or a subprocess of its own) | One request, one round trip, one call                 |

Vitest gives each test file a new process by default, so something kept in memory is gone by the next file: the run level hands its results on as files on disk.

**Suite:** the full suite's CPU time (user + system) rises by no more than 25% against the baseline, and fits CI's job limit if the project has one.

### Measuring

`<skill-dir>` is the folder holding this file.

- **Baseline first, on a clean checkout of the base commit,** on a quiet machine. Record the suite's CPU time, its test count, and each test's and file's cost. Note the machine's load, and treat a loaded run as rough.
- **Suite:** `/usr/bin/time -p pnpm test`, and add `user` and `sys`. Elapsed time hides extra work on a many-core machine, so the suite's check is CPU time.
- **Tests and files, by category:** one table per package the scope touches, before and after. `<tmp>` is a temporary directory outside the repository.
  1. Write `<tmp>/map.json`, giving each test file one category, for the files of both the before and the after state. Declare a category for each test type present, with its budget from its file, and for each other kind of test the package has (web components), with no `budget_ms`. `Services (fakes)` and `Services (real)` are separate categories, and a file mixing both takes the real one. A file left out shows as `Unclassified`.
     ```json
     {
       "file_budget_ms": <the File level's budget>,
       "categories": [{ "name": "Pure functions", "budget_ms": <its budget> }, { "name": "Web components" }],
       "files": { "src/slug.test.ts": "Pure functions" }
     }
     ```
  2. In the package, run the whole of it once, one file at a time: `pnpm vitest run --no-file-parallelism --reporter=<skill-dir>/scripts/speed-reporter.mjs > <tmp>/pass.log`.
  3. Re-run three times, to `<tmp>/rerun-1.log` and so on, the same command with the files that `node <skill-dir>/scripts/speed-table.mjs --map <tmp>/map.json --over <tmp>/pass.log` lists. Take the median of each line for anything you report as over budget.
  4. Print the table with `node <skill-dir>/scripts/speed-table.mjs --map <tmp>/map.json <tmp>/pass.log <tmp>/rerun-*.log`.

  **Total** and **Time share** include **Setup**: imports, setup files, `beforeAll` and `afterAll`. **Avg per test** and **Over budget** use each test's own time, `beforeEach` and `afterEach` included. Browser tests get a table of their own, measured with Playwright's reporter (**Speed** in `browser.md`). Tests any other runner owns are named in the report instead.

### Fixing

- **Price a change before making it.** Before a round that splits tests or gives each example fresh state, multiply the new test count by the setup cost per test. If the result breaks a budget, make the setup cheap first.
- **Find the cause first.** Each cost over budget gets a named cause, confirmed by measuring where its time goes. The type's file lists the usual suspects.
- **Fix in this order:**
  1. Prepare once per run and copy per test: a database snapshot, a template of a fixture. Tests stay isolated and usually don't change.
  2. Replace a real dependency with a fake, where the test's type allows it.
  3. Share expensive real fixtures across a file, only in a file whose tests only read, and say so in the report. This gives up some isolation, so it comes last.
- **Each fix is a round**, measured again afterwards.
- **Warm-up moves into setup.** Whatever only the first test would pay moves to `beforeAll`, because tests also run shuffled and any of them can be first.
- **Speed stays within the rules.** Every test keeps its type's rules, its cases, its assertions and its isolated data. Route tests stay black box against the whole app, framework included. Test timeouts and CI's `timeout-minutes` stay as they are.
- **Slow application code** is in scope when the fix keeps semantics, under **Refactoring**. A fix that would change behaviour is reported.

### Report

The first two items go in your final summary and in the PR description, the rest in your final summary. On the PR, add them as a `## Test speed` section, or replace that section when it exists: `gh pr edit` on an open PR, and the description itself when you open one.

- The category table of each package, before and after.
- Each test moved or removed, and the test that now covers it.
- Suite CPU time and test count, before and after.
- The slowest ten tests and files, before and after.
- Each test or file still over budget, with its time, its cause and the change that would fix it.
- Duplicates outside the scope, each with the faster test that covers it.
- Slow tests outside the scope or owned by another runner, left as they are.
