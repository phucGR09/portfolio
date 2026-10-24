# P03 — Chiều sâu dụng cụ (+5 trang, khuôn D & E)

> **Tương ứng:** UI plan §12.3 (P2) · plan cũ §8 (P2).
> **Mục tiêu:** mở **hai khuôn khó nhất** — D (Load Dial) và E (Race Track) — vì đây là hai khuôn có *thời gian* và *đồng thời*, thứ mà không demo blog nào làm. Và làm catalog trên landing đủ card để filter **thật sự có ích**.
> **Ước lượng:** 5–7 ngày · **Tiền đề:** P02 exit gate xanh, đặc biệt câu hỏi "có phải sửa `lab.js` không" đã trả lời **không**.

---

## 1. Phạm vi — 5 trang, tổng 8

| Trang | Khuôn | Category | Lý do chọn vào P03 |
|---|---|---|---|
| `no-index-no-mercy` | **D** Load Dial | `performance` | mở `LiveChart` + `PlanBox` + **chiều ngược** (INSERT chậm đi) |
| `double-click-double-charge` | **E** Race Track | `reliability` | mở `DualTrack` + `RaceWindow` + 2 hue identity |
| `offset-vs-cursor-pagination` | A (tái dùng) | `data` | **phép thử: instrument của P02 có tái dùng được không** |
| `trusting-the-client` | B (tái dùng) | `security` | phép thử thứ hai, cùng mục đích |
| `the-function-that-does-seven-things` | **G** Complexity Meter | `code-design` | mở `ComplexityGauge` sớm để P04 nhẹ hơn |

**Component mới:** `LoadDial`, `LiveChart`, `PlanBox`, `ScanBar`, `DualTrack`, `RaceWindow`, `LedgerList`, `InsertCounter`, `ComplexityGauge`.

**Block mới ở cấp site:** prev/next trong cùng category · progress `localStorage` (`pl:v1:read`) · `Surprise me` (nếu chưa làm ở P02) · `Copy link to this run` (deep-link §10.3 UI plan).

**Thứ tự bắt buộc:** 2 trang tái dùng khuôn (A, B) **trước**, rồi mới D, E, G.
Lý do: hai trang tái dùng là **phép đo chất lượng runtime**, và chúng rẻ. Làm trước để nếu runtime chưa đủ tốt thì phát hiện khi còn 5 ngày, không phải khi còn 1.

---

## 2. Các bước thực thi

### Step 3.1 + 3.2 — Hai trang tái dùng khuôn (phép đo, không phải nội dung phụ)

`offset-vs-cursor-pagination` (khuôn A) và `trusting-the-client` (khuôn B).

**Target cứng:** **mỗi trang viết xong trong ≤ 2 giờ** (không tính thời gian viết nội dung văn xuôi).

Nếu lâu hơn → runtime chưa đủ tốt, và **đó là tín hiệu quan trọng hơn cả việc có thêm trang**. Dừng, tìm xem instrument nào đang bị tham số hoá sai, sửa, rồi tiếp. Ghi thời gian thật của cả hai vào `decisions.log` — đây là số liệu duy nhất cho biết kiến trúc P01 có trả lãi hay không.

**Nội dung:**
- `offset-vs-cursor-pagination`: trang 2 lặp dòng khi có insert mới. Internals hiện **cùng một row xuất hiện ở cả 2 trang** — đó là bài học, không phải con số thời gian.
- `trusting-the-client`: sửa giá trong request, server tin luôn. Verdict: `charged 1đ for a 500.000đ item` → `400 price mismatch, order rejected`.

---

### Step 3.3 — `no-index-no-mercy` (khuôn D — Load Dial)

| Vùng | Nội dung |
|---|---|
| ① Control | ô tìm kiếm; `ModeSwitch` no-index ⇄ B-tree; **slider kích thước bảng 1k → 50k**; nút `Insert 1000 rows` |
| ② Response | kết quả tìm + thời gian |
| ③ Internals | `PlanBox`: `Seq Scan on candidates (rows scanned: 50000)` vs `Index Scan using idx_candidates_email (rows scanned: 1)`; `ScanBar`; `LiveChart` latency theo tải |
| ④ Verdict | `50.000 rows scanned · 420ms` → `1 row · 2ms` |

**4 quyết định UI chốt ở phase này (§12.3 UI plan):**

1. **Trục `LiveChart`: fix scale theo kịch bản, không auto scale.** Auto scale làm đường cong *trông giống nhau* ở mọi mức tải — mà sự khác nhau chính là bài học. Vượt trần thì hiện `clipped at Xms` rõ ràng.
2. **`--id-a` / `--id-b` (2 hue identity) lên `lab.css`** vì nay dùng ở 2 lab → rule-of-two (§8.1).
3. **Cửa sổ race hiện bằng vệt mờ `--sig-warn`** phủ lên timeline + nhãn `race window: 180 ms`. **Không animation nhấp nháy** — nó làm người đọc mất chỗ đang nhìn.
4. **Chiều ngược của index (INSERT chậm đi) là một tab riêng trong stage, ngang hàng**, không phải chú thích nhỏ. **Trang này chỉ "senior" khi chiều ngược được trình bày ngang hàng.**

**Yêu cầu kỹ thuật:** `LiveChart` mượt 60fps với 200 điểm trên máy tầm trung. Inline SVG viết tay (LUẬT 14), cập nhật bằng cách thay `points` của một `<polyline>` duy nhất, không tạo lại node mỗi frame.

---

### Step 3.4 — `double-click-double-charge` (khuôn E — Race Track)

| Vùng | Nội dung |
|---|---|
| ① Control | nút `Pay 500.000đ` (cho bấm liên tục); `ModeSwitch` no-key ⇄ idempotency-key |
| ② Response | `LedgerList`: naive 2 giao dịch, trừ tiền 2 lần; principled giao dịch 2 trả `200` kèm `replayed: true` |
| ③ Internals | `DualTrack` 2 request song song + `RaceWindow` phủ cửa sổ race |
| ④ Verdict | `balance -1.000.000đ · 2 charges` → `-500.000đ · 1 charge` |

**Target:** tiêu chí xong của khuôn E **không phải** "thấy race xảy ra" mà là **người đọc hiểu được *vì sao* race xảy ra**. Cụ thể: `RaceWindow` phải chỉ ra đúng khoảng thời gian mà cả hai request đều đã đọc balance cũ và chưa ai ghi. Nếu người đọc chỉ thấy "2 dòng thay vì 1" thì trang này chưa đạt, dù số đúng.

Dùng `server.parallel()` đã chốt API từ P01 Step 1.6 — **nếu phải sửa `server.js` ở đây, ghi vào `decisions.log`**: nó có nghĩa API P01 đoán sai một chỗ, và đó là thông tin đáng giá cho P04.

---

### Step 3.5 — `the-function-that-does-seven-things` (khuôn G)

| Vùng | Nội dung |
|---|---|
| ① Control | checkbox các requirement |
| ② Response | 2 cột code cạnh nhau (`CodeSideBySide` phiên bản tối giản, bản đầy đủ ở P04) |
| ③ Internals | `ComplexityGauge`: `branches · nesting depth · tests needed` |
| ④ Verdict | `180 dòng · 11 branch · 14 test` → `4 hàm · 2 branch mỗi hàm · 7 test` |

**Target:** `ComplexityGauge` phải **đếm từ cấu trúc dữ liệu mô tả hàm**, không phải từ số bạn gõ vào. Đây là ứng dụng trực tiếp của LUẬT 7a; và nó làm `ComplexityGauge` tái dùng được cho `build-it-for-the-future` ở P04 mà không sửa.

---

### Step 3.6 — Block cấp site

| Block | Yêu cầu |
|---|---|
| prev/next cùng category | sinh từ `catalog.js`; ở footer mỗi trang lesson → tạo cảm giác "khoá học", không phải bãi bài rời |
| progress `localStorage` | key `pl:v1:read`; đánh dấu card đã đọc trong catalog; qua `persist.js` (whitelist scope đã có từ P01) |
| `Copy link to this run` | deep-link `?mode=&rows=` — serialize state hiện tại, parse khi load |
| `Surprise me` | nếu chưa làm ở P02 |

**Về deep-link:** ~25 dòng code, đổi lấy khả năng **gửi một trạng thái hỏng cho người khác**. Tỉ lệ giá trị/chi phí cao nhất trong toàn bộ danh sách tính năng (sửa #6 UI plan §15). Chỉ deep-link **control state**, không deep-link kết quả — kết quả phải được chạy lại để con số luôn trung thực.

---

### Step 3.7 — Stylelint (D8 đến hạn)

Nay có 8 stage CSS → thêm `stylelint` + `stylelint-config-standard` vào devDeps, script `lint:css`, và đưa vào `verify`.

**Rule đặc thù cần bật:**
- `declaration-property-value-allowed-list` cho `font-variant-numeric` ở class số đo (LUẬT 4c);
- cấm `!important` trong `scripts`-adjacent stage CSS (dấu hiệu stage đang đánh nhau với `lab.css`);
- giới hạn số khai báo màu mới mỗi file stage ≤ 2 (LUẬT 8) — nếu stylelint không diễn đạt nổi thì để `check-contract.mjs` lo, **không** viết plugin riêng.

---

## 3. Mock test bắt buộc (G4)

| File test | Case tối thiểu |
|---|---|
| `tests/labs/offset-vs-cursor.test.mjs` | naive: sau khi insert, trang 2 **chứa lại** 1 row của trang 1; cursor: không trùng row nào; tổng row distinct đúng |
| `tests/labs/trusting-the-client.test.mjs` | sửa `price` trong payload → naive charge theo client; principled trả 400 và **không** ghi transaction |
| `tests/labs/no-index.test.mjs` | `rowsScanned` = n khi seq scan, ≈ log2(n) khi index; `ms` đơn điệu tăng theo n ở seq scan; **chiều ngược: 1000 insert có index tốn `ms` nhiều hơn không index**; `LiveChart` clip đúng khi vượt trần |
| `tests/labs/double-charge.test.mjs` | 2 request song song **không** key → 2 transaction, balance −2×; **có** key → 1 transaction, request 2 trả `replayed: true`; cửa sổ race tính được bằng số và xác định theo seed |
| `tests/labs/seven-things.test.mjs` | `ComplexityGauge` đếm branch/nesting/test từ cấu trúc, không từ literal; bật/tắt requirement → số đổi đúng chiều |
| `tests/deeplink.test.mjs` | serialize → parse roundtrip giữ nguyên state; query param lạ bị bỏ qua an toàn; **không** deep-link kết quả; URL không chứa gì người đọc nhập (LUẬT 18) |
| `tests/progress.test.mjs` | key đúng `pl:v1:read`; storage throw → landing vẫn render; xoá storage → không card nào bị mất |
| `tests/nav.test.mjs` | prev/next sinh đúng trong từng category, đầu/cuối không link chết; mọi `related` hai chiều hợp lệ |
| `tests/contract.test.mjs` (mở rộng) | 8/8 trang pass điều 1,2,4,7,8 |

**Regression:** full test suite P01 + P02. Thêm 5 trang là lần đầu `catalog.js` có nhiều hơn 3 entry → `tests/catalog.test.mjs` và `tests/hub.test.mjs` phải vẫn pass **không sửa test** (nếu phải sửa, nghĩa là test cũ đã hardcode số entry — sửa test, ghi `decisions.log`).

---

## 4. Self-check

### Cổng tự động

```bash
npm run typecheck
npm run lint
npm run lint:css            # moi tu Step 3.7
npm test
npm run check:budget        # lab.css <= 18KB (tripwire), moi trang < 60KB JS
npm run check:contract      # 8/8 trang
npm run build
```

### Checklist tay

Dùng [`_self-check-template.md`](_self-check-template.md) cho **từng** lab mới (5 bản). Ở cấp phase:

- [ ] **Filter trên catalog có ích thật:** 8 card, **bỏ filter đi thì khó tìm**. (Nếu bỏ filter vẫn dễ tìm → filter chưa cần, và việc giữ nó là trang trí.)
- [ ] 2 lab tái dùng khuôn viết xong **≤ 2 giờ mỗi cái** — thời gian thật ghi trong `decisions.log`.
- [ ] `LiveChart` mượt 60fps với 200 điểm (DevTools Performance, máy tầm trung).
- [ ] **Khuôn E đúng về mặt kỹ thuật:** hỏi 1 người biết backend — họ phải nói được *vì sao* race xảy ra sau khi xem lab, không chỉ *rằng* nó xảy ra.
- [ ] Chiều ngược của index được trình bày **ngang hàng**, không phải chú thích.
- [ ] Deep-link hoạt động trên cả 8 trang.
- [ ] M1–M7 pass trên 5 trang mới.
- [ ] `prefers-reduced-motion` trên khuôn D và E: hai khuôn này **phụ thuộc chuyển động nhất** → stepped reveal phải thật sự còn dạy được bài học, không chỉ "không lỗi".

### Kiểm tiêu cực

| # | Phá | Kỳ vọng |
|---|---|---|
| 1 | Đổi `LiveChart` sang auto scale | 2 đường cong trông giống nhau → mắt thấy ngay vì sao quyết định 1 là đúng. Revert |
| 2 | Bỏ idempotency key check trong principled mode | `double-charge.test.mjs` fail |
| 3 | Deep-link thêm `?email=abc@x.com` | bị bỏ qua, không persist (LUẬT 18) |
| 4 | Thêm hue thứ 3 vào một stage CSS | `check:contract` fail (điều 7) |
| 5 | Chặn `localStorage` (DevTools) | landing vẫn render đủ 8 card |
| 6 | Thêm link ra portfolio trong block prev/next | `isolation.test.mjs` fail (LUẬT 0) |

---

## 5. Exit gate — tick hết mới sang P04

- [ ] Mục 4 xanh toàn bộ (5 bản checklist tay + tiêu cực).
- [ ] 8/8 trang pass `check:contract`; 8/8 pass review gate §14 UI plan (≥ 11/14, không trục nào 0).
- [ ] **Thời gian viết 2 lab tái dùng ≤ 2h mỗi cái** — nếu không đạt, đã sửa runtime và ghi lại đã sửa gì.
- [ ] `lab.css` ≤ 18 KB.
- [ ] Catalog với 8 card: filter có ích thật.
- [ ] `tests/isolation.test.mjs` pass sau khi thêm 5 trang + prev/next (block mới sinh link → chỗ dễ lọt link ra ngoài nhất).
- [ ] Commit `feat(p03): load dial, race track, 8 pages`.

---

## 6. Tripwire

| Dấu hiệu | Hành động |
|---|---|
| `lab.css` > 18 KB | Có pattern chỉ dùng 1 lần bị nhấc lên sớm → đẩy về stage CSS |
| **Trang thứ 6 được tạo bằng copy tay** | **Tripwire §2.3 UI plan nổ đúng ở đây.** Theo kế hoạch, `stamp.mjs` thuộc P04 — nhưng nếu cảm giác sửa nav/footer đã đau ở trang thứ 6 thì **kéo `stamp.mjs` lên ngay trong P03**. Ghi `decisions.log` cả hai hướng đã chọn và vì sao |
| Khuôn E cần `setTimeout` thô | Sai: dùng `clock.parallel` / `server.parallel`. eslint sẽ chặn, và nó đúng |
| `LiveChart` cần thư viện chart | Dừng (LUẬT 14). Một `<polyline>` + `points` là đủ; nếu không đủ thì vấn đề là scale đang sai, không phải thiếu thư viện |
| Nhiệt độ giảm sau trang thứ 6 | Dừng ở 8 trang, **đánh bóng 8 trang đó cho hoàn hảo**, publish, nghỉ. Landing tính số từ catalog nên không có chỗ nào trông bỏ hoang. P04 chờ được |
