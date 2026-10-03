# 🚀 LPrompt Studio - Universal Prompt Engineering & PromptOps IDE

> **LPrompt Studio** là nền tảng máy bàn và web chuyên dụng cho kỹ sư Prompt và lập trình viên. Ứng dụng tích hợp bộ máy thẩm định điểm số chuẩn 100 điểm đa ngôn ngữ (Việt - Anh), phân tích thiếu sót và **phân hệ chuyên biệt đưa sang Google Gemini Pro để chỉnh sửa, tái cấu trúc toàn diện prompt lên chuẩn Production-Ready (95 - 100 điểm)**.

![LPrompt Studio Banner](https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge)
![Gemini AI](https://img.shields.io/badge/AI_Engine-Google_Gemini_Pro_%2F_Flash-4285F4?style=for-the-badge&logo=google)
![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

---

## 🌟 Tính Năng Cốt Lõi Mới Nhất

### 1. Phân Hệ Tối Ưu Hóa Chuyên Biệt Với Gemini Pro (Optimizer Studio)
* **Gửi Sang Gemini Pro Để Chỉnh Sửa:** Đưa prompt thô ban đầu sang Gemini Pro để phân tích ngữ nghĩa sâu và tái cấu trúc thành prompt chuẩn công nghiệp.
* **Bộ Chọn Mục Tiêu Tối Ưu (Optimization Goals):**
  * 🚀 *Chuẩn Production (95–100đ):* Tự động bổ sung đầy đủ 5 trụ cột kỹ thuật.
  * 🛡️ *Thêm Rào Chắn Lỗi (Negative Rules & Guardrails):* Triệt tiêu ảo giác, chống suy diễn sai lệch.
  * 📐 *Ép Schema Đầu Ra (Strict JSON / Markdown Bảng):* Định dạng chuẩn cho lập trình và trích xuất dữ liệu.
  * 🔬 *Tư Duy Logic Từng Bước (CoT Reasoning):* Phân rã bài toán phức tạp theo từng pha.
  * 🎨 *Tối Ưu Tham Số Chuyên Ngành:* Ánh sáng, lens máy ảnh, góc quay video, tech stack code.
* **4 Khung Prompt Chuẩn Quốc Tế:** `CO-STAR`, `CRISPE`, `RTF`, `STANDARD-PRO`.
* **Chỉ Thị Tùy Biến Bổ Sung:** Người dùng có thể yêu cầu riêng cho Gemini Pro (ví dụ: *"Dịch sang tiếng Anh chuẩn Oxford", "Thêm ví dụ JSON thực tế", "Rút gọn dưới 150 từ"*).
* **Bảng So Sánh Đối Chiếu Song Song (Split Comparison View):** Đối chiếu trực quan giữa **Bản Gốc (Điểm cũ)** và **Bản Đã Sửa Đổi (Điểm mới 95–100đ)**.
* **Báo Cáo Tinh Chỉnh (Audit Log):** Giải thích chi tiết các yếu tố đã thêm/sửa và nguyên nhân tại sao bản mới giúp AI phản hồi chính xác hơn 300%.
* **Vòng Lặp Tinh Chỉnh Tương Tác (Interactive Refinement):** Hỗ trợ chat bổ sung để Gemini Pro tiếp tục sửa đổi đến khi ưng ý.

---

### 2. Bộ Quy Tắc Chấm Điểm 100 Điểm Song Ngữ (Bilingual Scoring Rubric)
Bộ thẩm định hỗ trợ toàn diện **Tiếng Việt, Tiếng Anh và Thẻ tiền tố Kỹ thuật (`[ROLE]`, `[TASK]`, `[CONSTRAINTS]`, `[OUTPUT FORMAT]`, `[PARAMETERS]`)**:

```
[Tổng điểm: 100]
├── C1: [ROLE & CONTEXT] - Vai trò & Ngữ cảnh (20đ)
│   ├── Nhận diện: [ROLE], [PERSONA], "Bạn là...", "You are...", "Act as Senior...", bối cảnh bài toán.
├── C2: [TASK & INSTRUCTION] - Nhiệm vụ & Chỉ dẫn thực thi (25đ)
│   ├── Nhận diện: [TASK], [STEPS], động từ hành động ("Implement", "Analyze", "Viết..."), các bước 1, 2.
├── C3: [CONSTRAINTS & RULES] - Ràng buộc & Điều cấm kỵ (20đ)
│   ├── Nhận diện: [NEGATIVE PROMPT], [CONSTRAINTS], "Do not", "Không được", "lowres", "bad anatomy"...
├── C4: [OUTPUT FORMAT] - Định dạng đầu ra mong muốn (20đ)
│   ├── Nhận diện: [OUTPUT FORMAT], [SCHEMA], JSON, Markdown table, Code block, "Only return", "Không chào hỏi"...
└── C5: [EXAMPLES & SPECS] - Ví dụ mẫu & Tham số chuyên ngành (15đ)
    └── Nhận diện: Few-shot samples, lens 85mm, lighting, --ar 16:9, fps, python 3.12, clean architecture, [Verse].
```

#### Bảng Xếp Hạng Chất Lượng:
| Khoảng điểm | Phân cấp | Màu sắc | Đánh giá & Khả năng vận hành |
| :--- | :--- | :--- | :--- |
| **90 - 100** | **Xuất sắc (Production-Ready)** | 🟢 Xanh lục | Đầy đủ vai trò, ngữ cảnh, ràng buộc, cấu trúc output. AI chạy chuẩn xác ngay lượt đầu. |
| **75 - 89** | **Khá (Good / Refinable)** | 🔵 Xanh dương | Khá rõ ràng, chỉ thiếu 1-2 yếu tố nhỏ (ví dụ vài quy tắc cấm kỵ hoặc ví dụ mẫu). |
| **50 - 74** | **Trung bình (Fair / Needs Work)** | 🟡 Vàng cam | Còn chung chung, AI dễ suy diễn lan man hoặc trả lời thừa thãi. |
| **Dưới 50** | **Yếu (Poor / Ambiguous)** | 🔴 Đỏ | Mơ hồ, thiếu định hướng kỹ thuật nghiêm trọng. |

---

### 3. Hỗ Trợ 5 Phân Hệ Đa Phương Thức (Multimodal Prompting)
- 🧠 **Nghiên Cứu & LLM:** Lập luận chuyên sâu, khung phân tích SWOT/Rủi ro, Mermaid diagrams.
- 🎨 **Tạo Ảnh (Flux / Midjourney / SD):** Bảng chọn tỷ lệ ảnh (`16:9`, `1:1`, `9:16`, `21:9`), Lens tiêu cự, Ánh sáng Cinematic, nút chèn khung Negative Prompt 1-Click.
- 🎬 **Tạo Video (Sora / Kling / Runway Gen-3 / Luma):** Chuyển động camera (Dolly, Pan, Tilt, FPV), Motion speed slider, 60fps 4K specs.
- 💻 **Lập Trình & Code:** Hỗ trợ Python 3.12, TypeScript, Go, Rust; tích hợp yêu cầu Clean Architecture, Pydantic V2, Pytest/Jest.
- 🎵 **Âm Thanh & Nhạc (Suno / Udio):** Thẻ cấu trúc bài hát `[Verse]`, `[Chorus]`, `[Guitar Solo]`, nhịp BPM, thể loại nhạc.

---

### 4. Khởi Chạy 1-Click Tiện Lợi (Windows Desktop & Batch)
* **Khởi chạy từ Desktop:** Nhấp đúp chuột vào biểu tượng **`LPrompt Studio`** trên màn hình chính Desktop.
* **Khởi chạy từ thư mục:** Chạy file [`Run_LPrompt.bat`](file:///d:/DevV2/LPrompt/Run_LPrompt.bat).
* 👉 Script tự động kiểm tra thư viện `npm install`, khởi động dev server và **tự động mở trình duyệt** tại `http://localhost:5173`.

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
