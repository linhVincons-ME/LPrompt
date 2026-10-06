export type ConstructionOutputType = 'image' | 'video';
export type ConstructionCrewPreset = 'ktht' | 'ktht-tdtd' | 'ktht-cnd' | 'tdtd-cnd' | 'ktht-2cnd';

export const CONSTRUCTION_CREW_OPTIONS: Array<{ id: ConstructionCrewPreset; label: string }> = [
  { id: 'ktht', label: '1 người - KTHT' },
  { id: 'ktht-tdtd', label: '2 người - KTHT, TDTD' },
  { id: 'ktht-cnd', label: '2 người - KTHT, CND' },
  { id: 'tdtd-cnd', label: '2 người - TDTD, CND' },
  { id: 'ktht-2cnd', label: '3 người - KTHT, 2 CND' }
];

export interface ConstructionPromptInput {
  context: string;
  dialogue?: string;
  outputType: ConstructionOutputType;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  durationSeconds?: number;
  referenceAssets?: string;
  referenceAssetCount?: number;
  additionalRequirements?: string;
  participantCount?: number;
  crewPreset?: ConstructionCrewPreset;
}

export interface ConstructionRequirementIssue {
  severity: 'warning' | 'error';
  code: string;
  message: string;
}

export interface ConstructionPromptResult {
  prompt: string;
  warnings: string[];
  outputType: ConstructionOutputType;
}

function clean(value?: string): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function cleanImageContext(value?: string): string {
  return clean(value)
    .replace(/,?\s*khung hình\s*(?:tỷ lệ\s*)?\d+\s*:\s*\d+/gi, '')
    .replace(/Không (?:tạo|chèn)[^.]*?(?:hậu kỳ|trên màn hình)[^.]*\.?/gi, '')
    .replace(/Hậu cảnh phải thể hiện đúng hạng mục[^.]*\.?/gi, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .trim();
}

function normalizedParticipantCount(value?: number): number {
  const count = value ?? 1;
  if (!Number.isInteger(count) || count < 1 || count > 6) {
    throw new Error('Số người trong cảnh phải là số nguyên từ 1 đến 6.');
  }
  return count;
}

interface ResolvedCrew {
  count: number;
  leadRole: 'KTHT' | 'TDTD';
  roleSummary: string;
  otherRoleSummary: string;
  hasKtht: boolean;
}

function resolveCrew(input: Pick<ConstructionPromptInput, 'crewPreset' | 'participantCount'>): ResolvedCrew {
  switch (input.crewPreset) {
    case 'ktht-tdtd': return { count: 2, leadRole: 'KTHT', roleSummary: 'một KTHT và một TDTD', otherRoleSummary: 'TDTD', hasKtht: true };
    case 'ktht-cnd': return { count: 2, leadRole: 'KTHT', roleSummary: 'một KTHT và một CND', otherRoleSummary: 'CND', hasKtht: true };
    case 'tdtd-cnd': return { count: 2, leadRole: 'TDTD', roleSummary: 'một TDTD và một CND', otherRoleSummary: 'CND', hasKtht: false };
    case 'ktht-2cnd': return { count: 3, leadRole: 'KTHT', roleSummary: 'một KTHT và hai CND', otherRoleSummary: 'hai CND', hasKtht: true };
    case 'ktht': return { count: 1, leadRole: 'KTHT', roleSummary: 'một KTHT', otherRoleSummary: '', hasKtht: true };
    default: {
      const count = normalizedParticipantCount(input.participantCount);
      return { count, leadRole: 'KTHT', roleSummary: count === 1 ? 'một KTHT' : `một KTHT và ${count - 1} thành viên tổ nghiệm thu`, otherRoleSummary: `${count - 1} thành viên tổ nghiệm thu`, hasKtht: true };
    }
  }
}

export function inspectConstructionAdditionalRequirements(
  additionalRequirements: string | undefined,
  options: Pick<ConstructionPromptInput, 'outputType' | 'aspectRatio' | 'participantCount' | 'crewPreset'>
): { normalized: string; issues: ConstructionRequirementIssue[] } {
  const source = clean(additionalRequirements);
  if (!source) return { normalized: '', issues: [] };

  const aspectRatio = options.aspectRatio ?? '9:16';
  const participantCount = resolveCrew(options).count;
  const issues: ConstructionRequirementIssue[] = [];
  const kept: string[] = [];
  const fragments = source.split(/\s*(?:[;\n]+|(?<=[.!?])\s+)\s*/).filter(Boolean);

  for (const fragment of fragments) {
    const lower = fragment.toLocaleLowerCase('vi');
    const ratio = fragment.match(/\b(9\s*:\s*16|16\s*:\s*9|1\s*:\s*1)\b/)?.[1]?.replace(/\s/g, '');
    const count = fragment.match(/\b([1-9])\s*(?:người|nhân vật|thành viên)\b/i)?.[1];

    if (ratio) {
      issues.push(ratio === aspectRatio
        ? { severity: 'warning', code: 'duplicate-aspect-ratio', message: `Tỷ lệ ${ratio} đã được chọn ở trường Tỷ lệ nên đã loại khỏi yêu cầu bổ sung.` }
        : { severity: 'error', code: 'conflicting-aspect-ratio', message: `Yêu cầu bổ sung dùng tỷ lệ ${ratio}, mâu thuẫn với tỷ lệ ${aspectRatio} đang chọn.` });
      if (ratio === aspectRatio) continue;
    }

    if (count) {
      const requestedCount = Number(count);
      issues.push(requestedCount === participantCount
        ? { severity: 'warning', code: 'duplicate-participant-count', message: `Số lượng ${participantCount} người đã được chọn nên đã loại khỏi yêu cầu bổ sung.` }
        : { severity: 'error', code: 'conflicting-participant-count', message: `Yêu cầu bổ sung mô tả ${requestedCount} người, mâu thuẫn với lựa chọn ${participantCount} người.` });
      if (requestedCount === participantCount) continue;
    }

    if (options.outputType === 'image' && /\b(?:âm thanh|nhạc nền|giọng đọc|thu âm|\d+\s*giây|thời lượng)\b/i.test(lower)) {
      issues.push({ severity: 'error', code: 'image-media-conflict', message: 'Prompt ảnh không hỗ trợ thời lượng, âm thanh, giọng đọc hoặc nhạc nền.' });
    }

    if (/(?:chèn|hiển thị|thêm|tạo|có).{0,24}(?:phụ đề|watermark|text|chữ trên ảnh|chữ trên video)/i.test(lower)
      && !/(?:không|cấm|tuyệt đối không)/i.test(lower)) {
      issues.push({ severity: 'error', code: 'text-overlay-conflict', message: 'Yêu cầu chèn chữ hoặc phụ đề mâu thuẫn với quy tắc bổ sung chữ ở hậu kỳ.' });
    }

    if (/(?:không|cấm|tuyệt đối không).{0,40}(?:phụ đề|watermark|text|chữ)/i.test(lower)) {
      issues.push({ severity: 'warning', code: 'duplicate-no-text', message: 'Quy tắc không chèn chữ đã có sẵn nên đã loại khỏi yêu cầu bổ sung.' });
      continue;
    }
    if (/(?:đầy đủ|tuân thủ).{0,20}\bPPE\b/i.test(fragment)) {
      issues.push({ severity: 'warning', code: 'duplicate-ppe', message: 'Quy tắc PPE đã có sẵn nên đã loại khỏi yêu cầu bổ sung.' });
      continue;
    }
    if (/(?:không thêm|duy nhất).{0,30}(?:người|nhân vật)/i.test(lower)) {
      issues.push({ severity: 'warning', code: 'duplicate-people-rule', message: 'Quy tắc số người đã có sẵn nên đã loại khỏi yêu cầu bổ sung.' });
      continue;
    }

    kept.push(fragment.replace(/[.;]+$/, '').trim());
  }

  return { normalized: kept.join('; '), issues };
}

function inferAction(dialogue: string, leadRole: 'KTHT' | 'TDTD'): string {
  const lower = dialogue.toLocaleLowerCase('vi');
  if (!lower) return `${leadRole} đứng ở tư thế làm việc tự nhiên, hai tay mở đĩnh đạc, quan sát và giới thiệu khu vực thi công phía sau.`;
  if (/hướng dẫn|giới thiệu|các bước|quy trình/.test(lower)) {
    return `${leadRole} nhìn về phía ống kính, đứng đĩnh đạc; hai tay mở tự nhiên, một tay hướng nhẹ về khu vực thi công phía sau như đang giới thiệu quy trình.`;
  }
  if (/kiểm tra|nghiệm thu|đo|đối chiếu|tiêu chuẩn/.test(lower)) {
    return `${leadRole} tập trung kiểm tra đối tượng thi công, thao tác đúng nghiệp vụ và chỉ sử dụng dụng cụ đã được mô tả hoặc có trong ảnh tham chiếu.`;
  }
  if (/kết luận|hoàn thành|kết quả|bàn giao/.test(lower)) {
    return `${leadRole} hướng về máy quay với tác phong chuyên nghiệp, trình bày phần kết luận nhưng không thể hiện dấu xác nhận hay kết quả nghiệm thu giả định.`;
  }
  return `${leadRole} thể hiện cử chỉ thuyết trình tự nhiên phù hợp với nội dung lời thoại, không tạo dáng quảng cáo.`;
}

function inferImageRole(dialogue: string, context: string): string {
  const lower = dialogue.toLocaleLowerCase('vi');
  if (/hướng dẫn|các bước|quy trình|bắt đầu|mở đầu/.test(lower)) {
    return 'Ảnh tài liệu kỹ thuật: Giới thiệu quy trình thi công và định vị hạng mục kiểm tra, thiết lập bối cảnh hiện trường trực quan cho người xem.';
  }
  if (/kiểm tra|nghiệm thu|đo|đối chiếu|tiêu chuẩn/.test(lower)) {
    return 'Ảnh tài liệu nghiệm thu: Ghi nhận công tác kiểm tra, đối chiếu hồ sơ và hiện trạng kỹ thuật đối tượng thi công tại hiện trường.';
  }
  if (/kết luận|hoàn thành|kết quả|bàn giao/.test(lower)) {
    return 'Ảnh tài liệu tổng kết: Ghi nhận hiện trạng hạng mục thi công để phục vụ phần tổng kết, không hàm ý kết luận nghiệm thu đạt hoặc không đạt.';
  }
  return `Ảnh tài liệu hiện trường: Ghi nhận trung thực hiện trạng khu vực thi công (${context}), làm cơ sở trực quan cho công tác hướng dẫn và kiểm tra kỹ thuật.`;
}

function referenceRule(referenceAssets: string): string {
  if (!referenceAssets) {
    return 'Không có ảnh tham chiếu được khai báo: không tự sáng tạo logo, tem chức danh, khuôn mặt, model thiết bị hoặc chi tiết thương hiệu.';
  }
  return `Ảnh tham chiếu: ${referenceAssets}. Chỉ tái hiện logo, tem, trang phục, nhân vật và thiết bị khi chúng nhìn thấy rõ trong ảnh tham chiếu; không suy đoán phần bị che hoặc không đọc được.`;
}

function ppeRule(referenceAssets: string, crew: ResolvedCrew): string {
  if (crew.hasKtht && /AoCBCNDLogo\.JPG|Mu_KTHT\.PNG|reference_sheet\.PNG/i.test(referenceAssets)) {
    const others = crew.count > 1 ? ` ${crew.otherRoleSummary} mặc PPE đúng vai trò và điều kiện công việc.` : '';
    return `KTHT mặc đầy đủ PPE theo bộ ảnh tham chiếu: mũ bảo hộ trắng; tem chức danh kỹ thuật hiện trường; áo sơ mi xanh lam nhạt; áo lưới phản quang vàng chanh có dải phản quang xám; quần âu đen và giày an toàn màu đen mũi thép.${others} Logo VINCONS và chữ trên tem chỉ được tái hiện như dấu hiệu vật lý trên PPE theo đúng ảnh tham chiếu, không biến thành logo hoặc chữ đồ họa lơ lửng.`;
  }
  return crew.count === 1
    ? 'KTHT mặc đầy đủ PPE phù hợp với đúng vai trò, công việc và điều kiện hiện trường. Không tự sáng tạo màu sắc, logo, tem chức danh hoặc chi tiết thương hiệu khi chưa có ảnh tham chiếu rõ ràng.'
    : `Các nhân vật (${crew.roleSummary}) đều mặc đầy đủ PPE phù hợp với đúng vai trò, công việc và điều kiện hiện trường. Không tự sáng tạo màu sắc, logo, tem chức danh hoặc chi tiết thương hiệu khi chưa có ảnh tham chiếu rõ ràng.`;
}

function characterLock(crew: ResolvedCrew, video: boolean): string {
  if (crew.count === 1) {
    return `Duy nhất một kỹ sư kỹ thuật hiện trường (KTHT) người Việt Nam ở vị trí chủ thể, tác phong chuyên nghiệp${video ? '' : ', tập trung'}. Duy trì nhất quán khuôn mặt, vóc dáng, màu da, trang phục${video ? ' và cử chỉ' : ''}.`;
  }
  return `Đúng ${crew.count} người Việt Nam trong cảnh: ${crew.roleSummary}; ${crew.leadRole} ở vị trí chủ thể. Mỗi người có khuôn mặt, vóc dáng và vị trí riêng; duy trì nhất quán toàn bộ nhân vật, PPE và vai trò${video ? ' giữa các khung hình' : ' trong cảnh'}.`;
}

function placementRule(crew: ResolvedCrew): string {
  if (crew.count === 1) {
    return 'KTHT đứng ở tiền cảnh (vị trí 1/3 khung hình) nhưng không che khuất đối tượng thi công; trung cảnh và hậu cảnh thể hiện rõ hạng mục công trình, tuyến kỹ thuật và lối tiếp cận an toàn.';
  }
  return `${crew.leadRole} đứng ở tiền cảnh lệch 1/3 khung hình; ${crew.otherRoleSummary} bố trí tự nhiên ở trung cảnh quanh phạm vi kiểm tra, không che khuất nhau hoặc che hạng mục công trình; giữ lối tiếp cận an toàn.`;
}

function infrastructureRule(context: string): string {
  if (/cáp điện|tuyến cáp|cable/i.test(context)) {
    return 'Hậu cảnh thể hiện tuyến cáp điện hạ tầng và phạm vi cần nghiệm thu theo đúng mô tả hoặc ảnh hiện trường. Chỉ thể hiện ống bảo vệ cáp, hố ga, đầu cáp và cấu tạo tuyến khi có căn cứ; không tự đoán màu ống, kích thước, số lượng hay trạng thái đấu nối.';
  }
  return 'Hậu cảnh phải thể hiện đúng hạng mục thi công và phạm vi kiểm tra theo mô tả hoặc ảnh hiện trường, không tự thêm cấu tạo kỹ thuật chưa được cung cấp.';
}

function formatImageConstraints(participantCount: number, additionalRequirements?: string): string {
  const list = [
    `Chỉ có đúng ${participantCount} ${participantCount === 1 ? 'nhân vật' : 'người trong tổ nghiệm thu'} trong khung hình; không thêm người lạ, xe cộ hoặc vật thể ngoài mô tả.`,
    'Tuân thủ 100% PPE: Mũ, áo phản quang, giày an toàn đạt chuẩn; tuyệt đối không có thao tác vi phạm quy chuẩn an toàn lao động.',
    'Không text trên ảnh: Tuyệt đối không chèn tiêu đề, phụ đề, watermark, logo lơ lửng hoặc text đồ họa; chữ và bảng thông tin chỉ thêm ở hậu kỳ.',
    'Hậu cảnh thể hiện đúng hạng mục thi công và phạm vi kiểm tra theo mô tả hoặc ảnh hiện trường; không tự thêm cấu tạo kỹ thuật chưa được cung cấp.',
    'Không mâu thuẫn ánh sáng/thời gian: Đồng nhất một nguồn sáng ban ngày tự nhiên, bóng đổ vật lý chính xác.'
  ];
  const add = clean(additionalRequirements);
  if (add) {
    list.push(`Yêu cầu bổ sung: ${add}${/[.!?]$/.test(add) ? '' : '.'}`);
  }
  return list.map((item) => `- ${item}`).join('\n');
}

function formatVideoConstraints(participantCount: number, additionalRequirements?: string): string {
  const list = [
    `Chỉ có đúng ${participantCount} ${participantCount === 1 ? 'nhân vật' : 'người trong tổ nghiệm thu'} trong khung hình; không thêm người lạ, xe cộ hoặc vật thể ngoài mô tả.`,
    'Tuân thủ 100% PPE: Mũ, áo phản quang, giày an toàn đạt chuẩn; tuyệt đối không có thao tác vi phạm quy chuẩn an toàn lao động.',
    'Tính trung thực kỹ thuật: Không tự tạo trị số đo, kết quả kiểm tra, nhãn thiết bị, biên bản hoặc kết luận đạt/không đạt giả định.',
    'Không text trên video: Tuyệt đối không chèn tiêu đề, phụ đề, watermark, logo lơ lửng hoặc text đồ họa; chữ và bảng thông tin chỉ thêm ở hậu kỳ.',
    'Không mâu thuẫn ánh sáng/thời gian: Đồng nhất nguồn sáng, bóng đổ và điều kiện hiện trường giữa các khung hình.'
  ];
  const add = clean(additionalRequirements);
  if (add) list.push(`Yêu cầu bổ sung: ${add}${/[.!?]$/.test(add) ? '' : '.'}`);
  return list.map((item) => `- ${item}`).join('\n');
}

function compileImage(input: ConstructionPromptInput): string {
  const context = cleanImageContext(input.context);
  const dialogue = clean(input.dialogue);
  const references = clean(input.referenceAssets);
  const aspectRatio = input.aspectRatio ?? '9:16';
  const crew = resolveCrew(input);
  const participantCount = crew.count;
  const additional = inspectConstructionAdditionalRequirements(input.additionalRequirements, input).normalized;
  const action = inferAction(dialogue, crew.leadRole);
  const role = inferImageRole(dialogue, context);

  return [
    `[ĐẦU RA]`,
    `- Đầu ra: Ảnh tĩnh tỷ lệ ${aspectRatio}, phong cách nhiếp ảnh tài liệu kỹ thuật công trường chân thực, độ phân giải cao, ánh sáng ban ngày tự nhiên, màu sắc trung tính.`,
    ``,
    `[VAI TRÒ TỪNG ẢNH]`,
    `- ${role}`,
    ``,
    `[NHÂN VẬT VÀ CÁC ĐẶC ĐIỂM ƯU TIÊN]`,
    `- Khóa nhân vật: ${characterLock(crew, false)}`,
    `- Trang phục và PPE ưu tiên: ${ppeRule(references, crew)}`,
    `- Quy tắc nhận diện thương hiệu: ${referenceRule(references)}`,
    ``,
    `[BỐI CẢNH, VỊ TRÍ VẬT THỂ]`,
    `- Bối cảnh hiện trường: ${context}`,
    `- Vị trí vật thể: ${placementRule(crew)}`,
    ``,
    `[HÀNH ĐỘNG VÀ CAMERA]`,
    `- Hành động và thần thái: ${action}`,
    `- Bố cục & Góc máy: Trung toàn cảnh (Medium-Wide Shot), góc máy ngang tầm mắt. Hậu cảnh có độ sâu trường ảnh vừa đủ để nhận biết rõ phạm vi cần kiểm tra và chiều sâu công trình.`,
    `- Yêu cầu chất lượng: Tiêu cự 35mm - 50mm chân thực; tỷ lệ cơ thể, bàn tay và bóng đổ chân thực; đúng năm ngón trên mỗi bàn tay; không méo mặt, không thừa chi, không lặp người hoặc vật thể.`,
    ``,
    `[RÀNG BUỘC NGẮN, KHÔNG MÂU THUẪN]`,
    formatImageConstraints(participantCount, additional)
  ].join('\n');
}

function compileVideo(input: ConstructionPromptInput): string {
  const context = clean(input.context);
  const dialogue = clean(input.dialogue);
  const references = clean(input.referenceAssets);
  const aspectRatio = input.aspectRatio ?? '9:16';
  const crew = resolveCrew(input);
  const participantCount = crew.count;
  const additional = inspectConstructionAdditionalRequirements(input.additionalRequirements, input).normalized;
  const duration = Math.min(30, Math.max(3, input.durationSeconds ?? 8));
  const action = inferAction(dialogue, crew.leadRole);
  const role = inferImageRole(dialogue, context);

  return [
    `[ĐẦU RA VÀ THỜI LƯỢNG]`,
    `- Đầu ra: Video hướng dẫn kỹ thuật hiện trường, tỷ lệ ${aspectRatio}, phong cách tài liệu hiện trường chân thực, chuyển động tự nhiên liên tục.`,
    `- Thời lượng: ${duration} giây. Chuyển động máy quay chậm, ổn định, không giật lắc, không morphing giữa các khung hình.`,
    ``,
    `[VAI TRÒ TỪNG ẢNH]`,
    `- ${role}`,
    `- Phân cảnh video ghi nhận liên tục quá trình hướng dẫn kỹ thuật hiện trường, kết nối người nói và không gian thi công.`,
    ``,
    `[NHÂN VẬT VÀ CÁC ĐẶC ĐIỂM ƯU TIÊN]`,
    `- Khóa nhân vật: ${characterLock(crew, true)}`,
    `- Trang phục và PPE ưu tiên: ${ppeRule(references, crew)}`,
    `- Quy tắc nhận diện thương hiệu: ${referenceRule(references)}`,
    ``,
    `[BỐI CẢNH, VỊ TRÍ VẬT THỂ]`,
    `- Bối cảnh hiện trường: ${context} ${infrastructureRule(context)}`,
    `- Dàn cảnh và không gian: ${placementRule(crew)} Duy trì bố cục ổn định khi máy quay chuyển động.`,
    `- Môi trường: Công trường gọn gàng theo chuẩn 5S; rào chắn và cảnh báo an toàn chỉ xuất hiện khi phù hợp; không tạo yếu tố nguy hiểm hoặc thao tác sai kỹ thuật.`,
    ``,
    `[HÀNH ĐỘNG VÀ CAMERA]`,
    `- Hành động nhân vật: ${action}`,
    `- Chuyển động máy quay: Mở đầu bằng trung toàn cảnh ngang tầm mắt để thấy KTHT cùng khu vực thi công phía sau; chuyển động máy chậm, ổn định. Chỉ chuyển sang cận cảnh khi cần làm rõ thao tác hoặc chi tiết đã có trong mô tả; không dùng chuyển động FPV drone hay dolly kịch tính.`,
    `- Ổn định hình ảnh: Cử động cơ thể, bàn tay, PPE và vật thể ổn định giữa các khung hình; đúng giải phẫu bàn tay 5 ngón, không biến dạng khuôn mặt.`,
    ``,
    `[ÂM THANH]`,
    `- Âm thanh hiện trường: Giữ âm thanh môi trường công trường tự nhiên và tiếng động cơ giới thực tế.`,
    `- Lời thoại: ${dialogue ? `Dùng đúng nguyên văn lời thoại đã cung cấp, giọng nam Việt Nam rõ ràng, ngữ điệu kỹ thuật điềm tĩnh: “${dialogue}”.` : 'Âm thanh hiện trường tự nhiên, sẵn sàng ghép lời bình kỹ thuật ở hậu kỳ.'}`,
    `- Nhạc nền: Nhạc nền phong cách tài liệu công nghiệp, âm lượng vừa phải, không lấn át lời thoại.`,
    ``,
    `[RÀNG BUỘC NGẮN, KHÔNG MÂU THUẪN]`,
    formatVideoConstraints(participantCount, additional)
  ].join('\n');
}

export function compileConstructionPrompt(input: ConstructionPromptInput): ConstructionPromptResult {
  const context = clean(input.context);
  if (!context) throw new Error('Vui lòng nhập bối cảnh thi công.');

  const warnings: string[] = [];
  if (!clean(input.referenceAssets)) warnings.push('Chưa khai báo ảnh tham chiếu; compiler sẽ cấm tự tạo logo, tem, khuôn mặt và model thiết bị.');
  if (clean(input.referenceAssets) && input.referenceAssetCount === 0) warnings.push('Tên ảnh tham chiếu đang được lưu nhưng chưa có file ảnh thật; hãy chọn lại file trước khi chèn vào Gemini.');
  if (!clean(input.dialogue)) warnings.push('Chưa có lời thoại; hành động nhân vật được giữ ở mức trung tính.');
  const requirementCheck = inspectConstructionAdditionalRequirements(input.additionalRequirements, input);
  const conflicts = requirementCheck.issues.filter((issue) => issue.severity === 'error');
  if (conflicts.length > 0) throw new Error(`Yêu cầu bổ sung mâu thuẫn: ${conflicts.map((issue) => issue.message).join(' ')}`);
  warnings.push(...requirementCheck.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message));

  return {
    prompt: input.outputType === 'video' ? compileVideo(input) : compileImage(input),
    warnings,
    outputType: input.outputType
  };
}
