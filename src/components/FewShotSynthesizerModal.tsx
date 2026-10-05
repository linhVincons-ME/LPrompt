import React, { useState } from 'react';
import type { FewShotExample } from '../types';
import { synthesizeFewShotExamples, integrateExamplesIntoPrompt } from '../services/fewShotSynthesizer';
import {
  X,
  Target,
  Sparkles,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowRight,
  Info
} from 'lucide-react';

interface FewShotSynthesizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  onApplyIntegratedPrompt: (newPrompt: string) => void;
}

export const FewShotSynthesizerModal: React.FC<FewShotSynthesizerModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onApplyIntegratedPrompt
}) => {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [examples, setExamples] = useState<FewShotExample[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSynthesize = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Vui lòng nhập nội dung prompt trước khi sinh Few-Shot.');
      return;
    }
    setIsSynthesizing(true);
    setErrorMessage(null);

    try {
      const res = await synthesizeFewShotExamples(prompt);
      setExamples(res.examples);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tạo Few-Shot.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleUpdateExample = (id: string, field: 'input' | 'output' | 'explanation', val: string) => {
    setExamples((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: val } : ex))
    );
  };

  const handleRemoveExample = (id: string) => {
    setExamples((prev) => prev.filter((ex) => ex.id !== id));
  };

  const handleAddBlankExample = () => {
    const newEx: FewShotExample = {
      id: `ex-${Date.now()}`,
      input: 'User Input ví dụ mẫu mới...',
      output: 'Expected Output chuẩn mực...',
      explanation: 'Ghi chú lý do thiết lập ví dụ này'
    };
    setExamples((prev) => [...prev, newEx]);
  };

  const handleApplyToPrompt = () => {
    if (examples.length === 0) return;
    const updated = integrateExamplesIntoPrompt(prompt, examples);
    onApplyIntegratedPrompt(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white m-0">
                  Local Few-Shot Builder
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Tự động sinh 2-3 cặp Input/Output mẫu chuẩn vàng (Golden Examples) gắn vào prompt để triệt tiêu ảo giác
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Action Trigger Banner */}
          <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900/60 border border-purple-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-purple-200">
              <Info className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Sinh ví dụ mẫu bằng heuristic cục bộ, sau đó chỉnh nhãn thủ công trước khi gắn vào prompt.
              </span>
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tổng hợp mẫu vàng...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tự Động Sinh Few-Shot</span>
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Examples List */}
          {examples.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Danh Sách Mẫu Vàng Đã Tổng Hợp ({examples.length})
                </span>
                <button
                  onClick={handleAddBlankExample}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ví dụ</span>
                </button>
              </div>

              {examples.map((ex, idx) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      Mẫu Vàng #{idx + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveExample(ex.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Xóa ví dụ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Input (Đầu vào thực tế):
                      </label>
                      <textarea
                        rows={2}
                        value={ex.input}
                        onChange={(e) => handleUpdateExample(ex.id, 'input', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-emerald-400 block mb-1">
                        Expected Output (Đầu ra chuẩn mẫu):
                      </label>
                      <textarea
                        rows={3}
                        value={ex.output}
                        onChange={(e) => handleUpdateExample(ex.id, 'output', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-xs font-mono text-emerald-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {ex.explanation && (
                      <div className="text-[11px] text-slate-400 italic">
                        💡 Mục đích: {ex.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs space-y-2">
              <Target className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="font-semibold text-slate-400">Chưa có ví dụ Few-Shot nào</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Nhấp nút "Tự Động Sinh Few-Shot" để tạo các cặp mẫu cục bộ, sau đó rà soát và chỉnh sửa thủ công.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {examples.length > 0 ? `Đã sẵn sàng ${examples.length} cặp mẫu vàng` : 'Chưa gắn mẫu'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleApplyToPrompt}
              disabled={examples.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Gắn Few-Shot Vào Prompt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
