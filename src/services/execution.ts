import type { GeminiConfig, PromptExecutionResult } from '../types';

/**
 * Tính toán chi phí ước tính dựa trên số lượng token và model Gemini
 */
function calculateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  if (model.includes('flash')) {
    // Giá Gemini 2.0 Flash / 1.5 Flash: $0.075 / 1M input, $0.30 / 1M output
    const costIn = (inputTokens / 1_000_000) * 0.075;
    const costOut = (outputTokens / 1_000_000) * 0.30;
    return Number((costIn + costOut).toFixed(6));
  } else {
    // Giá Gemini 1.5 Pro: $1.25 / 1M input, $5.00 / 1M output
    const costIn = (inputTokens / 1_000_000) * 1.25;
    const costOut = (outputTokens / 1_000_000) * 5.00;
    return Number((costIn + costOut).toFixed(6));
  }
}

/**
 * Thực thi trực tiếp Prompt qua Google Gemini API và trả về kết quả kèm chỉ số đo lường
 */
export async function executePromptWithGemini(
  prompt: string,
  config: GeminiConfig
): Promise<PromptExecutionResult> {
  const p = prompt.trim();
  if (!p) {
    throw new Error('Nội dung prompt đang trống. Vui lòng nhập prompt trước khi chạy thử.');
  }

  // Nếu người dùng ĐÃ có API Key
  if (config.apiKey) {
    const modelToUse = config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${config.apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: p }]
        }
      ],
      generationConfig: {
        temperature: config.temperature ?? 0.7
      }
    };

    const startTime = performance.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Lỗi API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!outputText) {
      throw new Error('Gemini API không trả về nội dung hợp lệ.');
    }

    // Lấy metadata token
    const promptTokens = data?.usageMetadata?.promptTokenCount ?? Math.round(p.length / 4);
    const candidateTokens = data?.usageMetadata?.candidatesTokenCount ?? Math.round(outputText.length / 4);
    const totalTokens = data?.usageMetadata?.totalTokenCount ?? (promptTokens + candidateTokens);

    const cost = calculateCostUsd(modelToUse, promptTokens, candidateTokens);

    return {
      output: outputText,
      latencyMs,
      tokens: {
        input: promptTokens,
        output: candidateTokens,
        total: totalTokens
      },
      estimatedCostUsd: cost,
      modelUsed: modelToUse,
      executedAt: new Date().toISOString(),
      source: 'api'
    };
  }

  // NẾU CHƯA CÓ API KEY: Chế độ giả lập thông minh (Offline Simulation)
  await new Promise((res) => setTimeout(res, 600)); // mô phỏng độ trễ thực tế
  const inputWords = p.split(/\s+/).length;
  const simulatedOutput = `[KẾT QUẢ MÔ PHỎNG TỪ GEMINI FLASH/PRO (Chế độ Offline)]

Chào bạn! Đây là kết quả mẫu sinh ra từ nội dung Prompt của bạn. 
Để nhận phản hồi thực tế từ mô hình AI thật, vui lòng cấu hình Google Gemini API Key (hoàn toàn miễn phí 1.500 lượt/ngày tại aistudio.google.com).

Tóm lược xử lý:
- Đã nhận diện yêu cầu đầu vào với độ dài: ${inputWords} từ (${p.length} ký tự).
- Prompt áp dụng các chỉ dẫn ngữ cảnh và định dạng cấu trúc chuẩn xác.
- Sẵn sàng tích hợp trực tiếp vào ứng dụng thực tế.`;

  return {
    output: simulatedOutput,
    latencyMs: 420,
    tokens: {
      input: Math.round(p.length / 4),
      output: Math.round(simulatedOutput.length / 4),
      total: Math.round((p.length + simulatedOutput.length) / 4)
    },
    estimatedCostUsd: 0,
    modelUsed: `${config.model || 'gemini-2.0-flash'} (Mô phỏng)`,
    executedAt: new Date().toISOString(),
    source: 'simulation'
  };
}
