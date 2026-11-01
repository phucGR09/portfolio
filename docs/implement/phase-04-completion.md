# P04 — Hoàn thiện: 18 trang, generator, lớp thông tin thứ hai

> **Tương ứng:** UI plan §12.4 (P3) · plan cũ §8 (P3).
> **Mục tiêu:** đủ 18 trang, mở khuôn F/G còn lại, và **thêm lớp thông tin thứ hai**: trang tổng hợp theo Principle. Đây là phase site chuyển từ *bộ sưu tập trang* thành *một cấu trúc kiến thức*.
> **Đặc thù:** đây là phase đầu tiên có **build thật** (`stamp.mjs`), nên định nghĩa G3 đổi — xem mục 3.
> **Ước lượng:** 7–10 ngày · **Tiền đề:** P03 exit gate xanh.

---

## 1. Phạm vi

| Deliverable | Ghi chú |
|---|---|
| +10 trang (tổng 18) | theo backlog plan cũ §7 |
| `tools/stamp.mjs` | **sinh HTML từ `catalog.js` + partial nội dung.** Tripwire §2.3 đã nổ từ trang thứ 6 — làm ở đây là **muộn nhất** |
| `labs/by/<principle>.html` | trang theo nguyên lý (quan hệ nhiều-nhiều) |
| `PrincipleMap` | SVG principle ↔ problem — trái tim của trang tổng hợp |
| Sơ đồ SVG khối ④ cho mỗi trang | 18 sơ đồ viết tay |
| `tools/og.mjs` | ảnh OG mỗi trang: symptom + cặp số before/after |
| `tools/budget.mjs` mở rộng | báo cáo kích thước vs trần cho cả 18 trang |
| `tools/check-links.mjs` | link chết + `related` hai chiều |

**Component mới:** `VersionPicker`, `ContractDiff`, `ClientScreen`, `RequirementList`, `CodeSideBySide`, `PrincipleMap`, `OgCard`.

**10 trang còn lại** (gom theo khuôn để làm theo lô — rẻ hơn làm lần lượt):

| Lô | Trang | Khuôn |
|---|---|---|
| 1 | `nullable-column-deploy-order`, `breaking-change-at-3pm`, `error-shapes-that-lie` | **F** Contract Diff (mở `VersionPicker`, `ContractDiff`, `ClientScreen`) |
| 2 | `build-it-for-the-future`, `magic-number-in-the-wild` | G (tái dùng `ComplexityGauge` từ P03) |
| 3 | `idor-the-other-users-invoice`, `jwt-you-can-edit`, `least-privilege-one-key-to-rule-them-all` | B (tái dùng) |
| 4 | `transaction-or-two-half-truths`, `cache-that-lies` | A / E (tái dùng) |

**Thứ tự bắt buộc:** `stamp.mjs` **trước** 10 trang. Sinh 10 trang bằng tay rồi mới viết generator là tự nhân công việc lên 2 lần.

---

## 2. Các bước thực thi

### Step 4.1 — `tools/stamp.mjs` (làm đầu tiên)

**Action:** generator ~60 dòng Node, **chạy tay**, nhận `catalog.js` + partial nội dung → sinh HTML hoàn chỉnh.

```text
labs/content/<slug>.html     # chi 8 khoi noi dung (partial, nguoi viet)
         +  scripts/data/catalog.js
         --(stamp.mjs)-->  labs/<slug>.html   # HTML day du, COMMIT vao repo
```

**Target & ràng buộc:**
- **Commit cả file HTML sinh ra** → GitHub Pages vẫn tĩnh, deploy vẫn không có build step. Đây là chỗ D2 được bảo toàn: build chạy trên máy dev, không chạy trên Pages.
- `stamp.mjs` là **đường duy nhất** tạo trang từ nay. 8 trang cũ của P02–P03 phải được **tách partial và stamp lại**, rồi diff với file cũ → diff phải là *không có gì* hoặc *chỉ là chuẩn hoá*. Diff bất ngờ = generator sai, sửa generator chứ không sửa file.
- Không template engine ngoài (LUẬT 14): template literal + `replaceAll` trên placeholder là đủ. Nếu thấy cần `{{#each}}` → dữ liệu đang sai hình, không phải thiếu engine.
- `--check` mode: sinh vào bộ nhớ, so với file đã commit, exit 1 nếu khác. Đây là `check:generated` trong G3 mới.

**Ghi thành changelog + dẫn link ngay trên trang `build-it-for-the-future`:** *"Chúng tôi trì hoãn cái generator này đúng tới trang thứ 6. Đây là commit đó."* Kèm link commit thật. **Không blog nào có bằng chứng kiểu này** — và nó biến một món nợ kỹ thuật thành nội dung dạy học: trang đó dạy YAGNI, và đây là một lần YAGNI được áp dụng thật, có ngày tháng, có commit.

---

### Step 4.2 — 10 trang theo 4 lô

**Target mỗi lô:** lô dùng khuôn mới (lô 1 — khuôn F) tốn nhiều nhất; 3 lô tái dùng phải **nhanh dần**: lô 2 ≈ 2h/trang, lô 3–4 ≈ 1.5h/trang. Ghi thời gian thật từng trang vào `decisions.log`.

Nếu thời gian **không** giảm dần qua các lô → kiến trúc chưa trả lãi; dừng ở 12 trang (xem tripwire) thay vì cố đủ 18.

**Lưu ý nội dung cho 3 trang đặc biệt:**

| Trang | Điểm phải cẩn thận |
|---|---|
| `jwt-you-can-edit` | Chỉ mô phỏng sửa payload và **chữ ký nói không**. Không hướng dẫn bất kỳ cách bypass thật nào; `SafetyLine` bắt buộc |
| `least-privilege-one-key...` | Dùng key giả rõ ràng (`sk_fake_…`). Không mô tả kỹ thuật khai thác, chỉ mô tả **phạm vi thiệt hại** |
| `breaking-change-at-3pm` | `ClientScreen` hiện `undefined` và màn trắng thật trong **một frame riêng**, nhãn `simulated client`. **Không nhái UI của bất kỳ sản phẩm thật nào** |

---

### Step 4.3 — `labs/by/<principle>.html` + `PrincipleMap`

**Quyết định UI chốt ở đây (§12.4 UI plan):** trang principle **không được trùng catalog**.

| | Catalog (trên landing) | Trang principle |
|---|---|---|
| Câu hỏi nó trả lời | "Cái gì nguy hiểm nhất?" | "Nguyên lý này nói gì, và sai ở đâu?" |
| Sắp xếp | blast-radius giảm dần | `foundational → advanced` |
| Mở đầu | grid card | **một phát biểu nguyên lý + điều kiện biên** |

Hai trang khác nhau về *câu hỏi*, nên **phải** khác nhau về *hình*. Nếu chúng trông giống nhau thì một trong hai là thừa.

`PrincipleMap`: SVG viết tay, principle ↔ problem nhiều-nhiều. Sinh từ `catalog.js`, không vẽ tay từng đường.

---

### Step 4.4 — 18 sơ đồ SVG cho khối ④ (Under the hood)

**Target:** inline SVG viết tay, theme được bằng `currentColor` + `--accent` (LUẬT 1, §6.4 UI plan). Mỗi sơ đồ **giải thích đúng cái lab vừa cho thấy**, không phải sơ đồ kiến trúc tổng quát — sơ đồ generic là dấu hiệu khối ④ chưa được nghĩ.

Làm theo lô, **sau** khi 18 lab đã chạy: lúc đó mới biết lab cho thấy cái gì.

---

### Step 4.5 — `tools/og.mjs`

**Quyết định:** ảnh OG **sinh ra, không vẽ tay 18 lần**. Template: nền navy, branch color làm vạch trái, symptom 2 dòng, cặp số mono lớn.

- Sinh SVG → PNG. Nếu không muốn thêm dependency để rasterize: sinh SVG rồi convert một lần bằng công cụ có sẵn trên máy, commit PNG. **Không thêm `sharp`/`resvg` vào devDeps nếu chỉ chạy 18 lần** — đó đúng là `build-it-for-the-future`.
- **Phải đọc được ở kích thước thumbnail** (≈ 240px) — đó là cách link thật sự xuất hiện khi được dán vào một chat nhóm hay một PR comment. Kiểm bằng cách thu nhỏ ảnh và đọc thử, không bằng cảm giác ở 100%.

---

### Step 4.6 — `tools/check-links.mjs` + budget mở rộng

- Link chết nội bộ (18 trang × ~8 link).
- `related` **hai chiều**: nếu A related B thì B phải related A — hoặc tool nói rõ đây là quan hệ một chiều có chủ ý.
- `provenance` hợp lệ và không bỏ trống trên cả 18 entry; không chuỗi nào chứa tên công ty / sản phẩm (đã có từ P01, nay chạy trên 18 entry).
- Budget: báo cáo cả 18 trang, cột `% trần`, fail nếu trang nào vượt 60 KB JS.

---

## 3. G3 đổi định nghĩa từ phase này

```bash
npm run build
# = node tools/stamp.mjs            (sinh 18 trang)
#   && node tools/stamp.mjs --check (HTML commit == HTML vua sinh)
#   && npm run verify               (typecheck + lint + test + budget + contract + links)
```

**Ý nghĩa:** từ P04, "build success" là **build thật** — có input (catalog + partial), có output (HTML), có kiểm tra output khớp cái đã commit. Deploy vẫn tĩnh: Pages serve HTML đã commit, không chạy generator.

**CI thêm một bước:** chạy `stamp.mjs --check` trên PR → nếu ai sửa `labs/<slug>.html` bằng tay mà không sửa partial, CI fail. Đây là cơ chế duy nhất giữ "stamp là đường duy nhất tạo trang" khỏi bị xói mòn.

---

## 4. Mock test bắt buộc (G4)

| File test | Case tối thiểu |
|---|---|
| `tests/stamp.test.mjs` | **golden file**: stamp 3 trang P02 → khớp byte-by-byte file đã commit; thiếu field catalog → fail có message rõ; partial thiếu khối bắt buộc → fail; `--check` phát hiện được 1 ký tự lệch |
| `tests/labs/contract-diff.test.mjs` (khuôn F) | v1 client + v2 API → gãy đúng field; v2 client + v2 → không gãy; nullable migration đúng thứ tự deploy thì an toàn, sai thứ tự thì không |
| `tests/labs/*.test.mjs` (10 trang mới) | mỗi lab ít nhất: naive cho kết quả sai/đắt theo đúng cơ chế bài học; principled sửa được; mọi metric truy nguyên về `costs()`/model |
| `tests/principle-pages.test.mjs` | mỗi principle trong catalog có đúng 1 trang; trang liệt kê đủ problem minh hoạ nó; sort `foundational → advanced`; mở đầu **không** phải grid card (khác catalog) |
| `tests/links.test.mjs` | 0 link chết; `related` hai chiều; `PrincipleMap` chỉ chứa slug tồn tại; **không link nào ra ngoài `/labs/`** (LUẬT 0) |
| `tests/og.test.mjs` | 18/18 ảnh tồn tại; kích thước đúng 1200×630; tên file khớp slug |
| `tests/catalog.test.mjs` (mở rộng) | 18 entry; 6/6 category có ≥ 1 trang; mỗi `difficulty`/`blastRadius` thuộc enum; `stats()` trả `18 · 6 of 6` |

**Regression:** toàn bộ suite P01–P03 phải pass **không sửa test nào**. Đây là lần kiểm tra lớn nhất của kiến trúc: 18 lab chạy trên một runtime viết từ P01.

---

## 5. Self-check

### Cổng tự động

```bash
npm run build          # stamp -> stamp --check -> verify
npm run check:contract # 18/18 pass dieu 1,2,4,7,8
node tools/check-links.mjs
node tools/budget.mjs  # 18 trang, cot % tran
npm run test:coverage  # runtime van >= 85%
```

### Checklist tay

Dùng [`_self-check-template.md`](_self-check-template.md) cho 10 trang mới. Ở cấp phase:

- [ ] **18/18 trang pass Stage Contract 10 điều** (5 điều tự động + 5 điều tay).
- [ ] 18/18 pass review gate §14 UI plan: ≥ 11/14, **không trục nào 0**.
- [ ] **Không còn copy tay HTML**; `stamp.mjs` là đường duy nhất. Thử sửa 1 ký tự trong `labs/<slug>.html` → `npm run build` fail.
- [ ] Dán link vào một chat nhóm / mạng xã hội: preview tử tế — **kiểm bằng validator của chính nền tảng đó**, không phải bằng cách nhìn file PNG; và đọc thử ở cỡ thumbnail.
- [ ] Trang principle dẫn chéo đúng quan hệ nhiều-nhiều, **không link chết**.
- [ ] Mọi trang có khối ⑥ Trade-offs **không rỗng** (LUẬT 6b) — và không có câu tuyệt đối ("luôn", "không bao giờ") trừ khi có điều kiện biên kèm theo.
- [ ] Mỗi trang có **sơ đồ SVG khối ④ riêng**, không dùng lại sơ đồ của trang khác.
- [ ] M1–M7 trên 10 trang mới + 2 trang principle đại diện.
- [ ] 3 trang security mới: không trang nào đọc như hướng dẫn khai thác. Nhờ 1 người ngoài đọc và xác nhận.

### Kiểm tiêu cực

| # | Phá | Kỳ vọng |
|---|---|---|
| 1 | Sửa tay 1 ký tự trong `labs/n-plus-one-query.html` | `npm run build` fail ở `stamp --check` |
| 2 | Xoá 1 entry khỏi catalog nhưng giữ file HTML | `check-links` / `catalog.test` fail |
| 3 | Đổi `related` thành một chiều | `links.test.mjs` fail hoặc tool nói rõ là có chủ ý |
| 4 | Xoá 1 ảnh OG | `og.test.mjs` fail |
| 5 | Đặt trang principle dùng lại layout grid của catalog | `principle-pages.test.mjs` fail (quyết định Step 4.3) |
| 6 | `stamp.mjs` sinh một trang có link tới `pages/` | `isolation.test.mjs` fail — generator cũng bị LUẬT 0 ràng buộc |

---

## 6. Exit gate — tick hết mới sang P05

- [ ] Mục 5 xanh toàn bộ.
- [ ] 18/18 (hoặc 12/12 nếu đã dùng tripwire) trang hoàn chỉnh, pass contract + review gate.
- [ ] `stamp.mjs --check` xanh trong CI, trên PR cũng chạy.
- [ ] Thời gian/trang theo lô **giảm dần** — số thật trong `decisions.log`.
- [ ] `decisions.log` có dòng ghi ngày `stamp.mjs` ra đời + link commit, và dòng đó **được dẫn trên trang `build-it-for-the-future`**.
- [ ] Commit `feat(p04): 18 pages, stamp generator, principle index`.

---

## 7. Tripwire

| Dấu hiệu | Hành động |
|---|---|
| **Tới trang 12 mà nhiệt độ giảm** | **Dừng ở 12**, làm thật tốt, cập nhật `catalog.js`. **12 trang hoàn chỉnh đánh bại 18 trang nửa vời** — và landing tính số từ catalog nên không có chỗ nào trông bỏ hoang. Ghi quyết định này vào `decisions.log` như một lựa chọn, không như một thất bại |
| `stamp.mjs` > 120 dòng hoặc cần template engine | Dữ liệu đang sai hình. Sửa `catalog.js` / partial, không nâng cấp generator |
| Cần thêm dependency để rasterize OG | 18 lần chạy không đáng một dependency. Convert tay 1 lần, commit PNG |
| Một trang security đọc như hướng dẫn khai thác | Viết lại theo hướng *phạm vi thiệt hại*, không theo hướng *cách làm*. Nếu không viết được kiểu đó thì bỏ trang |
| Sơ đồ SVG bắt đầu giống nhau giữa các trang | Khối ④ chưa được nghĩ cho trang đó. Sơ đồ generic tệ hơn không có sơ đồ |
| Muốn thêm search / tag cloud / dark-light toggle | Hoãn P05. Chưa ai yêu cầu, và mỗi cái là một diện tích bảo trì |
