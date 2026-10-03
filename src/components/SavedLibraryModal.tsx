import React, { useState } from 'react';
import type { SavedPrompt, PromptDomain } from '../types';
import { X, Search, Trash2, Copy, Download, Bookmark, Check } from 'lucide-react';

interface SavedLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: SavedPrompt[];
  onSelectPrompt: (prompt: SavedPrompt) => void;
  onDeletePrompt: (id: string) => void;
}

export const SavedLibraryModal: React.FC<SavedLibraryModalProps> = ({
  isOpen,
  onClose,
  savedPrompts,
  onSelectPrompt,
  onDeletePrompt
}) => {
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState<PromptDomain | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = savedPrompts.filter((p) => {
    const matchDomain = filterDomain === 'all' || p.domain === filterDomain;
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.improved_prompt.toLowerCase().includes(search.toLowerCase()) ||
      p.original_prompt.toLowerCase().includes(search.toLowerCase());
    return matchDomain && matchSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedPrompts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lprompt_library_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kho Prompt Đã Lưu ({savedPrompts.length})</h3>
              <p className="text-xs text-slate-400">Quản lý các mẫu prompt đạt chuẩn 95-100 điểm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {(['all', 'research', 'image', 'video', 'code', 'audio'] as const).map((dom) => (
              <button
                key={dom}
                onClick={() => setFilterDomain(dom)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterDomain === dom
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {dom === 'all' ? 'Tất cả' : dom.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Chưa có prompt nào trong danh mục này. Hãy chấm điểm và lưu prompt để xem tại đây!
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-indigo-300">
                      {item.domain}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {item.score}đ - {item.tier}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(item.id, item.improved_prompt)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Sao chép prompt nâng cấp"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        onSelectPrompt(item);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium transition-colors"
                    >
                      Tải vào Editor
                    </button>
                    <button
                      onClick={() => onDeletePrompt(item.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {item.improved_prompt}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tạo ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                  <span>Độ dài: {item.improved_prompt.length} ký tự</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
