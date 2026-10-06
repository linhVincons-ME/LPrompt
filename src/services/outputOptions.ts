export interface OutputOptions {
  format: 'auto' | 'text' | 'markdown' | 'table' | 'json';
  detail: 'short' | 'standard' | 'detailed';
  missingData: 'ask' | 'partial' | 'stop';
  evidence: boolean;
  maxWords: number | null;
  schema: string;
  domainParameters: string;
}

export const DEFAULT_OUTPUT_OPTIONS: OutputOptions = {
  format: 'auto', detail: 'standard', missingData: 'partial', evidence: false,
  maxWords: null, schema: '', domainParameters: ''
};

export function inspectOutputOptions(options: OutputOptions, instruction: string): string[] {
  const issues: string[] = [];
  if (options.maxWords !== null && (!Number.isInteger(options.maxWords) || options.maxWords < 1)) issues.push('Giới hạn số từ phải là số nguyên lớn hơn 0.');
  if (options.format === 'json' && options.schema.trim()) {
    try {
      const schema = JSON.parse(options.schema);
      if (!schema || Array.isArray(schema) || schema.type !== 'object' || !schema.properties || typeof schema.properties !== 'object' || Array.isArray(schema.properties)) throw new Error();
      if (schema.required && (!Array.isArray(schema.required) || schema.required.some((key: unknown) => typeof key !== 'string' || !(key in schema.properties)))) throw new Error();
    } catch { issues.push('Schema phải là JSON hợp lệ, có type: "object", properties và các trường required tồn tại.'); }
  }
  if (options.format === 'json' && /(?:không|đừng)\s+(?:dùng|trả|xuất)?\s*json|(?:chỉ|only)\s+(?:markdown|văn bản|text|bảng)/i.test(instruction)) issues.push('Chỉ thị bổ sung mâu thuẫn với định dạng JSON đã chọn.');
  if (options.format !== 'auto' && options.format !== 'json' && /(?:chỉ|only)\s+(?:trả\s+)?json/i.test(instruction)) issues.push('Chỉ thị yêu cầu chỉ JSON nhưng bạn đã chọn định dạng khác.');
  return issues;
}

export function outputRules(options: OutputOptions, language: 'vi' | 'en'): string[] {
  const en = language === 'en';
  const rules: string[] = [];
  if (options.format !== 'auto') rules.push(en ? `Output format: ${options.format}.` : `Định dạng đầu ra: ${options.format === 'text' ? 'văn bản thuần' : options.format === 'table' ? 'bảng' : options.format}.`);
  if (options.format === 'json') rules.push(en ? 'Return valid JSON only, without Markdown fences or surrounding commentary.' : 'Chỉ trả JSON hợp lệ, không bọc trong Markdown và không thêm lời giải thích bên ngoài.');
  if (options.format === 'json' && options.schema.trim()) rules.push(`${en ? 'Follow this JSON Schema' : 'Tuân thủ JSON Schema sau'}:\n${options.schema.trim()}`);
  if (options.detail !== 'standard') rules.push(en ? `Detail level: ${options.detail}.` : `Mức chi tiết: ${options.detail === 'short' ? 'ngắn gọn' : 'chi tiết'}.`);
  if (options.evidence) rules.push(en ? 'Include verifiable evidence and explicit assumptions within the requested output format; do not invent citations.' : 'Kèm căn cứ kiểm chứng và giả định rõ ràng trong định dạng đầu ra đã chọn; không tự tạo nguồn trích dẫn.');
  if (options.maxWords !== null) rules.push(en ? `Limit the output to ${options.maxWords} words.` : `Giới hạn đầu ra tối đa ${options.maxWords} từ.`);
  if (options.domainParameters.trim()) rules.push(`${en ? 'Supplied domain parameters' : 'Thông số chuyên ngành được cung cấp'}: ${options.domainParameters.trim()}`);
  return rules;
}

export function missingDataRule(options: OutputOptions, language: 'vi' | 'en'): string {
  const vi = { ask: 'Nếu thiếu dữ liệu quan trọng, hỏi lại và chờ câu trả lời trước khi hoàn thành.', partial: 'Nếu thiếu dữ liệu quan trọng, nêu chính xác phần còn thiếu và chỉ hoàn thành phần an toàn có đủ căn cứ.', stop: 'Nếu thiếu dữ liệu quan trọng, dừng và nêu phần còn thiếu; không suy đoán hoặc đưa kết quả giả định.' };
  const en = { ask: 'If material information is missing, ask for clarification and wait before completing the task.', partial: 'If material information is missing, identify it precisely and complete only the safe portion supported by the input.', stop: 'If material information is missing, stop and identify it; do not speculate or provide hypothetical results.' };
  return (language === 'vi' ? vi : en)[options.missingData];
}
