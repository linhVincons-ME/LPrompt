import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Clipboard, Film, HardHat, Image as ImageIcon, Play, RotateCcw, Upload, Users, X } from 'lucide-react';
import {
  compileConstructionPrompt,
  CONSTRUCTION_CREW_OPTIONS,
  inspectConstructionAdditionalRequirements,
  type ConstructionCrewPreset,
  type ConstructionOutputType
} from '../services/constructionPromptCompiler';

interface ConstructionPromptViewProps {
  onUsePrompt: (prompt: string, outputType: ConstructionOutputType) => void;
  onOpenPlayground: (prompt: string) => void;
}

const SAMPLE_CONTEXT = 'KTHT đứng tại tuyến cáp điện hạ tầng đã thi công, phía sau là khu vực cần nghiệm thu.';
const SAMPLE_DIALOGUE = 'Hướng dẫn nghiệm thu dây cáp điện hạ tầng, các bước triển khai sẽ diễn ra như sau.';
const MAX_REFERENCE_FILES = 4;
const MAX_REFERENCE_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_REFERENCE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function mergeReferenceFiles(current: File[], incoming: File[]): File[] {
  const files = new Map(current.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file]));
  incoming.forEach((file) => files.set(`${file.name}-${file.size}-${file.lastModified}`, file));
  return [...files.values()];
}

export function ConstructionPromptView({ onUsePrompt, onOpenPlayground }: ConstructionPromptViewProps) {
  const [context, setContext] = useState(SAMPLE_CONTEXT);
  const [dialogue, setDialogue] = useState(SAMPLE_DIALOGUE);
  const [outputType, setOutputType] = useState<ConstructionOutputType>('image');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [durationSeconds, setDurationSeconds] = useState(8);
  const [crewPreset, setCrewPreset] = useState<ConstructionCrewPreset>('ktht');
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isReferenceDragActive, setIsReferenceDragActive] = useState(false);
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [compiledPrompt, setCompiledPrompt] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const referencePreviews = useMemo(() => referenceFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [referenceFiles]);
  useEffect(() => () => referencePreviews.forEach(({ url }) => URL.revokeObjectURL(url)), [referencePreviews]);
  const requirementCheck = useMemo(() => inspectConstructionAdditionalRequirements(additionalRequirements, {
    outputType,
    aspectRatio,
    crewPreset
  }), [additionalRequirements, outputType, aspectRatio, crewPreset]);
  const canCompile = context.trim().length > 0 && !requirementCheck.issues.some((issue) => issue.severity === 'error');

  const addReferenceFiles = (files: FileList | File[] | null) => {
    const incoming = [...(files ?? [])];
    const selected = mergeReferenceFiles(referenceFiles, incoming);
    const invalid = incoming.find((file) => !ALLOWED_REFERENCE_TYPES.has(file.type) || file.size > MAX_REFERENCE_FILE_SIZE);
    if (selected.length > MAX_REFERENCE_FILES) {
      setError(`Chỉ được chọn tối đa ${MAX_REFERENCE_FILES} ảnh tham chiếu.`);
      return;
    }
    if (invalid) {
      setError(`File ${invalid.name} không phải ảnh hợp lệ hoặc lớn hơn 5 MB.`);
      return;
    }
    setReferenceFiles(selected);
    setCompiledPrompt('');
    setError('');
  };

  const compile = () => {
    try {
      const result = compileConstructionPrompt({
        context,
        dialogue,
        outputType,
        aspectRatio,
        durationSeconds: outputType === 'video' ? durationSeconds : undefined,
        referenceAssets: referenceFiles.map((file) => file.name).join(', '),
        referenceAssetCount: referenceFiles.length,
        additionalRequirements,
        crewPreset
      });
      setCompiledPrompt(result.prompt);
      setWarnings(result.warnings);
      setError('');
      setCopied(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể biên dịch prompt thi công.');
    }
  };

  const copy = async () => {
    if (!compiledPrompt) return;
    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Không thể truy cập clipboard; hãy chọn và sao chép thủ công.');
    }
  };

  const reset = () => {
    setContext('');
    setDialogue('');
    setReferenceFiles([]);
    setAdditionalRequirements('');
    setCompiledPrompt('');
    setWarnings([]);
    setError('');
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <HardHat className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Prompt thi công công trình</h2>
              <p className="text-xs text-slate-300">Compiler riêng cho ảnh và video hướng dẫn hiện trường, PPE, nghiệm thu và an toàn thi công.</p>
            </div>
          </div>
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Compiler chuyên ngành</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Thông tin cảnh thi công</h3>
            <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-300">
              <RotateCcw className="h-3.5 w-3.5" /> Xóa
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([['image', 'Prompt ảnh', ImageIcon], ['video', 'Prompt video', Film]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setOutputType(value); setCompiledPrompt(''); }}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${outputType === value ? 'border-amber-500 bg-amber-500/15 text-amber-200' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-slate-300">Bối cảnh <span className="text-rose-400">*</span>
            <textarea value={context} onChange={(event) => { setContext(event.target.value); setCompiledPrompt(''); }} className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-relaxed outline-none focus:border-amber-500" placeholder="Ai đang ở đâu, công tác gì đã hoặc đang thực hiện, khu vực nào cần kiểm tra?" />
          </label>

          <label className="block text-xs font-semibold text-slate-300">Lời thoại
            <textarea value={dialogue} onChange={(event) => { setDialogue(event.target.value); setCompiledPrompt(''); }} className="mt-1.5 min-h-20 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-relaxed outline-none focus:border-amber-500" placeholder="Lời nhân vật nói; compiler sẽ chuyển thành hành động và không đưa thành chữ trên ảnh." />
          </label>

          <div className={`grid grid-cols-1 gap-3 ${outputType === 'video' ? 'sm:grid-cols-2' : ''}`}>
            <label className="text-xs font-semibold text-slate-300">Tỷ lệ
              <select value={aspectRatio} onChange={(event) => { setAspectRatio(event.target.value as typeof aspectRatio); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
                <option value="9:16">9:16 dọc</option>
                <option value="16:9">16:9 ngang</option>
                <option value="1:1">1:1 vuông</option>
              </select>
            </label>
            {outputType === 'video' && (
              <label className="text-xs font-semibold text-slate-300">
                Thời lượng video
                <input type="number" min={3} max={30} value={durationSeconds} onChange={(event) => { setDurationSeconds(Number(event.target.value)); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs" placeholder="8s" />
              </label>
            )}
          </div>

          <label className="block text-xs font-semibold text-slate-300"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-amber-300" />Số người trong cảnh</span>
            <select value={crewPreset} onChange={(event) => { setCrewPreset(event.target.value as ConstructionCrewPreset); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
              {CONSTRUCTION_CREW_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-300">Ảnh tham chiếu thật</span>
            <label
              onDragEnter={(event) => { event.preventDefault(); setIsReferenceDragActive(true); }}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setIsReferenceDragActive(true); }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsReferenceDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsReferenceDragActive(false);
                addReferenceFiles(event.dataTransfer.files);
              }}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-4 text-xs transition-colors ${isReferenceDragActive ? 'border-amber-400 bg-amber-500/15 text-amber-100' : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-amber-500/60 hover:text-amber-200'}`}
            >
              <Upload className="h-4 w-4" /> Kéo thả ảnh vào đây hoặc bấm để chọn · tối đa {MAX_REFERENCE_FILES} ảnh PNG/JPG/WebP, mỗi ảnh ≤ 5 MB
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(event) => { addReferenceFiles(event.target.files); event.currentTarget.value = ''; }} />
            </label>
            {referencePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {referencePreviews.map(({ file, url }) => (
                  <div key={`${file.name}-${file.lastModified}`} className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                    <img src={url} alt={file.name} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => { setReferenceFiles((current) => current.filter((item) => item !== file)); setCompiledPrompt(''); }} className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white" aria-label={`Xóa ${file.name}`}><X className="h-3 w-3" /></button>
                    <div className="truncate px-1.5 py-1 text-[10px] text-slate-400" title={file.name}>{file.name}</div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500">Web app dùng ảnh để kiểm tra và quản lý tham chiếu tại phiên hiện tại. Muốn đính kèm trực tiếp vào Gemini, hãy chọn ảnh trong extension.</p>
          </div>

          <label className="block text-xs font-semibold text-slate-300">Yêu cầu bổ sung
            <input value={additionalRequirements} onChange={(event) => { setAdditionalRequirements(event.target.value); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs outline-none focus:border-amber-500" placeholder="Ví dụ: thể hiện hố ga, ống HDPE theo đúng ảnh hiện trường" />
          </label>

          {requirementCheck.issues.map((issue) => (
            <div key={issue.code} className={`rounded-lg border p-2.5 text-[11px] ${issue.severity === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
              {issue.message}
            </div>
          ))}

          {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}

          <button type="button" disabled={!canCompile} onClick={compile} className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 text-xs font-bold text-white shadow-lg shadow-amber-950/30 disabled:cursor-not-allowed disabled:opacity-40">
            Biên dịch prompt thi công
          </button>
        </section>

        <section className="flex min-h-[600px] flex-col gap-3 rounded-2xl border border-amber-500/25 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Prompt hoàn chỉnh</h3>
            <span className="text-[11px] font-semibold text-amber-300">{outputType === 'image' ? 'IMAGE' : 'VIDEO'} · {aspectRatio}</span>
          </div>

          {compiledPrompt ? (
            <>
              {warnings.map((warning) => (
                <div key={warning} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {warning}
                </div>
              ))}
              <div className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">{compiledPrompt}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onUsePrompt(compiledPrompt, outputType)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Dùng prompt này</button>
                <button type="button" onClick={() => onOpenPlayground(compiledPrompt)} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"><Play className="h-3.5 w-3.5" /> Xem trước</button>
                <button type="button" onClick={() => void copy()} className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? 'Đã sao chép' : 'Sao chép'}</button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-8 text-center">
              <HardHat className="h-10 w-10 text-slate-700" />
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">Nhập bối cảnh và lời thoại, sau đó biên dịch. Kết quả là prompt cuối dùng trực tiếp cho công cụ tạo ảnh hoặc video.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
