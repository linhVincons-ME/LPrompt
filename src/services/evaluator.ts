import type { PromptDomain, PromptEvaluation, QualityTier } from '../types';

export function calculateTier(score: number): QualityTier {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 75) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}
/**
 * Đánh giá Prompt cục bộ bằng Heuristic & Regex Chuẩn Song Ngữ (Việt - Anh & Thẻ tiền tố Kỹ thuật)
 * 100% MIỄN PHÍ, chạy trên Client 0ms với độ chính xác cao
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

  // =========================================================================
  // 1. ROLE & CONTEXT (Tối đa 20 điểm)
  // Hỗ trợ cả tiếng Việt, tiếng Anh và cấu trúc thẻ kỹ thuật: [ROLE], [PERSONA], etc.
  // =========================================================================
  const rolePatterns = [
    // Tiền tố thẻ chuẩn
    /\[role[^\]]*\]/i,
    /\[persona[^\]]*\]/i,
    /\[identity[^\]]*\]/i,
    /\[expert[^\]]*\]/i,
    /role\s*:/i,
    /persona\s*:/i,
    // Tiếng Việt
    /bạn là/i,
    /chuyên gia/i,
    /đóng vai/i,
    /vai trò/i,
    /nhập vai/i,
    /hãy là/i,
    /kỹ sư/i,
    /kiến trúc sư/i,
    /lập trình viên/i,
    /chuyên viên/i,
    /nhà nghiên cứu/i,
    /chỉ đạo nghệ thuật/i,
    // Tiếng Anh
    /you are/i,
    /act as/i,
    /assume the role/i,
    /as an?\s+(expert|senior|lead|principal|specialist|architect|engineer|consultant|director|fellow|artist|photographer|master)/i,
    /world-renowned/i,
    /award-winning/i,
    /experienced/i,
    /master concept artist/i,
    /director of photography/i,
    /software engineer/i,
    /system architect/i,
    /research fellow/i,
    /data scientist/i,
    /art director/i,
    /creative director/i,
    /tech lead/i
  ];

  const contextPatterns = [
    /\[context[^\]]*\]/i,
    /\[background[^\]]*\]/i,
    /\[objective[^\]]*\]/i,
    /\[mandate[^\]]*\]/i,
    /\[scenario[^\]]*\]/i,
    /\[scope[^\]]*\]/i,
    /context\s*:/i,
    /background\s*:/i,
    /objective\s*:/i,
    /goal\s*:/i,
    /scenario\s*:/i,
    /target audience/i,
    /use case\s*:/i,
    // Tiếng Việt
    /trong bối cảnh/i,
    /ngữ cảnh/i,
    /mục tiêu/i,
    /dự án/i,
    /khách hàng/i,
    /đối tượng/i,
    /tình huống/i,
    /bối cảnh bài toán/i,
    /yêu cầu bài toán/i,
    /phạm vi/i,
    /trường hợp sử dụng/i
  ];

  const hasRole = rolePatterns.some((rgx) => rgx.test(lower));
  const hasContext = contextPatterns.some((rgx) => rgx.test(lower));

  if (hasRole) {
    roleScore += 10;
    pros.push('Đã định danh vai trò chuyên gia (Role/Persona rõ ràng)');
  } else {
    missing.push('Chưa xác định vai trò chuyên gia (VD: "Bạn là Senior Architect..." hoặc "[ROLE]: Expert...")');
  }

  if (hasContext || wordCount > 25) {
    roleScore += 10;
    pros.push('Có cung cấp bối cảnh/mục tiêu cụ thể (Context & Objective)');
  } else {
    missing.push('Bối cảnh bài toán còn quá ngắn hoặc chưa rõ mục tiêu cốt lõi');
  }

  // =========================================================================
  // 2. TASK CLARITY & INSTRUCTION STEPS (Tối đa 25 điểm)
  // Hỗ trợ cả tiếng Việt, tiếng Anh và cấu trúc bước [TASK], [STEPS]
  // =========================================================================
  const actionVerbPatterns = [
    // Tiền tố thẻ
    /\[task[^\]]*\]/i,
    /\[instruction[^\]]*\]/i,
    /\[objective[^\]]*\]/i,
    /\[subject[^\]]*\]/i,
    /\[requirements?[^\]]*\]/i,
    /task\s*:/i,
    /instructions?\s*:/i,
    // Tiếng Việt
    /hãy/i,
    /viết/i,
    /tạo/i,
    /phân tích/i,
    /xây dựng/i,
    /tối ưu/i,
    /thiết kế/i,
    /triển khai/i,
    /giải thích/i,
    /tóm tắt/i,
    /nghiên cứu/i,
    /chụp/i,
    /quay/i,
    /vẽ/i,
    /biên soạn/i,
    /lập trình/i,
    /đánh giá/i,
    /tổng hợp/i,
    /đề xuất/i,
    /kiểm tra/i,
    /xác minh/i,
    /chuẩn hóa/i,
    // Tiếng Anh
    /generate/i,
    /write/i,
    /create/i,
    /analyze/i,
    /build/i,
    /develop/i,
    /optimize/i,
    /implement/i,
    /design/i,
    /draft/i,
    /refactor/i,
    /summarize/i,
    /explain/i,
    /render/i,
    /conduct/i,
    /investigate/i,
    /produce/i,
    /capture/i,
    /shot on/i,
    /provide/i,
    /execute/i
  ];

  const stepsPatterns = [
    /\[steps?[^\]]*\]/i,
    /\[execution[^\]]*\]/i,
    /\[methodology[^\]]*\]/i,
    /\[workflow[^\]]*\]/i,
    // Tiếng Việt
    /bước 1/i,
    /bước 2/i,
    /thứ nhất/i,
    /thứ hai/i,
    /giai đoạn 1/i,
    /quy trình/i,
    /yêu cầu chi tiết/i,
    // Tiếng Anh
    /step 1/i,
    /step 2/i,
    /first,/i,
    /second,/i,
    /finally/i,
    /phase 1/i,
    /phase 2/i,
    /step-by-step/i,
    /workflow:/i,
    /procedure:/i,
    /(^|\n)\s*1\.\s+/i,
    /(^|\n)\s*2\.\s+/i,
    /(^|\n)\s*-\s+/i
  ];

  const hasActionVerb = actionVerbPatterns.some((rgx) => rgx.test(lower));
  const hasSteps = stepsPatterns.some((rgx) => rgx.test(lower));

  if (hasActionVerb) {
    taskScore += 15;
    pros.push('Mệnh lệnh và nhiệm vụ hành động rõ ràng (Task/Instruction)');
  } else {
    missing.push('Thiếu động từ hành động dứt khoát (VD: "Implement", "Phân tích", "Tạo...")');
  }

  if (hasSteps || wordCount > 35) {
    taskScore += 10;
    pros.push('Có phân rã các bước hoặc hướng dẫn tư duy logic (Step-by-step / CoT)');
  } else {
    missing.push('Nhiệm vụ còn chung chung, nên chia theo các bước cụ thể (Step 1, Step 2...)');
  }

  // =========================================================================
  // 3. CONSTRAINTS & NEGATIVES (Tối đa 20 điểm)
  // Rào chắn tiêu cực, negative prompt, giới hạn độ dài/tone
  // =========================================================================
  const negativePatterns = [
    /\[negative[^\]]*\]/i,
    /\[constraints?[^\]]*\]/i,
    /\[rules?[^\]]*\]/i,
    /\[guardrails?[^\]]*\]/i,
    /constraints?\s*:/i,
    /rules?\s*:/i,
    /negative\s*prompt\s*:/i,
    // Tiếng Việt
    /không được/i,
    /không (?:tự )?(?:bịa|suy diễn|tiết lộ|tạo nguồn|tạo số liệu|bịa đặt|chế biến)/i,
    /chống ảo giác/i,
    /zero hallucination/i,
    /không bịa/i,
    /không giả định/i,
    /chỉ dùng thông tin đã cấp/i,
    /tránh/i,
    /cấm/i,
    /đừng/i,
    /tuyệt đối không/i,
    /hạn chế/i,
    // Tiếng Anh
    /do not/i,
    /don't/i,
    /avoid/i,
    /never/i,
    /strictly avoid/i,
    /must not/i,
    /shall not/i,
    /exclude/i,
    /without/i,
    /prohibited/i,
    /--no/i,
    /lowres/i,
    /bad anatomy/i,
    /blurry/i,
    /watermark/i,
    /deformed/i,
    /artifacts/i
  ];

  const limitPatterns = [
    /\[tone[^\]]*\]/i,
    /\[style[^\]]*\]/i,
    /tone\s*:/i,
    /style\s*:/i,
    // Tiếng Việt
    /tối đa/i,
    /giới hạn/i,
    /độ dài/i,
    /khoảng/i,
    /trong vòng/i,
    /giọng điệu/i,
    /ngắn gọn/i,
    /súc tích/i,
    // Tiếng Anh
    /limit/i,
    /max\s+/i,
    /maximum/i,
    /word count/i,
    /concise/i,
    /detailed/i,
    /objective/i,
    /rigorous/i,
    /professional/i,
    /academic/i,
    /friendly/i,
    /formal/i
  ];

  const hasNegative = negativePatterns.some((rgx) => rgx.test(lower));
  const hasLimits = limitPatterns.some((rgx) => rgx.test(lower));

  if (hasNegative) {
    constraintScore += 10;
    pros.push('Có quy định điều cấm kỵ / Rào chắn lỗi (Negative constraints / Guardrails)');
  } else {
    missing.push('Chưa có danh sách điều KHÔNG ĐƯỢC LÀM (Negative rules) để tránh AI suy diễn sai');
  }

  if (hasLimits) {
    constraintScore += 10;
    pros.push('Có giới hạn độ dài, tiêu chuẩn phong cách hoặc giọng điệu (Tone & Limits)');
  } else {
    missing.push('Thiếu quy định về giới hạn độ dài hoặc giọng điệu');
  }

  // =========================================================================
  // 4. OUTPUT FORMAT & SCHEMA (Tối đa 20 điểm)
  // Định dạng dữ liệu đầu ra và ràng buộc không trả về lời chào hỏi
  // =========================================================================
  const formatPatterns = [
    /\[output[^\]]*\]/i,
    /\[deliverable[^\]]*\]/i,
    /\[schema[^\]]*\]/i,
    /\[parameters?[^\]]*\]/i,
    /output\s*(format|schema)?\s*:/i,
    /format\s*:/i,
    /schema\s*:/i,
    // Tiếng Việt
    /định dạng/i,
    /bảng/i,
    /danh sách/i,
    /mẫu json/i,
    /khung code/i,
    /tỷ lệ khung hình/i,
    // Tiếng Anh & Định dạng chuẩn
    /json/i,
    /markdown/i,
    /table/i,
    /bullet points?/i,
    /csv/i,
    /yaml/i,
    /code block/i,
    /pydantic/i,
    /typescript interface/i,
    /schema/i,
    /fenced code/i,
    /mermaid/i,
    /--ar/i,
    /aspect ratio/i
  ];

  const strictFormatPatterns = [
    // Tiếng Việt
    /chỉ trả về/i,
    /không giải thích thêm/i,
    /không chào hỏi/i,
    /không lan man/i,
    /chỉ xuất ra/i,
    // Tiếng Anh
    /only return/i,
    /return only/i,
    /no preamble/i,
    /no explanation/i,
    /no conversational filler/i,
    /strict json/i,
    /raw json/i,
    /output only/i,
    /without intro/i,
    /pure code/i,
    /just the code/i
  ];

  const hasFormat = formatPatterns.some((rgx) => rgx.test(lower));
  const hasStrictFormat = strictFormatPatterns.some((rgx) => rgx.test(lower));

  if (hasFormat) {
    formatScore += 12;
    pros.push('Có chỉ định cấu trúc định dạng đầu ra (Output Format / Schema)');
  } else {
    missing.push('Chưa yêu cầu rõ định dạng output (VD: Markdown table, JSON Schema, hoặc Code block)');
  }

  if (hasStrictFormat) {
    formatScore += 8;
    pros.push('Có ràng buộc nghiêm ngặt chỉ trả về format mong muốn (Strict Output)');
  } else {
    missing.push('Nên thêm yêu cầu "Chỉ trả về kết quả, không chào hỏi lan man" (Only return...)');
  }

  // =========================================================================
  // 5. EXAMPLES & TECHNICAL SPECS (Tối đa 15 điểm)
  // Nhận diện tham số kỹ thuật chuyên ngành đa phương thức
  // =========================================================================
  let domainSpecsBonus = false;

  if (domain === 'image') {
    domainSpecsBonus = /(shot on|hasselblad|canon|sony|nikon|lens|85mm|35mm|50mm|16mm|f\/1\.[0-9]|f\/2\.[0-9]|bokeh|depth of field|volumetric|golden hour|chiaroscuro|lighting|8k|4k|uhd|photorealistic|hyper-realistic|octane|unreal engine|--ar|--v|--style|aspect ratio|close-up|portrait|ống kính|tiêu cự|xóa phông|độ sâu trường ảnh|ánh sáng|độ phân giải cao|tỷ lệ|cận cảnh|toàn cảnh|chân dung)/i.test(lower);
  } else if (domain === 'video') {
    domainSpecsBonus = /(camera movement|dolly|pan|tilt|zoom|fpv|drone|tracking shot|fps|24fps|60fps|motion speed|motion factor|cinematic|aspect ratio|2\.39:1|16:9|first frame|last frame|parallax|temporal|chuyển động camera|tốc độ chuyển động|điện ảnh|tỷ lệ khung hình|khung hình đầu)/i.test(lower);
  } else if (domain === 'code') {
    domainSpecsBonus = /(typescript|python|golang|rust|c\+\+|java|react|fastapi|docker|clean architecture|solid|pydantic|pytest|jest|unit test|benchmark|async\/await|error handling|type hints|docstrings|ast|kiểm thử|xử lý lỗi|bắt ngoại lệ)/i.test(lower);
  } else if (domain === 'audio') {
    domainSpecsBonus = /(\[intro[^\]]*\]|\[verse[^\]]*\]|\[chorus[^\]]*\]|\[bridge[^\]]*\]|\[outro[^\]]*\]|bpm|key of|tempo|acoustic|guitar|piano|lo-fi|vinyl|reverb|vocals|suno|udio|giai điệu|tiết tấu|hòa âm)/i.test(lower);
  } else {
    domainSpecsBonus = /(ví dụ|example|few-shot|mẫu|input:|output:|sample:|chẳng hạn|empirical data|metrics|cagr|swot|dữ liệu thực tế|chỉ số đo lường)/i.test(lower);
  }

  // Kiểm tra Few-shot example chung
  const hasExamples = /(ví dụ|example|few-shot|mẫu input|mẫu output|sample input|sample output|e\.g\.|for instance)/i.test(lower);

  if (domainSpecsBonus || hasExamples) {
    specsScore = 15;
    pros.push(`Đã tích hợp đầy đủ tham số kỹ thuật / ví dụ mẫu chuyên ngành ${domain.toUpperCase()}`);
  } else {
    specsScore = wordCount > 45 ? 6 : 0;
    if (domain === 'image' || domain === 'video') {
      missing.push('Thiếu tham số kỹ thuật hình ảnh/camera (Lens, Ánh sáng, Tỷ lệ --ar, hoặc Chuyển động camera)');
    } else if (domain === 'code') {
      missing.push('Thiếu phiên bản công nghệ cụ thể, cấu trúc module hoặc yêu cầu Unit Test');
    } else {
      missing.push('Chưa có ví dụ đầu vào/đầu ra mẫu (Few-shot learning hoặc Input/Output sample)');
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
 * Sinh prompt nâng cấp mẫu hoàn toàn cục bộ.
 */
function generateLocalImprovedPrompt(original: string, domain: PromptDomain): string {
  const clean = original.trim();
  const isVi = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(clean);

  switch (domain) {
    case 'image':
      return `[ROLE]: World-renowned commercial photographer and digital concept artist.
[SUBJECT & SCENE]: ${clean}
[ENVIRONMENT & LIGHTING]: Volumetric cinematic lighting, golden hour rim lights, soft diffused shadows, atmospheric particles.
[CAMERA & SPECS]: Shot on Hasselblad H6D-100c, 85mm f/1.4 lens, shallow depth of field, sharp hyper-detailed focus, 8K UHD.
[NEGATIVE PROMPT / CONSTRAINTS]: blur, low resolution, bad anatomy, deformed limbs, artifacts, watermark, oversaturated.
[PARAMETERS]: --ar 16:9 --style raw --v 6.1 --stop 100`;

    case 'video':
      return `[ROLE]: Hollywood Director of Photography and VFX Artist.
[SCENE DESCRIPTION]: ${clean}
[CAMERA MOVEMENT]: Smooth cinematic drone dolly-in forward, steady panning with subtle parallax effect.
[MOTION & LIGHTING]: Realistic physical motion speed 4/10, volumetric mist, photorealistic ray tracing, cinematic color grade.
[TECHNICAL SPECS]: 24fps, 4K resolution, cinematic aspect ratio 16:9, fluid continuous motion without morphing glitches.`;

    case 'code':
      if (isVi) {
        return `[VAI TRÒ]: Kỹ sư phần mềm Principal và Kiến trúc sư hệ thống.
[NHIỆM VỤ]: Thiết kế và triển khai tính năng đạt tiêu chuẩn production:
"${clean}"

[YÊU CẦU & KIẾN TRÚC]:
1. Viết code module hóa, rõ ràng, định kiểu tĩnh nghiêm ngặt và tuân thủ nguyên lý SOLID.
2. Xử lý ngoại lệ đầy đủ, quản lý timeout và cơ chế suy giảm mềm (graceful degradation).
3. Tối ưu độ phức tạp thời gian/không gian (O(N) hoặc tốt hơn ở luồng chính).

[RÀNG BUỘC]:
- Không dùng thư viện không an toàn hoặc đã ngừng hỗ trợ (deprecated).
- Bao gồm các ca kiểm thử đơn vị (unit tests) cho ca biên (input rỗng, timeout, dữ liệu sai định dạng).

[ĐỊNH DẠNG ĐẦU RA]:
- Trình bày mã nguồn hoàn chỉnh trong khối code Markdown có chú thích docstring rõ ràng.
- Kèm theo 3 gạch đầu dòng tóm lược quyết định kỹ thuật quan trọng.`;
      }
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

    case 'audio':
      if (isVi) {
        return `[VAI TRÒ]: Giám đốc sản xuất âm nhạc và Chuyên gia thiết kế âm thanh.
[NHIỆM VỤ]: Thiết lập prompt tạo âm thanh chất lượng phòng thu cho: "${clean}"
[THÔNG SỐ ÂM NHẠC]: Xác định thể loại, nhịp điệu (BPM), điệu tính (Key), bộ nhạc cụ, chất giọng và dải tần.
[CẤU TRÚC]: [Intro], [Verse], [Chorus], [Bridge], [Outro].
[RÀNG BUỘC]: Tránh méo tiếng (clipping), đục dải trầm, đổi nhịp bất thường và bắt chước phong cách vi phạm bản quyền.
[ĐỊNH DẠNG ĐẦU RA]: Trả về 1 đoạn prompt âm thanh hoàn chỉnh kèm khối negative prompt ngắn gọn.`;
      }
      return `[ROLE]: Senior Music Producer and Sound Designer.
[TASK]: Create an audio-generation prompt for: "${clean}"
[MUSICAL SPECS]: Define genre, BPM, key, instrumentation, vocal texture, dynamics, and mix character.
[STRUCTURE]: [Intro], [Verse], [Chorus], [Bridge], [Outro].
[CONSTRAINTS]: Avoid clipping, muddy low-end, abrupt transitions, and unlicensed artist imitation.
[OUTPUT FORMAT]: Return one production-ready audio prompt followed by a compact negative prompt.`;

    case 'research':
    default:
      if (isVi) {
        return `[VAI TRÒ]: Chuyên gia nghiên cứu và Cố vấn phân tích chiến lược.
[BỐI CẢNH & MỤC TIÊU]: Phân tích chuyên sâu và toàn diện cho chủ đề:
"${clean}"

[CÁC BƯỚC THỰC HIỆN]:
1. Tóm tắt điều hành: Luận điểm cốt lõi và phát hiện then chốt.
2. Phân tích chi tiết: Khảo sát đa chiều kèm chỉ số định lượng và điểm đánh đổi (trade-offs).
3. Rủi ro & Thách thức: Nhận diện điểm nghẽn cùng giải pháp phòng ngừa rủi ro.
4. Đề xuất hành động: Lộ trình triển khai phân kỳ kèm thứ tự ưu tiên rõ ràng.

[RÀNG BUỘC & GIỌNG ĐIỆU]:
- Giọng điệu khách quan, chặt chẽ, dựa trên dữ liệu, không dùng từ ngữ quảng cáo thổi phồng.
- Không tự suy diễn hay bịa số liệu; nêu rõ giả định đối với thông tin chưa có tài liệu xác thực.

[ĐỊNH DẠNG ĐẦU RA]:
- Định dạng GitHub Flavored Markdown với bảng so sánh và các đề mục rõ ràng.`;
      }
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
- Structured GitHub Flavored Markdown với executive tables and comparative metrics.`;
  }
}
