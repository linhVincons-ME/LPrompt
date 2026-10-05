import type { GeminiConfig, FewShotExample, FewShotSynthesisResult } from '../types';
import { z } from 'zod';
import { generateGeminiContent, parseGeminiJson } from './geminiClient';

const examplesSchema = z.array(z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  explanation: z.string().optional()
})).min(1).max(8);

/**
 * Synthesize 2-3 candidate Few-Shot pairs. Real DSPy compilation is exposed separately by the local service.
 */
export async function synthesizeFewShotExamples(
  prompt: string,
  config: GeminiConfig
): Promise<FewShotSynthesisResult> {
  if (config.apiKey && config.apiKey.trim().length > 10) {
    try {
      const systemPrompt = `You are a World-Class Few-Shot Prompt Engineer following Stanford DSPy principles.
Your task is to analyze the user's prompt (which may contain {{variables}} or domain instructions) and synthesize 2 to 3 pristine, realistic, diverse Few-Shot (Input/Output) example pairs.
These examples teach the LLM the exact structure, depth, schema, and quality expected.

CRITICAL OUTPUT FORMAT:
You MUST respond with a valid JSON array of objects, each containing:
- "input": realistic user input or variable values demonstrating a representative test case.
- "output": the gold-standard, flawless output meeting all requirements, negative constraints, and output formats.
- "explanation": a 1-sentence note explaining why this example grounds the model and prevents hallucinations.

Do NOT include markdown formatting or quotes around the JSON array. Output purely valid JSON.`;

      const userContent = `${systemPrompt}\n\nHere is the target prompt:\n"""\n${prompt}\n"""\n\nGenerate 2-3 gold-standard Few-Shot Input/Output example pairs in pure JSON.`;

      const generated = await generateGeminiContent(userContent, config, {
        responseMimeType: 'application/json',
        temperature: 0.3
      });
      const rawExamples = parseGeminiJson(generated.text, examplesSchema);
      {
        const examples: FewShotExample[] = rawExamples.map(
          (ex: any, idx: number) => ({
            id: `ex-${Date.now()}-${idx}`,
            input: String(ex.input || `Mẫu đầu vào ${idx + 1}`),
            output: String(ex.output || `Mẫu đầu ra chuẩn mực ${idx + 1}`),
            explanation: ex.explanation ? String(ex.explanation) : undefined
          })
        );

        if (examples.length > 0) {
          return {
            examples,
            integratedPrompt: integrateExamplesIntoPrompt(prompt, examples)
          };
        }
      }
    } catch (err) {
      console.warn('Gemini Few-Shot synthesis failed, falling back to local synthesizer:', err);
    }
  }

  // Fallback heuristic synthesis (offline / simulation mode)
  const fallbackExamples = generateLocalFewShotExamples(prompt);
  return {
    examples: fallbackExamples,
    integratedPrompt: integrateExamplesIntoPrompt(prompt, fallbackExamples)
  };
}

/**
 * Heuristically generates domain-aware few-shot pairs offline
 */
function generateLocalFewShotExamples(prompt: string): FewShotExample[] {
  const isCode = /python|code|typescript|function|api|sql|class/i.test(prompt);
  const isImage = /photo|camera|lens|lighting|render|image|flux|midjourney/i.test(prompt);
  const isMarketing = /marketing|bài viết|quảng cáo|email|seo|content/i.test(prompt);

  if (isCode) {
    return [
      {
        id: `ex-${Date.now()}-1`,
        input: 'User Input: "Xây dựng hàm xác thực JWT trong FastAPI với async redis cache."',
        output:
          '```python\nfrom fastapi import HTTPException, Security, status\nfrom fastapi.security import HTTPBearer, HTTPAuthorizationCredentials\nimport redis.asyncio as aioredis\nimport jwt\n\nsecurity = HTTPBearer()\n\nasync def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:\n    token = credentials.credentials\n    try:\n        payload = jwt.decode(token, "SECRET_KEY", algorithms=["HS256"])\n        return payload\n    except jwt.PyJWTError:\n        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ")\n```',
        explanation: 'Ví dụ mẫu chuẩn định dạng code fence, xử lý lỗi exception và kiểu dữ liệu tường minh.'
      },
      {
        id: `ex-${Date.now()}-2`,
        input: 'User Input: "Đầu vào không hợp lệ: Token rỗng hoặc hết hạn."',
        output:
          '```json\n{\n  "error": true,\n  "status_code": 401,\n  "message": "Token đã hết hạn hoặc không có quyền truy cập",\n  "code": "AUTH_EXPIRED_TOKEN"\n}\n```',
        explanation: 'Ví dụ kiểm soát luồng lỗi trả về schema JSON chuẩn.'
      }
    ];
  }

  if (isImage) {
    return [
      {
        id: `ex-${Date.now()}-1`,
        input: 'Yêu cầu: "Chân dung một nữ doanh nhân công nghệ trong văn phòng tương lai"',
        output:
          'Portrait of a confident Vietnamese female tech executive, modern cyberpunk minimalist office, soft volumetric rim lighting, shot on 85mm f/1.4 lens, shallow depth of field, photorealistic skin texture, 8k resolution, cinematic color grading --ar 16:9 --v 6.0 --style raw',
        explanation: 'Ví dụ mẫu đầy đủ thông số lens, ánh sáng và tham số tỷ lệ khung hình.'
      },
      {
        id: `ex-${Date.now()}-2`,
        input: 'Yêu cầu: "Phong cảnh thiên nhiên kỳ ảo với thác nước phát sáng"',
        output:
          'Ethereal bioluminescent waterfall descending from floating islands, neon cyan and violet water glow, twilight atmosphere, long exposure photography, National Geographic style, crisp details, 4k unreal engine 5 render --ar 21:9',
        explanation: 'Mẫu tham số phong cảnh siêu rộng và ánh sáng ban đêm.'
      }
    ];
  }

  if (isMarketing) {
    return [
      {
        id: `ex-${Date.now()}-1`,
        input: 'Dữ liệu đầu vào: { "san_pham": "Phần mềm quản lý chấm công AI", "ngan_sach": "50tr", "khach_hang": "Chủ doanh nghiệp SME" }',
        output:
          'Tiêu đề: "Bạn đang mất 15 giờ mỗi tháng chỉ để đối soát bảng chấm công thủ công?"\n\nNội dung chính:\n• Tự động nhận diện khuôn mặt chống gian lận 99.9%.\n• Đồng bộ trực tiếp với bảng lương trong 30 giây.\n• Tiết kiệm trung bình 12 triệu VNĐ chi phí nhân sự mỗi tháng.\n\nKêu gọi hành động (CTA): Đăng ký dùng thử 14 ngày miễn phí ngay hôm nay.',
        explanation: 'Minh họa cách viết hook giải quyết nỗi đau và số liệu ROI cụ thể.'
      }
    ];
  }

  return [
    {
      id: `ex-${Date.now()}-1`,
      input: 'Yêu cầu mẫu đầu vào: Trường hợp tiêu chuẩn (Standard Scenario)',
      output:
        'Cấu trúc phản hồi chuẩn:\n1. Tóm tắt cốt lõi (Executive Summary)\n2. Phân tích luận điểm chính có số liệu dẫn chứng\n3. Rủi ro tiềm ẩn và giải pháp phòng ngừa\n4. Bảng checklist hành động bước tiếp theo',
      explanation: 'Định hình cấu trúc 4 phần giúp mô hình không trả lời tản mạn.'
    },
    {
      id: `ex-${Date.now()}-2`,
      input: 'Yêu cầu mẫu đầu vào: Trường hợp dữ liệu thiếu sót hoặc không rõ ràng',
      output:
        'Thông báo: "Dữ liệu cung cấp hiện chưa đủ căn cứ để kết luận mục X. Cần bổ sung thêm thông số Y trước khi phân tích tiếp."',
      explanation: 'Thiết lập phản xạ chống ảo giác (Grounding) khi thiếu dữ kiện.'
    }
  ];
}

/**
 * Integrates few-shot examples cleanly into an existing prompt
 */
export function integrateExamplesIntoPrompt(basePrompt: string, examples: FewShotExample[]): string {
  if (!examples || examples.length === 0) return basePrompt;

  const exampleBlock = examples
    .map(
      (ex, i) =>
        `### Example ${i + 1}:\n**Input:**\n${ex.input}\n\n**Expected Output:**\n${ex.output}${
          ex.explanation ? `\n*(Lưu ý: ${ex.explanation})*` : ''
        }`
    )
    .join('\n\n');

  const sectionHeader = `\n\n[EXAMPLES & SPECS]\n${exampleBlock}\n`;

  // Check if [EXAMPLES] already exists in base prompt
  if (/\[EXAMPLES[^\]]*\]/i.test(basePrompt)) {
    return basePrompt.replace(/\[EXAMPLES[^\]]*\][\s\S]*?(?=\n\[|$)/i, `[EXAMPLES & SPECS]\n${exampleBlock}\n`);
  }

  // Check if [OUTPUT FORMAT] exists, append after it
  if (/\[OUTPUT FORMAT\]/i.test(basePrompt)) {
    return basePrompt.replace(
      /(\[OUTPUT FORMAT\][\s\S]*?)(?=\n\[[A-Z\s]+\]|$)/i,
      `$1\n${sectionHeader}`
    );
  }

  return basePrompt.trim() + sectionHeader;
}
