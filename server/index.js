import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initDatabase,
  getAllPrompts,
  savePrompt,
  deletePrompt,
  getAllVersions,
  saveVersion,
  deleteVersion,
  exportFullBackup,
  DB_FILE
} from './db.js';
import { FABRIC_PRESETS } from './presetsData.js';
import { handleMcpJsonRpc } from './mcpServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = parseInt(process.env.PORT || '8484', 10);

// Initialize SQLite database
initDatabase();

// MIME Types map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Parse JSON body helper
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protect from large payloads (> 10MB)
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload quá lớn (>10MB)'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Send JSON helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data));
}

// Server factory
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end();
    return;
  }

  try {
    // ==================== REST API ENDPOINTS ====================

    // Health & Status
    if (pathname === '/health' && method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'lprompt-daemon',
        version: '2.5.0',
        port: PORT,
        pid: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        database: DB_FILE,
        storageType: 'portable-embedded-sqlite'
      });
      return;
    }

    // Prompts
    if (pathname === '/api/prompts') {
      if (method === 'GET') {
        const prompts = getAllPrompts();
        sendJson(res, 200, { success: true, count: prompts.length, data: prompts });
        return;
      }
      if (method === 'POST') {
        const body = await parseJsonBody(req);
        const saved = savePrompt(body);
        sendJson(res, 201, { success: true, data: saved });
        return;
      }
    }

    if (pathname.startsWith('/api/prompts/') && method === 'DELETE') {
      const id = pathname.replace('/api/prompts/', '');
      deletePrompt(id);
      sendJson(res, 200, { success: true, id });
      return;
    }

    // Versions
    if (pathname === '/api/versions') {
      if (method === 'GET') {
        const versions = getAllVersions();
        sendJson(res, 200, { success: true, count: versions.length, data: versions });
        return;
      }
      if (method === 'POST') {
        const body = await parseJsonBody(req);
        const saved = saveVersion(body);
        sendJson(res, 201, { success: true, data: saved });
        return;
      }
    }

    if (pathname.startsWith('/api/versions/') && method === 'DELETE') {
      const id = pathname.replace('/api/versions/', '');
      deleteVersion(id);
      sendJson(res, 200, { success: true, id });
      return;
    }

    // Presets Hub
    if (pathname === '/api/presets' && method === 'GET') {
      const cat = urlObj.searchParams.get('category');
      const filtered = cat && cat !== 'all' ? FABRIC_PRESETS.filter((p) => p.category === cat) : FABRIC_PRESETS;
      sendJson(res, 200, { success: true, count: filtered.length, data: filtered });
      return;
    }

    // Backup trigger
    if (pathname === '/api/backup' && method === 'POST') {
      const backupResult = exportFullBackup();
      sendJson(res, 200, backupResult);
      return;
    }

    // ==================== MCP PROTOCOL (JSON-RPC 2.0) ====================
    if (pathname === '/mcp' && method === 'POST') {
      const rpcReq = await parseJsonBody(req);
      const rpcRes = await handleMcpJsonRpc(rpcReq);
      sendJson(res, 200, rpcRes);
      return;
    }

    // ==================== STATIC FILE SERVING (VITE DIST) ====================
    if (fs.existsSync(DIST_DIR)) {
      let targetFile = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

      // If file doesn't exist or is a directory, fallback to index.html for SPA routing
      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
        targetFile = path.join(DIST_DIR, 'index.html');
      }

      if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
        const ext = path.extname(targetFile);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(targetFile).pipe(res);
        return;
      }
    }

    // 404 Not Found
    sendJson(res, 404, { error: 'Not Found', path: pathname });
  } catch (err) {
    console.error('[LPrompt Service Error]:', err);
    sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
=============================================================
  🚀 LPROMPT LOCAL BACKGROUND SERVICE (v2.5) IS RUNNING!
=============================================================
  📍 Web App Dashboard : http://localhost:${PORT}
  📍 REST API Gateway  : http://localhost:${PORT}/api/prompts
  📍 MCP Server RPC    : http://localhost:${PORT}/mcp
  🗄️  Embedded Database : ${DB_FILE}
  📊 Memory RSS        : ~${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB
=============================================================
`);
});
