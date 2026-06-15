import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '0.0.0.0';
const token = process.env.FOOTBALL_DATA_TOKEN || extractToken(await readFile(join(root, 'config.js'), 'utf8'));

function extractToken(configText) {
  return configText.match(/token:\s*'([^']+)'/)?.[1] || '';
}

function contentType(file) {
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
  }[extname(file)] || 'application/octet-stream';
}

async function proxyFootballData(req, res) {
  if (!token) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Falta FOOTBALL_DATA_TOKEN' }));
    return;
  }

  const upstreamPath = req.url.replace('/api/football-data/v4', '');
  const upstream = await fetch(`https://api.football-data.org/v4${upstreamPath}`, {
    headers: { 'X-Auth-Token': token },
  });
  const body = await upstream.text();

  res.writeHead(upstream.status, {
    'content-type': upstream.headers.get('content-type') || 'application/json',
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = normalize(requested).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(root, safePath);

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'content-type': contentType(filePath) });
    res.end(content);
  } catch (_) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  }
}

createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/football-data/v4/')) {
      await proxyFootballData(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}).listen(port, host, () => {
  console.log(`Marcador 26 listo en http://${host}:${port}`);
});
