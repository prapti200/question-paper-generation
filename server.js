import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handleApiRequest, getEnvConfig } from './server/apiHandler.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Handle API routes
  if (req.url && req.url.startsWith('/api')) {
    await handleApiRequest(req, res);
    return;
  }

  // Handle static figure files: /figures/<id>.png
  if (req.url && req.url.startsWith('/figures/')) {
    const filename = path.basename(req.url);
    const filePath = path.resolve(process.cwd(), 'figures', filename);
    if (fs.existsSync(filePath)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/png');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
