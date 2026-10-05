# 🚀 LPrompt Studio - Universal Prompt Engineering & PromptOps IDE

> **LPrompt Studio** là nền tảng máy bàn và web chuyên nghiệp dành cho kỹ sư Prompt (Prompt Engineer) và lập trình viên AI. Ứng dụng tích hợp bộ máy thẩm định điểm số chuẩn 100 điểm song ngữ (Việt - Anh), phân tích thiếu sót kỹ thuật, **phân hệ chuyên biệt đưa sang Google Gemini Pro để tối ưu hóa toàn diện prompt lên chuẩn Production-Ready (95 - 100 điểm)**, cùng bộ công cụ PromptOps toàn diện:
> - **v2.0 (Mới nhất):** Batch Evaluation & Test Suite Matrix (chuẩn promptfoo/Langfuse), DSPy-style Auto Few-Shot Synthesizer, Fabric-Style Presets Hub.
> - **v1.2:** Git-Style Versioning & 1-Click Rollback, Word-Level Visual Diff Highlighter, Red-Teaming Security Scanner (OWASP LLM Top 10) & Auto-Patch Guardrails.
> - **v1.1:** Live Execution Playground, Template Engine `{{variable}}`, Multi-SDK 1-Click Exporter (Python, TypeScript, cURL, JSON).

![LPrompt Studio Banner](https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-v2.0_Batch_Evals_%26_Few--Shot-indigo?style=for-the-badge)
![AI Engine](https://img.shields.io/badge/AI_Engine-Google_Gemini_Pro_%2F_Flash-4285F4?style=for-the-badge&logo=google)
![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

---

## 🌟 Tính Năng Đột Phá Trong Phiên Bản v2.0

### 1. Batch Evaluation & Test Suite Matrix (Kiểm Thử Hàng Loạt Chuẩn promptfoo / Langfuse)
* **Kiểm Thử Định Lượng Nhiều Trường Hợp Cùng Lúc:** Không chỉ test 1 trường hợp đơn lẻ, bạn có thể thiết lập tập dữ liệu (Dataset Matrix) gồm nhiều bộ biến `{{variable}}` khác nhau.
* **4 Quy Tắc Thẩm Định (Assertion Rules):**
  * 🔤 **Contains:** Kiểm tra kết quả có chứa từ khóa hoặc cấu trúc kỳ vọng.
  * 🚫 **Not Contains:** Kiểm tra kết quả không vi phạm điều cấm (ví dụ: không chứa từ chối, không suy diễn).
  * 🧩 **Regex:** Khớp biểu thức chính quy phức tạp (ví dụ: kiểm tra định dạng email, mã code, cú pháp Markdown).
  * 📏 **Min Length:** Đảm bảo độ sâu chi tiết của câu trả lời đạt số ký tự tối thiểu.
* **Bảng Ma Trận & Thống Kê Công Nghiệp:**
  * 📊 **Tỷ lệ vượt qua (Pass Rate %):** Đánh giá độ ổn định của prompt trên quy mô lớn.
  * ⚡ **Độ trễ trung bình (Avg Latency ms):** Đo lường hiệu năng phản hồi trên từng case.
  * 📑 **Bảng kết quả chi tiết:** Trạng thái ✅ PASS / ❌ FAIL, lý do chi tiết và nội dung AI trả về thực tế.
  * 💾 **1-Click Xuất Báo Cáo:** Xuất toàn bộ kết quả ra file JSON phục vụ lưu trữ hoặc tích hợp CI/CD.

### 2. DSPy-Style Auto Few-Shot Synthesizer (Tự Động Sinh Cặp Mẫu Vàng)
* **Tổng Hợp Mẫu Vàng Tự Động:** Dựa trên nguyên lý của thư viện Stanford DSPy, Gemini Pro tự động phân tích nhiệm vụ và các biến trong prompt để tạo ra 2–3 cặp Input/Output mẫu chất lượng cao (Golden Examples).
* **Grounding & Triệt Tiêu Ảo Giác:** Các ví dụ Few-Shot giúp mô hình AI hiểu sâu sắc schema đầu ra, phong cách lập luận và các điều kiện biên (Edge Cases).
* **Tùy Biến Linh Hoạt & 1-Click Tích Hợp:** Cho phép chỉnh sửa từng cặp Input/Output và nhấp nút **"Gắn Few-Shot Vào Prompt"** để tự động đạt điểm tuyệt đối 15/15đ cho trụ cột C5 (`[EXAMPLES & SPECS]`).

### 3. Fabric-Style Presets Hub (Kho Mẫu Chuyên Sâu Tích Hợp Sẵn)
* **Kho Mẫu Chuẩn Quốc Tế:** Lấy cảm hứng từ triết lý mẫu của Daniel Miessler Fabric và Awesome-Prompts, tích hợp sẵn các prompt giải quyết bài toán phức tạp trong thực tế:
  * 📊 **Kinh Doanh & Chiến Lược:** Phân tích SWOT & Ma trận TOWS, Điều tra nguyên nhân gốc rễ 5-Whys, OKR Breakdown.
  * 💻 **Kỹ Thuật & Code:** Thẩm tra an toàn mã nguồn (OWASP Security Audit), Tái cấu trúc Clean Architecture & SOLID, OpenAPI Spec Generator.
  * ✍️ **Copywriting & Marketing:** Chuỗi Cold Email B2B tỷ lệ mở 60%+, Kịch bản High-Converting Landing Page, SEO Content Pillar.
  * 🎨 **Đa Phương Thức:** Prompt Midjourney v6/Flux siêu thực đầy đủ lens máy ảnh và ánh sáng, Prompt chỉ đạo camera video Sora/Kling/Runway Gen-3.
  * 🔬 **Nghiên Cứu & Học Thuật:** Phản biện bài báo khoa học (Academic Paper Critique), Phân tích bằng sáng chế.
* **Bộ Lọc Đa Năng & 1-Click Tải:** Tìm kiếm theo từ khóa, lọc theo danh mục, xem trước prompt và đưa thẳng vào Workspace để tối ưu hoặc chạy thử.

---

## 🛡️ Tính Năng v1.2 (PromptOps, Versioning & Security)

### 4. Git-Style Version Control & 1-Click Rollback
* **Quản Lý Vòng Đời Prompt:** Đánh số phiên bản (`v1.0`, `v1.1`, `v2.0`...) kèm commit message, điểm số chất lượng và timestamp.
* **Phân Tầng Giai Đoạn:** 📝 Draft (Nháp) ➔ 🧪 Testing (Thử nghiệm) ➔ 🚀 Production (Chạy thật).
* **1-Click Rollback:** Phục hồi tức thì nội dung bất kỳ phiên bản nào trong quá khứ mà không làm mất lịch sử các phiên bản khác.

### 5. Visual Diff Highlighter (So Sánh Trực Quan Từng Từ)
* **Thuật Toán LCS:** Đánh dấu rõ ràng thêm mới (`+` xanh lục) và xóa bỏ (`-` đỏ gạch ngang).
* **2 Chế Độ Xem:** Inline Diff (dòng liên tục) và Side-by-Side Split View (hai cột song song).

### 6. Red-Teaming Security Scanner & Auto-Patch Guardrails
* **Thẩm định an toàn OWASP LLM Top 10:** Quét Prompt Injection, System Prompt Leakage, Hallucination và Persona Override.
* **1-Click Auto-Patch Guardrails:** Tự động chèn các rào chắn kỹ thuật kiên cố vào cuối prompt để chống chọi tức thì với các đòn tấn công.

---

## ⚡ Tính Năng v1.1 (Playground, Template & Code Exporter)

### 7. Live Execution Playground
* Chạy thử prompt thực tế qua Gemini API; đo lường chính xác độ trễ (Latency ms), thống kê Token (Input/Output/Total) và ước tính chi phí USD ($).

### 8. Bộ Xử Lý Biến Động & Template Engine (`{{variable}}`)
* Tự động quét cú pháp `{{ten_bien}}`, sinh form nhập liệu trực quan và nội suy thời gian thực khi chạy thử nghiệm hoặc xuất code.

### 9. Xuất Mã Nguồn SDK 1-Click
* Chuyển đổi prompt thành mã nguồn hoàn chỉnh: 🐍 **Python** (`google-genai`), 🔷 **TypeScript** (`@google/genai`), 💻 **cURL**, 📄 **JSON Spec**.

---

## 💎 Các Tính Năng Cốt Lõi Khác

### 10. Phân Hệ Tối Ưu Hóa Chuyên Biệt Với Gemini Pro (Optimizer Studio)
* Đưa prompt thô ban đầu sang Gemini Pro để phân tích ngữ nghĩa sâu và tái cấu trúc thành prompt chuẩn công nghiệp.
* Bộ chọn mục tiêu: Production 100đ, Negative Guardrails, Strict JSON Schema, CoT Reasoning, Tham số chuyên ngành.
* 4 Khung Kỹ thuật: `CO-STAR`, `CRISPE`, `RTF`, `STANDARD-PRO`.

### 11. Bộ Quy Tắc Chấm Điểm 100 Điểm Song Ngữ (Bilingual Scoring Rubric)
```
[Tổng điểm: 100]
├── C1: [ROLE & CONTEXT] - Vai trò & Ngữ cảnh (20đ)
├── C2: [TASK & INSTRUCTION] - Nhiệm vụ & Chỉ dẫn thực thi (25đ)
├── C3: [CONSTRAINTS & RULES] - Ràng buộc & Điều cấm kỵ (20đ)
├── C4: [OUTPUT FORMAT] - Định dạng đầu ra mong muốn (20đ)
└── C5: [EXAMPLES & SPECS] - Ví dụ mẫu & Tham số chuyên ngành (15đ)
```

---

## 🛠️ Hướng Dẫn Cài Đặt Thủ Công

```bash
# 1. Clone repository
git clone https://github.com/linhVincons-ME/LPrompt.git
cd LPrompt

# 2. Cài đặt thư viện
npm install

# 3. Khởi động môi trường phát triển
npm run dev

# 4. Build sản phẩm production
npm run build
```

Mở trình duyệt tại: `http://localhost:5173`

---

## 🔒 Bảo Mật & Mô Hình BYOK (Bring Your Own Key)
* Người dùng tự nhập Google Gemini API Key lấy miễn phí từ [Google AI Studio](https://aistudio.google.com/apikey).
* Khóa API chỉ lưu duy nhất trong `localStorage` trên máy người dùng, không bao giờ gửi về máy chủ thứ ba.
* Hỗ trợ chuyển đổi giữa **`gemini-2.0-flash` (Khuyên dùng - Miễn phí 1.500 lượt/ngày, tốc độ <1s)** và **`gemini-1.5-pro` (Suy luận chuyên sâu)**.

---

## 📖 Tài Liệu Hướng Dẫn Chi Tiết
Xem toàn bộ hướng dẫn sử dụng chi tiết từng bước tại file: [HUONG_DAN_SU_DUNG.md](HUONG_DAN_SU_DUNG.md).

---

## 📄 Giấy Phép (License)
Dự án được phân phối theo giấy phép [MIT License](LICENSE).
