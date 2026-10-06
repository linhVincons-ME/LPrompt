import type { PromptDomain } from '../types';
import { DEFAULT_OUTPUT_OPTIONS, inspectOutputOptions, missingDataRule, outputRules, type OutputOptions } from './outputOptions';

export type PromptFramework = 'STANDARD';
export type OutputLanguage = 'vi' | 'en';

export interface FrameworkCompileOptions {
  domain?: PromptDomain;
  goal?: string;
  additionalInstruction?: string;
  outputLanguage?: OutputLanguage;
  outputOptions?: OutputOptions;
}

export interface FrameworkCompileResult {
  requestedFramework: PromptFramework;
  framework: PromptFramework;
  outputLanguage: OutputLanguage;
  prompt: string;
  reason: string;
  changes?: string[];
}

const DOMAIN_NAMES: Record<OutputLanguage, Record<PromptDomain, string>> = {
  vi: { research: 'nghiên cứu', image: 'tạo hình ảnh', video: 'sản xuất video', code: 'lập trình phần mềm', audio: 'sản xuất âm thanh' },
  en: { research: 'research', image: 'image generation', video: 'video production', code: 'software engineering', audio: 'audio production' }
};

export function selectFramework(): PromptFramework {
  return 'STANDARD';
}

function compileVietnamese(request: string, options: FrameworkCompileOptions): string {
  const domain = DOMAIN_NAMES.vi[options.domain ?? 'research'];
  const extras = [
    options.goal?.trim() ? `[MỤC TIÊU BỔ SUNG]\n${options.goal.trim()}` : '',
    options.additionalInstruction?.trim() ? `[CHỈ THỊ BỔ SUNG]\n${options.additionalInstruction.trim()}` : ''
  ].filter(Boolean).join('\n\n');

  return `[VAI TRÒ]\nBạn là chuyên gia về ${domain}. Tạo kết quả chính xác, có thể sử dụng ngay và không tự bịa dữ kiện.\n\n[YÊU CẦU NGƯỜI DÙNG]\n<yeu_cau_nguoi_dung>\n${request}\n</yeu_cau_nguoi_dung>\n\n[NGUYÊN TẮC THỰC HIỆN]\n- Giữ nguyên ý định, tên riêng, thông số và ràng buộc trong yêu cầu.\n- Phân biệt rõ dữ kiện đã cung cấp với giả định. Không tự tạo nguồn, số liệu, kết quả đo hoặc hành động chưa thực hiện.\n- Nếu thiếu dữ liệu quan trọng, nêu chính xác phần còn thiếu và chỉ hoàn thành phần an toàn có đủ căn cứ.\n- Đối chiếu kết quả với mọi điều kiện trước khi trả lời.\n\n[YÊU CẦU ĐẦU RA]\nTuân thủ định dạng người dùng yêu cầu. Nếu người dùng yêu cầu chỉ trả về kết quả, không thêm lời chào, phân tích hoặc giải thích.${extras ? `\n\n${extras}` : ''}`;
}

function compileEnglish(request: string, options: FrameworkCompileOptions): string {
  const domain = DOMAIN_NAMES.en[options.domain ?? 'research'];
  const extras = [
    options.goal?.trim() ? `[ADDITIONAL GOAL]\n${options.goal.trim()}` : '',
    options.additionalInstruction?.trim() ? `[ADDITIONAL INSTRUCTION]\n${options.additionalInstruction.trim()}` : ''
  ].filter(Boolean).join('\n\n');

  return `[ROLE]\nAct as a ${domain} specialist. Produce an accurate, immediately usable result without inventing facts.\n\n[USER REQUEST]\n<user_request>\n${request}\n</user_request>\n\n[EXECUTION RULES]\n- Preserve the user's intent, names, specifications, and constraints.\n- Separate supplied facts from assumptions. Do not invent sources, measurements, results, or actions.\n- If material information is missing, identify it precisely and complete only the safe portion supported by the input.\n- Validate the result against every requirement before responding.\n\n[OUTPUT]\nFollow the user's requested format. If the user asks for only the deliverable, add no greeting, analysis, or explanation.${extras ? `\n\n${extras}` : ''}`;
}

export function compilePromptFramework(
  source: string,
  _requestedFramework: PromptFramework = 'STANDARD',
  options: FrameworkCompileOptions = {}
): FrameworkCompileResult {
  const request = source.trim();
  if (!request) throw new Error('Prompt nguồn đang trống.');
  const outputLanguage = options.outputLanguage ?? 'vi';
  let prompt = outputLanguage === 'vi'
    ? compileVietnamese(request, options)
    : compileEnglish(request, options);
  const changes = ['Bọc yêu cầu nguồn trong ranh giới dữ liệu rõ ràng', 'Bổ sung vai trò và nguyên tắc bảo toàn dữ kiện'];
  if (options.outputOptions) {
    const issues = inspectOutputOptions(options.outputOptions, options.additionalInstruction ?? '');
    if (issues.length) throw new Error(issues.join('\n'));
    prompt = prompt.replace(missingDataRule(DEFAULT_OUTPUT_OPTIONS, outputLanguage), missingDataRule(options.outputOptions, outputLanguage));
    const rules = outputRules(options.outputOptions, outputLanguage);
    if (rules.length) rules.unshift(outputLanguage === 'vi' ? 'Các tùy chọn dưới đây là cấu hình đầu ra người dùng đã chọn cho lần biên dịch này. Nếu mâu thuẫn với yêu cầu nguồn, nêu xung đột thay vì âm thầm bỏ qua.' : 'The following options are the output settings selected for this compilation. If they conflict with the source request, identify the conflict rather than silently ignoring it.');
    if (rules.length) prompt += `\n\n[${outputLanguage === 'vi' ? 'TÙY CHỌN ĐẦU RA' : 'OUTPUT OPTIONS'}]\n${rules.map((rule) => `- ${rule}`).join('\n')}`;
    changes.push(missingDataRule(options.outputOptions, 'vi'), ...outputRules(options.outputOptions, 'vi'));
  } else changes.push('Bổ sung yêu cầu đầu ra và hành vi khi thiếu dữ liệu');
  if (options.additionalInstruction?.trim()) changes.push('Giữ chỉ thị bổ sung trong bản biên dịch');

  return {
    requestedFramework: 'STANDARD',
    framework: 'STANDARD',
    outputLanguage,
    prompt,
    changes,
    reason: outputLanguage === 'vi'
      ? 'Đã áp dụng bộ biên dịch chuẩn duy nhất của LPrompt.'
      : 'Applied the single standard LPrompt compiler.'
  };
}
