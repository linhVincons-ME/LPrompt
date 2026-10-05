# 📘 HƯỚNG DẪN SỬ DỤNG CHI TIẾT - LPROMPT STUDIO (Phiên bản v1.1)

Chào mừng bạn đến với **LPrompt Studio** – Môi trường phát triển, thẩm định và tối ưu hóa Prompt chuyên nghiệp (PromptOps IDE) dành cho kỹ sư Prompt và lập trình viên.

---

## 📑 MỤC LỤC
1. [Khởi Động Ứng Dụng (1-Click)](#1-khởi-động-ứng-dụng-1-click)
2. [Cấu Hình Gemini API Miễn Phí (BYOK)](#2-cấu-hình-gemini-api-miễn-phí-byok)
3. [Sử Dụng Biến Động Template Engine `{{variable}}` (Mới v1.1)](#3-sử-dụng-biến-động-template-engine-variable-mới-v11)
4. [Chạy Thử Nghiệm Prompt Trực Tiếp - Live Playground (Mới v1.1)](#4-chạy-thử-nghiệm-prompt-trực-tiếp---live-playground-mới-v11)
5. [Xuất Mã Nguồn SDK 1-Click: Python, TypeScript, cURL (Mới v1.1)](#5-xuất-mã-nguồn-sdk-1-click-python-typescript-curl-mới-v11)
6. [Phân Hệ Tối Ưu Prompt Bằng Gemini Pro (Optimizer Studio)](#6-phân-hệ-tối-ưu-prompt-bằng-gemini-pro-optimizer-studio)
7. [Phân Hệ Thẩm Định & Chấm Điểm 100 Điểm Song Ngữ (Evaluator)](#7-phân-hệ-thẩm-định--chấm-điểm-100-điểm-song-ngữ-evaluator)
8. [Hướng Dẫn Chuyên Biệt Theo Từng Phân Hệ Đa Phương Thức](#8-hướng-dẫn-chuyên-biệt-theo-từng-phân-hệ-đa-phương-thức)
9. [Quản Lý & Xuất Bản Kho Prompt](#9-quản-lý--xuất-bản-kho-prompt)

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

## 3. Sử Dụng Biến Động Template Engine `{{variable}}` (Mới v1.1)

Trong thực tế, bạn thường tạo ra các mẫu prompt tái sử dụng nhiều lần với các tham số khác nhau. LPrompt Studio v1.1 hỗ trợ cú pháp biến động mạnh mẽ:

1. **Cú pháp tạo biến:** Trong nội dung prompt, hãy viết tên biến trong cặp ngoặc nhọn kép: `{{ten_bien}}`.
   * *Ví dụ:* `"Bạn là chuyên gia marketing, hãy viết bài quảng cáo cho sản phẩm {{san_pham}} với ngân sách {{ngan_sach}} dành cho đối tượng {{khach_hang}}."`
2. **Form nhập liệu tự động:** Ngay bên dưới ô soạn thảo, hệ thống tự động nhận diện và tạo các ô nhập liệu cho từng biến.
3. **Nút "Chèn biến":** Nhấp nút **`+ Chèn biến`** trên thanh công cụ để thêm biến nhanh vào nội dung.
4. **Nội suy tự động:** Khi bạn chạy thử nghiệm (Playground) hoặc chấm điểm, hệ thống tự động ghép giá trị của biến vào prompt theo thời gian thực.

---

## 4. Chạy Thử Nghiệm Prompt Trực Tiếp - Live Playground (Mới v1.1)

Không chỉ dừng lại ở việc chấm điểm, bạn có thể kiểm tra xem mô hình AI thực tế phản hồi như thế nào với prompt của bạn:

1. Bấm nút **`[▶ Chạy Thử]`** trên thanh công cụ, bên cạnh ô nhập prompt, hoặc trên phiên bản tối ưu của Gemini Pro.
2. Cửa sổ **Live Execution Playground** sẽ mở ra và tự động thực thi prompt qua Gemini API.
3. **Các chỉ số công nghiệp được đo lường tức thì:**
   * ⚡ **Độ trễ (Latency):** Thời gian mô hình phản hồi (tính bằng ms).
   * 🔢 **Tokens:** Số lượng token đầu vào (Input), đầu ra (Output) và tổng token.
   * 💵 **Ước tính Chi Phí:** Chi phí tương ứng theo USD ($).
   * 🤖 **Model:** Tên mô hình đang thực thi.
4. Nhấp nút **`[Sao chép output]`** để lưu kết quả trả về của AI.

---

## 5. Xuất Mã Nguồn SDK 1-Click: Python, TypeScript, cURL (Mới v1.1)

Dành cho lập trình viên muốn đưa prompt đã tối ưu vào dự án phần mềm:

1. Bấm nút **`[Xuất Code]`** trên Header hoặc bên cạnh phiên bản prompt nâng cấp.
2. Chọn ngôn ngữ mong muốn:
   * 🐍 **Python:** Sinh code hoàn chỉnh sử dụng SDK mới nhất của Google (`google-genai`).
   * 🔷 **TypeScript / Node.js:** Sinh code chuẩn `@google/genai` sẵn sàng cho backend.
   * 💻 **cURL:** Câu lệnh shell HTTP request gọi REST API trực tiếp.
   * 📄 **JSON Spec:** Định dạng dữ liệu chuẩn PromptOps có metadata.
3. Bấm **`[1-Click Sao Chép Mã]`** và dán thẳng vào dự án code của bạn.

---

## 6. Phân Hệ Tối Ưu Prompt Bằng Gemini Pro (Optimizer Studio)

Đây là không gian làm việc chính để **gửi prompt sang Gemini Pro tái cấu trúc**:

### Quy trình 4 bước thực hiện:
1. **Bước 1: Chọn Chuyên Mục & Nhập Prompt Thô:**
   * Chọn một trong 5 phân hệ (*Nghiên cứu, Tạo ảnh, Tạo video, Lập trình, Âm thanh*) trên thanh chuyên mục.
   * Nhập câu prompt thô ban đầu vào ô bên trái (hoặc chọn từ các mẫu có sẵn).
2. **Bước 2: Chọn Mục Tiêu Chỉnh Sửa:**
   * 🚀 *Chuẩn Production (95–100đ):* Bổ sung đầy đủ 5 trụ cột kỹ thuật.
   * 🛡️ *Thêm Rào Chắn Lỗi (Negative Rules):* Triệt tiêu ảo giác, chống AI trả lời sai lệch.
   * 📐 *Ép Schema Đầu Ra:* Định dạng JSON Schema hoặc bảng Markdown.
   * 🔬 *Tư Duy Logic Từng Bước:* Phân rã CoT thành các giai đoạn.
   * 🎨 *Tối Ưu Tham Số Chuyên Ngành:* Lens máy ảnh, ánh sáng, code stack.
3. **Bước 3: Chọn Khung Kỹ Thuật (Framework):**
   * `CO-STAR`: Phù hợp cho báo cáo chiến lược, nghiên cứu, marketing.
   * `CRISPE`: Phù hợp đóng vai chuyên gia lập trình, hệ thống, phân tích.
   * `RTF`: Role, Task, Format ngắn gọn, súc tích.
   * `STANDARD-PRO`: Tiêu chuẩn PromptOps đa phương thức.
4. **Bước 4: Bấm "✨ ĐƯA SANG GEMINI PRO TỐI ƯU HÓA":**
   * Xem kết quả ở cột bên phải (**Bản Gemini Pro Đã Chỉnh Sửa**).
   * Đọc phần **Báo cáo tinh chỉnh (Audit Log)** bên dưới để hiểu rõ Gemini Pro đã thêm gì, sửa gì.
   * Bấm **`[1-Click Copy Prompt]`**, **`[Chạy thử ngay]`** hoặc **`[Xuất Code]`**.

### 💬 Vòng Lặp Tinh Chỉnh Tương Tác:
Nếu muốn sửa đổi thêm, bạn chỉ cần gõ yêu cầu bổ sung vào ô chat ở cuối trang (ví dụ: *"Thêm ví dụ JSON phản hồi mẫu"*, *"Dịch toàn bộ sang tiếng Anh"*) và bấm **"Gửi"**. Gemini Pro sẽ cập nhật lại prompt ngay lập tức.

---

## 7. Phân Hệ Thẩm Định & Chấm Điểm 100 Điểm Song Ngữ (Evaluator)

Bấm vào tab **"Thẩm Định 100đ"** trên thanh Header để kiểm tra chất lượng định lượng của prompt:

### Hệ thống 5 trụ cột đánh giá:
1. **`[ROLE & CONTEXT]` (20đ):** Đánh giá việc định danh chuyên gia và mô tả bối cảnh bài toán.
2. **`[TASK & INSTRUCTION]` (25đ):** Đánh giá động từ hành động và tính logic của các bước thực thi.
3. **`[CONSTRAINTS & RULES]` (20đ):** Đánh giá các điều cấm kỵ (Negative constraints / Guardrails) chống ảo giác.
4. **`[OUTPUT FORMAT]` (20đ):** Đánh giá định dạng kết quả (JSON, Markdown, Code fence) và yêu cầu không trả lời lan man.
5. **`[EXAMPLES & SPECS]` (15đ):** Đánh giá ví dụ mẫu Few-shot hoặc các tham số kỹ thuật chuyên ngành.

* **Bảng chẩn đoán chi tiết:** Chỉ rõ các điểm đạt được (Pros - màu xanh) và các điểm còn thiếu cần bổ sung (Missing - màu đỏ).
* **Hỗ trợ Song ngữ chuẩn xác:** Tự động nhận diện cả tiếng Việt, tiếng Anh và các thẻ cấu trúc kỹ thuật (`[ROLE]`, `[TASK]`, `[CONSTRAINTS]`, `[OUTPUT FORMAT]`, `[PARAMETERS]`).

---

## 8. Hướng Dẫn Chuyên Biệt Theo Từng Phân Hệ Đa Phương Thức

* **🎨 Tạo Ảnh (Flux / Midjourney / SD):**
  * Sử dụng thanh công cụ để chèn nhanh tỷ lệ ảnh (`--ar 16:9`, `1:1`, `9:16`), tiêu cự Lens (85mm portrait, 35mm street), ánh sáng Cinematic/Volumetric.
  * Nhấp nút **`+ Khung Negative`** để tự động thêm danh sách điều cấm cho AI ảnh.
* **🎬 Tạo Video (Sora / Kling / Runway Gen-3):**
  * Chèn chuyển động camera 3 chiều: *Dolly in*, *Pan right*, *Tilt up*, *FPV dive*.
  * Tích hợp thông số: *60fps ultra-fluid*, *4K resolution*, *Motion factor*.
* **💻 Lập Trình & Code:**
  * Chọn nhanh tech stack: *Python 3.12 (Async)*, *TypeScript*, *Golang*, *Rust*.
  * Tích hợp tiêu chuẩn: *Clean Architecture*, *Pydantic V2 Validation*, *Unit Test Suite*.
* **🎵 Âm Thanh & Nhạc (Suno / Udio):**
  * Chèn các thẻ cấu trúc bài hát chuẩn: `[Verse]`, `[Chorus]`, `[Guitar Solo]`, `[Outro]`, nhịp BPM, thể loại nhạc.
* **🧠 Nghiên Cứu & LLM:**
  * Chèn khung phân tích: *SWOT*, *Executive Summary*, *Sơ đồ Mermaid Flowchart*, *Ma trận đối chiếu*.

---

## 9. Quản Lý & Xuất Bản Kho Prompt

* Bấm nút **"Lưu"** ở bất kỳ phiên bản nào để đưa vào thư viện nội bộ.
* Bấm **"Kho"** trên thanh tiêu đề để xem lại, tìm kiếm theo từ khóa, lọc theo danh mục.
* Bấm **"Xuất JSON"** để sao lưu toàn bộ thư viện hoặc chuyển sang các công cụ khác.

---

> 💡 **Quy tắc phát triển:** Mọi thay đổi về tính năng, thuật toán chấm điểm hay giao diện của LPrompt Studio sẽ luôn được cập nhật đầy đủ và đồng bộ vào tài liệu này trước mỗi lần commit.
