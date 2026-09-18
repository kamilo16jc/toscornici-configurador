// Servidor estático mínimo para el sitio (sin build).
// Uso: node tools/serve.mjs [puerto]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = Number(process.argv[2] || process.env.PORT || 8137);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.dxf': 'application/dxf',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
};

http
  .createServer((req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';
    const destino = path.join(RAIZ, path.normalize(ruta));
    if (!destino.startsWith(RAIZ)) {
      res.writeHead(403).end('403');
      return;
    }
    fs.stat(destino, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 — ' + ruta);
        return;
      }
      res.writeHead(200, {
        'content-type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream',
        'content-length': st.size,
        'cache-control': 'no-cache',
      });
      fs.createReadStream(destino).pipe(res);
    });
  })
  .listen(PUERTO, () => console.log(`Toscornici en http://localhost:${PUERTO}`));
