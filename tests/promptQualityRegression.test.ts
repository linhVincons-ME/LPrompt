import { describe, expect, it } from 'vitest';
import { evaluatePromptLocally } from '../src/services/evaluator';
import { synthesizeFewShotExamples } from '../src/services/fewShotSynthesizer';

describe('prompt quality regressions', () => {
  it.each(['không bịa dữ kiện', 'không tự bịa số liệu', 'không tiết lộ thông tin nhạy cảm'])(
    'recognizes Vietnamese guardrail: %s', (guardrail) => {
      expect(evaluatePromptLocally(`Hãy viết báo cáo; ${guardrail}.`, 'research').breakdown.constraints).toBeGreaterThanOrEqual(10);
    }
  );

  it('does not fabricate metrics or promotional offers in marketing examples', async () => {
    const result = await synthesizeFewShotExamples('Viết email quảng cáo sản phẩm.');
    expect(result.integratedPrompt).not.toMatch(/99\.9|12 triệu|30 giây|14 ngày|15 giờ/);
    expect(result.integratedPrompt).toContain('tài liệu xác minh');
  });
});
