import type { PromptDomain, PromptEvaluation, QualityTier, GeminiConfig } from '../types';

export function calculateTier(score: number): QualityTier {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 75) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}

/**
 * Đánh giá Prompt cục bộ bằng Heuristic & Regex (100% MIỄN PHÍ, chạy trên Client 0ms)
 */
export function evaluatePromptLocally(prompt: string, domain: PromptDomain): PromptEvaluation {
  const p = prompt.trim();
  const lower = p.toLowerCase();
  const wordCount = p ? p.split(/\s+/).length : 0;

  let roleScore = 0;
  let taskScore = 0;
  let constraintScore = 0;
  let formatScore = 0;
  let specsScore = 0;

  const pros: string[] = [];
  const missing: string[] = [];

  if (wordCount === 0) {
    return {
      total_score: 0,
      tier: 'Yếu',
      breakdown: { role_context: 0, task_clarity: 0, constraints: 0, output_format: 0, examples_specs: 0 },
      critique: { pros: [], missing: ['Vui lòng nhập nội dung prompt để đánh giá.'] },
      improved_prompt: '',
      target_domain: domain,
      source: 'local'
    };
  }

  // 1. Role & Context (Tối đa 20 điểm)
  const hasRole = /(bạn là|chuyên gia|đóng vai|vai trò|nhập vai|you are|act as|as an? expert|as a senior|role:)/i.test(lower);
  const hasContext = /(trong bối cảnh|ngữ cảnh|mục tiêu|dự án|khách hàng|target audience|context:|background:|scenario:)/i.test(lower);
  
  if (hasRole) {
    roleScore += 10;
    pros.push('Đã định danh vai trò chuyên gia rõ ràng');
  } else {
    missing.push('Chưa xác định vai trò chuyên gia (VD: "Bạn là Senior Architect...")');
  }

  if (hasContext || wordCount > 25) {
    roleScore += 10;
    pros.push('Có cung cấp bối cảnh cụ thể');
  } else {
    missing.push('Ngữ cảnh quá ngắn hoặc thiếu bối cảnh bài toán');
  }

  // 2. Task Clarity & Steps (Tối đa 25 điểm)
  const hasActionVerb = /(hãy|viết|tạo|phân tích|xây dựng|tối ưu|thiết kế|generate|write|create|analyze|build|develop|optimize)/i.test(lower);
  const hasSteps = /(bước 1|bước 2|step 1|step 2|thứ nhất|thứ hai|quy trình|yêu cầu chi tiết|first|then|finally|1\.|2\.)/i.test(lower);

  if (hasActionVerb) {
    taskScore += 15;
    pros.push('Mệnh lệnh hành động rõ ràng');
  } else {
    missing.push('Thiếu động từ hành động dứt khoát');
  }

  if (hasSteps || wordCount > 35) {
    taskScore += 10;
    pros.push('Có chia nhỏ các bước hoặc hướng dẫn tư duy logic');
  } else {
    missing.push('Nhiệm vụ còn chung chung, nên chia theo các bước (Step-by-step)');
  }

  // 3. Constraints & Negatives (Tối đa 20 điểm)
  const hasNegative = /(không được|tránh|cấm|đừng|tuyệt đối không|do not|don't|avoid|never|no \w+|negative prompt)/i.test(lower);
  const hasLimits = /(tối đa|giới hạn|độ dài|khoảng|trong vòng|tone|giọng điệu|limit|max|words|concise|detailed)/i.test(lower);

  if (hasNegative) {
    constraintScore += 10;
    pros.push('Có quy định điều cấm kỵ (Negative constraints)');
  } else {
    missing.push('Chưa có danh sách điều KHÔNG ĐƯỢC LÀM để tránh AI suy diễn sai');
  }

  if (hasLimits) {
    constraintScore += 10;
    pros.push('Có giới hạn độ dài hoặc quy chuẩn phong cách');
  } else {
    missing.push('Thiếu giới hạn dung lượng hoặc quy định về giọng điệu');
  }

  // 4. Output Format (Tối đa 20 điểm)
  const hasFormat = /(json|markdown|bảng|table|bullet points|schema|danh sách|định dạng|format:|code block|--ar|tỷ lệ)/i.test(lower);
  const hasStrictFormat = /(chỉ trả về|không giải thích thêm|only return|no preamble|strict json|output schema)/i.test(lower);

  if (hasFormat) {
    formatScore += 12;
    pros.push('Có chỉ định cấu trúc định dạng đầu ra');
  } else {
    missing.push('Chưa yêu cầu rõ định dạng output (Markdown table, JSON hay Code)');
  }

  if (hasStrictFormat) {
    formatScore += 8;
    pros.push('Có ràng buộc nghiêm ngặt chỉ trả về format mong muốn');
  } else {
    missing.push('Nên thêm yêu cầu "Chỉ trả về kết quả, không chào hỏi lan man"');
  }

  // 5. Examples & Technical Specs (Tối đa 15 điểm)
  let domainSpecsBonus = false;
  if (domain === 'image') {
    domainSpecsBonus = /(--ar|--v|aspect ratio|lighting|8k|lens|unreal engine|octane|cinematic|photorealistic|dslr)/i.test(lower);
  } else if (domain === 'video') {
    domainSpecsBonus = /(camera|pan|tilt|dolly|zoom|fps|motion|cinematic|first frame|last frame|4k|wide shot)/i.test(lower);
  } else if (domain === 'code') {
    domainSpecsBonus = /(typescript|python|golang|rust|react|api|docker|unit test|benchmark|async\/await|error handling)/i.test(lower);
  } else if (domain === 'audio') {
    domainSpecsBonus = /(\[verse\]|\[chorus\]|bpm|key|vocal|tempo|genre|acoustic|electronic)/i.test(lower);
  } else {
    domainSpecsBonus = /(ví dụ|example|few-shot|mẫu|input:|output:|chẳng hạn)/i.test(lower);
  }

  if (domainSpecsBonus) {
    specsScore = 15;
    pros.push(`Đã tích hợp các tham số đặc thù của chuyên ngành ${domain.toUpperCase()}`);
  } else {
    specsScore = wordCount > 50 ? 5 : 0;
    if (domain === 'image' || domain === 'video') {
      missing.push('Thiếu tham số kỹ thuật hình ảnh/camera (Ánh sáng, góc quay, tỷ lệ --ar)');
    } else if (domain === 'code') {
      missing.push('Thiếu phiên bản công nghệ, cấu trúc file hoặc yêu cầu unit test mẫu');
    } else {
      missing.push('Chưa có ví dụ đầu vào/đầu ra mẫu (Few-shot learning)');
    }
  }

  const total = Math.min(100, Math.max(10, roleScore + taskScore + constraintScore + formatScore + specsScore));
  const tier = calculateTier(total);

  // Sinh bản Prompt nâng cấp cơ bản (Local template)
  const improved = generateLocalImprovedPrompt(p, domain);

  return {
    total_score: total,
    tier,
    breakdown: {
      role_context: roleScore,
      task_clarity: taskScore,
      constraints: constraintScore,
      output_format: formatScore,
      examples_specs: specsScore
    },
    critique: { pros, missing },
    improved_prompt: improved,
    target_domain: domain,
    source: 'local'
  };
}

/**
 * Sinh prompt nâng cấp mẫu trên Local (khi chưa kết nối Gemini API)
 */
function generateLocalImprovedPrompt(original: string, domain: PromptDomain): string {
  const clean = original.trim();
  switch (domain) {
    case 'image':
      return `[ROLE]: World-renowned commercial photographer and digital artist.
[SUBJECT & SCENE]: ${clean}
[ENVIRONMENT & LIGHTING]: Volumetric cinematic lighting, golden hour rim lights, soft diffused shadows, atmospheric particles.
[CAMERA & SPECS]: Shot on Hasselblad H6D-100c, 85mm f/1.4 lens, shallow depth of field, sharp hyper-detailed focus, 8K UHD.
[NEGATIVE PROMPT / CONSTRAINTS]: blur, low resolution, bad anatomy, deformed limbs, artifacts, watermark, oversaturated.
[PARAMETERS]: --ar 16:9 --style raw --v 6.1`;

    case 'video':
      return `[ROLE]: Hollywood Director of Photography and VFX Artist.
[SCENE DESCRIPTION]: ${clean}
[CAMERA MOVEMENT]: Smooth cinematic drone dolly-in forward, steady panning with subtle parallax effect.
[MOTION & LIGHTING]: Realistic physical motion speed 4/10, volumetric mist, photorealistic ray tracing, cinematic color grade.
[TECHNICAL SPECS]: 24fps, 4K resolution, cinematic aspect ratio 16:9, fluid continuous motion without morphing glitches.`;

    case 'code':
      return `[ROLE]: Principal Software Engineer and System Architect.
[TASK]: Implement the following feature with production-grade standards:
"${clean}"

[REQUIREMENTS & ARCHITECTURE]:
1. Write clean, modular, and strongly-typed code following SOLID principles.
2. Include comprehensive error handling, timeout management, and graceful degradation.
3. Optimize for time/space complexity (O(N) or better where applicable).

[CONSTRAINTS]:
- Do NOT use deprecated libraries or unsafe constructs.
- Include unit test cases covering edge cases (empty input, network failure, invalid payload).

[OUTPUT FORMAT]:
- Provide the complete solution in fenced code blocks with clear inline docstrings.
- Add a brief 3-bullet explanation of key design choices.`;

    case 'research':
    default:
      return `[ROLE]: Senior Research Fellow and Strategic Analyst.
[CONTEXT & OBJECTIVE]: In-depth technical and market analysis for:
"${clean}"

[EXECUTION STEPS]:
1. Executive Summary: Core thesis and high-level findings.
2. In-depth Breakdown: Multi-dimensional analysis including quantitative metrics and trade-offs.
3. Critical Challenges & Risks: Failure modes and mitigation strategies.
4. Actionable Recommendations: Phased roadmap with priority rankings.

[CONSTRAINTS & TONE]:
- Tone: Objective, rigorous, data-driven, free of marketing hype.
- Do NOT make unsubstantiated claims; highlight assumptions explicitly.

[OUTPUT FORMAT]:
- Structured GitHub Flavored Markdown with executive tables and comparative metrics.`;
  }
}

/**
 * Đánh giá chuyên sâu & nâng cấp Prompt đạt 95-100 điểm bằng Gemini API
 */
export async function evaluatePromptWithGemini(
  prompt: string,
  domain: PromptDomain,
  config: GeminiConfig
): Promise<PromptEvaluation> {
  if (!config.apiKey) {
    throw new Error('Chưa cung cấp API Key. Vui lòng bấm vào "Cài đặt API Key" để kích hoạt.');
  }

  const systemInstruction = `
Bạn là chuyên gia thẩm định và tối ưu Prompt (Master Prompt Architect & Evaluator).
Nhiệm vụ của bạn là nhận vào một Prompt từ người dùng thuộc lĩnh vực: "${domain.toUpperCase()}".
Hãy thẩm định khắt khe theo bộ quy tắc tiền tố 100 điểm, chỉ ra điểm mạnh, điểm thiếu sót, và tự mình viết lại một phiên bản Prompt nâng cấp HOÀN HẢO (đạt 95-100 điểm) áp dụng đầy đủ các kỹ thuật chuyên sâu (Role, Clear Task, Constraints, Output Schema, Technical Specs).

### Thang điểm đánh giá:
1. role_context (Tối đa 20đ): Vai trò chuyên môn và ngữ cảnh thực tế.
2. task_clarity (Tối đa 25đ): Mệnh lệnh rõ ràng, chia nhỏ các bước logic.
3. constraints (Tối đa 20đ): Quy tắc cấm kỵ (Negative rules), giới hạn độ dài, giọng điệu.
4. output_format (Tối đa 20đ): Định dạng output chặt chẽ (JSON, Markdown, cấu trúc thẻ).
5. examples_specs (Tối đa 15đ): Ví dụ mẫu Few-shot hoặc tham số chuyên ngành (camera, lens, aspect ratio, code stack).

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON với cấu trúc:
{
  "total_score": <số từ 10 đến 100>,
  "tier": "Xuất sắc" | "Khá" | "Trung bình" | "Yếu",
  "breakdown": {
    "role_context": <0-20>,
    "task_clarity": <0-25>,
    "constraints": <0-20>,
    "output_format": <0-20>,
    "examples_specs": <0-15>
  },
  "critique": {
    "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "missing": ["Điểm thiếu sót 1", "Điểm thiếu sót 2"]
  },
  "improved_prompt": "<Nội dung prompt đã được tối ưu hoàn thiện 95-100 điểm, chuyên nghiệp, sẵn sàng copy vào model đích>",
  "target_domain": "${domain}"
}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemInstruction}\n\nĐÂY LÀ PROMPT CẦN ĐÁNH GIÁ VÀ TỐI ƯU:\n"""\n${prompt}\n"""` }
        ]
      }
    ],
    generationConfig: {
      temperature: config.temperature ?? 0.2,
      responseMimeType: 'application/json',
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Lỗi HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Gemini không trả về nội dung hợp lệ.');
  }

  const parsed = JSON.parse(textContent);

  return {
    total_score: parsed.total_score,
    tier: parsed.tier || calculateTier(parsed.total_score),
    breakdown: parsed.breakdown,
    critique: parsed.critique,
    improved_prompt: parsed.improved_prompt,
    target_domain: domain,
    evaluated_at: new Date().toISOString(),
    source: 'gemini'
  };
}
