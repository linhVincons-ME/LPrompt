import { describe, expect, it } from 'vitest';
import { compileConstructionPrompt, CONSTRUCTION_CREW_OPTIONS, inspectConstructionAdditionalRequirements } from '../src/services/constructionPromptCompiler';

describe('construction prompt compiler', () => {
  const IMAGE_SECTIONS = [
    '[ĐẦU RA]',
    '[VAI TRÒ TỪNG ẢNH]',
    '[NHÂN VẬT VÀ CÁC ĐẶC ĐIỂM ƯU TIÊN]',
    '[BỐI CẢNH, VỊ TRÍ VẬT THỂ]',
    '[HÀNH ĐỘNG VÀ CAMERA]',
    '[RÀNG BUỘC NGẮN, KHÔNG MÂU THUẪN]'
  ];

  const VIDEO_SECTIONS = [
    '[ĐẦU RA VÀ THỜI LƯỢNG]',
    '[MỤC TIÊU CẢNH VIDEO]',
    '[NHÂN VẬT VÀ CÁC ĐẶC ĐIỂM ƯU TIÊN]',
    '[BỐI CẢNH, VỊ TRÍ VẬT THỂ]',
    '[HÀNH ĐỘNG VÀ CAMERA]',
    '[ÂM THANH]',
    '[RÀNG BUỘC NGẮN, KHÔNG MÂU THUẪN]'
  ];

  it('compiles an image prompt without video-only concepts or duplicate context rules', () => {
    const result = compileConstructionPrompt({
      context: 'KTHT đứng tại tuyến cáp điện hạ tầng đã thi công, phía sau là khu vực cần nghiệm thu. Khung hình 9:16. Không tạo chữ, logo, phụ đề hoặc text trên màn hình; bổ sung chữ ở hậu kỳ. Hậu cảnh phải thể hiện đúng hạng mục thi công và phạm vi kiểm tra theo mô tả hoặc ảnh hiện trường, không tự thêm cấu tạo kỹ thuật chưa được cung cấp.',
      dialogue: 'Hướng dẫn nghiệm thu dây cáp điện hạ tầng, các bước triển khai như sau.',
      outputType: 'image',
      aspectRatio: '16:9',
      durationSeconds: 10,
      referenceAssets: 'AoCBCNDLogo.JPG, Mu_KTHT.PNG, reference_sheet.PNG',
      additionalRequirements: 'Thể hiện hố ga theo đúng ảnh hiện trường.'
    });

    expect(result.outputType).toBe('image');
    for (const section of IMAGE_SECTIONS) {
      expect(result.prompt).toContain(section);
    }
    expect(result.prompt).toContain('Ảnh tĩnh tỷ lệ 16:9');
    expect(result.prompt).not.toContain('10 giây');
    expect(result.prompt).not.toContain('[ÂM THANH]');
    expect(result.prompt).not.toContain('Hero shot');
    expect(result.prompt).not.toContain('- Môi trường:');
    expect(result.prompt).not.toContain('Tính trung thực kỹ thuật:');
    expect(result.prompt.match(/9:16/g)).toBeNull();
    expect(result.prompt.match(/Không text trên ảnh/g)).toHaveLength(1);
    expect(result.prompt.match(/Hậu cảnh thể hiện đúng hạng mục thi công/g)).toHaveLength(1);
    expect(result.prompt).toContain('KTHT');
    expect(result.prompt).toContain('tuyến cáp điện hạ tầng');
    expect(result.prompt).toContain('Yêu cầu bổ sung: Thể hiện hố ga theo đúng ảnh hiện trường.');
    expect(result.warnings).toHaveLength(0);
  });

  it('compiles video construction prompt with all 7 required sections', () => {
    const result = compileConstructionPrompt({
      context: 'KTHT đứng tại tầng hầm công trình đang đổ bê tông.',
      dialogue: 'Quy trình kiểm tra độ sụt bê tông tươi.',
      outputType: 'video',
      aspectRatio: '9:16',
      durationSeconds: 15,
      referenceAssets: 'AoCBCNDLogo.JPG'
    });

    expect(result.outputType).toBe('video');
    for (const section of VIDEO_SECTIONS) {
      expect(result.prompt).toContain(section);
    }
    expect(result.prompt).toContain('Video hướng dẫn kỹ thuật');
    expect(result.prompt).toContain('15 giây');
    expect(result.prompt).toContain('9:16');
    expect(result.prompt).not.toContain('[VAI TRÒ TỪNG ẢNH]');
    expect(result.prompt).not.toContain('Ảnh tài liệu kỹ thuật');
    expect(result.prompt).toContain('không phải bằng chứng nghiệm thu');
  });

  it('infers action and role based on dialogue keywords', () => {
    const inspection = compileConstructionPrompt({
      context: 'Hiện trường công trình.',
      dialogue: 'Tiến hành đo đạc và nghiệm thu cao độ sàn.',
      outputType: 'image'
    });
    expect(inspection.prompt).toContain('nghiệm thu');
    expect(inspection.prompt).toContain('tập trung kiểm tra đối tượng thi công');

    const conclusion = compileConstructionPrompt({
      context: 'Hiện trường công trình.',
      dialogue: 'Kết luận và hoàn thành bàn giao hạng mục.',
      outputType: 'image'
    });
    expect(conclusion.prompt).toContain('tổng kết');
  });

  it('warns when reference assets or dialogue are missing', () => {
    const result = compileConstructionPrompt({
      context: 'Mặt bằng thi công.',
      outputType: 'image'
    });
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    expect(result.warnings.some((w) => w.includes('ảnh tham chiếu'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('lời thoại'))).toBe(true);
  });

  it('rejects empty context with meaningful error', () => {
    expect(() => compileConstructionPrompt({
      context: '   ',
      outputType: 'image'
    })).toThrow('Vui lòng nhập bối cảnh thi công.');
  });

  it('offers only the five approved construction crew presets', () => {
    expect(CONSTRUCTION_CREW_OPTIONS.map((option) => option.label)).toEqual([
      '1 người - KTHT',
      '2 người - KTHT, TDTD',
      '2 người - KTHT, CND',
      '2 người - TDTD, CND',
      '3 người - KTHT, 2 CND'
    ]);

    const tdtdCnd = compileConstructionPrompt({
      context: 'Kiểm tra hiện trường thi công.',
      dialogue: 'Kiểm tra khu vực thi công.',
      outputType: 'image',
      crewPreset: 'tdtd-cnd'
    });
    expect(tdtdCnd.prompt).toContain('một TDTD và một CND');
    expect(tdtdCnd.prompt).toContain('TDTD ở vị trí chủ thể');
    expect(tdtdCnd.prompt).toContain('TDTD tập trung kiểm tra');
    expect(tdtdCnd.prompt).not.toContain('KTHT chủ trì');

    const kthtTwoWorkers = compileConstructionPrompt({
      context: 'Kiểm tra hiện trường thi công.',
      outputType: 'image',
      crewPreset: 'ktht-2cnd'
    });
    expect(kthtTwoWorkers.prompt).toContain('một KTHT và hai CND');
    expect(kthtTwoWorkers.prompt).toContain('Chỉ có đúng 3 người');
  });

  it('removes duplicate additions and blocks conflicting additions', () => {
    const duplicate = inspectConstructionAdditionalRequirements('Khung hình 9:16; không chèn chữ hoặc phụ đề; thể hiện hố ga theo ảnh mẫu.', {
      outputType: 'image',
      aspectRatio: '9:16',
      participantCount: 1
    });
    expect(duplicate.normalized).toBe('thể hiện hố ga theo ảnh mẫu');
    expect(duplicate.issues.filter((issue) => issue.severity === 'warning')).toHaveLength(2);

    expect(() => compileConstructionPrompt({
      context: 'KTHT kiểm tra hiện trường.',
      outputType: 'image',
      aspectRatio: '9:16',
      participantCount: 1,
      additionalRequirements: 'Tỷ lệ 16:9; thêm nhạc nền; có phụ đề trên ảnh.'
    })).toThrow('Yêu cầu bổ sung mâu thuẫn');
  });

  it('warns when only persisted reference names exist without real files', () => {
    const result = compileConstructionPrompt({
      context: 'KTHT kiểm tra hiện trường.',
      outputType: 'image',
      referenceAssets: 'reference.png',
      referenceAssetCount: 0
    });
    expect(result.warnings.some((warning) => warning.includes('chưa có file ảnh thật'))).toBe(true);
  });

  it('keeps the video camera focused on TDTD when the crew has no KTHT', () => {
    const result = compileConstructionPrompt({ context: 'Hiện trường thi công.', outputType: 'video', crewPreset: 'tdtd-cnd' });
    expect(result.prompt).toContain('để thấy TDTD cùng khu vực thi công');
    expect(result.prompt).not.toContain('để thấy KTHT');
  });

  it('detects Vietnamese audio and duration conflicts in image prompt inspection', () => {
    const inspection = inspectConstructionAdditionalRequirements('Có âm thanh hiện trường; thời lượng 10 giây.', {
      outputType: 'image',
      aspectRatio: '16:9',
      participantCount: 1
    });
    expect(inspection.issues.some((issue) => issue.code === 'image-media-conflict')).toBe(true);
  });

  it('treats negated media in image prompt as warning instead of blocking error', () => {
    const inspection = inspectConstructionAdditionalRequirements('Không có âm thanh, không nhạc nền; không cần thời lượng.', {
      outputType: 'image',
      aspectRatio: '16:9',
      participantCount: 1
    });
    expect(inspection.issues.some((issue) => issue.code === 'image-media-conflict')).toBe(false);
    expect(inspection.issues.some((issue) => issue.code === 'duplicate-no-media')).toBe(true);

    expect(() => compileConstructionPrompt({
      context: 'KTHT kiểm tra hiện trường.',
      outputType: 'image',
      aspectRatio: '16:9',
      participantCount: 1,
      additionalRequirements: 'Không có âm thanh, không nhạc nền; không cần thời lượng.'
    })).not.toThrow();
  });

  it('keeps remaining descriptions in compound sentences when stripping negated media or text', () => {
    const compoundMedia = inspectConstructionAdditionalRequirements('Không có âm thanh, cột điện sơn màu cam XYZQ', {
      outputType: 'image',
      aspectRatio: '9:16',
      participantCount: 1
    });
    expect(compoundMedia.issues.some((issue) => issue.code === 'duplicate-no-media')).toBe(true);
    expect(compoundMedia.normalized).toContain('cột điện sơn màu cam XYZQ');

    const promptWithMedia = compileConstructionPrompt({
      context: 'KTHT kiểm tra tuyến đường dây.',
      outputType: 'image',
      additionalRequirements: 'Không có âm thanh, cột điện sơn màu cam XYZQ'
    });
    expect(promptWithMedia.prompt).toContain('cột điện sơn màu cam XYZQ');

    const compoundText = inspectConstructionAdditionalRequirements('Không chèn chữ, cột điện sơn màu cam XYZQ', {
      outputType: 'image',
      aspectRatio: '9:16',
      participantCount: 1
    });
    expect(compoundText.issues.some((issue) => issue.code === 'duplicate-no-text')).toBe(true);
    expect(compoundText.normalized).toContain('cột điện sơn màu cam XYZQ');

    // Negated combined items (và/hoặc) should become warnings without throwing
    const combinedWarning = inspectConstructionAdditionalRequirements('Không có âm thanh và nhạc nền; ảnh không kèm âm thanh', {
      outputType: 'image',
      aspectRatio: '9:16',
      participantCount: 1
    });
    expect(combinedWarning.issues.some((issue) => issue.code === 'image-media-conflict')).toBe(false);
    expect(combinedWarning.issues.some((issue) => issue.code === 'duplicate-no-media')).toBe(true);

    // Explicit request for audio must still trigger error
    const audioError = inspectConstructionAdditionalRequirements('Có âm thanh hiện trường', {
      outputType: 'image',
      aspectRatio: '9:16',
      participantCount: 1
    });
    expect(audioError.issues.some((issue) => issue.code === 'image-media-conflict')).toBe(true);
  });
});
