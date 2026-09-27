import assert from "node:assert/strict";
import { render } from "grok-mermaid";
import { normalizeSequenceSemicolons } from "./source.ts";

const screenshotDiagram = `sequenceDiagram
    actor Maintainer
    participant Main as main
    participant Release as Release workflow
    participant GitHub as Draft release
    participant S3 as Publish to S3

    Maintainer->>Main: Commit version change
    Maintainer->>Release: Run workflow_dispatch
    Release->>Release: Check tag; build and sign app
    Release->>GitHub: Create draft release
    Maintainer->>GitHub: Verify and publish draft
    Maintainer->>S3: Run workflow_dispatch with tag
    S3->>S3: Check tag is in main history
    S3->>S3: Notarize app; upload app and UpdateManifest`;

assert.equal(render(screenshotDiagram), null);
const fixedDiagram = normalizeSequenceSemicolons(screenshotDiagram);
assert.ok(fixedDiagram.includes("Check tag, build and sign app"));
assert.ok(fixedDiagram.includes("Notarize app, upload app and UpdateManifest"));
const art = render(fixedDiagram);
assert.ok(art);
assert.equal(art.width, 148);

const twoMessages = "sequenceDiagram\nA->>B: request; B->>C: validate";
assert.equal(normalizeSequenceSemicolons(twoMessages), twoMessages);
assert.ok(render(twoMessages));

const quotedLabel = 'sequenceDiagram\nA->>B: "one; two"';
assert.equal(normalizeSequenceSemicolons(quotedLabel), quotedLabel);

console.log("Mermaid sequence normalization passed.");
