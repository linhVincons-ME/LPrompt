import type { FewShotExample, FewShotSynthesisResult } from '../types';

/**
 * Sinh các cặp few-shot bằng heuristic cục bộ, không gọi dịch vụ AI.
 */
export async function synthesizeFewShotExamples(
  prompt: string
): Promise<FewShotSynthesisResult> {
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
          'Tiêu đề: "Đối soát bảng chấm công thủ công đang chiếm nhiều thời gian của bạn?"\n\nNội dung chính:\n• Giới thiệu phần mềm quản lý chấm công AI cho doanh nghiệp SME.\n• Chỉ nêu tính năng, mức tiết kiệm và độ chính xác khi có tài liệu xác minh; dữ liệu đầu vào hiện chưa cung cấp các thông tin này.\n\nKêu gọi hành động (CTA): Liên hệ để tìm hiểu tính năng và điều kiện sử dụng thực tế.',
        explanation: 'Minh họa hook và CTA không tự tạo số liệu ROI, tính năng hoặc ưu đãi chưa được xác minh.'
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
