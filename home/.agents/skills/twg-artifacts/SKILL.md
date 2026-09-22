---
name: twg-artifacts
description: >
  Use with root `twg` when a user wants to share, publish, send, or update a
  standalone local or generated file as an Atlassian Artifact. Do not use for
  Jira or Confluence attachments.
---

# TWG artifacts

## CLI launcher fallback

Run `twg <command>`. On shell `command not found`, use `$HOME/.local/bin/twg`
(macOS/Linux) / `$env:LOCALAPPDATA\Programs\twg\bin\twg.exe` (PowerShell), then
tell user to add that directory to PATH. Do not treat auth or command errors as
PATH failures.

Use `twg artifacts file create <path>` when the user wants to share a
standalone local or generated file with coworkers, such as a generated HTML
report, Markdown document, or presentation. Return the created artifact URL
and metadata.

## HTML files

Upload only self-contained HTML. Embed the JavaScript, stylesheets, images, and
other required assets in the file; it cannot depend on local files such as
`./app.js`. Avoid browser-storage APIs such as `localStorage`,
`sessionStorage`, and IndexedDB: the artifact viewer's content security policy
may restrict them.

## Describe the content for search

Pass `--description <text>` with a concise summary of the file's actual
content. This description is indexed to improve artifact search. When the user
does not provide one, derive it from the content you created or inspected—not
only from its filename or media type. Do not invent content you have not read.

## Choose access for creation

<!-- Intentional: `open` is link-only within the organisation, whereas `shared`
makes an artifact discoverable. Artifacts are created to share with others, so
only unreviewed drafts stay private. -->

- Use `--access private` when the user has not had a chance to review a
  generated file. This is also the CLI default.
- Use `--access open` when the user has reviewed the generated file, or supplied
  the existing file for sharing. Pass it explicitly because the CLI default is
  `private`.
- If it is unclear whether the user reviewed the file, use `--access private`.

If the user explicitly wants the file attached to a Jira work item or
Confluence page, use that product's attachment commands instead.

Use `twg artifacts file get <artifact-id>` only to retrieve metadata for an
existing artifact.

Use `twg artifacts file update <artifact-id> [path]` to change an existing
artifact. Pass a replacement file path to publish new content; omit it to
change metadata such as the name, description, or access. For a content update,
derive `--description` from the replacement file's actual content when the user
has not provided one. Omit `--access` unless the user explicitly asks to change
visibility; an update otherwise preserves the artifact's existing access.
