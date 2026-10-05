import React, { useState, useEffect } from 'react';
import type { GeminiConfig, RedTeamSecurityReport } from '../types';
import { scanPromptSecurityWithGemini } from '../services/securityScanner';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Shield,
  Loader2,
  RotateCcw,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface RedTeamSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  config: GeminiConfig;
  onApplyPatchedPrompt: (patchedPrompt: string) => void;
}

export const RedTeamSecurityModal: React.FC<RedTeamSecurityModalProps> = ({
  isOpen,
  onClose,
  prompt,
  config,
  onApplyPatchedPrompt
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<RedTeamSecurityReport | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen && prompt.trim()) {
      handleScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScan = async () => {
    setIsScanning(true);
    setApplied(false);
    try {
      const res = await scanPromptSecurityWithGemini(prompt, config);
      setReport(res);
    } catch {
      // Fallback handled in service
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyPatch = () => {
    if (report?.patchedPrompt) {
      onApplyPatchedPrompt(report.patchedPrompt);
      setApplied(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  let badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  let badgeIcon = <ShieldX className="w-4 h-4 text-rose-400" />;
  if (report?.safetyScore && report.safetyScore >= 80) {
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    badgeIcon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;
  } else if (report?.safetyScore && report.safetyScore >= 50) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    badgeIcon = <ShieldAlert className="w-4 h-4 text-amber-400" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Red-Teaming & Quét Lỗ Hổng Bảo Mật</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  OWASP LLM Top 10
                </span>
              </div>
              <p className="text-xs text-slate-400">Kiểm tra rò rỉ System Prompt, Prompt Injection và nguy cơ ảo giác</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Quét lại"
            >
              <RotateCcw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Score Banner */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="text-2xl font-black font-mono text-white">
                {isScanning ? '...' : `${report?.safetyScore ?? 0}%`}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chỉ số An Toàn:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badgeColor}`}>
                  {badgeIcon}
                  <span>{report?.riskLevel || 'Đang quét...'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {report?.safetyScore && report.safetyScore >= 80
                  ? 'Prompt có rào chắn kiên cố, khả năng phòng vệ trước jailbreak rất tốt.'
                  : report?.safetyScore && report.safetyScore >= 50
                  ? 'Mức độ rủi ro trung bình, thiếu điều khoản chống rò rỉ prompt hoặc rào chắn ảo giác.'
                  : 'Cảnh báo nguy cơ cao! Prompt dễ bị chiếm quyền điều khiển bằng Prompt Injection.'}
              </p>
            </div>
          </div>

          {/* 1-Click Auto-Patch Guardrails Button */}
          {report?.patchedPrompt && (
            <button
              onClick={handleApplyPatch}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
            >
              <Wand2 className="w-4 h-4" />
              <span>{applied ? '✓ Đã vá rào chắn!' : '🛡️ 1-Click Vá Rào Chắn An Toàn'}</span>
            </button>
          )}
        </div>

        {/* Security Check Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isScanning ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
              <span className="text-xs">Đang kiểm thử Red-Teaming và rà soát lỗ hổng...</span>
            </div>
          ) : (
            report?.checks.map((check) => {
              let icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
              let borderColor = 'border-emerald-500/20 bg-emerald-500/5';
              let statusLabel = 'ĐẠT (PASS)';
              let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

              if (check.status === 'warning') {
                icon = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
                borderColor = 'border-amber-500/20 bg-amber-500/5';
                statusLabel = 'CẢNH BÁO';
                statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
              } else if (check.status === 'fail') {
                icon = <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
                borderColor = 'border-rose-500/20 bg-rose-500/5';
                statusLabel = 'NGUY HIỂM (FAIL)';
                statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
              }

              return (
                <div
                  key={check.id}
                  className={`p-4 rounded-xl border ${borderColor} transition-all space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {icon}
                      <h4 className="text-xs font-bold text-white">{check.title}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-6">
                    {check.description}
                  </p>

                  <div className="text-[11px] text-slate-400 pl-6 border-t border-slate-800/60 pt-2 flex items-start gap-1">
                    <span className="font-semibold text-indigo-300">Khuyến nghị khắc phục:</span>
                    <span>{check.recommendation}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Tiêu chuẩn bảo mật tham chiếu theo OWASP Top 10 for Large Language Models</span>
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
