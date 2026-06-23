const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 5183;
const BUILD_DIR = path.join(__dirname, 'dist', 'build', 'h5');
const MIME = { '.js': 'application/javascript; charset=utf-8', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const filePath = path.join(BUILD_DIR, url);
  if (!filePath.startsWith(BUILD_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found ' + url); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});
server.listen(PORT, () => console.log('Server on http://localhost:' + PORT));
