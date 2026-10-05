# 📘 HƯỚNG DẪN SỬ DỤNG CHI TIẾT - LPROMPT STUDIO (Phiên bản v2.0)

Chào mừng bạn đến với **LPrompt Studio** – Môi trường phát triển, thẩm định, quản lý vòng đời, kiểm thử hàng loạt và tối ưu hóa Prompt chuyên nghiệp (PromptOps IDE) dành cho kỹ sư Prompt và lập trình viên AI.

---

## 📑 MỤC LỤC
1. [Khởi Động Ứng Dụng (1-Click)](#1-khởi-động-ứng-dụng-1-click)
2. [Cấu Hình Gemini API Miễn Phí (BYOK)](#2-cấu-hình-gemini-api-miễn-phí-byok)
3. [Kiểm Thử Hàng Loạt - Batch Test Suite & Matrix Runner (Mới v2.0)](#3-kiểm-thử-hàng-loạt---batch-test-suite--matrix-runner-mới-v20)
4. [Tự Động Sinh Mẫu Vàng - DSPy-Style Auto Few-Shot (Mới v2.0)](#4-tự-động-sinh-mẫu-vàng---dspy-style-auto-few-shot-mới-v20)
5. [Kho Mẫu Chuyên Sâu Tích Hợp - Fabric-Style Presets Hub (Mới v2.0)](#5-kho-mẫu-chuyên-sâu-tích-hợp---fabric-style-presets-hub-mới-v20)
6. [Quản Lý Phiên Bản Git-Style & 1-Click Rollback (v1.2)](#6-quản-lý-phiên-bản-git-style--1-click-rollback-v12)
7. [So Sánh Trực Quan Thay Đổi Từng Từ - Visual Diff (v1.2)](#7-so-sánh-trực-quan-thay-đổi-từng-từ---visual-diff-v12)
8. [Quét Lỗ Hổng Bảo Mật Red-Teaming & Tự Động Vá Guardrails (v1.2)](#8-quét-lỗ-hổng-bảo-mật-red-teaming--tự-động-vá-guardrails-v12)
9. [Sử Dụng Biến Động Template Engine `{{variable}}` (v1.1)](#9-sử-dụng-biến-động-template-engine-variable-v11)
10. [Chạy Thử Nghiệm Prompt Trực Tiếp - Live Playground (v1.1)](#10-chạy-thử-nghiệm-prompt-trực-tiếp---live-playground-v11)
11. [Xuất Mã Nguồn SDK 1-Click: Python, TypeScript, cURL (v1.1)](#11-xuất-mã-nguồn-sdk-1-click-python-typescript-curl-v11)
12. [Phân Hệ Tối Ưu Prompt Bằng Gemini Pro (Optimizer Studio)](#12-phân-hệ-tối-ưu-prompt-bằng-gemini-pro-optimizer-studio)
13. [Phân Hệ Thẩm Định & Chấm Điểm 100 Điểm Song Ngữ (Evaluator)](#13-phân-hệ-thẩm-định--chấm-điểm-100-điểm-song-ngữ-evaluator)
14. [Hướng Dẫn Chuyên Biệt Theo Từng Phân Hệ Đa Phương Thức](#14-hướng-dẫn-chuyên-biệt-theo-từng-phân-hệ-đa-phương-thức)
15. [Quản Lý & Xuất Bản Kho Prompt](#15-quản-lý--xuất-bản-kho-prompt)

---

## 1. Khởi Động Ứng Dụng (1-Click)

Bạn có thể khởi động phần mềm theo 2 cách cực kỳ nhanh chóng:

* **Cách 1 (Khuyên dùng):** Ra ngoài màn hình chính **Desktop**, nhấp đúp chuột vào biểu tượng **`LPrompt Studio`**.
* **Cách 2:** Vào thư mục `d:\DevV2\LPrompt` và nhấp đúp vào file **`Run_LPrompt.bat`**.

Hệ thống sẽ tự động kiểm tra thư viện, khởi động server và mở trình duyệt tại: **`http://localhost:5173`**.

---

## 2. Cấu Hình Gemini API Miễn Phí (BYOK)

LPrompt Studio áp dụng mô hình **BYOK (Bring Your Own Key)**. Khóa API chỉ lưu trên máy bạn (`localStorage`), bảo mật 100%.

1. Truy cập vào trang tạo key miễn phí của Google: **[https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)**.
2. Đăng nhập tài khoản Google và bấm **"Create API Key"**.
3. Sao chép chuỗi khóa (bắt đầu bằng `AIzaSy...`).
4. Trên giao diện LPrompt Studio, bấm nút **"API Key"** ở góc phải thanh tiêu đề.
5. Dán khóa API vào, chọn model:
   * **`gemini-2.0-flash` (Khuyên dùng):** Tốc độ cực nhanh (<1s), miễn phí 1.500 lượt/ngày.
   * **`gemini-1.5-pro`:** Phân tích ngữ nghĩa chuyên sâu và tái cấu trúc prompt phức tạp.
6. Bấm **"Kiểm tra kết nối"** ➔ Hiện thông báo xanh thành công ➔ Bấm **"Lưu cấu hình"**.

---

## 3. Kiểm Thử Hàng Loạt - Batch Test Suite & Matrix Runner (Mới v2.0)

Khi đưa prompt vào môi trường sản xuất, bạn cần đảm bảo prompt hoạt động chuẩn xác với hàng chục bộ dữ liệu đầu vào khác nhau (theo chuẩn **promptfoo** và **Langfuse**):

### Quy trình thực hiện:
1. Nhấp nút **`[Batch Evals]`** trên Header hoặc nút **`[Batch Test]`** bên cạnh ô soạn thảo prompt.
2. Cửa sổ **Batch Evaluation & Test Suite Runner** sẽ xuất hiện:
   * **Tab 1: Bộ Kiểm Thử (Cases):**
     * Hệ thống tự động nhận diện các biến `{{variable}}` và sinh sẵn các bộ dữ liệu mẫu thực tế.
     * Bấm **`[Thêm Case]`** để tạo thêm trường hợp kiểm thử tùy ý.
     * Thiết lập **Quy tắc kiểm tra (Assertions)**:
       * `Contains`: Đầu ra bắt buộc phải chứa chuỗi kỳ vọng.
       * `Not Contains`: Đầu ra tuyệt đối không được dính các từ cấm (ví dụ: không được từ chối hoặc suy diễn).
       * `Regex`: Đầu ra phải khớp cấu trúc biểu thức chính quy.
       * `Min Length`: Đảm bảo độ dài tối thiểu của câu trả lời.
   * Nhấp nút **`[Chạy Toàn Bộ Test Suite]`**:
     * Hệ thống thực thi tuần tự từng test case qua Gemini API (hoặc mô phỏng offline nếu chưa có key).
     * Thanh tiến trình hiển thị trực tiếp số case đã hoàn tất.
3. **Xem Ma Trận Kết Quả (Matrix Results):**
   * Tỷ lệ thành công (**Pass Rate %**) và số lượng Pass / Fail.
   * Độ trễ trung bình (**Avg Latency ms**) trên từng lượt gọi.
   * Bảng chi tiết: Trạng thái ✅ PASS / ❌ FAIL, lý do chi tiết và nội dung AI trả về thực tế.
   * Bấm **`[Xuất JSON]`** để tải báo cáo kiểm thử về máy.

---

## 4. Tự Động Sinh Mẫu Vàng - DSPy-Style Auto Few-Shot (Mới v2.0)

Theo nghiên cứu từ Đại học Stanford (dự án DSPy), việc cung cấp các ví dụ mẫu (Few-Shot) là phương pháp hiệu quả nhất để ép mô hình tuân thủ cấu trúc và triệt tiêu ảo giác:

1. Bấm nút **`[Few-Shot]`** trên Header hoặc cạnh nút Chấm Điểm.
2. Bấm **`[Tự Động Sinh Few-Shot]`**:
   * Gemini Pro phân tích sâu ngữ cảnh và biến động trong prompt của bạn.
   * Tự động sinh ra 2–3 cặp **Input (Đầu vào thực tế)** và **Expected Output (Đầu ra chuẩn mẫu)** kèm ghi chú lý do thiết lập ví dụ.
3. **Chỉnh sửa linh hoạt:** Bạn có thể tự do sửa lại Input và Output của từng ví dụ hoặc bấm **`[Thêm ví dụ]`**.
4. Bấm **`[Gắn Few-Shot Vào Prompt (+15đ C5)]`**:
   * Hệ thống tự động chèn mục `[EXAMPLES & SPECS]` chứa các cặp mẫu vàng vào cuối prompt.
   * Prompt của bạn tự động đạt điểm tuyệt đối 15/15đ cho tiêu chí ví dụ mẫu.

---

## 5. Kho Mẫu Chuyên Sâu Tích Hợp - Fabric-Style Presets Hub (Mới v2.0)

LPrompt Studio v2.0 tích hợp sẵn kho prompt mẫu cao cấp lấy cảm hứng từ dự án **Fabric (Daniel Miessler)** và **Awesome Prompts**:

1. Bấm nút **`[Presets]`** trên thanh tiêu đề Header.
2. **5 Chuyên mục lớn được phân loại rõ ràng:**
   * 📊 **Kinh Doanh & Quản Trị:** Phân tích SWOT & TOWS, Điều tra nguyên nhân 5-Whys, OKR Decomposition.
   * 💻 **Kỹ Thuật & Code:** Thẩm tra an toàn mã nguồn OWASP, Tái cấu trúc Clean Architecture & SOLID, API Contract Generator.
   * ✍️ **Copywriting & Content:** Chuỗi Email B2B tỷ lệ mở 60%+, Kịch bản High-Converting Landing Page, SEO Pillar Strategy.
   * 🎨 **Đa Phương Thức:** Prompt tạo ảnh Midjourney v6 / Flux.1 siêu thực với thông số quang học lens 85mm, Prompt chỉ đạo camera video Sora/Runway Gen-3.
   * 🔬 **Nghiên Cứu & Học Thuật:** Phản biện bài báo khoa học (Academic Paper Critique).
3. **Tìm kiếm & Sử dụng:**
   * Gõ từ khóa vào ô tìm kiếm để lọc nhanh mẫu theo nhu cầu.
   * Bấm **`[Xem chi tiết]`** để đọc toàn văn prompt và copy.
   * Bấm **`[Dùng mẫu]`** hoặc **`[Đưa Vào Workspace]`** để nạp thẳng prompt vào Editor và bắt đầu tối ưu hóa.

---

## 6. Quản Lý Phiên Bản Git-Style & 1-Click Rollback (v1.2)

1. Nhấp nút **`[Lịch Sử]`** trên Header hoặc thanh công cụ soạn thảo.
2. Bấm **`[+ Tạo Điểm Lưu Phiên Bản Mới]`**:
   * Nhập thông điệp mô tả thay đổi.
   * Chọn phân tầng: 📝 **Draft** (Nháp) | 🧪 **Testing** (Thử nghiệm) | 🚀 **Production** (Chạy thật).
3. Bấm **`[Xác Nhận Lưu Phiên Bản]`** để ghi nhớ mốc `v1.0`, `v1.1`... kèm điểm số.
4. **1-Click Rollback:** Bấm nút **`[Quay Lại]`** cạnh bất kỳ bản cũ nào để khôi phục tức thì mà không làm mất lịch sử các phiên bản khác.

---

## 7. So Sánh Trực Quan Thay Đổi Từng Từ - Visual Diff (v1.2)

1. Bấm nút **`[So sánh Diff]`** tại:
   * Prompt Optimizer View (so sánh Bản Gốc vs Bản Gemini Pro tối ưu 100đ).
   * Evaluator View (so sánh Prompt hiện tại vs Bản nâng cấp).
   * Lịch sử phiên bản (so sánh Bản cũ vs Bản hiện tại).
2. **Quy ước màu sắc:**
   * 🟢 **Xanh lá (`+`):** Từ ngữ và quy tắc kỹ thuật được bổ sung mới.
   * 🔴 **Đỏ gạch ngang (`-`):** Từ ngữ rườm rà, mơ hồ bị lược bỏ.
   * ⚪ **Xám:** Thành phần giữ nguyên.
3. Hỗ trợ xem dòng liên tục (**Inline Diff**) hoặc đối chiếu song song hai cột (**Split View**).
4. Bấm **`[Áp dụng bản mới này]`** để đồng ý thay đổi ngay trong modal Diff.

---

## 8. Quét Lỗ Hổng Bảo Mật Red-Teaming & Tự Động Vá Guardrails (v1.2)

1. Bấm nút **`[Bảo Mật]`** (biểu tượng chiếc khiên 🛡️) trên Header hoặc cạnh nút Chấm Điểm.
2. Bấm **`[Bắt Đầu Quét Red-Teaming]`**:
   * Kiểm tra 4 nhóm rủi ro: Prompt Injection, System Prompt Leakage, Hallucination, Persona Override.
   * Đo lường Điểm An Toàn (**Safety Score: 0–100đ**).
3. **1-Click Tự Động Vá Lỗ Hổng:** Bấm **`[Áp Dụng Bản Đã Vá Lỗ Hổng]`** để tự động bổ sung danh sách rào chắn kiên cố chống chọi với các đòn tấn công phổ biến.

---

## 9. Sử Dụng Biến Động Template Engine `{{variable}}` (v1.1)

1. **Cú pháp:** Đặt tên biến trong ngoặc nhọn kép: `{{ten_bien}}`.
   * *Ví dụ:* `"Bạn là chuyên gia marketing cho sản phẩm {{san_pham}} với ngân sách {{ngan_sach}}."`
2. Form nhập liệu tự động sinh bên dưới ô soạn thảo.
3. Bấm nút **`+ Chèn biến`** để tạo nhanh biến mới.
4. Hệ thống tự động ghép giá trị biến khi chạy Playground, Batch Test hoặc xuất mã nguồn.

---

## 10. Chạy Thử Nghiệm Prompt Trực Tiếp - Live Playground (v1.1)

1. Bấm nút **`[Playground]`** trên Header hoặc **`[Chạy Thử]`** cạnh prompt.
2. Xem phản hồi thực tế của Gemini API cùng các chỉ số công nghiệp:
   * ⚡ **Latency:** Độ trễ tính bằng mili-giây (ms).
   * 🔢 **Tokens:** Input, Output và Total Tokens.
   * 💵 **Cost:** Chi phí ước tính theo USD ($).

---

## 11. Xuất Mã Nguồn SDK 1-Click: Python, TypeScript, cURL (v1.1)

1. Bấm nút **`[Xuất Code]`** trên Header hoặc cạnh bản prompt tối ưu.
2. Chọn ngôn ngữ:
   * 🐍 **Python:** Thư viện `google-genai`.
   * 🔷 **TypeScript / Node.js:** Thư viện `@google/genai`.
   * 💻 **cURL:** Câu lệnh HTTP request terminal.
   * 📄 **JSON Spec:** Cấu trúc PromptOps chuẩn.
3. Bấm **`[1-Click Sao Chép Mã]`** để dán thẳng vào dự án của bạn.

---

## 12. Phân Hệ Tối Ưu Prompt Bằng Gemini Pro (Optimizer Studio)

1. **Bước 1:** Chọn chuyên mục và nhập prompt thô.
2. **Bước 2:** Chọn mục tiêu tối ưu (Production 100đ, Negative Guardrails, Strict Schema, CoT Logic, Tham số chuyên ngành).
3. **Bước 3:** Chọn Framework (`CO-STAR`, `CRISPE`, `RTF`, `STANDARD-PRO`).
4. **Bước 4:** Bấm **"✨ ĐƯA SANG GEMINI PRO TỐI ƯU HÓA"** và xem bản nâng cấp kèm bảng giải thích thay đổi.
5. **Vòng lặp tương tác:** Chat bổ sung ở cuối trang để Gemini Pro tiếp tục sửa đổi theo ý bạn.

---

## 13. Phân Hệ Thẩm Định & Chấm Điểm 100 Điểm Song Ngữ (Evaluator)

* Thẩm định định lượng theo 5 trụ cột:
  1. `[ROLE & CONTEXT]` (20đ)
  2. `[TASK & INSTRUCTION]` (25đ)
  3. `[CONSTRAINTS & RULES]` (20đ)
  4. `[OUTPUT FORMAT]` (20đ)
  5. `[EXAMPLES & SPECS]` (15đ)
* Hỗ trợ nhận diện toàn diện cả tiếng Việt, tiếng Anh và các tiền tố kỹ thuật.

---

## 14. Hướng Dẫn Chuyên Biệt Theo Từng Phân Hệ Đa Phương Thức

* 🎨 **Tạo Ảnh:** Chèn tỷ lệ `--ar`, tiêu cự Lens (85mm, 35mm), ánh sáng Cinematic, Negative prompt.
* 🎬 **Tạo Video:** Chèn camera Dolly, Pan, Tilt, FPV; tốc độ 60fps 4K.
* 💻 **Lập Trình:** Chọn tech stack Python 3.12, TypeScript; tiêu chuẩn Clean Architecture, Pydantic, Unit Test.
* 🎵 **Âm Thanh:** Thẻ `[Verse]`, `[Chorus]`, `[Guitar Solo]`, nhịp BPM, thể loại.
* 🧠 **Nghiên Cứu:** Khung SWOT, Mermaid diagram, phân tích rủi ro.

---

## 15. Quản Lý & Xuất Bản Kho Prompt

* Bấm **"Lưu"** để lưu prompt vào thư viện cá nhân.
* Bấm **"Kho"** trên Header để tìm kiếm, xem lại hoặc xuất thư viện ra file JSON.

---

> 💡 **Quy tắc phát triển:** Mọi thay đổi về tính năng, thuật toán hay giao diện của LPrompt Studio sẽ luôn được cập nhật đầy đủ và đồng bộ vào tài liệu này trước mỗi lần commit.
