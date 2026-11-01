# P02 — MVP: 3 lab + landing riêng của Lab

> **Tương ứng:** UI plan §12.2 (P1) · plan cũ §8 (P1), §5.4 (Lab 1–3).
> **Mục tiêu kép:** (a) chứng minh runtime **thật sự dùng chung được** qua 3 khuôn tương tác khác nhau (A, B, C) và 3 category khác nhau; (b) chứng minh mô hình 3 tầng cho phép 3 stage **khác hình hoàn toàn** mà vẫn một nhịp đọc.
> **Đây là phase đầu tiên người đọc nhìn thấy.** Sau P02, link gửi được cho một người đang đau — và họ học được một thứ mà không cần ai giải thích.
> **Ràng buộc xuyên phase:** Lab là site độc lập — **không chạm `index.html` / `pages/**` của portfolio** (LUẬT 0 / D11). Landing của Lab phải tự làm toàn bộ việc giới thiệu.
> **Ước lượng:** 4–5 ngày · **Tiền đề:** P01 exit gate xanh, `_states.html` đã được review và đồng ý.

---

## 1. Phạm vi

| Deliverable | Khuôn | Category | Stage bg |
|---|---|---|---|
| `labs/n-plus-one-query.html` + `scripts/labs/n-plus-one.js` | A — Request Inspector | `data` | `deep` |
| `labs/sql-injection-contact-form.html` + `scripts/labs/sql-injection.js` | B — Attacker Console | `security` | `void` |
| `labs/one-rule-five-places.html` + `scripts/labs/one-rule-five-places.js` | C — Change Propagation | `code-design` | `raised` |
| `labs/index.html` + `scripts/hub.js` — **landing**: hero, how-it-works + lab mini, browse-by-category, catalog, footer | — | — | — |
| Nav + footer riêng của Lab (trong `labs.css`) | — | — | — |
| `tools/check-contract.mjs` — triển khai thật | — | — | — |

**Component mới (8 instrument, §8.3 UI plan):** `TimingWaterfall`, `QueryLogStream`, `RowTable`, `StringBuilder`, `LeakTable`, `FileGraph`, `ScreenTiles`, `DiffColumns`.

**Không làm:** khuôn D/E/F/G, trang theo principle, `stamp.mjs`, OG image, prev/next, progress localStorage (đẩy sang P03).

**Thứ tự bắt buộc:** lab 1 (chuẩn tham chiếu) → `check-contract.mjs` → lab 2 → lab 3 → landing.
Lý do: viết `check-contract.mjs` sau lab 1 nghĩa là lab 2 và 3 được nó canh ngay từ dòng đầu, thay vì phải sửa về sau. Landing làm cuối vì nó cần 3 card thật và một lab đã chạy để nhúng.

---

## 2. Các bước thực thi

### Step 2.1 — Lab 1 `n-plus-one-query` (chuẩn tham chiếu cho 17 trang sau)

**Nội dung 8 khối** (plan cũ §4.1): symptom → situation → lab → under the hood → principle → trade-offs → from experience → carry it away.

| Vùng | Nội dung | Yêu cầu |
|---|---|---|
| ① Control | `Load candidates`; `ModeSwitch` naive(loop) ⇄ principled(join+batch); slider rows 10/100/500 | slider là `<input type="range">` native, 3 bước |
| ② Response | bảng render **dần**; tổng thời gian đếm lên | `RowTable` + counter `tabular-nums`; phải thấy nó *bò* |
| ③ Internals | query log cuộn, in từng dòng `SELECT * FROM companies WHERE id = 42`; naive 101 dòng, principled 2 dòng | `QueryLogStream` + `TimingWaterfall` |
| ④ Verdict | `101 queries · 3180ms` → `2 queries · 84ms` | mọi số từ `store.costs()`, **không literal** |

**Target:**
- **Break it yourself:** đẩy slider lên 500 ở naive → gần như treo. Đây là moment "ồ" của trang; nó phải nằm trong trần 4s thật (clock `speed`), nhưng *số mô phỏng* vẫn báo cáo trung thực.
- `ModelNote` công bố: `1 round-trip ≈ 0.8ms + 0.02ms/row, jitter ±12%, seed 20261024`.
- `provenance: "classic"` → `ProvenanceTag` hiện `Classic problem` ở hero. N+1 là vấn đề có tên gọi riêng trong ngành, nên `classic` là mức đúng — **không** dùng `field-report` (plan §3.3).

**Lý do làm lab này trước:** nó dùng cả 4 vùng ở mức đầy đủ nhất và là khuôn A — khuôn sẽ tái dùng nhiều nhất (3/18 trang). Sai ở đây thì sai 3 lần.

---

### Step 2.2 — `tools/check-contract.mjs` (triển khai thật)

**Kiểm tự động 5/10 điều stage contract (§7.1 UI plan):**

| Điều | Kiểm thế nào |
|---|---|
| 1 | parse HTML, tìm đủ 4 `data-zone` đúng tên |
| 2 | thứ tự xuất hiện trong DOM = control, response, internals, verdict |
| 4 | grep `scripts/labs/<id>.js` tìm **số literal** ngoài whitelist (`0`, `1`, `-1`, và số trong `spec.model`) → fail kèm số dòng |
| 7 | đếm khai báo màu mới trong CSS của stage → ≤ 2 hue |
| 8 | CSS stage scoped dưới `.stage--<id>` và ≤ 120 dòng (`wc -l`) |

**5 điều còn lại (3, 5, 6, 9, 10)** kiểm bằng tay — ghi rõ trong output tool để không ai tưởng pass tool là pass contract:

```text
contract: 3/3 pages pass automated checks (1,2,4,7,8)
manual still required: 3 (six states) 5 (360px) 6 (keyboard/SR) 9 (reset) 10 (ModelNote/CLS)
```

**Target:** dòng `manual still required` là **chủ ý thiết kế của tool**, không phải thiếu sót. Một tool im lặng về giới hạn của mình sẽ bị tin quá mức.

---

### Step 2.3 — Lab 2 `sql-injection-contact-form`

| Vùng | Nội dung |
|---|---|
| ① Control | input `email`; `ModeSwitch` string-concat ⇄ parameterized; 3 chip payload bấm-là-dán |
| ② Response | naive: trả **toàn bộ bảng users** (dữ liệu giả, `.invalid`); principled: `200 { matched: 0 }` |
| ③ Internals | **câu SQL cuối cùng được sinh ra**, highlight phần payload chèn vào — `StringBuilder` + `LeakTable` |
| ④ Verdict | `3 rows leaked (incl. password_hash)` → `0 rows · payload treated as literal` |

**Target & ràng buộc cứng:**
- **`SafetyLine` nằm trong stage, không nằm ở footer:** `This runs entirely in your browser. No server, no real data.` Người đọc thấy bảng users "rò" ra phải hiểu ngay đây là mô phỏng — nếu không, chính site của bạn trông như đang có một lỗ hổng thật, và đó là ấn tượng không sửa được bằng một dòng ở chân trang.
- Highlight payload bằng **`<span>` + textContent**, tuyệt đối không `innerHTML` (eslint rule P00 chặn; và đây là trang dạy đúng chuyện đó).
- `password_hash` trong seed phải là chuỗi rõ ràng vô nghĩa kiểu `$2b$fake$…` — không phải hash thật của bất kỳ chuỗi nào.
- Stage bg `void` + branch color `security` `#ff7b72` chỉ ở **khung**; signal color ở **ruột** (LUẬT 2a).
- `ModeSwitch` ở naive **không được đỏ** (LUẬT 3) — chỉ *hậu quả* (bảng rò) mới lên màu cảnh báo.

**Lý do làm lab này thứ hai:** nó là khuôn khác hẳn (không có timing, không có bảng lớn) → **phép thử thật cho câu hỏi "runtime có dùng chung được không"**. Nếu phải sửa `lab.js` ở đây, biết ngay từ lab thứ 2 thay vì lab thứ 8.

---

### Step 2.4 — Lab 3 `one-rule-five-places`

| Vùng | Nội dung |
|---|---|
| ① Control | input "VAT mới"; `ModeSwitch` duplicated ⇄ single-source; nút `Deploy` |
| ② Response | `ScreenTiles` — 5 màn nhỏ (cart, invoice, email, report, mobile). Duplicated: 4 đúng, **1 vẫn 8%** → nhãn đỏ `inconsistent` |
| ③ Internals | `FileGraph` — sơ đồ file, đường lan toả từ chỗ sửa, file bị sót nhấp nháy đỏ |
| ④ Verdict | `5 files to change · 1 missed · 1 silent money bug` → `1 file · 0 missed` |

**Target:**
- **Khối Trade-offs không được rỗng** (LUẬT 6b) và ở trang này nó là phần quan trọng nhất: *DRY sai chỗ sinh coupling*. Phải nói rõ: hai chỗ *trông* giống nhau nhưng thay đổi vì **lý do khác nhau** thì không phải duplicate — đó là hai domain rule. Đây chính là chỗ phân biệt junior/senior, và là lý do trang này đáng tồn tại.
- File bị sót chọn bằng `rng(seed)` → công bố seed, nên "ngẫu nhiên" vẫn lặp lại được.

---

### Step 2.5 — Landing: `labs/index.html` + `scripts/hub.js`

**Đây là deliverable khó nhất của P02**, và nó khó vì một lý do mới: Lab không còn được giới thiệu từ trang chủ portfolio (LUẬT 0), nên **landing phải tự thuyết phục một người lạ hoàn toàn**. Người vào đây từ Google hoặc từ một link được gửi, và không biết gì cả.

Năm khối, theo đúng thứ tự trên màn hình (plan §5.5):

| # | Khối | Yêu cầu |
|---|---|---|
| 1 | **Hero** | Wordmark `Principles Lab` + tagline `Flip the principle off. Watch the system answer.` + 1 câu nói rõ site là gì (dạy nguyên lý bằng demo chạy được, miễn phí, không cần đăng ký) + 3 số **tính từ `catalog.stats()`** |
| 2 | **How it works** | 3 bước + **một lab mini nhúng ngay tại đây** (1 toggle, 1 con số đổi), dùng đúng runtime + kernel component đã có — **không viết riêng** |
| 3 | **Browse by category** | 6 nhánh, mỗi nhánh một câu hỏi nó trả lời + số trang trong nhánh (từ catalog) |
| 4 | **Catalog** | Filter bar: chips category (6) / difficulty (3) / blast-radius (3), bằng `data-*` + `classList`. Card grid: **symptom** làm tiêu đề (không phải tên nguyên lý!), category pill, cặp số before/after, **`ProvenanceTag`**. Sort mặc định `blast-radius` giảm dần. `Surprise me` |
| 5 | **Footer** | Dòng `Every number on this site is computed by a simulation that runs in your browser` + link changelog + `Clear my progress` + đúng dòng **`Built and maintained by Phuc`** — **text thuần, không `<a>`, không chức danh** (plan §1.1, đã chốt) |

**5 quyết định UI chốt ở đây (§12.2 UI plan + plan §5.5):**

1. **Số trên hero tính từ catalog, không hardcode.** Ở P02 mới có 3 trang → hiện `3 problems · 3 of 6 categories · every one runnable`. Hiện "18" lúc này là nói sai **ngay ở dòng đầu tiên người đọc gặp**; và chữ "runnable" mới là chỗ mạnh, không phải con số.
2. Card hiện **symptom**, không hiện tên nguyên lý. (Đã chốt ở plan cũ; nhắc lại vì đây là chỗ dễ làm sai nhất lúc code.)
3. Sort mặc định theo blast-radius giảm dần.
4. Filter không ra kết quả → hiện **câu gợi ý bỏ filter nào**, không hiện "0 results".
5. **Landing và catalog nằm cùng một trang** cho tới khi vượt 12 entry, rồi tách `/labs/catalog.html` (plan §5.5). Dưới 12, tách ra chỉ thêm một cú click giữa người đọc và nội dung.

**Trần:** `hub.js` ≤ 6 KB; landing **chỉ nạp thêm code của lab mini** (lazy, khi khối 2 vào khung nhìn), không nạp lab nào khác (budget check canh).

**Lab mini nhúng ở khối 2 là thứ thay thế cho section giới thiệu trên trang chủ portfolio.** Nó làm cùng một việc — thuyết phục người ta rằng site này có cơ chế thật — nhưng làm bằng cách cho bấm thử, không bằng cách mô tả. Rẻ hơn và mạnh hơn.

---

### Step 2.6 — Xác nhận portfolio KHÔNG bị chạm

Bản trước của phase này có một step "nối vào `index.html`" (thêm nav link + section 3 card). **Step đó đã bị loại bỏ** theo LUẬT 0: Lab là site độc lập, không được giới thiệu từ portfolio.

Việc của step này giờ là **xác nhận điều ngược lại**:

```bash
git diff --stat main -- index.html pages/ source/styles.css source/case-study.css
# ky vong: khong co gi (empty output)

npm test -- --test-name-pattern isolation
# ky vong: 4+ case pass
```

- [ ] `git diff` trên 4 đường dẫn portfolio: **rỗng**.
- [ ] `tests/isolation.test.mjs` pass sau khi đã có 3 trang lesson + landing thật (lần đầu test này chạy trên file thật — trước đó nó chỉ pass vì chưa có gì).
- [ ] Mở `/` (portfolio) bằng mắt: **không thấy dấu vết nào** của Lab.
- [ ] Lighthouse `index.html` không đổi so với trước P02 (phải không đổi — vì không sửa gì; nếu đổi thì có thứ gì đã lọt vào).

---

## 3. Mock test bắt buộc (G4)

| File test | Case tối thiểu | Canh gì |
|---|---|---|
| `tests/labs/n-plus-one.test.mjs` | naive với `rows=n` → **đúng `n+1` query**; principled → đúng 2; tổng `ms` naive > principled ≥ 10×; `rows=500` không vượt ring buffer logger; metrics đều truy nguyên về `costs()` | bài học của trang, LUẬT 7a |
| `tests/labs/sql-injection.test.mjs` | naive + payload kết thúc-câu-lệnh → `rows > 0` và SQL sinh ra **chứa** payload; principled cùng payload → `rows === 0` và payload nằm trong tham số (không trong câu lệnh); mọi email seed kết thúc `.invalid`; `password_hash` khớp mẫu fake | bài học + an toàn uy tín |
| `tests/labs/one-rule-five-places.test.mjs` | duplicated → đúng 1/5 screen còn giá cũ, và screen đó xác định theo seed; single-source → 5/5 đúng; verdict đếm `filesChanged`/`missed` từ model | bài học |
| `tests/hub.test.mjs` (linkedom) | `stats()` khớp số entry (3, không phải 18); filter 1 chip → đúng tập card; 2 chip khác trục → giao; filter rỗng kết quả → hiện gợi ý **không** hiện "0 results"; sort mặc định blast-radius giảm dần; `Surprise me` chỉ chọn trong slug tồn tại; **mỗi card có `ProvenanceTag` với 1 trong 3 giá trị** | quyết định 1–5 |
| `tests/landing.test.mjs` (linkedom) | đủ 5 khối theo `data-block`; hero có wordmark + tagline + 3 số từ `stats()`; khối 2 có điểm mount cho **lab mini**; browse-by-category liệt kê đủ 6 nhánh với số đếm đúng; footer có dòng safety + link changelog; **không link nào ra ngoài `/labs/`** | plan §5.5, LUẬT 0 |
| `tests/attribution.test.mjs` | footer của **mọi** trang Lab (landing + 3 lesson) chứa đúng chuỗi `Built and maintained by Phuc`; **không `<a>` nào bọc nó**; chuỗi `Phuc` **không xuất hiện** trong nav, hero, hay khối ⑦; không có chức danh / tên đầy đủ / `mailto:` ở đâu trong `labs/**` | plan §1.1 (đã chốt) |
| `tests/contract.test.mjs` | chạy `check-contract.mjs` qua API trên **cả 3 trang** → pass; cố tình thêm số literal vào một lab → fail đúng dòng | điều 1,2,4,7,8 |
| `tests/pages.test.mjs` | mỗi trang có đủ 8 khối theo `data-block`; khối Trade-offs **không rỗng** (LUẬT 6b); có `<noscript>`; có `ModelNote`; có **`ProvenanceTag`** ở hero; trang security có `SafetyLine`; nav + footer là của Lab; mọi link nội bộ trỏ tới file tồn tại | 6b, 7b, điều 10, plan §3.3 |
| `tests/isolation.test.mjs` (từ P00/P01) | **lần đầu chạy trên file thật**: 3 trang lesson + landing không link ra ngoài, không nạp CSS portfolio; `index.html` + `pages/**` không nhắc `labs/` | **LUẬT 0** |

**Bổ sung regression:** chạy lại toàn bộ test P01 — đặc biệt case không-cache của `store`. Ba lab mới là lần đầu store bị dùng thật; nếu có ai "tối ưu" nó để lab nhanh hơn, test đó là chỗ phát hiện.

---

## 4. Self-check

### Cổng tự động

```bash
npm run typecheck
npm run lint
npm test                   # 9 file test moi + regression P01
npm run check:budget       # hub.js <= 6KB; moi trang lesson: runtime + 1 lab < 60KB
git diff --stat main -- index.html pages/ source/styles.css source/case-study.css   # phai rong
npm run check:contract     # 3/3 trang pass dieu 1,2,4,7,8
npm run build
wc -l source/*.css scripts/runtime/lab.js
```

### Checklist tay — mỗi lab chạy đủ, không rút gọn

Dùng [`_self-check-template.md`](_self-check-template.md) cho **từng** lab (3 bản).

Ở cấp phase:

- [ ] **Bài test người lạ (tiêu chí duy nhất thật sự quan trọng của P02):** 2 người không biết dự án, mở **link landing** (không phải link trang lesson), và **tự tìm được một trang rồi bấm ra verdict trong 90 giây** mà không cần bạn giải thích. Ghi lại họ bấm sai ở đâu — đó là danh sách việc sửa, không phải phản hồi để an ủi.
  - Phải test **từ landing**, vì landing nay là cửa vào duy nhất của site. Nếu họ hiểu được trang lesson nhưng không hiểu landing thì P02 **chưa xong** — người thật sẽ vào bằng landing.
  - Câu hỏi kiểm tra sau 10 giây đầu: *"site này là gì?"* Nếu họ trả lời bằng cách nhắc tới một người (tác giả) thay vì một việc (học nguyên lý qua demo), landing đang gửi sai tín hiệu.
- [ ] **Ba stage trông khác hẳn nhau:** chụp 3 ảnh đặt cạnh nhau, **không ai nói "cùng một template"**.
- [ ] **Nhưng tắt CSS thì cả ba đọc theo thứ tự ①②③④.** (Hai ô này cùng pass mới là bằng chứng mô hình 3 tầng đúng.)
- [ ] `compare` hoạt động trên cả 3 lab: chạy 2 mode → Verdict tự ghép.
- [ ] Lab SQL injection: **không chỗ nào** khiến người đọc nghĩ site có lỗ hổng thật (nhờ 1 người ngoài đọc và nói lại cảm nhận).
- [ ] M1–M7 pass trên cả 3 trang + landing.
- [ ] Footer mọi trang Lab: đúng `Built and maintained by Phuc`, text thuần, không link, không chức danh.
- [ ] **Lab mini trên landing** chạy đủ 6 trạng thái (nó là lab thật, không được miễn trừ contract).
- [ ] Deep-link `?mode=&rows=` khôi phục state — **nếu kịp; nếu không, đẩy sang P03 và ghi vào decisions.log.**

### Kiểm tiêu cực

| # | Phá | Kỳ vọng |
|---|---|---|
| 1 | Hardcode `3180` vào verdict lab 1 | `check:contract` fail kèm số dòng |
| 2 | Xoá `SafetyLine` khỏi trang security | `pages.test.mjs` fail |
| 3 | Đổi catalog còn 1 entry | hero landing hiện `1 problem · 1 of 6` (không hardcode) |
| 4 | `el.innerHTML = sql` trong lab 2 | `lint` fail |
| 5 | Xoá nội dung khối Trade-offs của lab 3 | `pages.test.mjs` fail (LUẬT 6b) |
| 6 | Thêm `<a href="../index.html">Portfolio</a>` vào footer một trang lesson | `isolation.test.mjs` fail (LUẬT 0) |
| 7 | Bỏ `provenance` của một entry catalog | `catalog.test.mjs` fail — không có trạng thái "không nhãn" |
| 8 | Biến dòng attribution thành link (`<a href="...">Built and maintained by Phuc</a>`) | `attribution.test.mjs` fail — chữ ký không được là cửa sau (plan §1.1) |

---

## 5. Exit gate — tick hết mới sang P03

- [ ] Mục 4 xanh toàn bộ (tự động + 3 bản checklist tay + tiêu cực).
- [ ] **Bài test người lạ pass với 2 người.** Không pass thì không sang P03 — thêm trang không sửa được vấn đề này.
- [ ] 3 ảnh stage cạnh nhau: khác hình, cùng nhịp đọc. Lưu `docs/implement/snapshots/p02/`.
- [ ] **Câu hỏi quyết định kiến trúc: có phải sửa `lab.js` để làm được 3 stage này không?**
  - Không → runtime đúng, sang P03.
  - Có → **dừng, sửa runtime trước khi viết lab thứ 4.** Ghi vào `decisions.log` đã sửa gì và vì sao.
- [ ] **`git diff` trên `index.html`, `pages/`, `source/styles.css`, `source/case-study.css`: rỗng.** Portfolio không bị chạm (Step 2.6).
- [ ] `tests/isolation.test.mjs` pass trên file thật.
- [ ] Landing pass bài test người lạ **với tư cách cửa vào**, không chỉ trang lesson.
- [ ] Commit `feat(p02): mvp 3 labs + lab landing`.

---

## 6. Tripwire

| Dấu hiệu | Hành động |
|---|---|
| **Tới lab thứ 3 mà phải sửa `lab.js`** để làm được stage | Thiết kế runtime sai. Dừng, sửa runtime, **rồi mới** viết lab 4. (Cả plan cũ §7 và UI plan §12.2 đều nêu; giữ nguyên vì nó đúng) |
| Một lab mất > 1.5 ngày | Hoặc nội dung chưa đủ rõ (quay lại viết symptom + con số trước), hoặc instrument đang được thiết kế quá rộng. Cắt về đúng 1 thứ dạy học |
| `lab.css` > 18 KB | Có pattern chỉ dùng 1 lần bị nhấc lên sớm → đẩy về stage CSS (LUẬT 10: rule of two cho hình) |
| Muốn copy trang thứ 4, 5 ngay trong P02 | Không. P02 chốt ở 3 trang để kiểm chứng runtime. Thêm trang sớm = nhân bản một thiết kế chưa được xác nhận |
| Cảm giác "viết nội dung chậm hơn viết code" | Bình thường và đúng. Nội dung là phần tạo giá trị; nếu nó nhanh hơn code thì nhiều khả năng đang viết sáo rỗng |
