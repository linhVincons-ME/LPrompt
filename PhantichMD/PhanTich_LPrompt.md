# Phân tích chi tiết dự án LPrompt

Ngày phân tích: 10/10/2026. Phạm vi: toàn bộ mã nguồn trong `D:\DevV2\LPrompt`. Tôi kiểm tra trên một bản sao, không sửa gì trong thư mục gốc.

## Tóm tắt

LPrompt (LPrompts Studio 3.0) là bộ công cụ local-first để soạn, biên dịch, đánh giá và quản lý phiên bản prompt. Bạn dùng nó chủ yếu qua extension Chrome/Firefox chạy cạnh Gemini Web. Dự án không gọi API AI nào. Mọi phần "biên dịch" và "đánh giá" đều là template và regex chạy trên máy. Người dùng luôn tự bấm gửi trên Gemini.

Chất lượng code tốt. Phần bảo mật được làm kỹ, và 59/59 test đều qua. Tuy vậy, có 11 vấn đề đáng xử lý, trong đó 4 lỗi ảnh hưởng trực tiếp tới người dùng và tôi đã chạy thử để xác nhận:

1. Regex `\b` không nhận được từ tiếng Việt kết thúc bằng chữ có dấu.
2. Phần nhận diện "Gemini quá tải" quét cả nội dung câu trả lời, nên dễ báo nhầm.
3. Bridge từ web app có thể ghi đè bản nháp bạn đang sửa.
4. Điểm chất lượng chỉ đếm từ khóa, nên điểm "trước/sau" dễ gây hiểu nhầm.

---

## 1. Tổng quan và kiến trúc

Dự án có khoảng 9.200 dòng code, chia thành 4 khối.

| Khối | Công nghệ | Thư mục | Vai trò |
| --- | --- | --- | --- |
| Extension Chrome/Firefox | React 19, Manifest V3 | `extension/` | Side panel cạnh Gemini để biên dịch, chèn prompt, nhập phản hồi và lưu snapshot. Đây là đường dùng chính. |
| Web app | React 19, Vite 8, Tailwind 4 | `src/` | IDE đầy đủ: đánh giá, version/branch/merge, diff, red-team tĩnh, few-shot, batch test, preset hub và tab Thi Công. |
| Service cục bộ | Node 24, Express 5, `node:sqlite`, MCP SDK | `server/` | Phục vụ web app tại `127.0.0.1:8484`, cung cấp REST, lưu SQLite, MCP endpoint `/mcp` và bridge web → extension. |
| Windows Service | WinSW + PowerShell | `service/windows/`, các file `.bat` ở gốc | Cài server thành dịch vụ Windows, có lệnh start/stop/restart/status. |

### Sơ đồ kết nối

```
 ┌──────────────────────┐   chèn text / đọc phản hồi   ┌──────────────────┐
 │ Extension side panel │ ───────────────────────────▶ │ gemini.google.com│
 │ (ExtensionPanel.tsx) │ ◀─── contentScript.ts ───────│  (người dùng tự  │
 └─────────┬────────────┘      cảnh báo quá tải        │   bấm gửi)       │
           │ poll mỗi 4 giây GET /api/extension/draft   └──────────────────┘
           ▼
 ┌──────────────────────────────┐    REST /api/*     ┌──────────────────┐
 │ Service Node 127.0.0.1:8484  │ ◀───────────────── │ Web app (src/)   │
 │ Express + SQLite + MCP       │                    │ localStorage +   │
 └──────────────┬───────────────┘                    │ outbox xóa       │
                │ POST /mcp                          └──────────────────┘
                ▼
       Công cụ AI khác (MCP client)
```

### Cách các khối nối với nhau

1. Extension nói chuyện với trang Gemini qua `contentScript`. Nó chỉ điền ô soạn, không tự gửi.
2. Extension hỏi service mỗi 4 giây để lấy bản nháp web app gửi sang. Đây là bridge, có TTL 10 phút và chỉ nằm trong RAM.
3. Web app lưu prompt và version vào `localStorage`, rồi đồng bộ lên SQLite khi service online. Thao tác xóa đi qua hàng đợi (outbox), nên bản ghi đã xóa không bị "hồi sinh" khi service offline.
4. Công cụ AI khác có thể gọi 4 tool MCP: `lprompt_evaluate`, `lprompt_list_presets`, `lprompt_get_versions`, `lprompt_commit_version`.

### Trạng thái dữ liệu hiện tại

`data/lprompt.db` và hai snapshot ngày 05/10 và 07/10 đều rỗng (0 prompt, 0 version). Vì vậy, nếu bạn đã có dữ liệu thật, khả năng cao nó đang nằm trong `localStorage` hoặc `chrome.storage` của trình duyệt. Log WinSW cho thấy service đã chạy từ `D:\DevV2\LPrompt` ngày 07/10.

### REST API

| Phương thức | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | `/health` | Trạng thái, PID, RAM, đường dẫn DB |
| GET, POST | `/api/prompts` | Đọc và lưu prompt (upsert) |
| DELETE | `/api/prompts/:id` | Xóa prompt |
| GET, POST | `/api/versions` | Đọc version (lọc theo `?branch=`) và lưu version |
| DELETE | `/api/versions/:id` | Xóa version |
| GET | `/api/presets` | Kho preset (lọc theo `?category=`) |
| POST, GET | `/api/extension/draft` | Bridge web → extension |
| POST | `/api/backup` | Xuất backup JSON đầy đủ |
| POST | `/mcp` | MCP Streamable HTTP (stateless) |

### Cơ sở dữ liệu (SQLite, chế độ WAL)

| Bảng | Dùng bởi | Ghi chú |
| --- | --- | --- |
| `prompts` | REST | id, title, domain, original/improved prompt, score, tier, tags (JSON), created_at |
| `prompt_versions` | REST, MCP | Có branch_name, parent_id, merge_parent_id, content_hash (SHA-256), prompt_id |
| `test_suites` | Không có API ghi | Chỉ có trong backup |
| `security_audits` | Không có API ghi | Chỉ có trong backup |
| `settings` | Không có API ghi | Có hàm `getSetting`/`setSetting` nhưng không ai gọi |

---

## 2. Luồng sử dụng chính

Luồng chuẩn: nhập yêu cầu → biên dịch cục bộ → chèn vào Gemini → bạn tự gửi → nhập phản hồi → lưu snapshot.

1. **Tab Tiêu chuẩn.** `frameworkCompiler.ts` bọc yêu cầu của bạn trong thẻ `<yeu_cau_nguoi_dung>` (hoặc `<user_request>`). Sau đó nó thêm `[VAI TRÒ]`, `[NGUYÊN TẮC THỰC HIỆN]`, `[YÊU CẦU ĐẦU RA]` và các tùy chọn đầu ra. Chỉ có một compiler là "STANDARD". Lựa chọn VIE/ENG chỉ đổi phần khung, còn nội dung bạn nhập được giữ nguyên.
2. **Tab Thi Công.** `constructionPromptCompiler.ts` (342 dòng) sinh prompt ảnh (6 mục) hoặc video (7 mục) cho cảnh hiện trường. Các thông số gồm cấu hình nhân sự KTHT/TDTD/CND, PPE, tỷ lệ khung, thời lượng và ảnh tham chiếu. Compiler tách "yêu cầu bổ sung" thành từng câu. Nó loại câu trùng và chặn biên dịch khi có mâu thuẫn về tỷ lệ, số người, phụ đề hoặc âm thanh trong prompt ảnh.
3. **Chèn vào Gemini.** `contentScript.ts` tìm ô soạn bằng selector DOM, điền text và gắn tối đa 4 ảnh vào `input[type=file]` của Gemini. Nó không bao giờ tự bấm gửi.
4. **Nhập phản hồi.** Extension lấy đoạn bạn đang bôi chọn. Nếu không có, nó lấy phản hồi cuối cùng đang hiển thị trên trang.
5. **Bảo vệ khi quá tải.** Một `MutationObserver` theo dõi toàn trang. Khi thấy cụm từ như "try again later", "quá tải" hoặc "429", extension khóa nút chèn với cooldown 15 → 30 → 60 → 120 giây.
6. **Lưu trữ.** Extension giữ draft, phản hồi và tối đa 10 snapshot trong `chrome.storage.local`. Web app dùng `localStorage` kết hợp SQLite.

---

## 3. Phân tích từng phần

### 3.1. Frontend (`src/`, khoảng 6.000 dòng)

| File | Số dòng | Nhận xét |
| --- | --- | --- |
| `App.tsx` | 900 | Giữ toàn bộ trạng thái bằng khoảng 30 `useState` và mở 11 modal. Chạy được nhưng khó bảo trì. Nên tách thành hook theo nhóm (library, versions, modals). |
| `services/evaluator.ts` | 569 | Chấm 5 tiêu chí: vai trò 20, nhiệm vụ 25, ràng buộc 20, định dạng 20, ví dụ 15. Cách chấm dựa vào danh sách từ khóa, nên nó đo "prompt có từ khóa cấu trúc hay không", không đo chất lượng thật. |
| `services/constructionPromptCompiler.ts` | 342 | Phần có giá trị nghiệp vụ nhất. Có kiểm tra mâu thuẫn và quy tắc PPE. Dính lỗi `\b` (xem mục 6). |
| `services/securityScanner.ts` | 32 | Kiểm 10 nhóm OWASP LLM Top 10 bằng regex và có hàm vá guardrail tự động. Đây là kiểm tra "đã viết câu guardrail chưa", không phải red-team thật. |
| `services/batchEvaluator.ts` | 190 | Chạy test case (contains, not_contains, regex, min_length) trên bản xem trước cục bộ, không phải trên output AI thật. |
| `services/fewShotSynthesizer.ts` | 123 | Sinh ví dụ few-shot bằng template. |
| `services/execution.ts` | 47 | Playground chỉ trả về bản xem trước giả lập sau 600 ms và ghi rõ "không phải phản hồi AI". |
| `services/apiClient.ts`, `deletionOutbox.ts` | 237 | Thiết kế offline-first tốt. Xóa được ghi vào hàng đợi trước, retry mỗi 30 giây, timeout fetch 3 giây. |
| `utils/versionGraph.ts` | 47 | Mô phỏng Git cho prompt: branch, tìm tổ tiên chung, merge 3 chiều ở mức cả văn bản. Khi hai bên cùng sửa, nó sinh marker `<<<<<<<`. |
| `utils/diff.ts` | 66 | So sánh theo từ bằng LCS, có cảnh báo lint nhỏ ở dòng 23. |

### 3.2. Extension (`extension/`, khoảng 1.300 dòng)

- **Quyền tối thiểu.** Extension chỉ có quyền trên `gemini.google.com` và `127.0.0.1:8484`. Nó không dùng `<all_urls>` và không đọc cookie. Context menu chỉ lấy `selectionText`.
- **`ExtensionPanel.tsx` (1.030 dòng)** chứa cả tab Tiêu chuẩn lẫn Thi Công, polling bridge, cooldown và snapshot trong một component.
- **Logic nhận diện quá tải bị chép hai nơi** (`contentScript.ts` và `availability.ts`). Cửa sổ chống trùng của hai nơi khác nhau: 30 giây và 10 giây.
- **Hai trình duyệt.** Firefox dùng `sidebar_action`, Chrome dùng `side_panel`. Mỗi trình duyệt có manifest riêng và config Vite riêng.
- **Phụ thuộc DOM của Gemini.** Các selector như `rich-textarea .ql-editor`, `model-response` và `input[type=file]` sẽ hỏng khi Google đổi giao diện. README đã ghi nhận điều này và khuyên test thủ công.

### 3.3. Server (`server/`, khoảng 780 dòng)

- **Bảo mật tốt cho một app cục bộ:**
  - Mặc định bind `127.0.0.1`.
  - Kiểm tra Origin: chỉ localhost được gọi API, và extension chỉ được đọc bridge.
  - Bind ra ngoài bắt buộc có token ít nhất 24 ký tự cùng allowlist host/origin.
  - Mọi input được validate bằng Zod, kèm header `nosniff` và `no-referrer`.
  - Giới hạn body 2 MB, timeout request 35 giây.
- **Shutdown cẩn thận.** Ở trạng thái `stopping`, server trả 503. Nó đóng kết nối có giới hạn thời gian, có hard deadline và dọn file PID.
- **`db.js`.** Dùng SQLite WAL, migration thêm cột an toàn, và ghi JSON backup kiểu atomic (ghi file tạm rồi rename).
- **`mcpServer.js`.** Mỗi request tạo một MCP server mới (stateless). Cách này đơn giản và đúng. Tuy vậy, tool `lprompt_evaluate` dùng một heuristic riêng, khác với `evaluator.ts` của web app, nên cùng một prompt sẽ ra hai điểm khác nhau.
- **`presetsData.js`** (272 dòng) trùng nội dung với `src/data/fabricPresets.ts`, nên phải sửa hai nơi.

### 3.4. Windows Service

- Script PowerShell kiểm tra quyền admin và Node ≥ 24, tự chạy `npm ci` + build, sinh XML cho WinSW. Mặc định service khởi động thủ công. Có test riêng (`windows-service.test.js`).
- Còn sót tham số `-PythonExe` và biến `LPROMPT_PYTHON` từ thời dự án còn dùng DSPy. Server không còn dùng chúng.
- `Run_LPrompt.bat` chạy dev server ở cổng 5173, còn service chạy ở 8484. Hai cổng này phục vụ hai mục đích khác nhau, nhưng tài liệu nên ghi rõ để khỏi nhầm.

---

## 4. Kết quả kiểm tra thực tế

Tôi chạy trên bản sao bằng Node 22 thay vì 24 (`node:sqlite` vẫn chạy, chỉ báo cảnh báo experimental).

| Bước | Kết quả |
| --- | --- |
| `npm ci` | Cài đủ, không lỗi |
| `vitest run` | 15 file, 59/59 test qua, mất 1,3 giây |
| `tsc -b` | Không lỗi type |
| `oxlint` | Code dự án chỉ có 1 cảnh báo nhỏ (`new Array(n)` ở `src/utils/diff.ts:23`). Nhưng `npm run lint` quét cả `node_modules` vì thiếu file cấu hình ignore, nên in ra hàng nghìn cảnh báo rác. |

### Các phép thử xác nhận lỗi

```
Regex MCP evaluator (server/mcpServer.js):
  "Bạn là kỹ sư"    → vai trò: false
  "vai trò: kỹ sư"  → vai trò: false
  "nhiệm vụ: viết"  → nhiệm vụ: false
  "ví dụ: abc"      → ví dụ: false
  "mục tiêu là"     → nhiệm vụ: true   (chỉ đúng vì "mục tiêu" kết thúc bằng chữ ASCII "u")

Kiểm tra mâu thuẫn prompt Ảnh (constructionPromptCompiler.ts):
  "Có âm thanh hiện trường" → không báo lỗi   (SAI)
  "Thêm nhạc nền nhẹ"       → image-media-conflict (đúng)

Điểm chất lượng (evaluator.ts):
  Prompt "viết"                         → 15 điểm
  Cùng prompt sau khi biên dịch         → 81 điểm ("Khá")
  Câu nhồi từ khóa không có nội dung    → 82 điểm
```

---

## 5. Điểm mạnh

- **Quyền riêng tư và an toàn rõ ràng.** Không có API key, không tự gửi, quyền extension hẹp, server chỉ chạy loopback.
- **Xử lý lỗi chu đáo.** Mọi fetch đều có timeout, thao tác xóa có outbox, shutdown có giới hạn thời gian, backup ghi kiểu atomic.
- **Compiler Thi Công có giá trị thực.** Nó mã hóa các quy tắc nghiệp vụ dễ quên khi viết tay: PPE, không bịa kết quả nghiệm thu, kiểm tra mâu thuẫn. Phần này có 172 dòng test riêng.
- **Tài liệu tiếng Việt đầy đủ.** README và `HUONG_DAN_SU_DUNG.md` mô tả đúng hành vi của code.
- **Thành thật với người dùng.** Playground và compiler đều ghi rõ đây là kết quả cục bộ, không phải AI.
- **Có test cho phần quan trọng.** Compiler, bridge, cooldown, outbox, REST/SQLite/MCP và Windows Service đều có test.

---

## 6. Vấn đề phát hiện

| # | Mức | Vấn đề | Vị trí | Hậu quả / bằng chứng |
| --- | --- | --- | --- | --- |
| 1 | Cao | `\b` của JavaScript chỉ hiểu chữ ASCII, nên regex `\b...\b` không khớp với từ tiếng Việt kết thúc bằng chữ có dấu | `server/mcpServer.js:10-14` | Tool MCP `lprompt_evaluate` không nhận ra "Bạn là", "vai trò", "nhiệm vụ", "ví dụ", nên chấm prompt tiếng Việt thấp sai. |
| 2 | Cao | Cùng lỗi `\b` trong kiểm tra mâu thuẫn giữa ảnh và âm thanh | `src/services/constructionPromptCompiler.ts:114` | "âm thanh" bắt đầu bằng chữ có dấu nên không bao giờ khớp. Prompt Ảnh có "âm thanh" vẫn được biên dịch. |
| 3 | Cao | Nhận diện "Gemini quá tải" quét cả nội dung câu trả lời | `extension/contentScript.ts:12, 106-117` | Ngành điện hay gặp chữ "quá tải" (cáp quá tải, MBA quá tải) hoặc "thử lại sau". Nếu câu trả lời chứa các từ này, extension khóa nút chèn và từ chối nhập phản hồi, kể cả khi bạn đã bôi chọn đoạn đó. |
| 4 | Trung bình | Mở lại side panel trong 10 phút sau khi chuyển draft từ web app sẽ ghi đè bản bạn đã sửa | `extension/ExtensionPanel.tsx:166, 313` | `lastBridgeDraftId` chỉ nằm trong state, không được lưu vào storage. Panel mới coi draft cũ là draft mới. Server cũng không xóa draft sau khi đã đọc. |
| 5 | Trung bình | `MutationObserver` chạy trên mọi thay đổi DOM (cả `characterData`, `subtree`), mỗi lần đều gọi `querySelectorAll` và đọc `innerText` | `extension/contentScript.ts:140` | Khi Gemini stream câu trả lời dài, trang có thể giật vì `innerText` ép trình duyệt tính lại layout. |
| 6 | Trung bình | Điểm chất lượng đo từ khóa chứ không đo nội dung | `src/services/evaluator.ts`, `optimizer.ts` | Điểm sau biên dịch luôn cao vì chính khung template chứa từ khóa. Con số "điểm trước/sau" vì vậy dễ gây hiểu nhầm. |
| 7 | Trung bình | Firefox: sidebar được mở từ context menu sau một chuỗi `await` | `extension/serviceWorker.ts:64` | Firefox chỉ cho `sidebarAction.open()` chạy đồng bộ trong handler thao tác người dùng, nên lệnh có thể báo lỗi và sidebar không mở. Đây là suy luận từ quy tắc của Firefox, tôi chưa chạy thử. |
| 8 | Thấp | Backup JSON ghi lại toàn bộ DB sau mỗi lần lưu hoặc xóa, và file backup không bao giờ được dọn | `server/db.js:202` | Ghi chậm dần khi dữ liệu lớn, thư mục `data/backups` phình mãi. Mỗi lần gọi `/api/backup` lại tạo thêm một file. |
| 9 | Thấp | Polling bridge khởi tạo lại theo từng phím gõ | `extension/ExtensionPanel.tsx:341` | Effect phụ thuộc `domain`, `additionalInstruction` và `outputLanguage`, nên mỗi lần gõ phát sinh một request mới tới `:8484`. |
| 10 | Thấp | Dữ liệu mồ côi và code thừa | `server/db.js:111`, `Install-LPromptService.ps1:7` | Xóa prompt không xóa các version gắn `prompt_id`. Có 3 bảng DB không dùng và tham số Python còn sót. |
| 11 | Thấp | Tooling và tài liệu lệch nhau | `package.json`, `HUONG_DAN_SU_DUNG.md:7` | `npm run lint` quét `node_modules`. README ghi Firefox 142+, còn hướng dẫn ghi 115+. Regex quá tải và kho preset bị chép hai nơi. Thư mục được chia sẻ không có `.git`/`.gitignore`, nên không thấy được lịch sử thay đổi. |

---

## 7. Đề xuất ưu tiên

Nên sửa nhóm 1 trước, vì đây là các lỗi người dùng gặp hằng ngày và sửa nhanh.

1. **Sửa nhanh (vài giờ).**
    - Thay `\b` bằng ranh giới Unicode ở `mcpServer.js` và `constructionPromptCompiler.ts`, rồi thêm test cho "Bạn là" và "âm thanh". Ví dụ:
      ```js
      /(?<![\p{L}\p{N}])(you are|act as|bạn là|vai trò)(?![\p{L}\p{N}])/iu
      ```
    - Chỉ quét thông báo quá tải trong `[role=alert]` hoặc toast, bỏ quét nội dung câu trả lời. Bỏ cụm "quá tải" đứng riêng, hoặc yêu cầu một cụm dài hơn như "Gemini đang quá tải".
    - Lưu `lastBridgeDraftId` vào `chrome.storage.local`, hoặc cho server xóa draft sau khi extension đã đọc.
    - Thêm `.oxlintrc.json` để bỏ qua `node_modules` và `dist*`.
2. **Ổn định extension.**
    - Debounce `MutationObserver` khoảng 500 ms.
    - Tách polling bridge ra một effect không phụ thuộc vào input, và dùng ref để đọc giá trị hiện tại.
    - Cho content script dùng chung `availability.ts` (Vite bundle được).
    - Với Firefox, gọi `sidebarAction.open()` ngay đầu handler context menu, rồi mới ghi storage.
3. **Dữ liệu.**
    - Chỉ ghi backup JSON vài phút một lần hoặc khi tắt service, và chỉ giữ N bản gần nhất.
    - Xóa các version theo `prompt_id` khi xóa prompt, hoặc hỏi người dùng trước.
    - Bỏ các bảng và tham số không dùng.
    - Dùng một nguồn preset duy nhất cho cả server và web app.
4. **Cấu trúc code.**
    - Tách `App.tsx` và `ExtensionPanel.tsx` thành hook và component theo tính năng.
    - Đưa tab Thi Công thành component dùng chung giữa web app và extension.
5. **Thang điểm.**
    - Đổi tên thành "Độ đầy đủ cấu trúc", hoặc chỉ chấm phần nội dung người dùng nhập (bên trong thẻ `<yeu_cau_nguoi_dung>`), để điểm không tăng chỉ vì khung template.
    - Dùng chung một hàm chấm cho web app và MCP.
6. **Quản lý mã nguồn.** Nếu chưa có, hãy đưa dự án vào Git và đẩy lên GitHub ở chế độ riêng tư. Như vậy bạn có lịch sử thay đổi và tôi có thể mở PR sửa lỗi.

---

## Phụ lục: cấu trúc thư mục

```
LPrompt/
├── extension/                 Mã nguồn extension (panel, content script, service worker, manifest)
├── extension-dist/            Bản build cho Chrome
├── extension-dist-firefox/    Bản build cho Firefox
├── src/                       Web app React
│   ├── components/            18 component UI (modal, view, toolbar)
│   ├── services/              Compiler, evaluator, scanner, API client, outbox
│   ├── utils/                 diff, template, versionGraph, storage, hash
│   ├── data/                  Preset và prompt mẫu
│   └── types/                 Kiểu dữ liệu chung
├── server/                    Express + SQLite + MCP
├── service/windows/           Script PowerShell, WinSW runtime và log
├── tests/                     15 file test (vitest)
├── data/                      lprompt.db và backups/
├── dist/                      Bản build web app
└── *.bat, *.ps1, *.vbs        Lệnh tắt chạy, cài và dừng service
```
