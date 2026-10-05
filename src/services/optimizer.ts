import type { PromptDomain } from '../types';
import { evaluatePromptLocally } from './evaluator';
import { compilePromptFramework, type OutputLanguage, type PromptFramework } from './frameworkCompiler';

export interface OptimizationResult {
  improved_prompt: string;
  original_score: number;
  new_score: number;
  changes_summary: string[];
  framework_applied: string;
  explanation: string;
}

/**
 * Biên dịch prompt hoàn toàn cục bộ. Kết quả không phụ thuộc mạng hoặc dịch vụ AI.
 */
export async function optimizePromptLocally(
  prompt: string,
  domain: PromptDomain,
  goal: string,
  framework: PromptFramework,
  customInstruction: string,
  outputLanguage: OutputLanguage
): Promise<OptimizationResult> {
  const p = prompt.trim();
  if (!p) {
    throw new Error('Vui lòng nhập nội dung prompt cần tối ưu.');
  }
  const compiled = compilePromptFramework(p, framework, { domain, goal, additionalInstruction: customInstruction, outputLanguage });
  return createLocalOptimizationResult(p, domain, compiled);
}

/**
 * Kết quả compiler cục bộ; tên hàm được giữ để tương thích với call site cũ.
 */
export function createLocalOptimizationResult(
  prompt: string,
  domain: PromptDomain,
  compiled: ReturnType<typeof compilePromptFramework>
): OptimizationResult {
  const changes = [
    `Compiler cục bộ đã áp dụng ${compiled.framework}`,
    'Bọc yêu cầu nguồn trong ranh giới dữ liệu rõ ràng',
    'Bổ sung role, output contract và hành vi khi thiếu dữ liệu phù hợp với framework'
  ];
  const originalScore = evaluatePromptLocally(prompt, domain).total_score;
  const newScore = evaluatePromptLocally(compiled.prompt, domain).total_score;
  return {
    improved_prompt: compiled.prompt,
    original_score: originalScore,
    new_score: newScore,
    changes_summary: changes,
    framework_applied: compiled.framework,
    explanation: `${compiled.reason} Đây là kết quả compiler cục bộ, không gọi API và cần được kiểm thử với dữ liệu thực tế.`
  };
}
