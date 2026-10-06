# Hướng dẫn sử dụng LPrompts Studio 3.0

Tài liệu này phản ánh working tree hiện tại: LPrompt hoạt động theo kiến trúc extension-first, không gọi Gemini API và không lưu API key.

## 1. Cài extension (Chrome & Firefox)

Yêu cầu Node.js 24 trở lên, Chrome 114 trở lên hoặc Firefox 115+ (khuyên dùng Firefox 142+).

```powershell
cd D:\DevV2\LPrompt
npm ci
npm run build:extension
```
Lệnh trên sẽ tự động build cả 2 phiên bản:
- `D:\DevV2\LPrompt\extension-dist` (cho Google Chrome / Chromium)
- `D:\DevV2\LPrompt\extension-dist-firefox` (cho Mozilla Firefox)

### Trong Google Chrome:

1. Mở `chrome://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked**.
4. Chọn thư mục `D:\DevV2\LPrompt\extension-dist`.
5. Mở `https://gemini.google.com`.
6. Bấm biểu tượng **LPrompt for Gemini** để mở Side Panel.

Sau mỗi lần build lại, mở `chrome://extensions` và bấm **Reload** trên thẻ LPrompt.

### Trong Mozilla Firefox:

**Cách 1: Cài đặt và mở tự động (Nhanh nhất)**
Chạy script chuẩn bị cài đặt:
- Bấm đúp vào file `Install_LPrompt_Firefox.bat` (hoặc chạy `powershell -ExecutionPolicy Bypass -File Install_LPrompt_Firefox.ps1`).
- Firefox sẽ tự động mở trang `about:debugging#/runtime/this-firefox`, đường dẫn file `manifest.json` đã được tự động sao chép vào bộ nhớ tạm (Clipboard), đồng thời cửa sổ Explorer mở sẵn file `manifest.json`.
- Bấm **Load Temporary Add-on...** (Tải tiện ích tạm thời...) và chọn file `manifest.json` trong thư mục `extension-dist-firefox` (hoặc dán đường dẫn đã copy).

**Cách 2: Khởi chạy Firefox độc lập với Extension cài sẵn**
- Bấm đúp vào file `Run_LPrompt_Firefox.bat` (hoặc chạy `npm run run:firefox`).
- Firefox sẽ tự động mở trang `https://gemini.google.com` với extension LPrompt đã nạp sẵn, dữ liệu đăng nhập được lưu riêng trong `data/firefox-profile`.

**Sử dụng trên Firefox:**
- Bấm biểu tượng **LPrompt** trên thanh công cụ hoặc mở Sidebar (phím tắt `Ctrl + B` hoặc chọn thanh Sidebar) để thao tác song song với Gemini Web.

## 2. Quy trình sử dụng chính

### 2.1. Tab Tiêu chuẩn (Soạn thảo & Thẩm định chung)
1. Chọn domain (`Nghiên cứu`, `Code`, `Hình ảnh`, `Video`, `Âm thanh`). LPrompt sử dụng bộ biên dịch chuẩn tối ưu sẵn.
2. Nhập yêu cầu gốc và chỉ thị bổ sung.
3. Bấm **Biên dịch prompt cục bộ**.
4. Chọn `VIE` hoặc `ENG`. Chỉ cấu trúc do compiler tạo được chuyển ngôn ngữ; nội dung người dùng nhập được giữ nguyên.
5. Đọc lại prompt, sau đó bấm **Chèn vào Gemini**.
6. Tự bấm gửi trong Gemini Web.
7. Khi cần lưu kết quả, chọn đoạn phản hồi hoặc bấm **Nhập phản hồi**, rồi lưu snapshot.

### 2.2. Tab Thi công (Compiler chuyên ngành Công trình & Hiện trường)
1. Chuyển sang tab **Thi công** (có biểu tượng mũ bảo hộ).
2. Chọn loại output: **Prompt Ảnh** hoặc **Prompt Video**.
3. Nhập **Bối cảnh thi công** (ai đang ở đâu, hạng mục cáp điện/hạ tầng nào, khu vực nghiệm thu), có thể bấm nút **Mẫu thử** để nạp nhanh ví dụ chuẩn.
4. Nhập **Lời thoại nhân vật** (nếu có): Compiler sẽ phân tích và chuyển thành hành động, tư thế chỉ trỏ/hướng dẫn tự nhiên của KTHT thay vì in chữ thô lên ảnh/video.
5. Thiết lập tỷ lệ khung hình (`9:16`, `16:9`, `1:1`), thời lượng phân cảnh/video (3-30s), ảnh tham chiếu PPE (mũ, áo, tem chức danh), và yêu cầu bổ sung.
6. Bấm **Biên dịch prompt thi công**:
   - Compiler tự động xuất prompt chuẩn hóa theo đúng 7 phần nghiệp vụ chuyên biệt:
     1. **`[ĐẦU RA VÀ THỜI LƯỢNG]`**: Tỷ lệ khung hình, phong cách tài liệu hiện trường, thời lượng phân cảnh (3-30s).
     2. **`[VAI TRÒ TỪNG ẢNH]`**: Xác định vai trò của ảnh trong chuỗi nghiệp vụ (hướng dẫn kỹ thuật, đối chiếu hồ sơ, nghiệm thu hoặc tổng kết bàn giao).
     3. **`[NHÂN VẬT VÀ CÁC ĐẶC ĐIỂM ƯU TIÊN]`**: Khóa nhận diện duy nhất một kỹ sư KTHT người Việt Nam, chuẩn mực trang phục PPE (mũ bảo hộ trắng, tem chức danh, áo phản quang, giày an toàn), quy tắc nhận diện thương hiệu.
     4. **`[BỐI CẢNH, VỊ TRÍ VẬT THỂ]`**: Chi tiết bối cảnh hiện trường, bố trí vật thể ở tiền cảnh/hậu cảnh, quy chuẩn công trường 5S, an toàn lối đi.
     5. **`[HÀNH ĐỘNG VÀ CAMERA]`**: Cử chỉ thuyết trình/kiểm tra tự nhiên theo lời thoại, bố cục trung toàn cảnh ngang tầm mắt (Medium-Wide Shot, Eye-level), tiêu cự 35-50mm.
     6. **`[ÂM THANH]`**: Âm thanh môi trường hiện trường thực tế, định hướng lời thoại kỹ sư rõ ràng, nhạc nền tài liệu công nghiệp.
     7. **`[RÀNG BUỘC NGẮN, KHÔNG MÂU THUẪN]`**: 5 nguyên tắc dứt khoát: 1 nhân vật duy nhất, 100% tuân thủ PPE, trung thực kỹ thuật không bịa kết quả nghiệm thu, không in chữ/watermark lên ảnh, nhất quán ánh sáng ban ngày tự nhiên.
   - Bấm **Chèn vào Gemini** để đưa ngay vào khung chat Gemini Web, hoặc bấm **Chuyển sang tab Tiêu chuẩn** nếu muốn tùy biến thêm.

Extension không tự bấm gửi, không đọc cookie và không yêu cầu API key.

Bạn cũng có thể bôi chọn văn bản trên website bất kỳ, bấm chuột phải và chọn **Đưa phần đã chọn vào LPrompt**. Khi đang ở tab Thi công, văn bản này sẽ tự động nạp vào trường Bối cảnh thi công.

## 3. Khi Gemini báo quá tải

Extension nhận diện các thông báo như `high demand`, `try again later`, `temporarily unavailable`, `too many requests`, `rate limit` và `429`.

Khi phát hiện:

- Không ghi thông báo lỗi vào vùng phản hồi.
- Không xóa prompt hoặc bản compile.
- Không tự retry hoặc tự bấm gửi.
- Khóa nút chèn trong 15 giây ở lần đầu; các lần liên tiếp tăng thành 30, 60 và tối đa 120 giây.
- Sau cooldown, nút **Chèn lại** được bật để người dùng quyết định.
- Một thông báo DOM giống hệt lặp lại trong 10 giây chỉ được tính một lần.
- Chuỗi lỗi được đặt lại nếu không phát sinh lỗi liên quan trong 10 phút.

Nếu vẫn quá tải sau nhiều lần, giữ prompt và thử lại sau hoặc mở cuộc trò chuyện Gemini mới. LPrompt không thể thay đổi capacity phía Google.

## 4. Web app cục bộ

```powershell
npm run dev
```

Web app có compiler, thẩm định heuristic, xem trước cục bộ, template test, bộ phát hiện mơ hồ/xung đột, few-shot builder, quét guardrail tĩnh, thư viện và lịch sử phiên bản. Không tính phí model và không tạo phản hồi AI thật.

**Xem trước prompt cục bộ** chỉ kiểm tra độ dài, biến template, output contract, guardrail, điểm mơ hồ và xung đột. Số token hiển thị là ước lượng, không phải tokenizer của Gemini. Để nhận phản hồi AI thật, dùng extension và Gemini Web.

Nút **Chuyển sang extension** dùng service làm cầu nối bộ nhớ tạm trong tối đa 10 phút. Dữ liệu trung chuyển không được ghi vào SQLite. Nếu service tắt hoặc request timeout, nội dung trong web app vẫn được giữ nguyên.

## 5. Windows Service

Cài một lần bằng `Install_LPrompt_Windows_Service.bat` và chấp nhận UAC. Sau đó dùng:

- `Start_LPrompt_Service.bat`
- `Stop_LPrompt_Service.bat`
- `Restart_LPrompt_Service.bat`
- `Get_LPrompt_Service_Status.bat`
- `Uninstall_LPrompt_Windows_Service.bat`

Service bind mặc định tại `127.0.0.1:8484`, cung cấp web app, SQLite, REST và MCP. Service không thực thi model AI.

## 6. Các chức năng local

- **Thẩm định 100đ:** heuristic theo role/context, task clarity, constraints, output format và examples/specs.
- **LPrompt Compiler:** một bộ biên dịch chuẩn duy nhất, tập trung vào đầu vào, ràng buộc, định dạng kết quả và chống bịa dữ liệu.
- **Few-Shot:** tạo mẫu heuristic theo domain và cho phép sửa thủ công.
- **Template Test:** điền biến và chạy assertion `contains`, `not_contains`, `regex`, `min_length` trên template cục bộ; không gọi AI.
- **Kiểm tra mơ hồ/xung đột:** phát hiện giới hạn độ dài, ngôn ngữ, định dạng mâu thuẫn và các tiêu chí khó đo lường.
- **Security:** quét tĩnh mức độ bao phủ guardrail thuộc 10 nhóm OWASP LLM và sinh patch; không tuyên bố là dynamic red-team.
- **Xuất Prompt:** Markdown, plain text hoặc JSON; không sinh SDK/cURL/API endpoint.
- **Versioning:** branch, commit, merge, diff và rollback.
- Có 9 Fabric-style presets trong working tree hiện tại.
- Không tích hợp local LLM/Ollama/LM Studio để tránh tiêu tốn tài nguyên máy không cần thiết.

## 7. Kiểm tra dự án

```powershell
npm run lint
npm test
npm run build
npm run build:extension
npm run check
```

Ngoài test tự động, cần kiểm tra Chrome thật vì selector ô nhập và phản hồi của Gemini có thể thay đổi. Khi chức năng chèn/nhập báo không tìm thấy phần tử, reload tab Gemini và extension trước; nếu vẫn lỗi thì cập nhật selector trong `extension/contentScript.ts`.

## 8. Dữ liệu cục bộ

- Extension lưu draft, phản hồi, trạng thái cooldown và tối đa 10 snapshot trong `chrome.storage.local`.
- Web app lưu cache thư viện/lịch sử trong browser và đồng bộ SQLite khi service sẵn sàng.
- Bridge web → extension chỉ giữ một draft mới nhất trong RAM của service và tự hết hạn sau 10 phút. Có thể đặt `LPROMPT_EXTENSION_IDS` để giới hạn extension ID được phép đọc.
- Bản nâng cấp sẽ xóa khóa cấu hình Gemini API cũ `lprompt_gemini_config` khỏi `localStorage`.

## 9. Nhận diện thương hiệu & Logo

- Biểu tượng vector SVG chính thức với chữ **L** màu hồng tím neon (`#c084fc` -> `#a855f7` -> `#d946ef` -> `#ec4899`), lồng ghép ký hiệu prompt chevron `>` và ngôi sao lấp lánh AI `✦`.
- Hiển thị đồng bộ tại favicon (`public/favicon.svg`), tiêu đề tab trình duyệt `LPrompts Studio - AI Prompt Engineering & PromptOps IDE`, và thanh điều hướng giao diện web (`src/components/Logo.tsx`).
