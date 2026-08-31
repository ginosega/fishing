import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

await import('./build.mjs');

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'dist');

const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const host = valueAfter('--host') || '127.0.0.1';
const port = Number(valueAfter('--port') || 4173);

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.md', 'text/markdown; charset=utf-8']
]);

const server = http.createServer(async (req, res) => {
  try {
    const requested = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let pathname = decodeURIComponent(requested.pathname);
    if (pathname === '/') pathname = '/index.html';

    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(path.resolve(root) + path.sep) && filePath !== path.resolve(root, 'index.html')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    console.error(error);
    res.writeHead(500);
    res.end('Server error');
  }
});

server.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? '<this-computer-IP>' : host;
  console.log(`Fishing Companion is ready at http://${displayHost}:${port}`);
  if (host === '0.0.0.0') console.log('Use this computer’s LAN IP from another device on the same network.');
  console.log('Press Ctrl+C to stop.');
});
