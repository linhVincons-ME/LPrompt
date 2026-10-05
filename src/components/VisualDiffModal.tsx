import React, { useState } from 'react';
import { computeWordDiff } from '../utils/diff';
import { X, GitCompare, ArrowRightLeft, Check, Copy } from 'lucide-react';

interface VisualDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  modifiedText: string;
  originalLabel?: string;
  modifiedLabel?: string;
  onApplyModified?: (text: string) => void;
}

export const VisualDiffModal: React.FC<VisualDiffModalProps> = ({
  isOpen,
  onClose,
  originalText,
  modifiedText,
  originalLabel = 'Bản Cũ (Original)',
  modifiedLabel = 'Bản Mới (Modified)',
  onApplyModified
}) => {
  const [viewMode, setViewMode] = useState<'inline' | 'split'>('inline');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const diffTokens = computeWordDiff(originalText, modifiedText);

  const additions = diffTokens.filter((t) => t.type === 'added').length;
  const deletions = diffTokens.filter((t) => t.type === 'removed').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(modifiedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Visual Diff & Kiểm Soát Thay Đổi</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                  v1.2 Diff
                </span>
              </div>
              <p className="text-xs text-slate-400">So sánh đối chiếu chi tiết từng từ được thêm mới hoặc loại bỏ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('inline')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  viewMode === 'inline' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gộp chung (Inline)
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  viewMode === 'split' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Song song (Split)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diff Stats Banner */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs px-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              +{additions} từ thêm mới
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              -{deletions} từ bị xóa/thay thế
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép bản mới'}</span>
          </button>
        </div>

        {/* Diff Content View */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
          {viewMode === 'inline' ? (
            /* Inline Diff View */
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 whitespace-pre-wrap selection:bg-purple-500/30">
              {diffTokens.map((token, idx) => {
                if (token.type === 'added') {
                  return (
                    <span
                      key={idx}
                      className="bg-emerald-500/25 text-emerald-300 px-1 py-0.5 rounded font-semibold border border-emerald-500/30"
                    >
                      {token.value}
                    </span>
                  );
                }
                if (token.type === 'removed') {
                  return (
                    <span
                      key={idx}
                      className="bg-rose-500/25 text-rose-300 line-through px-1 py-0.5 rounded border border-rose-500/30 opacity-75"
                    >
                      {token.value}
                    </span>
                  );
                }
                return <span key={idx} className="text-slate-300">{token.value}</span>;
              })}
            </div>
          ) : (
            /* Split Diff View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Old */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔴</span> {originalLabel}
                </span>
                <div className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 whitespace-pre-wrap text-slate-400 overflow-y-auto max-h-96">
                  {originalText}
                </div>
              </div>

              {/* New */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🟢</span> {modifiedLabel}
                </span>
                <div className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 whitespace-pre-wrap text-emerald-200 overflow-y-auto max-h-96">
                  {modifiedText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Sử dụng thuật toán Longest Common Subsequence (LCS) mức độ từ ngữ</span>
          <div className="flex items-center gap-2">
            {onApplyModified && (
              <button
                onClick={() => onApplyModified(modifiedText)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-md shadow-indigo-600/20"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Áp dụng bản mới này</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
