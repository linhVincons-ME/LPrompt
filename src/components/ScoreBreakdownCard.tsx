import React from 'react';
import type { ScoreBreakdown } from '../types';
import { Check, X, ShieldAlert, Award, FileCode, Sliders, Layers } from 'lucide-react';

interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown;
  critique: {
    pros: string[];
    missing: string[];
  };
}

export const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({ breakdown, critique }) => {
  const criteria = [
    {
      id: 'role',
      name: 'Vai trò & Ngữ cảnh',
      score: breakdown.role_context,
      max: 20,
      icon: <Award className="w-4 h-4 text-purple-400" />,
      desc: 'Định danh chuyên gia, bối cảnh bài toán'
    },
    {
      id: 'task',
      name: 'Nhiệm vụ & Chỉ dẫn',
      score: breakdown.task_clarity,
      max: 25,
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      desc: 'Động từ hành động, bước thực thi logic'
    },
    {
      id: 'constraints',
      name: 'Ràng buộc & Cấm kỵ',
      score: breakdown.constraints,
      max: 20,
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
      desc: 'Negative rules, độ dài, phong cách'
    },
    {
      id: 'format',
      name: 'Định dạng đầu ra',
      score: breakdown.output_format,
      max: 20,
      icon: <FileCode className="w-4 h-4 text-amber-400" />,
      desc: 'JSON, Markdown table, cấu trúc thẻ'
    },
    {
      id: 'specs',
      name: 'Ví dụ & Tham số kỹ thuật',
      score: breakdown.examples_specs,
      max: 15,
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
      desc: 'Few-shot samples, lens, camera, stack'
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Độ đầy đủ cấu trúc (100 điểm)</span>
        </h3>
        <span className="text-xs text-slate-400">Tiêu chuẩn PromptOps</span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        {criteria.map((c) => {
          const percent = Math.round((c.score / c.max) * 100);
          let barColor = 'bg-rose-500';
          if (percent >= 80) barColor = 'bg-emerald-500';
          else if (percent >= 50) barColor = 'bg-sky-500';
          else if (percent > 0) barColor = 'bg-amber-500';

          return (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-200">
                  {c.icon}
                  {c.name}
                </span>
                <span className="font-mono font-semibold text-slate-300">
                  {c.score} <span className="text-slate-500 font-normal">/ {c.max}đ</span>
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostic Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
        {/* Pros */}
        <div className="bg-slate-950/60 border border-emerald-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
            <Check className="w-4 h-4" />
            <span>Điểm đạt được ({critique.pros.length})</span>
          </div>
          {critique.pros.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Chưa có yếu tố chuẩn hóa nào.</p>
          ) : (
            <ul className="space-y-1.5">
              {critique.pros.map((p, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Missing */}
        <div className="bg-slate-950/60 border border-rose-500/20 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-2">
            <X className="w-4 h-4" />
            <span>Cần khắc phục ({critique.missing.length})</span>
          </div>
          {critique.missing.length === 0 ? (
            <p className="text-xs text-emerald-400/80">Prompt đã hoàn thiện rất tốt!</p>
          ) : (
            <ul className="space-y-1.5">
              {critique.missing.map((m, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
