import { useState, useEffect } from 'react';
import type { PromptDomain, PromptEvaluation, GeminiConfig, SavedPrompt, PromptVersion, VersionStage } from './types';
import { evaluatePromptLocally, evaluatePromptWithGemini } from './services/evaluator';
import { SAMPLE_PROMPTS } from './data/samplePrompts';
import { extractVariables, interpolateTemplate, getInitialVariableValues } from './utils/template';
import { Header } from './components/Header';
import { ScoreGauge } from './components/ScoreGauge';
import { ScoreBreakdownCard } from './components/ScoreBreakdownCard';
import { DomainToolbar } from './components/DomainToolbar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SavedLibraryModal } from './components/SavedLibraryModal';
import { PromptOptimizerView } from './components/PromptOptimizerView';
import { VariableInputsPanel } from './components/VariableInputsPanel';
import { LivePlaygroundModal } from './components/LivePlaygroundModal';
import { CodeExportModal } from './components/CodeExportModal';
import { VisualDiffModal } from './components/VisualDiffModal';
import { RedTeamSecurityModal } from './components/RedTeamSecurityModal';
import { VersionHistoryDrawer } from './components/VersionHistoryDrawer';
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
  FileCheck,
  Wand2,
  Play,
  Share2,
  GitCompare,
  Shield,
  History
} from 'lucide-react';

const DEFAULT_CONFIG: GeminiConfig = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  temperature: 0.2
};

export function App() {
  const [currentDomain, setCurrentDomain] = useState<PromptDomain>('research');
  const [activeView, setActiveView] = useState<'evaluator' | 'optimizer'>('optimizer');
  const [rawPrompt, setRawPrompt] = useState<string>('');
  const [evaluation, setEvaluation] = useState<PromptEvaluation | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);
  const [copiedImproved, setCopiedImproved] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Dynamic Variables state (v1.1)
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Modals
  const [isApiKeyOpen, setIsApiKeyOpen] = useState<boolean>(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState<boolean>(false);
  const [playgroundPrompt, setPlaygroundPrompt] = useState<string>('');
  const [isCodeExportOpen, setIsCodeExportOpen] = useState<boolean>(false);
  const [codeExportPrompt, setCodeExportPrompt] = useState<string>('');

  // v1.2 Versioning & Security & Visual Diff Modals
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState<boolean>(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);
  const [diffOriginal, setDiffOriginal] = useState<string>('');
  const [diffModified, setDiffModified] = useState<string>('');
  const [diffOriginalLabel, setDiffOriginalLabel] = useState<string>('Bản gốc');
  const [diffModifiedLabel, setDiffModifiedLabel] = useState<string>('Bản tối ưu');

  // Config & Storage
  const [config, setConfig] = useState<GeminiConfig>(() => {
    const saved = localStorage.getItem('lprompt_gemini_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    const saved = localStorage.getItem('lprompt_saved_prompts');
    return saved ? JSON.parse(saved) : [];
  });

  const [versions, setVersions] = useState<PromptVersion[]>(() => {
    const saved = localStorage.getItem('lprompt_versions');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync variables whenever rawPrompt changes
  useEffect(() => {
    const detected = extractVariables(rawPrompt);
    setVariables(detected);
    setVariableValues((prev) => getInitialVariableValues(detected, prev));
  }, [rawPrompt]);

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

  // Instant local evaluation (evaluates interpolated if variables exist)
  const handleLocalEvaluate = (textToEval = rawPrompt) => {
    setAuditError(null);
    const resolved = interpolateTemplate(textToEval, variableValues);
    const result = evaluatePromptLocally(resolved || textToEval, currentDomain);
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

    const resolved = interpolateTemplate(rawPrompt, variableValues);
    try {
      const result = await evaluatePromptWithGemini(resolved || rawPrompt, currentDomain, config);
      setEvaluation(result);
    } catch (err: any) {
      setAuditError(err.message || 'Lỗi kết nối Gemini API. Hãy kiểm tra lại API Key hoặc hạn mức.');
      handleLocalEvaluate();
    } finally {
      setIsAuditing(false);
    }
  };

  // Trigger Playground
  const handleOpenPlaygroundWith = (promptText?: string) => {
    const target = promptText || evaluation?.improved_prompt || rawPrompt;
    const resolved = interpolateTemplate(target, variableValues);
    setPlaygroundPrompt(resolved || target);
    setIsPlaygroundOpen(true);
  };

  // Trigger Code Export
  const handleOpenCodeExportWith = (promptText?: string) => {
    const target = promptText || evaluation?.improved_prompt || rawPrompt;
    setCodeExportPrompt(target);
    setIsCodeExportOpen(true);
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

  // v1.2 Versioning handlers
  const handleSaveVersions = (updated: PromptVersion[]) => {
    setVersions(updated);
    localStorage.setItem('lprompt_versions', JSON.stringify(updated));
  };

  const handleCommitVersion = (message: string, stage: VersionStage, promptContent: string) => {
    const versionNum = `v1.${versions.length}`;
    const newVer: PromptVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: versionNum,
      commitMessage: message.trim() || `Cập nhật ${versionNum}`,
      content: promptContent,
      stage: stage,
      score: evaluation?.total_score,
      createdAt: new Date().toISOString()
    };
    const updated = [newVer, ...versions];
    handleSaveVersions(updated);
  };

  const handleDeleteVersion = (versionId: string) => {
    const updated = versions.filter((v) => v.id !== versionId);
    handleSaveVersions(updated);
  };

  const handleRollbackVersion = (version: PromptVersion) => {
    setRawPrompt(version.content);
    handleLocalEvaluate(version.content);
    setIsVersionDrawerOpen(false);
  };

  const handleCompareWithCurrent = (version: PromptVersion) => {
    setDiffOriginal(version.content);
    setDiffModified(rawPrompt);
    setDiffOriginalLabel(`${version.versionNumber} (${version.stage})`);
    setDiffModifiedLabel('Nội dung hiện tại');
    setIsDiffModalOpen(true);
  };

  const handleOpenVisualDiff = (
    orig: string,
    mod: string,
    origLabel = 'Prompt Gốc',
    modLabel = 'Prompt Tối Ưu'
  ) => {
    setDiffOriginal(orig);
    setDiffModified(mod);
    setDiffOriginalLabel(origLabel);
    setDiffModifiedLabel(modLabel);
    setIsDiffModalOpen(true);
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
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
        onOpenLibraryModal={() => setIsLibraryOpen(true)}
        onOpenPlayground={() => handleOpenPlaygroundWith()}
        onOpenCodeExport={() => handleOpenCodeExportWith()}
        onOpenSecurityScan={() => setIsSecurityModalOpen(true)}
        onOpenVersionHistory={() => setIsVersionDrawerOpen(true)}
        versionCount={versions.length}
        savedCount={savedPrompts.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* VIEW 1: GEMINI PRO PROMPT OPTIMIZER */}
        {activeView === 'optimizer' ? (
          <PromptOptimizerView
            currentPrompt={rawPrompt}
            domain={currentDomain}
            config={config}
            onApplyImproved={(newPrompt) => {
              setRawPrompt(newPrompt);
              handleLocalEvaluate(newPrompt);
              setActiveView('evaluator');
            }}
            onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
            onOpenPlayground={(p) => handleOpenPlaygroundWith(p)}
            onOpenCodeExport={(p) => handleOpenCodeExportWith(p)}
            onOpenVisualDiff={(orig, mod) => handleOpenVisualDiff(orig, mod, 'Prompt Gốc', 'Gemini Pro Tối Ưu')}
          />
        ) : (
          /* VIEW 2: EVALUATOR & SCORING WORKSPACE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                  placeholder={`Nhập prompt cho ${currentDomain.toUpperCase()} tại đây... Bạn có thể dùng cú pháp {{ten_bien}} để tạo biến động.`}
                  className="w-full flex-1 min-h-[190px] p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                />

                {/* Dynamic Variables Panel (v1.1) */}
                <VariableInputsPanel
                  variables={variables}
                  values={variableValues}
                  onChangeValue={(name, val) => {
                    const updated = { ...variableValues, [name]: val };
                    setVariableValues(updated);
                    handleLocalEvaluate(rawPrompt);
                  }}
                  onAddVariable={(name) => {
                    const tag = ` {{${name}}}`;
                    const next = rawPrompt + tag;
                    setRawPrompt(next);
                  }}
                  onClearValues={() => {
                    const cleared: Record<string, string> = {};
                    variables.forEach((v) => (cleared[v] = ''));
                    setVariableValues(cleared);
                    handleLocalEvaluate(rawPrompt);
                  }}
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
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLocalEvaluate()}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Chấm Điểm Cục Bộ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPlaygroundWith(rawPrompt)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition-colors"
                      title="Chạy thử nghiệm bản gốc"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Chạy Thử</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSecurityModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-colors"
                      title="Quét lỗ hổng bảo mật Red-Teaming (OWASP LLM Top 10)"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Quét Bảo Mật</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVersionDrawerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold transition-colors"
                      title="Quản lý lịch sử phiên bản Git-style"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Phiên Bản ({versions.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('optimizer')}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
                    >
                      <Wand2 className="w-4 h-4 text-pink-200" />
                      <span>Tối Ưu Gemini Pro</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGeminiAudit}
                      disabled={isAuditing}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                      <span>
                        {isAuditing ? 'Đang chấm...' : 'Chấm Gemini'}
                      </span>
                    </button>
                  </div>
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

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPlaygroundWith(evaluation.improved_prompt)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-bold transition-colors"
                        title="Chạy thử nghiệm bản nâng cấp trong Playground"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Chạy Thử</span>
                      </button>

                      <button
                        onClick={() => handleOpenCodeExportWith(evaluation.improved_prompt)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                        title="Xuất mã nguồn SDK"
                      >
                        <Share2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Xuất Code</span>
                      </button>

                      <button
                        onClick={() => handleOpenVisualDiff(rawPrompt, evaluation.improved_prompt, 'Prompt Hiện Tại', 'Bản Nâng Cấp 100đ')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-medium transition-colors"
                        title="So sánh chi tiết thay đổi (Word-level Diff)"
                      >
                        <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                        <span>So sánh Diff</span>
                      </button>

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
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium transition-colors"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Lưu</span>
                      </button>

                      <button
                        onClick={() => handleCopy(evaluation.improved_prompt, 'improved')}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md shadow-emerald-600/20"
                      >
                        {copiedImproved ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedImproved ? 'Đã chép!' : 'Copy'}</span>
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
          </div>
        )}
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

      {/* v1.1 Modals: Playground & Code Export */}
      <LivePlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        prompt={playgroundPrompt}
        config={config}
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        rawPrompt={codeExportPrompt}
        interpolatedPrompt={interpolateTemplate(codeExportPrompt, variableValues)}
        hasVariables={variables.length > 0}
        config={config}
      />

      {/* v1.2 Modals: Red-Teaming, Version History, Visual Diff */}
      <RedTeamSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        prompt={interpolateTemplate(rawPrompt, variableValues) || rawPrompt}
        config={config}
        onApplyPatchedPrompt={(patched) => {
          setRawPrompt(patched);
          handleLocalEvaluate(patched);
        }}
      />

      <VersionHistoryDrawer
        isOpen={isVersionDrawerOpen}
        onClose={() => setIsVersionDrawerOpen(false)}
        versions={versions}
        currentPrompt={rawPrompt}
        onCommitNewVersion={(message, stage) => handleCommitVersion(message, stage, rawPrompt)}
        onRollbackToVersion={handleRollbackVersion}
        onCompareWithVersion={handleCompareWithCurrent}
        onDeleteVersion={handleDeleteVersion}
      />

      <VisualDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        originalText={diffOriginal}
        modifiedText={diffModified}
        originalLabel={diffOriginalLabel}
        modifiedLabel={diffModifiedLabel}
        onApplyModified={(text: string) => {
          setRawPrompt(text);
          handleLocalEvaluate(text);
          setIsDiffModalOpen(false);
        }}
      />
    </div>
  );
}

export default App;
