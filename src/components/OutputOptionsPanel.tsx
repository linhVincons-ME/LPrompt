import type { PromptDomain } from '../types';
import { DEFAULT_OUTPUT_OPTIONS, inspectOutputOptions, missingDataRule, outputRules, type OutputOptions } from '../services/outputOptions';

interface Props { value: OutputOptions; onChange: (value: OutputOptions) => void; instruction: string; onInstructionChange: (value: string) => void; domain: PromptDomain }
const fieldClass = 'mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200';
const parameters: Record<PromptDomain, string> = {
  image: 'Bố cục, góc máy, ánh sáng, tỷ lệ, phong cách', video: 'Thời lượng, cảnh quay, chuyển động máy, âm thanh',
  code: 'Ngôn ngữ, phiên bản, môi trường chạy, test', research: 'Phạm vi, nguồn, mốc thời gian, cách trích dẫn', audio: 'Giọng đọc, nhịp độ, âm sắc, môi trường âm thanh'
};

export function OutputOptionsPanel({ value, onChange, instruction, onInstructionChange, domain }: Props) {
  const update = (patch: Partial<OutputOptions>) => onChange({ ...value, ...patch });
  const issues = inspectOutputOptions(value, instruction);
  const duplicate = /không (?:tự )?bịa|không suy đoán|bảo toàn (?:ý định|thông số)/i.test(instruction);
  return <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
    <p className="text-xs text-slate-400">Tự động bảo toàn yêu cầu, phân biệt dữ kiện và giả định, kiểm tra ràng buộc trước khi trả kết quả.</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-xs text-slate-300">Định dạng<select className={fieldClass} value={value.format} onChange={(e) => update({ format: e.target.value as OutputOptions['format'] })}>
        <option value="auto">Theo yêu cầu gốc</option><option value="text">Văn bản</option><option value="markdown">Markdown</option><option value="table">Bảng</option><option value="json">JSON</option>
      </select></label>
      <label className="text-xs text-slate-300">Mức chi tiết<select className={fieldClass} value={value.detail} onChange={(e) => update({ detail: e.target.value as OutputOptions['detail'] })}>
        <option value="short">Ngắn gọn</option><option value="standard">Tiêu chuẩn</option><option value="detailed">Chi tiết</option>
      </select></label>
      <label className="text-xs text-slate-300">Khi thiếu dữ liệu<select className={fieldClass} value={value.missingData} onChange={(e) => update({ missingData: e.target.value as OutputOptions['missingData'] })}>
        <option value="partial">Nêu phần thiếu và tiếp tục phần có căn cứ</option><option value="ask">Hỏi lại</option><option value="stop">Dừng, không suy đoán</option>
      </select></label>
    </div>
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
      <label><input type="checkbox" checked={value.evidence} onChange={(e) => update({ evidence: e.target.checked })} /> Kèm căn cứ và giả định</label>
      <label><input type="checkbox" checked={value.maxWords !== null} onChange={(e) => update({ maxWords: e.target.checked ? 150 : null })} /> Giới hạn số từ</label>
      {value.maxWords !== null && <input aria-label="Số từ tối đa" className="w-24 rounded border border-slate-700 bg-slate-950 p-2" type="number" min="1" value={value.maxWords} onChange={(e) => update({ maxWords: Number(e.target.value) })} />}
    </div>
    {value.format === 'json' && <label className="block text-xs text-slate-300">JSON Schema (tùy chọn)
      <textarea className={`${fieldClass} min-h-28 font-mono`} value={value.schema} onChange={(e) => update({ schema: e.target.value })} placeholder='{"type":"object","properties":{},"required":[],"additionalProperties":false}' />
      <button type="button" className="mt-1 text-indigo-300" onClick={() => update({ schema: JSON.stringify({ type: 'object', properties: { result: { type: 'string', description: 'Kết quả chính' } }, required: ['result'], additionalProperties: false }, null, 2) })}>Điền schema mẫu</button>
      <p className="mt-1 text-slate-500">Kiểm tra cú pháp và cấu trúc schema trước khi biên dịch. Phản hồi từ mô hình vẫn cần được xác thực tại nơi sử dụng.</p>
    </label>}
    <details><summary className="cursor-pointer text-xs text-slate-300">Thông số {domain === 'code' ? 'lập trình' : 'chuyên ngành'} và preset</summary>
      <input aria-label="Thông số chuyên ngành" className={fieldClass} value={value.domainParameters} onChange={(e) => update({ domainParameters: e.target.value })} placeholder={parameters[domain]} />
      <div className="mt-2 flex gap-2 text-xs">
        <button type="button" onClick={() => onChange({ ...DEFAULT_OUTPUT_OPTIONS, detail: 'short' })}>Ngắn gọn</button>
        <button type="button" onClick={() => onChange({ ...DEFAULT_OUTPUT_OPTIONS, detail: 'detailed', evidence: true })}>Phân tích có căn cứ</button>
        <button type="button" onClick={() => onChange({ ...DEFAULT_OUTPUT_OPTIONS, format: 'json' })}>JSON cho API</button>
        {domain === 'code' && <button type="button" onClick={() => onChange({ ...DEFAULT_OUTPUT_OPTIONS, domainParameters: 'Kèm kiểm thử cho trường hợp thành công, đầu vào không hợp lệ và lỗi; nêu cách chạy test.' })}>Code có test</button>}
      </div>
    </details>
    <label className="block text-xs text-slate-300">Chỉ thị bổ sung<textarea className={`${fieldClass} min-h-20`} value={instruction} onChange={(e) => onInstructionChange(e.target.value)} placeholder="Giọng điệu, yêu cầu riêng hoặc nội dung cần tinh chỉnh…" /></label>
    {duplicate && <p className="text-xs text-amber-300">Chỉ thị có nội dung trùng với nguyên tắc mặc định; bạn có thể lược bỏ để prompt gọn hơn.</p>}
    {issues.map((issue) => <p role="alert" key={issue} className="text-xs text-rose-300">{issue}</p>)}
    <details><summary className="cursor-pointer text-xs text-indigo-300">LPrompt sẽ thêm gì?</summary><ul className="mt-2 space-y-1 text-xs text-slate-400">{[missingDataRule(value, 'vi'), ...outputRules(value, 'vi')].map((rule) => <li key={rule}>{rule}</li>)}</ul></details>
  </div>;
}
