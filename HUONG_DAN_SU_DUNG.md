# Hướng dẫn sử dụng LPrompts Studio 3.0

Tài liệu này mô tả đúng trạng thái working tree hiện tại. Các điểm số heuristic, nội dung do Gemini tạo và kết quả red-team chỉ là tín hiệu hỗ trợ; chúng không phải chứng nhận chất lượng hoặc an toàn production.

## 1. Yêu cầu và cài đặt

- Node.js 24 trở lên.
- Python 3.10 trở lên chỉ bắt buộc nếu dùng bước biên dịch DSPy.
- Chrome 114 trở lên nếu dùng extension.
- Gemini API key chỉ cần khi web app chủ động gọi API; luồng extension cạnh Gemini Web không cần key.

```powershell
npm ci
npm run check
```

Nếu dùng DSPy:

```powershell
py -3 -m pip install -r python/requirements.txt
```

## 2. Chrome Extension — cách dùng mặc định

Build extension:

```powershell
npm run build:extension
```

Mở `chrome://extensions`, bật Developer mode, chọn **Load unpacked** và trỏ tới `D:\DevV2\LPrompt\extension-dist`. Mở Gemini Web, bấm biểu tượng LPrompt để mở Side Panel.

Quy trình sử dụng:

1. Chọn domain và `Tự động`, `RTF`, `CO-STAR`, `CRISPE` hoặc `LPrompt Pro`.
2. Nhập yêu cầu gốc và chỉ thị bổ sung, sau đó bấm **Biên dịch prompt cục bộ**.
3. Đọc lại prompt. Bấm **Chèn vào Gemini** để điền ô soạn; extension không tự bấm gửi.
4. Tự bấm gửi trong Gemini sau khi đã kiểm tra.
5. Khi cần lưu kết quả, chọn đoạn phản hồi hoặc bấm **Nhập phản hồi**, rồi lưu snapshot.

`Auto` chọn khung theo domain, từ khóa và độ dài. Bốn framework tạo cấu trúc khác nhau; `LPrompt Pro` là khung riêng của dự án cho tác vụ production, không được mô tả như một tiêu chuẩn ngành. Dữ liệu extension được lưu cục bộ bằng `chrome.storage.local`, tối đa 10 snapshot. Extension chỉ khai báo host permission cho `gemini.google.com`, không đọc cookie, không tự gửi prompt và không đọc phản hồi cho tới khi người dùng bấm nút.

Nếu Gemini thay đổi DOM, extension sẽ báo không tìm thấy ô nhập/phản hồi. Hãy reload tab sau khi cài hoặc cập nhật extension; nếu vẫn lỗi thì selector trong `extension/contentScript.ts` cần được cập nhật.

## 3. Khởi động web app và service tùy chọn

### Cài Windows Service — khuyến nghị

Double-click `Install_LPrompt_Windows_Service.bat` và chấp nhận UAC. Installer thực hiện:

1. Kiểm tra Node.js 24+ và build production.
2. Tải WinSW 2.12.0 từ release chính thức và bắt buộc khớp SHA-256 đã pin.
3. Tạo config runtime trong `service/windows/runtime`.
4. Cấp `LocalService` quyền đọc/chạy ứng dụng và quyền ghi riêng trên `data`, `runtime/logs`.
5. Đăng ký service tên `LPrompt` ở chế độ `Manual`, bật service và chờ `/health` trả `ready`.

Sau khi cài:

- `Run_LPrompt_Service.bat`: Turn on và mở trình duyệt.
- `Stop_LPrompt_Service.bat`: Turn off an toàn.
- `Restart_LPrompt_Service.bat`: restart.
- `Get_LPrompt_Service_Status.bat`: xem trạng thái SCM và health.
- `Uninstall_LPrompt_Windows_Service.bat`: gỡ service nhưng không xóa database/log.

Các file `.bat` tự yêu cầu UAC khi cần và đóng sau khi thao tác hoàn tất; không để cửa sổ CMD chạy nền. Có thể điều khiển cùng service trong `services.msc` hoặc bằng các npm script `service:*` từ PowerShell Administrator.

Mặc định service không tự chạy khi boot. Muốn Automatic Delayed Start, chạy từ PowerShell Administrator:

```powershell
.\service\windows\Install-LPromptService.ps1 -StartMode Automatic -DelayedAutoStart -StartAfterInstall
```

Nếu máy offline, tải trước đúng `WinSW-x64.exe` 2.12.0 rồi truyền `-WinSwSource`; file vẫn phải khớp SHA-256. Nếu cần DSPy dưới `LocalService`, nên dùng Python cài system-wide và truyền đường dẫn tuyệt đối bằng `-PythonExe`.

### Chạy trực tiếp để debug

```powershell
npm run build
npm start
```

Mặc định service nghe tại `http://127.0.0.1:8484` và phục vụ cả giao diện, REST API và MCP.

### Chế độ phát triển

```powershell
npm run dev
```

Vite thường chạy tại `http://localhost:5173`. Giao diện sẽ thử kết nối service tại `http://127.0.0.1:8484`; nếu service không chạy, thư viện và lịch sử vẫn dùng cache trình duyệt nhưng REST, SQLite, MCP và DSPy backend không khả dụng.

### Script Windows bổ sung

- `Start_LPrompt_Service.vbs`: launcher tương thích, yêu cầu UAC rồi bật Windows Service; không tạo tiến trình Node rời.
- `Run_LPrompt_Service_Console.bat`: chạy trực tiếp trong console để debug, không đi qua SCM.
- Log service nằm trong `service/windows/runtime/logs`. PID file chỉ còn là dữ liệu chẩn đoán; các script không dùng PID để force-kill.

Khi stop, server chuyển lifecycle sang `stopping`, từ chối request mới, đóng idle connection, hủy DSPy đang chạy, chờ tối đa 12 giây rồi mới force-close HTTP connection còn lại. WinSW cho tổng cộng 20 giây trước khi cưỡng bức wrapper.

## 4. Cấu hình service

Các biến mẫu nằm trong `.env.example`. Vite nạp biến `VITE_*` khi chạy/build frontend; tiến trình Node hiện không dùng `dotenv`, nên các biến `LPROMPT_*` phải được đặt trong shell, process manager hoặc công cụ nạp env bên ngoài.

| Biến | Mặc định | Ý nghĩa |
|---|---:|---|
| `LPROMPT_HOST` | `127.0.0.1` | Địa chỉ bind |
| `LPROMPT_PORT` | `8484` | Cổng HTTP |
| `LPROMPT_REQUEST_TIMEOUT_MS` | `30000` trong file mẫu | Timeout request phía server |
| `LPROMPT_SHUTDOWN_TIMEOUT_MS` | `12000` | Deadline graceful shutdown; bị giới hạn 1–60 giây |
| `LPROMPT_DB_FILE` | `data/lprompt.db` | Có thể đổi đường dẫn database |
| `LPROMPT_PYTHON` | `py` trên Windows, `python3` trên hệ khác | Runtime cho DSPy |
| `VITE_LPROMPT_API_BASE` | `http://127.0.0.1:8484` trong file mẫu | Base URL được đóng vào frontend bởi Vite |

`VITE_GEMINI_API_KEY` vẫn xuất hiện trong `.env.example` nhưng code giao diện hiện không đọc biến này. Hãy cấu hình key bằng modal `API Key`; không nên đóng secret vào frontend bundle.

Bind ngoài loopback bị từ chối nếu thiếu cả ba cấu hình:

- `LPROMPT_AUTH_TOKEN` dài tối thiểu 24 ký tự;
- `LPROMPT_ALLOWED_HOSTS`;
- `LPROMPT_ALLOWED_ORIGINS`.

Client remote phải gửi `Authorization: Bearer <token>`. Cấu hình này không thay thế TLS, reverse proxy hoặc firewall.

Giao diện browser hiện không có ô cấu hình Bearer token cho remote mode. Vì vậy remote bind phù hợp cho API/MCP client tự gửi header hoặc hệ thống có reverse proxy xử lý xác thực; đồng bộ REST từ giao diện browser sẽ nhận `401` nếu không có lớp trung gian phù hợp.

## 5. Gemini API tùy chọn

Mở nút `API Key`, nhập key, chọn model và bấm kiểm tra kết nối. Khi lưu, cấu hình nằm trong `localStorage` của trình duyệt.

Các model trong code hiện tại:

| Model | Vai trò | Giá Standard tham chiếu/1M token |
|---|---|---:|
| `gemini-3.8-flash` | Mặc định | input $0.75, output $3.75 |
| `gemini-3.5-flash-lite` | Tác vụ nhẹ/lưu lượng lớn | input $0.30, output $2.50 |
| `gemini-3.1-pro-preview` | Suy luận sâu, trạng thái preview | input $2.00, output $12.00 |

Giá và quota có thể thay đổi; kiểm tra [danh sách model](https://ai.google.dev/gemini-api/docs/models) và [bảng giá chính thức](https://ai.google.dev/gemini-api/docs/pricing) trước khi sử dụng. Chi phí hiển thị trong Playground chỉ là ước tính từ usage metadata; nếu metadata thiếu, ứng dụng ước lượng token từ độ dài ký tự.

API key không được đưa vào code export hoặc SQLite. Tuy nhiên `localStorage` không phải secret vault. Với DSPy, key được gửi tới service local và truyền cho tiến trình Python qua stdin.

## 6. Evaluator và Compiler

### Evaluator

Evaluator cục bộ chấm tối đa 100 điểm theo năm nhóm:

1. Role & Context: 20.
2. Task & Instruction: 25.
3. Constraints & Rules: 20.
4. Output Format: 20.
5. Examples & Specs: 15.

Chọn một trong năm domain: research, image, video, code hoặc audio. Nút `Chấm Điểm Cục Bộ` chạy heuristic không cần API key. Nút `Chấm Gemini` gọi model đã chọn và fallback về đánh giá cục bộ khi xảy ra lỗi, đồng thời hiển thị lỗi trên giao diện.

Điểm số không chứng minh prompt sẽ đạt chất lượng tương ứng trên mọi model hoặc dữ liệu thực tế.

### Framework Compiler

Tab `Biên Dịch Prompt` luôn chạy compiler cục bộ trước. Không có API key, kết quả chính là prompt do framework compiler tạo ra. Có API key, model đang chọn chỉ review tiếp bản đã compile. Điểm cũ/mới đều do evaluator cục bộ tính lại, không tin điểm tự khai báo của model. Kết quả vẫn cần được review, chạy Playground và Batch Test trước khi dùng.

## 7. Template và Playground

Biến có dạng `{{ten_bien}}`. Ứng dụng tự tạo form nhập giá trị và chỉ thay thế biến có giá trị không rỗng; placeholder chưa nhập được giữ nguyên.

Playground:

- Có API key: gọi Gemini, hiển thị output, latency, token và chi phí ước tính.
- Không có API key: trả về output mô phỏng, được đánh dấu `simulation`; không phải phản hồi từ Gemini.
- Đóng modal sẽ hủy request đang chạy. Gemini client cũng có timeout cấu hình.

## 8. Batch Evaluation

Batch Evaluation hỗ trợ bốn assertion:

- `contains`;
- `not_contains`;
- `regex`;
- `min_length`.

Test case được chạy tuần tự. Có API key thì từng case gọi Gemini; không có key thì dùng output mô phỏng. Giao diện báo pass/fail/error, latency trung bình và cho phép xuất JSON. Đóng modal sẽ hủy batch đang chạy; từng lỗi case được ghi thành kết quả `error` trừ khi toàn bộ batch bị hủy.

Đây là runner nội bộ, không phải tích hợp trực tiếp với promptfoo hoặc Langfuse.

## 9. Few-shot và DSPy

Quy trình hiện tại gồm hai bước:

1. `Tự Động Sinh Few-Shot`:
   - dùng Gemini nếu có API key hợp lệ;
   - nếu Gemini lỗi hoặc không có key, dùng bộ sinh heuristic cục bộ.
2. `Biên dịch DSPy`:
   - yêu cầu service local đang chạy, API key và tối thiểu hai ví dụ;
   - gọi Python DSPy 3.4.0 với `BootstrapFewShot`;
   - tiến trình bị dừng nếu quá 90 giây;
   - nếu Python hoặc DSPy chưa cài, giao diện hiển thị lỗi thay vì giả vờ thành công.

Nút `Gắn Few-Shot Vào Prompt` chèn các ví dụ hiện có vào section `[EXAMPLES & SPECS]`. Thao tác này không đảm bảo tự động tăng một số điểm cố định hoặc loại bỏ hoàn toàn ảo giác.

## 10. Version graph

Mở `Lịch Sử` hoặc `Phiên Bản` để:

- commit nội dung hiện tại với message và stage `draft`, `testing` hoặc `production`;
- tạo nhánh mới từ head của nhánh hiện tại;
- chuyển nhánh và nạp nội dung head;
- merge một nhánh vào nhánh hiện tại;
- so sánh diff hoặc nạp lại nội dung một commit.

Mỗi commit có `branchName`, `parentId`, tùy chọn `mergeParentId` và content hash. Nếu hai nhánh đều thay đổi từ tổ tiên chung, ứng dụng tạo conflict markers `<<<<<<<`, `=======`, `>>>>>>>` và chưa tạo merge commit. Người dùng phải sửa conflict rồi commit để hoàn tất merge.

Chức năng `Rollback` trên giao diện chỉ nạp nội dung cũ vào editor; nó không tự tạo revert commit. Không thể xóa commit đang là cha trực tiếp hoặc merge-parent của commit khác.

Khi service online, commit được lưu vào localStorage rồi gửi sang SQLite. Nếu đồng bộ SQLite thất bại, bản local vẫn còn và giao diện hiển thị cảnh báo.

### Visual Diff

Nút `So sánh Diff` hoặc biểu tượng compare trong lịch sử mở chế độ so sánh theo token. Giao diện có Inline View và Split View, đồng thời cho phép áp dụng phần nội dung bên phải vào editor. Đây là diff hiển thị, không phải thuật toán merge ba chiều; merge branch dùng logic riêng trong version graph.

## 11. Security scanner

Scanner static kiểm tra sự hiện diện của guardrail liên quan đến 10 nhóm OWASP for LLM Applications:

`LLM01` Prompt Injection, `LLM02` Sensitive Information Disclosure, `LLM03` Supply Chain, `LLM04` Data and Model Poisoning, `LLM05` Improper Output Handling, `LLM06` Excessive Agency, `LLM07` System Prompt Leakage, `LLM08` Vector and Embedding Weaknesses, `LLM09` Misinformation và `LLM10` Unbounded Consumption.

- Không có API key: chỉ chạy 10 rule static.
- Có API key: chạy thêm 6 payload động theo từng nhóm tối đa hai request song song.
- Đóng modal sẽ abort các request còn lại.
- Auto-patch chèn guardrail tổng quát; không tự chứng minh prompt đã an toàn.

Payload động hiện phát hiện bằng canary và các chỉ dấu output xác định. Nó không thay thế pentest, policy engine hoặc đánh giá thủ công.

## 12. Presets, thư viện và code export

- Presets Hub có năm category: business, engineering, copywriting, multimodal và research.
- Thư viện prompt lưu ở localStorage và đồng bộ SQLite khi service online.
- Code export hỗ trợ Python `google-genai`, TypeScript `@google/genai`, cURL và JSON.
- Export luôn dùng `YOUR_GEMINI_API_KEY` hoặc biến môi trường, không chép key đang cấu hình.

## 13. SQLite và backup

Database mặc định: `data/lprompt.db`. SQLite bật WAL, foreign keys và busy timeout 5 giây. Schema hiện có các bảng:

- `prompts`;
- `prompt_versions`;
- `test_suites`;
- `security_audits`;
- `settings`.

Snapshot `data/backups/lprompt_snapshot_YYYYMMDD.json` được ghi atomic lúc database khởi tạo và sau mutation qua lớp database. File của cùng một ngày được ghi đè bằng trạng thái mới nhất, không phải tạo một file mới cho mỗi thay đổi. `POST /api/backup` tạo một file full backup có timestamp.

API key và các cấu hình chỉ nằm trong browser localStorage không được đưa vào backup SQLite.

## 14. REST và MCP

REST endpoints:

- `GET /health`;
- `GET|POST /api/prompts`;
- `DELETE /api/prompts/:id`;
- `GET|POST /api/versions`;
- `DELETE /api/versions/:id`;
- `GET /api/presets`;
- `POST /api/backup`;
- `POST /api/dspy/optimize`.

JSON body bị giới hạn 2 MB và được validate bằng Zod.

MCP dùng stateless Streamable HTTP tại `http://127.0.0.1:8484/mcp`, với bốn tool:

- `lprompt_evaluate`: heuristic cục bộ đơn giản;
- `lprompt_list_presets`;
- `lprompt_get_versions`;
- `lprompt_commit_version`.

Ví dụ cấu hình cho MCP client hỗ trợ remote Streamable HTTP:

```json
{
  "mcpServers": {
    "lprompt": {
      "url": "http://127.0.0.1:8484/mcp"
    }
  }
}
```

Cú pháp cấu hình chính xác phụ thuộc MCP client và phiên bản của client đó.

## 15. Kiểm thử và giới hạn đã biết

```powershell
npm run lint
npm test
npm run build
npm run build:extension
npm run check
```

Trạng thái kiểm tra gần nhất:

- lint sạch;
- 10 test file, 34/34 test case đạt;
- web app production build và extension production build đạt;
- manifest trỏ đúng tới side panel/service worker/content script sau build;
- PowerShell service scripts/XML qua parser validation; package WinSW, shutdown và DSPy cancellation có test hồi quy; tiến trình Node thật đã được smoke-test health, SIGINT, PID cleanup và SQLite unlock;
- REST, SQLite DTO và MCP integration đạt trên database tạm;
- `npm audit` báo 0 vulnerability;
- `pip check` không báo dependency Python hỏng.

Chưa được xác minh bằng cách load unpacked trên Chrome có tài khoản Gemini đăng nhập, chưa cài/gỡ service thật bằng UAC trong test tự động và chưa chạy tự động với API key Gemini thật. Các test Gemini dùng mock response; DSPy đã được kiểm tra dependency, import, API signature, missing-runtime, process timeout và cancellation khi shutdown nhưng chưa chạy compile qua Gemini thật. Vite còn cảnh báo bundle JavaScript web app khoảng 531 kB sau minify.

## 16. Dữ liệu runtime và Git

Các file database, WAL, PID, backup runtime, `dist`, `extension-dist`, `service/windows/runtime`, `node_modules` và `.env` được ignore khỏi Git.

## 17. Nhận diện thương hiệu & Logo

- **Biểu tượng chữ L chủ đạo**: Thiết kế vector SVG với chữ **L** cách điệu bằng dải màu gradient hồng tím (`#c084fc` -> `#a855f7` -> `#d946ef` -> `#ec4899`), đồng bộ với phong cách giao diện tối của phần mềm.
- **Dấu ấn AI & Prompt**: Kết hợp ký hiệu prompt chevron `>` và ngôi sao lấp lánh `✦` (Gemini Sparkle) phát sáng neon trong lòng chữ L.
- **Tích hợp đồng bộ**:
  - **Browser Favicon**: Đặt tại `public/favicon.svg` và liên kết trong `index.html`.
  - **Browser Title**: Hiển thị tiêu đề `LPrompts Studio - AI Prompt Engineering & PromptOps IDE`.
  - **Thanh điều hướng (Header)**: Thành phần `src/components/Logo.tsx` hiển thị sắc nét với hiệu ứng phát sáng nhẹ (ambient neon glow) bên cạnh tên thương hiệu `LPrompts Studio`.
