import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ClipboardPaste,
  Copy,
  ExternalLink,
  FileClock,
  Film,
  HardHat,
  Image as ImageIcon,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
  Users,
  X
} from 'lucide-react';
import type { PromptDomain } from '../src/types';
import { evaluatePromptLocally } from '../src/services/evaluator';
import {
  compilePromptFramework,
  type FrameworkCompileResult,
  type OutputLanguage
} from '../src/services/frameworkCompiler';
import {
  compileConstructionPrompt,
  CONSTRUCTION_CREW_OPTIONS,
  inspectConstructionAdditionalRequirements,
  type ConstructionCrewPreset,
  type ConstructionOutputType,
  type ConstructionPromptResult
} from '../src/services/constructionPromptCompiler';
import { recordTransientFailure, type AvailabilityState, type TransientFailure } from './availability';
import { inspectPromptLocally } from '../src/services/promptInspector';

interface StoredDraft {
  source: string;
  domain: PromptDomain;
  additionalInstruction: string;
  outputLanguage: OutputLanguage;
}

interface StoredConstructionDraft {
  context: string;
  dialogue: string;
  outputType: ConstructionOutputType;
  aspectRatio: '9:16' | '16:9' | '1:1';
  durationSeconds: number;
  participantCount: number;
  crewPreset?: ConstructionCrewPreset;
  referenceAssets: string;
  additionalRequirements: string;
}

interface Snapshot {
  id: string;
  createdAt: string;
  framework: string;
  outputLanguage?: OutputLanguage;
  prompt: string;
  response?: string;
}

interface GeminiResponse {
  ok: boolean;
  text?: string;
  error?: string;
  transientFailure?: TransientFailure;
  warning?: string;
}

interface GeminiAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

const STORAGE_KEYS = {
  draft: 'lpromptDraft',
  constructionDraft: 'lpromptConstructionDraft',
  activeTab: 'lpromptActiveTab',
  snapshots: 'lpromptSnapshots',
  lastResponse: 'lpromptLastResponse',
  availability: 'lpromptAvailability',
  lastBridgeDraftId: 'lpromptLastBridgeDraftId',
  selectionImport: 'lpromptSelectionImport'
} as const;

const SAMPLE_CONSTRUCTION_CONTEXT = 'KTHT đứng tại tuyến cáp điện hạ tầng đã thi công, phía sau là khu vực cần nghiệm thu.';
const SAMPLE_CONSTRUCTION_DIALOGUE = 'Hướng dẫn nghiệm thu dây cáp điện hạ tầng, các bước triển khai sẽ diễn ra như sau.';
const MAX_REFERENCE_FILES = 4;
const MAX_REFERENCE_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_REFERENCE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function mergeReferenceFiles(current: File[], incoming: File[]): File[] {
  const files = new Map(current.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file]));
  incoming.forEach((file) => files.set(`${file.name}-${file.size}-${file.lastModified}`, file));
  return [...files.values()];
}

const DOMAINS: Array<{ id: PromptDomain; label: string }> = [
  { id: 'research', label: 'Nghiên cứu' },
  { id: 'code', label: 'Code' },
  { id: 'image', label: 'Hình ảnh' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Âm thanh' }
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); }
    );
  });
}

function fileToAttachment(file: File): Promise<GeminiAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Không đọc được ảnh ${file.name}.`));
    reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  });
}

async function getGeminiTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('https://gemini.google.com/')) {
    throw new Error('Tab hiện tại không phải Gemini. Hãy mở gemini.google.com rồi thử lại.');
  }
  return tab;
}

async function sendToGemini(message: object): Promise<GeminiResponse> {
  const tab = await getGeminiTab();
  try {
    const response = await withTimeout(
      chrome.tabs.sendMessage(tab.id!, message) as Promise<GeminiResponse>,
      7000,
      'Gemini không phản hồi sau 7 giây. Hãy tải lại tab rồi thử lại.'
    );
    if (!response || typeof response.ok !== 'boolean') throw new Error('Phản hồi từ content script không hợp lệ.');
    return response;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('7 giây') || error.message.includes('không hợp lệ'))) throw error;
    throw new Error('Không kết nối được với trang Gemini. Hãy tải lại tab Gemini sau khi cài extension.');
  }
}

export function ExtensionPanel() {
  const [activeTab, setActiveTab] = useState<'standard' | 'construction'>('standard');
  const [source, setSource] = useState('');
  const [domain, setDomain] = useState<PromptDomain>('research');
  const [additionalInstruction, setAdditionalInstruction] = useState('');
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('vi');
  const [compiled, setCompiled] = useState<FrameworkCompileResult | null>(null);
  const [response, setResponse] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [status, setStatus] = useState('Sẵn sàng. Extension không tự bấm gửi.');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityState | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const lastBridgeDraftIdRef = useRef('');
  const lastSelectionImportIdRef = useRef('');
  const activeTabRef = useRef(activeTab);
  const storageReadyRef = useRef<Promise<void>>(Promise.resolve());
  const domainRef = useRef(domain);
  const additionalInstructionRef = useRef(additionalInstruction);
  const outputLanguageRef = useRef(outputLanguage);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { domainRef.current = domain; }, [domain]);
  useEffect(() => { additionalInstructionRef.current = additionalInstruction; }, [additionalInstruction]);
  useEffect(() => { outputLanguageRef.current = outputLanguage; }, [outputLanguage]);

  // Construction state
  const [constructionContext, setConstructionContext] = useState('');
  const [constructionDialogue, setConstructionDialogue] = useState('');
  const [constructionOutputType, setConstructionOutputType] = useState<ConstructionOutputType>('image');
  const [constructionAspectRatio, setConstructionAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [constructionDuration, setConstructionDuration] = useState(8);
  const [constructionCrewPreset, setConstructionCrewPreset] = useState<ConstructionCrewPreset>('ktht');
  const [constructionReferences, setConstructionReferences] = useState('');
  const [constructionReferenceFiles, setConstructionReferenceFiles] = useState<File[]>([]);
  const [isConstructionReferenceDragActive, setIsConstructionReferenceDragActive] = useState(false);
  const [constructionAdditional, setConstructionAdditional] = useState('');
  const [constructionCompiled, setConstructionCompiled] = useState<ConstructionPromptResult | null>(null);
  const [constructionCopied, setConstructionCopied] = useState(false);

  const applySelection = useCallback((id: string, text: string) => {
    if (!id || id === lastSelectionImportIdRef.current || !text) return;
    lastSelectionImportIdRef.current = id;
    if (activeTabRef.current === 'construction') {
      setConstructionContext(text);
      setConstructionCompiled(null);
      void chrome.storage.local.get(STORAGE_KEYS.constructionDraft).then((stored) => {
        const prev = (stored[STORAGE_KEYS.constructionDraft] as StoredConstructionDraft | undefined) ?? {};
        return chrome.storage.local.set({ [STORAGE_KEYS.constructionDraft]: { ...prev, context: text } });
      }).catch(() => undefined);
      setStatus('Đã nhận bối cảnh thi công từ văn bản được bôi chọn.');
    } else {
      setSource(text);
      setCompiled(null);
      setStatus('Đã nhận phần văn bản được chọn từ menu chuột phải.');
    }
  }, []);

  useEffect(() => {
    storageReadyRef.current = chrome.storage.local.get([
      STORAGE_KEYS.draft,
      STORAGE_KEYS.constructionDraft,
      STORAGE_KEYS.activeTab,
      STORAGE_KEYS.snapshots,
      STORAGE_KEYS.lastResponse,
      STORAGE_KEYS.availability,
      STORAGE_KEYS.lastBridgeDraftId,
      STORAGE_KEYS.selectionImport
    ]).then((stored) => {
      const savedBridgeDraftId = stored[STORAGE_KEYS.lastBridgeDraftId] as string | undefined;
      if (savedBridgeDraftId) {
        lastBridgeDraftIdRef.current = savedBridgeDraftId;
      }
      const draft = stored[STORAGE_KEYS.draft] as StoredDraft | undefined;
      if (draft) {
        setSource(draft.source ?? '');
        setDomain(draft.domain ?? 'research');
        setAdditionalInstruction(draft.additionalInstruction ?? '');
        setOutputLanguage(draft.outputLanguage ?? 'vi');
      }
      const construction = stored[STORAGE_KEYS.constructionDraft] as StoredConstructionDraft | undefined;
      if (construction) {
        setConstructionContext(construction.context ?? '');
        setConstructionDialogue(construction.dialogue ?? '');
        setConstructionOutputType(construction.outputType ?? 'image');
        setConstructionAspectRatio(construction.aspectRatio ?? '9:16');
        setConstructionDuration(construction.durationSeconds ?? 8);
        setConstructionCrewPreset(construction.crewPreset ?? 'ktht');
        setConstructionReferences(construction.referenceAssets ?? '');
        setConstructionAdditional(construction.additionalRequirements ?? '');
      }
      const savedTab = stored[STORAGE_KEYS.activeTab] as 'standard' | 'construction' | undefined;
      if (savedTab === 'standard' || savedTab === 'construction') {
        setActiveTab(savedTab);
        // Đồng bộ ref ngay: effect cập nhật activeTabRef chưa chạy, mà applySelection bên dưới đọc ref
        // để quyết định đổ đoạn bôi chọn vào tab nào.
        activeTabRef.current = savedTab;
      }
      setSnapshots((stored[STORAGE_KEYS.snapshots] as Snapshot[] | undefined) ?? []);
      setResponse((stored[STORAGE_KEYS.lastResponse] as string | undefined) ?? '');
      const savedAvailability = stored[STORAGE_KEYS.availability] as AvailabilityState | undefined;
      if (savedAvailability?.retryAt && savedAvailability?.failure) setAvailability(savedAvailability);

      const selectionImport = stored[STORAGE_KEYS.selectionImport] as { id?: string; source?: string; at?: number } | undefined;
      if (selectionImport?.id && selectionImport.source && selectionImport.at && (Date.now() - selectionImport.at < 15_000)) {
        applySelection(selectionImport.id, selectionImport.source);
      }
    }).catch(() => setStatus('Không đọc được dữ liệu cục bộ; bạn vẫn có thể tiếp tục soạn prompt.'));
  }, [applySelection]);

  const saveConstructionDraft = useCallback((patch: Partial<StoredConstructionDraft>) => {
    const nextDraft: StoredConstructionDraft = {
      context: constructionContext,
      dialogue: constructionDialogue,
      outputType: constructionOutputType,
      aspectRatio: constructionAspectRatio,
      durationSeconds: constructionDuration,
      participantCount: 1,
      crewPreset: constructionCrewPreset,
      referenceAssets: constructionReferences,
      additionalRequirements: constructionAdditional,
      ...patch
    };
    void chrome.storage.local.set({ [STORAGE_KEYS.constructionDraft]: nextDraft }).catch(() => undefined);
  }, [constructionContext, constructionDialogue, constructionOutputType, constructionAspectRatio, constructionDuration, constructionCrewPreset, constructionReferences, constructionAdditional]);

  const constructionReferencePreviews = useMemo(
    () => constructionReferenceFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [constructionReferenceFiles]
  );
  useEffect(() => () => constructionReferencePreviews.forEach(({ url }) => URL.revokeObjectURL(url)), [constructionReferencePreviews]);

  const constructionRequirementCheck = useMemo(() => inspectConstructionAdditionalRequirements(constructionAdditional, {
    outputType: constructionOutputType,
    aspectRatio: constructionAspectRatio,
    crewPreset: constructionCrewPreset
  }), [constructionAdditional, constructionOutputType, constructionAspectRatio, constructionCrewPreset]);

  const updateConstructionReferenceFiles = (files: File[]) => {
    setConstructionReferenceFiles(files);
    const names = files.map((file) => file.name).join(', ');
    setConstructionReferences(names);
    setConstructionCompiled(null);
    saveConstructionDraft({ referenceAssets: names });
    setStatus(files.length > 0 ? `Đã chọn ${files.length} ảnh tham chiếu thật.` : 'Đã bỏ toàn bộ ảnh tham chiếu.');
  };

  const addConstructionReferenceFiles = (files: FileList | File[] | null) => {
    const incoming = [...(files ?? [])];
    const selected = mergeReferenceFiles(constructionReferenceFiles, incoming);
    if (selected.length > MAX_REFERENCE_FILES) {
      setStatus(`Chỉ được chọn tối đa ${MAX_REFERENCE_FILES} ảnh tham chiếu.`);
      return;
    }
    const invalid = incoming.find((file) => !ALLOWED_REFERENCE_TYPES.has(file.type) || file.size > MAX_REFERENCE_FILE_SIZE);
    if (invalid) {
      setStatus(`File ${invalid.name} không phải ảnh hợp lệ hoặc lớn hơn 5 MB.`);
      return;
    }
    updateConstructionReferenceFiles(selected);
  };

  const switchTab = (tab: 'standard' | 'construction') => {
    setActiveTab(tab);
    void chrome.storage.local.set({ [STORAGE_KEYS.activeTab]: tab }).catch(() => undefined);
  };

  useEffect(() => {
    const messageListener = (message: unknown) => {
      const payload = message as { type?: string; source?: string; importId?: string };
      if (payload.type !== 'LPROMPT_DRAFT_UPDATED' || !payload.source) return;
      applySelection(payload.importId || `msg_${Date.now()}`, payload.source);
    };

    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'local') return;
      const next = changes[STORAGE_KEYS.selectionImport]?.newValue as { id?: string; source?: string } | undefined;
      if (next?.id && next.source) {
        applySelection(next.id, next.source);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    chrome.storage.onChanged.addListener(storageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, [applySelection]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      await storageReadyRef.current;
      if (!active) return;
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch('http://127.0.0.1:8484/api/extension/draft', { signal: controller.signal, cache: 'no-store' });
        if (!active || res.status === 204 || !res.ok) return;
        const payload = await res.json() as {
          data?: {
            id?: string;
            source?: string;
            domain?: PromptDomain;
            additionalInstruction?: string;
            outputLanguage?: 'vi' | 'en';
          }
        };
        if (!payload.data?.id || !payload.data.source || payload.data.id === lastBridgeDraftIdRef.current) return;
        lastBridgeDraftIdRef.current = payload.data.id;
        setSource(payload.data.source);
        if (payload.data.domain) setDomain(payload.data.domain);
        if (payload.data.additionalInstruction !== undefined) setAdditionalInstruction(payload.data.additionalInstruction);
        if (payload.data.outputLanguage) setOutputLanguage(payload.data.outputLanguage);
        setCompiled(null);
        setStatus('Đã nhận prompt từ web app cục bộ.');
        const nextDomain = payload.data.domain || domainRef.current;
        const nextInstruction = payload.data.additionalInstruction !== undefined ? payload.data.additionalInstruction : additionalInstructionRef.current;
        const nextLang = payload.data.outputLanguage || outputLanguageRef.current;
        await chrome.storage.local.set({
          [STORAGE_KEYS.lastBridgeDraftId]: payload.data.id,
          [STORAGE_KEYS.draft]: {
            source: payload.data.source,
            domain: nextDomain,
            additionalInstruction: nextInstruction,
            outputLanguage: nextLang
          }
        });
      } catch {
        // Service là tùy chọn; khi offline extension vẫn hoạt động độc lập.
      } finally {
        globalThis.clearTimeout(timeout);
      }
    };
    void poll();
    const interval = globalThis.setInterval(() => void poll(), 4000);
    return () => { active = false; globalThis.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!availability) return;
    const timer = globalThis.setInterval(() => setClock(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, [availability]);

  useEffect(() => {
    const listener = (message: unknown) => {
      const payload = message as { type?: string; failure?: TransientFailure };
      if (payload.type !== 'LPROMPT_TRANSIENT_FAILURE' || !payload.failure) return;
      setAvailability((previous) => {
        const next = recordTransientFailure(previous, payload.failure!);
        void chrome.storage.local.set({ [STORAGE_KEYS.availability]: next });
        setStatus('Gemini đang quá tải. Prompt vẫn được giữ nguyên; LPrompt đã bật thời gian chờ an toàn.');
        return next;
      });
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const cooldownSeconds = availability ? Math.max(0, Math.ceil((availability.retryAt - clock) / 1000)) : 0;

  const registerFailure = (failure: TransientFailure) => {
    setAvailability((previous) => {
      const next = recordTransientFailure(previous, failure);
      void chrome.storage.local.set({ [STORAGE_KEYS.availability]: next });
      return next;
    });
    setStatus('Gemini đang quá tải. Prompt vẫn được giữ nguyên; hãy chờ trước khi thử lại.');
  };

  const clearFailure = () => {
    setAvailability(null);
    void chrome.storage.local.remove(STORAGE_KEYS.availability);
  };

  const visiblePrompt = compiled?.prompt ?? '';
  const evaluation = useMemo(
    () => evaluatePromptLocally(visiblePrompt || source, domain),
    [visiblePrompt, source, domain]
  );
  const promptIssues = useMemo(() => inspectPromptLocally(visiblePrompt || source), [visiblePrompt, source]);

  const saveDraft = (patch: Partial<StoredDraft>) => {
    const draft = { source, domain, additionalInstruction, outputLanguage, ...patch };
    void chrome.storage.local.set({ [STORAGE_KEYS.draft]: draft }).catch(() => {
      setStatus('Không lưu được draft cục bộ; nội dung hiện tại vẫn còn trong panel.');
    });
  };

  const compile = (language: OutputLanguage = outputLanguage): FrameworkCompileResult | null => {
    try {
      const result = compilePromptFramework(source, 'STANDARD', { domain, additionalInstruction, outputLanguage: language });
      setCompiled(result);
      saveDraft({ outputLanguage: language });
      setStatus('Đã biên dịch bằng bộ chuẩn LPrompt. Hãy kiểm tra trước khi chèn.');
      return result;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể biên dịch prompt.');
      return null;
    }
  };

  const compileConstruction = (): ConstructionPromptResult | null => {
    try {
      const result = compileConstructionPrompt({
        context: constructionContext,
        dialogue: constructionDialogue,
        outputType: constructionOutputType,
        aspectRatio: constructionAspectRatio,
        durationSeconds: constructionOutputType === 'video' ? constructionDuration : undefined,
        referenceAssets: constructionReferences,
        referenceAssetCount: constructionReferenceFiles.length,
        additionalRequirements: constructionAdditional,
        crewPreset: constructionCrewPreset
      });
      setConstructionCompiled(result);
      saveConstructionDraft({});
      setStatus('Đã biên dịch prompt thi công công trình.');
      return result;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể biên dịch prompt thi công.');
      return null;
    }
  };

  const changeOutputLanguage = (language: OutputLanguage) => {
    setOutputLanguage(language);
    saveDraft({ outputLanguage: language });
    if (compiled) compile(language);
  };

  const insert = async () => {
    if (cooldownSeconds > 0) {
      setStatus(`Đang trong thời gian chờ an toàn. Có thể thử lại sau ${cooldownSeconds} giây.`);
      return;
    }
    const result = compiled ?? compile();
    if (!result) return;
    setBusy(true);
    try {
      const reply = await sendToGemini({ type: 'LPROMPT_INSERT', prompt: result.prompt });
      if (!reply.ok) throw new Error(reply.error || 'Không thể chèn prompt.');
      setStatus('Đã chèn vào Gemini. Extension không tự gửi—hãy đọc lại rồi tự bấm Gửi.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể chèn prompt vào Gemini.');
    } finally {
      setBusy(false);
    }
  };

  const insertConstruction = async () => {
    if (cooldownSeconds > 0) {
      setStatus(`Đang trong thời gian chờ an toàn. Có thể thử lại sau ${cooldownSeconds} giây.`);
      return;
    }
    const result = constructionCompiled ?? compileConstruction();
    if (!result) return;
    setBusy(true);
    try {
      const attachments = await Promise.all(constructionReferenceFiles.map(fileToAttachment));
      const reply = await sendToGemini({ type: 'LPROMPT_INSERT', prompt: result.prompt, attachments });
      if (!reply.ok) throw new Error(reply.error || 'Không thể chèn prompt.');
      setStatus(reply.warning || `Đã chèn prompt${attachments.length > 0 ? ` và ${attachments.length} ảnh tham chiếu` : ''} vào Gemini. Hãy tự bấm Gửi.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể chèn prompt vào Gemini.');
    } finally {
      setBusy(false);
    }
  };

  const copyConstructionPrompt = async () => {
    const result = constructionCompiled ?? compileConstruction();
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setConstructionCopied(true);
      setTimeout(() => setConstructionCopied(false), 1500);
      setStatus('Đã sao chép prompt thi công.');
    } catch {
      setStatus('Trình duyệt từ chối clipboard. Hãy chọn và sao chép thủ công.');
    }
  };

  const loadConstructionSample = () => {
    setConstructionContext(SAMPLE_CONSTRUCTION_CONTEXT);
    setConstructionDialogue(SAMPLE_CONSTRUCTION_DIALOGUE);
    setConstructionCrewPreset('ktht');
    setConstructionReferences('');
    setConstructionReferenceFiles([]);
    setConstructionCompiled(null);
    saveConstructionDraft({
      context: SAMPLE_CONSTRUCTION_CONTEXT,
      dialogue: SAMPLE_CONSTRUCTION_DIALOGUE,
      participantCount: 1,
      crewPreset: 'ktht',
      referenceAssets: ''
    });
    setStatus('Đã nạp mẫu bối cảnh và lời thoại thi công.');
  };

  const resetConstruction = () => {
    setConstructionContext('');
    setConstructionDialogue('');
    setConstructionCrewPreset('ktht');
    setConstructionReferences('');
    setConstructionReferenceFiles([]);
    setConstructionAdditional('');
    setConstructionCompiled(null);
    saveConstructionDraft({
      context: '',
      dialogue: '',
      participantCount: 1,
      crewPreset: 'ktht',
      referenceAssets: '',
      additionalRequirements: ''
    });
    setStatus('Đã xóa dữ liệu cảnh thi công.');
  };

  const importResponse = async () => {
    setBusy(true);
    try {
      const reply = await sendToGemini({ type: 'LPROMPT_IMPORT_RESPONSE' });
      if (reply.transientFailure) {
        registerFailure(reply.transientFailure);
        return;
      }
      if (!reply.ok || !reply.text) throw new Error(reply.error || 'Không có phản hồi để nhập.');
      setResponse(reply.text);
      await withTimeout(
        chrome.storage.local.set({ [STORAGE_KEYS.lastResponse]: reply.text }),
        3000,
        'Đã nhập phản hồi nhưng lưu cục bộ bị timeout.'
      );
      setStatus('Đã nhập phản hồi Gemini theo yêu cầu của bạn.');
      clearFailure();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể nhập phản hồi Gemini.');
    } finally {
      setBusy(false);
    }
  };

  const saveSnapshot = async () => {
    let promptToSave = '';
    let frameworkLabel = '';
    let outputLang: OutputLanguage | undefined = outputLanguage;

    if (activeTab === 'construction') {
      const result = constructionCompiled ?? compileConstruction();
      if (!result) return;
      promptToSave = result.prompt;
      frameworkLabel = `Thi công (${result.outputType === 'image' ? 'Ảnh' : 'Video'})`;
      outputLang = 'vi';
    } else {
      const result = compiled ?? compile();
      if (!result) return;
      promptToSave = result.prompt;
      frameworkLabel = result.framework;
      outputLang = result.outputLanguage;
    }

    const next: Snapshot[] = [{
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      framework: frameworkLabel,
      outputLanguage: outputLang,
      prompt: promptToSave,
      response: response || undefined
    }, ...snapshots].slice(0, 10);
    setSnapshots(next);
    try {
      await withTimeout(
        chrome.storage.local.set({ [STORAGE_KEYS.snapshots]: next }),
        3000,
        'Lưu snapshot bị timeout.'
      );
      setStatus('Đã lưu snapshot cục bộ trong trình duyệt.');
    } catch (error) {
      setSnapshots(snapshots);
      setStatus(error instanceof Error ? error.message : 'Không thể lưu snapshot.');
    }
  };

  const copyPrompt = async () => {
    const result = compiled ?? compile();
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setStatus('Đã sao chép prompt.');
    } catch {
      setStatus('Trình duyệt từ chối clipboard. Hãy chọn và sao chép thủ công.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 space-y-3">
      <header className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950 to-slate-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <div>
              <h1 className="text-sm font-bold">LPrompt for Gemini</h1>
              <p className="text-[11px] text-slate-400">Local compiler · không cần API key</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void chrome.tabs.create({ url: 'https://gemini.google.com/app' }).catch(() => setStatus('Không thể mở tab Gemini.'))}
            className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
            title="Mở Gemini"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Workspace Tabs: Tiêu chuẩn vs Thi công */}
      <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => switchTab('standard')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'standard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Tiêu chuẩn</span>
        </button>
        <button
          type="button"
          onClick={() => switchTab('construction')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'construction'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <HardHat className="h-3.5 w-3.5" />
          <span>Thi công</span>
          <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] text-amber-300 font-bold uppercase">Mới</span>
        </button>
      </div>

      {availability && (
        <section role="alert" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2 text-[11px] text-amber-100">
          <div className="font-bold">Gemini đang tạm thời quá tải</div>
          <p className="leading-relaxed">LPrompt đã giữ nguyên prompt và không tự gửi lại. Lần phát hiện liên tiếp: {availability.consecutiveFailures}.</p>
          <div className="flex items-center justify-between gap-2">
            <span>{cooldownSeconds > 0 ? `Thử lại sau ${cooldownSeconds} giây` : 'Đã có thể chèn lại prompt thủ công'}</span>
            <button
              type="button"
              disabled={busy || cooldownSeconds > 0}
              onClick={() => void (activeTab === 'construction' ? insertConstruction() : insert())}
              className="rounded-lg bg-amber-500 px-2.5 py-1.5 font-bold text-slate-950 disabled:opacity-50"
            >
              {cooldownSeconds > 0 ? 'Đang chờ' : 'Chèn lại'}
            </button>
          </div>
        </section>
      )}

      {/* TAB 1: TIÊU CHUẨN */}
      {activeTab === 'standard' && (
        <>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 space-y-3">
            <div>
              <label className="text-[11px] text-slate-400">Domain
                <select value={domain} onChange={(event) => { const value = event.target.value as PromptDomain; setDomain(value); setCompiled(null); saveDraft({ domain: value }); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white">
                  {DOMAINS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-[11px] font-semibold text-slate-300">Yêu cầu gốc
              <textarea value={source} onChange={(event) => { setSource(event.target.value); setCompiled(null); saveDraft({ source: event.target.value }); }} className="mt-1 min-h-32 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-relaxed outline-none focus:border-indigo-500" placeholder="Mô tả điều bạn muốn Gemini thực hiện…" />
            </label>
            <label className="block text-[11px] text-slate-400">Chỉ thị bổ sung (tuỳ chọn)
              <input value={additionalInstruction} onChange={(event) => { setAdditionalInstruction(event.target.value); setCompiled(null); saveDraft({ additionalInstruction: event.target.value }); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs outline-none focus:border-indigo-500" placeholder="Ví dụ: trả lời bằng tiếng Việt, dưới 500 từ" />
            </label>
            <button type="button" onClick={() => compile()} className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold hover:bg-indigo-500">Biên dịch prompt cục bộ</button>
          </section>

          {compiled && (
            <section className="rounded-2xl border border-violet-500/30 bg-slate-900 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-violet-300">{compiled.framework}</span>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5" aria-label="Ngôn ngữ prompt đầu ra">
                    {([['vi', 'VIE'], ['en', 'ENG']] as const).map(([language, label]) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => changeOutputLanguage(language)}
                        className={`rounded-md px-2 py-1 text-[10px] font-bold ${outputLanguage === language ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        aria-pressed={outputLanguage === language}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-emerald-300">{evaluation.total_score}/100</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">{compiled.reason}</p>
              {promptIssues.length > 0 && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-100"><strong>{promptIssues.length} điểm cần xem lại:</strong> {promptIssues.map((issue) => issue.title).join('; ')}.</div>}
              <textarea readOnly value={compiled.prompt} className="min-h-48 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200" />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => void copyPrompt()} className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-xs hover:bg-slate-800">{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Đã chép' : 'Sao chép'}</button>
                <button type="button" disabled={busy || cooldownSeconds > 0} onClick={() => void insert()} className="flex items-center justify-center gap-1 rounded-lg bg-violet-600 py-2 text-xs font-bold hover:bg-violet-500 disabled:opacity-50"><Send className="h-3.5 w-3.5" />{cooldownSeconds > 0 ? `Chờ ${cooldownSeconds}s` : 'Chèn vào Gemini'}</button>
              </div>
            </section>
          )}
        </>
      )}

      {/* TAB 2: THI CÔNG */}
      {activeTab === 'construction' && (
        <div className="space-y-3">
          <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5">
                  <HardHat className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white">Prompt thi công công trình</h2>
                  <p className="text-[10px] text-slate-300">Compiler ảnh & video hiện trường, PPE, nghiệm thu</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={loadConstructionSample}
                  className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300 hover:bg-amber-500/20"
                  title="Nạp mẫu bối cảnh chuẩn"
                >
                  Mẫu thử
                </button>
                <button
                  type="button"
                  onClick={resetConstruction}
                  className="rounded border border-slate-700 p-1 text-slate-400 hover:text-rose-300 hover:bg-slate-800"
                  title="Xóa trắng"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 space-y-3">
            {/* Phân loại: Ảnh vs Video */}
            <div className={`grid gap-2 ${constructionOutputType === 'video' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                type="button"
                onClick={() => {
                  setConstructionOutputType('image');
                  setConstructionCompiled(null);
                  saveConstructionDraft({ outputType: 'image' });
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                  constructionOutputType === 'image'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Prompt Ảnh
              </button>
              <button
                type="button"
                onClick={() => {
                  setConstructionOutputType('video');
                  setConstructionCompiled(null);
                  saveConstructionDraft({ outputType: 'video' });
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                  constructionOutputType === 'video'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Film className="h-3.5 w-3.5" /> Prompt Video
              </button>
            </div>

            <label className="block text-[11px] font-semibold text-slate-300">
              Bối cảnh thi công <span className="text-rose-400">*</span>
              <textarea
                value={constructionContext}
                onChange={(event) => {
                  setConstructionContext(event.target.value);
                  setConstructionCompiled(null);
                  saveConstructionDraft({ context: event.target.value });
                }}
                className="mt-1 min-h-24 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs leading-relaxed outline-none focus:border-amber-500"
                placeholder="Ai đang ở đâu, công tác gì đã hoặc đang thực hiện, khu vực nào cần kiểm tra?"
              />
            </label>

            <label className="block text-[11px] font-semibold text-slate-300">
              Lời thoại nhân vật (tuỳ chọn)
              <textarea
                value={constructionDialogue}
                onChange={(event) => {
                  setConstructionDialogue(event.target.value);
                  setConstructionCompiled(null);
                  saveConstructionDraft({ dialogue: event.target.value });
                }}
                className="mt-1 min-h-16 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-xs leading-relaxed outline-none focus:border-amber-500"
                placeholder="Lời nhân vật nói; compiler sẽ định hướng cử chỉ/hành động tự nhiên và không đưa chữ lên ảnh/video."
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] text-slate-400">
                Tỷ lệ
                <select
                  value={constructionAspectRatio}
                  onChange={(event) => {
                    const val = event.target.value as typeof constructionAspectRatio;
                    setConstructionAspectRatio(val);
                    setConstructionCompiled(null);
                    saveConstructionDraft({ aspectRatio: val });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                >
                  <option value="9:16">9:16 (Dọc)</option>
                  <option value="16:9">16:9 (Ngang)</option>
                  <option value="1:1">1:1 (Vuông)</option>
                </select>
              </label>
              {constructionOutputType === 'video' && (
                <label className="text-[11px] text-slate-400">
                  Thời lượng video (3-30s)
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={constructionDuration}
                    onChange={(event) => {
                      const val = Number(event.target.value);
                      setConstructionDuration(val);
                      setConstructionCompiled(null);
                      saveConstructionDraft({ durationSeconds: val });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                  />
                </label>
              )}
            </div>

            <label className="block text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-amber-300" />Số người trong cảnh</span>
              <select
                value={constructionCrewPreset}
                onChange={(event) => {
                  const value = event.target.value as ConstructionCrewPreset;
                  setConstructionCrewPreset(value);
                  setConstructionCompiled(null);
                  saveConstructionDraft({ crewPreset: value });
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              >
                {CONSTRUCTION_CREW_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>

            <div className="space-y-2">
              <span className="block text-[11px] text-slate-400">Ảnh tham chiếu thật</span>
              <label
                onDragEnter={(event) => { event.preventDefault(); setIsConstructionReferenceDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsConstructionReferenceDragActive(true); }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsConstructionReferenceDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsConstructionReferenceDragActive(false);
                  addConstructionReferenceFiles(event.dataTransfer.files);
                }}
                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed px-2 py-3 text-[11px] transition-colors ${isConstructionReferenceDragActive ? 'border-amber-400 bg-amber-500/15 text-amber-100' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-amber-500/60 hover:text-amber-200'}`}
              >
                <Upload className="h-3.5 w-3.5" /> Kéo thả ảnh vào đây hoặc bấm để chọn · tối đa {MAX_REFERENCE_FILES} ảnh, mỗi ảnh ≤ 5 MB
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(event) => { addConstructionReferenceFiles(event.target.files); event.currentTarget.value = ''; }} />
              </label>
              {constructionReferencePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {constructionReferencePreviews.map(({ file, url }) => (
                    <div key={`${file.name}-${file.lastModified}`} className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                      <img src={url} alt={file.name} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const next = constructionReferenceFiles.filter((item) => item !== file);
                          updateConstructionReferenceFiles(next);
                        }}
                        className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white"
                        aria-label={`Xóa ${file.name}`}
                      ><X className="h-3 w-3" /></button>
                      <div className="truncate px-1.5 py-1 text-[9px] text-slate-400" title={file.name}>{file.name}</div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-500">Ảnh chỉ được giữ trong phiên side panel và sẽ được đính kèm khi bấm “Chèn vào Gemini”.</p>
            </div>

            <label className="block text-[11px] text-slate-400">
              Yêu cầu bổ sung (tuỳ chọn)
              <input
                value={constructionAdditional}
                onChange={(event) => {
                  setConstructionAdditional(event.target.value);
                  setConstructionCompiled(null);
                  saveConstructionDraft({ additionalRequirements: event.target.value });
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs outline-none focus:border-amber-500"
                placeholder="Ví dụ: thể hiện hố ga, ống HDPE theo đúng ảnh hiện trường"
              />
            </label>

            {constructionRequirementCheck.issues.map((issue) => (
              <div key={issue.code} className={`rounded-lg border p-2 text-[10px] ${issue.severity === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
                {issue.message}
              </div>
            ))}

            <button
              type="button"
              disabled={!constructionContext.trim() || constructionRequirementCheck.issues.some((issue) => issue.severity === 'error')}
              onClick={() => compileConstruction()}
              className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-950/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Biên dịch prompt thi công
            </button>
          </section>

          {constructionCompiled && (
            <section className="rounded-2xl border border-amber-500/30 bg-slate-900 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-amber-300">
                  {constructionCompiled.outputType === 'image' ? 'ẢNH THI CÔNG' : 'VIDEO THI CÔNG'}
                </span>
                <span className="font-mono text-slate-300">
                  {constructionAspectRatio} {constructionCompiled.outputType === 'video' ? `· ${constructionDuration}s` : ''}
                </span>
              </div>

              {constructionCompiled.warnings.map((warning) => (
                <div key={warning} className="flex items-start gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}

              <textarea
                readOnly
                value={constructionCompiled.prompt}
                className="min-h-48 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void copyConstructionPrompt()}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-xs hover:bg-slate-800"
                >
                  {constructionCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {constructionCopied ? 'Đã chép' : 'Sao chép'}
                </button>
                <button
                  type="button"
                  disabled={busy || cooldownSeconds > 0}
                  onClick={() => void insertConstruction()}
                  className="flex items-center justify-center gap-1 rounded-lg bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {cooldownSeconds > 0 ? `Chờ ${cooldownSeconds}s` : 'Chèn vào Gemini'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSource(constructionCompiled.prompt);
                  setDomain(constructionOutputType === 'image' ? 'image' : 'video');
                  switchTab('standard');
                  setStatus('Đã nạp prompt thi công sang tab Tiêu chuẩn.');
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-400" />
                <span>Chuyển sang tab Tiêu chuẩn</span>
              </button>
            </section>
          )}
        </div>
      )}

      {/* VÙNG NHẬP PHẢN HỒI VÀ SNAPSHOT */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold">Phản hồi từ Gemini</h2>
          <button type="button" disabled={busy} onClick={() => void importResponse()} className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-300 disabled:opacity-50">
            <ClipboardPaste className="h-3.5 w-3.5" />Nhập phản hồi
          </button>
        </div>
        <textarea value={response} onChange={(event) => setResponse(event.target.value)} className="min-h-24 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-relaxed" placeholder="Chỉ được đọc khi bạn bấm Nhập phản hồi; ưu tiên phần văn bản đang chọn." />
        <button type="button" onClick={() => void saveSnapshot()} className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-[11px] hover:bg-slate-800">
          <FileClock className="h-3.5 w-3.5" />Lưu snapshot prompt + phản hồi
        </button>
        {snapshots.length > 0 && <p className="text-[10px] text-slate-500">Đang lưu {snapshots.length}/10 snapshot gần nhất trên thiết bị.</p>}
      </section>

      <aside className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-100">
        <strong>Quyền riêng tư:</strong> LPrompt chỉ chạy trên trang Gemini, không lấy cookie, không tự gửi và chỉ đọc phản hồi khi bạn bấm nút nhập.
      </aside>
      <p role="status" aria-live="polite" className="sticky bottom-2 rounded-xl border border-slate-700 bg-slate-950/95 p-2 text-[11px] text-slate-300 shadow-xl">{status}</p>
    </main>
  );
}
