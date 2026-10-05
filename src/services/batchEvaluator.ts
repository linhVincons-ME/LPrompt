import type { TestCase, TestCaseRunResult, BatchEvaluationSummary } from '../types';
import { interpolateTemplate } from '../utils/template';

/**
 * Generate starter test cases automatically based on detected variables in the prompt
 */
export function generateStarterTestCases(variables: string[]): TestCase[] {
  if (!variables || variables.length === 0) {
    return [
      {
        id: `tc-${Date.now()}-1`,
        name: 'Trường hợp thông thường (Happy Path)',
        variables: {},
        assertionType: 'min_length',
        expectedValue: '50'
      },
      {
        id: `tc-${Date.now()}-2`,
        name: 'Kiểm tra cấu trúc và tính rõ ràng',
        variables: {},
        assertionType: 'not_contains',
        expectedValue: 'Tôi không thể'
      }
    ];
  }

  // Create 3 realistic variants for the detected variables
  const sampleValues: Record<string, string[]> = {
    san_pham: ['Khóa học AI Kỹ Sư', 'Ứng dụng CRM Bất Động Sản', 'Dịch vụ thiết kế nội thất'],
    ngan_sach: ['10 triệu VNĐ', '50 triệu VNĐ', '200 triệu VNĐ'],
    khach_hang: ['Sinh viên mới ra trường', 'Doanh nghiệp SME', 'Tập đoàn đa quốc gia'],
    ngon_ngu: ['Python 3.12', 'TypeScript 5', 'Rust'],
    chu_de: ['Trí tuệ nhân tạo', 'Tài chính cá nhân', 'Năng lượng tái tạo']
  };

  return [1, 2, 3].map((num) => {
    const vars: Record<string, string> = {};
    for (const v of variables) {
      const presets = sampleValues[v.toLowerCase()];
      if (presets && presets.length >= num) {
        vars[v] = presets[num - 1];
      } else {
        vars[v] = `Dữ liệu thử nghiệm ${v} (Mẫu ${num})`;
      }
    }

    return {
      id: `tc-${Date.now()}-${num}`,
      name: `Bộ kiểm thử số ${num} (${Object.keys(vars).slice(0, 2).join(', ')})`,
      variables: vars,
      assertionType: num === 1 ? 'min_length' : num === 2 ? 'not_contains' : 'contains',
      expectedValue: num === 1 ? '100' : num === 2 ? 'lỗi' : Object.values(vars)[0] || '1'
    };
  });
}

/**
 * Evaluates an assertion on the actual output
 */
function evaluateAssertion(
  output: string,
  assertionType: TestCase['assertionType'],
  expectedValue: string
): { pass: boolean; reason: string } {
  const normOutput = output.toLowerCase();
  const normExpected = expectedValue.toLowerCase();

  switch (assertionType) {
    case 'contains': {
      const pass = normOutput.includes(normExpected);
      return {
        pass,
        reason: pass
          ? `Đầu ra chứa chuỗi kỳ vọng: "${expectedValue}"`
          : `Đầu ra KHÔNG chứa chuỗi kỳ vọng: "${expectedValue}"`
      };
    }
    case 'not_contains': {
      const pass = !normOutput.includes(normExpected);
      return {
        pass,
        reason: pass
          ? `Đầu ra không chứa chuỗi cấm: "${expectedValue}"`
          : `Đầu ra bị dính chuỗi cấm: "${expectedValue}"`
      };
    }
    case 'regex': {
      try {
        const regex = new RegExp(expectedValue, 'i');
        const pass = regex.test(output);
        return {
          pass,
          reason: pass
            ? `Đầu ra khớp biểu thức chính quy /${expectedValue}/`
            : `Đầu ra không khớp biểu thức /${expectedValue}/`
        };
      } catch (e: any) {
        return { pass: false, reason: `Biểu thức regex không hợp lệ: ${e.message}` };
      }
    }
    case 'min_length': {
      const min = parseInt(expectedValue, 10) || 50;
      const pass = output.length >= min;
      return {
        pass,
        reason: pass
          ? `Độ dài đạt chuẩn (${output.length} ký tự >= ${min})`
          : `Độ dài quá ngắn (${output.length} ký tự < ${min})`
      };
    }
    default:
      return { pass: true, reason: 'Chấp nhận mặc định' };
  }
}

/**
 * Execute batch test suite across all test cases
 */
export async function runBatchEvaluation(
  promptTemplate: string,
  testCases: TestCase[],
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<BatchEvaluationSummary> {
  const results: TestCaseRunResult[] = [];
  let totalLatency = 0;

  for (let i = 0; i < testCases.length; i++) {
    if (signal?.aborted) throw new DOMException('Batch evaluation đã bị hủy.', 'AbortError');
    const tc = testCases[i];
    const resolvedPrompt = interpolateTemplate(promptTemplate, tc.variables);
    const startTime = performance.now();
    let actualOutput = '';
    let tokens = 0;

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = globalThis.setTimeout(resolve, 50);
        signal?.addEventListener('abort', () => { globalThis.clearTimeout(timeout); reject(new DOMException('Batch evaluation đã bị hủy.', 'AbortError')); }, { once: true });
      });
      actualOutput = `[Bản kiểm thử cục bộ: ${tc.name}]\n\nPrompt sau khi điền biến:\n${resolvedPrompt}`;
      tokens = Math.round((resolvedPrompt.length + actualOutput.length) / 4);

      const duration = Math.round(performance.now() - startTime);
      totalLatency += duration;

      const evalResult = evaluateAssertion(actualOutput, tc.assertionType, tc.expectedValue);

      results.push({
        testCaseId: tc.id,
        testCaseName: tc.name,
        status: evalResult.pass ? 'pass' : 'fail',
        actualOutput,
        latencyMs: duration,
        tokensUsed: tokens,
        reason: evalResult.reason
      });
    } catch (err: any) {
      if (signal?.aborted) throw err;
      const duration = Math.round(performance.now() - startTime);
      totalLatency += duration;
      results.push({
        testCaseId: tc.id,
        testCaseName: tc.name,
        status: 'error',
        actualOutput: '',
        latencyMs: duration,
        reason: `Lỗi kiểm thử cục bộ: ${err.message || 'Không xác định'}`
      });
    }

    if (onProgress) {
      onProgress(i + 1, testCases.length);
    }
  }

  const passedTests = results.filter((r) => r.status === 'pass').length;
  const failedTests = results.filter((r) => r.status !== 'pass').length;
  const passRate = results.length > 0 ? Math.round((passedTests / results.length) * 100) : 0;
  const avgLatencyMs = results.length > 0 ? Math.round(totalLatency / results.length) : 0;

  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    passRate,
    avgLatencyMs,
    results
  };
}
