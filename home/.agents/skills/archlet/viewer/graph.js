/* archlet architecture map — ENGINE (rendering + interaction)
 * ----------------------------------------------------------------------------
 * You normally don't edit this. The map's content lives in architecture.data.js;
 * styling lives in architecture.css. The only thing here you might tweak is the
 * THEME block (layer colors / labels) and the LAYOUT tuning constants below.
 *
 * Loaded as a classic <script> AFTER d3 (global `d3`) and architecture.data.js
 * (global `window.ARCH`), so it works from file:// without a server.
 * ----------------------------------------------------------------------------
 */
(function () {
  const d3 = window.d3;
  if (!d3 || !window.ARCH) {
    document.body.insertAdjacentHTML('beforeend',
      '<div style="position:fixed;inset:0;display:grid;place-items:center;color:#b66;font-family:monospace">' +
      'Failed to load D3 or data. Check your connection (D3 is loaded from a CDN) and refresh.</div>');
    return;
  }

  start();

  function start() {
  const nodes = window.ARCH.nodes;

  // ── TITLE: name the map after the analysed project, not a hardcoded brand ──
  // `config.project` is set per repo by the `archlet` skill; fall back gracefully.
  const rawProject = (window.ARCH.config && window.ARCH.config.project) || '';
  const project = rawProject ? rawProject.charAt(0).toUpperCase() + rawProject.slice(1) : '';
  const heading = project ? project + ' Architecture Map' : 'Architecture Map';
  document.title = project ? project + ' · Architecture Map' : 'Architecture Map';
  const h1 = document.querySelector('header h1');
  if (h1) h1.textContent = heading;
  let PR = window.ARCH.pr || null; // active diff overlay (loaded on demand by the Diffs menu)

  // ── open-in-editor ──────────────────────────────────────────────────────────
  // Turn a repo-relative `file:line` provenance string into an editor deep-link.
  // There is no universal "open in my editor" scheme, so the target is a configurable
  // URL template. Default is VS Code; switch with ?editor=<key> or archletSetEditor(<key>)
  // (persisted in localStorage). VS Code-family links need an absolute path, which the
  // `archlet view` server injects as window.ARCH.root; opening from file:// won't have it.
  const EDITOR_PRESETS = {
    vscode:    'vscode://file/{abs}:{line}:{col}',
    cursor:    'cursor://file/{abs}:{line}:{col}',
    windsurf:  'windsurf://file/{abs}:{line}:{col}',
    vscodium:  'vscodium://file/{abs}:{line}:{col}',
    jetbrains: 'jetbrains://idea/navigate/reference?path={abs}',
  };
  const REPO_ROOT = ((window.ARCH && window.ARCH.root) || '').replace(/\/+$/, '');
  (function () { const q = new URLSearchParams(location.search).get('editor');
    if (q && EDITOR_PRESETS[q]) try { localStorage.setItem('archlet.editor', q); } catch {} })();
  function editorTemplate() {
    let key; try { key = localStorage.getItem('archlet.editor'); } catch {}
    return (key && EDITOR_PRESETS[key]) || EDITOR_PRESETS.vscode;
  }
  window.archletSetEditor = k => {
    if (!EDITOR_PRESETS[k]) return console.warn('[archlet] unknown editor; options:', Object.keys(EDITOR_PRESETS).join(', '));
    try { localStorage.setItem('archlet.editor', k); } catch {}
    console.log('[archlet] editor →', k);
  };
  function openInEditor(src) {
    if (!src) return;
    const m = String(src).match(/^(.*?):(\d+)(?::(\d+))?$/);
    const file = (m ? m[1] : String(src)).replace(/^\/+/, ''), line = m ? m[2] : '1', col = (m && m[3]) || '1';
    if (!REPO_ROOT) console.warn('[archlet] no repo root — absolute editor links need `npx archlet view`; sending a relative path.');
    const abs = REPO_ROOT ? REPO_ROOT + '/' + file : file;
    const url = editorTemplate().replace('{abs}', abs).replace('{file}', file).replace('{line}', line).replace('{col}', col);
    window.location.href = url;
  }
  // a node's clickable target: its key file (rt), falling back to its dir (path)
  function openNode(d) {
    let f = (d.rt || '').split(/[,\s]+/).filter(Boolean)[0] || d.path;
    if (!f) return;
    if (!f.includes('/') && d.path) f = d.path.replace(/\/+$/, '') + '/' + f;
    openInEditor(f);
  }

  // render links are derived from the model edges: drop an import edge when a
  // non-import edge already connects the same pair; dedupe by (s,t,k).
  const baseLinks = (() => {
    const edges = window.ARCH.edges || [];
    const nonImport = new Set(edges.filter(e => e.k !== 'import').map(e => e.s + '|' + e.t));
    const seen = new Set(), out = [];
    for (const e of edges) {
      if (e.k === 'import' && nonImport.has(e.s + '|' + e.t)) continue;
      const key = e.s + '|' + e.t + '|' + (e.k || '');
      if (seen.has(key)) continue; seen.add(key);
      out.push({ s: e.s, t: e.t, l: e.l, k: e.k });
    }
    return out;
  })();

  // ── THEME: per-layer border / text / fill colors + legend labels ──────────
  // Layers come from window.ARCH.config.layers (generated per repo by `archlet`);
  // this palette is the built-in default / fallback when no config is present.
  const DEFAULT_LAYERS = {
    fe:  { label: 'Frontends',         border: '#9db8d6', ink: '#3b6fb0' },
    cp:  { label: 'Control Plane',     border: '#d6c08f', ink: '#8a6d22' },
    rt:  { label: 'Agent Runtime',     border: '#a7d0bb', ink: '#3f8f6b' },
    eng: { label: 'Shared Engine',     border: '#7fb0ff', ink: '#2f6db0', fill: '#eef4fc' },
    sub: { label: 'Engine Internals',  border: '#8fcccc', ink: '#2f8a8a' },
    pkg: { label: 'Shared Packages',   border: '#cbb3da', ink: '#7a4fa6' },
    ext: { label: 'External Services', border: '#cfc6b8', ink: '#6b6256', fill: '#f3f1ea' },
  };
  const LAYERS = (window.ARCH.config && window.ARCH.config.layers) || DEFAULT_LAYERS;
  const pick = (f, d) => Object.fromEntries(Object.entries(LAYERS).map(([k, v]) => [k, v[f] != null ? v[f] : d]));
  const BORDER = pick('border', '#cfc6b8');
  const INK    = pick('ink', '#6b6256');
  const FILL   = pick('fill'); // undefined where a layer has no fill — call sites already fall back to '#fff'
  const LAYER  = pick('label', '');

  // ── LAYOUT tuning ─────────────────────────────────────────────────────────
  const DIST   = { inner: 150, import: 195, base: 215 };
  const CHARGE = -1500;
  const COLLIDE_PAD = 32;
  // approx glyph advance (px) per text style — used to size boxes and wrap text
  const CHAR_W = { name: 7.1, brief: 5.2, method: 5.6, wrap: 4.7 };

  // build the legend from the theme so colors live in one place;
  // each row toggles the visibility of its layer's modules
  const hiddenLayers = new Set();
  (function buildLegend() {
    const el = document.getElementById('legend');
    if (!el) return;
    el.innerHTML = Object.keys(LAYER).map(k =>
      `<div class="row" data-layer="${k}" title="click to hide / show this layer"><span class="sw" style="border-color:${BORDER[k]};background:${FILL[k] || '#fff'}"></span>${LAYER[k]}</div>`
    ).join('');
    el.querySelectorAll('.row').forEach(row => row.addEventListener('click', () => {
      const k = row.dataset.layer;
      hiddenLayers.has(k) ? hiddenLayers.delete(k) : hiddenLayers.add(k);
      row.classList.toggle('off', hiddenLayers.has(k));
      draw(true);
    }));
  })();

  // ── hierarchy helpers ─────────────────────────────────────────────────────
  const byId = new Map(nodes.map(n => [n.id, n]));
  const childrenOf = {};
  nodes.forEach(n => { if (n.parent) (childrenOf[n.parent] ||= []).push(n.id); });
  const isCollapsible = id => !!(childrenOf[id] && childrenOf[id].length);
  const containLinks = nodes.filter(n => n.parent).map(n => ({ s: n.parent, t: n.id, k: 'inner' }));

  // word-wrap a string to a pixel width (approx; SVG text has no auto-wrap)
  function wrapText(text, width) {
    if (!text) return [];
    const maxChars = Math.max(10, Math.floor((width - 18) / CHAR_W.wrap));
    const lines = []; let cur = '';
    for (let w of text.split(/\s+/)) {
      while (w.length > maxChars) { if (cur) { lines.push(cur); cur = ''; } lines.push(w.slice(0, maxChars)); w = w.slice(maxChars); }
      if (!cur) cur = w;
      else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  // box size + top-down internal layout (offsets relative to box top)
  nodes.forEach(n => {
    // id is an internal unique slug; show a human heading instead, and only keep brief
    // as a subtitle when it isn't already serving as the heading.
    n._head = n.name || n.brief || n.id;
    const sub = n.name ? (n.brief || '') : '';
    const wName = n._head.length * CHAR_W.name, wBrief = sub.length * CHAR_W.brief;
    const mNames = (n.methods || []).map(m => m.name.length);
    const wMeth = mNames.length ? Math.max(...mNames) * CHAR_W.method + 16 : 0;
    n.w = Math.max(108, Math.min(232, Math.max(wName, wBrief, wMeth) + 30));
    n.briefLines = wrapText(sub, n.w);
    let y = 13; const L = { nameY: y, briefYs: [], methodYs: [] };
    y += 3;
    for (let i = 0; i < n.briefLines.length; i++) { y += 10; L.briefYs.push(y); }
    if (n.methods && n.methods.length) {
      y += 6; L.dividerY = y; y += 5;
      for (let i = 0; i < n.methods.length; i++) { y += 11; L.methodYs.push(y); }
      y += 5;
    } else { y += 8; }
    n.h = Math.max(30, y);
    n._layout = L;
  });

  // degree → hub flag (over full graph)
  const deg = {};
  baseLinks.concat(containLinks).forEach(l => { deg[l.s] = (deg[l.s] || 0) + 1; deg[l.t] = (deg[l.t] || 0) + 1; });
  nodes.forEach(n => { n.deg = deg[n.id] || 1; n.hub = n.deg >= 6; });

  const expanded = new Set();
  function visible(n) { let p = n.parent; while (p) { if (!expanded.has(p)) return false; p = byId.get(p).parent; } return true; }
  function lift(id) { let n = byId.get(id); while (n.parent && !expanded.has(n.parent)) n = byId.get(n.parent); return n.id; }

  function computeView() {
    const vnodes = nodes.filter(n => visible(n) && !hiddenLayers.has(n.g));
    const vis = new Set(vnodes.map(n => n.id));
    const seen = new Set(); const vlinks = [];
    for (const l of baseLinks) {
      const s = lift(l.s), t = lift(l.t);
      if (s === t || !vis.has(s) || !vis.has(t)) continue;
      const key = s + '__' + t + '__' + (l.k || '');
      if (seen.has(key)) continue; seen.add(key);
      vlinks.push({ s, t, k: l.k, l: l.l });
    }
    for (const n of nodes) if (n.parent && expanded.has(n.parent) && vis.has(n.id) && vis.has(n.parent)) vlinks.push({ s: n.parent, t: n.id, k: 'inner' });
    applyLinkDiff(vlinks);
    return { vnodes, vlinks };
  }

  // diff link overlay: tag connections the active diff adds/cuts, and inject ones
  // that aren't already on the map (a cut edge usually no longer exists; a new one not yet).
  // Endpoints are lifted to their visible ancestor so it works while subsystems are collapsed.
  function applyLinkDiff(vlinks) {
    if (!PR || !PR.links) return;
    const tag = {}, want = [];
    for (const kind of ['add', 'cut']) for (const e of (PR.links[kind] || [])) {
      if (!byId.has(e.s) || !byId.has(e.t)) continue;
      const s = lift(e.s), t = lift(e.t);
      if (s === t) continue;            // both endpoints collapsed into the same box
      tag[s + '>' + t] = kind;
      want.push({ s, t, kind });
    }
    for (const l of vlinks) { const c = tag[l.s + '>' + l.t]; if (c) l.chg = c; }
    const present = new Set(vlinks.map(l => l.s + '>' + l.t));
    for (const e of want) {
      const key = e.s + '>' + e.t;
      if (present.has(key)) continue; present.add(key);
      vlinks.push({ s: e.s, t: e.t, chg: e.kind, synth: true });
    }
  }

  // ── svg scaffold ──────────────────────────────────────────────────────────
  const svg = d3.select('svg');
  const W = () => svg.node().clientWidth || window.innerWidth;
  const H = () => svg.node().clientHeight || window.innerHeight;
  svg.append('defs').html(`
    <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="#5a554a"/></marker>
    <marker id="arrow-add" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="#4f9b76"/></marker>
    <marker id="arrow-method" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="#5b8bd0"/></marker>
  `);
  const root = svg.append('g');
  const linkG = root.append('g');
  const labelG = root.append('g');
  const nodeG = root.append('g');
  const methodEdgeG = root.append('g'); // above nodes so method lines reach the row dots

  const zoom = d3.zoom().scaleExtent([0.2, 4]).on('zoom', e => root.attr('transform', e.transform));
  svg.call(zoom).on('mousedown.cursor', () => svg.classed('grabbing', true)).on('mouseup.cursor', () => svg.classed('grabbing', false));

  let nodeSel, linkSel, elabelSel, diffmarkSel, adj = {};
  let labelsOn = true, movedFlag = false, seedCounter = 0, focusId = null;

  const sim = d3.forceSimulation([])
    .force('link', d3.forceLink([]).id(d => d.id)
      .distance(d => d.k === 'inner' ? DIST.inner : d.k === 'import' ? DIST.import : DIST.base)
      .strength(d => d.k === 'inner' ? 0.5 : 0.2))
    .force('charge', d3.forceManyBody().strength(CHARGE))
    .force('collide', d3.forceCollide().radius(d => Math.max(d.w, d.h) / 2 + COLLIDE_PAD))
    .on('tick', tick);

  function center() { sim.force('x', d3.forceX(W() / 2).strength(0.05)); sim.force('y', d3.forceY(H() / 2).strength(0.05)); }
  center();

  // rounded horizontal elbow: sx,sy → turn column at mx → tx,ty (square fallback when there's no room for the fillet)
  function hElbow(sx, sy, tx, ty, mx, r) {
    if (Math.abs(ty - sy) < 2 * r || Math.abs(mx - sx) < r || Math.abs(mx - tx) < r) return `M${sx},${sy}H${mx}V${ty}H${tx}`;
    const a = mx >= sx ? 1 : -1, b = tx >= mx ? 1 : -1, vd = ty >= sy ? 1 : -1;
    return `M${sx},${sy}H${mx - a * r}Q${mx},${sy} ${mx},${sy + vd * r}V${ty - vd * r}Q${mx},${ty} ${mx + b * r},${ty}H${tx}`;
  }

  // orthogonal (elbow) connector between two boxes, with rounded corners
  function orthPath(s, t) {
    const dx = t.x - s.x, dy = t.y - s.y, r = 8;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const sg = dx >= 0 ? 1 : -1;
      const sx = s.x + sg * s.w / 2, tx = t.x - sg * t.w / 2;
      return hElbow(sx, s.y, tx, t.y, (sx + tx) / 2, r);
    }
    const sg = dy >= 0 ? 1 : -1;
    const sy = s.y + sg * s.h / 2, ty = t.y - sg * t.h / 2, my = (sy + ty) / 2;
    if (Math.abs(t.x - s.x) < 2 || Math.abs(my - sy) < r || Math.abs(my - ty) < r) return `M${s.x},${sy}V${my}H${t.x}V${ty}`;
    const hd = t.x >= s.x ? 1 : -1;
    return `M${s.x},${sy}V${my - sg * r}Q${s.x},${my} ${s.x + hd * r},${my}H${t.x - hd * r}Q${t.x},${my} ${t.x},${my + sg * r}V${ty}`;
  }

  function tick() {
    if (linkSel) linkSel.attr('d', d => orthPath(d.source, d.target));
    if (elabelSel) elabelSel.attr('x', d => (d.source.x + d.target.x) / 2).attr('y', d => (d.source.y + d.target.y) / 2 - 2);
    if (diffmarkSel) diffmarkSel.attr('x', d => (d.source.x + d.target.x) / 2).attr('y', d => (d.source.y + d.target.y) / 2 + 4);
    if (nodeSel) nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
    if (focusId) positionMethodEdges(); // re-point the focused node's method edges as nodes drift
  }

  // absolute [x,y] of method row i's dot (left of the row)
  function methodPort(n, i) { return [n.x - n.w / 2 + 12, n.y - n.h / 2 + n._layout.methodYs[i] - 3]; }

  // method-level call edges for the focused node: resolved ONCE on focus/redraw, re-pointed cheaply each tick
  let focusEdges = [], medgeSel = null;
  function setFocus(id) {
    focusId = id;
    focusEdges = [];
    if (id != null && nodeSel) {
      const vis = new Map(); nodeSel.each(d => vis.set(d.id, d));
      for (const e of (window.ARCH.methodEdges || [])) {
        if (e.sNode !== id && e.tNode !== id) continue;
        const s = vis.get(e.sNode), t = vis.get(e.tNode);
        if (!s || !t || !s.methods || !t.methods) continue;
        const si = s.methods.findIndex(m => m.name === e.sMethod);
        const ti = t.methods.findIndex(m => m.name === e.tMethod);
        if (si >= 0 && ti >= 0) focusEdges.push({ s, t, si, ti });
      }
    }
    medgeSel = methodEdgeG.selectAll('path').data(focusEdges).join('path').attr('class', 'medge').attr('marker-end', 'url(#arrow-method)');
    positionMethodEdges();
  }
  function positionMethodEdges() {
    if (!medgeSel) return;
    medgeSel.attr('d', e => {
      const [sx, sy] = methodPort(e.s, e.si), [tx, ty] = methodPort(e.t, e.ti);
      // both dots sit on the left of their rows: run out to a shared channel left of both boxes, then in
      const lx = Math.min(e.s.x - e.s.w / 2, e.t.x - e.t.w / 2) - 22;
      return hElbow(sx, sy, tx, ty, lx, 6);
    });
  }

  // seed adjacency only for linked nodes; isolated nodes fall back to {self} in onEnter
  function buildAdj(vlinks) { adj = {}; vlinks.forEach(l => { (adj[l.s] ||= new Set([l.s])).add(l.t); (adj[l.t] ||= new Set([l.t])).add(l.s); }); }

  const drag = d3.drag()
    .on('start', (e, d) => { movedFlag = false; if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (e, d) => { movedFlag = true; d.fx = e.x; d.fy = e.y; })
    .on('end', (e) => { if (!e.active) sim.alphaTarget(0); });

  const tip = document.getElementById('tip');
  function onEnter(e, d) {
    const near = adj[d.id] || new Set([d.id]);
    nodeSel.classed('dim', n => !near.has(n.id)).classed('hot', n => n.id === d.id);
    linkSel.classed('dim', l => l.source.id !== d.id && l.target.id !== d.id).classed('hot', l => l.source.id === d.id || l.target.id === d.id);
    elabelSel.classed('show', l => l.source.id === d.id || l.target.id === d.id); // always reveal this node's labels on hover
    const act = isCollapsible(d.id) ? `<div class="t-act">▸ click to ${expanded.has(d.id) ? 'collapse' : 'expand'} (${childrenOf[d.id].length} modules)</div>` : '';
    const openHint = (d.methods && d.methods.length) ? '⌘/⌥-click node or a method to open in editor' : '⌘/⌥-click to open in editor';
    tip.innerHTML = `<div class="t-name">${d._head}</div><div class="t-layer">${LAYER[d.g]}</div><div class="t-role">${d.role}</div><div class="t-rt">${d.rt}</div>${act}<div class="t-act">${openHint}</div>`;
    tip.style.opacity = 1;
    setFocus(d.id); // method-level call edges for this module
  }
  function onMove(e) { const pad = 16; let x = e.clientX + pad, y = e.clientY + pad; if (x + 312 > innerWidth) x = e.clientX - 312; if (y + tip.offsetHeight > innerHeight) y = e.clientY - tip.offsetHeight - pad; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  function onLeave() { nodeSel.classed('dim', false).classed('hot', false); linkSel.classed('dim', false).classed('hot', false); elabelSel.classed('show', labelsOn); tip.style.opacity = 0; setFocus(null); }
  function onClick(e, d) {
    if (movedFlag) return;
    if (e.metaKey || e.altKey) { e.stopPropagation(); openNode(d); return; }
    if (!isCollapsible(d.id)) return;
    e.stopPropagation();
    if (expanded.has(d.id)) expanded.delete(d.id); else expanded.add(d.id);
    draw(true); onEnter(e, d);
  }

  function draw(reheat) {
    const { vnodes, vlinks } = computeView();
    vnodes.forEach(n => { if (n.x == null) { const p = n.parent && byId.get(n.parent); const a = (seedCounter++) * 0.7; n.x = (p ? p.x : W() / 2) + Math.cos(a) * (p ? 44 : 0); n.y = (p ? p.y : H() / 2) + Math.sin(a) * (p ? 44 : 0); } });
    vlinks.forEach(l => { l.source = l.s; l.target = l.t; });

    linkSel = linkG.selectAll('path').data(vlinks, d => d.s + '>' + d.t + '>' + (d.k || '') + '>' + (d.chg || ''))
      .join('path').attr('class', d => 'link ' + (d.k || '') + (d.chg ? ' ' + d.chg : (PR ? ' pr-dim' : '')))
      .attr('marker-end', d => d.chg === 'cut' ? null : d.chg === 'add' ? 'url(#arrow-add)'
        : (d.k === 'inner' ? null : 'url(#arrow)'));

    elabelSel = labelG.selectAll('text.edgelabel').data(vlinks.filter(d => d.l), d => d.s + '>' + d.t)
      .join('text').attr('class', 'edgelabel').classed('show', labelsOn)
      .classed('pr-dim', d => !!(PR && !d.chg)).attr('text-anchor', 'middle').text(d => d.l);

    // a ＋ / ✕ glyph at the midpoint of each added / severed connection
    diffmarkSel = labelG.selectAll('text.diffmark').data(vlinks.filter(d => d.chg), d => d.s + '>' + d.t + '>' + d.chg)
      .join('text').attr('class', d => 'diffmark ' + d.chg).attr('text-anchor', 'middle')
      .text(d => d.chg === 'add' ? '＋' : '✕');

    nodeSel = nodeG.selectAll('g.node').data(vnodes, d => d.id).join(
      enter => {
        const g = enter.append('g').attr('class', 'node');
        g.append('rect').attr('class', 'box').attr('rx', 8).attr('ry', 8)
          .attr('width', d => d.w).attr('height', d => d.h).attr('x', d => -d.w / 2).attr('y', d => -d.h / 2)
          .attr('fill', d => FILL[d.g] || '#fff').attr('stroke', d => BORDER[d.g]);
        g.each(function (d) {
          const gg = d3.select(this), L = d._layout, top = -d.h / 2;
          gg.append('text').attr('class', 'nm').attr('text-anchor', 'middle').attr('fill', INK[d.g])
            .attr('y', top + L.nameY).text(d._head);
          d.briefLines.forEach((line, i) => {
            gg.append('text').attr('class', 'bf').attr('text-anchor', 'middle').attr('y', top + L.briefYs[i]).text(line);
          });
          if (d.methods && d.methods.length) {
            gg.append('line').attr('class', 'mdiv').attr('x1', -d.w / 2 + 8).attr('x2', d.w / 2 - 8)
              .attr('y1', top + L.dividerY).attr('y2', top + L.dividerY);
            d.methods.forEach((mm, i) => {
              gg.append('circle').attr('class', 'mdot').attr('cx', -d.w / 2 + 12).attr('cy', top + L.methodYs[i] - 3).attr('r', 3.4);
              const mt = gg.append('text').attr('class', 'mth').attr('x', -d.w / 2 + 21).attr('y', top + L.methodYs[i]).text(mm.name);
              if (mm.src) mt.classed('clickable', true).on('click', e => { e.stopPropagation(); openInEditor(mm.src); });
            });
          }
        });
        const cg = g.filter(d => isCollapsible(d.id));
        cg.append('circle').attr('class', 'badge').attr('r', 7).attr('cx', d => d.w / 2).attr('cy', d => -d.h / 2).attr('stroke', d => INK[d.g]);
        cg.append('text').attr('class', 'badgetx').attr('x', d => d.w / 2).attr('y', d => -d.h / 2 + 3.5).attr('fill', d => INK[d.g]);
        g.call(drag).on('mouseenter', onEnter).on('mousemove', onMove).on('mouseleave', onLeave).on('click', onClick);
        return g;
      }, update => update, exit => exit.remove()
    );
    nodeSel.select('text.badgetx').text(d => expanded.has(d.id) ? '−' : '+');
    // diff overlay: change rings + change badges, fully data-driven so switching diffs updates live
    nodeSel.classed('changed', d => !!(PR && PR.nodes[d.id])).classed('contains', d => !!(PR && !PR.nodes[d.id] && PR.contains.includes(d.id)))
      .classed('pr-dim', d => !!(PR && !PR.nodes[d.id] && !PR.contains.includes(d.id)));
    nodeSel.each(function (d) {
      const g = d3.select(this), c = PR && PR.nodes && PR.nodes[d.id];
      g.select('text.chg').remove();
      if (c) {
        const t = g.append('text').attr('class', 'chg').attr('text-anchor', 'middle').attr('y', d.h / 2 + 10);
        t.append('tspan').attr('class', 'add').text(`+${c.add}`);
        t.append('tspan').attr('class', 'sep').text(' / ');
        t.append('tspan').attr('class', 'del').text(`−${c.del}`);
      }
    });

    buildAdj(vlinks);
    if (focusId != null) setFocus(focusId); // re-resolve focused method edges against the new node set
    sim.nodes(vnodes);
    sim.force('link').links(vlinks);
    if (reheat) sim.alpha(0.7).restart();
  }

  // pan/zoom so a world-space box {x,y,width,height} fills the viewport (capped scale, optional animation)
  function fitToBox(box, cap, duration) {
    const scale = Math.min(W() / box.width, H() / box.height, cap);
    const tx = W() / 2 - scale * (box.x + box.width / 2);
    const ty = H() / 2 - scale * (box.y + box.height / 2);
    (duration ? svg.transition().duration(duration) : svg).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }
  function fitView(animate) {
    const b = root.node().getBBox();
    if (!b.width || !isFinite(b.width)) return;
    fitToBox({ x: b.x - 70, y: b.y - 70, width: b.width + 140, height: b.height + 140 }, 1.1, animate ? 500 : 0);
  }

  // ── controls ──────────────────────────────────────────────────────────────
  const bL = document.getElementById('btn-labels');
  bL.onclick = () => { labelsOn = !labelsOn; bL.classList.toggle('on', labelsOn); elabelSel.classed('show', labelsOn); };
  const bE = document.getElementById('btn-expand');
  bE.onclick = () => {
    const anyCollapsed = nodes.some(n => isCollapsible(n.id) && !expanded.has(n.id));
    nodes.forEach(n => { if (isCollapsible(n.id)) { anyCollapsed ? expanded.add(n.id) : expanded.delete(n.id); } });
    bE.textContent = anyCollapsed ? 'Collapse all' : 'Expand all'; bE.classList.toggle('on', anyCollapsed);
    draw(true); setTimeout(() => fitView(true), 60);
  };
  let frozen = false;
  const bF = document.getElementById('btn-freeze');
  bF.onclick = () => { frozen = !frozen; bF.classList.toggle('on', frozen); if (frozen) sim.stop(); else sim.alpha(0.3).restart(); };
  document.getElementById('btn-reset').onclick = () => { nodes.forEach(n => { n.fx = null; n.fy = null; }); sim.alpha(1); for (let i = 0; i < 200; i++) sim.tick(); tick(); fitView(true); sim.alpha(0.25).restart(); };
  addEventListener('resize', () => { center(); sim.alpha(0.2).restart(); });

  // ── initial render: pre-settle synchronously, then fit ──────────────────────
  draw(false);
  nodes.forEach((n, i) => { const a = (i / nodes.length) * Math.PI * 2; n.x = W() / 2 + Math.cos(a) * 300; n.y = H() / 2 + Math.sin(a) * 230; });
  sim.alpha(1);
  for (let i = 0; i < 280; i++) sim.tick();
  tick();
  fitView(false);
  requestAnimationFrame(() => fitView(false));
  sim.alphaTarget(0).alpha(0.25).restart();

  // ── diff overlays: a menu of available diffs + runtime switching ─────────────
  const btnDiffs = document.getElementById('btn-pr'); // the toolbar button toggles the menu
  const menu = document.createElement('div'); menu.className = 'panel diffmenu'; document.body.appendChild(menu);
  const avail = ((window.DIFFS && window.DIFFS.available) || []).map(x => typeof x === 'string' ? { name: x } : x);
  const diffCache = {};

  function fitToNodes(ids) {
    const pts = nodeSel.data().filter(d => ids.includes(d.id));
    if (!pts.length) return;
    const xs = pts.map(d => d.x), ys = pts.map(d => d.y);
    const minx = Math.min(...xs) - 150, miny = Math.min(...ys) - 110;
    fitToBox({ x: minx, y: miny, width: Math.max(...xs) + 150 - minx, height: Math.max(...ys) + 110 - miny }, 1.5, 650);
  }
  function applyOverlay() {
    PR.contains.forEach(id => { if (isCollapsible(id)) expanded.add(id); });
    draw(true);
    setTimeout(() => fitToNodes(Object.keys(PR.nodes)), 140);
  }
  function clearOverlay() { draw(true); }
  function openMenu() { renderMenu(); menu.classList.add('show'); btnDiffs.classList.add('on'); }
  function closeMenu() { menu.classList.remove('show'); btnDiffs.classList.remove('on'); }
  function loadDiff(name, cb) {
    if (diffCache[name]) return cb(diffCache[name]);
    const s = document.createElement('script');
    s.src = 'diffs/' + name + '.js';
    s.onload = () => { diffCache[name] = window.ARCH.pr; cb(window.ARCH.pr); };
    s.onerror = () => { console.warn('[archlet] diff not found:', s.src); cb(null); };
    document.head.appendChild(s);
  }
  function selectDiff(name) { loadDiff(name, ov => { if (!ov) return clearDiff(); PR = ov; activeName = name; applyOverlay(); openMenu(); }); }
  function clearDiff() { PR = null; activeName = ''; clearOverlay(); renderMenu(); }
  let activeName = '';

  function diffItem(d, on) {
    const full = diffCache[d.name] || {};
    const label = d.label || (d.number ? 'PR #' + d.number : d.name);
    const title = d.title || full.title || '';
    const url   = d.url || full.url || '';
    const files = d.files != null ? d.files : full.files;
    const add   = d.add != null ? d.add : full.add;
    const del   = d.del != null ? d.del : full.del;
    const stat  = add != null ? `<span class="add">+${add}</span><span class="sep"> / </span><span class="del">−${del}</span>` : '';
    const meta  = [];
    if (files != null) meta.push(`${files} file${files === 1 ? '' : 's'}`);
    if (url) meta.push(`<a class="dm-link" href="${url}" target="_blank" rel="noopener">view ↗</a>`);
    return `<button class="dm-item${on ? ' on' : ''}" data-name="${d.name}">`
      + `<span class="dm-top"><span class="dm-label">${label}</span>${stat ? `<span class="dm-stat">${stat}</span>` : ''}</span>`
      + (title ? `<span class="dm-sub">${title}</span>` : '')
      + (meta.length ? `<span class="dm-meta">${meta.join('<span class="sep"> · </span>')}</span>` : '')
      + `</button>`;
  }
  function renderMenu() {
    menu.innerHTML = '<div class="dm-hd">Diff overlays</div>' +
      avail.map(d => diffItem(d, d.name === activeName)).join('') +
      `<button class="dm-item${!activeName ? ' on' : ''}" data-name=""><span class="dm-top"><span class="dm-label">None</span></span><span class="dm-sub">no overlay</span></button>`;
    menu.querySelectorAll('.dm-item').forEach(b => b.onclick = (e) => {
      if (e.target.closest('.dm-link')) return;       // let the external link click through
      e.stopPropagation();                            // keep the menu open so it reads as the active-diff panel
      const n = b.dataset.name; n ? selectDiff(n) : (clearDiff(), closeMenu());
    });
  }
  btnDiffs.onclick = (e) => { e.stopPropagation(); menu.classList.contains('show') ? closeMenu() : openMenu(); };
  document.addEventListener('click', () => { menu.classList.remove('show'); btnDiffs.classList.remove('on'); });
  if (!avail.length) btnDiffs.style.display = 'none';

  // initial overlay: ?diff=<name> | ?pr=<n> | manifest default
  const q = new URLSearchParams(location.search);
  const initial = q.get('diff') || (q.get('pr') ? 'pr-' + q.get('pr') : ((window.DIFFS && window.DIFFS.default) || null));
  if (initial) setTimeout(() => selectDiff(initial), 650);
  } // end start()
})();
