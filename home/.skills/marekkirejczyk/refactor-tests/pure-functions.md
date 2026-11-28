# Pure functions

A **pure function** computes its output from its input alone: no I/O, no clock, no randomness, no state it changes. Its test is a table of examples: this input gives that output.

## Rules

1. **Pure first.** Most of the implementation lives in pure functions, at every layer: domain logic, and the helpers of services, repositories, route handlers and UI. Wherever a pure function can do the job, write one. Classes, I/O and framework code stay thin: they gather the input, call the pure function, and act on its output. Pass what would make a function impure (the time, an ID) in as an argument.
2. **Input, call, output.** Each test builds the input, calls the function once, and compares the whole output: `expect(fn(input)).toEqual(output)`. Both the input and the expected output are written out in the test, as literal values.
3. **One example per test.** Each example differs from its neighbours in one visible way, and that difference is what the test is about.
4. **Tested directly.** Each pure function is tested by calling it, in its own module's test file, not only through the class that calls it.

## Cases

For each non-trivial pure function, a test for each of these that applies:

- **Every branch**: one example per path through the function.
- **Every edge of a bound**: one example just inside, one just outside, one exactly on it.
- **Empty and full input**: an empty string, list or object, and one with every optional field set.
- **Values at a type's edge**: zero, a negative number, the longest allowed string, characters outside ASCII.

A trivial function (a one-line rename, getter or pass-through) needs no test of its own.

## Speed

**Budget: 5 ms per test.** A pure function has nothing to wait for, so one over budget has hidden I/O or a very large input: find out which.

## Naming

- The outer `describe` is the function: `describe("slugOf")`. A module of several functions gets a nested `describe` per function.
- Each `it` names the example input in a few words: `"a plain title"`, `"a title that ends in punctuation"`.

## Shape

```ts
describe("slugOf", () => {
  it("a plain title", () => {
    const title = "Show mileage as a chart";
    expect(slugOf(title)).toEqual("show-mileage-as-a-chart");
  });

  it("a title that ends in punctuation", () => {
    const title = "Fix: plates!";
    expect(slugOf(title)).toEqual("fix-plates");
  });
});
```
