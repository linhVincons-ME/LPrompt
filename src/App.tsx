import { useState, useEffect } from 'react';
import type { PromptDomain, PromptEvaluation, GeminiConfig, SavedPrompt } from './types';
import { evaluatePromptLocally, evaluatePromptWithGemini } from './services/evaluator';
import { SAMPLE_PROMPTS } from './data/samplePrompts';
import { Header } from './components/Header';
import { ScoreGauge } from './components/ScoreGauge';
import { ScoreBreakdownCard } from './components/ScoreBreakdownCard';
import { DomainToolbar } from './components/DomainToolbar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SavedLibraryModal } from './components/SavedLibraryModal';
import {
  Sparkles,
  Zap,
  Copy,
  Check,
  BookmarkPlus,
  ArrowRightLeft,
  RotateCcw,
  SlidersHorizontal,
  Info,
  FileCheck
} from 'lucide-react';

const DEFAULT_CONFIG: GeminiConfig = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  temperature: 0.2
};

export function App() {
  const [currentDomain, setCurrentDomain] = useState<PromptDomain>('research');
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [evaluation, setEvaluation] = useState<PromptEvaluation | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);
  const [copiedImproved, setCopiedImproved] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Modals
  const [isApiKeyOpen, setIsApiKeyOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);

  // Config & Storage
  const [config, setConfig] = useState<GeminiConfig>(() => {
    const saved = localStorage.getItem('lprompt_gemini_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    const saved = localStorage.getItem('lprompt_saved_prompts');
    return saved ? JSON.parse(saved) : [];
  });

  // Load initial sample when domain changes if prompt is empty
  useEffect(() => {
    const domainSamples = SAMPLE_PROMPTS.filter((s) => s.domain === currentDomain);
    if (domainSamples.length > 0 && !rawPrompt) {
      setRawPrompt(domainSamples[0].prompt);
      const initialEval = evaluatePromptLocally(domainSamples[0].prompt, currentDomain);
      setEvaluation(initialEval);
    }
  }, [currentDomain]);

  // Persist config
  const handleSaveConfig = (newConfig: GeminiConfig) => {
    setConfig(newConfig);
    localStorage.setItem('lprompt_gemini_config', JSON.stringify(newConfig));
  };

  // Instant local evaluation
  const handleLocalEvaluate = (textToEval = rawPrompt) => {
    setAuditError(null);
    const result = evaluatePromptLocally(textToEval, currentDomain);
    setEvaluation(result);
  };

  // Deep audit with Gemini
  const handleGeminiAudit = async () => {
    if (!rawPrompt.trim()) {
      setAuditError('Vui lòng nhập nội dung prompt trước khi thẩm định.');
      return;
    }

    if (!config.apiKey) {
      setIsApiKeyOpen(true);
      return;
    }

    setIsAuditing(true);
    setAuditError(null);

    try {
      const result = await evaluatePromptWithGemini(rawPrompt, currentDomain, config);
      setEvaluation(result);
    } catch (err: any) {
      setAuditError(err.message || 'Lỗi kết nối Gemini API. Hãy kiểm tra lại API Key hoặc hạn mức.');
      // Fallback to local evaluation
      handleLocalEvaluate();
    } finally {
      setIsAuditing(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, type: 'original' | 'improved') => {
    navigator.clipboard.writeText(text);
    if (type === 'original') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedImproved(true);
      setTimeout(() => setCopiedImproved(false), 2000);
    }
  };

  // Save to Library
  const handleSavePrompt = () => {
    if (!evaluation) return;
    const newEntry: SavedPrompt = {
      id: Date.now().toString(),
      title: `${currentDomain.toUpperCase()} - ${rawPrompt.slice(0, 32)}...`,
      domain: currentDomain,
      original_prompt: rawPrompt,
      improved_prompt: evaluation.improved_prompt,
      score: evaluation.total_score,
      tier: evaluation.tier,
      tags: [currentDomain, evaluation.tier],
      created_at: new Date().toISOString()
    };

    const updated = [newEntry, ...savedPrompts];
    setSavedPrompts(updated);
    localStorage.setItem('lprompt_saved_prompts', JSON.stringify(updated));
    alert('Đã lưu prompt vào thư viện cá nhân!');
  };

  const currentSamples = SAMPLE_PROMPTS.filter((s) => s.domain === currentDomain);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentDomain={currentDomain}
        onSelectDomain={(d) => {
          setCurrentDomain(d);
          setRawPrompt('');
          setEvaluation(null);
        }}
        onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
        onOpenLibraryModal={() => setIsLibraryOpen(true)}
        savedCount={savedPrompts.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input Composer (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Sample Selector & Toolbar Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  Mẫu Thử Nghiệm ({currentDomain}):
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {currentSamples.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setRawPrompt(s.prompt);
                      handleLocalEvaluate(s.prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 transition-colors"
                  >
                    {s.title.split('(')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tag Injector */}
            <DomainToolbar
              domain={currentDomain}
              onInsertTag={(tag) => {
                const next = rawPrompt + tag;
                setRawPrompt(next);
                handleLocalEvaluate(next);
              }}
            />
          </div>

          {/* Text Area Input */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Prompt Cần Đánh Giá & Tối Ưu
                </label>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{rawPrompt ? rawPrompt.trim().split(/\s+/).length : 0} từ</span>
                <span>•</span>
                <span>{rawPrompt.length} ký tự</span>
                {rawPrompt && (
                  <button
                    onClick={() => handleCopy(rawPrompt, 'original')}
                    className="p-1 hover:text-white transition-colors"
                    title="Sao chép"
                  >
                    {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
                {rawPrompt && (
                  <button
                    onClick={() => {
                      setRawPrompt('');
                      setEvaluation(null);
                    }}
                    className="p-1 hover:text-rose-400 transition-colors"
                    title="Xóa trắng"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={rawPrompt}
              onChange={(e) => {
                setRawPrompt(e.target.value);
                handleLocalEvaluate(e.target.value);
              }}
              placeholder={`Nhập prompt cho ${currentDomain.toUpperCase()} tại đây... (Ví dụ: "Viết đoạn code crawler giá vàng...", "Chân dung thiếu nữ cyberpunk 8k...")`}
              className="w-full flex-1 min-h-[220px] p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors resize-y"
            />

            {/* Error banner if any */}
            {auditError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{auditError}</span>
                <button
                  onClick={() => setIsApiKeyOpen(true)}
                  className="underline font-semibold hover:text-white"
                >
                  Kiểm tra API Key
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleLocalEvaluate()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Chấm Điểm Nhanh (Local 0đ)</span>
              </button>

              <button
                type="button"
                onClick={handleGeminiAudit}
                disabled={isAuditing}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>
                  {isAuditing
                    ? `Đang thẩm định bằng ${config.model}...`
                    : `⚡ Nâng Cấp 95+ Điểm Với ${config.model}`}
                </span>
              </button>
            </div>
          </div>

          {/* Improved Output Panel */}
          {evaluation && evaluation.improved_prompt && (
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-md flex flex-col gap-3 shadow-xl shadow-indigo-950/40 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Phiên Bản Nâng Cấp Chuẩn Hóa (95 - 100 Điểm)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRawPrompt(evaluation.improved_prompt);
                      handleLocalEvaluate(evaluation.improved_prompt);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    title="Ghi đè bản tối ưu vào khung soạn thảo"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Dùng bản này</span>
                  </button>

                  <button
                    onClick={handleSavePrompt}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium transition-colors"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Lưu</span>
                  </button>

                  <button
                    onClick={() => handleCopy(evaluation.improved_prompt, 'improved')}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md shadow-emerald-600/20"
                  >
                    {copiedImproved ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedImproved ? 'Đã chép!' : '1-Click Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-100 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto selection:bg-indigo-500/40">
                {evaluation.improved_prompt}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-indigo-400" />
                  Đã bổ sung đầy đủ: Vai trò, Ngữ cảnh, Ràng buộc cấm kỵ, Format Schema & Thông số kỹ thuật.
                </span>
                <span className="font-mono text-emerald-400 font-semibold">Ready for Production</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Scoring & Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Radial Score Gauge */}
          <ScoreGauge
            score={evaluation ? evaluation.total_score : 0}
            tier={evaluation ? evaluation.tier : 'Yếu'}
            source={evaluation ? evaluation.source : 'local'}
            isAuditing={isAuditing}
          />

          {/* Breakdown by 5 Criteria & Diagnostic List */}
          <ScoreBreakdownCard
            breakdown={
              evaluation?.breakdown || {
                role_context: 0,
                task_clarity: 0,
                constraints: 0,
                output_format: 0,
                examples_specs: 0
              }
            }
            critique={
              evaluation?.critique || {
                pros: [],
                missing: ['Nhập prompt vào khung bên trái để bắt đầu thẩm định.']
              }
            }
          />
        </div>
      </main>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      <SavedLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        savedPrompts={savedPrompts}
        onSelectPrompt={(p) => {
          setCurrentDomain(p.domain);
          setRawPrompt(p.improved_prompt);
          handleLocalEvaluate(p.improved_prompt);
        }}
        onDeletePrompt={(id) => {
          const filtered = savedPrompts.filter((x) => x.id !== id);
          setSavedPrompts(filtered);
          localStorage.setItem('lprompt_saved_prompts', JSON.stringify(filtered));
        }}
      />
    </div>
  );
}

export default App;
