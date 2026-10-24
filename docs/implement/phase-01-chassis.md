# P01 — Chassis & Shell (nền móng)

> **Tương ứng:** UI plan §12.1 (P0) · plan cũ §8 (P0).
> **Mục tiêu:** một lab **rỗng** chạy được với đủ 4 vùng và đủ 6 trạng thái. Không có nội dung thật nào.
> **Vì sao đây là phase quan trọng nhất:** 80% rủi ro thiết kế của cả 18 trang bị loại bỏ ở đây. Mọi quyết định hình thức chốt ở P01 là quyết định **không phải nghĩ lại 17 lần**.
> **Ước lượng:** 3–4 ngày · **Tiền đề:** P00 exit gate xanh.

---

## 1. Phạm vi

**Làm:** 2 file CSS, 8 module runtime, 2 file data, `_template.html`, `_states.html`, 1 lab rỗng.

**Không làm:** nội dung lesson thật, landing, lab thật. **Và không chạm vào `index.html` / `pages/**` của portfolio ở bất kỳ phase nào** (LUẬT 0 / D11). Người đọc **chưa thấy gì** sau P01 — đúng chủ ý: `_states.html` có `<meta name="robots" content="noindex">` và không được link từ bất cứ đâu.

**Thứ tự bắt buộc:** `types.d.ts` → `rng/fmt/logger/clock` → `store` → `server` → `lab` → CSS → `_states.html` → lab rỗng.
Lý do: viết CSS trước khi biết DOM mà `lab.js` sinh ra sẽ phải viết lại; viết `lab.js` trước `store.js` sẽ sinh ra API đoán mò.

---

## 2. Các bước thực thi

### Step 1.1 — `scripts/types.d.ts` (hợp đồng type, viết TRƯỚC code)

**Action:** khai báo mọi type dùng chung. Đây là file đầu tiên của P01 — cố ý.

```ts
export type Mode = "naive" | "principled";
export type LabState = "idle" | "running" | "settled" | "compare" | "error";
export type Zone = "control" | "response" | "internals" | "verdict";
export type Category = "data" | "security" | "code-design" | "api" | "performance" | "reliability";
export type Difficulty = "foundational" | "intermediate" | "advanced";
export type BlastRadius = "annoying" | "expensive" | "catastrophic";

/** Mot lan truy cap store — accounting that, nguon cua moi so tren Verdict (LUAT 7a). */
export interface QueryCost {
  readonly table: string;
  readonly op: "select" | "insert" | "update";
  readonly rowsScanned: number;
  readonly rowsReturned: number;
  readonly usedIndex: boolean;
  readonly ms: number;
}

export interface RunResult {
  readonly mode: Mode;
  readonly metrics: Readonly<Record<string, number>>;
  readonly costs: readonly QueryCost[];
  readonly state: LabState;
}

export interface LabSpec { /* id, stage, modes, controls, model, metrics, run */ }
```

**Target:**
- `QueryCost` là **trái tim của tính trung thực** của cả site: mọi con số trên Verdict phải truy nguyên về mảng `costs`. Type hoá nó trước buộc `store.js` phải accounting ngay từ dòng đầu, chứ không "thêm sau".
- `readonly` khắp nơi: lab **không được sửa** accounting của store. Type system thực thi LUẬT 7d (runtime không được tối ưu hộ, và lab không được làm đẹp số).

**Self-check:** `npm run typecheck` pass với file `.d.ts` chưa ai import.

---

### Step 1.2 — `scripts/runtime/rng.js` + `fmt.js` (thuần, test trước)

| Module | API | Yêu cầu |
|---|---|---|
| `rng.js` | `createRng(seed) -> { next(), int(min,max), pick(arr), jitter(value, pct) }` | PRNG xác định (mulberry32 hoặc sfc32, ~15 dòng). **Cùng seed → cùng dãy, mọi lần, mọi máy** |
| `fmt.js` | `duration(ms)`, `count(n)`, `bytes(n)`, `money(vnd)`, `pct(x)` | Luôn trả **chuỗi có đơn vị**; không bao giờ trả `NaN` / `undefined` (trả `—` kèm đơn vị) |

**Target (LUẬT 7c):** dữ liệu sinh từ `rng(seed)`, seed được **in ra trên `ModelNote`**. Nghĩa là người đọc có thể tự dựng lại đúng bộ dữ liệu — số bạn công bố thành số kiểm chứng được. Đây là khác biệt giữa "demo giả" và "mô hình công bố".

**Lý do `fmt` không bao giờ trả `NaN`:** instrument ở trạng thái `idle` phải giữ chỗ bằng `— ms` để CLS < 0.1 (điều 10 stage contract). Nếu `fmt` trả `NaN` thì `idle` trông như lỗi.

---

### Step 1.3 — `scripts/runtime/logger.js`

**API:** `createLogger() -> { emit(type, payload), on(type, fn), off(...), history() }`

**Target:**
- Panel Internals **chỉ là subscriber**, không gọi vào thực thi. Tách quan sát khỏi thực thi là nguyên lý mà site đang dạy — vi phạm ở đây là tự mâu thuẫn.
- `history()` giới hạn 500 event (ring buffer). Lab N+1 ở 500 rows sinh 501 event; không giới hạn thì tab 360px hết RAM.

---

### Step 1.4 — `scripts/runtime/clock.js`

**API:** `createClock({ speed = 1, ceilingMs = 4000 }) -> { sleep(ms), now(), skip(), abort(), onTick(fn) }`

**Target (LUẬT 16, §6.1–6.2 UI plan):**
- **Hai trục thời gian không được trộn:** `now()` trả *thời gian mô phỏng* (số dùng cho Verdict), `sleep()` tiêu *thời gian thật* (cảm giác chậm). Lab báo cáo 3180ms mô phỏng nhưng người đọc chỉ chờ thật ≤ 4s.
- `skip()` nhảy tới kết quả, giữ nguyên số mô phỏng → `Skip to result` không làm sai số liệu.
- `abort()` bind vào `Esc`.
- `ceilingMs` cứng: một lần chạy không bao giờ quá 4 giây thật.

**Đây là module duy nhất được dùng `setTimeout`** (eslint rule ở P00 thực thi điều này).

---

### Step 1.5 — `scripts/runtime/store.js`

**API:** `createStore(dataset) -> { select(table, predicate, opts), insert(table, row), tx(fn), costs(), reset() }`

**Target:**
- Mỗi truy cập **ghi một `QueryCost`**: `rowsScanned`, `usedIndex`, `ms` tính từ model công bố (ví dụ `0.8ms + 0.02ms/row`, jitter ±12% qua `rng`).
- **LUẬT 7d — tuyệt đối không tự tối ưu:** không memo, không cache, không gộp query. `store.select` gọi 101 lần phải tính chi phí 101 lần. Nếu store "thông minh", lab N+1 không còn 101 query và **bài học bốc hơi**.
- `select` có `opts.index` → mô phỏng B-tree: `rowsScanned ≈ log2(n)` thay vì `n`. Chuẩn bị cho lab `no-index-no-mercy` ở P03, nhưng API chốt từ P01 để không phải đổi store sau khi đã có 3 lab.
- `reset()` trả về dataset gốc **sinh lại từ seed**, không clone — đảm bảo `Reset` 3 lần cho trạng thái giống hệt (điều 9 stage contract).

**Self-check đặc thù:** test "gọi `select` 2 lần → `costs()` dài 2 và tổng `ms` gấp đôi". Test này canh LUẬT 7d; nó phải tồn tại trước khi có lab nào.

---

### Step 1.6 — `scripts/runtime/server.js`

**API:** `createServer(store, { logger, clock }) -> { route(path, handler), fetch(path, init), parallel([...reqs]) }`

**Target:**
- `fetch` trả `{ status, headers, body, ms }` — **đúng hình dạng một HTTP response thật**, vì panel Response hiển thị status code và payload (yêu cầu "the responsing" ở plan cũ §2.4).
- Hỗ trợ lỗi **mô phỏng có chủ ý**: `500`, `429`, timeout. Trạng thái `error` của lab hiển thị chúng **như dữ liệu**, không như lỗi trang (§7.2).
- `parallel()` chạy nhiều request chồng lấn trên cùng trục `clock` → nền tảng cho khuôn E (Race Track) ở P03. Chốt API từ P01, dùng ở P03.
- **Không có network thật.** Thêm một comment ở đầu file nói rõ điều này — một file tên `server.js` trong một repo site tĩnh sẽ bị người đọc code hiểu nhầm là backend.

---

### Step 1.7 — `scripts/runtime/persist.js`

**API:** `createPersist(ns = "pl:v1") -> { get(scope, id), set(scope, id, value), remove(...), available() }`

**Target (LUẬT 12b, 12c, 18):**
- Key đúng format `pl:<ver>:<scope>[:<id>]`.
- **Mọi** truy cập bọc `try/catch` → Safari private mode / storage bị chặn không được làm lab chết.
- **Không persist bất cứ gì người đọc nhập vào** (LUẬT 18). Chỉ 3 scope hợp lệ: `read` (đã đọc trang nào), `prefs` (mode cuối, lang), `hub` (filter cuối). Whitelist scope **trong code**, không phải trong tài liệu — và test case canh nó.

**Lý do whitelist bằng code:** site dạy least-privilege. Một `persist.set()` nhận scope tự do là chính cái phản ví dụ.

---

### Step 1.8 — `scripts/runtime/lab.js` (hạt nhân)

**API:** `defineLab(spec)` → mount vào `[data-lab]`, render 4 vùng, bind control, quản 6 trạng thái.

**Target:**
- **Thứ tự DOM luôn ①②③④** bất kể `spec.stage.zones` nói gì; `zones` chỉ sinh `grid-area` (LUẬT 5). *Tự do và kỷ luật được tách bằng chính API, không dựa vào việc người viết lab nhớ luật.*
- Mỗi vùng có `data-zone="control|response|internals|verdict"`; container có `data-state`.
- `compare`: store giữ `RunResult` lần cuối của **mỗi mode**; khi đủ cả hai → Verdict tự chuyển dạng so sánh. **Không có `compare`, lab chỉ là hai demo rời** — đây là phần dễ bỏ nhất và đắt nhất.
- Quản lý `Skip to result` (sau 1.2s ở trạng thái `running`) và `Reset`.
- **Trần 300 dòng.** Vượt → tripwire (xem §6).

**Ranh giới trách nhiệm (viết thành comment ở đầu file):**

| `lab.js` làm | `lab.js` KHÔNG làm |
|---|---|
| render 4 vùng, state machine, bind control, ghép compare | vẽ instrument, tính toán của lab, tối ưu dữ liệu |

---

### Step 1.9 — `scripts/data/seed.js`

**API:** `buildDataset(seed) -> { candidates, companies, users, transactions }`

**Target (LUẬT 7c, §11.2 UI plan):**
- **Sinh ra, không tải về.** 50k dòng JSON ≈ 4MB; sinh từ PRNG = 0 byte tải, ~15ms, và **lặp lại được**.
- Toàn vẹn tham chiếu: mọi `candidate.companyId` tồn tại trong `companies`. Có test canh.
- Dữ liệu người **phải rõ ràng là giả**: tên dạng `Ứng viên 0042` / `fake.user+42@example.invalid` (dùng TLD `.invalid` — chuẩn RFC 2606). Không dùng tên Việt thật-nghe-được, vì lab SQL injection sẽ "rò" bảng này ra màn hình và không ai được nghĩ đó là dữ liệu thật.

---

### Step 1.10 — `scripts/data/catalog.js`

**Action:** schema đầy đủ theo plan cũ §3.3 + 3 entry MVP (chưa cần đủ 18).

**Target:**
- Có hàm `stats()` tính `{ problems, categoriesUsed, categoriesTotal }` **từ chính mảng entry** → landing không bao giờ hardcode "18 problems" (quyết định §12.2.1 UI plan: ở P02 hiển thị `3 problems · 3 of 6 categories · every one runnable`).
- Field **`provenance`** bắt buộc, thuộc `"classic" | "field-report" | "derived"`, **mặc định `classic`** (plan §3.3). Không còn field `seenIn` — nó đã bị bỏ cùng định vị portfolio (plan §1.1).
- Có test canh: `provenance` thuộc enum, **không entry nào bỏ trống**, và **không chuỗi nào trong catalog chứa tên công ty / sản phẩm** (whitelist rỗng, grep danh sách tên trong `pages/*.html`). **Test này bảo vệ uy tín, không bảo vệ code** — và nay nó bảo vệ đúng thứ: tính trung thực về *xuất xứ vấn đề*, thay vì tính đúng của một link ra portfolio.

---

### Step 1.11 — `source/principles.css` + `source/lab.css`

| File | Nội dung | Trần |
|---|---|---|
| `principles.css` | **token riêng của Lab** (chassis + mono, signal, motion, spacing), shell 8 khối của trang lesson, nav + footer riêng, layout landing | 14 KB |
| `lab.css` | kernel 4 vùng, 6 trạng thái, 14 kernel component (§8.2 UI plan) | 18 KB |

**Target:**
- **`principles.css` tự khai `:root` token của Lab** — **không** `@import`, **không** `<link>` tới `source/styles.css` / `case-study.css` (LUẬT 0 / plan §6.1 quyết định 2). Giá trị có thể trùng palette portfolio; trùng giá trị không phải chung nguồn.
- **Không thêm hệ màu mới giữa các lab.** Branch color qua `--accent` inline trên `<body>` của trang lesson.
- `--accent` 6 nhánh theo §3.2 UI plan, **có đổi `reliability` thành `#b5e853`** (sửa #2 của UI plan §15: `#a5d6ff` quá gần `#79c0ff` của `api`, hai pill cạnh nhau không phân biệt được).
- Số đo: `font-variant-numeric: tabular-nums` **bắt buộc** cho mọi phần tử `.metric`, `.counter`, `.log-line` (LUẬT 4c). Không có nó, counter rung khi đếm và lab trông như đồ chơi — 0 byte để sửa.
- 4 vùng mobile-first: 360px xếp dọc ①②③④; query log có `max-height` + scroll riêng.
- `prefers-reduced-motion`: **stepped reveal 3 bậc, không xoá reveal** (LUẬT 17, sửa #7 UI plan). Tắt hết animation = người bật setting đó mất toàn bộ nội dung dạy học.

---

### Step 1.12 — `principles/_template.html`

**Action:** khung 8 khối (plan cũ §4.1) với comment hướng dẫn điền, `--accent` inline, `<noscript>` mẫu, `ModelNote` + `SafetyLine` placeholder.

**Target:** copy tay cho 3 trang P02 — **cố ý, và ghi lý do vào comment đầu file**: 3 chỗ sửa chưa đáng để build generator (*reversible decision*). Kèm luôn dòng: `TRIPWIRE: trang thu 6 -> viet tools/stamp.mjs, xem docs/implement/phase-04-completion.md`.

Comment này là cơ chế chống quên quan trọng nhất của P04, và nó nằm đúng chỗ người ta sẽ đọc: trong file họ đang copy.

---

### Step 1.13 — `principles/_states.html` (deliverable có ROI cao nhất của P01)

**Action:** gallery **mọi kernel component × 6 trạng thái**.

**Target:**
- Thiết kế `idle`, `error`, `compare` **một lần, kỹ** — thay cho 18 × 3 lần ứng biến lúc đã mệt.
- `<meta name="robots" content="noindex">`, không link từ đâu.
- Mỗi ô có nhãn `component · state` để chụp ảnh đưa review.

**6 quyết định UI phải chốt tại đây** (chốt xong thì 17 trang sau không nghĩ lại — §12.1 UI plan):

1. Chiều cao tối thiểu của stage và cách giữ chỗ để CLS < 0.1.
2. Hình dạng `ModeSwitch` ở 3 trạng thái (naive / principled / đang chuyển) — **không màu đỏ cho naive** (LUẬT 3).
3. Hình dạng `idle` của panel trống: khung + trục + câu mời gọi (không được là khung trắng không nhãn).
4. Hình dạng `error`: lỗi mô phỏng hiện **như dữ liệu**.
5. Hình dạng `compare`: before → after nằm đâu, chữ gì, có tỉ lệ không.
6. Vị trí + kích cỡ `ModelNote` và `SafetyLine`.

---

### Step 1.14 — Lab rỗng `scripts/labs/_demo.js`

**Action:** 1 control (button), 1 response giả, 1 log 20 dòng, 1 verdict 2 metric. Không nội dung thật.

**Target:** chứng minh `defineLab` chạy end-to-end: `idle → running → settled → reset → idle`, **3 lần, trạng thái giống hệt**.

---

## 3. Deliverables

| Nhóm | File |
|---|---|
| Type | `scripts/types.d.ts` |
| Runtime | `rng.js` `fmt.js` `logger.js` `clock.js` `store.js` `server.js` `persist.js` `lab.js` |
| Data | `scripts/data/seed.js` `scripts/data/catalog.js` |
| CSS | `source/principles.css` `source/lab.css` |
| HTML | `principles/_template.html` `principles/_states.html` |
| Lab | `scripts/labs/_demo.js` |
| Component | 14 kernel component (§8.2 UI plan) — **không instrument nào** |

---

## 4. Mock test bắt buộc (G4)

Mỗi dòng là một file test; cột *case* là mức tối thiểu.

| File test | Case tối thiểu | Canh luật nào |
|---|---|---|
| `tests/rng.test.mjs` | cùng seed → cùng 1000 số đầu; seed khác → khác; `int()` trong biên; `jitter()` không vượt ±pct | 7c |
| `tests/fmt.test.mjs` | mọi hàm luôn trả chuỗi có đơn vị; `undefined`/`NaN` → `—`; `duration(3180)` đọc được | 4c |
| `tests/logger.test.mjs` | emit đúng thứ tự; `off` thật sự hủy; ring buffer cắt ở 500 | §6.3 |
| `tests/clock.test.mjs` | `now()` (mô phỏng) độc lập thời gian thật; `skip()` giữ nguyên số mô phỏng; `ceilingMs` chặn ở 4000; `abort()` reject | 16 |
| `tests/store.test.mjs` | **gọi `select` 2 lần → 2 cost, ms gấp đôi (không cache)**; `rowsScanned` đúng cho seq scan; `usedIndex` → scan ≈ log2(n); `reset()` 3 lần cho state giống hệt; `costs()` readonly | **7d**, 7a, điều 9 |
| `tests/server.test.mjs` | response có đủ `{status, headers, body, ms}`; inject 500/429 trả đúng status; `parallel()` cho 2 request chồng lấn trên trục clock | §7.2 |
| `tests/persist.test.mjs` | key đúng `pl:v1:<scope>`; `fakeStorage({throwing:true})` **không** làm throw lọt ra; scope ngoài whitelist bị từ chối | 12b, 12c, 18 |
| `tests/seed.test.mjs` | dataset xác định theo seed; toàn vẹn tham chiếu `companyId`; email đều `.invalid`; 50k dòng sinh < 100ms | 7c |
| `tests/catalog.test.mjs` | slug unique; `related` trỏ tới slug tồn tại; `category` thuộc 6 giá trị; `stats()` tính từ mảng; **`provenance` thuộc enum và không entry nào bỏ trống**; không chuỗi nào chứa tên công ty / sản phẩm | §10.1, uy tín |
| `tests/isolation.test.mjs` (mở rộng từ P00) | thêm case: **mọi file `principles/*.html` nạp đúng `principles.css` + `lab.css` và không nạp CSS của portfolio**; `principles.css` không có `@import` ra ngoài | **LUẬT 0** |
| `tests/lab.test.mjs` (linkedom) | 4 vùng có `data-zone` đúng tên; **thứ tự DOM = ①②③④**; `idle→running→settled→reset→idle` 3 lần giống hệt; `role="switch"` + `aria-checked`; Response có `aria-live="polite"`; chạy 2 mode → `data-state="compare"` | điều 1,2,6,9; §7.2 |

**Ngưỡng:** `scripts/runtime/**` ≥ 85% line coverage (`npm run test:coverage`).

**Test đáng giá nhất của P01** là case không-cache trong `store.test.mjs`. Nó canh cái bẫy tinh vi nhất của toàn kiến trúc (LUẬT 7d): store tự cache thì mọi lab performance mất bài học, và lỗi đó **không hiện ra như lỗi** — số vẫn đẹp, chỉ là sai.

---

## 5. Self-check

### Cổng tự động

```bash
npm run typecheck           # 0 error
npm run lint                # 0 error 0 warning
npm test                    # 10 file test, 0 fail
npm run test:coverage       # runtime >= 85% line
npm run check:budget        # principles.css <= 14KB, lab.css <= 18KB, runtime <= 24KB
npm run build               # ca 5 buoc exit 0
wc -l scripts/runtime/lab.js   # <= 300 (tripwire)
```

### Checklist tay (mở `principles/_states.html` và trang lab rỗng)

- [ ] **M7** — `_states.html` hiện đủ 14 component × 6 trạng thái, **không ô nào trống**.
- [ ] Lab rỗng: `idle → running → settled → reset → idle`, 3 lần, trạng thái giống hệt.
- [ ] `idle` có câu mời gọi và instrument hiện **khung + trục** (không khung trắng).
- [ ] `error` trông như dữ liệu, không như lỗi trang. Không alert, không console.
- [ ] `compare` tự ghép sau khi chạy cả 2 mode.
- [ ] **M5** — tắt JS: `<noscript>` hiện bảng tĩnh, **không khung trắng nào**.
- [ ] **M1** — 360px: không scroll ngang ở cấp trang.
- [ ] **M2** — tab-through đi hết lab; `Esc` dừng run.
- [ ] **M3** — screen reader đọc Response khi nó đổi.
- [ ] **M4** — `prefers-reduced-motion`: vẫn tiết lộ theo 3 bậc, không mất nội dung.
- [ ] **M6** — Lighthouse ≥ 95 cả 4 mục trên trang lab rỗng.
- [ ] CLS < 0.1: Verdict xuất hiện **không** đẩy layout.

### Kiểm tiêu cực

| # | Phá | Kỳ vọng |
|---|---|---|
| 1 | Thêm memo cache vào `store.select` | `store.test.mjs` **fail** (LUẬT 7d) |
| 2 | Đổi `spec.stage.zones` để verdict lên đầu | DOM vẫn ①②③④ → `lab.test.mjs` pass; chỉ `grid-area` đổi |
| 3 | `persist.set("secrets", ...)` | bị từ chối, test fail nếu không |
| 4 | Thêm số literal `3180` vào `_demo.js` | `check:contract` **fail** (điều 4) — nếu chưa fail thì contract check chưa đủ, sửa tool |
| 5 | Thêm `<link href="../source/styles.css">` vào `_states.html` | `isolation.test.mjs` **fail** (LUẬT 0) |

---

## 6. Exit gate — tick hết mới sang P02

- [ ] Toàn bộ mục 5 (tự động + tay + tiêu cực) xanh.
- [ ] `wc -l scripts/runtime/lab.js` ≤ 300.
- [ ] 6 quyết định UI ở Step 1.13 đã chốt và **được chụp ảnh lưu vào `docs/implement/snapshots/p01/`**.
- [ ] **Bạn đã review `_states.html` bằng mắt và đồng ý** — đây là điểm kiểm soát quan trọng nhất của cả dự án: toàn bộ ngôn ngữ thị giác của 18 trang, trong một màn hình, **trước khi nó bị nhân bản**.
- [ ] `decisions.log` ghi mọi nhượng bộ của P01.
- [ ] Commit `feat(p01): chassis, runtime, states gallery`.

---

## 7. Tripwire

| Dấu hiệu | Hành động |
|---|---|
| `lab.js` > 300 dòng | **Dừng.** Runtime đang gánh việc của lab. Đọc lại §11.3 UI plan trước khi sang P02 |
| Cần routing / template engine / reactive store | Dừng, đọc §2.1 + §15.6 UI plan. Nhu cầu này ở P01 gần như chắc chắn là dấu hiệu thiết kế sai, không phải nhu cầu thật |
| `lab.css` > 18 KB khi **chưa có lab thật nào** | Đang thiết kế cho lab tưởng tượng. Cắt về kernel + 6 trạng thái |
| Muốn thêm instrument (chart, waterfall) ở P01 | Hoãn sang P02. P01 không có instrument nào — đó là định nghĩa của phase này |
| P01 vượt 5 ngày | Cắt phạm vi: `_states.html` + lab rỗng là bắt buộc; `catalog.js` có thể chỉ 1 entry |
