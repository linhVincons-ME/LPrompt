# Rà soát đợt sửa lỗi LPrompt ngày 10/10/2026

Phạm vi: các file trong `D:\DevV2\LPrompt` được sửa sau bản phân tích `PhanTich_LPrompt.md` (sửa trong khoảng 09:52–10:09 giờ Việt Nam ngày 10/10). Tôi đối chiếu với 11 vấn đề và mục "Đề xuất ưu tiên" của bản phân tích đó. Tôi kiểm tra trên một bản sao và không sửa gì trong thư mục gốc.

## Kết luận nhanh

Đợt sửa đã làm đúng và đủ nhóm "Sửa nhanh" trong bản phân tích. Toàn bộ test, typecheck, lint và build đều qua. Tuy vậy, còn 3 điểm nên sửa tiếp trước khi coi là xong:

1. **Bridge vẫn có thể ghi đè bản nháp (race condition).** Lần poll đầu tiên có thể chạy trước khi `lastBridgeDraftId` được đọc từ storage.
2. **Prompt Ảnh bị chặn khi người dùng viết "không có âm thanh".** Regex mới bắt được "âm thanh" nhưng không hiểu câu phủ định.
3. **Bôi chọn một đoạn ngắn có chữ "hệ thống … quá tải" vẫn bị coi là Gemini quá tải.** Phần quét trang đã an toàn, nhưng nhánh xử lý đoạn bôi chọn thì chưa.

Ngoài ra, tôi phát hiện thêm một lỗi `\b` cùng loại ở `promptInspector.ts` mà đợt sửa chưa đụng tới. Toàn bộ thay đổi từ 06/10 đến nay cũng chưa được commit vào Git.

---

## 1. Những gì đã được sửa

| File | Thay đổi |
| --- | --- |
| `server/mcpServer.js` | Thay `\b…\b` bằng ranh giới Unicode `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` với cờ `u` cho cả 5 nhóm tín hiệu. |
| `src/services/constructionPromptCompiler.ts:114` | Áp dụng cùng cách cho kiểm tra xung đột ảnh và âm thanh. |
| `extension/contentScript.ts` | Chỉ quét các vùng cảnh báo (`role="alert"`, `aria-live="assertive"`, snackbar, toast, `.error-message`…), bỏ quét nội dung câu trả lời. Bỏ qua phần tử dài từ 800 ký tự trở lên. Với đoạn bôi chọn, chỉ kiểm tra quá tải khi đoạn ngắn hơn 250 ký tự. Regex chặt hơn: "quá tải" phải đi kèm "hệ thống", "máy chủ" hoặc "gemini", và "thử lại sau" phải là "vui lòng thử lại sau". |
| `extension/availability.ts` | Cập nhật regex giống `contentScript.ts`. |
| `extension/ExtensionPanel.tsx` | Lưu `lastBridgeDraftId` vào `chrome.storage.local` và đọc lại khi mở panel. Effect polling bridge không còn phụ thuộc vào input, các giá trị hiện tại được đọc qua `useRef`. |
| `.oxlintrc.json` (mới) | Bỏ qua `node_modules`, `dist*`, `data`, `service`. |
| `.gitignore`, `.github/workflows/ci.yml` | Có `.gitignore` đầy đủ, và CI chạy `npm run check` cùng `lint:firefox`. |
| Test | Thêm test "âm thanh/thời lượng" cho prompt Ảnh, test câu quá tải tiếng Việt và câu "dây cáp quá tải" (không được báo), và test MCP chấm prompt tiếng Việt đạt 100 điểm. |
| `README.md`, `HUONG_DAN_SU_DUNG.md` | Mô tả phạm vi quét quá tải mới và việc ghi nhớ ID draft của bridge. |

Bản build `dist/`, `extension-dist/` và `extension-dist-firefox/` đã được build lại sau khi sửa (10:09). Bundle web của tôi có cùng hash `index-BU_4TTaz.js` với bản trên máy bạn, nghĩa là bản build khớp với mã nguồn.

## 2. Kết quả kiểm tra

Tôi chạy bằng Node 22, máy bạn dùng Node 24. `node:sqlite` vẫn chạy, chỉ hiện cảnh báo experimental.

| Bước | Kết quả |
| --- | --- |
| `vitest run` | 15 file, **60/60 test qua** (trước đó là 59) |
| `tsc -b` và `tsc -p tsconfig.extension.json` | Không lỗi |
| `oxlint` | **0 cảnh báo**, không còn quét `node_modules` |
| `npm run build`, `npm run build:extension` | Thành công cho web, Chrome và Firefox |

### Phép thử thực tế với regex mới

```
MCP lprompt_evaluate (trước: 25 điểm, không nhận ra từ nào)
  "Bạn là kỹ sư"   → 40   (đúng, nhận ra 1 tín hiệu)
  "vai trò: kỹ sư" → 40   (đúng)
  "nhiệm vụ: viết" → 40   (đúng)
  "ví dụ: abc"     → 40   (đúng)

Kiểm tra mâu thuẫn prompt Ảnh
  "Có âm thanh hiện trường"           → image-media-conflict  (đúng, trước đây bỏ sót)
  "Thời lượng 8 giây"                 → image-media-conflict  (đúng)
  "Không có âm thanh, không nhạc nền" → image-media-conflict  (SAI, chặn nhầm)
  "Ảnh tĩnh, không cần thời lượng"    → image-media-conflict  (SAI, chặn nhầm)
  "Đèn chiếu sáng 10 giây một lần"    → image-media-conflict  (nhầm nhẹ)

Nhận diện quá tải (classifyTransientFailure)
  "Dây cáp bị quá tải phát nhiệt."                   → không báo  (đúng)
  "Gemini hiện đang quá tải. Vui lòng thử lại sau."  → overloaded (đúng)
  "Hệ thống điện tầng 3 đang quá tải, cần cắt tải."  → overloaded (SAI nếu là nội dung trả lời)
  "Máy chủ SCADA bị quá tải do polling dày."         → overloaded (SAI nếu là nội dung trả lời)
  "Vui lòng thử lại sau khi đo điện trở cách điện."  → temporarily_unavailable (SAI nếu là nội dung trả lời)
```

## 3. Đối chiếu với 11 vấn đề trong bản phân tích

| # | Vấn đề | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| 1 | `\b` trong `mcpServer.js` | ✅ Đã sửa | Đã có test. |
| 2 | `\b` trong kiểm tra ảnh và âm thanh | ✅ Đã sửa, ⚠️ phát sinh lỗi mới | Câu phủ định bị chặn nhầm (mục 4.2). |
| 3 | Quá tải quét nội dung câu trả lời | ✅ Đã sửa phần quét trang, ⚠️ còn nhánh bôi chọn | Xem mục 4.3 và rủi ro ở mục 4.4. |
| 4 | Bridge ghi đè bản nháp | 🟡 Sửa gần đủ | Còn race khi mở panel (mục 4.1). Server vẫn không xóa draft sau khi đọc. |
| 5 | `MutationObserver` chạy trên mọi thay đổi DOM | 🟡 Nhẹ hơn nhưng chưa sửa | Giờ chỉ đọc `innerText` của vùng cảnh báo, nên đỡ tốn hơn. Tuy vậy, mỗi thay đổi DOM vẫn chạy 7 lần `querySelectorAll`. Chưa có debounce. |
| 6 | Điểm chỉ đếm từ khóa | ❌ Chưa sửa | `evaluator.ts` không đổi. |
| 7 | Firefox mở sidebar sau `await` | ❌ Chưa sửa | `serviceWorker.ts` không đổi. |
| 8 | Backup JSON ghi mỗi lần lưu và không dọn | ❌ Chưa sửa | `db.js:205` không đổi. |
| 9 | Polling khởi tạo lại theo từng phím gõ | ✅ Đã sửa | Dependency của effect là `[]`. |
| 10 | Version mồ côi, bảng thừa, tham số Python | ❌ Chưa sửa | Vẫn còn `-PythonExe` ở `Install-LPromptService.ps1:7`. Có thêm thư mục rỗng `python/`. |
| 11 | Tooling và tài liệu lệch nhau | 🟡 Một phần | Lint và Git đã ổn. Tài liệu vẫn lệch: README ghi Firefox 142+, còn `HUONG_DAN_SU_DUNG.md:7` ghi "Firefox 115+", trong khi manifest bắt buộc `strict_min_version: 142.0`. Regex quá tải vẫn được chép ở hai nơi, và lần này phải sửa cả hai. Preset vẫn bị chép ở hai nơi. |

---

## 4. Vấn đề cần sửa tiếp

### 4.1. (Trung bình) Race condition khi mở panel: bridge vẫn có thể ghi đè bản nháp

**Vị trí:** `extension/ExtensionPanel.tsx`, effect đọc storage (dòng ~190) và effect poll (dòng ~311).

Hai effect cùng chạy khi panel mở. Effect poll gọi `poll()` ngay lập tức. Nếu `fetch` tới `127.0.0.1:8484` trả về trước khi `chrome.storage.local.get` xong, `lastBridgeDraftIdRef.current` vẫn là `''`. Khi đó draft cũ bị coi là mới và ghi đè bản bạn đang sửa, tức là lỗi số 4 vẫn có thể xảy ra. Thứ tự ngược lại cũng có rủi ro: `get` xong sau khi poll đã nạp draft mới, rồi `setSource(draft.source)` lấy giá trị cũ từ storage đè lên. Thường thì storage cục bộ nhanh hơn, nên lỗi khó gặp, nhưng không có gì đảm bảo thứ tự này.

**Đề xuất:** Cho poll chờ quá trình đọc storage xong.

```tsx
const storageReadyRef = useRef<Promise<void>>(Promise.resolve());

useEffect(() => {
  storageReadyRef.current = chrome.storage.local.get([...]).then((stored) => {
    // ... giữ nguyên phần nạp dữ liệu
  }).catch(() => setStatus('...'));
}, []);

useEffect(() => {
  let active = true;
  const poll = async () => {
    await storageReadyRef.current;   // chờ nạp lastBridgeDraftId và draft
    if (!active) return;
    // ... giữ nguyên
  };
  ...
}, []);
```

Effect đọc storage được khai báo trước, nên khi effect poll chạy thì `storageReadyRef.current` đã là promise thật. Nên thêm cả cách thứ hai: server xóa draft sau khi extension đọc (hoặc có endpoint `POST /api/extension/draft/ack`). Khi đó lỗi biến mất kể cả khi bạn cài lại extension hoặc xóa storage.

### 4.2. (Trung bình) Prompt Ảnh bị chặn nhầm khi viết câu phủ định

**Vị trí:** `src/services/constructionPromptCompiler.ts:114`

"Không có âm thanh, không nhạc nền" hay "không cần thời lượng" đều bị báo lỗi `image-media-conflict`, và lỗi mức `error` chặn biên dịch. Trước đợt sửa, "không nhạc nền" cũng đã bị chặn, nhưng "không có âm thanh" thì chưa. Đây là câu người làm thi công rất hay viết cho ảnh. Kiểm tra phụ đề ngay bên dưới đã có xử lý phủ định, nhưng kiểm tra âm thanh thì chưa.

**Đề xuất:** Xóa cụm phủ định trước khi kiểm tra. Nếu có phủ định thì báo `warning` và loại câu đó, vì prompt ảnh vốn không có âm thanh.

```ts
const MEDIA_TERMS = '(?:âm thanh|nhạc nền|giọng đọc|thu âm|thời lượng|\\d+\\s*giây)';
const NEGATED_MEDIA = new RegExp(`(?:không|cấm|bỏ|tắt|không cần|không có)\\s+(?:có\\s+|cần\\s+|dùng\\s+)?${MEDIA_TERMS}`, 'giu');
const MEDIA = new RegExp(`(?<![\\p{L}\\p{N}])${MEDIA_TERMS}(?![\\p{L}\\p{N}])`, 'iu');

if (options.outputType === 'image') {
  const withoutNegated = lower.replace(NEGATED_MEDIA, ' ');
  if (MEDIA.test(withoutNegated)) {
    issues.push({ severity: 'error', code: 'image-media-conflict', message: '...' });
  } else if (withoutNegated !== lower) {
    issues.push({ severity: 'warning', code: 'duplicate-no-media', message: 'Prompt ảnh vốn không có âm thanh nên đã loại câu này khỏi yêu cầu bổ sung.' });
    continue;
  }
}
```

Nên thêm test cho "Không có âm thanh", "không nhạc nền", "không cần thời lượng" và "Có âm thanh hiện trường".

"Đèn chiếu sáng 10 giây một lần" bị bắt vì `\d+\s*giây`. Lỗi này nhẹ. Có thể chỉ bắt `\d+\s*giây` khi đi kèm "video", "clip" hoặc "dài", hoặc hạ xuống mức `warning`.

### 4.3. (Trung bình) Đoạn bôi chọn ngắn vẫn có thể bị coi là Gemini quá tải

**Vị trí:** `extension/contentScript.ts`, hàm `importResponse` (`selected.length < 250`).

Khi bạn bôi chọn một câu trả lời ngắn như "Hệ thống điện tầng 3 đang quá tải, cần cắt tải" hay "Vui lòng thử lại sau khi đo điện trở cách điện", extension từ chối nhập phản hồi và bật cooldown. Regex mới đã chặt hơn, nhưng các cụm "hệ thống … quá tải", "máy chủ … quá tải" và "vui lòng thử lại sau" vẫn rất phổ biến trong ngành điện và hạ tầng.

**Đề xuất:** Bỏ hẳn bước kiểm tra quá tải với đoạn bôi chọn. Bạn đã chủ động chọn đoạn đó, nên nên tin lựa chọn của bạn. Nếu vẫn muốn giữ, chỉ kiểm tra các cụm tiếng Anh đặc trưng của Gemini như `high demand`, `too many requests`, `429`, hoặc chỉ khi đoạn chọn rất ngắn (dưới khoảng 120 ký tự) và khớp toàn bộ một mẫu thông báo.

### 4.4. (Rủi ro, cần kiểm tra tay) Có thể bỏ sót thông báo quá tải thật của Gemini

Đợt sửa loại trừ hoàn toàn `.model-response-text` khỏi phạm vi quét. Theo những gì tôi biết, Gemini Web đôi khi hiển thị lỗi kiểu "high demand / try again later" ngay trong bong bóng trả lời chứ không phải trong toast hay `role="alert"`. Đây là suy luận, tôi chưa xác nhận được trên DOM thật. Nếu đúng như vậy, extension sẽ không còn phát hiện quá tải trong trường hợp đó, nghĩa là tính năng bảo vệ bị mất.

**Đề xuất:**
- Kiểm tra tay: khi Gemini báo quá tải, mở DevTools và xem thông báo nằm trong phần tử nào.
- Nếu nó nằm trong bong bóng trả lời, thêm một ngoại lệ hẹp: chỉ xét bong bóng **cuối cùng**, chỉ khi nó ngắn (dưới khoảng 300 ký tự) và khớp mẫu tiếng Anh đặc trưng (`high demand|too many requests|429|temporarily unavailable`). Không áp dụng mẫu tiếng Việt chung chung cho bong bóng trả lời.

### 4.5. (Thấp) Cùng lỗi `\b` còn sót ở `promptInspector.ts`

**Vị trí:** `src/services/promptInspector.ts:67`

```ts
/\b(nó|họ|cái này|việc đó|it|this thing|they)\b/i
```

"nó", "họ" và "việc đó" kết thúc bằng chữ có dấu, nên không bao giờ khớp. Kết quả thử: "Hãy sửa nó cho tốt hơn" và "Gửi cho họ bản này" không bị cảnh báo "tham chiếu mơ hồ", trong khi "Fix it please" thì có. Cần sửa theo cùng cách:

```ts
/(?<![\p{L}\p{N}])(?:nó|họ|cái này|việc đó|it|this thing|they)(?![\p{L}\p{N}])/iu
```

Nên thêm một test grep để chặn regex `\b` chứa chữ tiếng Việt có dấu, tránh tái phát.

### 4.6. (Thấp) Regex quá tải vẫn bị chép ở hai nơi

`contentScript.ts` có bản sao riêng của `FAILURE_PATTERNS` và `classifyTransientFailure`, giống hệt `availability.ts`. Lần này cả hai đã được sửa đồng bộ, nhưng lần sau rất dễ quên một nơi. Test hiện chỉ chạy trên `availability.ts`, nên bản trong content script không được kiểm tra. Hãy cho `contentScript.ts` import từ `./availability` (Vite sẽ bundle vào `contentScript.js`). Cửa sổ chống trùng cũng vẫn khác nhau: 30 giây ở content script và 10 giây ở panel.

### 4.7. (Thấp) Tài liệu Firefox vẫn lệch

`HUONG_DAN_SU_DUNG.md:7` ghi "Firefox 115+ (khuyên dùng Firefox 142+)", nhưng manifest đặt `strict_min_version: 142.0`, nên Firefox dưới 142 không cài được. Nên sửa thành "Firefox 142+" cho khớp README.

---

## 5. Quản lý mã nguồn

- Commit cuối cùng là ngày 06/10 ("Improve construction references, crew presets and output options"). File `.git/index` không thay đổi từ đó. Nhiều file sửa ngày 07/10, 08/10 và toàn bộ đợt sửa hôm nay có thời gian sửa muộn hơn. Vì vậy, nhiều khả năng các thay đổi này **chưa được commit**. Tôi suy ra điều này từ thời gian sửa file vì không chạy được `git status` trên máy bạn. Nên commit ngay, tách thành vài commit theo từng lỗi (ví dụ `fix(regex): unicode word boundary`, `fix(extension): scope overload detection to alerts`, `fix(extension): persist bridge draft id`).
- Workflow CI đã có, nhưng chỉ chạy khi đẩy lên GitHub. Nếu repo đã có remote (có `FETCH_HEAD`), hãy push để CI chạy.
- `mcpServer.js` thay đổi, nên cần **restart service** (`Restart_LPrompt_Service.bat`) thì MCP mới dùng regex mới. Web app và extension đã được build lại. Bạn chỉ cần bấm reload extension trong `chrome://extensions` hoặc `about:debugging`.

---

## 6. Thứ tự đề xuất cho đợt tiếp theo

1. **Sửa ngay (khoảng 1 giờ):** mục 4.1 (chờ storage trước khi poll), 4.2 (phủ định âm thanh), 4.3 (bỏ kiểm tra quá tải với đoạn bôi chọn), 4.5 (`promptInspector`). Thêm test cho từng mục.
2. **Kiểm tra tay:** mục 4.4 trên Gemini thật khi bị quá tải.
3. **Dọn dẹp:** mục 4.6 (dùng chung `availability.ts`), 4.7 (tài liệu), xóa `-PythonExe`, `LPROMPT_PYTHON` và thư mục `python/` rỗng.
4. **Các mục cũ chưa làm:** debounce `MutationObserver` 500 ms (#5), mở sidebar Firefox đồng bộ (#7), giới hạn backup (#8), xóa version theo prompt (#10), đổi tên hoặc sửa thang điểm và dùng chung hàm chấm cho web app và MCP (#6).
5. **Commit và push** sau mỗi nhóm.
