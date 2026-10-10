import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod/v4';
import { getAllVersions, saveVersion } from './db.js';
import { FABRIC_PRESETS } from './presetsData.js';

import { evaluatePromptLocally as evaluateFullPromptLocally } from '../src/services/evaluator.ts';

export function evaluatePromptLocally(prompt, domain = 'research') {
  const result = evaluateFullPromptLocally(prompt, domain || 'research');
  return {
    score: result.total_score,
    total_score: result.total_score,
    tier: result.tier,
    breakdown: result.breakdown,
    critique: result.critique,
    evaluatedPromptLength: String(prompt || '').length,
    method: 'deterministic-local-heuristic',
    domain: domain || 'research',
    target_domain: result.target_domain || domain || 'research'
  };
}

export function createLPromptMcpServer() {
  const server = new McpServer({ name: 'lprompt-service', version: '3.0.0' });
  server.registerTool('lprompt_evaluate', {
    description: 'Đánh giá độ đầy đủ cấu trúc prompt bằng heuristic cục bộ, không gọi mô hình AI.',
    inputSchema: { prompt: z.string().min(1).max(100_000), domain: z.enum(['research', 'image', 'video', 'code', 'audio']).optional() }
  }, async ({ prompt, domain }) => ({ content: [{ type: 'text', text: JSON.stringify(evaluatePromptLocally(prompt, domain || 'research'), null, 2) }] }));

  server.registerTool('lprompt_list_presets', {
    description: 'Tìm mẫu prompt trong kho preset tích hợp.',
    inputSchema: { category: z.enum(['all', 'business', 'engineering', 'copywriting', 'multimodal', 'research']).default('all'), search: z.string().max(200).default('') }
  }, async ({ category, search }) => {
    const query = search.trim().toLocaleLowerCase('vi');
    const presets = FABRIC_PRESETS.filter((preset) => (category === 'all' || preset.category === category) && (!query || `${preset.title} ${preset.description}`.toLocaleLowerCase('vi').includes(query)));
    return { content: [{ type: 'text', text: JSON.stringify({ count: presets.length, presets }, null, 2) }] };
  });

  server.registerTool('lprompt_get_versions', {
    description: 'Lấy lịch sử commit prompt, có thể lọc theo nhánh.',
    inputSchema: { branchName: z.string().min(1).max(100).optional() }
  }, async ({ branchName }) => {
    const versions = getAllVersions(branchName);
    return { content: [{ type: 'text', text: JSON.stringify({ count: versions.length, versions }, null, 2) }] };
  });

  server.registerTool('lprompt_commit_version', {
    description: 'Tạo một commit prompt có quan hệ cha và nhánh rõ ràng.',
    inputSchema: {
      content: z.string().min(1).max(100_000), message: z.string().min(1).max(500),
      stage: z.enum(['draft', 'testing', 'production']).default('draft'), branchName: z.string().min(1).max(100).default('main'),
      parentId: z.string().max(200).optional(), mergeParentId: z.string().max(200).optional()
    }
  }, async (input) => {
    const version = saveVersion({ content: input.content, commitMessage: input.message, stage: input.stage, branchName: input.branchName, parentId: input.parentId, mergeParentId: input.mergeParentId });
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, version }, null, 2) }] };
  });
  return server;
}

export async function handleMcpRequest(req, res) {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = createLPromptMcpServer();
  res.on('close', () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
