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
});
