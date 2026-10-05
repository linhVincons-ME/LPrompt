# 🚀 LPrompt Studio - Universal Prompt Engineering & PromptOps IDE

> **LPrompt Studio** là nền tảng máy bàn và web chuyên nghiệp dành cho kỹ sư Prompt (Prompt Engineer) và lập trình viên AI. Ứng dụng tích hợp bộ máy thẩm định điểm số chuẩn 100 điểm song ngữ (Việt - Anh), phân tích thiếu sót kỹ thuật, **phân hệ chuyên biệt đưa sang Google Gemini Pro để tối ưu hóa toàn diện prompt lên chuẩn Production-Ready (95 - 100 điểm)**, cùng bộ công cụ PromptOps toàn diện:
> - **v2.5 (Mới nhất):** Local Background Service (Daemon port 8484), Portable Embedded SQLite Database (`data/lprompt.db`), Model Context Protocol (MCP) Server cho Cursor & Claude Desktop, Silent VBS Launcher.
> - **v2.0:** Batch Evaluation & Test Suite Matrix (chuẩn promptfoo/Langfuse), DSPy-style Auto Few-Shot Synthesizer, Fabric-Style Presets Hub.
> - **v1.2:** Git-Style Versioning & 1-Click Rollback, Word-Level Visual Diff Highlighter, Red-Teaming Security Scanner (OWASP LLM Top 10) & Auto-Patch Guardrails.
> - **v1.1:** Live Execution Playground, Template Engine `{{variable}}`, Multi-SDK 1-Click Exporter (Python, TypeScript, cURL, JSON).

![LPrompt Studio Banner](https://img.shields.io/badge/Status-Production--Ready-emerald?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-v2.5_Local_Service_%26_Embedded_SQLite-indigo?style=for-the-badge)
![AI Engine](https://img.shields.io/badge/AI_Engine-Google_Gemini_Pro_%2F_Flash-4285F4?style=for-the-badge&logo=google)
![Database](https://img.shields.io/badge/Database-Embedded_SQLite_3-003B57?style=for-the-badge&logo=sqlite)
![Protocol](https://img.shields.io/badge/Protocol-Model_Context_Protocol_(MCP)-8A2BE2?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

---

## 🌟 Tính Năng Đột Phá Trong Phiên Bản v2.5 (Local Service & Embedded SQLite)

### 1. 🗄️ Portable Embedded Database (`data/lprompt.db`)
* **Lưu Trữ Nhúng Trực Tiếp Trong Ứng Dụng:** Cơ sở dữ liệu SQLite nằm ngay tại thư mục dự án (`d:\DevV2\LPrompt\data\lprompt.db`) thay vì ổ `C:\Users\...`.
* **Miễn Nhiễm Với Sự Cố Cài Lại Windows:** Khi Windows bị lỗi hoặc format ổ C:, toàn bộ kho prompt, lịch sử phiên bản và cấu hình trên ổ D: vẫn **nguyên vẹn 100%**.
* **Tính Cơ Động Tuyệt Đối (100% Portable):** Bạn có thể copy cả thư mục LPrompt sang máy khác hoặc USB, cắm vào là chạy ngay với đầy đủ dữ liệu.
* **Tự Động Sao Lưu Dự Phòng (Auto-Backup Snapshots):** Mỗi ngày service tự tạo một bản snapshot sao lưu JSON trong thư mục `data/backups/`.

### 2. ⚡ Local Background Service (PromptOps Daemon trên cổng 8484)
* **Chạy Ngầm Siêu Nhẹ:** Tiêu thụ cực ít tài nguyên (**~25MB - 60MB RAM**), khởi động tức thì trong 0.1 giây.
* **REST API Gateway Mở:** Cung cấp các endpoint nội bộ cho mọi công cụ, script Python, terminal hoặc extension gọi vào:
  * `GET/POST /api/prompts`: Quản lý kho prompt trong SQLite.
  * `GET/POST /api/versions`: Quản lý các mốc phiên bản Git-style.
  * `GET /api/presets`: Lấy danh mục prompt từ Presets Hub.
  * `POST /api/backup`: Kích hoạt sao lưu tức thì.
  * `GET /health`: Kiểm tra trạng thái service và tài nguyên.
* **Web Serving Trực Tiếp:** Service phục vụ thẳng giao diện Studio tại `http://localhost:8484`.

### 3. 🔌 Model Context Protocol (MCP) Server Tích Hợp
* Hỗ trợ chuẩn kết nối **MCP (Model Context Protocol)** của Anthropic.
* **Tích Hợp Sâu Vào Cursor, Claude Desktop, Antigravity:** Cho phép các AI Assistant gọi trực tiếp vào LPrompt Service như một tool:
  * `lprompt_evaluate`: Thẩm định chất lượng prompt theo thang điểm 100.
  * `lprompt_list_presets`: Tìm kiếm và nạp prompt chuyên sâu theo ngành.
  * `lprompt_get_versions`: Tra cứu lịch sử phiên bản prompt trong database.
  * `lprompt_commit_version`: Commit phiên bản mới vào SQLite.

### 4. 🤫 Silent Windows Launcher (Không Hiện Cửa Sổ Console)
* **`Start_LPrompt_Service.vbs`:** Khởi chạy service ngầm hoàn toàn tĩnh lặng, không có cửa sổ đen CMD chắn màn hình.
* **`Run_LPrompt_Service.bat`:** Tự động build, kích hoạt service và mở ngay trình duyệt tại `http://localhost:8484`.
* **`Stop_LPrompt_Service.bat`:** 1-Click dừng service giải phóng cổng 8484 khi không sử dụng.

---

## 🚀 Tính Năng v2.0 (Batch Evaluation, DSPy Few-Shot & Presets Hub)

### 5. Batch Evaluation & Test Suite Matrix (Kiểm Thử Hàng Loạt Chuẩn promptfoo / Langfuse)
* Thử nghiệm đồng thời hàng chục bộ biến `{{variable}}` với 4 quy tắc kiểm tra: `Contains`, `Not Contains`, `Regex`, `Min Length`.
* Báo cáo chỉ số: Tỷ lệ thành công (Pass Rate %), Độ trễ trung bình (Avg Latency ms), xuất file kết quả JSON.

### 6. DSPy-Style Auto Few-Shot Synthesizer
* Tự động sinh 2–3 cặp Input/Output mẫu chuẩn vàng (Golden Examples) gắn vào prompt (+15đ C5), giúp LLM bám sát schema và triệt tiêu ảo giác.

### 7. Fabric-Style Presets Hub
* Kho mẫu prompt chuẩn quốc tế phân theo 5 ngành: Kinh Doanh & Chiến Lược, Lập Trình & Bảo Mật, Copywriting B2B, Đa Phương Thức (Ảnh/Video), Nghiên Cứu Khoa Học.

---

## 🛡️ Tính Năng v1.2 (PromptOps, Versioning & Security)

### 8. Git-Style Version Control & 1-Click Rollback
* Quản lý mốc phiên bản (`v1.0`, `v1.1`, `v2.0`...) kèm commit message, stage (Draft/Testing/Production) và phục hồi tức thì với 1-Click Rollback.

### 9. Visual Diff Highlighter (So Sánh Trực Quan Từng Từ)
* Thuật toán LCS so sánh từng từ: Xanh lá (`+`) thêm mới, Đỏ gạch ngang (`-`) loại bỏ; hỗ trợ Inline Diff và Split View.

### 10. Red-Teaming Security Scanner & Auto-Patch Guardrails
* Quét lỗ hổng OWASP LLM Top 10 (Injection, Leakage, Hallucination, Persona Override) và 1-Click tự động vá rào chắn kỹ thuật.

---

## ⚡ Tính Năng v1.1 & v1.0

### 11. Live Execution Playground & Dynamic Variables `{{variable}}`
* Chạy thử prompt thực tế qua Gemini API; đo lường độ trễ (Latency ms), Token usage và chi phí USD ($).
* Nhận diện tự động cú pháp `{{ten_bien}}` và sinh form nhập liệu trực quan.

### 12. Xuất Mã Nguồn SDK 1-Click
* Chuyển đổi prompt thành code: 🐍 **Python** (`google-genai`), 🔷 **TypeScript** (`@google/genai`), 💻 **cURL**, 📄 **JSON Spec**.

### 13. Phân Hệ Tối Ưu Hóa Chuyên Biệt Với Gemini Pro (Optimizer Studio)
* Gửi prompt thô sang Gemini Pro để tái cấu trúc đạt điểm tuyệt đối 95-100 điểm theo 4 framework: `CO-STAR`, `CRISPE`, `RTF`, `STANDARD-PRO`.

### 14. Bộ Quy Tắc Chấm Điểm 100 Điểm Song Ngữ
```
[Tổng điểm: 100]
├── C1: [ROLE & CONTEXT] - Vai trò & Ngữ cảnh (20đ)
├── C2: [TASK & INSTRUCTION] - Nhiệm vụ & Chỉ dẫn thực thi (25đ)
├── C3: [CONSTRAINTS & RULES] - Ràng buộc & Điều cấm kỵ (20đ)
├── C4: [OUTPUT FORMAT] - Định dạng đầu ra mong muốn (20đ)
└── C5: [EXAMPLES & SPECS] - Ví dụ mẫu & Tham số chuyên ngành (15đ)
```

---

## 🛠️ Hướng Dẫn Khởi Động Service v2.5

### Cách 1: Khởi động 1-Click kèm mở trình duyệt (Khuyên dùng)
* Nhấp đúp vào file **[`Run_LPrompt_Service.bat`](Run_LPrompt_Service.bat)**.
* Hệ thống tự động kích hoạt service ngầm và mở trình duyệt tại: **`http://localhost:8484`**.

### Cách 2: Khởi động ngầm hoàn toàn tĩnh lặng
* Nhấp đúp vào file **[`Start_LPrompt_Service.vbs`](Start_LPrompt_Service.vbs)**.
* Service chạy ngầm êm ái (**0 cửa sổ console**). Dữ liệu tự động lưu vào `data/lprompt.db`.

### Dừng Service:
* Nhấp đúp vào file **[`Stop_LPrompt_Service.bat`](Stop_LPrompt_Service.bat)** để tắt service.

---

## 🔒 Bảo Mật & Mô Hình BYOK (Bring Your Own Key)
* Người dùng tự nhập Google Gemini API Key lấy miễn phí từ [Google AI Studio](https://aistudio.google.com/apikey).
* Khóa API chỉ lưu duy nhất trong máy bạn, không bao giờ gửi về máy chủ thứ ba.
* Hỗ trợ chuyển đổi giữa **`gemini-2.0-flash` (Miễn phí 1.500 lượt/ngày, tốc độ <1s)** và **`gemini-1.5-pro` (Suy luận chuyên sâu)**.

---

## 📖 Tài Liệu Hướng Dẫn Chi Tiết
Xem toàn bộ hướng dẫn sử dụng chi tiết từng bước tại file: [HUONG_DAN_SU_DUNG.md](HUONG_DAN_SU_DUNG.md).

---

## 📄 Giấy Phép (License)
Dự án được phân phối theo giấy phép [MIT License](LICENSE).
