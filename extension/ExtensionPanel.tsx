import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardPaste, Copy, ExternalLink, FileClock, Send, Sparkles } from 'lucide-react';
import type { PromptDomain } from '../src/types';
import { evaluatePromptLocally } from '../src/services/evaluator';
import {
  compilePromptFramework,
  FRAMEWORK_OPTIONS,
  type FrameworkCompileResult,
  type OutputLanguage,
  type PromptFramework
} from '../src/services/frameworkCompiler';
import { recordTransientFailure, type AvailabilityState, type TransientFailure } from './availability';
import { inspectPromptLocally } from '../src/services/promptInspector';

interface StoredDraft {
  source: string;
  framework: PromptFramework;
  domain: PromptDomain;
  additionalInstruction: string;
  outputLanguage: OutputLanguage;
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
}

const STORAGE_KEYS = {
  draft: 'lpromptDraft',
  snapshots: 'lpromptSnapshots',
  lastResponse: 'lpromptLastResponse',
  availability: 'lpromptAvailability'
} as const;

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
  const [source, setSource] = useState('');
  const [framework, setFramework] = useState<PromptFramework>('AUTO');
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
  const [lastBridgeDraftId, setLastBridgeDraftId] = useState('');

  useEffect(() => {
    void chrome.storage.local.get([STORAGE_KEYS.draft, STORAGE_KEYS.snapshots, STORAGE_KEYS.lastResponse, STORAGE_KEYS.availability]).then((stored) => {
      const draft = stored[STORAGE_KEYS.draft] as StoredDraft | undefined;
      if (draft) {
        setSource(draft.source ?? '');
        setFramework(draft.framework ?? 'AUTO');
        setDomain(draft.domain ?? 'research');
        setAdditionalInstruction(draft.additionalInstruction ?? '');
        setOutputLanguage(draft.outputLanguage ?? 'vi');
      }
      setSnapshots((stored[STORAGE_KEYS.snapshots] as Snapshot[] | undefined) ?? []);
      setResponse((stored[STORAGE_KEYS.lastResponse] as string | undefined) ?? '');
      const savedAvailability = stored[STORAGE_KEYS.availability] as AvailabilityState | undefined;
      if (savedAvailability?.retryAt && savedAvailability?.failure) setAvailability(savedAvailability);
    }).catch(() => setStatus('Không đọc được dữ liệu cục bộ; bạn vẫn có thể tiếp tục soạn prompt.'));
  }, []);

  useEffect(() => {
    const listener = (message: unknown) => {
      const payload = message as { type?: string; source?: string };
      if (payload.type !== 'LPROMPT_DRAFT_UPDATED' || !payload.source) return;
      setSource(payload.source);
      setCompiled(null);
      setStatus('Đã nhận phần văn bản được chọn từ menu chuột phải.');
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), 2500);
      try {
        const response = await fetch('http://127.0.0.1:8484/api/extension/draft', { signal: controller.signal, cache: 'no-store' });
        if (!active || response.status === 204 || !response.ok) return;
        const payload = await response.json() as { data?: { id?: string; source?: string } };
        if (!payload.data?.id || !payload.data.source || payload.data.id === lastBridgeDraftId) return;
        setLastBridgeDraftId(payload.data.id);
        setSource(payload.data.source);
        setCompiled(null);
        setStatus('Đã nhận prompt từ web app cục bộ.');
        await chrome.storage.local.set({ [STORAGE_KEYS.draft]: { source: payload.data.source, framework, domain, additionalInstruction, outputLanguage } });
      } catch {
        // Service là tùy chọn; khi offline extension vẫn hoạt động độc lập.
      } finally {
        globalThis.clearTimeout(timeout);
      }
    };
    void poll();
    const interval = globalThis.setInterval(() => void poll(), 4000);
    return () => { active = false; globalThis.clearInterval(interval); };
  }, [lastBridgeDraftId, framework, domain, additionalInstruction, outputLanguage]);

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
    const draft = { source, framework, domain, additionalInstruction, outputLanguage, ...patch };
    void chrome.storage.local.set({ [STORAGE_KEYS.draft]: draft }).catch(() => {
      setStatus('Không lưu được draft cục bộ; nội dung hiện tại vẫn còn trong panel.');
    });
  };

  const compile = (language: OutputLanguage = outputLanguage): FrameworkCompileResult | null => {
    try {
      const result = compilePromptFramework(source, framework, { domain, additionalInstruction, outputLanguage: language });
      setCompiled(result);
      saveDraft({ outputLanguage: language });
      setStatus(`Đã biên dịch bằng ${result.framework}. Hãy kiểm tra trước khi chèn.`);
      return result;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể biên dịch prompt.');
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
    const result = compiled ?? compile();
    if (!result) return;
    const next: Snapshot[] = [{
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      framework: result.framework,
      outputLanguage: result.outputLanguage,
      prompt: result.prompt,
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
          <button type="button" onClick={() => void chrome.tabs.create({ url: 'https://gemini.google.com/app' }).catch(() => setStatus('Không thể mở tab Gemini.'))} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800" title="Mở Gemini">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </header>

      {availability && (
        <section role="alert" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2 text-[11px] text-amber-100">
          <div className="font-bold">Gemini đang tạm thời quá tải</div>
          <p className="leading-relaxed">LPrompt đã giữ nguyên prompt và không tự gửi lại. Lần phát hiện liên tiếp: {availability.consecutiveFailures}.</p>
          <div className="flex items-center justify-between gap-2">
            <span>{cooldownSeconds > 0 ? `Thử lại sau ${cooldownSeconds} giây` : 'Đã có thể chèn lại prompt thủ công'}</span>
            <button type="button" disabled={busy || cooldownSeconds > 0} onClick={() => void insert()} className="rounded-lg bg-amber-500 px-2.5 py-1.5 font-bold text-slate-950 disabled:opacity-50">
              {cooldownSeconds > 0 ? 'Đang chờ' : 'Chèn lại'}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-slate-400">Domain
            <select value={domain} onChange={(event) => { const value = event.target.value as PromptDomain; setDomain(value); setCompiled(null); saveDraft({ domain: value }); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white">
              {DOMAINS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-[11px] text-slate-400">Framework
            <select value={framework} onChange={(event) => { const value = event.target.value as PromptFramework; setFramework(value); setCompiled(null); saveDraft({ framework: value }); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-white">
              {FRAMEWORK_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
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
            <button type="button" onClick={() => void copyPrompt()} className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-xs hover:bg-slate-800">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Đã chép' : 'Sao chép'}</button>
            <button type="button" disabled={busy || cooldownSeconds > 0} onClick={() => void insert()} className="flex items-center justify-center gap-1 rounded-lg bg-violet-600 py-2 text-xs font-bold hover:bg-violet-500 disabled:opacity-50"><Send className="h-3.5 w-3.5" />{cooldownSeconds > 0 ? `Chờ ${cooldownSeconds}s` : 'Chèn vào Gemini'}</button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold">Phản hồi từ Gemini</h2>
          <button type="button" disabled={busy} onClick={() => void importResponse()} className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-300 disabled:opacity-50"><ClipboardPaste className="h-3.5 w-3.5" />Nhập phản hồi</button>
        </div>
        <textarea value={response} onChange={(event) => setResponse(event.target.value)} className="min-h-24 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-relaxed" placeholder="Chỉ được đọc khi bạn bấm Nhập phản hồi; ưu tiên phần văn bản đang chọn." />
        <button type="button" onClick={() => void saveSnapshot()} className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-700 py-2 text-[11px] hover:bg-slate-800"><FileClock className="h-3.5 w-3.5" />Lưu snapshot prompt + phản hồi</button>
        {snapshots.length > 0 && <p className="text-[10px] text-slate-500">Đang lưu {snapshots.length}/10 snapshot gần nhất trên thiết bị.</p>}
      </section>

      <aside className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-100">
        <strong>Quyền riêng tư:</strong> LPrompt chỉ chạy trên trang Gemini, không lấy cookie, không tự gửi và chỉ đọc phản hồi khi bạn bấm nút nhập.
      </aside>
      <p role="status" aria-live="polite" className="sticky bottom-2 rounded-xl border border-slate-700 bg-slate-950/95 p-2 text-[11px] text-slate-300 shadow-xl">{status}</p>
    </main>
  );
}
