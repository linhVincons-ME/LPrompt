export type PromptIssueSeverity = 'warning' | 'error';

export interface PromptIssue {
  id: string;
  severity: PromptIssueSeverity;
  title: string;
  description: string;
  suggestion: string;
}

const VAGUE_TERMS = [
  'nhanh', 'sớm', 'tốt nhất', 'chuyên nghiệp', 'phù hợp', 'hợp lý',
  'quickly', 'as soon as possible', 'best', 'professional', 'appropriate'
];

function has(text: string, pattern: RegExp): boolean {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

function findLengthConflict(text: string): PromptIssue | null {
  const lowerBounds = [...text.matchAll(/(?:ít nhất|tối thiểu|minimum|at least)\s*(\d+)\s*(từ|words?|ký tự|characters?)/gi)];
  const upperBounds = [...text.matchAll(/(?:không quá|tối đa|dưới|maximum|at most|under)\s*(\d+)\s*(từ|words?|ký tự|characters?)/gi)];
  for (const lower of lowerBounds) {
    for (const upper of upperBounds) {
      const normalizeUnit = (unit: string) => /từ|word/i.test(unit) ? 'word' : 'character';
      if (normalizeUnit(lower[2]) === normalizeUnit(upper[2]) && Number(lower[1]) > Number(upper[1])) {
        return {
          id: 'conflicting-length', severity: 'error', title: 'Giới hạn độ dài mâu thuẫn',
          description: `Yêu cầu tối thiểu ${lower[1]} ${lower[2]} nhưng giới hạn tối đa ${upper[1]} ${upper[2]}.`,
          suggestion: 'Chọn lại một khoảng độ dài có cận tối thiểu không vượt quá cận tối đa.'
        };
      }
    }
  }
  return null;
}

export function inspectPromptLocally(prompt: string): PromptIssue[] {
  const text = prompt.trim();
  if (!text) return [];
  const issues: PromptIssue[] = [];
  const lengthConflict = findLengthConflict(text);
  if (lengthConflict) issues.push(lengthConflict);

  const conflictRules: Array<[string, string, RegExp, RegExp, string]> = [
    ['detail-vs-brief', 'Mức độ chi tiết mâu thuẫn', /(?:thật chi tiết|đầy đủ mọi chi tiết|very detailed|exhaustive)/i, /(?:thật ngắn gọn|cực kỳ ngắn|one sentence only|very concise)/i, 'Chọn ưu tiên chi tiết hoặc đặt giới hạn độ dài cụ thể.'],
    ['language-conflict', 'Ngôn ngữ đầu ra mâu thuẫn', /(?:trả lời|viết|output|respond|write).{0,30}(?:tiếng Việt|Vietnamese)/i, /(?:trả lời|viết|output|respond|write).{0,30}(?:tiếng Anh|English)/i, 'Chỉ định một ngôn ngữ đầu ra hoặc mô tả rõ phần nào dùng từng ngôn ngữ.'],
    ['format-conflict', 'Định dạng đầu ra mâu thuẫn', /(?:chỉ|only).{0,20}(?:JSON)/i, /(?:chỉ|only).{0,20}(?:Markdown)/i, 'Chọn một định dạng duy nhất hoặc mô tả cấu trúc kết hợp hợp lệ.'],
    ['json-vs-explanation', 'Định dạng JSON xung đột với giải thích dài', /(?:chỉ trả về JSON|valid JSON only|strictly JSON|raw JSON)/i, /(?:giải thích chi tiết|kèm bài phân tích|detailed step-by-step reasoning|giải thích từng bước)/i, 'Nếu cần JSON hợp lệ, hãy yêu cầu đưa phần giải thích vào một trường cụ thể trong JSON (như "reasoning") thay vì viết văn bản tự do ngoài cấu trúc.']
  ];
  for (const [id, title, first, second, suggestion] of conflictRules) {
    if (has(text, first) && has(text, second)) {
      issues.push({ id, severity: 'error', title, description: 'Prompt chứa hai chỉ thị khó có thể thỏa mãn đồng thời.', suggestion });
    }
  }

  const vagueFound = VAGUE_TERMS.filter((term) => text.toLocaleLowerCase('vi').includes(term));
  if (vagueFound.length > 0) {
    issues.push({
      id: 'vague-terms', severity: 'warning', title: 'Tiêu chí chưa đo lường được',
      description: `Các từ “${vagueFound.slice(0, 4).join('”, “')}” có thể được hiểu theo nhiều cách.`,
      suggestion: 'Thay bằng tiêu chí cụ thể như số từ, thời hạn, đối tượng đọc hoặc điều kiện đạt.'
    });
  }

  if (has(text, /(?<![\p{L}\p{N}])(?:nó|họ|cái này|việc đó|it|this thing|they)(?![\p{L}\p{N}])/iu) && !has(text, /(?:<user_input>|<yeu_cau_nguoi_dung>|<du_lieu_dau_vao>|\[context\]|\[bối cảnh\]|\[yêu cầu\]|bối cảnh|context)/i)) {
    issues.push({
      id: 'unclear-reference', severity: 'warning', title: 'Tham chiếu có thể chưa rõ',
      description: 'Prompt dùng đại từ hoặc tham chiếu nhưng chưa chỉ rõ đối tượng trong phần bối cảnh.',
      suggestion: 'Thay đại từ bằng tên đối tượng hoặc thêm một câu xác định rõ đối tượng.'
    });
  }
  return issues;
}
