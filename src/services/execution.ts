import type { GeminiConfig, PromptExecutionResult } from '../types';
import { generateGeminiContent } from './geminiClient';
import { DEFAULT_GEMINI_MODEL, estimateGeminiCost } from './modelCatalog';

/**
 * Thực thi trực tiếp Prompt qua Google Gemini API và trả về kết quả kèm chỉ số đo lường
 */
export async function executePromptWithGemini(
  prompt: string,
  config: GeminiConfig,
  signal?: AbortSignal
): Promise<PromptExecutionResult> {
  const p = prompt.trim();
  if (!p) {
    throw new Error('Nội dung prompt đang trống. Vui lòng nhập prompt trước khi chạy thử.');
  }

  // Nếu người dùng ĐÃ có API Key
  if (config.apiKey) {
    const startTime = performance.now();
    const generated = await generateGeminiContent(p, config, { temperature: config.temperature ?? 0.7, signal });
    const latencyMs = Math.round(performance.now() - startTime);
    const cost = estimateGeminiCost(generated.model, generated.usage.inputTokens, generated.usage.outputTokens);

    return {
      output: generated.text,
      latencyMs,
      tokens: {
        input: generated.usage.inputTokens,
        output: generated.usage.outputTokens,
        total: generated.usage.totalTokens
      },
      estimatedCostUsd: cost,
      modelUsed: generated.model,
      executedAt: new Date().toISOString(),
      source: 'api'
    };
  }

  // NẾU CHƯA CÓ API KEY: Chế độ giả lập thông minh (Offline Simulation)
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Yêu cầu đã bị hủy.', 'AbortError'));
    const timeout = globalThis.setTimeout(resolve, 600);
    signal?.addEventListener('abort', () => {
      globalThis.clearTimeout(timeout);
      reject(new DOMException('Yêu cầu đã bị hủy.', 'AbortError'));
    }, { once: true });
  });
  const inputWords = p.split(/\s+/).length;
  const simulatedOutput = `[KẾT QUẢ MÔ PHỎNG TỪ GEMINI FLASH/PRO (Chế độ Offline)]

Chào bạn! Đây là kết quả mẫu sinh ra từ nội dung Prompt của bạn. 
Để nhận phản hồi thực tế từ mô hình AI, hãy cấu hình Google Gemini API Key. Hạn mức phụ thuộc dự án và tài khoản trong Google AI Studio.

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
    modelUsed: `${config.model || DEFAULT_GEMINI_MODEL} (Mô phỏng)`,
    executedAt: new Date().toISOString(),
    source: 'simulation'
  };
}
