export const FABRIC_PRESETS = [
  // ==========================================
  // BUSINESS & STRATEGY
  // ==========================================
  {
    id: 'preset-biz-swot',
    title: 'Phân Tích Chiến Lược Toàn Diện (SWOT & Action Matrix)',
    category: 'business',
    framework: 'CO-STAR',
    recommendedModel: 'gemini-3.1-pro-preview',
    tags: ['Chiến lược', 'Kinh doanh', 'Phân tích', 'Ma trận SWOT'],
    description: 'Đánh giá chuyên sâu điểm mạnh, điểm yếu, cơ hội và thách thức kèm ma trận hành động kết hợp SO, WO, ST, WT.',
    prompt: `[ROLE & CONTEXT]
Bạn là Chuyên gia Tư vấn Chiến lược Cấp cao (Chief Strategy Officer) với 20 năm kinh nghiệm tái cơ cấu doanh nghiệp Fortune 500.

[TASK & INSTRUCTION]
Hãy tiến hành phân tích chiến lược toàn diện cho doanh nghiệp/sản phẩm: {{doanh_nghiep}} hoạt động trong lĩnh vực: {{linh_vuc}}.
Các bước thực hiện:
1. Phân tích 4 góc phần tư SWOT chi tiết, mỗi góc tối thiểu 3 luận điểm có dẫn chứng logic.
2. Xây dựng ma trận chiến lược kết hợp:
   - Chiến lược SO (Phát huy điểm mạnh để nắm bắt cơ hội)
   - Chiến lược WO (Khắc phục điểm yếu nhờ cơ hội)
   - Chiến lược ST (Dùng thế mạnh phòng vệ rủi ro)
   - Chiến lược WT (Tối thiểu hóa điểm yếu để tránh hiểm họa)
3. Đề xuất bảng Lộ trình hành động 90 ngày (90-Day Quick Wins).

[CONSTRAINTS & RULES]
- Không đưa ra lời khuyên chung chung kiểu sáo rỗng. Mọi đề xuất phải gắn với dữ kiện thực tế ngành.
- Tuyệt đối không suy diễn số liệu thị trường khi không có căn cứ.
- Giữ giọng văn khách quan, sắc bén, định hướng hành động.

[OUTPUT FORMAT]
Sử dụng bảng Markdown và cấu trúc đề mục rõ ràng:
# 1. BÁO CÁO PHÂN TÍCH SWOT
# 2. MA TRẬN KẾT HỢP CHIẾN LƯỢC (TOWS MATRIX)
# 3. KẾ HOẠCH HÀNH ĐỘNG 90 NGÀY (Gantt checklist)`
  },
  {
    id: 'preset-biz-5whys',
    title: 'Điều Tra Căn Nguyên Vấn Đề (Root Cause Analysis - 5 Whys)',
    category: 'business',
    framework: 'CRISPE',
    recommendedModel: 'gemini-3.8-flash',
    tags: ['RCA', 'Problem Solving', 'Quản trị vận hành'],
    description: 'Áp dụng phương pháp 5 Whys của Toyota để tìm ra gốc rễ vấn đề vận hành hoặc chất lượng sản phẩm.',
    prompt: `[ROLE & CONTEXT]
Bạn là Trưởng ban Cải tiến Vận hành (Lean Six Sigma Black Belt Master).

[TASK & INSTRUCTION]
Phân tích nguyên nhân gốc rễ cho sự cố/vấn đề sau:
Sự cố: {{van_de}}
Bối cảnh xảy ra: {{ngu_canh}}

Các bước phân tích:
1. Xác định hiện tượng bề mặt (Symptoms).
2. Triển khai chuỗi 5 câu hỏi "Tại sao?" liên hoàn, trong đó mỗi câu trả lời là căn cứ cho câu hỏi kế tiếp.
3. Chỉ ra nguyên nhân gốc rễ (Root Cause) ở tầng hệ thống hoặc quy trình (không đổ lỗi cá nhân).
4. Thiết lập cơ chế Poka-Yoke (Chống sai sót vĩnh viễn) và KPI đo lường.

[CONSTRAINTS & RULES]
- Không dừng lại ở các kết luận bề nổi (như "do nhân viên quên", "do mạng lag").
- Tập trung vào khiếm khuyết trong quy trình (Process Defect) và giám sát.

[OUTPUT FORMAT]
Trả về dạng chuỗi logic phân cấp và bảng giải pháp:
- Sơ đồ chuỗi 5 Whys
- Bảng giải pháp phòng ngừa (Phân loại: Ngay lập tức | Trung hạn | Dài hạn)`
  },

  // ==========================================
  // SOFTWARE ENGINEERING & ARCHITECTURE
  // ==========================================
  {
    id: 'preset-eng-sec-audit',
    title: 'Thẩm Tra An Toàn Mã Nguồn Chuyên Sâu (Security Code Audit)',
    category: 'engineering',
    framework: 'STANDARD-PRO',
    recommendedModel: 'gemini-3.1-pro-preview',
    tags: ['Security', 'OWASP Top 10', 'Code Audit', 'Vulnerability'],
    description: 'Quét lỗ hổng bảo mật, SQL Injection, XSS, RCE, Broken Auth và đề xuất bản vá code an toàn.',
    prompt: `[ROLE & CONTEXT]
Bạn là Kỹ sư Trưởng An toàn Thông tin (Staff Application Security Engineer) chuyên về kiểm thử xâm nhập (Pen-Testing) và DevSecOps.

[TASK & INSTRUCTION]
Thẩm tra toàn diện đoạn mã nguồn dưới đây:
Ngôn ngữ/Stack: {{ngon_ngu}}
Đoạn mã:
\`\`\`
{{ma_nguon}}
\`\`\`

Quy trình thẩm định:
1. Rà soát đối chiếu với danh mục OWASP Top 10 và CWE.
2. Chỉ ra các dòng code có nguy cơ bảo mật, phân loại mức độ nghiêm trọng: Critical, High, Medium, Low.
3. Mô tả kịch bản khai thác thực tế (Exploit Scenario / PoC).
4. Cung cấp đoạn mã đã sửa đổi an toàn (Patched Code) kèm giải thích cơ chế bảo vệ.

[CONSTRAINTS & RULES]
- Không chỉ bình luận lý thuyết; phải chỉ rõ lỗi ở dòng nào và đưa ra code thay thế chuẩn xác 100%.
- Giữ nguyên business logic của hàm ban đầu, chỉ vá các lỗ hổng bảo mật và xử lý ngoại lệ.

[OUTPUT FORMAT]
Báo cáo theo cấu trúc chuẩn CVE/Advisory:
- Tóm tắt rủi ro (Risk Summary Table)
- Chi tiết từng lỗ hổng (Vulnerability Deep-Dive & PoC)
- Đoạn mã sau khi vá an toàn (Patched Code Block)`
  },
  {
    id: 'preset-eng-clean-arch',
    title: 'Tái Cấu Trúc Mã Nguồn Chuẩn Clean Architecture & SOLID',
    category: 'engineering',
    framework: 'CRISPE',
    recommendedModel: 'gemini-3.8-flash',
    tags: ['Clean Architecture', 'SOLID', 'Refactor', 'Design Patterns'],
    description: 'Tách biệt Domain, Use Case, Interface Adapters, Infrastructure theo tiêu chuẩn Uncle Bob.',
    prompt: `[ROLE & CONTEXT]
Bạn là Kiến trúc sư Phần mềm Cấp cao (Principal Software Architect) với tư duy thiết kế Clean Architecture và Domain-Driven Design (DDD).

[TASK & INSTRUCTION]
Tái cấu trúc (Refactor) logic nghiệp vụ sau theo mô hình Clean Architecture:
Chức năng: {{chuc_nang}}
Ngôn ngữ: {{ngon_ngu}}
Mã nguồn hiện tại:
\`\`\`
{{ma_nguon}}
\`\`\`

Yêu cầu tái cấu trúc:
1. Tách bạch 4 tầng kiến trúc: Entities/Domain Models, Use Cases/Interactors, Repositories/Interfaces, Controllers/Adapters.
2. Đảm bảo tuân thủ nghiêm ngặt nguyên lý Dependency Inversion (Tầng trong không phụ thuộc tầng ngoài).
3. Viết code rõ ràng, type annotation đầy đủ, xử lý ngoại lệ tùy chỉnh (Custom Domain Exceptions).

[CONSTRAINTS & RULES]
- Không viết code gộp chung Database query vào Controller hoặc Use Case.
- Viết mã nguồn hoàn chỉnh có thể chạy được, không dùng comment viết tắt kiểu "// tự làm tiếp".

[OUTPUT FORMAT]
Trình bày cấu trúc thư mục dạng cây và các file code riêng biệt bằng code block.`
  },

  // ==========================================
  // COPYWRITING & MARKETING
  // ==========================================
  {
    id: 'preset-copy-b2b-cold',
    title: 'Chuỗi Email Tiếp Cận Doanh Nghiệp B2B Tỷ Lệ Mở 60%+',
    category: 'copywriting',
    framework: 'CO-STAR',
    recommendedModel: 'gemini-3.8-flash',
    tags: ['Cold Email', 'B2B', 'Sales Outreach', 'Copywriting'],
    description: 'Bộ chuỗi 3 email tiếp cận khách hàng doanh nghiệp B2B với hook đánh trúng nỗi đau và CTA tự nhiên.',
    prompt: `[ROLE & CONTEXT]
Bạn là Chuyên gia Tiếp thị B2B (Director of Demand Generation) từng giúp các công ty SaaS đạt tỷ lệ phản hồi email lạnh (Cold Email Reply Rate) trên 25%.

[TASK & INSTRUCTION]
Xây dựng chuỗi 3 email tiếp cận khách hàng lạnh cho sản phẩm: {{san_pham}}.
Đối tượng mục tiêu: {{doi_tuong}}
Vấn đề nhức nhối nhất của họ: {{noi_dau}}

Chi tiết 3 email:
- Email 1: The Insight Hook - Đi thẳng vào dữ kiện bất ngờ hoặc khoảng cách hiệu suất, dưới 100 từ.
- Email 2: The Social Proof - Bằng chứng cụ thể một khách hàng tương đồng đã giải quyết vấn đề ra sao (Case study 2 câu).
- Email 3: The Low-Friction Breakup - Trao quyền từ chối nhẹ nhàng, kèm 1 tài liệu giá trị cao.

[CONSTRAINTS & RULES]
- Tuyệt đối không dùng các từ ngữ spam: "Cơ hội có một không hai", "Độc quyền", "Ưu đãi sốc".
- Tiêu đề (Subject line) viết theo phong cách tự nhiên (dưới 5 từ, viết thường, như đồng nghiệp gửi cho nhau).
- Call-to-Action (CTA) không ép mua hàng mà chỉ xin 5 phút thảo luận hoặc kiểm tra tài liệu.

[OUTPUT FORMAT]
Hiển thị rõ Subject Line và Body cho từng Email 1, 2, 3.`
  },
  {
    id: 'preset-copy-landing-page',
    title: 'Kịch Bản Trang Bán Hàng Chuyển Đổi Cao (High-Converting Landing Page)',
    category: 'copywriting',
    framework: 'RTF',
    recommendedModel: 'gemini-3.1-pro-preview',
    tags: ['Landing Page', 'Conversion Rate', 'AIDA', 'Copywriting'],
    description: 'Xây dựng toàn bộ nội dung Landing page từ Hero Header, Pain Point, Solution đến Testimonials và FAQs.',
    prompt: `[ROLE & CONTEXT]
Bạn là Chuyên gia Tối ưu Tỷ lệ Chuyển đổi (Conversion Rate Optimization Copywriter).

[TASK & INSTRUCTION]
Viết toàn bộ nội dung Landing Page cho sản phẩm: {{san_pham}}
Giá bán/Mô hình: {{gia_ban}}
Lợi ích cốt lõi: {{loi_ich}}

Cấu trúc từng Section cần có:
1. HERO SECTION: Tiêu đề chính (H1 - Giá trị độc nhất), Tiêu đề phụ (H2), Nút CTA chính & Sub-text giảm rủi ro.
2. THE PAIN VALLEY: 3 thực trạng bức bối mà khách hàng đang phải chịu đựng hàng ngày.
3. THE SOLUTION MATRIX: Cơ chế giải quyết độc quyền (Mechanism of Action) khác biệt với thị trường.
4. SOCIAL PROOF & STATS: Khung số liệu thành tích và lời chứng thực.
5. FAQ ACCORDION: 4 câu hỏi thường gặp nhất xử lý toàn bộ sự nghi ngại về giá, bảo hành, thời gian triển khai.

[CONSTRAINTS & RULES]
- Giọng văn kích thích tâm lý tò mò và thuyết phục bằng logic + cảm xúc.
- Nêu bật ROI cụ thể thay vì chỉ liệt kê tính năng kỹ thuật.`
  },

  // ==========================================
  // MULTIMODAL AI (IMAGE / VIDEO / AUDIO)
  // ==========================================
  {
    id: 'preset-multi-midjourney-v6',
    title: 'Prompt Tạo Ảnh Siêu Thực Midjourney v6 / Flux.1',
    category: 'multimodal',
    framework: 'STANDARD-PRO',
    recommendedModel: 'gemini-3.8-flash',
    tags: ['Midjourney v6', 'Flux.1', 'Photorealism', 'Cinematic Lighting'],
    description: 'Thiết lập đầy đủ thông số máy ảnh chuyên nghiệp, tiêu cự, khẩu độ, ánh sáng và tham số tỷ lệ khung hình.',
    prompt: `[ROLE & CONTEXT]
Bạn là Đạo diễn Hình ảnh (Director of Photography - DoP) và Nghệ sĩ Prompt AI đoạt giải thưởng nhiếp ảnh thế giới.

[TASK & INSTRUCTION]
Tạo câu prompt tạo ảnh chân dung hoặc phong cảnh siêu thực theo mô tả:
Chủ đề: {{chu_de}}
Không gian/Bối cảnh: {{khong_gian}}
Tâm trạng/Phong cách: {{phong_cach}}

Yêu cầu kỹ thuật bắt buộc:
1. Mô tả chi tiết chủ thể (Texture da, ánh mắt, vi mô sợi tóc, trang phục).
2. Thiết lập máy ảnh và lens cụ thể (ví dụ: Hasselblad H6D-100c, 85mm f/1.2 lens, shallow depth of field).
3. Thiết lập nguồn sáng (Volumetric rim lighting, Golden hour dusk, Chiaroscuro contrast).
4. Khung Negative Prompt chuyên dụng chống lỗi bàn tay, biến dạng mắt, da nhựa bóng giả tạo.
5. Tham số đuôi: \`--ar 16:9 --style raw --v 6.0 --q 2\`.

[OUTPUT FORMAT]
- Prompt Tiếng Anh Chuẩn (Sẵn sàng copy vào Midjourney/Flux)
- Khung Negative Prompt
- Bảng giải thích các tham số quang học đã chọn`
  },
  {
    id: 'preset-multi-sora-video',
    title: 'Prompt Chỉ Đạo Góc Quay Video Điện Ảnh (Sora / Kling / Runway Gen-3)',
    category: 'multimodal',
    framework: 'STANDARD-PRO',
    recommendedModel: 'gemini-3.8-flash',
    tags: ['Video AI', 'Sora', 'Runway Gen-3', 'Camera Movement', 'Kling'],
    description: 'Chỉ đạo chuyển động camera 3D, tốc độ khung hình, ánh sáng động và vật lý chuyển động cho video AI.',
    prompt: `[ROLE & CONTEXT]
Bạn là Đạo diễn Điện ảnh Hollywood (Film Director) chuyên về kỹ xảo CGI và chuyển động máy quay.

[TASK & INSTRUCTION]
Viết câu prompt chỉ đạo video điện ảnh cho mô hình Video AI (Sora, Runway Gen-3 Alpha, Kling AI):
Ý tưởng cảnh quay: {{canh_quay}}
Thời lượng dự kiến: {{thoi_luong}}
Tốc độ chuyển động: {{toc_do}}

Các thành phần cần chi tiết hóa:
1. Camera Motion: Chỉ định rõ loại chuyển động (Dolly zoom, Pan left to right, Drone FPV descending, Orbital shot 360).
2. Dynamic Lighting: Sự thay đổi ánh sáng theo thời gian trong video (ví dụ: tia nắng xuyên qua khói sương khi camera di chuyển).
3. Physics & Atmosphere: Chuyển động của hạt bụi, gió thổi bay tóc, sóng nước phản chiếu chân thực.
4. Technical Parameters: 60fps, 4K resolution, cinematic motion blur, 35mm anamorphic aspect ratio.

[OUTPUT FORMAT]
- Full English Cinematic Video Prompt
- Camera Direction Breakdown (Dòng thời gian chuyển động)`
  },

  // ==========================================
  // DEEP RESEARCH & SYNTHESIS
  // ==========================================
  {
    id: 'preset-res-paper-critique',
    title: 'Phản Biện & Đánh Giá Bài Báo Khoa Học (Academic Paper Critique)',
    category: 'research',
    framework: 'CO-STAR',
    recommendedModel: 'gemini-3.1-pro-preview',
    tags: ['Research', 'Academic', 'Peer Review', 'Methodology'],
    description: 'Thẩm định phương pháp luận, cỡ mẫu, độ tin cậy thống kê và đóng góp mới của bài báo khoa học.',
    prompt: `[ROLE & CONTEXT]
Bạn là Tổng biên tập Tạp chí Khoa học hàng đầu (Peer Reviewer for Nature / Science) chuyên ngành {{chuyen_nganh}}.

[TASK & INSTRUCTION]
Thực hiện phản biện học thuật cho bài báo/đề tài sau:
Tên bài báo / Luận điểm chính: {{luan_diem}}
Phương pháp nghiên cứu sử dụng: {{phuong_phap}}

Nội dung phản biện:
1. Tóm lược đóng góp mới (Novel Contribution).
2. Đánh giá phương pháp luận: Thiết kế thí nghiệm có thiên lệch không? Cỡ mẫu có đủ độ mạnh thống kê (Statistical Power)? Biến kiểm soát có chặt chẽ?
3. Phân tích lỗ hổng lập luận (Logical Fallacies) hoặc kết luận thái quá vượt ngoài dữ liệu.
4. Đề xuất 3 hướng nghiên cứu tiếp theo để mở rộng kết quả.

[CONSTRAINTS & RULES]
- Duy trì chuẩn mực học thuật khắt khe, công tâm.
- Dẫn chiếu nguyên tắc khoa học và tiêu chuẩn kiểm định giả thuyết p-value, effect size.`
  }
];
