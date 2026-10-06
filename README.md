# LPrompts Studio 3.0

LPrompts Studio là bộ công cụ local-first để soạn, biên dịch, đánh giá, kiểm thử và quản lý phiên bản prompt, với nhận diện thương hiệu logo chữ **L** hồng tím neon phong cách AI PromptOps. Đường dùng chính là Chrome Side Panel chạy cạnh Gemini Web.

## Kiến trúc hiện tại

- Không gọi Gemini API, không có màn hình API key, model catalog, SDK export hoặc endpoint DSPy.
- Compiler, evaluator, few-shot, template test, phát hiện mơ hồ/xung đột và quét guardrail tĩnh chạy cục bộ.
- Extension chỉ có quyền trên Gemini Web và cầu nối loopback `127.0.0.1:8484`; không có quyền `<all_urls>`, không đọc cookie và không tự bấm gửi.
- Web app và Windows Service chỉ phục vụ giao diện, SQLite, REST và MCP cục bộ.
- Dự án không tích hợp local LLM, Ollama hoặc LM Studio để tránh sử dụng thêm CPU, RAM và dung lượng model.
- Khi nâng cấp từ bản cũ, web app xóa khóa `lprompt_gemini_config` khỏi `localStorage`.

## Trình duyệt hỗ trợ (Chrome & Firefox Extension)

Yêu cầu Chrome 114+ hoặc Mozilla Firefox 115+ (khuyên dùng Firefox 142+).

```powershell
npm ci
npm run build:extension
```

Lệnh `npm run build:extension` sẽ tự động biên dịch cả 2 phiên bản:
- `extension-dist`: Dành cho Google Chrome / Chromium. Mở `chrome://extensions`, bật **Developer mode**, chọn **Load unpacked** và trỏ tới `D:\DevV2\LPrompt\extension-dist`.
- `extension-dist-firefox`: Dành cho Mozilla Firefox. Chạy file `Install_LPrompt_Firefox.bat` để mở Firefox và chọn file `manifest.json` trong `extension-dist-firefox` (hoặc chạy `Run_LPrompt_Firefox.bat` để khởi chạy Firefox độc lập đã nạp sẵn extension).

Sau đó mở `https://gemini.google.com`, bấm biểu tượng LPrompt (hoặc mở Sidebar trên Firefox) để bắt đầu.

Luồng sử dụng:

1. Nhập yêu cầu và chọn domain.
2. Bấm **Biên dịch prompt cục bộ**. LPrompt sử dụng một bộ biên dịch chuẩn duy nhất.
3. Chọn `VIE` hoặc `ENG`, đọc lại kết quả.
4. Bấm **Chèn vào Gemini**. Extension chỉ điền ô soạn; người dùng tự bấm gửi.
5. Bấm **Nhập phản hồi** để lấy phần đang chọn hoặc phản hồi cuối cùng.
6. Lưu snapshot nếu cần.

### Prompt thi công công trình (Tích hợp trong cả Extension & Web App)

Trong cả **Extension (Chrome & Firefox)** lẫn **Web App**, chọn tab **Thi Công** (biểu tượng mũ bảo hộ) để mở compiler chuyên ngành hiện trường:
- Hỗ trợ prompt Ảnh và Video với tỷ lệ 9:16, 16:9 hoặc 1:1; thời lượng và âm thanh chỉ xuất hiện trong prompt video.
- Cấu hình nhân sự cố định: `1 người - KTHT`, `2 người - KTHT, TDTD`, `2 người - KTHT, CND`, `2 người - TDTD, CND` hoặc `3 người - KTHT, 2 CND`.
- Tải tối đa 4 ảnh tham chiếu PNG/JPG/WebP, mỗi ảnh tối đa 5 MB. Extension giữ ảnh trong phiên và đính kèm khi người dùng bấm **Chèn vào Gemini**.
- Tự loại yêu cầu bổ sung trùng lặp kèm cảnh báo và chặn biên dịch khi phát hiện tỷ lệ, số người, chữ/phụ đề hoặc thuộc tính media mâu thuẫn.
- Định hướng hành động tự nhiên của KTHT dựa trên lời thoại thay vì in chữ thô lên ảnh/video.
- Áp dụng chuẩn an toàn lao động, trang phục PPE (mũ, áo, tem chức danh), bảo vệ kỹ thuật tuyến cáp/hố ga và cấm bịa đặt kết quả nghiệm thu.
- Nút **Chèn vào Gemini** trực tiếp từ extension side panel / sidebar; extension không tự bấm gửi. Nếu Gemini chưa dựng ô tải tệp, mở menu tải tệp trên Gemini rồi bấm Chèn lại.

Draft, phản hồi và tối đa 10 snapshot được lưu bằng `chrome.storage.local`.

### Context menu và cầu nối cục bộ

- Trên website bất kỳ, bôi chọn văn bản rồi bấm chuột phải → **Đưa phần đã chọn vào LPrompt**. Extension chỉ nhận đúng `selectionText`; không đọc DOM toàn trang.
- Trong **Xem trước prompt cục bộ**, nút **Chuyển sang extension** gửi draft tới service bằng bộ nhớ tạm, TTL 10 phút. Extension đọc draft qua loopback; draft trung chuyển không được ghi vào SQLite.
- Nếu cần giới hạn chính xác extension được phép đọc bridge, đặt `LPROMPT_EXTENSION_IDS` thành danh sách extension ID, phân tách bằng dấu phẩy, rồi restart service.

### Bảo vệ khi Gemini quá tải

Content script theo dõi các thông báo quá tải/rate-limit tạm thời trên Gemini Web. Khi phát hiện:

- prompt và bản compile vẫn được giữ nguyên;
- lỗi không bị lưu như một phản hồi thành công;
- extension không tự gửi lại;
- nút chèn bị cooldown tăng dần 15, 30, 60 rồi tối đa 120 giây;
- thông báo DOM trùng trong 10 giây không làm tăng bộ đếm;
- người dùng chỉ có thể chèn lại thủ công sau cooldown.

Cơ chế này không thể loại bỏ sự cố capacity phía Google; nó ngăn mất dữ liệu, gửi trùng và retry dồn dập.

## Web app và Windows Service

Chạy phát triển:

```powershell
npm run dev
```

Chạy service trực tiếp:

```powershell
npm start
```

Mở `http://127.0.0.1:8484`.

Cài Windows Service bằng `Install_LPrompt_Windows_Service.bat`. Service mặc định chạy thủ công, có thể bật/tắt bằng các file `Start_...`, `Stop_...`, `Restart_...` và `Get_..._Status.bat` ở thư mục gốc.

REST cục bộ:

- `GET /health`
- `GET|POST /api/prompts`
- `DELETE /api/prompts/:id`
- `GET|POST /api/versions`
- `DELETE /api/versions/:id`
- `GET /api/presets`
- `POST|GET /api/extension/draft` (bridge tạm thời web → extension)
- `POST /api/backup`

MCP Streamable HTTP: `POST http://127.0.0.1:8484/mcp`.

## Kiểm tra

```powershell
npm run check
```

Lệnh trên chạy lint, test, web build và extension build. Kiểm thử gồm compiler song ngữ, VIE/ENG, extension safety, bridge, nhận diện quá tải/cooldown, local export, evaluator, template test, phát hiện mơ hồ/xung đột, quét guardrail tĩnh, version graph, REST/SQLite/MCP và Windows Service.

Chrome vẫn cần smoke-test thủ công sau khi load unpacked vì cấu trúc DOM của Gemini Web có thể thay đổi theo tài khoản hoặc phiên bản giao diện.

## Dữ liệu và quyền riêng tư

- Không có Gemini API key trong code hoặc runtime configuration.
- Extension không tự gửi prompt và chỉ đọc phản hồi khi người dùng yêu cầu; riêng thông báo lỗi tạm thời được quan sát để bật cooldown.
- SQLite, WAL, PID, backup runtime, `dist`, `extension-dist`, `service/windows/runtime`, `node_modules` và `.env` được ignore khỏi Git.

## License

Xem [LICENSE](./LICENSE).
