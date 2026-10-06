export type ConstructionOutputType = 'image' | 'video';

export interface ConstructionPromptInput {
  context: string;
  dialogue?: string;
  outputType: ConstructionOutputType;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  durationSeconds?: number;
  referenceAssets?: string;
  additionalRequirements?: string;
}

export interface ConstructionPromptResult {
  prompt: string;
  warnings: string[];
  outputType: ConstructionOutputType;
}

function clean(value?: string): string {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function inferAction(dialogue: string): string {
  const lower = dialogue.toLocaleLowerCase('vi');
  if (!lower) return 'KTHT đứng ở tư thế làm việc tự nhiên, hai tay mở đĩnh đạc, quan sát và giới thiệu khu vực thi công phía sau.';
  if (/hướng dẫn|giới thiệu|các bước|quy trình/.test(lower)) {
    return 'KTHT nhìn về phía ống kính, đứng đĩnh đạc; hai tay mở tự nhiên, một tay hướng nhẹ về khu vực thi công phía sau như đang giới thiệu quy trình.';
  }
  if (/kiểm tra|nghiệm thu|đo|đối chiếu|tiêu chuẩn/.test(lower)) {
    return 'KTHT tập trung kiểm tra đối tượng thi công, thao tác đúng nghiệp vụ và chỉ sử dụng dụng cụ đã được mô tả hoặc có trong ảnh tham chiếu.';
  }
  if (/kết luận|hoàn thành|kết quả|bàn giao/.test(lower)) {
    return 'KTHT hướng về máy quay với tác phong chuyên nghiệp, trình bày phần kết luận nhưng không thể hiện dấu xác nhận hay kết quả nghiệm thu giả định.';
  }
  return 'KTHT thể hiện cử chỉ thuyết trình tự nhiên phù hợp với nội dung lời thoại, không tạo dáng quảng cáo.';
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
    return 'Ảnh tài liệu tổng kết: Trình bày kết quả hoàn thành hạng mục thi công, xác nhận hiện trạng mặt bằng đạt chuẩn chất lượng.';
  }
  return `Ảnh tài liệu hiện trường: Ghi nhận trung thực hiện trạng khu vực thi công (${context}), làm cơ sở trực quan cho công tác hướng dẫn và kiểm tra kỹ thuật.`;
}

function referenceRule(referenceAssets: string): string {
  if (!referenceAssets) {
    return 'Không có ảnh tham chiếu được khai báo: không tự sáng tạo logo, tem chức danh, khuôn mặt, model thiết bị hoặc chi tiết thương hiệu.';
  }
  return `Ảnh tham chiếu: ${referenceAssets}. Chỉ tái hiện logo, tem, trang phục, nhân vật và thiết bị khi chúng nhìn thấy rõ trong ảnh tham chiếu; không suy đoán phần bị che hoặc không đọc được.`;
}

function ppeRule(referenceAssets: string): string {
  if (/AoCBCNDLogo\.JPG|Mu_KTHT\.PNG|reference_sheet\.PNG/i.test(referenceAssets)) {
    return 'KTHT mặc đầy đủ PPE theo bộ ảnh tham chiếu: mũ bảo hộ trắng; tem chức danh kỹ thuật hiện trường; áo sơ mi xanh lam nhạt; áo lưới phản quang vàng chanh có dải phản quang xám; quần âu đen và giày an toàn màu đen mũi thép. Logo VINCONS và chữ trên tem chỉ được tái hiện như dấu hiệu vật lý trên PPE theo đúng ảnh tham chiếu, không biến thành logo hoặc chữ đồ họa lơ lửng.';
  }
  return 'KTHT mặc đầy đủ PPE phù hợp với đúng công việc và điều kiện hiện trường. Không tự sáng tạo màu sắc, logo, tem chức danh hoặc chi tiết thương hiệu khi chưa có ảnh tham chiếu rõ ràng.';
}

function infrastructureRule(context: string): string {
  if (/cáp điện|tuyến cáp|cable/i.test(context)) {
    return 'Hậu cảnh thể hiện tuyến cáp điện hạ tầng và phạm vi cần nghiệm thu theo đúng mô tả hoặc ảnh hiện trường. Chỉ thể hiện ống bảo vệ cáp, hố ga, đầu cáp và cấu tạo tuyến khi có căn cứ; không tự đoán màu ống, kích thước, số lượng hay trạng thái đấu nối.';
  }
  return 'Hậu cảnh phải thể hiện đúng hạng mục thi công và phạm vi kiểm tra theo mô tả hoặc ảnh hiện trường, không tự thêm cấu tạo kỹ thuật chưa được cung cấp.';
}

function formatConstraints(additionalRequirements?: string): string {
  const list = [
    'Chỉ có duy nhất 1 nhân vật trong khung hình; không thêm người lạ, xe cộ hoặc vật thể ngoài mô tả.',
    'Tuân thủ 100% PPE: Mũ, áo phản quang, giày an toàn đạt chuẩn; tuyệt đối không có thao tác vi phạm quy chuẩn an toàn lao động.',
    'Tính trung thực kỹ thuật: Không tự tạo trị số đo, kết quả kiểm tra, nhãn thiết bị, biên bản hoặc kết luận đạt/không đạt giả định.',
    'Không text trên ảnh: Tuyệt đối không chèn tiêu đề, phụ đề, watermark, logo lơ lửng hoặc text đồ họa; chữ và bảng thông tin chỉ thêm ở hậu kỳ.',
    'Không mâu thuẫn ánh sáng/thời gian: Đồng nhất một nguồn sáng ban ngày tự nhiên, bóng đổ vật lý chính xác.'
  ];
  const add = clean(additionalRequirements);
  if (add) {
    list.push(`Yêu cầu bổ sung: ${add}`);
  }
  return list.map((item) => `- ${item}`).join('\n');
}

function compileImage(input: ConstructionPromptInput): string {
  const context = clean(input.context);
  const dialogue = clean(input.dialogue);
  const references = clean(input.referenceAssets);
  const aspectRatio = input.aspectRatio ?? '9:16';
  const duration = Math.min(30, Math.max(3, input.durationSeconds ?? 8));
  const action = inferAction(dialogue);
  const role = inferImageRole(dialogue, context);

  return [
    `[ĐẦU RA VÀ THỜI LƯỢNG]`,
    `- Đầu ra: Ảnh tĩnh tỷ lệ ${aspectRatio}, phong cách nhiếp ảnh tài liệu kỹ thuật công trường chân thực, độ phân giải cao, ánh sáng ban ngày tự nhiên, màu sắc trung tính.`,
    `- Thời lượng: ${duration} giây (thời lượng hiển thị phân cảnh / kịch bản trình chiếu).`,
    ``,
    `[VAI TRÒ TỪNG ẢNH]`,
    `- ${role}`,
    `- Đóng vai trò khung hình chủ đạo (Hero shot) kết nối giữa nhân vật kỹ sư hướng dẫn và đối tượng công trình hạ tầng phía sau.`,
    ``,
    `[NHÂN VẬT VÀ CÁC ĐẶC ĐIỂM ƯU TIÊN]`,
    `- Khóa nhân vật: Duy nhất một kỹ sư kỹ thuật hiện trường (KTHT) người Việt Nam ở vị trí chủ thể, tác phong chuyên nghiệp, tập trung. Duy trì nhất quán khuôn mặt, vóc dáng, màu da và trang phục giữa các góc nhìn.`,
    `- Trang phục và PPE ưu tiên: ${ppeRule(references)}`,
    `- Quy tắc nhận diện thương hiệu: ${referenceRule(references)}`,
    ``,
    `[BỐI CẢNH, VỊ TRÍ VẬT THỂ]`,
    `- Bối cảnh hiện trường: ${context} ${infrastructureRule(context)}`,
    `- Vị trí vật thể: KTHT đứng ở tiền cảnh (vị trí 1/3 khung hình) nhưng không che khuất đối tượng thi công; trung cảnh và hậu cảnh thể hiện rõ hạng mục công trình, tuyến kỹ thuật và lối tiếp cận an toàn.`,
    `- Môi trường: Mặt bằng công trường gọn gàng theo chuẩn 5S; rào chắn và biển báo chỉ xuất hiện khi phù hợp; không tạo dây điện hở, đấu nối tạm bợ nguy hiểm hay vật liệu cản trở lối đi.`,
    ``,
    `[HÀNH ĐỘNG VÀ CAMERA]`,
    `- Hành động và thần thái: ${action}`,
    `- Bố cục & Góc máy: Trung toàn cảnh (Medium-Wide Shot), góc máy ngang tầm mắt. Hậu cảnh có độ sâu trường ảnh vừa đủ để nhận biết rõ phạm vi cần kiểm tra và chiều sâu công trình.`,
    `- Yêu cầu chất lượng: Tiêu cự 35mm - 50mm chân thực; tỷ lệ cơ thể, bàn tay và bóng đổ chân thực; đúng năm ngón trên mỗi bàn tay; không méo mặt, không thừa chi, không lặp người hoặc vật thể.`,
    ``,
    `[ÂM THANH]`,
    `- Âm thanh môi trường hiện trường: Tiếng môi trường công trường tự nhiên (tiếng gió nhẹ, âm thanh cơ giới xa xa), không tạp âm gây nhiễu.`,
    `- Lời thoại / Thuyết minh: ${dialogue ? `Lời thoại định hướng biểu cảm và dùng thu âm thuyết minh ở hậu kỳ: “${dialogue}” (tuyệt đối không hiển thị thành chữ trên ảnh).` : 'Sẵn sàng tích hợp lời thuyết minh kỹ thuật và âm thanh hiện trường ở khâu dựng media.'}`,
    `- Nhạc nền kịch bản: Tiết tấu trung tính, mang phong cách phim tài liệu kỹ thuật công nghiệp, không dùng nhạc quảng cáo kịch tính.`,
    ``,
    `[RÀNG BUỘC NGẮN, KHÔNG MÂU THUẪN]`,
    formatConstraints(input.additionalRequirements)
  ].join('\n');
}

function compileVideo(input: ConstructionPromptInput): string {
  const context = clean(input.context);
  const dialogue = clean(input.dialogue);
  const references = clean(input.referenceAssets);
  const aspectRatio = input.aspectRatio ?? '9:16';
  const duration = Math.min(30, Math.max(3, input.durationSeconds ?? 8));
  const action = inferAction(dialogue);
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
    `- Khóa nhân vật: Duy nhất một kỹ sư kỹ thuật hiện trường (KTHT) người Việt Nam ở vị trí chủ thể, tác phong chuyên nghiệp. Duy trì nhất quán khuôn mặt, vóc dáng, trang phục và cử chỉ.`,
    `- Trang phục và PPE ưu tiên: ${ppeRule(references)}`,
    `- Quy tắc nhận diện thương hiệu: ${referenceRule(references)}`,
    ``,
    `[BỐI CẢNH, VỊ TRÍ VẬT THỂ]`,
    `- Bối cảnh hiện trường: ${context} ${infrastructureRule(context)}`,
    `- Dàn cảnh và không gian: KTHT ở vị trí trung tâm hoặc 1/3 khung hình; hậu cảnh thể hiện trung thực tuyến thi công và chiều sâu công trình.`,
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
    formatConstraints(input.additionalRequirements)
  ].join('\n');
}

export function compileConstructionPrompt(input: ConstructionPromptInput): ConstructionPromptResult {
  const context = clean(input.context);
  if (!context) throw new Error('Vui lòng nhập bối cảnh thi công.');

  const warnings: string[] = [];
  if (!clean(input.referenceAssets)) warnings.push('Chưa khai báo ảnh tham chiếu; compiler sẽ cấm tự tạo logo, tem, khuôn mặt và model thiết bị.');
  if (!clean(input.dialogue)) warnings.push('Chưa có lời thoại; hành động nhân vật được giữ ở mức trung tính.');

  return {
    prompt: input.outputType === 'video' ? compileVideo(input) : compileImage(input),
    warnings,
    outputType: input.outputType
  };
}
