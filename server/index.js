import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import express from 'express';
import * as z from 'zod/v4';
import { initDatabase, getAllPrompts, savePrompt, deletePrompt, getAllVersions, saveVersion, deleteVersion, exportFullBackup, closeDatabase, DB_FILE, DATA_DIR } from './db.js';
import { FABRIC_PRESETS } from './presetsData.js';
import { handleMcpRequest } from './mcpServer.js';
import { runDspyOptimizer } from './dspyRunner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PID_FILE = path.join(DATA_DIR, 'lprompt.pid');
const promptSchema = z.object({
  id: z.string().min(1).max(200), title: z.string().min(1).max(500), domain: z.string().min(1).max(100),
  original_prompt: z.string().min(1).max(200_000), improved_prompt: z.string().min(1).max(200_000), score: z.number().finite().optional(),
  tier: z.string().max(100).optional(), tags: z.array(z.string().max(100)).max(50).optional(), created_at: z.string().datetime().optional()
});
const versionSchema = z.object({
  id: z.string().max(200).optional(), versionNumber: z.string().max(100).optional(), commitMessage: z.string().min(1).max(500),
  content: z.string().min(1).max(200_000), stage: z.enum(['draft', 'testing', 'production']).optional(), score: z.number().finite().optional(),
  createdAt: z.string().datetime().optional(), branchName: z.string().min(1).max(100).optional(), parentId: z.string().max(200).optional(),
  mergeParentId: z.string().max(200).optional(), contentHash: z.string().max(128).optional(), promptId: z.string().max(200).optional()
});
const dspySchema = z.object({
  prompt: z.string().min(1).max(100_000), apiKey: z.string().min(10).max(500), model: z.string().min(1).max(100),
  examples: z.array(z.object({ input: z.string().min(1).max(50_000), output: z.string().min(1).max(100_000) })).min(2).max(20)
});

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function createApp({ host = process.env.LPROMPT_HOST || '127.0.0.1' } = {}) {
  const isLoopback = ['127.0.0.1', 'localhost', '::1'].includes(host);
  const remoteToken = process.env.LPROMPT_AUTH_TOKEN || '';
  const allowedHosts = (process.env.LPROMPT_ALLOWED_HOSTS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const allowedOrigins = new Set((process.env.LPROMPT_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean));
  if (!isLoopback && (remoteToken.length < 24 || allowedHosts.length === 0 || allowedOrigins.size === 0)) {
    throw new Error('Remote bind yêu cầu LPROMPT_AUTH_TOKEN (>=24 ký tự), LPROMPT_ALLOWED_HOSTS và LPROMPT_ALLOWED_ORIGINS.');
  }
  initDatabase();
  const app = createMcpExpressApp({ host, ...(isLoopback ? {} : { allowedHosts }) });
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const origin = req.headers.origin;
    const originAllowed = !origin || (isLoopback ? /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin) : allowedOrigins.has(origin));
    if (!originAllowed) return next(httpError(403, 'Origin không được phép.'));
    if (!isLoopback && req.headers.authorization !== `Bearer ${remoteToken}`) return next(httpError(401, 'Thiếu hoặc sai Bearer token.'));
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Mcp-Session-Id,Mcp-Protocol-Version');
    if (req.method === 'OPTIONS') res.sendStatus(204); else next();
  });

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'lprompt-daemon', version: '3.0.0', port: req.socket.localPort, pid: process.pid, uptimeSeconds: Math.round(process.uptime()), memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024), database: DB_FILE, storageType: 'portable-embedded-sqlite' }));
  app.get('/api/prompts', (_req, res) => res.json({ success: true, data: getAllPrompts() }));
  app.post('/api/prompts', (req, res) => res.status(201).json({ success: true, data: savePrompt(promptSchema.parse(req.body)) }));
  app.delete('/api/prompts/:id', (req, res) => res.json(deletePrompt(req.params.id)));
  app.get('/api/versions', (req, res) => {
    const branchName = typeof req.query.branch === 'string' ? req.query.branch : undefined;
    const data = getAllVersions(branchName);
    res.json({ success: true, count: data.length, data });
  });
  app.post('/api/versions', (req, res) => res.status(201).json({ success: true, data: saveVersion(versionSchema.parse(req.body)) }));
  app.delete('/api/versions/:id', (req, res) => res.json(deleteVersion(req.params.id)));
  app.get('/api/presets', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : 'all';
    const data = category === 'all' ? FABRIC_PRESETS : FABRIC_PRESETS.filter((preset) => preset.category === category);
    res.json({ success: true, count: data.length, data });
  });
  app.post('/api/backup', (_req, res) => res.json(exportFullBackup()));
  app.post('/api/dspy/optimize', async (req, res, next) => {
    try { res.json(await runDspyOptimizer(dspySchema.parse(req.body))); } catch (error) { next(error); }
  });
  app.post('/mcp', (req, res, next) => handleMcpRequest(req, res).catch(next));
  app.get('/mcp', (_req, res) => res.status(405).set('Allow', 'POST').send('Method Not Allowed'));
  if (fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR, { fallthrough: true, index: false }));
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path === '/mcp' || req.path === '/health') return next();
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }
  app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));
  app.use((error, _req, res, _next) => {
    const isValidation = error instanceof z.ZodError;
    const status = isValidation ? 400 : Number(error?.status) || 500;
    if (status >= 500) console.error('[LPrompt Service Error]', error);
    res.status(status).json({ error: isValidation ? 'Dữ liệu không hợp lệ.' : error?.message || 'Internal Server Error', details: isValidation ? error.issues : undefined });
  });
  return app;
}

export async function startServer({ host = process.env.LPROMPT_HOST || '127.0.0.1', port = Number(process.env.LPROMPT_PORT || process.env.PORT || 8484) } = {}) {
  const app = createApp({ host });
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(port, host, () => resolve(instance));
    instance.on('error', reject);
    instance.requestTimeout = Number(process.env.LPROMPT_REQUEST_TIMEOUT_MS || process.env.REQUEST_TIMEOUT_MS || 35_000);
    instance.headersTimeout = Math.min(instance.requestTimeout + 5_000, 60_000);
  });
  fs.writeFileSync(PID_FILE, String(process.pid), 'utf8');
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const cleanup = () => { try { if (fs.readFileSync(PID_FILE, 'utf8').trim() === String(process.pid)) fs.unlinkSync(PID_FILE); } catch { /* already removed */ } };
  server.on('close', cleanup);
  console.log(`[LPrompt] v3.0.0 listening on http://${host}:${actualPort} (PID ${process.pid})`);
  const close = () => new Promise((resolve, reject) => server.close((error) => {
    if (error) return reject(error);
    try { closeDatabase(); resolve(); } catch (closeError) { reject(closeError); }
  }));
  return { app, server, host, port: actualPort, close };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) startServer().then((service) => {
  const shutdown = () => service.close().then(() => { process.exitCode = 0; }).catch((error) => { console.error('[LPrompt] Shutdown failed:', error); process.exitCode = 1; });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}).catch((error) => { console.error('[LPrompt] Startup failed:', error); process.exitCode = 1; });
