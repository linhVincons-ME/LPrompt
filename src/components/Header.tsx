import React from 'react';
import type { PromptDomain } from '../types';
import { Logo } from './Logo';
import {
  BookOpen,
  Key,
  Search,
  Image as ImageIcon,
  Film,
  Code2,
  Music2,
  Gauge,
  Wand2,
  Play,
  Share2,
  Shield,
  History,
  Target,
  Layers,
  Compass
} from 'lucide-react';

interface HeaderProps {
  currentDomain: PromptDomain;
  onSelectDomain: (domain: PromptDomain) => void;
  activeView: 'evaluator' | 'optimizer';
  onSelectView: (view: 'evaluator' | 'optimizer') => void;
  onOpenApiKeyModal: () => void;
  onOpenLibraryModal: () => void;
  onOpenPlayground: () => void;
  onOpenCodeExport: () => void;
  onOpenSecurityScan: () => void;
  onOpenVersionHistory: () => void;
  onOpenFewShot?: () => void;
  onOpenBatchEval?: () => void;
  onOpenPresetHub?: () => void;
  serviceStatus?: { online: boolean; port?: number; dbPath?: string };
  versionCount: number;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDomain,
  onSelectDomain,
  activeView,
  onSelectView,
  onOpenApiKeyModal,
  onOpenLibraryModal,
  onOpenPlayground,
  onOpenCodeExport,
  onOpenSecurityScan,
  onOpenVersionHistory,
  onOpenFewShot,
  onOpenBatchEval,
  onOpenPresetHub,
  serviceStatus,
  versionCount,
  savedCount
}) => {
  const domains: { id: PromptDomain; label: string; icon: React.ReactNode }[] = [
    { id: 'research', label: 'Nghiên Cứu & LLM', icon: <Search className="w-4 h-4" /> },
    { id: 'image', label: 'Tạo Ảnh (Flux/MJ)', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'video', label: 'Tạo Video (Sora/Kling)', icon: <Film className="w-4 h-4" /> },
    { id: 'code', label: 'Lập Trình & Code', icon: <Code2 className="w-4 h-4" /> },
    { id: 'audio', label: 'Âm Thanh & Suno', icon: <Music2 className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Logo size={38} glow={true} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight m-0 p-0 font-sans">
                LPrompts <span className="text-fuchsia-400 font-semibold text-sm">Studio</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                PROMPTOPS v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0 p-0">Môi trường phát triển, bảo mật &amp; kiểm soát phiên bản Prompt Git-Style</p>
          </div>
        </div>

        {/* View Switcher: Evaluator vs Optimizer */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onSelectView('evaluator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'evaluator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Thẩm Định 100đ</span>
          </button>
          <button
            onClick={() => onSelectView('optimizer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'optimizer'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-300" />
            <span>Tối Ưu Gemini Pro</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Security Audit Button */}
          <button
            onClick={onOpenSecurityScan}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300 transition-colors shadow-sm"
            title="Quét bảo mật Red-Teaming & Chống Prompt Injection"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bảo Mật</span>
          </button>

          {/* Preset Hub Button */}
          {onOpenPresetHub && (
            <button
              onClick={onOpenPresetHub}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-xs font-bold text-teal-300 transition-colors shadow-sm"
              title="Kho Prompt Chuyên Sâu Fabric-style"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Presets</span>
            </button>
          )}

          {/* Batch Evaluation Button */}
          {onOpenBatchEval && (
            <button
              onClick={onOpenBatchEval}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-300 transition-colors shadow-sm"
              title="Chạy kiểm thử hàng loạt Test Suite Matrix"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Batch Evals</span>
            </button>
          )}

          {/* DSPy Few-Shot Synthesizer Button */}
          {onOpenFewShot && (
            <button
              onClick={onOpenFewShot}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-xs font-bold text-purple-300 transition-colors shadow-sm"
              title="Tự động sinh ví dụ mẫu Few-Shot (DSPy)"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Few-Shot</span>
            </button>
          )}

          {/* Versions History Button */}
          <button
            onClick={onOpenVersionHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
            title="Lịch sử phiên bản (Git-Style)"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Lịch Sử</span>
            {versionCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-purple-600 text-[10px] font-bold text-white">
                {versionCount}
              </span>
            )}
          </button>

          {/* Live Playground Button */}
          <button
            onClick={onOpenPlayground}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-300 transition-colors shadow-sm"
            title="Chạy thử nghiệm prompt ngay"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Playground</span>
          </button>

          {/* Export Code Button */}
          <button
            onClick={onOpenCodeExport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
            title="Xuất mã nguồn Python, TypeScript, cURL"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">Xuất Code</span>
          </button>

          {/* Library Button */}
          <button
            onClick={onOpenLibraryModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Kho</span>
            {savedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </button>

          {/* API Key Settings Button */}
          <button
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">API Key</span>
          </button>

          {/* Service & Database Indicator */}
          {serviceStatus?.online ? (
            <span
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 cursor-default"
              title={`Local Service đang chạy tại port ${serviceStatus.port || 8484}\nDB: SQLite Nhúng (data/lprompt.db)`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SQLite :8484</span>
            </span>
          ) : (
            <span
              className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-medium text-slate-400 cursor-default"
              title="Chế độ Local Browser (Offline-first)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>Local Cache</span>
            </span>
          )}

          {/* GitHub Repo */}
          <a
            href="https://github.com/linhVincons-ME/LPrompt"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Xem mã nguồn trên GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Domain Navigation Tabs Subheader */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between border-t border-slate-800/60 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Chuyên mục:</span>
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDomain(d.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                currentDomain === d.id
                  ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {d.icon}
              <span>{d.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
