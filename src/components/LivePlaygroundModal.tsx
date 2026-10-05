import React, { useState, useEffect } from 'react';
import type { GeminiConfig, PromptExecutionResult } from '../types';
import { executePromptWithGemini } from '../services/execution';
import {
  X,
  Play,
  Copy,
  Check,
  Clock,
  Coins,
  Cpu,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface LivePlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  config: GeminiConfig;
}

export const LivePlaygroundModal: React.FC<LivePlaygroundModalProps> = ({
  isOpen,
  onClose,
  prompt,
  config
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PromptExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-run when modal opens
  useEffect(() => {
    if (isOpen && prompt.trim()) {
      handleRun();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await executePromptWithGemini(prompt, config);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thực thi prompt.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    if (!result?.output) return;
    navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live Execution Playground</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  v1.1 Live Run
                </span>
              </div>
              <p className="text-xs text-slate-400">Chạy thử nghiệm prompt thực tế và đo lường độ trễ, token, chi phí</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'Đang chạy...' : 'Chạy lại'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-950/80 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <Clock className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-[10px] text-slate-400">Độ trễ (Latency)</div>
              <div className="font-mono font-bold text-white">
                {result ? `${result.latencyMs} ms` : isRunning ? '...' : '--'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <Cpu className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] text-slate-400">Tổng Tokens</div>
              <div className="font-mono font-bold text-white">
                {result ? `${result.tokens.total} tok` : isRunning ? '...' : '--'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">Ước tính Chi Phí</div>
              <div className="font-mono font-bold text-emerald-400">
                {result ? `$${result.estimatedCostUsd}` : isRunning ? '...' : '--'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <div>
              <div className="text-[10px] text-slate-400">Model Thực Thi</div>
              <div className="font-mono font-semibold text-indigo-300 truncate max-w-[120px]">
                {result ? result.modelUsed : config.model}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body: Split Prompt & Output */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Prompt Sent */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt Gửi Đi:</span>
            <div className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {prompt}
            </div>
          </div>

          {/* AI Response Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Phản Hồi Từ Gemini:
              </span>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép output'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[240px] max-h-96 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100 whitespace-pre-wrap overflow-y-auto leading-relaxed selection:bg-emerald-500/30">
              {isRunning ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Đang kết nối Gemini và sinh phản hồi thời gian thực...</span>
                </div>
              ) : error ? (
                <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : result ? (
                result.output
              ) : (
                <span className="text-slate-600">Chưa có kết quả thực thi.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>{result?.source === 'simulation' ? '⚡ Đang chạy chế độ mô phỏng Offline (Cấu hình API Key để chạy mô hình thực tế)' : '🟢 Kết nối trực tiếp Google AI Studio API'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
