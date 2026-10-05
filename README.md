# LPrompts Studio 3.0

LPrompts Studio là bộ công cụ local-first để soạn, biên dịch, đánh giá, kiểm thử và quản lý phiên bản prompt. Đường dùng chính là Chrome Side Panel chạy cạnh Gemini Web.

## Kiến trúc hiện tại

- Không gọi Gemini API, không có màn hình API key, model catalog, SDK export hoặc endpoint DSPy.
- Compiler, evaluator, few-shot, batch structural test và security scan chạy cục bộ.
- Extension chỉ có quyền trên `https://gemini.google.com/*`, không đọc cookie và không tự bấm gửi.
- Web app và Windows Service chỉ phục vụ giao diện, SQLite, REST và MCP cục bộ.
- Khi nâng cấp từ bản cũ, web app xóa khóa `lprompt_gemini_config` khỏi `localStorage`.

## Chrome Extension

Yêu cầu Chrome 114 trở lên.

```powershell
npm ci
npm run build:extension
```

Mở `chrome://extensions`, bật **Developer mode**, chọn **Load unpacked** và trỏ tới `D:\DevV2\LPrompt\extension-dist`. Sau đó mở `https://gemini.google.com`, bấm biểu tượng LPrompt để mở Side Panel.

Luồng sử dụng:

1. Nhập yêu cầu, domain và framework.
2. Bấm **Biên dịch prompt cục bộ**.
3. Chọn `VIE` hoặc `ENG`, đọc lại kết quả.
4. Bấm **Chèn vào Gemini**. Extension chỉ điền ô soạn; người dùng tự bấm gửi.
5. Bấm **Nhập phản hồi** để lấy phần đang chọn hoặc phản hồi cuối cùng.
6. Lưu snapshot nếu cần.

Draft, phản hồi và tối đa 10 snapshot được lưu bằng `chrome.storage.local`.

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
- `POST /api/backup`

MCP Streamable HTTP: `POST http://127.0.0.1:8484/mcp`.

## Kiểm tra

```powershell
npm run check
```

Lệnh trên chạy lint, test, web build và extension build. Kiểm thử gồm compiler song ngữ, VIE/ENG, extension safety, nhận diện quá tải/cooldown, local export, evaluator, batch, security scan tĩnh, version graph, REST/SQLite/MCP và Windows Service.

Chrome vẫn cần smoke-test thủ công sau khi load unpacked vì cấu trúc DOM của Gemini Web có thể thay đổi theo tài khoản hoặc phiên bản giao diện.

## Dữ liệu và quyền riêng tư

- Không có Gemini API key trong code hoặc runtime configuration.
- Extension không tự gửi prompt và chỉ đọc phản hồi khi người dùng yêu cầu; riêng thông báo lỗi tạm thời được quan sát để bật cooldown.
- SQLite, WAL, PID, backup runtime, `dist`, `extension-dist`, `service/windows/runtime`, `node_modules` và `.env` được ignore khỏi Git.

## License

Xem [LICENSE](./LICENSE).
