import http from 'node:http';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
const root = path.resolve('dist');
const mime = {html:'text/html; charset=utf-8', js:'text/javascript', mjs:'text/javascript', css:'text/css', svg:'image/svg+xml', png:'image/png', pdf:'application/pdf', xml:'application/xml', json:'application/json', txt:'text/plain', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', woff2:'font/woff2'};
const port = Number(process.env.PORT || 4173);
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end(); return;
    }
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type': mime[path.extname(file).slice(1)] || 'application/octet-stream'}).end(data);
  } catch {
    res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'}).end(await readFile(path.join(root,'404.html')).catch(()=>'Página no encontrada'));
  }
}).listen(port,'127.0.0.1',()=>console.log('Vista local: http://127.0.0.1:' + port));
