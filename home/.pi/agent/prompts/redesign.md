---
description: Redesign a UI component with defects named from evidence, options compared, and a live check
argument-hint: "[component or file]"
---

Redesign ${1:-the component I name}. Keep its behavior.

Read before you change anything:

- The rules that govern it (product rules, architecture notes, the package guide).
- The components on the same page, for their tokens, spacing, and type scale.
- The brand guide, if the project has one.

Then work in this order.

1. Name the defects. One line each, with the evidence: the code, the DOM, the screenshot. Mark each one as fact or inference.
2. Write the criteria before you draw. Cover what the element must state, how it holds at 360px, and which existing pattern it must match.
3. Sketch two or three options in one static HTML file. Render it and look. Say which criterion killed each option you drop.
4. Implement the winner. Keep the behavior the same. Delete what the redesign makes dead: labels, keys, wrappers, tests.
5. Check the real page at 1280px and 420px. Run the typecheck, lint, build, and the affected tests. Report what you did not see.

State the goal in your first line, and the smallest change that meets it.

Do not add a dependency. Do not use a style word without a defect behind it. Do not widen the scope past the component I name.
