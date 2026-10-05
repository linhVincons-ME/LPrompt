# Hướng dẫn sử dụng LPrompts Studio 3.0

Tài liệu này phản ánh working tree hiện tại: LPrompt hoạt động theo kiến trúc extension-first, không gọi Gemini API và không lưu API key.

## 1. Cài extension

Yêu cầu Node.js 24 trở lên và Chrome 114 trở lên.

```powershell
cd D:\DevV2\LPrompt
npm ci
npm run build:extension
```

Trong Chrome:

1. Mở `chrome://extensions`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked**.
4. Chọn `D:\DevV2\LPrompt\extension-dist`.
5. Mở `https://gemini.google.com`.
6. Bấm biểu tượng **LPrompt for Gemini** để mở Side Panel.

Sau mỗi lần build lại, mở `chrome://extensions` và bấm **Reload** trên thẻ LPrompt.

## 2. Quy trình sử dụng chính

1. Chọn domain và framework `Auto`, `RTF`, `CO-STAR`, `CRISPE` hoặc `LPrompt Pro`.
2. Nhập yêu cầu gốc và chỉ thị bổ sung.
3. Bấm **Biên dịch prompt cục bộ**.
4. Chọn `VIE` hoặc `ENG`. Chỉ cấu trúc do compiler tạo được chuyển ngôn ngữ; nội dung người dùng nhập được giữ nguyên.
5. Đọc lại prompt, sau đó bấm **Chèn vào Gemini**.
6. Tự bấm gửi trong Gemini Web.
7. Khi cần lưu kết quả, chọn đoạn phản hồi hoặc bấm **Nhập phản hồi**, rồi lưu snapshot.

Extension không tự bấm gửi, không đọc cookie và không yêu cầu API key.

Bạn cũng có thể bôi chọn văn bản trên website bất kỳ, bấm chuột phải và chọn **Đưa phần đã chọn vào LPrompt**. Extension chỉ nhận phần văn bản đã chọn, không có quyền đọc toàn bộ mọi website.

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
- **Framework Compiler:** Auto, RTF, CO-STAR, CRISPE và LPrompt Pro.
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
