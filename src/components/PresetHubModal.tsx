import React, { useState } from 'react';
import type { FabricPreset } from '../types';
import { FABRIC_PRESETS } from '../data/fabricPresets';
import {
  X,
  Compass,
  Search,
  ArrowRight,
  Briefcase,
  Code2,
  PenTool,
  Film,
  GraduationCap,
  Copy,
  Check
} from 'lucide-react';

interface PresetHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: FabricPreset) => void;
}

export const PresetHubModal: React.FC<PresetHubModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePreset, setActivePreset] = useState<FabricPreset | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Tất Cả', icon: Compass },
    { id: 'business', label: 'Kinh Doanh & Quản Trị', icon: Briefcase },
    { id: 'engineering', label: 'Kỹ Thuật & Code', icon: Code2 },
    { id: 'copywriting', label: 'Copywriting & Content', icon: PenTool },
    { id: 'multimodal', label: 'Đa Phương Thức (Ảnh/Video)', icon: Film },
    { id: 'research', label: 'Nghiên Cứu & Phản Biện', icon: GraduationCap }
  ];

  const filteredPresets = FABRIC_PRESETS.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = (preset: FabricPreset) => {
    onSelectPreset(preset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white m-0">
                  Fabric-Style Presets Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  v2.0 PRESETS
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Kho mẫu prompt chuyên sâu chuẩn công nghiệp lấy cảm hứng từ Daniel Miessler Fabric & Awesome Prompts
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

        {/* Filter & Search Bar */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.map((c) => {
                const Icon = c.icon;
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm mẫu, từ khóa..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Body Grid & Preview Split */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/40 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-teal-950/20"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                      {preset.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {preset.framework}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                    {preset.title}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {preset.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setActivePreset(preset)}
                    className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    Xem chi tiết
                  </button>

                  <button
                    onClick={() => handleApply(preset)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white text-xs font-bold transition-all border border-teal-500/30"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Dùng mẫu</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPresets.length === 0 && (
            <div className="py-20 text-center text-slate-500 text-xs space-y-2">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <div>Không tìm thấy mẫu preset nào phù hợp.</div>
            </div>
          )}
        </div>

        {/* Modal Detail Preview Popup if activePreset */}
        {activePreset && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div>
                  <h3 className="text-sm font-bold text-white">{activePreset.title}</h3>
                  <span className="text-[11px] text-teal-400 font-mono">
                    Khung: {activePreset.framework} • Dùng được với Gemini Web qua extension
                  </span>
                </div>
                <button
                  onClick={() => setActivePreset(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs text-indigo-100 whitespace-pre-wrap bg-slate-950/80 max-h-96">
                {activePreset.prompt}
              </div>

              <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <button
                  onClick={() => handleCopyPrompt(activePreset.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép!' : 'Copy Prompt'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePreset(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      handleApply(activePreset);
                      setActivePreset(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/30"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Đưa Vào Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
