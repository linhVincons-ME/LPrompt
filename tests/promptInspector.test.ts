import { describe, expect, it } from 'vitest';
import { inspectPromptLocally } from '../src/services/promptInspector';

describe('local prompt ambiguity and conflict inspector', () => {
  it('detects incompatible length and language constraints', () => {
    const issues = inspectPromptLocally('Viết ít nhất 500 từ nhưng không quá 100 từ. Trả lời bằng tiếng Việt và output in English.');
    expect(issues.map((issue) => issue.id)).toEqual(expect.arrayContaining(['conflicting-length', 'language-conflict']));
    expect(issues.filter((issue) => issue.severity === 'error')).toHaveLength(2);
  });

  it('flags vague criteria without inventing a rewrite', () => {
    const issues = inspectPromptLocally('Hãy viết một báo cáo chuyên nghiệp và hoàn thành nhanh.');
    expect(issues.some((issue) => issue.id === 'vague-terms')).toBe(true);
  });

  it('returns no findings for a measurable prompt', () => {
    expect(inspectPromptLocally('Viết báo cáo tiếng Việt từ 300 đến 500 từ cho kỹ sư điện. Trả về Markdown.')).toEqual([]);
  });

  it('detects conflict between strict JSON output and long narrative explanation', () => {
    const issues = inspectPromptLocally('Chỉ trả về JSON hợp lệ và giải thích chi tiết từng bước cho người mới bắt đầu.');
    expect(issues.some((issue) => issue.id === 'json-vs-explanation')).toBe(true);
  });

  it('recognizes Vietnamese context tags without false pronoun warnings', () => {
    const prompt = 'Hãy phân tích nó cẩn thận theo quy chuẩn.\n<yeu_cau_nguoi_dung>Hồ sơ bản vẽ chi tiết</yeu_cau_nguoi_dung>';
    const issues = inspectPromptLocally(prompt);
    expect(issues.some((issue) => issue.id === 'unclear-reference')).toBe(false);
  });

  it('detects unclear Vietnamese pronouns when no context is provided', () => {
    const prompt = 'Hãy sửa nó cho tốt hơn và gửi cho họ.';
    const issues = inspectPromptLocally(prompt);
    expect(issues.some((issue) => issue.id === 'unclear-reference')).toBe(true);
  });
});
