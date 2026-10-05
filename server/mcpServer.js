import { getAllPrompts, getAllVersions, saveVersion } from './db.js';
import { FABRIC_PRESETS } from './presetsData.js';

export const MCP_TOOLS = [
  {
    name: 'lprompt_evaluate',
    description: 'Thẩm định chất lượng câu prompt theo thang đo 100 điểm chuẩn công nghiệp (5 trụ cột kỹ thuật: Role, Task, Constraints, Output Format, Specs)',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Nội dung prompt cần thẩm định' },
        domain: {
          type: 'string',
          enum: ['research', 'image', 'video', 'code', 'audio'],
          description: 'Lĩnh vực của prompt'
        }
      },
      required: ['prompt']
    }
  },
  {
    name: 'lprompt_list_presets',
    description: 'Lấy danh sách các mẫu prompt chuẩn Fabric-style trong kho presets (Kinh doanh, Lập trình, Copywriting, Video, Ảnh, Nghiên cứu)',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'business', 'engineering', 'copywriting', 'multimodal', 'research'],
          description: 'Danh mục cần tìm'
        },
        search: { type: 'string', description: 'Từ khóa tìm kiếm' }
      }
    }
  },
  {
    name: 'lprompt_get_versions',
    description: 'Lấy danh sách các phiên bản prompt đã lưu trong cơ sở dữ liệu SQLite nhúng của LPrompt',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'lprompt_commit_version',
    description: 'Lưu một phiên bản prompt mới vào cơ sở dữ liệu SQLite nhúng (Git-style versioning)',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Nội dung prompt' },
        message: { type: 'string', description: 'Thông điệp thay đổi (commit message)' },
        stage: {
          type: 'string',
          enum: ['draft', 'testing', 'production'],
          description: 'Giai đoạn vòng đời'
        }
      },
      required: ['content', 'message']
    }
  }
];

export async function handleMcpJsonRpc(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'lprompt-service',
            version: '2.5.0',
            description: 'LPrompt Universal PromptOps Embedded Background Service'
          }
        }
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: MCP_TOOLS }
      };

    case 'tools/call': {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        let resultData = null;

        if (toolName === 'lprompt_list_presets') {
          const cat = args.category || 'all';
          const query = (args.search || '').toLowerCase();
          const filtered = FABRIC_PRESETS.filter((p) => {
            const matchesCat = cat === 'all' || p.category === cat;
            const matchesQ = !query || p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
            return matchesCat && matchesQ;
          });
          resultData = { count: filtered.length, presets: filtered };
        } else if (toolName === 'lprompt_get_versions') {
          const versions = getAllVersions();
          resultData = { count: versions.length, versions };
        } else if (toolName === 'lprompt_commit_version') {
          const verId = `ver-${Date.now()}`;
          const currentCount = getAllVersions().length;
          const newVer = {
            id: verId,
            version_number: `v1.${currentCount}`,
            commit_message: args.message,
            content: args.content,
            stage: args.stage || 'draft',
            created_at: new Date().toISOString()
          };
          saveVersion(newVer);
          resultData = { success: true, version: newVer };
        } else if (toolName === 'lprompt_evaluate') {
          // Local heuristic evaluation
          const prompt = args.prompt || '';
          let score = 30;
          if (/\[ROLE\]|Bạn là|You are/i.test(prompt)) score += 15;
          if (/\[TASK\]|Nhiệm vụ|Steps/i.test(prompt)) score += 20;
          if (/\[CONSTRAINTS\]|Không được|Do not/i.test(prompt)) score += 15;
          if (/\[OUTPUT FORMAT\]|JSON|Markdown/i.test(prompt)) score += 15;
          resultData = {
            score: Math.min(score, 100),
            tier: score >= 90 ? 'Xuất sắc (Production)' : score >= 75 ? 'Khá' : 'Cần tối ưu',
            evaluatedPromptLength: prompt.length
          };
        } else {
          throw new Error(`Tool "${toolName}" không được hỗ trợ.`);
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resultData, null, 2)
              }
            ]
          }
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: err.message || 'Lỗi thực thi tool MCP'
          }
        };
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Phương thức "${method}" không tồn tại.`
        }
      };
  }
}
