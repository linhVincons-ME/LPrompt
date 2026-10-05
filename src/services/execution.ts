import type { PromptExecutionResult } from '../types';

/**
 * Tạo bản xem trước cục bộ để kiểm tra prompt mà không gọi mạng.
 */
export async function previewPromptLocally(
  prompt: string,
  signal?: AbortSignal
): Promise<PromptExecutionResult> {
  const p = prompt.trim();
  if (!p) {
    throw new Error('Nội dung prompt đang trống. Vui lòng nhập prompt trước khi chạy thử.');
  }

  const startedAt = performance.now();
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Yêu cầu đã bị hủy.', 'AbortError'));
    const timeout = globalThis.setTimeout(resolve, 600);
    signal?.addEventListener('abort', () => {
      globalThis.clearTimeout(timeout);
      reject(new DOMException('Yêu cầu đã bị hủy.', 'AbortError'));
    }, { once: true });
  });
  const inputWords = p.split(/\s+/).length;
  const simulatedOutput = `[BẢN XEM TRƯỚC CỤC BỘ]

Đây không phải phản hồi của mô hình AI. LPrompt chỉ kiểm tra cấu trúc trước khi bạn chèn prompt vào Gemini Web.

- Độ dài đầu vào: ${inputWords} từ (${p.length} ký tự).
- Biến template còn lại: ${(p.match(/\{\{[^{}]+\}\}/g) ?? []).length}.
- Có output contract: ${/output|đầu ra|format|định dạng/i.test(p) ? 'Có' : 'Chưa rõ'}.
- Có guardrail: ${/không|never|must not|guardrail|ràng buộc/i.test(p) ? 'Có' : 'Chưa rõ'}.

Để nhận phản hồi thực tế, hãy dùng extension LPrompt để chèn prompt vào Gemini Web và tự bấm gửi.`;

  return {
    output: simulatedOutput,
    latencyMs: Math.round(performance.now() - startedAt),
    tokens: {
      input: Math.round(p.length / 4),
      output: Math.round(simulatedOutput.length / 4),
      total: Math.round((p.length + simulatedOutput.length) / 4)
    },
    executedAt: new Date().toISOString(),
    source: 'local-preview'
  };
}
