import React, { useState } from 'react';
import type { PromptDomain, GeminiConfig } from '../types';
import { optimizePromptWithGeminiPro, type OptimizationResult } from '../services/optimizer';
import {
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Send,
  Loader2,
  FileCheck,
  AlertCircle,
  Play,
  Share2,
  GitCompare
} from 'lucide-react';

interface PromptOptimizerViewProps {
  currentPrompt: string;
  domain: PromptDomain;
  config: GeminiConfig;
  onApplyImproved: (newPrompt: string) => void;
  onOpenApiKeyModal: () => void;
  onOpenPlayground: (prompt: string) => void;
  onOpenCodeExport: (prompt: string) => void;
  onOpenVisualDiff?: (original: string, modified: string) => void;
}

export const PromptOptimizerView: React.FC<PromptOptimizerViewProps> = ({
  currentPrompt,
  domain,
  config,
  onApplyImproved,
  onOpenApiKeyModal,
  onOpenPlayground,
  onOpenCodeExport,
  onOpenVisualDiff
}) => {
  const [inputPrompt, setInputPrompt] = useState(currentPrompt);
  const [selectedGoal, setSelectedGoal] = useState('production_100');
  const [selectedFramework, setSelectedFramework] = useState('CO-STAR');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync if prop changes and empty
  React.useEffect(() => {
    if (currentPrompt && !inputPrompt) {
      setInputPrompt(currentPrompt);
    }
  }, [currentPrompt]);

  const goals = [
    { id: 'production_100', label: 'Chuẩn Production (95-100đ)', desc: 'Bổ sung đầy đủ 5 trụ cột kỹ thuật' },
    { id: 'guardrails', label: 'Thêm Rào Chắn Lỗi (Negative Rules)', desc: 'Chống ảo giác và suy diễn lan man' },
    { id: 'strict_json', label: 'Ép Schema Đầu Ra (JSON/Bảng)', desc: 'Định dạng dữ liệu chuẩn máy đọc' },
    { id: 'cot_reasoning', label: 'Tư Duy Logic Từng Bước (CoT)', desc: 'Phân rã bài toán phức tạp theo pha' },
    { id: 'multimodal_specs', label: 'Tối Ưu Tham Số Chuyên Ngành', desc: 'Ánh sáng, camera, render, code stack' },
  ];

  const frameworks = ['CO-STAR', 'CRISPE', 'RTF', 'STANDARD-PRO'];

  const handleOptimize = async (instructionOverride = customInstruction) => {
    if (!inputPrompt.trim()) {
      setErrorMessage('Vui lòng nhập nội dung prompt cần tối ưu hóa.');
      return;
    }

    setIsOptimizing(true);
    setErrorMessage(null);

    try {
      const res = await optimizePromptWithGeminiPro(
        inputPrompt,
        domain,
        selectedGoal,
        selectedFramework,
        instructionOverride,
        config
      );
      setOptimizationResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi gọi Gemini Pro.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Banner: Dedicated Gemini Pro Workspace */}
      <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight m-0">Gemini Pro Prompt Optimizer</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO ENGINE v1.1
              </span>
            </div>
            <p className="text-xs text-slate-300 m-0">
              Gửi prompt gốc sang Gemini Pro để chỉnh sửa, tái cấu trúc và đại tu đạt điểm tuyệt đối 95 - 100 điểm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Động cơ:</span>
          <span className="font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300">
            {config.model || 'gemini-1.5-pro'}
          </span>
          {!config.apiKey && (
            <button
              onClick={onOpenApiKeyModal}
              className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              Cấu hình API Key (Free)
            </button>
          )}
        </div>
      </div>

      {/* Control Panel: Goal & Framework Selection */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            1. Chọn Mục Tiêu Chỉnh Sửa Mong Muốn:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGoal(g.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedGoal === g.id
                    ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md shadow-indigo-600/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-white">{g.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Framework & Custom Instruction */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-slate-800/80">
          {/* Framework Choice */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Khung Kỹ Thuật (Framework):</label>
            <div className="grid grid-cols-2 gap-1.5">
              {frameworks.map((fw) => (
                <button
                  key={fw}
                  onClick={() => setSelectedFramework(fw)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                    selectedFramework === fw
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {fw}
                </button>
              ))}
            </div>
          </div>

          {/* Custom user instruction */}
          <div className="md:col-span-8 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Chỉ Thị Bổ Sung Cho Gemini Pro (Tùy chọn):
            </label>
            <div className="relative">
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="VD: Viết bằng tiếng Anh chuẩn Oxford, thêm ví dụ JSON thực tế, rút gọn dưới 150 từ..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {!config.apiKey && (
            <button
              onClick={onOpenApiKeyModal}
              className="underline font-semibold hover:text-white"
            >
              Nhập API Key
            </button>
          )}
        </div>
      )}

      {/* Main Split Comparison: Original Prompt vs Gemini Pro Refined */}
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
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Nhập prompt thô ban đầu cần đưa sang Gemini Pro tối ưu..."
            className="w-full flex-1 min-h-[260px] p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInputPrompt('')}
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
                  <span>Gemini Pro Đang Tái Cấu Trúc...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✨ ĐƯA SANG GEMINI PRO TỐI ƯU HÓA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Gemini Pro Optimized Output */}
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-xl shadow-purple-950/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Bản Gemini Pro Đã Chỉnh Sửa
              </span>
            </div>
            {optimizationResult && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Điểm mới: {optimizationResult.new_score}/100 (Xuất sắc)
              </span>
            )}
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
                Nhập nội dung vào khung bên trái và bấm <span className="text-indigo-400 font-semibold">"Đưa Sang Gemini Pro Tối Ưu Hóa"</span> để nhận phiên bản chuẩn 95-100 điểm.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Diagnostics: Detailed Explanation & Changes Made by Gemini Pro */}
      {optimizationResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>Báo Cáo Tinh Chỉnh Của Gemini Pro (Audit Log)</span>
            </h3>
            <span className="text-xs font-mono text-purple-300">
              Khung áp dụng: {optimizationResult.framework_applied}
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

            {/* Gemini Pro Explanation */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-300">Tại Sao Bản Sửa Đổi Này Lại Tốt Hơn?</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {optimizationResult.explanation}
              </p>
            </div>
          </div>

          {/* Interactive Chat Refinement Loop */}
          <div className="pt-3 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              💬 Chưa hoàn toàn ưng ý? Gửi yêu cầu tinh chỉnh tiếp cho Gemini Pro:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="VD: 'Thêm ví dụ phản hồi mẫu', 'Chuyển sang phong cách vui tươi hơn', 'Thêm thẻ --ar 9:16'..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val.trim()) {
                      handleOptimize(val);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={(e) => {
                  const inputEl = (e.currentTarget.previousSibling as HTMLInputElement);
                  if (inputEl?.value.trim()) {
                    handleOptimize(inputEl.value);
                    inputEl.value = '';
                  }
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
