import { describe, expect, it } from 'vitest';
import { compilePromptFramework } from '../src/services/frameworkCompiler';
import { DEFAULT_OUTPUT_OPTIONS, inspectOutputOptions } from '../src/services/outputOptions';

describe('structured output options', () => {
  it('replaces the missing-data policy and retains instructions in both languages', () => {
    for (const outputLanguage of ['vi', 'en'] as const) {
      const result = compilePromptFramework('Phân tích dữ liệu', 'STANDARD', {
        outputLanguage, additionalInstruction: 'Giữ tên Alpha',
        outputOptions: { ...DEFAULT_OUTPUT_OPTIONS, missingData: 'ask', format: 'json', maxWords: 100 }
      });
      expect(result.prompt).toContain('Giữ tên Alpha');
      expect(result.prompt).toContain('100');
      expect(result.prompt).toContain(outputLanguage === 'vi' ? 'hỏi lại và chờ' : 'ask for clarification and wait');
      expect(result.prompt).not.toContain(outputLanguage === 'vi' ? 'chỉ hoàn thành phần an toàn' : 'complete only the safe portion');
    }
  });
  it('rejects malformed schemas and conflicting instructions', () => {
    expect(inspectOutputOptions({ ...DEFAULT_OUTPUT_OPTIONS, format: 'json', schema: '{' }, '')).toHaveLength(1);
    expect(() => compilePromptFramework('Test', 'STANDARD', {
      outputOptions: { ...DEFAULT_OUTPUT_OPTIONS, format: 'json' }, additionalInstruction: 'chỉ văn bản'
    })).toThrow('mâu thuẫn');
  });
  it('preserves supplied schema and reports actual options', () => {
    const schema = JSON.stringify({ type: 'object', properties: { result: { type: 'string' } }, required: ['result'] });
    const result = compilePromptFramework('Test', 'STANDARD', { outputOptions: { ...DEFAULT_OUTPUT_OPTIONS, format: 'json', schema, evidence: true } });
    expect(result.prompt).toContain(schema);
    expect(result.changes?.join('\n')).toContain('Kèm căn cứ kiểm chứng');
  });
});
