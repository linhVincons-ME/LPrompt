import React from 'react';
import type { QualityTier } from '../types';
import { Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  tier: QualityTier;
  isAuditing?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, tier, isAuditing }) => {
  // SVG circular progress calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'text-rose-500 stroke-rose-500';
  let bgBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  let glowClass = 'shadow-[0_0_20px_rgba(244,63,94,0.25)]';

  if (score >= 90) {
    colorClass = 'text-emerald-400 stroke-emerald-400';
    bgBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    glowClass = 'shadow-[0_0_25px_rgba(52,211,153,0.35)]';
  } else if (score >= 75) {
    colorClass = 'text-sky-400 stroke-sky-400';
    bgBadgeClass = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    glowClass = 'shadow-[0_0_20px_rgba(56,189,248,0.25)]';
  } else if (score >= 50) {
    colorClass = 'text-amber-400 stroke-amber-400';
    bgBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    glowClass = 'shadow-[0_0_20px_rgba(251,191,36,0.25)]';
  }

  return (
    <div className={`relative p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center backdrop-blur-md ${glowClass} transition-all duration-300`}>
      <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-slate-950/70 border-slate-800 text-slate-400">
        <Cpu className="w-3 h-3 text-slate-400" />
        <span>Độ đầy đủ cấu trúc</span>
      </div>

      <div className="relative w-36 h-36 flex items-center justify-center my-2">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
          <circle
            cx="65"
            cy="65"
            r={radius}
            strokeWidth="10"
            className="stroke-slate-800/80 fill-none"
          />
          <circle
            cx="65"
            cy="65"
            r={radius}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colorClass} fill-none transition-all duration-700 ease-out`}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {isAuditing ? '...' : score}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            / 100 điểm
          </span>
        </div>
      </div>

      {/* Tier Badge */}
      <div className="flex flex-col items-center gap-1">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${bgBadgeClass}`}>
          {score >= 90 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          <span>{tier.toUpperCase()}</span>
        </div>
        <p className="text-[11px] text-slate-400 text-center max-w-[200px] mt-1">
          {score >= 90
            ? 'Chuẩn Production! Sẵn sàng đưa vào hệ thống'
            : score >= 75
            ? 'Khá tốt. Cần bổ sung thêm ví dụ hoặc ràng buộc nhỏ'
            : score >= 50
            ? 'Còn chung chung. AI dễ suy diễn sai lệch'
            : 'Mơ hồ, thiếu ngữ cảnh kỹ thuật nghiêm trọng'}
        </p>
      </div>
    </div>
  );
};
