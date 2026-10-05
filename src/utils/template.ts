/**
 * Trích xuất danh sách các biến động {{variable_name}} từ prompt template
 */
export function extractVariables(template: string): string[] {
  if (!template) return [];
  const regex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      matches.add(match[1].trim());
    }
  }
  return Array.from(matches);
}

/**
 * Thay thế các biến {{var}} trong template bằng giá trị người dùng nhập vào
 */
export function interpolateTemplate(template: string, values: Record<string, string>): string {
  if (!template) return '';
  return template.replace(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g, (fullMatch, varName) => {
    const val = values[varName];
    return val !== undefined && val.trim() !== '' ? val : fullMatch;
  });
}

/**
 * Khởi tạo map giá trị mặc định cho danh sách biến
 */
export function getInitialVariableValues(variables: string[], existing: Record<string, string> = {}): Record<string, string> {
  const result: Record<string, string> = { ...existing };
  for (const v of variables) {
    if (result[v] === undefined) {
      result[v] = '';
    }
  }
  return result;
}
