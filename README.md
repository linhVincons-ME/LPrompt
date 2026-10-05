# LPrompts Studio 3.0

Ứng dụng local để soạn, đánh giá, chạy thử, kiểm thử và quản lý phiên bản prompt. Nhận diện thương hiệu chính thức với logo chữ **L** màu hồng tím neon phong cách AI PromptOps, hiển thị đồng bộ trên favicon trình duyệt và thanh điều hướng ứng dụng. Giao diện React có thể chạy bằng Vite hoặc được phục vụ bởi service Node.js; khi service hoạt động, dữ liệu prompt và version được đồng bộ với SQLite tại `data/lprompt.db`.

## Điểm chính

- Gemini API qua một client chung có timeout, hủy request, validation response và ước tính chi phí.
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
- Gemini API key nếu gọi model thật; hạn mức và chi phí phụ thuộc tài khoản Google AI Studio.

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

Trên Windows có thể dùng `Run_LPrompt_Service.bat`; script build lại, đợi `/health` thành công rồi mới mở trình duyệt. `Stop_LPrompt_Service.bat` chỉ dừng PID Node được service ghi vào `data/lprompt.pid`, không giết tùy tiện tiến trình đang dùng cổng.

## Lệnh phát triển

```powershell
npm run dev
npm run lint
npm test
npm run build
npm run check
```

Test suite hiện có 7 file và 20 test case, gồm template interpolation, evaluator cho 5 domain, version graph/merge, secret-safe export, Gemini abort/schema errors, OWASP static/dynamic, DSPy process timeout, REST/SQLite và MCP integration.

## API local

- `GET /health`
- `GET|POST /api/prompts`, `DELETE /api/prompts/:id`
- `GET|POST /api/versions`, `DELETE /api/versions/:id`
- `GET /api/presets`
- `POST /api/backup`
- `POST /api/dspy/optimize`
- `POST /mcp`

Bind ngoài loopback bị từ chối nếu chưa cấu hình `LPROMPT_AUTH_TOKEN` (tối thiểu 24 ký tự), `LPROMPT_ALLOWED_HOSTS` và `LPROMPT_ALLOWED_ORIGINS`. Vẫn nên đặt reverse proxy TLS và firewall phù hợp.

Giao diện hiện không tự thêm Bearer token khi chạy remote. Remote mode vì vậy dành cho API/MCP client tự gửi header hoặc triển khai có reverse proxy xác thực; chế độ loopback là cấu hình được hỗ trợ trực tiếp cho giao diện local.

## Dữ liệu và bí mật

- API key được lưu trong `localStorage` khi người dùng lưu cấu hình và được gửi trực tiếp tới Gemini. Tác vụ DSPy gửi key tới service rồi chuyển qua stdin cho tiến trình Python. Code hiện tại không chủ động ghi key vào SQLite, log hoặc code export; `localStorage` không phải kho bí mật bảo mật cao.
- SQLite, WAL, PID và backup runtime được ignore khỏi Git.
- Snapshot JSON của ngày hiện tại được ghi lại theo cơ chế atomic khi database khởi tạo và sau mỗi mutation qua lớp database. Backup chứa prompts, versions, test suites, security audits và settings trong SQLite; cấu hình API key ở `localStorage` không nằm trong backup.

## MCP

Endpoint stateless Streamable HTTP: `http://127.0.0.1:8484/mcp`. Tools: `lprompt_evaluate`, `lprompt_list_presets`, `lprompt_get_versions`, `lprompt_commit_version`. `lprompt_evaluate` dùng heuristic cục bộ đơn giản, không gọi Gemini và không tương đương toàn bộ evaluator trên giao diện.

## Trạng thái xác minh hiện tại

- `npm run check`: đạt — lint sạch, 20/20 test đạt, production build thành công.
- `npm audit`: 0 vulnerability tại thời điểm kiểm tra.
- `py -3 -m pip check`: không có dependency bị hỏng; DSPy 3.4.0 import thành công.
- REST, SQLite DTO và MCP được kiểm thử integration trên database tạm.
- Chưa chạy tác vụ Gemini hoặc DSPy end-to-end với API key thật trong test tự động. Các đường Gemini được mock; việc dùng model thật phụ thuộc key, quota, mạng và trạng thái dịch vụ Google.
- Vite hiện cảnh báo bundle JavaScript chính khoảng 525 kB sau minify; build vẫn thành công.

## License

MIT — xem `LICENSE`.
