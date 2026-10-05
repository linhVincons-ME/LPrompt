import type { PromptDomain, GeminiConfig } from '../types';
import { z } from 'zod';
import { generateGeminiContent, parseGeminiJson } from './geminiClient';
import { evaluatePromptLocally } from './evaluator';
import { compilePromptFramework, type PromptFramework } from './frameworkCompiler';

const optimizationSchema = z.object({
  improved_prompt: z.string().min(1),
  original_score: z.number().min(0).max(100).optional(),
  new_score: z.number().min(0).max(100).optional(),
  changes_summary: z.array(z.string()).default([]),
  framework_applied: z.string().default('CUSTOM'),
  explanation: z.string().default('Đã tái cấu trúc prompt.')
});

export interface OptimizationResult {
  improved_prompt: string;
  original_score: number;
  new_score: number;
  changes_summary: string[];
  framework_applied: string;
  explanation: string;
}

/**
 * Biên dịch cục bộ trước; chỉ gọi model Gemini đã chọn khi người dùng cấu hình API key.
 */
export async function optimizePromptWithGeminiPro(
  prompt: string,
  domain: PromptDomain,
  goal: string,
  framework: PromptFramework,
  customInstruction: string,
  config: GeminiConfig
): Promise<OptimizationResult> {
  const p = prompt.trim();
  if (!p) {
    throw new Error('Vui lòng nhập nội dung prompt cần tối ưu.');
  }
  const compiled = compilePromptFramework(p, framework, { domain, goal, additionalInstruction: customInstruction });
  const originalScore = evaluatePromptLocally(p, domain).total_score;

  // Nếu người dùng có API Key Gemini
  if (config.apiKey) {
    const systemPrompt = `
Bạn là Master Prompt Engineer và Chuyên gia Tối Ưu Hóa Ngữ Nghĩa Cấp Cao cho hệ thống LLM / Multimodal AI.
Nhiệm vụ của bạn là nhận Prompt gốc từ người dùng thuộc lĩnh vực: "${domain.toUpperCase()}".
Hãy review và tinh chỉnh prompt đã được compiler cục bộ cấu trúc. Không được tự tuyên bố chất lượng tuyệt đối.

MỤC TIÊU TỐI ƯU CỤ THỂ:
- Hướng mục tiêu: "${goal}"
- Khung kỹ thuật áp dụng (Framework): "${compiled.framework}"
${customInstruction ? `- Chỉ thị tùy chỉnh bổ sung từ người dùng: "${customInstruction}"` : ''}

QUY TẮC BẮT BUỘC KHI TỐI ƯU:
1. Bổ sung vai trò chuyên môn hàng đầu (World-class Expert / Principal Persona).
2. Xây dựng quy trình thực thi mạch lạc; chỉ yêu cầu kết luận và lý do ngắn gọn, không yêu cầu chain-of-thought riêng tư.
3. Thêm danh sách điều cấm kỵ (Negative constraints / Guardrails) để ngăn ảo giác hoặc sai lệch.
4. Ép định dạng đầu ra chuẩn mực (Strict Format / JSON Schema / Markdown structure).
5. Tích hợp các tham số đặc thù của ${domain.toUpperCase()} (nếu là ảnh: aspect ratio, camera, lighting; nếu là code: tech stack, unit test; nếu là video: camera moves, motion factor; nếu là audio: cấu trúc [Verse]/[Chorus], bpm).

BẮT BUỘC TRẢ VỀ JSON theo schema sau:
{
  "improved_prompt": "<Toàn bộ nội dung prompt đã được tối ưu hoàn thiện, chuyên nghiệp, sẵn sàng copy>",
  "original_score": <ước tính 0 đến 100>,
  "new_score": <ước tính 0 đến 100>,
  "changes_summary": [
    "<Thay đổi 1: đã thêm gì>",
    "<Thay đổi 2: đã sửa gì>",
    "<Thay đổi 3: đã ràng buộc gì>"
  ],
  "framework_applied": "${compiled.framework}",
  "explanation": "<Giải thích ngắn gọn, không đưa ra phần trăm cải thiện nếu không có đo lường>"
}
`;

    const generated = await generateGeminiContent(
      `${systemPrompt}\n\nPROMPT ĐÃ COMPILE CẦN REVIEW:\n<compiled_prompt>\n${compiled.prompt}\n</compiled_prompt>`,
      config,
      { responseMimeType: 'application/json', temperature: config.temperature ?? 0.2 }
    );
    const parsed = parseGeminiJson(generated.text, optimizationSchema);
    return {
      improved_prompt: parsed.improved_prompt,
      original_score: originalScore,
      new_score: evaluatePromptLocally(parsed.improved_prompt, domain).total_score,
      changes_summary: parsed.changes_summary,
      framework_applied: compiled.framework,
      explanation: parsed.explanation
    };
  }

  // Compiler cục bộ là đường chạy mặc định khi không có API key.
  return simulateGeminiProOptimization(p, domain, compiled);
}

/**
 * Kết quả compiler cục bộ; tên hàm được giữ để tương thích với call site cũ.
 */
function simulateGeminiProOptimization(
  prompt: string,
  domain: PromptDomain,
  compiled: ReturnType<typeof compilePromptFramework>
): OptimizationResult {
  const changes = [
    `Compiler cục bộ đã áp dụng ${compiled.framework}`,
    'Bọc yêu cầu nguồn trong ranh giới dữ liệu rõ ràng',
    'Bổ sung role, output contract và hành vi khi thiếu dữ liệu phù hợp với framework'
  ];
  const originalScore = evaluatePromptLocally(prompt, domain).total_score;
  const newScore = evaluatePromptLocally(compiled.prompt, domain).total_score;
  return {
    improved_prompt: compiled.prompt,
    original_score: originalScore,
    new_score: newScore,
    changes_summary: changes,
    framework_applied: compiled.framework,
    explanation: `${compiled.reason} Đây là kết quả compiler cục bộ, chưa phải phản hồi từ Gemini và cần được kiểm thử với dữ liệu thực tế.`
  };
}
