# 🚀 LPrompt Studio - Universal Prompt Engineering & PromptOps IDE

> **LPrompt Studio** là nền tảng máy bàn/web chuyên dụng cho kỹ sư Prompt và lập trình viên. Ứng dụng tích hợp bộ máy thẩm định điểm số chuẩn 100 điểm, tự động phân tích thiếu sót và nâng cấp prompt lên chuẩn **Production-Ready (95-100 điểm)** bằng động cơ **Google Gemini (Flash / Pro)** hoặc động cơ **Heuristic Cục Bộ 0đ**.

![LPrompt Studio Banner](https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge)
![Gemini AI](https://img.shields.io/badge/AI_Engine-Google_Gemini-4285F4?style=for-the-badge&logo=google)
![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

---

## 🌟 Tính Năng Nổi Bật

### 1. Thẩm Định Đa Lớp: Cục Bộ (0đ) & Gemini AI Engine
- **Bộ Chấm Điểm Nhanh Cục Bộ (0đ / 0ms):** Sử dụng Heuristic & Biểu thức chính quy (Regex) quét ngay trên trình duyệt mà không tốn bất kỳ chi phí API nào.
- **Đại Tu Chuyên Sâu với Gemini:** Kết nối trực tiếp Google Gemini API (`gemini-2.0-flash` miễn phí 1.500 lượt/ngày hoặc `gemini-1.5-pro`) để đại tu prompt thành phiên bản 95-100 điểm với cấu trúc chuyên sâu.
- **Mô hình BYOK (Bring Your Own Key):** Người dùng tự nhập API Key lấy miễn phí từ [Google AI Studio](https://aistudio.google.com/apikey). Dữ liệu chỉ lưu trong `localStorage` cá nhân, bảo mật tuyệt đối.

### 2. Thang Đo 100 Điểm & Tiền Tố Chuẩn Hóa
Đánh giá theo 5 trụ cột kỹ thuật:
- **`[ROLE & CONTEXT]` Vai trò & Ngữ cảnh (20đ):** Định danh chuyên gia, bối cảnh thực tế của bài toán.
- **`[TASK & INSTRUCTION]` Nhiệm vụ & Chỉ dẫn (25đ):** Mệnh lệnh hành động, phân rã CoT (Chain-of-Thought) từng bước.
- **`[CONSTRAINTS & RULES]` Ràng buộc & Điều cấm (20đ):** Negative constraints, giới hạn độ dài, phong cách.
- **`[OUTPUT FORMAT]` Định dạng đầu ra (20đ):** JSON Schema, Markdown table, cấu trúc thẻ, code block.
- **`[EXAMPLES & SPECS]` Ví dụ & Tham số chuyên ngành (15đ):** Few-shot samples, tỷ lệ `--ar`, lens máy ảnh, tech stack.

### 3. Hỗ Trợ 5 Phân Hệ Đa Phương Thức (Multimodal Prompting)
- 🧠 **Nghiên Cứu & LLM:** Lập luận chuyên sâu, khung phân tích SWOT/Rủi ro, Mermaid diagrams.
- 🎨 **Tạo Ảnh (Flux / Midjourney / SD):** Bảng chọn tỷ lệ ảnh (`16:9`, `1:1`, `9:16`, `21:9`), Lens tiêu cự, Ánh sáng Cinematic, khung Negative Prompt 1-Click.
- 🎬 **Tạo Video (Sora / Kling / Runway Gen-3 / Luma):** Chuyển động camera (Dolly, Pan, Tilt, FPV), Motion speed slider, 60fps 4K specs.
- 💻 **Lập Trình & Code:** Hỗ trợ Python 3.12, TypeScript, Go, Rust; tích hợp yêu cầu Clean Architecture, Pydantic V2, Pytest/Jest.
- 🎵 **Âm Thanh & Nhạc (Suno / Udio):** Thẻ cấu trúc bài hát `[Verse]`, `[Chorus]`, `[Guitar Solo]`, nhịp BPM, thể loại nhạc.

### 4. Kho Lưu Trữ Prompt & Xuất Bản
- Lưu trữ các bản prompt tối ưu vào bộ nhớ máy tính.
- Tìm kiếm, lọc theo domain, xuất file JSON để chia sẻ hoặc tích hợp vào hệ thống khác.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Trên Local

### Yêu cầu:
- Node.js >= 18.x (khuyên dùng Node 20+)
- npm hoặc pnpm / yarn

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

## 📋 Thang Điểm Chất Lượng

| Khoảng điểm | Phân cấp | Màu sắc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **90 - 100** | **Xuất sắc (Production-Ready)** | 🟢 Xanh lục | Prompt hoàn chỉnh, đầy đủ bối cảnh, format, ràng buộc và thông số kỹ thuật. |
| **75 - 89** | **Khá (Good / Refinable)** | 🔵 Xanh dương | Tương đối rõ ràng, chỉ thiếu 1-2 ràng buộc hoặc ví dụ mẫu. |
| **50 - 74** | **Trung bình (Fair / Needs Work)** | 🟡 Vàng cam | Còn chung chung, dễ khiến AI trả lời lan man hoặc sai lệch. |
| **Dưới 50** | **Yếu (Poor / Ambiguous)** | 🔴 Đỏ | Mơ hồ, thiếu định hướng kỹ thuật nghiêm trọng. |

---

## 🔒 Bản Quyền & Giấy Phép
Phát triển bởi đội ngũ kỹ sư Prompt & AI Full-stack. Dự án mở nguồn theo giấy phép [MIT](LICENSE).
