import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Clipboard, Film, HardHat, Image as ImageIcon, Play, RotateCcw } from 'lucide-react';
import {
  compileConstructionPrompt,
  type ConstructionOutputType
} from '../services/constructionPromptCompiler';

interface ConstructionPromptViewProps {
  onUsePrompt: (prompt: string, outputType: ConstructionOutputType) => void;
  onOpenPlayground: (prompt: string) => void;
}

const SAMPLE_CONTEXT = 'KTHT đứng tại tuyến cáp điện hạ tầng đã thi công, phía sau là khu vực cần nghiệm thu.';
const SAMPLE_DIALOGUE = 'Hướng dẫn nghiệm thu dây cáp điện hạ tầng, các bước triển khai sẽ diễn ra như sau.';

export function ConstructionPromptView({ onUsePrompt, onOpenPlayground }: ConstructionPromptViewProps) {
  const [context, setContext] = useState(SAMPLE_CONTEXT);
  const [dialogue, setDialogue] = useState(SAMPLE_DIALOGUE);
  const [outputType, setOutputType] = useState<ConstructionOutputType>('image');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [durationSeconds, setDurationSeconds] = useState(8);
  const [referenceAssets, setReferenceAssets] = useState('AoCBCNDLogo.JPG, Mu_KTHT.PNG, reference_sheet.PNG');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [compiledPrompt, setCompiledPrompt] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const canCompile = useMemo(() => context.trim().length > 0, [context]);

  const compile = () => {
    try {
      const result = compileConstructionPrompt({
        context,
        dialogue,
        outputType,
        aspectRatio,
        durationSeconds,
        referenceAssets,
        additionalRequirements
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
    await navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 1500);
  };

  const reset = () => {
    setContext('');
    setDialogue('');
    setReferenceAssets('');
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-300">Tỷ lệ
              <select value={aspectRatio} onChange={(event) => { setAspectRatio(event.target.value as typeof aspectRatio); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
                <option value="9:16">9:16 dọc</option>
                <option value="16:9">16:9 ngang</option>
                <option value="1:1">1:1 vuông</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-300">
              {outputType === 'video' ? 'Thời lượng video' : 'Thời lượng phân cảnh'}
              <input type="number" min={3} max={30} value={durationSeconds} onChange={(event) => { setDurationSeconds(Number(event.target.value)); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs" placeholder="8s" />
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-300">Ảnh tham chiếu
            <input value={referenceAssets} onChange={(event) => { setReferenceAssets(event.target.value); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs outline-none focus:border-amber-500" placeholder="Tên file hoặc mô tả ảnh nhân vật, PPE, công trình" />
            <span className="mt-1 block text-[11px] font-normal text-slate-500">Tên file chỉ là chỉ dẫn; cần đính kèm ảnh thật cho mô hình tạo ảnh/video.</span>
          </label>

          <label className="block text-xs font-semibold text-slate-300">Yêu cầu bổ sung
            <input value={additionalRequirements} onChange={(event) => { setAdditionalRequirements(event.target.value); setCompiledPrompt(''); }} className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs outline-none focus:border-amber-500" placeholder="Ví dụ: thể hiện hố ga, ống HDPE theo đúng ảnh hiện trường" />
          </label>

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
