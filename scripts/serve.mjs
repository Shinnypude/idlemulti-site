// Servidor local mínimo (sem dependências) para ver o site como no ar:
// serve public/ na porta 8123 e aplica os cabeçalhos de public/_headers (CSP inclusive).
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

// Formato do _headers da Cloudflare: linha sem recuo = padrão de URL; linhas recuadas = "Nome: valor".
function parseHeaders(text) {
  const rules = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    if (!/^\s/.test(raw)) {
      cur = { pattern: raw.trim(), headers: [] };
      rules.push(cur);
    } else if (cur) {
      const i = raw.indexOf(':');
      if (i > 0) cur.headers.push([raw.slice(0, i).trim(), raw.slice(i + 1).trim()]);
    }
  }
  return rules;
}

function matches(pattern, path) {
  const esc = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^' + pattern.split('*').map(esc).join('.*') + '$');
  return re.test(path);
}

const rules = parseHeaders(readFileSync(join(ROOT, '_headers'), 'utf8'));

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  for (const r of rules) if (matches(r.pattern, path)) for (const [k, v] of r.headers) res.setHeader(k, v);

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
}).listen(PORT, () => console.log(`IdleMulti site em http://localhost:${PORT} (cabeçalhos de public/_headers aplicados)`));

function send(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(msg);
}
