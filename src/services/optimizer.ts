import type { PromptDomain } from '../types';
import { evaluatePromptLocally } from './evaluator';
import { compilePromptFramework, type OutputLanguage } from './frameworkCompiler';

export interface OptimizationResult {
  improved_prompt: string;
  original_score: number;
  new_score: number;
  changes_summary: string[];
  compiler_applied: string;
  explanation: string;
}

/**
 * Biên dịch prompt hoàn toàn cục bộ. Kết quả không phụ thuộc mạng hoặc dịch vụ AI.
 */
export async function optimizePromptLocally(
  prompt: string,
  domain: PromptDomain,
  goal: string,
  customInstruction: string,
  outputLanguage: OutputLanguage
): Promise<OptimizationResult> {
  const p = prompt.trim();
  if (!p) {
    throw new Error('Vui lòng nhập nội dung prompt cần tối ưu.');
  }
  const compiled = compilePromptFramework(p, 'STANDARD', { domain, goal, additionalInstruction: customInstruction, outputLanguage });
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
    'Đã áp dụng bộ biên dịch chuẩn của LPrompt',
    'Bọc yêu cầu nguồn trong ranh giới dữ liệu rõ ràng',
    'Bổ sung vai trò, yêu cầu đầu ra và hành vi khi thiếu dữ liệu'
  ];
  const originalScore = evaluatePromptLocally(prompt, domain).total_score;
  const newScore = evaluatePromptLocally(compiled.prompt, domain).total_score;
  return {
    improved_prompt: compiled.prompt,
    original_score: originalScore,
    new_score: newScore,
    changes_summary: changes,
    compiler_applied: compiled.framework,
    explanation: `${compiled.reason} Đây là kết quả compiler cục bộ, không gọi API và cần được kiểm thử với dữ liệu thực tế.`
  };
}
