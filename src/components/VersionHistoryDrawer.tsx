import React, { useState } from 'react';
import type { PromptVersion, VersionStage } from '../types';
import {
  X,
  History,
  GitCommit,
  GitCompare,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2,
  GitBranch,
  GitMerge
} from 'lucide-react';
import { getBranchNames } from '../utils/versionGraph';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  versions: PromptVersion[];
  activeBranch: string;
  onCommitNewVersion: (commitMessage: string, stage: VersionStage) => void;
  onRollbackToVersion: (version: PromptVersion) => void;
  onCompareWithVersion: (version: PromptVersion) => void;
  onDeleteVersion: (versionId: string) => void;
  onSwitchBranch: (branchName: string) => void;
  onCreateBranch: (branchName: string) => void;
  onMergeBranch: (sourceBranch: string) => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  currentPrompt,
  versions,
  activeBranch,
  onCommitNewVersion,
  onRollbackToVersion,
  onCompareWithVersion,
  onDeleteVersion,
  onSwitchBranch,
  onCreateBranch,
  onMergeBranch
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [stage, setStage] = useState<VersionStage>('draft');
  const [isCreating, setIsCreating] = useState(false);
  const [newBranch, setNewBranch] = useState('');
  const branches = getBranchNames(versions);

  if (!isOpen) return null;

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    onCommitNewVersion(commitMessage.trim(), stage);
    setCommitMessage('');
    setIsCreating(false);
  };

  const stageBadges: Record<VersionStage, { label: string; color: string }> = {
    draft: { label: 'Bản Nháp (Draft)', color: 'bg-slate-800 text-slate-300 border-slate-700' },
    testing: { label: 'Kiểm Thử (Testing)', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    production: { label: 'Sản Xuất (Production)', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Lịch Sử Phiên Bản (Git-Style PromptOps)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  {versions.length} versions
                </span>
              </div>
              <p className="text-xs text-slate-400">Quản lý các bản commit, khôi phục và so sánh visual diff</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-400" />
            <select value={activeBranch} onChange={(event) => onSwitchBranch(event.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white">
              {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
            <select defaultValue="" onChange={(event) => { if (event.target.value) onMergeBranch(event.target.value); event.target.value = ''; }} className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white" title="Merge nhánh vào nhánh hiện tại">
              <option value="">Merge từ…</option>
              {branches.filter((branch) => branch !== activeBranch).map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
            <GitMerge className="w-4 h-4 text-purple-400" />
          </div>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!newBranch.trim()) return; onCreateBranch(newBranch); setNewBranch(''); }}>
            <input value={newBranch} onChange={(event) => setNewBranch(event.target.value)} placeholder="feature/ten-nhanh" className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white" />
            <button type="submit" className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white">Tạo nhánh</button>
          </form>
        </div>

        {/* Commit New Version Section */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Điểm Lưu Phiên Bản Mới (Commit Version)</span>
            </button>
          ) : (
            <form onSubmit={handleCommit} className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Lưu phiên bản hiện tại vào lịch sử</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Hủy
                </button>
              </div>

              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Ghi chú commit (VD: Thêm Guardrails chống prompt injection, sửa format JSON...)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Giai đoạn:</span>
                  {(['draft', 'testing', 'production'] as VersionStage[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStage(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        stage === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {st.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!commitMessage.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Commit Ngay</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Versions Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <div>Chưa có phiên bản nào được lưu trong lịch sử.</div>
              <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                Bấm "Tạo Điểm Lưu Phiên Bản Mới" ở trên để ghi lại các mốc phát triển prompt (v1.0, v1.1...).
              </p>
            </div>
          ) : (
            versions.map((ver) => {
              const badge = stageBadges[ver.stage] || stageBadges.draft;
              const isCurrent = ver.content.trim() === currentPrompt.trim();

              return (
                <div
                  key={ver.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                    isCurrent
                      ? 'border-indigo-500/50 bg-indigo-950/20'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        {ver.versionNumber}
                      </span>
                      <span className="text-[10px] text-sky-300">{ver.branchName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Đang dùng
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onCompareWithVersion(ver)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 transition-colors"
                        title="So sánh Visual Diff với bản hiện tại"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onRollbackToVersion(ver)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 transition-colors"
                        title="Khôi phục phiên bản này (Rollback)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteVersion(ver.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Xóa phiên bản này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-medium text-white pl-1">
                    {ver.commitMessage}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-300 max-h-20 overflow-y-auto whitespace-pre-wrap border border-slate-800/80">
                    {ver.content}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Thời gian: {new Date(ver.createdAt).toLocaleString('vi-VN')}</span>
                    <span>{ver.mergeParentId ? 'merge · ' : ''}{ver.contentHash.slice(0, 8)} · {ver.content.length} ký tự</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Hỗ trợ Git-style branching và phục hồi phiên bản quá khứ</span>
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
