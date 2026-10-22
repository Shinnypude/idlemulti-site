// Servidor local mínimo (sem dependências) para ver o site como no ar:
// serve public/ na porta 8123 e aplica os cabeçalhos do vercel.json (CSP inclusive).
// Uso: node scripts/serve.mjs   (PORT=9000 node scripts/serve.mjs para outra porta)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const PORT = Number(process.env.PORT) || 8123;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// Cabeçalhos: a mesma fonte da Vercel (vercel.json, regra "/(.*)"), para o local ser fiel ao ar.
const CONFIG = JSON.parse(readFileSync(fileURLToPath(new URL('../vercel.json', import.meta.url)), 'utf8'));
const HEADERS = CONFIG.headers
  .filter((r) => r.source === '/(.*)')
  .flatMap((r) => r.headers.map((h) => [h.key, h.value]));

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  for (const [k, v] of HEADERS) res.setHeader(k, v);

  // Não serve arquivos de configuração nem ocultos (como a Cloudflare).
  if (/(^|\/)[._]/.test(path)) return send(res, 404, 'Não encontrado');
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) return send(res, 404, 'Não encontrado');
  try {
    const st = await stat(file);
    if (!st.isFile()) return send(res, 404, 'Não encontrado');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch {
    send(res, 404, 'Não encontrado');
  }
}).listen(PORT, () => console.log(`IdleMulti site em http://localhost:${PORT} (cabeçalhos do vercel.json aplicados)`));

function send(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(msg);
}
