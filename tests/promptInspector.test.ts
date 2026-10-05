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
});
