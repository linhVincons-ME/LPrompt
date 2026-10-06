import React, { useState } from 'react';
import type { PromptDomain } from '../types';
import { createLocalOptimizationResult, type OptimizationResult } from '../services/optimizer';
import { compilePromptFramework, type OutputLanguage } from '../services/frameworkCompiler';
import { OutputOptionsPanel } from './OutputOptionsPanel';
import { DEFAULT_OUTPUT_OPTIONS, type OutputOptions } from '../services/outputOptions';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  Loader2,
  FileCheck,
  AlertCircle,
  Play,
  Share2,
  GitCompare,
  Target,
  Layers
} from 'lucide-react';

interface PromptOptimizerViewProps {
  currentPrompt: string;
  domain: PromptDomain;
  onApplyImproved: (newPrompt: string) => void;
  onOpenPlayground: (prompt: string) => void;
  onOpenCodeExport: (prompt: string) => void;
  onOpenVisualDiff?: (original: string, modified: string) => void;
  onOpenFewShot?: (prompt: string) => void;
  onOpenBatchEval?: (prompt: string) => void;
}

export const PromptOptimizerView: React.FC<PromptOptimizerViewProps> = ({
  currentPrompt,
  domain,
  onApplyImproved,
  onOpenPlayground,
  onOpenCodeExport,
  onOpenVisualDiff,
  onOpenFewShot,
  onOpenBatchEval
}) => {
  const [inputPrompt, setInputPrompt] = useState(currentPrompt);
  const [outputOptions, setOutputOptions] = useState<OutputOptions>({ ...DEFAULT_OUTPUT_OPTIONS });
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('vi');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!inputPrompt.trim()) {
      setErrorMessage('Vui lòng nhập nội dung prompt cần tối ưu hóa.');
      return;
    }

    setIsOptimizing(true);
    setErrorMessage(null);

    try {
      const compiled = compilePromptFramework(inputPrompt, 'STANDARD', { domain, additionalInstruction: customInstruction, outputLanguage, outputOptions });
      const res = createLocalOptimizationResult(inputPrompt, domain, compiled);
      setOptimizationResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể biên dịch prompt cục bộ.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOutputLanguageChange = (language: OutputLanguage) => {
    setOutputLanguage(language);
    if (!optimizationResult || !inputPrompt.trim()) return;
    try {
      const compiled = compilePromptFramework(inputPrompt, 'STANDARD', {
        domain,
        outputOptions,
        additionalInstruction: customInstruction,
        outputLanguage: language
      });
      setOptimizationResult(createLocalOptimizationResult(inputPrompt, domain, compiled));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể chuyển ngôn ngữ đầu ra.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Banner: local-first compiler workspace */}
      <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight m-0">LPrompt Compiler</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                LOCAL-FIRST v3.0
              </span>
            </div>
            <p className="text-xs text-slate-300 m-0">
              Biên dịch hoàn toàn cục bộ; không API key, không chi phí và không phụ thuộc trạng thái dịch vụ AI
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          Local compiler sẵn sàng
        </span>
      </div>

      <OutputOptionsPanel value={outputOptions} onChange={(value) => { setOutputOptions(value); setOptimizationResult(null); }} instruction={customInstruction} onInstructionChange={(value) => { setCustomInstruction(value); setOptimizationResult(null); }} domain={domain} />

      {/* Error message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Split Comparison: source vs compiled prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input / Original Prompt */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Bản Gốc Cần Chỉnh Sửa
              </span>
            </div>
            {optimizationResult && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                Điểm cũ: ~{optimizationResult.original_score}/100
              </span>
            )}
          </div>

          <textarea
            value={inputPrompt}
            onChange={(e) => { setInputPrompt(e.target.value); setOptimizationResult(null); }}
            placeholder="Nhập yêu cầu cần biên dịch..."
            className="w-full flex-1 min-h-[260px] p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setInputPrompt(''); setOptimizationResult(null); }}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
              {inputPrompt.trim() && (
                <button
                  onClick={() => onOpenPlayground(inputPrompt)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/20 transition-colors"
                  title="Chạy thử bản gốc"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Chạy thử</span>
                </button>
              )}
            </div>

            <button
              onClick={() => handleOptimize()}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Biên Dịch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✨ BIÊN DỊCH PROMPT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: compiled output */}
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-xl shadow-purple-950/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Prompt Đã Biên Dịch
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5" aria-label="Ngôn ngữ prompt đầu ra">
                {([['vi', 'VIE'], ['en', 'ENG']] as const).map(([language, label]) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => handleOutputLanguageChange(language)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-colors ${outputLanguage === language ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    aria-pressed={outputLanguage === language}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {optimizationResult && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Điểm mới: {optimizationResult.new_score}/100
                </span>
              )}
            </div>
          </div>

          {optimizationResult ? (
            <>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-100 whitespace-pre-wrap leading-relaxed min-h-[260px] max-h-[380px] overflow-y-auto selection:bg-indigo-500/40">
                {optimizationResult.improved_prompt}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApplyImproved(optimizationResult.improved_prompt)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition-all"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Dùng bản này</span>
                  </button>
                  <button
                    onClick={() => onOpenPlayground(optimizationResult.improved_prompt)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold border border-emerald-500/30 transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Chạy thử ngay</span>
                  </button>
                  <button
                    onClick={() => onOpenCodeExport(optimizationResult.improved_prompt)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                    title="Xuất mã nguồn"
                  >
                    <Share2 className="w-3 h-3 text-sky-400" />
                    <span>Xuất Code</span>
                  </button>
                  {onOpenVisualDiff && (
                    <button
                      onClick={() => onOpenVisualDiff(inputPrompt, optimizationResult.improved_prompt)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-medium transition-all"
                      title="So sánh chi tiết thay đổi (Word-level Diff)"
                    >
                      <GitCompare className="w-3 h-3 text-purple-400" />
                      <span>So sánh Diff</span>
                    </button>
                  )}
                  {onOpenFewShot && (
                    <button
                      onClick={() => onOpenFewShot(optimizationResult.improved_prompt)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/60 text-purple-300 text-xs font-medium transition-all"
                      title="Tự động sinh mẫu Few-Shot Input/Output"
                    >
                      <Target className="w-3 h-3 text-purple-400" />
                      <span>Few-Shot</span>
                    </button>
                  )}
                  {onOpenBatchEval && (
                    <button
                      onClick={() => onOpenBatchEval(optimizationResult.improved_prompt)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-indigo-300 text-xs font-medium transition-all"
                      title="Kiểm thử template cục bộ cho bản này"
                    >
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span>Template Test</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(optimizationResult.improved_prompt)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép!' : '1-Click Copy'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-[260px] rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600" />
              <div className="text-xs font-semibold text-slate-400">Chưa có bản tối ưu</div>
              <p className="text-[11px] max-w-xs">
                Nhập nội dung vào khung bên trái và bấm <span className="text-indigo-400 font-semibold">"Biên dịch prompt"</span>. Sau đó dùng extension để chèn bản đã kiểm tra vào Gemini Web.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Diagnostics */}
      {optimizationResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>Báo Cáo Biên Dịch (Audit Log)</span>
            </h3>
            <span className="text-xs font-mono text-purple-300">
              Bộ biên dịch: {optimizationResult.compiler_applied}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List of changes */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-300">Các Thay Đổi Trọng Yếu Đã Thực Hiện:</span>
              <ul className="space-y-2">
                {optimizationResult.changes_summary.map((change, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compiler explanation */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-300">Tại Sao Bản Sửa Đổi Này Lại Tốt Hơn?</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {optimizationResult.explanation}
              </p>
            </div>
          </div>


        </div>
      )}
    </div>
  );
};
