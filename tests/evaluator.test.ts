import { describe, expect, it } from 'vitest';
import { evaluatePromptLocally } from '../src/services/evaluator';

describe('local evaluator domains', () => {
  it.each(['research', 'image', 'video', 'code', 'audio'] as const)('produces bounded scores and an improved template for %s', (domain) => {
    const report = evaluatePromptLocally('Hãy tạo kết quả rõ ràng.', domain);
    expect(report.total_score).toBeGreaterThanOrEqual(0);
    expect(report.total_score).toBeLessThanOrEqual(100);
    expect(report.improved_prompt.length).toBeGreaterThan(20);
    expect(report.target_domain).toBe(domain);
  });

  it('does not falsely inflate 1-word prompts when wrapped inside compiler template', () => {
    const wrappedPrompt = `[VAI TRÒ]\nBạn là chuyên gia về nghiên cứu. Tạo kết quả chính xác, có thể sử dụng ngay và không tự bịa dữ kiện.\n\n[YÊU CẦU NGƯỜI DÙNG]\n<yeu_cau_nguoi_dung>\nviết\n</yeu_cau_nguoi_dung>\n\n[NGUYÊN TẮC THỰC HIỆN]\n- Giữ nguyên ý định, tên riêng, thông số và ràng buộc trong yêu cầu.\n- Phân biệt rõ dữ kiện đã cung cấp với giả định.\n\n[YÊU CẦU ĐẦU RA]\nTuân thủ định dạng người dùng yêu cầu.`;
    const report = evaluatePromptLocally(wrappedPrompt, 'research');
    // Before fix: jumped to 81 ('Khá') purely because of template boilerplate.
    // After fix: user content 'viết' lacks context/steps/limits/specs, score remains bounded.
    expect(report.total_score).toBeLessThan(60);
    expect(report.tier).toBe('Yếu');
    expect(report.breakdown.examples_specs).toBe(0);
  });

  it('awards 100 points to fully specified prompt covering all 5 PromptOps criteria', () => {
    const fullPrompt = 'Bạn là chuyên gia. Ngữ cảnh: dự án tài chính. Nhiệm vụ: hãy viết theo các bước: bước 1 phân tích, bước 2 báo cáo. Ràng buộc: không được bịa, giới hạn 500 từ. Định dạng: mẫu JSON, chỉ trả về kết quả. Ví dụ: sample input và output.';
    const report = evaluatePromptLocally(fullPrompt, 'research');
    expect(report.total_score).toBe(100);
    expect(report.tier).toBe('Xuất sắc');
    expect(report.breakdown.role_context).toBe(20);
    expect(report.breakdown.task_clarity).toBe(25);
    expect(report.breakdown.constraints).toBe(20);
    expect(report.breakdown.output_format).toBe(20);
    expect(report.breakdown.examples_specs).toBe(15);
  });
});
