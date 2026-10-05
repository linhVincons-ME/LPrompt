# 📘 HƯỚNG DẪN SỬ DỤNG CHI TIẾT - LPROMPT STUDIO (Phiên bản v2.5)

Chào mừng bạn đến với **LPrompt Studio** – Môi trường phát triển, thẩm định, quản lý vòng đời, kiểm thử hàng loạt và tối ưu hóa Prompt chuyên nghiệp (PromptOps IDE) dành cho kỹ sư Prompt và lập trình viên AI.

---

## 📑 MỤC LỤC
1. [Khởi Động Local Service v2.5 & Quản Trị Hệ Thống](#1-khởi-động-local-service-v25--quản-trị-hệ-thống)
2. [Cơ Sở Dữ Liệu Nhúng An Toàn `data/lprompt.db` (Portable Embedded SQLite)](#2-cơ-sở-dữ-liệu-nhúng-an-toàn-datalpromptdb-portable-embedded-sqlite)
3. [Tích Hợp Giao Thức Model Context Protocol (MCP) Cho Cursor & Claude](#3-tích-hợp-giao-thức-model-context-protocol-mcp-cho-cursor--claude)
4. [Cấu Hình Gemini API Miễn Phí (BYOK)](#4-cấu-hình-gemini-api-miễn-phí-byok)
5. [Kiểm Thử Hàng Loạt - Batch Test Suite & Matrix Runner (v2.0)](#5-kiểm-thử-hàng-loạt---batch-test-suite--matrix-runner-v20)
6. [Tự Động Sinh Mẫu Vàng - DSPy-Style Auto Few-Shot (v2.0)](#6-tự-động-sinh-mẫu-vàng---dspy-style-auto-few-shot-v20)
7. [Kho Mẫu Chuyên Sâu Tích Hợp - Fabric-Style Presets Hub (v2.0)](#7-kho-mẫu-chuyên-sâu-tích-hợp---fabric-style-presets-hub-v20)
8. [Quản Lý Phiên Bản Git-Style & 1-Click Rollback (v1.2)](#8-quản-lý-phiên-bản-git-style--1-click-rollback-v12)
9. [So Sánh Trực Quan Thay Đổi Từng Từ - Visual Diff (v1.2)](#9-so-sánh-trực-quan-thay-đổi-từng-từ---visual-diff-v12)
10. [Quét Lỗ Hổng Bảo Mật Red-Teaming & Tự Động Vá Guardrails (v1.2)](#10-quét-lỗ-hổng-bảo-mật-red-teaming--tự-động-vá-guardrails-v12)
11. [Sử Dụng Biến Động Template Engine `{{variable}}` (v1.1)](#11-sử-dụng-biến-động-template-engine-variable-v11)
12. [Chạy Thử Nghiệm Prompt Trực Tiếp - Live Playground (v1.1)](#12-chạy-thử-nghiệm-prompt-trực-tiếp---live-playground-v11)
13. [Xuất Mã Nguồn SDK 1-Click: Python, TypeScript, cURL (v1.1)](#13-xuất-mã-nguồn-sdk-1-click-python-typescript-curl-v11)
14. [Phân Hệ Tối Ưu Prompt Bằng Gemini Pro (Optimizer Studio)](#14-phân-hệ-tối-ưu-prompt-bằng-gemini-pro-optimizer-studio)
15. [Phân Hệ Thẩm Định & Chấm Điểm 100 Điểm Song Ngữ (Evaluator)](#15-phân-hệ-thẩm-định--chấm-điểm-100-điểm-song-ngữ-evaluator)
16. [Hướng Dẫn Chuyên Biệt Theo Từng Phân Hệ Đa Phương Thức](#16-hướng-dẫn-chuyên-biệt-theo-từng-phân-hệ-đa-phương-thức)

---

## 1. Khởi Động Local Service v2.5 & Quản Trị Hệ Thống

Từ phiên bản v2.5, LPrompt Studio chuyển đổi thành **Local Background Service** siêu nhẹ (~25MB RAM) phục vụ trên cổng `8484`. Bạn có thể quản lý theo 3 cách:

### Cách 1: Khởi động kèm mở trình duyệt (Khuyên dùng hàng ngày)
* Nhấp đúp chuột vào file: **`Run_LPrompt_Service.bat`**.
* Hệ thống sẽ tự động kích hoạt service ngầm và mở trình duyệt tại: **`http://localhost:8484`**.

### Cách 2: Khởi động ngầm hoàn toàn tĩnh lặng (Silent Background Service)
* Nhấp đúp chuột vào file: **`Start_LPrompt_Service.vbs`**.
* Service sẽ chạy ngầm dưới nền Windows mà **hoàn toàn KHÔNG mở bất kỳ cửa sổ console đen nào**.
* Một thông báo Windows Balloon nhỏ sẽ xác nhận service đã kích hoạt thành công.

### Cách 3: Dừng Service khi không dùng
* Nhấp đúp chuột vào file: **`Stop_LPrompt_Service.bat`**.
* Script tự động tìm tiến trình chiếm cổng 8484 và giải phóng an toàn.

---

## 2. Cơ Sở Dữ Liệu Nhúng An Toàn `data/lprompt.db` (Portable Embedded SQLite)

Toàn bộ dữ liệu của LPrompt Studio được lưu trữ trong file SQLite nhúng trực tiếp tại:
📁 **`d:\DevV2\LPrompt\data\lprompt.db`**

### Điểm mạnh vượt trội:
1. **Chống mất mát dữ liệu khi cài lại Windows:** 
   - Dữ liệu nằm ở ổ `D:` gắn liền với thư mục dự án, không bao giờ bị ảnh hưởng khi format ổ `C:` hoặc cài lại hệ điều hành.
2. **Cơ chế Tự Động Phục Hồi (Self-Healing):**
   - Khi khởi động, nếu chưa thấy file `lprompt.db`, Service sẽ tự động sinh bảng và cấu trúc schema.
3. **Sao lưu tự động hàng ngày (Auto-Backup Snapshots):**
   - Mỗi ngày một bản snapshot JSON sẽ được tự động ghi vào thư mục `data/backups/lprompt_snapshot_YYYYMMDD.json`.
4. **Tính di động (100% Portable):**
   - Bạn có thể copy toàn bộ thư mục `LPrompt` sang máy khác, dữ liệu và cấu hình sẽ đi theo trọn vẹn.

---

## 3. Tích Hợp Giao Thức Model Context Protocol (MCP) Cho Cursor & Claude

LPrompt Service tích hợp sẵn **MCP Server (Model Context Protocol)** trên cổng `http://localhost:8484/mcp`, cho phép các IDE AI hàng đầu kết nối trực tiếp:

### Cấu hình trong Cursor / Claude Desktop / Antigravity:
Thêm cấu hình sau vào file cấu hình MCP của bạn (`claude_desktop_config.json` hoặc Cursor MCP settings):

```json
{
  "mcpServers": {
    "lprompt": {
      "url": "http://localhost:8484/mcp"
    }
  }
}
```

### Các công cụ AI bạn có thể ra lệnh trực tiếp:
* **`lprompt_evaluate`:** *"Hãy thẩm định chất lượng prompt này theo chuẩn LPrompt 100 điểm."*
* **`lprompt_list_presets`:** *"Lấy cho tôi mẫu prompt phân tích SWOT từ LPrompt Presets Hub."*
* **`lprompt_get_versions`:** *"Liệt kê các phiên bản prompt đã lưu trong database LPrompt."*
* **`lprompt_commit_version`:** *"Commit phiên bản prompt này vào database LPrompt với ghi chú 'Bản chuẩn release'."*

---

## 4. Cấu Hình Gemini API Miễn Phí (BYOK)

LPrompt Studio áp dụng mô hình **BYOK (Bring Your Own Key)**. Khóa API chỉ lưu trên máy bạn, bảo mật 100%.

1. Truy cập vào trang tạo key miễn phí của Google: **[https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)**.
2. Đăng nhập tài khoản Google và bấm **"Create API Key"**.
3. Sao chép chuỗi khóa (bắt đầu bằng `AIzaSy...`).
4. Trên giao diện LPrompt Studio, bấm nút **"API Key"** ở góc phải thanh tiêu đề.
5. Dán khóa API vào, chọn model:
   * **`gemini-2.0-flash` (Khuyên dùng):** Tốc độ cực nhanh (<1s), miễn phí 1.500 lượt/ngày.
   * **`gemini-1.5-pro`:** Phân tích ngữ nghĩa chuyên sâu và tái cấu trúc prompt phức tạp.
6. Bấm **"Kiểm tra kết nối"** ➔ Hiện thông báo xanh thành công ➔ Bấm **"Lưu cấu hình"**.

---

## 5. Kiểm Thử Hàng Loạt - Batch Test Suite & Matrix Runner (v2.0)

1. Nhấp nút **`[Batch Evals]`** trên Header hoặc nút **`[Batch Test]`** bên cạnh ô soạn thảo.
2. Thiết lập tập dữ liệu kiểm thử (Dataset Cases) cho các biến `{{variable}}`.
3. Chọn các quy tắc Assertion:
   * `Contains`: Phải chứa chuỗi kỳ vọng.
   * `Not Contains`: Không được dính từ cấm (chống ảo giác).
   * `Regex`: Khớp biểu thức chính quy.
   * `Min Length`: Đạt độ dài tối thiểu.
4. Bấm **`[Chạy Toàn Bộ Test Suite]`** và theo dõi tỷ lệ Pass/Fail, Latency trung bình và xuất báo cáo JSON.

---

## 6. Tự Động Sinh Mẫu Vàng - DSPy-Style Auto Few-Shot (v2.0)

1. Bấm nút **`[Few-Shot]`** trên Header hoặc cạnh nút Chấm Điểm.
2. Bấm **`[Tự Động Sinh Few-Shot]`**:
   * Gemini Pro phân tích sâu ngữ cảnh để sinh 2–3 cặp Input/Output mẫu chuẩn mực (Golden Examples).
3. Bấm **`[Gắn Few-Shot Vào Prompt (+15đ C5)]`** để tự động đạt điểm tối đa 15/15đ cho trụ cột C5 và giảm thiểu ảo giác của LLM.

---

## 7. Kho Mẫu Chuyên Sâu Tích Hợp - Fabric-Style Presets Hub (v2.0)

1. Bấm nút **`[Presets]`** trên thanh tiêu đề Header.
2. Khám phá 5 chuyên mục lớn:
   * 📊 **Kinh Doanh & Quản Trị:** Phân tích SWOT, Điều tra nguyên nhân 5-Whys.
   * 💻 **Kỹ Thuật & Code:** Thẩm tra bảo mật OWASP, Tái cấu trúc Clean Architecture & SOLID.
   * ✍️ **Copywriting & Content:** Cold Email B2B tỷ lệ mở 60%+, Kịch bản High-Converting Landing Page.
   * 🎨 **Đa Phương Thức:** Prompt Midjourney v6 / Flux.1 siêu thực, Prompt camera video Sora/Runway Gen-3.
   * 🔬 **Nghiên Cứu:** Phản biện bài báo khoa học.
3. Bấm **`[Xem chi tiết]`** hoặc **`[Đưa Vào Workspace]`** để sử dụng ngay.

---

## 8. Quản Lý Phiên Bản Git-Style & 1-Click Rollback (v1.2)

1. Nhấp nút **`[Lịch Sử]`** trên Header hoặc thanh công cụ.
2. Bấm **`[+ Tạo Điểm Lưu Phiên Bản Mới]`**:
   * Nhập thông điệp commit.
   * Chọn phân tầng: 📝 **Draft** (Nháp) | 🧪 **Testing** (Thử nghiệm) | 🚀 **Production** (Chạy thật).
3. Dữ liệu được đồng bộ đồng thời vào **SQLite `data/lprompt.db`** và cache trình duyệt.
4. **1-Click Rollback:** Bấm nút **`[Quay Lại]`** cạnh bất kỳ bản cũ nào để khôi phục tức thì.

---

## 9. So Sánh Trực Quan Thay Đổi Từng Từ - Visual Diff (v1.2)

1. Bấm nút **`[So sánh Diff]`** tại Optimizer View hoặc Evaluator View.
2. Xem chi tiết từng từ: 🟢 Xanh lá (`+`) thêm mới, 🔴 Đỏ gạch ngang (`-`) loại bỏ, ⚪ Xám giữ nguyên.
3. Hỗ trợ xem Inline Diff hoặc Split View hai cột song song.

---

## 10. Quét Lỗ Hổng Bảo Mật Red-Teaming & Tự Động Vá Guardrails (v1.2)

1. Bấm nút **`[Bảo Mật]`** (🛡️) trên Header hoặc cạnh nút Chấm Điểm.
2. Bấm **`[Bắt Đầu Quét Red-Teaming]`** để kiểm tra 4 nhóm rủi ro: Prompt Injection, System Prompt Leakage, Hallucination, Persona Override.
3. Bấm **`[Áp Dụng Bản Đã Vá Lỗ Hổng]`** để tự động bổ sung rào chắn Negative Guardrails chuẩn công nghiệp.

---

## 11. Sử Dụng Biến Động Template Engine `{{variable}}` (v1.1)

1. Viết tên biến trong ngoặc nhọn kép: `{{ten_bien}}`.
2. Form nhập liệu tự động sinh bên dưới ô soạn thảo.
3. Hệ thống tự động ghép giá trị biến khi chạy Playground, Batch Test hoặc xuất mã nguồn.

---

## 12. Chạy Thử Nghiệm Prompt Trực Tiếp - Live Playground (v1.1)

1. Bấm nút **`[Playground]`** trên Header hoặc **`[Chạy Thử]`** cạnh prompt.
2. Đo lường phản hồi thực tế của Gemini API với: Latency (ms), Token usage và chi phí USD ($).

---

## 13. Xuất Mã Nguồn SDK 1-Click: Python, TypeScript, cURL (v1.1)

1. Bấm nút **`[Xuất Code]`** trên Header hoặc cạnh bản prompt tối ưu.
2. Lựa chọn ngôn ngữ: Python (`google-genai`), TypeScript (`@google/genai`), cURL, JSON Spec.
3. Bấm **`[1-Click Sao Chép Mã]`** để dán thẳng vào dự án.

---

## 14. Phân Hệ Tối Ưu Prompt Bằng Gemini Pro (Optimizer Studio)

1. Chọn chuyên mục và nhập prompt thô.
2. Chọn mục tiêu tối ưu (Production 100đ, Negative Guardrails, Strict Schema, CoT Logic, Tham số chuyên ngành).
3. Chọn Framework (`CO-STAR`, `CRISPE`, `RTF`, `STANDARD-PRO`).
4. Bấm **"✨ ĐƯA SANG GEMINI PRO TỐI ƯU HÓA"** và tinh chỉnh thêm qua khung chat tương tác ở cuối trang.

---

## 15. Phân Hệ Thẩm Định & Chấm Điểm 100 Điểm Song Ngữ (Evaluator)

* Thẩm định định lượng theo 5 trụ cột:
  1. `[ROLE & CONTEXT]` (20đ)
  2. `[TASK & INSTRUCTION]` (25đ)
  3. `[CONSTRAINTS & RULES]` (20đ)
  4. `[OUTPUT FORMAT]` (20đ)
  5. `[EXAMPLES & SPECS]` (15đ)
* Tự động nhận diện cả tiếng Việt, tiếng Anh và các tiền tố kỹ thuật.

---

## 16. Hướng Dẫn Chuyên Biệt Theo Từng Phân Hệ Đa Phương Thức

* 🎨 **Tạo Ảnh:** Tỷ lệ `--ar`, tiêu cự Lens (85mm, 35mm), ánh sáng Cinematic, Negative prompt.
* 🎬 **Tạo Video:** Camera Dolly, Pan, Tilt, FPV; tốc độ 60fps 4K.
* 💻 **Lập Trình:** Python 3.12, TypeScript; tiêu chuẩn Clean Architecture, Pydantic, Unit Test.
* 🎵 **Âm Thanh:** Thẻ `[Verse]`, `[Chorus]`, `[Guitar Solo]`, nhịp BPM, thể loại.
* 🧠 **Nghiên Cứu:** Khung SWOT, Mermaid diagram, phân tích rủi ro.

---

> 💡 **Quy tắc phát triển:** Mọi thay đổi về tính năng, cơ sở dữ liệu hay giao diện của LPrompt Studio sẽ luôn được cập nhật đầy đủ và đồng bộ vào tài liệu này trước mỗi lần commit.
