import { useState, useEffect, useMemo, useRef } from 'react';
import type {
  PromptDomain,
  PromptEvaluation,
  SavedPrompt,
  PromptVersion,
  VersionStage,
  FabricPreset
} from './types';
import { evaluatePromptLocally } from './services/evaluator';
import { SAMPLE_PROMPTS } from './data/samplePrompts';
import { extractVariables, interpolateTemplate, getInitialVariableValues } from './utils/template';
import { stableContentHash } from './utils/hash';
import { BRANCH_NAME_PATTERN, findCommonAncestor, getBranchHead, mergePromptContents } from './utils/versionGraph';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from './utils/storage';
import { Header } from './components/Header';
import { ScoreGauge } from './components/ScoreGauge';
import { ScoreBreakdownCard } from './components/ScoreBreakdownCard';
import { DomainToolbar } from './components/DomainToolbar';
import { SavedLibraryModal } from './components/SavedLibraryModal';
import { PromptOptimizerView } from './components/PromptOptimizerView';
import { VariableInputsPanel } from './components/VariableInputsPanel';
import { LivePlaygroundModal } from './components/LivePlaygroundModal';
import { CodeExportModal } from './components/CodeExportModal';
import { VisualDiffModal } from './components/VisualDiffModal';
import { RedTeamSecurityModal } from './components/RedTeamSecurityModal';
import { VersionHistoryDrawer } from './components/VersionHistoryDrawer';
import { FewShotSynthesizerModal } from './components/FewShotSynthesizerModal';
import { BatchEvaluationModal } from './components/BatchEvaluationModal';
import { PresetHubModal } from './components/PresetHubModal';
import {
  checkServiceHealth,
  fetchServerPrompts,
  saveServerPrompt,
  deleteServerPrompt,
  fetchServerVersions,
  saveServerVersion,
  deleteServerVersion,
  type ServiceHealth
} from './services/apiClient';
import {
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
  History,
  Target,
  Layers
} from 'lucide-react';

export function App() {
  const initialSample = SAMPLE_PROMPTS.find((sample) => sample.domain === 'research')?.prompt || '';
  const [currentDomain, setCurrentDomain] = useState<PromptDomain>('research');
  const [activeView, setActiveView] = useState<'evaluator' | 'optimizer'>('optimizer');
  const [rawPrompt, setRawPrompt] = useState<string>(initialSample);
  const [evaluation, setEvaluation] = useState<PromptEvaluation | null>(() => initialSample ? evaluatePromptLocally(initialSample, 'research') : null);
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);
  const [copiedImproved, setCopiedImproved] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Dynamic Variables state (v1.1)
  const variables = useMemo(() => extractVariables(rawPrompt), [rawPrompt]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Modals
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

  // v2.0 Batch Evals, local Few-Shot & Preset Hub Modals
  const [isFewShotOpen, setIsFewShotOpen] = useState<boolean>(false);
  const [fewShotTargetPrompt, setFewShotTargetPrompt] = useState<string>('');
  const [isBatchEvalOpen, setIsBatchEvalOpen] = useState<boolean>(false);
  const [batchEvalTargetPrompt, setBatchEvalTargetPrompt] = useState<string>('');
  const [isPresetHubOpen, setIsPresetHubOpen] = useState<boolean>(false);

  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    try {
      const saved = safeStorageGet('lprompt_saved_prompts');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      safeStorageRemove('lprompt_saved_prompts');
      return [];
    }
  });

  const [versions, setVersions] = useState<PromptVersion[]>(() => {
    try {
      const saved = safeStorageGet('lprompt_versions');
      const parsed = saved ? JSON.parse(saved) as Array<Partial<PromptVersion>> : [];
      return parsed.map((version) => ({
        ...version,
        id: String(version.id ?? `ver-${crypto.randomUUID()}`),
        versionNumber: String(version.versionNumber ?? 'legacy'),
        commitMessage: String(version.commitMessage ?? 'Imported legacy snapshot'),
        content: String(version.content ?? ''),
        stage: version.stage ?? 'draft',
        createdAt: String(version.createdAt ?? new Date(0).toISOString()),
        branchName: version.branchName ?? 'main',
        contentHash: version.contentHash || stableContentHash(String(version.content ?? ''))
      }));
    } catch {
      safeStorageRemove('lprompt_versions');
      return [];
    }
  });

  // v2.5 Service & SQLite Sync
  const [serviceStatus, setServiceStatus] = useState<ServiceHealth | null>(null);
  const [activeBranch, setActiveBranch] = useState(() => safeStorageGet('lprompt_active_branch') || 'main');
  const [pendingMergeParentId, setPendingMergeParentId] = useState<string | undefined>();
  const initialSavedPromptsRef = useRef(savedPrompts);
  const initialVersionsRef = useRef(versions);

  // Xóa cấu hình API cũ khỏi các bản nâng cấp trước; v3 extension-first không còn dùng secret này.
  useEffect(() => {
    safeStorageRemove('lprompt_gemini_config');
  }, []);

  // Sync with background LPrompt Service on mount
  useEffect(() => {
    checkServiceHealth().then(async (status) => {
      setServiceStatus(status);
      if (status.online) {
        // Sync prompts from embedded SQLite
        const serverPrompts = await fetchServerPrompts();
        if (serverPrompts) {
          const localPrompts = initialSavedPromptsRef.current;
          const merged = [...serverPrompts];
          for (const prompt of localPrompts) {
            if (!merged.some((item) => item.id === prompt.id)) {
              merged.push(prompt);
              await saveServerPrompt(prompt);
            }
          }
          setSavedPrompts(merged);
          safeStorageSet('lprompt_saved_prompts', merged);
        }
        // Sync versions from embedded SQLite
        const serverVersions = await fetchServerVersions();
        if (serverVersions) {
          const merged = [...serverVersions];
          for (const version of initialVersionsRef.current) {
            if (!merged.some((item) => item.id === version.id)) {
              merged.push(version);
              await saveServerVersion(version);
            }
          }
          setVersions(merged);
          safeStorageSet('lprompt_versions', merged);
        }
      }
    });
  }, []);

  // Instant local evaluation (evaluates interpolated if variables exist)
  const handleLocalEvaluate = (
    textToEval = rawPrompt,
    values = variableValues,
    domain = currentDomain
  ) => {
    setAuditError(null);
    const resolved = interpolateTemplate(textToEval, values);
    const result = evaluatePromptLocally(resolved || textToEval, domain);
    setEvaluation(result);
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
    if (!safeStorageSet('lprompt_saved_prompts', updated)) setAuditError('Không thể lưu thư viện vào bộ nhớ trình duyệt.');
    void saveServerPrompt(newEntry).then((saved) => {
      if (!saved && serviceStatus?.online) setAuditError('Đã lưu cache trình duyệt nhưng đồng bộ SQLite thất bại.');
    });
  };

  // v1.2 Versioning handlers
  const handleSaveVersions = (updated: PromptVersion[]) => {
    setVersions(updated);
    if (!safeStorageSet('lprompt_versions', updated)) setAuditError('Không thể lưu lịch sử phiên bản vào bộ nhớ trình duyệt.');
  };

  const handleCommitVersion = (message: string, stage: VersionStage, promptContent: string, mergeParentId?: string) => {
    const parent = getBranchHead(versions, activeBranch);
    const contentHash = stableContentHash(promptContent);
    const versionNum = `${activeBranch}@${contentHash}`;
    const newVer: PromptVersion = {
      id: `ver-${crypto.randomUUID()}`,
      versionNumber: versionNum,
      commitMessage: message.trim() || `Cập nhật ${versionNum}`,
      content: promptContent,
      stage: stage,
      score: evaluation?.total_score,
      createdAt: new Date().toISOString(),
      branchName: activeBranch,
      parentId: parent?.id,
      mergeParentId: mergeParentId ?? pendingMergeParentId,
      contentHash
    };
    const updated = [newVer, ...versions];
    handleSaveVersions(updated);
    setPendingMergeParentId(undefined);
    void saveServerVersion(newVer).then((saved) => {
      if (!saved && serviceStatus?.online) setAuditError('Commit đã lưu trong trình duyệt nhưng chưa đồng bộ được SQLite.');
    });
  };

  const handleSwitchBranch = (branchName: string) => {
    const head = getBranchHead(versions, branchName);
    setActiveBranch(branchName);
    safeStorageSet('lprompt_active_branch', branchName);
    setPendingMergeParentId(undefined);
    if (head) {
      setRawPrompt(head.content);
      handleLocalEvaluate(head.content);
    }
  };

  const handleCreateBranch = (branchName: string) => {
    const normalized = branchName.trim();
    if (!BRANCH_NAME_PATTERN.test(normalized)) {
      setAuditError('Tên nhánh không hợp lệ: chỉ dùng chữ, số, dấu . _ / - và tối đa 64 ký tự.');
      return;
    }
    if (versions.some((version) => version.branchName === normalized)) {
      setAuditError(`Nhánh "${normalized}" đã tồn tại.`);
      return;
    }
    const parent = getBranchHead(versions, activeBranch);
    const content = rawPrompt || parent?.content || '';
    if (!content.trim()) {
      setAuditError('Không thể tạo nhánh từ prompt rỗng.');
      return;
    }
    const contentHash = stableContentHash(content);
    const branchCommit: PromptVersion = {
      id: `ver-${crypto.randomUUID()}`, versionNumber: `${normalized}@${contentHash}`, commitMessage: `Tạo nhánh từ ${activeBranch}`,
      content, stage: parent?.stage || 'draft', score: evaluation?.total_score, createdAt: new Date().toISOString(), branchName: normalized,
      parentId: parent?.id, contentHash
    };
    const updated = [branchCommit, ...versions];
    handleSaveVersions(updated);
    setActiveBranch(normalized);
    safeStorageSet('lprompt_active_branch', normalized);
    void saveServerVersion(branchCommit);
  };

  const handleMergeBranch = (sourceBranch: string) => {
    if (sourceBranch === activeBranch) return;
    const currentHead = getBranchHead(versions, activeBranch);
    const sourceHead = getBranchHead(versions, sourceBranch);
    if (!sourceHead) {
      setAuditError(`Nhánh "${sourceBranch}" không có commit để merge.`);
      return;
    }
    const ancestor = findCommonAncestor(versions, currentHead?.id, sourceHead.id);
    const merged = mergePromptContents(ancestor?.content || '', currentHead?.content ?? rawPrompt, sourceHead.content, sourceBranch);
    setRawPrompt(merged.content);
    handleLocalEvaluate(merged.content);
    if (merged.conflicted) {
      setPendingMergeParentId(sourceHead.id);
      setAuditError('Merge tạo conflict markers và chưa được commit. Hãy sửa nội dung giữa <<<<<<< và >>>>>>> rồi tạo commit để hoàn tất merge.');
    } else {
      handleCommitVersion(`Merge ${sourceBranch} vào ${activeBranch}`, currentHead?.stage || sourceHead.stage, merged.content, sourceHead.id);
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    if (versions.some((version) => version.parentId === versionId || version.mergeParentId === versionId)) {
      setAuditError('Không thể xóa commit đang là cha của commit khác. Hãy giữ lại để đồ thị phiên bản không bị đứt.');
      return;
    }
    const updated = versions.filter((v) => v.id !== versionId);
    handleSaveVersions(updated);
    void deleteServerVersion(versionId);
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

  // v2.0 Handlers
  const handleOpenFewShotWith = (target?: string) => {
    setFewShotTargetPrompt(target || evaluation?.improved_prompt || rawPrompt);
    setIsFewShotOpen(true);
  };

  const handleOpenBatchEvalWith = (target?: string) => {
    setBatchEvalTargetPrompt(target || evaluation?.improved_prompt || rawPrompt);
    setIsBatchEvalOpen(true);
  };

  const handleSelectPreset = (preset: FabricPreset) => {
    setRawPrompt(preset.prompt);
    handleLocalEvaluate(preset.prompt);
  };

  const currentSamples = SAMPLE_PROMPTS.filter((s) => s.domain === currentDomain);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentDomain={currentDomain}
        onSelectDomain={(d) => {
          setCurrentDomain(d);
          const sample = SAMPLE_PROMPTS.find((item) => item.domain === d)?.prompt || '';
          setRawPrompt(sample);
          setVariableValues(getInitialVariableValues(extractVariables(sample)));
          setEvaluation(sample ? evaluatePromptLocally(sample, d) : null);
        }}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenLibraryModal={() => setIsLibraryOpen(true)}
        onOpenPlayground={() => handleOpenPlaygroundWith()}
        onOpenCodeExport={() => handleOpenCodeExportWith()}
        onOpenSecurityScan={() => setIsSecurityModalOpen(true)}
        onOpenVersionHistory={() => setIsVersionDrawerOpen(true)}
        onOpenFewShot={() => handleOpenFewShotWith()}
        onOpenBatchEval={() => handleOpenBatchEvalWith()}
        onOpenPresetHub={() => setIsPresetHubOpen(true)}
        serviceStatus={serviceStatus || undefined}
        versionCount={versions.length}
        savedCount={savedPrompts.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* VIEW 1: LOCAL PROMPT COMPILER */}
        {activeView === 'optimizer' ? (
          <PromptOptimizerView
            currentPrompt={rawPrompt}
            domain={currentDomain}
            onApplyImproved={(newPrompt) => {
              setRawPrompt(newPrompt);
              handleLocalEvaluate(newPrompt);
              setActiveView('evaluator');
            }}
            onOpenPlayground={(p) => handleOpenPlaygroundWith(p)}
            onOpenCodeExport={(p) => handleOpenCodeExportWith(p)}
            onOpenVisualDiff={(orig, mod) => handleOpenVisualDiff(orig, mod, 'Prompt Gốc', 'Prompt Đã Biên Dịch')}
            onOpenFewShot={(p) => handleOpenFewShotWith(p)}
            onOpenBatchEval={(p) => handleOpenBatchEvalWith(p)}
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
                    handleLocalEvaluate(rawPrompt, updated);
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
                    handleLocalEvaluate(rawPrompt, cleared);
                  }}
                />

                {/* Error banner if any */}
                {auditError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                    <span>{auditError}</span>
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
                      title="Quét tĩnh mức độ bao phủ guardrail OWASP LLM Top 10"
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

                    <button
                      type="button"
                      onClick={() => handleOpenFewShotWith(rawPrompt)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-colors"
                      title="Tạo ví dụ mẫu Few-Shot cục bộ"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Few-Shot</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenBatchEvalWith(rawPrompt)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-colors"
                      title="Chạy kiểm thử hàng loạt Test Suite"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Template Test</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveView('optimizer')}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
                    >
                      <Wand2 className="w-4 h-4 text-pink-200" />
                      <span>Biên Dịch Prompt</span>
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
                        Phiên Bản Nâng Cấp Được Đề Xuất
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPlaygroundWith(evaluation.improved_prompt)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-bold transition-colors"
                        title="Xem trước bản nâng cấp cục bộ"
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
                        onClick={() => handleOpenVisualDiff(rawPrompt, evaluation.improved_prompt, 'Prompt Hiện Tại', 'Bản Nâng Cấp Đề Xuất')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-medium transition-colors"
                        title="So sánh chi tiết thay đổi (Word-level Diff)"
                      >
                        <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                        <span>So sánh Diff</span>
                      </button>

                      <button
                        onClick={() => handleOpenFewShotWith(evaluation.improved_prompt)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-900/60 text-purple-300 hover:text-white text-xs font-medium transition-colors"
                        title="Tự động sinh mẫu Few-Shot"
                      >
                        <Target className="w-3.5 h-3.5 text-purple-400" />
                        <span>Few-Shot</span>
                      </button>

                      <button
                        onClick={() => handleOpenBatchEvalWith(evaluation.improved_prompt)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-indigo-300 hover:text-white text-xs font-medium transition-colors"
                        title="Kiểm thử template cục bộ"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Template Test</span>
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
                isAuditing={false}
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
      <SavedLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        savedPrompts={savedPrompts}
        onSelectPrompt={(p) => {
          setCurrentDomain(p.domain);
          setRawPrompt(p.improved_prompt);
          handleLocalEvaluate(p.improved_prompt, variableValues, p.domain);
        }}
        onDeletePrompt={(id) => {
          const filtered = savedPrompts.filter((x) => x.id !== id);
          setSavedPrompts(filtered);
          safeStorageSet('lprompt_saved_prompts', filtered);
          deleteServerPrompt(id);
        }}
      />

      {/* v1.1 Modals: Playground & Code Export */}
      <LivePlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        prompt={playgroundPrompt}
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        rawPrompt={codeExportPrompt}
        interpolatedPrompt={interpolateTemplate(codeExportPrompt, variableValues)}
        hasVariables={variables.length > 0}
      />

      {/* v1.2 Modals: Red-Teaming, Version History, Visual Diff */}
      <RedTeamSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        prompt={interpolateTemplate(rawPrompt, variableValues) || rawPrompt}
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
        activeBranch={activeBranch}
        onCommitNewVersion={(message, stage) => handleCommitVersion(message, stage, rawPrompt)}
        onRollbackToVersion={handleRollbackVersion}
        onCompareWithVersion={handleCompareWithCurrent}
        onDeleteVersion={handleDeleteVersion}
        onSwitchBranch={handleSwitchBranch}
        onCreateBranch={handleCreateBranch}
        onMergeBranch={handleMergeBranch}
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

      {/* v2.0 Modals: Few-Shot Synthesizer, Batch Evaluation, Preset Hub */}
      <FewShotSynthesizerModal
        isOpen={isFewShotOpen}
        onClose={() => setIsFewShotOpen(false)}
        prompt={fewShotTargetPrompt}
        onApplyIntegratedPrompt={(newPrompt) => {
          setRawPrompt(newPrompt);
          handleLocalEvaluate(newPrompt);
        }}
      />

      <BatchEvaluationModal
        key={batchEvalTargetPrompt}
        isOpen={isBatchEvalOpen}
        onClose={() => setIsBatchEvalOpen(false)}
        promptTemplate={batchEvalTargetPrompt}
        variables={extractVariables(batchEvalTargetPrompt)}
      />

      <PresetHubModal
        isOpen={isPresetHubOpen}
        onClose={() => setIsPresetHubOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}

export default App;
