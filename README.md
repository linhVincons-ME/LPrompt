# LPrompts Studio 3.0

Ứng dụng local-first để soạn, biên dịch, đánh giá, kiểm thử và quản lý phiên bản prompt. Đường dùng chính là Chrome Side Panel chạy trực tiếp cạnh Gemini Web, không cần API key. Web app và service Node.js vẫn được giữ cho Batch Eval, DSPy, MCP, SQLite và các luồng tự động hóa tùy chọn.

## Điểm chính

- Chrome Extension Manifest V3 dùng Side Panel, chỉ có quyền trên `https://gemini.google.com/*`, không lấy cookie và không tự bấm gửi.
- Compiler cục bộ triển khai thực sự `RTF`, `CO-STAR`, `CRISPE`, `LPrompt Pro` và chế độ `Auto`; không còn nút framework chỉ đổi tên nhưng dùng chung logic.
- Gemini API là tùy chọn qua một client chung có timeout, hủy request, validation response và ước tính chi phí.
- Model mặc định `gemini-3.8-flash`; có `gemini-3.5-flash-lite` và `gemini-3.1-pro-preview`. Giá trong `src/services/modelCatalog.ts` là giá Standard tham chiếu tại thời điểm cập nhật và chỉ dùng để ước tính.
- Export Python, TypeScript, cURL và JSON luôn dùng placeholder/biến môi trường, không nhúng API key thật.
- Version graph có branch, parent, merge-parent, content hash, tìm tổ tiên chung và conflict markers.
- Few-shot gồm hai bước độc lập: sinh candidate bằng Gemini hoặc fallback cục bộ; sau đó người dùng có thể chạy DSPy `BootstrapFewShot` trên tối thiểu hai ví dụ đã gắn nhãn.
- Scanner bao phủ 10 nhóm OWASP for LLM Applications và, khi có API key, chạy 6 payload động có timeout/hủy.
- MCP Streamable HTTP chính thức tại `/mcp`, dùng `@modelcontextprotocol/sdk`.
- REST payload được giới hạn/validate; service mặc định chỉ bind `127.0.0.1`, kiểm tra Origin và dùng bảo vệ DNS rebinding của MCP SDK.

Điểm heuristic, auto-patch và kết quả red-team là tín hiệu hỗ trợ, không phải chứng nhận an toàn hay đảm bảo chất lượng production.

## Yêu cầu

- Node.js 24 trở lên.
- Python 3.10 trở lên nếu dùng DSPy.
- Chrome 114 trở lên nếu dùng extension.
- Gemini API key chỉ cần cho các chức năng chủ động gọi API; extension dùng phiên Gemini Web do người dùng tự đăng nhập và tự gửi.

## Cài đặt và chạy

```powershell
npm ci
npm run check
npm start
```

Mở `http://127.0.0.1:8484`. Để bật bước biên dịch DSPy, cài dependency Python:

```powershell
py -3 -m pip install -r python/requirements.txt
```

## Chrome Extension — đường dùng mặc định, không API key

```powershell
npm ci
npm run build:extension
```

Trong Chrome mở `chrome://extensions`, bật Developer mode, chọn **Load unpacked** và trỏ tới thư mục `extension-dist`. Sau đó mở `https://gemini.google.com`, bấm biểu tượng LPrompt và làm theo luồng:

1. Nhập yêu cầu, domain và framework; bấm **Biên dịch prompt cục bộ**.
2. Review kết quả rồi bấm **Chèn vào Gemini**. Extension chỉ điền ô soạn, không tự gửi.
3. Người dùng tự bấm gửi trên Gemini.
4. Bấm **Nhập phản hồi** để lấy đoạn đang chọn hoặc phản hồi cuối cùng; lưu snapshot nếu cần.

Draft, tối đa 10 snapshot gần nhất và phản hồi được giữ trong `chrome.storage.local`. Không có dữ liệu nào được extension gửi về service LPrompt. Selector DOM của Gemini có thể thay đổi theo giao diện Google; khi việc chèn/nhập thất bại, extension báo lỗi thay vì treo hoặc tự thao tác tiếp.

## Windows Service — bật/tắt không giữ cửa sổ CMD

Mở `Install_LPrompt_Windows_Service.bat` một lần và chấp nhận UAC. Installer sẽ build web app, tải đúng WinSW 2.12.0 từ GitHub, xác minh SHA-256, tạo service `LPrompt` chạy bằng tài khoản quyền thấp `LocalService`, sau đó kiểm tra `/health`. Chế độ mặc định là `Manual`: service chỉ chạy khi người dùng bật.

- `Run_LPrompt_Service.bat`: bật service, đợi trạng thái `ready`, rồi mở web app.
- `Stop_LPrompt_Service.bat`: gửi lệnh stop qua Windows Service Control Manager và chờ graceful shutdown; không force-kill Node.
- `Restart_LPrompt_Service.bat`: restart và kiểm tra health.
- `Get_LPrompt_Service_Status.bat`: xem trạng thái service và health.
- `Uninstall_LPrompt_Windows_Service.bat`: gỡ đăng ký service, giữ nguyên database và log.
- `Run_LPrompt_Service_Console.bat`: chỉ dành cho debug trực tiếp, có cửa sổ console.

Các lệnh tương đương nằm trong `service/windows` và các npm script `service:install`, `service:start`, `service:stop`, `service:restart`, `service:status`, `service:uninstall`. Install/start/stop/restart/uninstall cần PowerShell chạy bằng Administrator; các file `.bat` tự yêu cầu UAC. Runtime wrapper và log nằm trong `service/windows/runtime` và không được commit. `LocalService` chỉ có quyền đọc/chạy code; quyền ghi được giới hạn vào `data` và thư mục `logs`.

## Lệnh phát triển

```powershell
npm run dev
npm run lint
npm test
npm run build
npm run build:extension
npm run check
```

Test suite hiện có 10 file và 34 test case, gồm compiler cho bốn framework và Auto, contract an toàn của extension, Windows Service package, graceful DSPy cancellation, template interpolation, evaluator cho 5 domain, version graph/merge, secret-safe export, Gemini abort/schema errors, OWASP static/dynamic, REST/SQLite và MCP integration.

## API local

- `GET /health` — gồm `lifecycle`, PID, uptime và số DSPy process đang chạy.
- `GET|POST /api/prompts`, `DELETE /api/prompts/:id`
- `GET|POST /api/versions`, `DELETE /api/versions/:id`
- `GET /api/presets`
- `POST /api/backup`
- `POST /api/dspy/optimize`
- `POST /mcp`

Bind ngoài loopback bị từ chối nếu chưa cấu hình `LPROMPT_AUTH_TOKEN` (tối thiểu 24 ký tự), `LPROMPT_ALLOWED_HOSTS` và `LPROMPT_ALLOWED_ORIGINS`. Vẫn nên đặt reverse proxy TLS và firewall phù hợp.

Giao diện hiện không tự thêm Bearer token khi chạy remote. Remote mode vì vậy dành cho API/MCP client tự gửi header hoặc triển khai có reverse proxy xác thực; chế độ loopback là cấu hình được hỗ trợ trực tiếp cho giao diện local.

## Dữ liệu và bí mật

- Extension không yêu cầu hoặc lưu API key. Trong web app tùy chọn, API key được lưu trong `localStorage` khi người dùng lưu cấu hình và được gửi trực tiếp tới Gemini API. Tác vụ DSPy gửi key tới service rồi chuyển qua stdin cho tiến trình Python. Code hiện tại không chủ động ghi key vào SQLite, log hoặc code export; `localStorage` không phải kho bí mật bảo mật cao.
- SQLite, WAL, PID, backup và Windows Service runtime/log được ignore khỏi Git.
- Snapshot JSON của ngày hiện tại được ghi lại theo cơ chế atomic khi database khởi tạo và sau mỗi mutation qua lớp database. Backup chứa prompts, versions, test suites, security audits và settings trong SQLite; cấu hình API key ở `localStorage` không nằm trong backup.

## MCP

Endpoint stateless Streamable HTTP: `http://127.0.0.1:8484/mcp`. Tools: `lprompt_evaluate`, `lprompt_list_presets`, `lprompt_get_versions`, `lprompt_commit_version`. `lprompt_evaluate` dùng heuristic cục bộ đơn giản, không gọi Gemini và không tương đương toàn bộ evaluator trên giao diện.

## Trạng thái xác minh hiện tại

- `npm run check`: đạt — lint sạch, 34/34 test đạt, web app và extension production build thành công.
- `npm audit`: 0 vulnerability tại thời điểm kiểm tra.
- `py -3 -m pip check`: không có dependency bị hỏng; DSPy 3.4.0 import thành công.
- REST, SQLite DTO và MCP được kiểm thử integration trên database tạm.
- PowerShell service scripts và XML sinh ra đã qua parser validation; WinSW download URL/phiên bản/SHA-256 và least-privilege config có test hồi quy. Tiến trình Node thật cũng đã được smoke-test: health `ready`, nhận SIGINT, shutdown graceful, xóa PID và nhả khóa SQLite.
- Chưa chạy tác vụ Gemini hoặc DSPy end-to-end với API key thật trong test tự động. Các đường Gemini được mock; việc dùng model thật phụ thuộc key, quota, mạng và trạng thái dịch vụ Google.
- Chưa chạy smoke test tương tác bằng cách load unpacked vào Chrome đăng nhập Gemini; build và TypeScript đã đạt nhưng selector DOM cần được xác nhận thủ công trên giao diện tài khoản thực.
- Chưa đăng ký service thật trên Windows trong test tự động vì install/uninstall cần UAC và thay đổi Service Control Manager.
- Vite hiện cảnh báo bundle JavaScript web app khoảng 531 kB sau minify; build vẫn thành công.

## License

MIT — xem `LICENSE`.
