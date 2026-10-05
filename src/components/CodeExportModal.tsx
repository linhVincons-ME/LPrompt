import React, { useState } from 'react';
import type { ExportLanguage } from '../types';
import { exportPromptCode } from '../services/codeExporter';
import {
  X,
  Code2,
  Copy,
  Check,
  FileCode,
  Terminal,
  FileJson
} from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawPrompt: string;
  interpolatedPrompt: string;
  hasVariables: boolean;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  rawPrompt,
  interpolatedPrompt,
  hasVariables
}) => {
  const [selectedLang, setSelectedLang] = useState<ExportLanguage>('markdown');
  const [useInterpolated, setUseInterpolated] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const promptToExport = hasVariables && !useInterpolated ? rawPrompt : interpolatedPrompt || rawPrompt;
  const generatedCode = exportPromptCode(promptToExport, selectedLang);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages: { id: ExportLanguage; label: string; icon: React.ReactNode }[] = [
    { id: 'markdown', label: 'Markdown', icon: <FileCode className="w-4 h-4 text-yellow-400" /> },
    { id: 'text', label: 'Plain text', icon: <Terminal className="w-4 h-4 text-emerald-400" /> },
    { id: 'json', label: 'JSON PromptOps Spec', icon: <FileJson className="w-4 h-4 text-orange-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Xuất Prompt</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  LOCAL
                </span>
              </div>
              <p className="text-xs text-slate-400">Xuất prompt sạch dưới dạng Markdown, text hoặc JSON</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Language Tabs */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedLang === lang.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {lang.icon}
                <span>{lang.label}</span>
              </button>
            ))}
          </div>

          {hasVariables && (
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={useInterpolated}
                onChange={(e) => setUseInterpolated(e.target.checked)}
                className="accent-indigo-500 rounded"
              />
              <span>Điền sẵn giá trị biến {"{{var}}"}</span>
            </label>
          )}
        </div>

        {/* Code Display Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-100">
          <pre className="whitespace-pre-wrap leading-relaxed selection:bg-indigo-500/30">
            {generatedCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Không chứa API key, SDK hoặc endpoint nhà cung cấp
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : '1-Click Sao Chép Mã'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
