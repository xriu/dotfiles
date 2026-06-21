import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { spawn } from 'node:child_process';
import { archDir, viewerDir, flag, cwd } from './util.mjs';

// open a URL in the system's default browser; best-effort, never throws
function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  } catch { /* headless / no browser — the printed URL still works */ }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

export function run(args) {
  if (!existsSync(join(archDir, 'data.js'))) throw new Error('no .archlet/ here — generate the map first by running the `archlet` skill in your coding agent (e.g. Claude Code): install with `npx skills add superdesigndev/archlet`, then ask it to map this repo');
  const port = +flag(args, '--port', 4173);

  const srv = createServer((req, res) => {
    let p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    if (p === '/' || p === '\\') p = '/index.html';
    // data.js + diffs/* belong to the user's .archlet; everything else is the packaged viewer
    const fromArch = p === '/data.js' || p.startsWith('/diffs/');
    const cands = fromArch ? [join(archDir, p)] : [join(viewerDir, p), join(archDir, p)];
    const file = cands.find(f => existsSync(f) && statSync(f).isFile());
    if (!file) {
      // tolerate a missing diff registry so .archlet only needs data.js
      if (p === '/diffs/manifest.js') {
        res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' });
        return res.end('window.DIFFS = { default: null, available: [] };');
      }
      res.writeHead(404); return res.end('not found: ' + p);
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    // inject the absolute repo root onto window.ARCH so the viewer can turn the
    // repo-relative `file:line` provenance into absolute editor deep-links (open-in-editor)
    if (fromArch && p === '/data.js') {
      return res.end(readFileSync(file, 'utf8') + `\nif (window.ARCH) window.ARCH.root = ${JSON.stringify(cwd)};\n`);
    }
    res.end(readFileSync(file));
  });
  const open = !flag(args, '--no-open', false);
  srv.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`archlet → ${url}   (serving ${archDir})`);
    if (open) openBrowser(url);
    console.log('Ctrl+C to stop');
  });
}
