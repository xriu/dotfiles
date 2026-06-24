#!/usr/bin/env node
const [cmd, ...rest] = process.argv.slice(2);

const HELP = `archlet — view an architecture map produced by the archlet skill.

  archlet view [--port 4173]        serve .archlet/ (the map) at localhost + open browser
                  [--no-open]       don't auto-open the browser
  archlet validate [path]           check .archlet/ data + diffs against the schema

Everything else (generating .archlet/data.js, diffs, etc.) is done by the
\`archlet\` Claude Code skill — install it with:  npx skills add superdesigndev/archlet`;

const COMMANDS = new Set(['view', 'validate']); // each command is backed by a same-named lib/<cmd>.mjs

if (!cmd || ['help', '-h', '--help'].includes(cmd)) { console.log(HELP); process.exit(0); }
if (!COMMANDS.has(cmd)) { console.error('unknown command: ' + cmd + '\n'); console.log(HELP); process.exit(1); }

import(new URL(`../lib/${cmd}.mjs`, import.meta.url))
  .then(m => m.run(rest))
  .catch(e => { console.error('error: ' + (e && e.message || e)); process.exit(1); });
