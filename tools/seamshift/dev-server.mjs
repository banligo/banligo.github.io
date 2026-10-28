import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.env.PORT || 5173);
const types = { '.js': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(404, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store' });
      res.end(await readFile(resolve(root,'404.html'))); return;
    }
    const filename = resolve(root, `.${pathname}`);
    const allowed = filename.startsWith(resolve(root, 'seamshift') + sep) || filename === resolve(root, 'seamshift') || filename.startsWith(resolve(root, 'assets/seamshift') + sep) || filename === resolve(root, 'favicon.ico');
    if (!allowed) { res.writeHead(404); res.end('Use Jekyll to preview the personal site. Game: /seamshift/'); return; }
    const path = (await stat(filename)).isDirectory() ? resolve(filename, 'index.html') : filename;
    const contents = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(contents);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Geometry Maze → http://127.0.0.1:${server.address().port}/seamshift/`));
