import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

describe('local service and MCP integration', () => {
  let service;
  let createApp;
  let tempDirectory;
  beforeAll(async () => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lprompt-test-'));
    process.env.LPROMPT_DB_FILE = path.join(tempDirectory, 'test.db');
    const serverModule = await import('../server/index.js');
    const { startServer } = serverModule;
    createApp = serverModule.createApp;
    service = await startServer({ host: '127.0.0.1', port: 0 });
  });
  afterAll(async () => {
    await Promise.all([service.close(), service.close()]);
    delete process.env.LPROMPT_DB_FILE;
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  });

  it('serves health and rejects invalid payloads', async () => {
    const health = await fetch(`http://127.0.0.1:${service.port}/health`).then((res) => res.json());
    expect(health).toMatchObject({ status: 'ok', lifecycle: 'ready', activeDspyProcesses: 0, version: '3.0.0' });
    const invalid = await fetch(`http://127.0.0.1:${service.port}/api/versions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(invalid.status).toBe(400);
    const blockedOrigin = await fetch(`http://127.0.0.1:${service.port}/health`, { headers: { Origin: 'https://attacker.example' } });
    expect(blockedOrigin.status).toBe(403);
    const page = await fetch(`http://127.0.0.1:${service.port}/`).then((res) => res.text());
    expect(page).toContain('<div id="root"></div>');
  });

  it('refuses remote binding without explicit auth and allowlists', () => {
    expect(() => createApp({ host: '0.0.0.0' })).toThrow('Remote bind yêu cầu');
  });

  it('round-trips camelCase version DTOs through SQLite', async () => {
    const version = { id: 'integration-version', versionNumber: 'feature/test@abc', commitMessage: 'integration', content: 'Hello', stage: 'testing', createdAt: new Date().toISOString(), branchName: 'feature/test', contentHash: 'abc' };
    const saved = await fetch(`http://127.0.0.1:${service.port}/api/versions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(version) });
    expect(saved.status).toBe(201);
    const listed = await fetch(`http://127.0.0.1:${service.port}/api/versions?branch=feature%2Ftest`).then((res) => res.json());
    expect(listed.data[0]).toMatchObject({ id: version.id, branchName: 'feature/test', commitMessage: 'integration' });
    const removed = await fetch(`http://127.0.0.1:${service.port}/api/versions/${version.id}`, { method: 'DELETE' }).then((res) => res.json());
    expect(removed.success).toBe(true);
  });

  it('speaks official MCP Streamable HTTP', async () => {
    const client = new Client({ name: 'lprompt-test', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${service.port}/mcp`));
    await client.connect(transport);
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name)).toContain('lprompt_commit_version');
    const called = await client.callTool({ name: 'lprompt_evaluate', arguments: { prompt: 'You are an expert. Task: output JSON.' } });
    expect(called.content[0].text).toContain('deterministic-local-heuristic');
    await client.close();
  });
});
