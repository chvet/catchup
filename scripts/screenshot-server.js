const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let count = 0;
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method === 'POST') {
    const filename = req.headers['x-filename'] || `screenshot_${++count}.jpg`;
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, buf);
      console.log(`Saved: ${filePath} (${buf.length} bytes)`);
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ ok: true, path: filePath, size: buf.length }));
    });
  }
});
server.listen(9877, () => console.log('Screenshot server on http://localhost:9877'));
