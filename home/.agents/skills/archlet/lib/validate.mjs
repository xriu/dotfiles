// archlet validate — shape + referential-integrity checks for the files the
// `archlet` skill generates. Zero deps; the schema lives in SPEC below.
//
// Shape mini-language (one token per field, whitespace-separated):
//   name:s        required string        name:s?    optional string
//   name:n        number                 name:b     boolean       name:o   any object
//   name:[t]      array of type t        name:(a|b) enum of literals
//   name:type     a nested object type defined elsewhere in SPEC
// A trailing `?` on the type makes the field optional.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, basename, relative } from 'node:path';
import vm from 'node:vm';

const SPEC = {
  // ── .archlet/data.js → window.ARCH ──
  arch:       'config:config nodes:[node] edges:[edge] methodEdges:[methodEdge]?',
  config:     'project:s layers:o',
  layer:      'label:s border:s? ink:s? fill:s?',
  node:       'id:s name:s g:s parent:s? brief:s role:s rt:s path:s? methods:[method]?',
  method:     'name:s src:s calls:n?',
  edge:       's:s t:s k:s l:s? src:s method:(mechanical|manual)',
  methodEdge: 'sNode:s sMethod:s tNode:s tMethod:s src:s',
  // ── .archlet/diffs/<name>.js → window.ARCH.pr ──
  pr:         'label:s title:s? url:s? number:n? add:n del:n files:n nodes:o contains:[s] links:links?',
  links:      'add:[link]? cut:[link]?',
  link:       's:s t:s',
  prNode:     'files:n add:n del:n paths:[s]',
  // ── .archlet/diffs/manifest.js → window.DIFFS ──
  diffs:      'default:s? available:[avail]',
  avail:      'name:s label:s? number:n? add:n? del:n? files:n?',
};

const SRC_RE = /.+:\d+$/; // "file:line"

// ── tiny spec interpreter ───────────────────────────────────────────────────
function checkVal(val, type, path, errs) {
  type = type.trim();
  if (type.startsWith('[') && type.endsWith(']')) {
    if (!Array.isArray(val)) return errs.push(`${path}: expected array`);
    return val.forEach((v, i) => checkVal(v, type.slice(1, -1), `${path}[${i}]`, errs));
  }
  if (type.startsWith('(') && type.endsWith(')')) {
    const opts = type.slice(1, -1).split('|');
    if (!opts.includes(val)) errs.push(`${path}: expected one of ${opts.join('|')}, got ${JSON.stringify(val)}`);
    return;
  }
  if (type === 's') return typeof val === 'string' || errs.push(`${path}: expected string`);
  if (type === 'n') return typeof val === 'number' || errs.push(`${path}: expected number`);
  if (type === 'b') return typeof val === 'boolean' || errs.push(`${path}: expected boolean`);
  if (type === 'o') return (val && typeof val === 'object') || errs.push(`${path}: expected object`);
  const spec = SPEC[type];
  if (!spec) return errs.push(`${path}: unknown type "${type}"`);
  checkFields(val, spec, path, errs);
}

function checkFields(obj, spec, path, errs) {
  if (obj == null || typeof obj !== 'object') return errs.push(`${path}: expected object`);
  for (const tok of spec.split(/\s+/).filter(Boolean)) {
    const ci = tok.indexOf(':');
    const name = tok.slice(0, ci);
    let type = tok.slice(ci + 1);
    const optional = type.endsWith('?');
    if (optional) type = type.slice(0, -1);
    const has = Object.prototype.hasOwnProperty.call(obj, name) && obj[name] != null;
    if (!has) { if (!optional) errs.push(`${path}.${name}: missing required field`); continue; }
    checkVal(obj[name], type, `${path}.${name}`, errs);
  }
}

// ── load a viewer data file (classic script assigning window.* globals) ──────
function loadGlobals(file) {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(file, 'utf8'), ctx, { filename: file });
  return ctx.window;
}

// ── referential integrity: the part a pure schema can't express ──────────────
function checkArchRefs(arch, errs) {
  const nodes = arch.nodes || [];
  const ids = new Set();
  for (const n of nodes) {
    if (ids.has(n.id)) errs.push(`node "${n.id}": duplicate id`);
    ids.add(n.id);
  }
  // config.layers is a typed map; validate each layer's shape once, up front —
  // independent of which nodes reference it (the SPEC mini-language has no map-of-type).
  const layerMap = (arch.config && arch.config.layers) || {};
  const layers = new Set(Object.keys(layerMap));
  for (const [k, v] of Object.entries(layerMap)) checkVal(v, 'layer', `config.layers.${k}`, errs);
  const methodsByNode = {};
  for (const n of nodes) {
    if (!layers.has(n.g)) errs.push(`node "${n.id}".g="${n.g}" is not a key in config.layers`);
    if (n.parent != null && !ids.has(n.parent)) errs.push(`node "${n.id}".parent="${n.parent}" is not a node id`);
    methodsByNode[n.id] = new Set((n.methods || []).map(m => m.name));
    for (const m of n.methods || []) if (!SRC_RE.test(m.src)) errs.push(`node "${n.id}" method "${m.name}".src="${m.src}" is not file:line`);
  }
  for (const [i, e] of (arch.edges || []).entries()) {
    if (!ids.has(e.s)) errs.push(`edge[${i}].s="${e.s}" is not a node id`);
    if (!ids.has(e.t)) errs.push(`edge[${i}].t="${e.t}" is not a node id`);
    if (!SRC_RE.test(e.src)) errs.push(`edge[${i}].src="${e.src}" is not file:line`);
  }
  for (const [i, me] of (arch.methodEdges || []).entries()) {
    for (const side of ['sNode', 'tNode']) if (!ids.has(me[side])) errs.push(`methodEdge[${i}].${side}="${me[side]}" is not a node id`);
    if (ids.has(me.sNode) && !methodsByNode[me.sNode].has(me.sMethod)) errs.push(`methodEdge[${i}].sMethod="${me.sMethod}" not in node "${me.sNode}".methods[]`);
    if (ids.has(me.tNode) && !methodsByNode[me.tNode].has(me.tMethod)) errs.push(`methodEdge[${i}].tMethod="${me.tMethod}" not in node "${me.tNode}".methods[]`);
    if (!SRC_RE.test(me.src)) errs.push(`methodEdge[${i}].src="${me.src}" is not file:line`);
  }
  return ids;
}

function checkDiffRefs(pr, nodeIds, errs, label) {
  for (const id of Object.keys(pr.nodes || {})) {
    if (!nodeIds.has(id)) errs.push(`${label}: nodes["${id}"] is not a node id in data.js`);
    else checkVal(pr.nodes[id], 'prNode', `${label}.nodes.${id}`, errs);
  }
  for (const id of pr.contains || []) if (!nodeIds.has(id)) errs.push(`${label}: contains "${id}" is not a node id`);
  for (const kind of ['add', 'cut']) for (const [i, l] of ((pr.links && pr.links[kind]) || []).entries()) {
    if (!nodeIds.has(l.s)) errs.push(`${label}: links.${kind}[${i}].s="${l.s}" is not a node id`);
    if (!nodeIds.has(l.t)) errs.push(`${label}: links.${kind}[${i}].t="${l.t}" is not a node id`);
  }
}

// ── entry point ──────────────────────────────────────────────────────────────
export async function run(args = []) {
  const target = args.find(a => !a.startsWith('-')) || '.archlet';
  const isDataFile = basename(target) === 'data.js';
  const dir = isDataFile ? resolve(target, '..') : resolve(target);
  const dataFile = isDataFile ? resolve(target) : join(dir, 'data.js');

  if (!existsSync(dataFile)) {
    console.error(`error: ${dataFile} not found — run the archlet skill (MAP mode) first.`);
    process.exit(1);
  }

  const errs = [];
  let nodeIds = new Set();
  let checked = 0;

  // 1) data.js
  const arch = loadGlobals(dataFile).ARCH;
  if (!arch) errs.push(`${rel(dataFile)}: window.ARCH was not assigned`);
  else {
    checkFields(arch, SPEC.arch, 'ARCH', errs);
    nodeIds = checkArchRefs(arch, errs);
    checked++;
    console.log(`  ${errs.length ? '·' : '✓'} ${rel(dataFile)} — ${(arch.nodes || []).length} nodes, ${(arch.edges || []).length} edges, ${(arch.methodEdges || []).length} method edges`);
  }

  // 2) diffs (optional)
  const diffsDir = join(dir, 'diffs');
  if (existsSync(diffsDir)) {
    const manifestFile = join(diffsDir, 'manifest.js');
    if (existsSync(manifestFile)) {
      const diffs = loadGlobals(manifestFile).DIFFS;
      if (!diffs) errs.push(`diffs/manifest.js: window.DIFFS was not assigned`);
      else { checkFields(diffs, SPEC.diffs, 'DIFFS', errs); checked++; }
    }
    for (const f of readdirSync(diffsDir).filter(f => f.endsWith('.js') && f !== 'manifest.js')) {
      const pr = loadGlobals(join(diffsDir, f)).ARCH?.pr;
      const label = `diffs/${f}`;
      if (!pr) { errs.push(`${label}: window.ARCH.pr was not assigned`); continue; }
      checkFields(pr, SPEC.pr, label, errs);
      checkDiffRefs(pr, nodeIds, errs, label);
      checked++;
      console.log(`  ${'✓'} ${label} — ${Object.keys(pr.nodes || {}).length} touched nodes`);
    }
  }

  if (errs.length) {
    console.error(`\n✗ ${errs.length} problem${errs.length === 1 ? '' : 's'}:\n`);
    for (const e of errs) console.error(`  • ${e}`);
    console.error('');
    process.exit(1);
  }
  console.log(`\n✓ valid — ${checked} file${checked === 1 ? '' : 's'} pass shape + referential checks.`);
}

function rel(p) { return relative(process.cwd(), p); }
