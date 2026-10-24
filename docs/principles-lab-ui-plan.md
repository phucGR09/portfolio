# Principles Lab — UI Strategy & Design System

> Tài liệu **thi hành** (execution spec) cho phần giao diện của Principles Lab.
> Tài liệu nguồn: [`principles-lab-plan.md`](./principles-lab-plan.md) — đã chốt user flow, insight, nội dung.
> Tài liệu này chốt: **stack, luật thiết kế, hệ màu theo nhánh, cách trình bày dữ liệu cho từng lab, cấu trúc file, cách lưu state/cache/key, và chi tiết từng phase.**
> Vai trò của mình ở đây là **supervisor** — mình *chốt* chứ không *gợi ý*. Chỗ nào mình đổi so với plan cũ đều ghi rõ ở §15.
> Ngày: 2026-10-24. Trạng thái: spec đã chốt, sẵn sàng code P0.
>
> **Cập nhật định vị (2026-10-24):** Principles Lab là **một site học tập độc lập**, không phải khu vực của portfolio. Xem [`principles-lab-plan.md §1.1`](./principles-lab-plan.md) để biết ranh giới đầy đủ. Tài liệu này đã được rà soát và bỏ toàn bộ phần phụ thuộc vào portfolio: badge `Seen in production`, nav dùng chung, token CSS dùng chung, và mọi lý lẽ dựa trên người đọc là nhà tuyển dụng. Những chỗ đó được ghi trong §15 (hàng 13–18).

---

## 0. Cách đọc tài liệu này

| Bạn là | Đọc mục |
|---|---|
| Sắp code P0 hôm nay | §1 → §2 → §3 → §7 → §12.1 |
| Đang viết một trang lab mới | §7 (hợp đồng) → §9 (dạng dữ liệu) → §13 (luật) → §14 (rubric) |
| Muốn hiểu *vì sao* chọn thế | §1, §15 |
| Lo về state / cache / localStorage | §10 → §11 |

Ký hiệu dùng xuyên tài liệu:

- **[LUẬT]** — bất biến. Vi phạm là reject khi review.
- **[TỰ DO]** — mỗi lab tự quyết, không cần xin phép.
- **[TRIPWIRE]** — dấu hiệu một quyết định cũ đã hết đúng, phải mở lại bàn.

---

## 1. Tuyên ngôn thiết kế: tầng nào khoá, tầng nào mở

### 1.1. Mâu thuẫn phải giải trước khi vẽ bất cứ thứ gì

Bạn yêu cầu hai thứ nghe như trái nhau:

1. *"Không được giống web app thường. Mỗi lab có layout riêng, component riêng, cách hiện dữ liệu riêng theo đúng hành vi thật của vấn đề."*
2. Nhưng plan cũ (§5.1) chốt: *"Giữ 4 vùng ở đúng một chỗ trên mọi trang là quyết định UX quan trọng nhất của site."*

Làm theo (1) tuyệt đối → 18 cái đồ chơi rời rạc, người đọc phải học lại cách dùng ở mỗi trang, site mất hết độ tin cậy. Một người đang dạy junior sẽ không gửi link lần thứ hai, vì mỗi trang lại phải giải thích lại cách bấm.

Làm theo (2) tuyệt đối → race condition bị nhét vào cái khung dành cho N+1 query. Mà race condition **cần** timeline hai luồng song song; N+1 **cần** waterfall dọc. Ép chung khung là ép sai hình, và lúc đó lab không còn phản ánh hành vi thật của vấn đề nữa — tức là mất đúng lý do tồn tại của site.

### 1.2. Quyết định: khoá *ngữ nghĩa*, mở *hình học*

> **Cái bất biến không phải layout. Cái bất biến là hợp đồng đọc.**
> Người đọc luôn biết *thứ tự* họ gặp thông tin, *ý nghĩa* của mỗi màu, *đơn vị* của mỗi con số, và *trạng thái* nào đang hiển thị.
> Còn **hình dạng của cái máy mô phỏng thì mỗi vấn đề một kiểu** — vì mỗi vấn đề méo theo một chiều khác nhau.

Câu để dán lên tường:

**"Tự do ở tầng mô phỏng. Kỷ luật ở tầng đọc."**

### 1.3. Mô hình 3 tầng (Chassis / Shell / Stage)

```text
┌─────────────────────────────────────────────────────────────┐
│  TẦNG 0 — CHASSIS (khung gầm)                      [LUẬT]   │
│  token màu nền, type scale, spacing, focus ring,            │
│  motion token, ngôn ngữ trạng thái, a11y baseline           │
│  → KHÔNG BAO GIỜ override theo lab                          │
├─────────────────────────────────────────────────────────────┤
│  TẦNG 1 — SHELL (vỏ trang lesson)            [LUẬT thứ tự]  │
│  8 khối nội dung, thứ tự đọc, metric strip, prev/next,      │
│  nav, footer, màu nhánh (--accent)                          │
│  → thứ tự khoá cứng; mật độ và chiều cao thì linh hoạt      │
├─────────────────────────────────────────────────────────────┤
│  TẦNG 2 — STAGE (sân khấu lab)                     [TỰ DO]  │
│  layout riêng, grid riêng, component riêng, palette riêng,   │
│  nền riêng, animation riêng, nhịp riêng                      │
│  → tự do HOÀN TOÀN, miễn qua được Stage Contract (§7)       │
└─────────────────────────────────────────────────────────────┘
```

Cụ thể hoá bằng CSS:

```css
/* Tầng 0 — không lab nào được chạm */
:root { --navy:#0b192f; --heading:#ccd6f6; --line:rgba(136,146,176,.2); /* … */ }
```
```html
<!-- Tầng 1 — khai báo inline trên <body> của trang lesson -->
<body style="--accent:#64ffda; --stage-bg:#0a1528">
```
```css
/* Tầng 2 — mọi CSS riêng của lab sống dưới đúng một prefix */
.stage--n-plus-one { /* grid 3 cột, waterfall dọc, … */ }
.stage--race-track { /* 2 làn song song, timeline ngang, … */ }
```

### 1.4. "4 vùng" được định nghĩa lại

Plan cũ hiểu 4 vùng là **4 ô trên màn hình**. Từ nay 4 vùng là **4 vai trò ngữ nghĩa**:

| Vùng | Vai trò (khoá) | Hình học (mở) |
|---|---|---|
| ① Control | *Tôi vừa làm gì?* | Thanh ngang trên, cột trái, console dưới, hay 2 cụm ở 2 làn — tuỳ lab |
| ② Response | *Hệ thống trả lời gì?* | Bảng, màn hình app giả, JSON viewer, sổ giao dịch |
| ③ Internals | *Bên trong xảy ra gì?* | Log stream, waterfall, sơ đồ file, timeline, EXPLAIN box |
| ④ Verdict | *Số nào đổi?* | Strip dưới, badge góc, hay overlay sau khi chạy xong |

**[LUẬT 5]** Mỗi vùng tồn tại dưới dạng landmark có `data-zone="control|response|internals|verdict"`, và **thứ tự trong DOM luôn là ①②③④** — bất kể CSS xếp chúng thành hình gì. Sắp xếp lại bằng `grid-area`, **không** bằng thứ tự markup.

Vì sao điều này đủ: thứ tự DOM = thứ tự screen reader = thứ tự tab = thứ tự xếp dọc trên mobile = thứ tự khi CSS fail. Người đọc vẫn gặp thông tin theo đúng một nhịp ở cả 18 trang, trong khi mắt họ thấy 18 cái máy khác nhau. Đó chính xác là điều bạn muốn.

### 1.5. Cái gì làm 18 lab khác hình vẫn là một site

Bốn sợi chỉ xuyên suốt — và **chỉ** bốn sợi này:

1. **Nền luôn thuộc họ navy.** Không lab nào có nền sáng, nền trắng, nền tím. (§3.1)
2. **Màu luôn là dữ liệu.** Xanh/vàng/đỏ ở trang nào cũng nghĩa đúng một thứ. (§3.3)
3. **Mọi con số đo được viết cùng một kiểu**: mono, tabular-nums, luôn có đơn vị. (§4.3)
4. **Sáu trạng thái bắt buộc** trông giống nhau ở mọi lab: `idle / running / settled / compare / error / noscript`. (§7.2)

Bốn thứ đó là toàn bộ "thương hiệu" của Lab. Ngoài bốn thứ đó, **bạn được vẽ lại từ đầu.**

---

## 2. Stack — chốt

### 2.1. Quyết định

| Hạng mục | Chốt | Lý do ngắn |
|---|---|---|
| Build step | **Không** (tới hết P2) | Lab là nhiều widget độc lập, không phải SPA. Thêm toolchain là đúng cái YAGNI site đang dạy |
| JS | **Vanilla ES modules**, `<script type="module">` | Chạy trực tiếp trên GitHub Pages, lazy-load bằng `import()` native |
| Framework | **Không** | Không có shared client state giữa các trang, không routing. Không cần |
| CSS | **CSS thuần**, 4 file + stage scope | Token đã có sẵn trong repo; preprocessor không giải quyết vấn đề nào đang tồn tại |
| Thư viện chart | **Không** — inline SVG viết tay | Chart ở đây là *instrument*, không phải báo cáo: cần kiểm soát từng pixel, cần streaming, cần an toàn trên nền tối |
| Syntax highlight | **Không** | Mỗi lab chỉ cần tô ≤ 2 loại token. Nhúng Prism (~15KB) để tô 1 đoạn SQL là phản nguyên lý |
| Font | **Inter** (đã có) + **mono hệ thống** | Mono không tải thêm byte nào — xem §4.1 |
| Icon | **inline SVG, 100%** | Site Lab không có logo stack để hiện (đó là nhu cầu của portfolio, không phải của Lab). Icon chức năng là phần của instrument, không được phụ thuộc mạng |
| CSS của portfolio | **Không nạp** (`styles.css`, `case-study.css`) | Hai site độc lập (plan §1.1, §6.1). Lab khai token riêng trong `principles.css` |
| Service Worker | **Không, tới hết P3** | SW stale trên site tĩnh = cơn đau đầu không có ai support. Xem §11.6 |
| Analytics | **Không mặc định** | Nếu thêm phải ghi rõ trên trang. Site dạy least-privilege thì không được âm thầm theo dõi |

### 2.2. Ngân sách — ràng buộc tự đặt, kiểm được bằng `ls -l`

| Mục | Trần | Ghi chú |
|---|---|---|
| `source/principles.css` | 14 KB | token riêng của Lab + landing + shell lesson |
| `source/lab.css` | 18 KB | kernel 4 vùng + component dùng ≥ 2 lần |
| CSS riêng mỗi stage | **120 dòng** | vượt là dấu hiệu pattern nên lên `lab.css` |
| `scripts/runtime/*` tổng | 24 KB | store + server + clock + logger + lab |
| JS mỗi lab | 10 KB | chỉ chứa phần *khác biệt* |
| JS trang landing | 6 KB | filter + localStorage; chỉ nạp thêm code của **lab mini** nhúng ở khối "How it works" (plan §5.5) |
| Tổng JS một trang lesson | **< 60 KB** | runtime + 1 lab, lazy |
| Request ngoài trên trang lesson | **2** | Google Fonts css + woff2. Hết |

**[TRIPWIRE]** `scripts/runtime/lab.js` > 400 dòng, hoặc xuất hiện nhu cầu routing / template engine / reactive store → **dừng**, đọc lại §2.1 và §15.6 trước khi viết tiếp.

### 2.3. Vấn đề 18 file HTML — nói thẳng ngay bây giờ

Plan cũ chốt "copy `_template.html` cho trang mới". Điều này **sẽ hỏng ở khoảng trang thứ 6**: lúc đó sửa nav, sửa footer, sửa metric strip phải sửa 6 file — đúng cái `one-rule-five-places` mà site đang dạy. Site tự vi phạm bài học của chính nó là rủi ro uy tín lớn nhất của dự án này.

Chốt lộ trình:

- **P0 → P1 (3 trang):** copy tay. Đúng, cố ý, và ghi lý do: 3 chỗ sửa chưa đáng để build công cụ. *Reversible decision.*
- **[TRIPWIRE] Khi tạo trang thứ 6:** dừng, viết `tools/stamp.mjs` (~60 dòng Node, chạy tay) nhận `catalog.js` + partial nội dung → sinh HTML hoàn chỉnh. **Commit cả file HTML sinh ra** → GitHub Pages vẫn tĩnh, deploy vẫn không có build step.
- Việc này được **ghi thành changelog** và dẫn link ngay trên trang `build-it-for-the-future`. Site của bạn sẽ có một dòng kiểu: *"Chúng tôi trì hoãn cái generator này đúng tới trang thứ 6. Đây là commit đó."* Không blog nào có bằng chứng kiểu này.

---

## 3. Hệ màu — "màu nhánh chính" và tự do màu của từng lab

Mục bạn hỏi kỹ nhất, nên đi chi tiết nhất. Hệ màu chia **4 tầng**, mỗi tầng một quyền khác nhau.

### 3.1. Tầng A — Chassis palette (bất biến, không lab nào được chạm)

Khai báo **trong `source/principles.css`** — đây là bộ token **của riêng site Lab**, không import từ CSS của portfolio (plan §6.1 quyết định 2). Không lab nào được thêm hoặc sửa.

Giá trị dưới đây **trùng** với palette portfolio đang dùng, và đó là cố ý: đây là một nền tối đã được kiểm contrast, và instrument của Lab được thiết kế quanh signal color trên nền tối. **Trùng giá trị không phải là chung nguồn.** Lab đổi `--navy` sau này không được ảnh hưởng portfolio, và ngược lại — hai site thay đổi vì hai lý do khác nhau, nên chúng là hai nguồn (xem trade-off ở `one-rule-five-places`).

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--navy` | `#0b192f` | nền trang, luôn luôn |
| `--navy-light` | `#112240` | section nhấn, card nổi |
| `--slate` | `#8892b0` | body text, nhãn phụ |
| `--slate-light` | `#a8b2d1` | lead paragraph, text nhấn nhẹ |
| `--heading` | `#ccd6f6` | tiêu đề, số liệu lớn |
| `--line` | `rgba(136,146,176,.2)` | mọi đường kẻ, viền panel |
| `--mint` | `#64ffda` | màu hệ thống (focus ring, skip-link) |

**[LUẬT 1]** Nền trang lesson và nền landing **luôn** là `--navy`. Lab được đổi nền *của sân khấu*, không được đổi nền *của trang*. Đây là sợi chỉ thị giác duy nhất không thương lượng — nó là thứ làm 18 lab khác hình vẫn được nhận ra là **cùng một site**, khi người đọc không có nav nào khác để dựa vào.

### 3.2. Tầng B — Branch color (màu nhánh): 6 nhánh, mỗi category một màu

Khai báo **inline trên `<body>`** của mỗi trang lesson. Không tạo class, không tạo file CSS theo category — 6 nhánh × mỗi nhánh một file là 6 chỗ phải sửa khi đổi một token.

| # | Category | Slug | `--accent` | Hue | Contrast / navy | Câu hỏi của nhánh |
|---|---|---|---|---|---|---|
| 1 | Data & Database | `data` | `#64ffda` | 168 | 11.9:1 | Dữ liệu được hỏi và lưu thế nào? |
| 2 | Security & Trust | `security` | `#ff7b72` | 4 | 6.9:1 | Chuyện gì xảy ra khi có người cố phá? |
| 3 | Code Design | `code-design` | `#d2a8ff` | 272 | 9.0:1 | Code này 6 tháng sau sửa được không? |
| 4 | API & Contracts | `api` | `#79c0ff` | 210 | 9.1:1 | Hai hệ thống nói chuyện ra sao? |
| 5 | Performance & Scale | `performance` | `#ffa657` | 28 | 9.1:1 | Lưu lượng ×100 thì gãy ở đâu? |
| 6 | Reliability & Ops | `reliability` | **`#b5e853`** | 80 | 12.3:1 | Nó hỏng lúc 2h sáng, bạn biết gì? |

**Mình đổi một màu so với plan cũ:** Reliability từ `#a5d6ff` → `#b5e853`. Lý do: `#a5d6ff` và `#79c0ff` (API) cách nhau ~15° hue và cùng là xanh nhạt — đặt hai pill cạnh nhau trong catalog thì không ai phân biệt được, nhánh mất chức năng nhận diện. `#b5e853` lấp đúng khoảng trống lớn nhất trên vòng màu (28 → 168). Tất cả 6 màu đều đạt ≥ 4.5:1 trên navy, đã tính tay.

Cách dùng branch color — **[LUẬT 2a]** branch color chỉ xuất hiện trên **khung**, không vào **ruột**:

```text
ĐƯỢC                                  KHÔNG ĐƯỢC
• eyebrow / section-label             • tô một hàng dữ liệu
• viền trái khối Verdict              • đánh dấu lỗi / thành công
• pill category, dot prev/next        • fill một cột biểu đồ
• focus ring, link hover              • highlight payload injection
• 1 chữ số lớn trong metric strip     • trạng thái bất kỳ của instrument
```

Lý do: trong một lab, **màu là dữ liệu** (§3.3). Nếu branch color cũng tham gia mã hoá dữ liệu thì cùng một màu mang hai nghĩa ở hai trang, và người đọc phải học lại bảng màu mỗi lần sang trang. Branch color ở ngoài khung, signal color ở trong ruột — xung đột tự hết.

Phái sinh từ `--accent`, khai báo một lần trong `principles.css`:

```css
body {
  --accent-soft: color-mix(in srgb, var(--accent) 12%, transparent);
  --accent-line: color-mix(in srgb, var(--accent) 38%, transparent);
  --accent-ink:  var(--navy);  /* chữ trên nền accent đặc */
}
```

### 3.3. Tầng C — Signal set (ngữ nghĩa, dùng chung toàn site, bất biến)

Đây là **bảng màu thật của các lab**. Sáu màu, nghĩa cố định ở cả 18 trang.

| Token | Giá trị | Contrast | Nghĩa duy nhất | Glyph kèm |
|---|---|---|---|---|
| `--sig-ok` | `#3fb950` | 6.9:1 | đúng kỳ vọng / an toàn / cache hit / đúng 1 lần | `✓` |
| `--sig-warn` | `#d29922` | 7.0:1 | suy giảm / chậm / retry / xấp xỉ | `!` |
| `--sig-bad` | `#f85149` | 5.3:1 | rò rỉ / fail / mất tiền / bị ghi đè | `✕` |
| `--sig-info` | `#58a6ff` | 7.0:1 | trace trung tính, log thường | `·` |
| `--sig-ghost` | `rgba(136,146,176,.45)` | — | trơ / bị skip / chưa chạy / lấy từ cache | `○` |
| `--sig-focus` | `#ffffff` | 15:1 | *dòng đang xảy ra ngay lúc này* | viền 1px |

**[LUẬT 2b] Không bao giờ dùng màu một mình.** Mọi signal đi kèm **một trong ba**: glyph, vị trí (cột riêng), hoặc hình dạng (gạch liền / gạch đứt). Người mù màu đỏ-xanh chiếm ~8% nam giới; trong một site mà toàn bộ thông điệp nằm ở chỗ "đỏ = mất tiền", bỏ qua điều này là tự huỷ nửa đối tượng người đọc.

**[LUẬT 3] Naive KHÔNG mặc định đỏ.** Đây là quyết định mình coi là quan trọng nhất của cả hệ màu.

```text
SAI                                       ĐÚNG
┌─ Naive (đỏ) ─┬─ Principled (xanh) ─┐    ┌─ Naive ──┬─ Principled ─┐  ← cả hai slate
│  chế độ xấu  │   chế độ tốt        │    │          │              │
└──────────────┴─────────────────────┘    └──────────┴──────────────┘
Người đọc học: "đỏ là cái nút sai"         rồi HẬU QUẢ mới sáng đỏ:
                                           "3 rows leaked ✕"  ← đỏ ở ĐÂY
```

Chế độ `Naive` được vẽ bằng **slate trung tính, trạng thái "chưa bật đèn"**. Chỉ *hậu quả* mới lên màu signal. Lý do: nếu nút Naive đã đỏ từ trước khi bấm, người đọc học được "đỏ = lựa chọn sai" — một bài học vô nghĩa, họ biết sẵn rồi. Mục tiêu dạy học là để họ **đọc được mức thiệt hại**, không phải nhận ra cái nút nào bị gắn nhãn xấu. Giữ Naive trung tính thì khoảnh khắc đỏ bật lên mới có sức nặng.

### 3.4. Tầng D — Stage palette (màu sân khấu) — [TỰ DO, có giới hạn]

Mỗi lab được:

**[TỰ DO]** chọn `--stage-bg` trong dải navy hẹp — để các instrument *cảm giác* như những cái máy khác nhau:

| Tên | Giá trị | Cảm giác | Dùng cho |
|---|---|---|---|
| `deep` | `#0a1528` | sâu, phía server/DB | N+1, index, transaction, pagination |
| `raised` | `#0d1c34` | nổi, phía app/UI | 5 màn hình VAT, client breaking, complexity meter |
| `void` | `#07101f` | gần đen, phía kẻ tấn công | SQL injection, IDOR, JWT, API key |
| `ledger` | `#0b1b2b` | lệch lạnh, sổ sách | double-charge, ledger, idempotency |

Bốn giá trị này không chọn theo cảm giác: cả bốn đều nằm trong dải **−1 đến −4 bậc sáng** so với `--navy`, nên instrument nổi lên mà không phá LUẬT 1, và cả bốn đã kiểm contrast với toàn bộ signal set. Lab chọn một trong bốn, **không tự pha giá trị thứ năm**.

**[TỰ DO]** thêm **tối đa 2 hue mới** ngoài signal set, và **chỉ khi** vấn đề thật sự có chiều dữ liệu mà signal set không mã hoá nổi. Ví dụ hợp lệ: Race Track cần phân biệt **Client A vs Client B** — đó là *identity*, không phải *trạng thái*, nên signal set không dùng được. Cấp 2 hue identity: `--id-a:#7ee787`, `--id-b:#d2a8ff`.

**[LUẬT 8]** Vượt 2 hue → reject. Lý do: từ 3 hue trở lên trong một panel, người đọc không giữ nổi bảng màu trong đầu và mọi thứ biến thành trang trí. Nếu thật sự cần 4 chiều dữ liệu → vấn đề bạn chọn **quá lớn cho một lab**, chẻ đôi nó.

### 3.5. Bảng màu đầy đủ cho 6 lab đầu — ví dụ tham chiếu

| Lab | Nhánh `--accent` | `--stage-bg` | Hue phụ | Màu mã hoá cái gì |
|---|---|---|---|---|
| `n-plus-one-query` | `#64ffda` data | `deep` | — | `info` mỗi dòng query log · `warn` khi tổng ms > 1000 · `ghost` dòng bảng chưa render · `focus` query đang chạy |
| `sql-injection-contact-form` | `#ff7b72` security | `void` | — | `bad` đoạn payload mọc thêm trong câu SQL + mỗi dòng rò rỉ · `ok` khi payload bị coi là literal · `ghost` phần SQL gốc không đổi |
| `one-rule-five-places` | `#d2a8ff` code-design | `raised` | — | `ok` 4 màn đúng · `bad` 1 màn còn 8% · `focus` đường lan toả đang chạy · `ghost` file không bị ảnh hưởng |
| `no-index-no-mercy` | `#ffa657` performance | `deep` | — | `warn` thanh số dòng quét · `ok` index scan · `bad` khi INSERT chậm đi (chiều ngược) |
| `double-click-double-charge` | `#b5e853` reliability | `ledger` | `--id-a`, `--id-b` | `id-a/id-b` hai request song song · `bad` giao dịch trùng · `ok` `replayed:true` · `warn` cửa sổ race |
| `build-it-for-the-future` | `#d2a8ff` code-design | `raised` | — | `ghost` code chưa ai cần · `warn` branch tăng · `ok` 1 file 1 format |

Đọc cột cuối theo hàng dọc: không ô nào nói "màu để cho đẹp". Đó là tiêu chuẩn.

### 3.6. Light mode?

**Chốt: không có light mode, tới hết P4.** Lý do: instrument (log stream, waterfall, EXPLAIN box) được thiết kế quanh signal color trên nền tối — chúng mô phỏng terminal và database console, và đó là môi trường tối; làm light mode tử tế nghĩa là định nghĩa lại cả 6 signal + 6 branch + 4 stage-bg = nhân đôi diện tích bảo trì cho một nhu cầu chưa ai yêu cầu. Đây là một ví dụ YAGNI mà site trích dẫn được chính mình.

**Bắt buộc làm:** `color-scheme: dark` trên `:root`, để scrollbar, form control và `<details>` marker của browser không bị trắng lệch tông.

---

## 4. Chữ, số và "giọng của dụng cụ đo"

### 4.1. Hai họ chữ, hai nhiệm vụ

| Họ | Stack | Nhiệm vụ |
|---|---|---|
| Sans | `Inter, system-ui, sans-serif` (đã có) | mọi **văn xuôi**: hero, situation, trade-offs, checklist |
| Mono | `ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace` | mọi thứ **máy nói ra**: SQL, JSON, log, path file, status code, số đo |

**Mono là font hệ thống — tải 0 byte.** Không thêm webfont mono. Lý do: mono trong lab chỉ cần *đều cột* và *trông như terminal*, không cần cá tính; và thêm 1 webfont là +25KB cùng một lần chặn render, để phục vụ thứ người đọc nhìn 3 giây.

**[LUẬT 4a]** Ranh giới tuyệt đối: **sans = người nói, mono = máy nói.** Không viết văn xuôi bằng mono cho "trông ngầu", không viết số đo bằng sans.

### 4.2. Type scale

| Token | Size | Dùng cho |
|---|---|---|
| `--fs-hero` | `clamp(2.2rem, 5.5vw, 3.6rem)` | symptom ở hero, `letter-spacing:-.045em` |
| `--fs-h2` | `1.1rem` | tiêu đề 8 khối |
| `--fs-lead` | `1.05rem` | câu mở mỗi khối |
| `--fs-body` | `.95rem/1.7` | văn xuôi |
| `--fs-label` | `.68rem`, `ls:.12em`, uppercase | eyebrow, nhãn vùng, nhãn cột |
| `--fs-mono` | `.8rem/1.55` | log, SQL, JSON |
| `--fs-mono-sm` | `.72rem/1.5` | log dày (≥ 50 dòng) |
| `--fs-readout` | `clamp(1.6rem, 4vw, 2.4rem)` | số lớn ở Verdict |

Nhịp của scale này: nhãn nhỏ uppercase letterspaced + tiêu đề nhỏ + display lớn âm letterspacing. Ba bậc, dùng ở cả 18 trang, **không phát minh thêm bậc nào** — mỗi bậc mới là một quyết định phải lặp lại 18 lần.

**[LUẬT 4b]** Văn xuôi tối đa `68ch`. Vùng instrument **không** bị giới hạn này — bảng và log được phép rộng hết sân khấu.

### 4.3. Số đo — luật nghiêm nhất của toàn bộ hệ thống

**[LUẬT 4c]** Mỗi con số *đo được* phải thoả cả 4:

1. **mono**
2. **`font-variant-numeric: tabular-nums`** — để số không nhảy ngang khi đếm lên. Thiếu cái này, mọi counter sẽ rung và lab trông như đồ chơi.
3. **Luôn có đơn vị**, đơn vị viết nhỏ hơn và màu `--slate`: `3180` + `ms`, chứ không bao giờ `3180`.
4. **Chiều rộng được giữ chỗ trước** (`min-width` theo số ký tự tối đa) → không layout shift khi giá trị chạy từ `0` lên `3180`.

Quy tắc định dạng:

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Thời gian | < 1000 → `ms` nguyên; ≥ 1000 → `s` 2 chữ số thập phân | `84 ms` · `3.18 s` |
| Đếm | số nguyên, phân cách `.` theo locale | `50.000 rows` |
| Tỉ lệ | chỉ hiện khi ≥ 2× hoặc ≤ 0.5×, 1 chữ số thập phân | `×38 nhanh hơn` |
| Tiền | `đ`, không thập phân, phân cách `.` | `500.000 đ` |
| Before → After | luôn dùng `→`, before luôn trái | `101 queries → 1 query` |
| Delta | dấu bắt buộc, màu theo signal | `−2.1 s ✓` |

**[LUẬT 7a] Không hardcode số.** Mọi số ở Verdict phải tính ra từ accounting trong `store.js`. Nếu một số không truy nguyên được về accounting → xoá nó khỏi UI. Một con số đẹp mà bịa làm đổ toàn bộ uy tín của 17 trang còn lại.

### 4.4. `ModelNote` — biến "giả" thành "mô hình"

Đây là component mình khuyến nghị mạnh nhất, và plan cũ chưa có.

Mỗi instrument có một dấu `ⓘ simulated` nhỏ ở góc. Bấm/hover ra một ghi chú **ngắn, kỹ thuật, trung thực**:

```text
ⓘ Mô hình mô phỏng
  1 round-trip query ≈ 0.8 ms + 0.02 ms mỗi dòng trả về
  jitter ±12% (PRNG seed cố định → kết quả lặp lại được)
  Không có network. Toàn bộ chạy trong tab của bạn.
```

Vì sao điều này có giá trị cao bất thường: một tech lead nhìn demo mô phỏng sẽ nghĩ ngay *"số này bịa"* — và họ đúng khi nghĩ vậy. Nhưng một mô hình **được phát biểu rõ** thì không còn là bịa, nó là **giả định có kiểm chứng được**. Khoảng cách giữa hai thứ đó đúng bằng khoảng cách giữa junior và senior. Site của bạn nên đứng ở phía sau.

**[LUẬT 7b]** Instrument không có `ModelNote` → reject.

---

## 5. Ngữ pháp layout (layout grammar)

### 5.1. Nguyên tắc hình khối của Lab

Bốn luật hình khối, chốt một lần cho cả site. Chúng được chọn vì phù hợp với **instrument** — thứ phải trông như dụng cụ đo, không như thẻ marketing:

- **Đường kẻ 1px, không đổ bóng.** Phân tách bằng `--line`, không bằng box-shadow. Lý do: box-shadow trên nền tối tạo vùng mờ, và vùng mờ cạnh một bảng số làm số khó đọc.
- **Bo góc gần bằng 0**, trừ pill `999px`. Panel instrument: `border-radius: 2px`, không hơn. Góc bo lớn làm panel trông như card nội dung, trong khi nó là màn hình thiết bị.
- **Grid lệch cột `.43fr / 1fr`** — tiêu đề trái, nội dung phải. Dùng cho mọi khối văn xuôi của trang lesson.
- **Nhãn nhỏ uppercase letterspaced** làm "biển chỉ đường". Mỗi vùng lab có đúng một nhãn kiểu này.

### 5.2. Shell của trang lesson (khoá thứ tự)

```text
┌──────────────────────────────────────────────────────────┐
│ lab-nav  ⬡ Principles Lab    All problems · By principle │
├──────────────────────────────────────────────────────────┤
│ ① HERO — SYMPTOM                                         │
│   pill[category]  pill[difficulty]  pill[blast-radius]   │
│   h1: triệu chứng bằng lời người không-dev               │
│   metric strip:  101 queries / 3.18 s  →  1 query / 84ms │
│   ProvenanceTag: Classic problem | From the field | …    │
├──────────────────────────────────────────────────────────┤
│ ② SITUATION            (grid lệch cột, 120–180 từ)       │
├══════════════════════════════════════════════════════════┤
│ ③ THE LAB — STAGE                           [TỰ DO 100%] │
│   full-bleed, nền --stage-bg, cao tối thiểu 70vh         │
│   ①Control ②Response ③Internals ④Verdict (ngữ nghĩa)    │
├══════════════════════════════════════════════════════════┤
│ ④ UNDER THE HOOD       (sơ đồ SVG + 150 từ)              │
│ ⑤ THE PRINCIPLE        (khối đóng khung, viền accent)    │
│ ⑥ TRADE-OFFS           (2 cột: Áp dụng khi / Đừng khi)   │
│ ⑦ WHERE THIS BITES     (xuất hiện ở đâu + dấu hiệu sớm)  │
│ ⑧ CARRY IT AWAY        (checklist + related)             │
├──────────────────────────────────────────────────────────┤
│ prev / next trong cùng category                          │
│ footer: safety line · changelog                          │
│         Built and maintained by Phuc     (text, no link) │
└──────────────────────────────────────────────────────────┘
```

**Nav và footer là của riêng Lab.** Wordmark dẫn về landing của Lab; hai link còn lại là nội bộ. **Không có link nào ra ngoài site** — kể cả trong footer (LUẬT 0, plan §1.1). Trước đây shell này dùng `case-nav` của portfolio và hiện tên tác giả ở góc phải; cả hai đã bỏ.

**Dòng attribution — chốt chính xác:** `Built and maintained by Phuc`, **text thuần, không `<a>`**, dùng `--fs-label` + `--slate`, một dòng cuối footer. Không chức danh, không tên đầy đủ, không icon, không xuất hiện ở nav hay hero. Nó là chữ ký, không phải tiểu sử — và chữ ký không cần link (plan §1.1).

**Khối ⑦ đổi tên** từ *From experience* thành *Where this bites in practice*: nó nói về vấn đề xuất hiện ở đâu trong ngành và dấu hiệu nhận ra, **không** kể trải nghiệm của tác giả (plan §4.1).

**[LUẬT 6a]** Khối ③ là khối **full-bleed** duy nhất của trang. Vì nó tràn hết chiều ngang và đổi màu nền, mắt người đọc nhận ra ngay "đây là chỗ bấm" mà không cần hướng dẫn. Đây là lý do stage được tự do layout mà vẫn không làm người đọc mất phương hướng: **vị trí của sân khấu là bất biến, chỉ nội dung sân khấu là tự do.**

**[LUẬT 6b]** Khối ⑥ (Trade-offs) không được để trống ở bất kỳ trang nào. Trang không có trade-off là trang chưa hiểu vấn đề.

### 5.3. Mật độ & spacing

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--sp-1` … `--sp-6` | `.35 / .7 / 1.1 / 1.8 / 3 / 5rem` | thang spacing duy nhất |
| `--pane-pad` | `clamp(.9rem, 2.5vw, 1.4rem)` | padding trong mọi panel instrument |
| `--section-pad` | `clamp(4rem, 9vw, 8rem)` | khoảng nghỉ giữa 8 khối nội dung |

Instrument dùng mật độ **dày hơn** văn xuôi (gần bảng điều khiển hơn trang sách): hàng bảng `1.9rem`, dòng log `1.35rem`.

### 5.4. Mobile — 360px trước desktop

**[LUẬT 11]** Vẽ stage ở 360px trước. Lý do: mọi lab chết trên mobile đều chết theo cùng một cách — bảng tràn ngang, log tràn ngang, waterfall bị bóp. Nếu thiết kế desktop trước thì đến mobile chỉ còn cách cắt bỏ thông tin.

Luật mobile cho stage:

1. 4 vùng **xếp dọc đúng thứ tự ①②③④** (thứ tự DOM đã đúng, nên tự do).
2. Panel được cuộn **một chiều**, và chiều đó phải **có nhãn**: `← cuộn ngang →` hoặc một gradient fade ở mép. Cuộn ẩn không ai biết là cuộn mất.
3. Bảng > 3 cột trên mobile → đổi sang **card xếp dọc**, không cuộn ngang.
4. Log stream: `max-height: 42vh`, cuộn riêng, có counter `101 dòng` ở header để không cần cuộn mới biết nhiều.
5. Mọi target bấm ≥ 40×40px.
6. Trang **không bao giờ** có horizontal scroll (panel con thì được).

---

## 6. Chuyển động và thời gian mô phỏng

### 6.1. Hai trục thời gian khác nhau — đừng trộn

Phân biệt rõ, vì trộn là lỗi phổ biến nhất ở loại UI này:

| Trục | Là gì | Token | Ai điều khiển |
|---|---|---|---|
| **UI motion** | phản hồi của giao diện (nút nhấn, panel mở) | `--t-instant 90ms`, `--t-ui 180ms`, `--t-reveal 320ms`, `--ease cubic-bezier(.22,.61,.36,1)` | Chassis, bất biến |
| **Sim time** | thời gian *trong hệ thống được mô phỏng* | dữ liệu của lab, không phải CSS | `clock.js` + người đọc (1× / 10×) |

UI motion luôn nhanh (≤ 320ms). Sim time có thể dài — đó là nội dung, không phải hiệu ứng.

### 6.2. Luật về "chậm phải cảm được"

Plan cũ nói "luôn có fake latency". Cụ thể hoá:

1. **[LUẬT] Trần 4 giây.** Một lần chạy ở 1× không được vượt ~4s trước khi người đọc có đường ra. Quá 4s người ta rời trang, và lúc đó bài học không được dạy mà bị bỏ.
2. **Luôn có đường ra:** nút `Skip to result` xuất hiện sau 1.2s, và `Esc` huỷ chạy. Lab khoá người đọc lại là lab thất bại — kể cả khi nó đang dạy đúng.
3. **Progressive, không spinner.** Chậm được thể hiện bằng **dữ liệu nhỏ giọt** (dòng log thứ 37 đang in ra, hàng bảng thứ 22 đang hiện), không bằng vòng xoay. Spinner nói "đợi đi"; dòng log nhỏ giọt nói "nó đang làm 101 việc" — chỉ cái thứ hai dạy được điều gì.
4. **Điều khiển tốc độ sim** (`1× / 10×`) ở góc stage, nhớ lựa chọn qua `localStorage` (§11.4). Người đọc lần 2, lần 3 không phải chờ lại.
5. **Jitter là bắt buộc**: ±8–15% quanh giá trị mô hình, từ PRNG có seed. Số tròn trĩnh lặp lại y nguyên là dấu hiệu rõ nhất của demo giả.

### 6.3. `prefers-reduced-motion` — giảm, không xoá

**[LUẬT]** Reduced motion **không** có nghĩa là bỏ luôn phần tiết lộ dần. Nếu tắt hết, người bật setting này mất toàn bộ nội dung dạy học của lab.

Thay vào đó: **stepped reveal** — dữ liệu vẫn tới theo 3 bước (`~25% → ~70% → 100%`), nhảy bậc, không easing, không transform, không parallax. Người đọc vẫn *thấy* nó bò, chỉ không bị chuyển động mượt làm chóng mặt.

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  /* nhưng sim vẫn chạy: clock.js đọc flag này và chuyển sang chế độ 3 bậc */
}
```

### 6.4. Counter đếm lên

`requestAnimationFrame`, easing out, **nhưng luôn kết thúc đúng giá trị accounting thật** — không ease tới một số tròn cho đẹp. Và tabular-nums (§4.3) để nó không rung.

---

## 7. Stage Contract — "giấy phép sân khấu"

Đây là cơ chế quản trị của mình với vai supervisor: **lab được tự do layout vì nó phải trả giá bằng 10 điều dưới đây.** Tự do không miễn phí, nó có hợp đồng.

### 7.1. Mười điều bắt buộc

| # | Yêu cầu | Kiểm thế nào |
|---|---|---|
| 1 | 4 vùng tồn tại với `data-zone` đúng tên | đọc DOM |
| 2 | Thứ tự DOM = ①②③④; sắp xếp lại chỉ bằng `grid-area` | tắt CSS, đọc lại trang |
| 3 | **6 trạng thái** (§7.2) đều trông cố ý | mở `_states.html` |
| 4 | Mọi số truy nguyên về accounting của `store.js` | grep lab tìm số literal |
| 5 | 360px không horizontal scroll ở cấp trang | DevTools 360×640 |
| 6 | Keyboard đi hết; toggle `role="switch"` + `aria-checked`; Response `aria-live="polite"` | tab-through + screen reader |
| 7 | ≤ 2 hue mới, lấy từ signal set hoặc identity (§3.4) | đếm trong CSS của stage |
| 8 | CSS stage scoped dưới `.stage--<id>`, ≤ 120 dòng | `wc -l` |
| 9 | `Reset` trả về trạng thái idle giống hệt ban đầu | reset 3 lần, so sánh |
| 10 | Có `ModelNote`; có dòng "runs in your browser"; CLS < 0.1 | Lighthouse + đọc |

**Lab không qua được 10 điều này thì không có trang riêng** — gộp vào bài tổng quan. Đúng tinh thần bộ lọc 5 tiêu chí ở plan cũ §2.4.

### 7.2. Sáu trạng thái bắt buộc

Phần lớn demo tự làm trên internet chỉ được thiết kế cho đúng một trạng thái: *vừa chạy xong*. Chúng chết ở `idle` (khung trắng trống rỗng) và ở `error`. Khoá 6 trạng thái này là việc có giá trị cao nhất mà P0 làm được.

| State | `data-state` | Phải thấy gì | Bẫy thường gặp |
|---|---|---|---|
| **idle** | `idle` | Mời gọi rõ: "Bấm *Load candidates* để bắt đầu". Instrument hiện **khung và trục**, chưa có dữ liệu. Giữ chỗ đúng chiều cao cuối cùng | Khung trống không nhãn → người đọc tưởng lỗi |
| **running** | `running` | Dữ liệu nhỏ giọt + counter chạy + `Skip to result` sau 1.2s | Spinner thay cho dữ liệu |
| **settled** | `settled` | Kết quả đầy đủ, Verdict hiện số, `Reset` sẵn sàng | Verdict xuất hiện làm đẩy layout (CLS) |
| **compare** | `compare` | Sau khi đã chạy **cả 2 chế độ**: hiện before → after cạnh nhau. **Đây là trạng thái đắt nhất của site** và thường bị bỏ | Người đọc chạy 2 lần mà không ai ghép 2 kết quả lại cho họ |
| **error** | `error` | Lỗi *được mô phỏng có chủ ý* (500, 429, timeout) hiện như dữ liệu, không như lỗi trang | Nhảy alert, hoặc console.error rồi màn hình đứng im |
| **noscript** | — | `<noscript>`: bảng kết quả tĩnh + câu verdict + 1 ảnh | Khung trắng khi JS fail |

**Về `compare`:** mình nhấn mạnh vì nó là chỗ bài học thật sự được *chốt*. Người đọc bấm Naive, thấy chậm; bấm Principled, thấy nhanh — nhưng **họ không còn giữ con số cũ trong đầu**. Lab phải giữ hộ họ: `store.js` lưu kết quả lần chạy cuối của mỗi mode, và khi đủ cả hai thì Verdict tự chuyển sang dạng so sánh. Không có `compare`, lab chỉ là hai cái demo rời.

### 7.3. API khai báo — `defineLab`

Mở rộng từ plan cũ §6.3, thêm phần `stage` để lab khai layout riêng:

```js
defineLab({
  id: "n-plus-one",
  stage: {
    bg: "deep",
    layout: "waterfall",        // tên grid template trong .stage--n-plus-one
    zones: {                     // CHỈ hình học — thứ tự DOM vẫn ①②③④
      control:   "top",
      response:  "left",
      internals: "right",
      verdict:   "bottom"
    },
    hues: []                     // ≤ 2, để trống nếu chỉ dùng signal set
  },
  modes: { naive: "Loop per row", principled: "Join + batch" },
  controls: [
    { type: "button", id: "load", label: "Load candidates" },
    { type: "range",  id: "rows", label: "Rows", values: [10, 100, 500], default: 100 }
  ],
  model: {                       // nguồn của ModelNote — bắt buộc
    note: "1 round-trip ≈ 0.8ms + 0.02ms/row, jitter ±12%",
    seed: 20261024
  },
  metrics: [
    { key: "queries", label: "Queries", unit: "" },
    { key: "ms",      label: "Total time", unit: "ms", fmt: "duration" }
  ],
  run: async ({ mode, rows, db, log, clock }) => { /* phần duy nhất mỗi lab tự viết */ }
});
```

Điều quan trọng về mặt thiết kế: `stage.zones` chỉ nói **hình học**, còn `defineLab` luôn render DOM theo đúng thứ tự ngữ nghĩa. Tự do và kỷ luật được tách bằng chính cái API — không dựa vào việc người viết lab nhớ luật.

---

## 8. Bộ component — theo tầng và theo phase

Bạn yêu cầu "mỗi phase chứa component / block / tool khác nhau". Đây là bản phân bổ.

### 8.1. Luật thêm component

**[LUẬT 10] Rule of two cho *hình*, rule of three cho *logic*.**

- Một **pattern thị giác** xuất hiện lần thứ **2** → lên `lab.css` ngay. Vì lệch hình giữa hai lab thì người đọc *thấy được*, và đó là lỗi nhìn thấy bằng mắt.
- Một **đoạn logic** xuất hiện lần thứ **3** mới lên `runtime/`. Vì trừu tượng hoá logic sớm sinh ra tham số hoá sai, và cái giá của nó là ẩn — đúng bài học `build-it-for-the-future`.

Hai ngưỡng khác nhau, có chủ ý. Site vừa dạy DRY vừa dạy YAGNI, nên nó phải biết hai thứ đó áp vào hai tầng khác nhau.

### 8.2. Kernel components (P0) — dùng ở mọi lab

| Component | Vai trò | Ghi chú thiết kế |
|---|---|---|
| `ModeSwitch` | toggle Naive ⇄ Principled | `role="switch"`, cả hai nhãn luôn đọc được, **không màu đỏ** (LUẬT 3) |
| `RunButton` | kích hoạt một lần chạy | khi `running` đổi thành `Skip to result` chứ không disable — disable là ngõ cụt |
| `ResetButton` | về idle | luôn hiện, góc phải vùng ① |
| `Dial` | range có bậc rời (10/100/500) | bậc rời, không liên tục — giá trị tròn dễ nhớ và dễ so sánh |
| `PayloadChip` | chip bấm-là-dán | dùng ở các lab Attacker Console |
| `ResponseCard` | status + ms + body | status code mono, màu theo signal, body collapsible |
| `LogStream` | log cuộn | header có counter + pause-on-hover + `--sig-focus` ở dòng hiện tại |
| `Readout` | một con số + đơn vị | tabular-nums, giữ chỗ trước (LUẬT 4c) |
| `VerdictBar` | before → after | 2 `Readout` + mũi tên + tỉ lệ; `data-state="compare"` mới đầy đủ |
| `StateBanner` | nhãn trạng thái của stage | đọc `data-state`, một dòng, góc trên |
| `ModelNote` | giả định mô phỏng | `<details>`, native, không JS (LUẬT 7b) |
| `SafetyLine` | "Runs entirely in your browser. No server, no real data." | **bắt buộc ở mọi lab security** |
| `SimClock` | 1× / 10× | nhớ qua `localStorage` |
| `ZoneLabel` | nhãn nhỏ uppercase cho mỗi vùng | một nhãn / vùng, không hơn |
| `ProvenanceTag` | xuất xứ của vấn đề: `Classic problem` / `From the field` / `Constructed example` | **thay cho badge `Seen in production` đã bỏ.** Dùng ở 2 chỗ (hero trang lesson + card trong catalog) → rule-of-two, nên nó thuộc kernel. Chi tiết: plan §3.3 |

**Về badge đã bỏ — kết quả rà soát bạn yêu cầu:**

Badge `Seen in production` **chưa bao giờ tồn tại như một component** trong tài liệu này: nó chỉ được vẽ trong sơ đồ shell ở §5.2 và nhắc trong §9.4, không có hàng nào trong bảng kernel ở trên. Nên việc bỏ nó là **sửa 2 chỗ trong spec, không phải xoá code** — thuận lợi, vì chưa có gì được viết.

Nhưng chỗ đó **không được để trống**: hero của trang lesson cần một nhãn ở vị trí ấy, nếu không metric strip sẽ dính liền khối ② và mất một nhịp nghỉ. `ProvenanceTag` lấp đúng vị trí đó và giữ được việc mà badge cũ đang làm tốt — **nói thật về độ "thật" của ví dụ** — mà không cần tới portfolio.

Ba luật hình cho `ProvenanceTag`, để nó không biến thành huy hiệu tự khen:

1. **Dùng `--slate`, không dùng branch color, không dùng signal color.** Nó là metadata, không phải dữ liệu và cũng không phải nhánh. Một nhãn xuất xứ sáng màu sẽ hút mắt khỏi `metric strip` — chỗ duy nhất đáng hút mắt ở hero.
2. **Cả ba giá trị cùng một kích cỡ, cùng một trọng lượng.** `Constructed example` không được trông "yếu hơn" `From the field`; nhãn nói *xuất xứ*, không nói *chất lượng* (plan §3.3).
3. **Không có trạng thái "không nhãn".** Mọi trang đều có một trong ba giá trị. Bỏ trống là mời người đọc tự suy diễn, và họ sẽ suy diễn theo hướng có lợi cho site — đúng cái cần tránh.

### 8.3. Instrument components — thêm theo phase

Mỗi phase mở một nhóm khuôn tương tác mới, nên mở một nhóm instrument mới. Đây là điều làm các phase **khác nhau về bản chất**, không chỉ khác về số lượng trang.

#### P1 — khuôn A / B / C

| Instrument | Dùng ở | Mô tả thiết kế |
|---|---|---|
| `TimingWaterfall` | A | SVG, 1 bar / request, trục có nhãn đơn vị, bar thứ *n* hiện khi query thứ *n* chạy |
| `QueryLogStream` | A | log + "101 dòng" ở header; **có minimap dọc** để thấy chiều dài mà không cần cuộn |
| `RowTable` | A | bảng render dần, hàng chưa có là `--sig-ghost`; > 3 cột ở mobile → card |
| `StringBuilder` | B | hiện câu SQL **đang được nối**; phần payload chèn vào tô `--sig-bad`; đây là khoảnh khắc dạy học mạnh nhất của site |
| `LeakTable` | B | bảng dữ liệu rò rỉ, tên fake rõ ràng, cột `password_hash` làm mờ một phần |
| `FileGraph` | C | SVG sơ đồ file; đường lan toả animate; file bị sót nhấp nháy `--sig-bad` |
| `ScreenTiles` | C | 5 "màn hình" nhỏ (giỏ hàng / hoá đơn / email / báo cáo / app). Tile là **khung thiết bị tối giản** định nghĩa trong `lab.css`: viền 1px, không chrome, không thanh địa chỉ giả — nó mô phỏng *một bề mặt hiển thị giá*, không nhái UI của sản phẩm nào |
| `DiffColumns` | C | 2 cột code, highlight dòng đổi, `<details>` để gọn trên mobile |

#### P2 — khuôn D / E

| Instrument | Dùng ở | Mô tả thiết kế |
|---|---|---|
| `LoadDial` | D | slider số user đồng thời; nhả tay mới chạy (không chạy theo mỗi pixel kéo) |
| `LiveChart` | D | SVG area/line streaming, ≤ 200 điểm, decimate, trục y luôn có đơn vị |
| `PlanBox` | D | hộp kiểu `EXPLAIN`: `Seq Scan … (rows scanned: 50000)` vs `Index Scan …` |
| `ScanBar` | D | thanh số dòng phải quét; đây là con số dạy học, không phải ms |
| `DualTrack` | E | 2 làn song song dùng `--id-a` / `--id-b` |
| `RaceWindow` | E | vệt mờ `--sig-warn` phủ lên cửa sổ race trên timeline |
| `LedgerList` | E | sổ giao dịch, số tiền phải lề phải, delta theo signal |
| `InsertCounter` | D | cho chiều ngược của index (INSERT chậm đi) — thứ làm trang đó "senior" |

#### P3 — khuôn F / G

| Instrument | Dùng ở | Mô tả thiết kế |
|---|---|---|
| `VersionPicker` | F | dropdown version API |
| `ContractDiff` | F | diff shape JSON, field mất tô `--sig-bad` |
| `ClientScreen` | F | màn hình app client **gãy thật** (trắng màn, field `undefined`) |
| `RequirementList` | G | checkbox "format có thể cần trong tương lai" |
| `ComplexityGauge` | G | `files · interfaces · branches · tests needed` — 4 Readout một hàng |
| `CodeSideBySide` | G | 2 cột code, số dòng đổi theo lựa chọn |
| `PrincipleMap` | — | SVG trang tổng hợp: principle ↔ problem (many-to-many) |

#### P4 — cấp site

`ProgressDashboard` (đã đọc gì / còn gì), `OgCard` (ảnh OG mỗi trang), `LangToggle` (EN/VI), `SubmitForm` (người đọc gửi problem).

### 8.4. Tool nội bộ theo phase

| Phase | Tool |
|---|---|
| P0 | **`principles/_states.html`** — gallery mọi component × 6 trạng thái (xem §12.1); **`tests/isolation.test.mjs`** — canh LUẬT 0 (không link / không CSS dùng chung giữa Lab và portfolio) |
| P1 | `tools/check-contract.mjs` — kiểm điều 1,2,7,8 của Stage Contract bằng cách parse HTML/CSS |
| P2 | `tools/budget.mjs` — in kích thước từng file so với trần §2.2 |
| P3 | `tools/stamp.mjs` — sinh HTML từ catalog + partial (tripwire §2.3); `tools/og.mjs` — sinh ảnh OG |
| P4 | `tools/rss.mjs` — sinh feed từ catalog |

Tất cả là script Node chạy tay, **không nằm trong deploy path**. GitHub Pages vẫn chỉ nhận file tĩnh.

---

## 9. Cách trình bày dữ liệu — cho từng dạng và từng lab

### 9.1. Luật chung cho mọi dạng dữ liệu

**[LUẬT 9]** Mỗi instrument phải trả lời được: *mắt người đọc theo dõi cái gì?* Nếu câu trả lời là "nhiều thứ" → instrument sai, chẻ ra.

Và: **dữ liệu dạy học phải thấy được mà không cần cuộn.** Nếu bài học là "101 query", thì người đọc phải thấy *độ lớn* của 101 ngay — bằng counter, bằng minimap, bằng chiều cao thanh — chứ không phải bằng việc cuộn tay qua 101 dòng.

### 9.2. Luật theo dạng dữ liệu

| Dạng | Luật thiết kế |
|---|---|
| **Bảng** | Không zebra (dùng hairline `--line` — khớp ngôn ngữ repo). Header sticky. Số lề phải + tabular-nums. Hàng chưa load = `--sig-ghost`. Hàng cao `1.9rem`. Mobile > 3 cột → card |
| **Log stream** | Mono `--fs-mono-sm`. Cột timestamp cố định rộng. Counter ở header. Auto-scroll có pause-on-hover. Dòng hiện tại viền `--sig-focus`. `max-height: 42vh`. **Minimap dọc** khi > 30 dòng |
| **Waterfall** | 1 bar / đơn vị việc. Trục **luôn có nhãn + đơn vị**. Thang linear mặc định; nếu log scale thì ghi rõ `log scale` trên trục — thang log không ghi nhãn là nói dối bằng hình |
| **Time series** | SVG, ≤ 200 điểm (decimate trước khi vẽ). Trục y có đơn vị, bắt đầu từ 0 trừ khi ghi rõ. Không area gradient nhiều màu |
| **SQL / code** | Tô **≤ 2 loại token**: phần cố định (`--slate-light`) và phần nguy hiểm (`--sig-bad`). Không syntax highlighter. Lý do: bài học nằm ở *một* đoạn, tô cả câu là làm loãng nó |
| **JSON response** | Mono, thụt 2 space, collapsible từ độ sâu 2. Key `--slate`, value `--slate-light`, field quan trọng `--sig-*` |
| **Tiền / ledger** | Lề phải, đơn vị cố định, delta có dấu + màu signal. Không bao giờ bỏ đơn vị tiền |
| **Sơ đồ** | Inline SVG viết tay. Bắt buộc `<title>` + `<desc>` cho screen reader. Chỉ dùng `currentColor` + token → tự theme. Không text < 11px |
| **Verdict / số lớn** | ≤ 4 ký tự có nghĩa + đơn vị nhỏ. Before → After, before luôn trái. Tỉ lệ chỉ hiện khi ≥ 2× |

### 9.3. Bảng trình bày dữ liệu cho từng lab

Cột **"Mắt theo dõi cái gì"** là cột quan trọng nhất — nó là phát biểu thiết kế của lab đó.

#### 6 lab đầu (chi tiết)

| Lab | Khuôn | Instrument chính | Mắt theo dõi cái gì | Đơn vị verdict | Layout stage |
|---|---|---|---|---|---|
| `n-plus-one-query` | A | `QueryLogStream` + `TimingWaterfall` + `RowTable` | **Log dài ra** — 101 dòng bò xuống, counter ms tăng không dừng | `queries` + `ms` | ①trên · ②trái · ③phải (log cao bằng bảng) · ④dưới |
| `sql-injection-contact-form` | B | `StringBuilder` + `LeakTable` | **Câu SQL mọc thêm logic** — từng ký tự payload chèn vào, highlight đỏ lan ra | `rows leaked` | ①console trên nền `void` · ③SQL **giữa, to nhất** · ②bảng rò rỉ dưới · ④góc phải |
| `one-rule-five-places` | C | `FileGraph` + `ScreenTiles` | **Một màn hình không đổi theo** — 4 màn nhảy sang 10%, 1 màn đứng ở 8% | `files changed` + `silent bugs` | ①trên · ③sơ đồ file trái · ②5 tile phải · ④dưới |
| `no-index-no-mercy` | D | `PlanBox` + `ScanBar` + `InsertCounter` | **Thanh số dòng quét** — 50.000 so với 1, không phải ms | `rows scanned` + `ms` | ①trên · ②kết quả trái hẹp · ③plan + scanbar phải rộng · ④dưới · tab riêng cho chiều ngược (INSERT) |
| `double-click-double-charge` | E | `DualTrack` + `RaceWindow` + `LedgerList` | **Hai vệt chồng nhau trong cửa sổ race** — rồi số dư bị trừ hai lần | `charges` + `balance đ` | ①giữa trên (nút Pay là trung tâm) · ③timeline 2 làn ngang · ②sổ giao dịch dưới · ④cạnh số dư |
| `build-it-for-the-future` | G | `RequirementList` + `ComplexityGauge` + `CodeSideBySide` | **4 đồng hồ tăng cùng lúc** khi tick thêm requirement chưa ai cần | `files` + `branches` + `tests` | ①trái dọc (checkbox) · ②③2 cột code giữa · ④4 gauge thành hàng dưới |

Để ý: không có hai lab nào cùng một hình. Đó là mục tiêu. Nhưng cả 6 đều đọc theo thứ tự ①②③④, cả 6 dùng chung 6 signal color, cả 6 có `ModelNote` và 6 trạng thái. Đó là phần giữ chúng thành một site.

#### 12 lab còn lại (định hướng)

| Lab | Khuôn | Instrument chính | Mắt theo dõi cái gì | Verdict |
|---|---|---|---|---|
| `offset-vs-cursor-pagination` | A | `RowTable` ×2 trang + marker | dòng **lặp lại / bị nhảy** giữa trang 1 và 2 | `rows duplicated` |
| `nullable-column-deploy-order` | F | `DualTrack` (app cũ / app mới) + `PlanBox` | app cũ **chết lúc nào** trong trình tự deploy | `failed writes` |
| `transaction-or-two-half-truths` | E | `LedgerList` 2 bảng + `RaceWindow` | user có mà profile **không có** | `orphan rows` |
| `trusting-the-client` | B | `StringBuilder` (request body) + `ResponseCard` | giá trong request **khác** giá trong DB | `đ lost` |
| `idor-the-other-users-invoice` | B | `VersionPicker` (đổi id) + `LeakTable` | hoá đơn **của người khác** mở ra được | `records exposed` |
| `least-privilege-one-key` | B | `FileGraph` (phạm vi key) + `LeakTable` | **bán kính** mà một key chạm tới | `scopes exposed` |
| `jwt-you-can-edit` | B | `StringBuilder` (3 phần token) + `ResponseCard` | chữ ký **đổi hay không** khi sửa payload | `privilege escalated` |
| `the-function-that-does-seven-things` | G | `ComplexityGauge` + `DiffColumns` | sửa 1 chỗ, **3 chỗ khác đỏ lên** | `tests broken` |
| `magic-number-in-the-wild` | C | `FileGraph` + grep view | `86400` nằm ở **bao nhiêu chỗ** | `occurrences` |
| `breaking-change-at-3pm` | F | `ContractDiff` + `ClientScreen` | màn hình mobile **trắng ra** | `clients broken` |
| `error-shapes-that-lie` | F | `ResponseCard` + `DualTrack` retry | client **không retry** vì thấy 200 | `silent failures` |
| `cache-that-lies` | A | `LogStream` hit/miss + `ScreenTiles` | user thấy **giá cũ** trong 10 phút | `stale seconds` |

### 9.4. Trung thực là một yêu cầu UI, không phải lời nói thêm

Ba thứ bắt buộc có mặt trên mọi lab, và chúng là **component**, không phải disclaimer ở footer:

1. `ModelNote` — mô hình mô phỏng, phát biểu bằng số (§4.4).
2. `SafetyLine` — "Runs entirely in your browser. No server, no real data." Ở các lab security thì nó nằm **trong stage**, không phải cuối trang, vì đó là chỗ người ta đang lo.
3. Nhãn `simulated` trên chính instrument — không phải ở chân trang.

Thứ tư: **`ProvenanceTag`** ở hero (§8.2) — nói xuất xứ của vấn đề bằng một trong ba giá trị `classic` / `field-report` / `derived`.

Về khối ⑦ *Where this bites in practice*: nó nói vấn đề xuất hiện ở loại hệ thống nào và dấu hiệu sớm là gì — **không** kể trải nghiệm cá nhân, và **không** có badge kinh nghiệm nào (bản đầu có `Seen in production` link tới case study; đã bỏ theo plan §1.1).

Luật trung thực còn lại, nay áp vào xuất xứ thay vì vào CV:

- `field-report` phải **ẩn danh hoàn toàn** — không tên công ty, không tên sản phẩm, không "một công ty fintech". Không ẩn danh được thì hạ xuống `derived`.
- Lưỡng lự giữa hai mức → **chọn mức khẳng định thấp hơn**.
- `derived` không phải loại hai: một ví dụ dựng tốt dạy tốt hơn một sự cố thật kể lệch.

Lý do luật này vẫn nghiêm dù đã bỏ portfolio: đây là site **dạy** người khác. Một trang dạy mà phóng đại xuất xứ ví dụ thì phá đúng thứ nó đang xây — và người đọc kiểu "tech lead đi tìm tài liệu cho team" là người phát hiện nhanh nhất.

---

## 10. Cấu trúc file, đặt tên, routing

### 10.1. Cây thư mục (mở rộng từ plan cũ §6.2)

```text
repo/                                # 1 repo, 2 site doc lap (plan §1.1)
├─ index.html                        # PORTFOLIO — khong doi, khong link toi Lab
├─ pages/                            # PORTFOLIO — khong doi
├─ principles/                       # ===== LAB =====
│  ├─ index.html                     # landing: hero + how-it-works + lab mini + catalog
│  ├─ _template.html                 # khung 8 khối, copy cho trang mới (P0–P1)
│  ├─ _states.html                   # ★ gallery component × 6 trạng thái (dev-only, noindex)
│  ├─ n-plus-one-query.html
│  ├─ sql-injection-contact-form.html
│  └─ one-rule-five-places.html
├─ source/
│  ├─ styles.css                     # PORTFOLIO (Lab khong nap)
│  ├─ case-study.css                 # PORTFOLIO (Lab khong nap)
│  ├─ principles.css                 # LAB: chassis rieng + landing + shell lesson
│  └─ lab.css                        # LAB: kernel 4 vùng + component dùng ≥ 2 lần
├─ scripts/
│  ├─ runtime/
│  │  ├─ store.js                    # in-memory DB + accounting chi phí
│  │  ├─ server.js                   # fakeFetch: status, latency, 429/500, song song
│  │  ├─ clock.js                    # sim time, speed 1×/10×, reduced-motion aware
│  │  ├─ logger.js                   # event bus → panel Internals subscribe
│  │  ├─ lab.js                      # defineLab(): dựng 4 vùng, bind control, 6 state
│  │  ├─ fmt.js                      # ★ định dạng số/đơn vị (LUẬT 4c) — một chỗ duy nhất
│  │  ├─ rng.js                      # ★ mulberry32 PRNG có seed
│  │  └─ persist.js                  # ★ bọc localStorage/sessionStorage (§11)
│  ├─ labs/
│  │  ├─ n-plus-one/index.js
│  │  ├─ n-plus-one/stage.css        # CSS riêng của stage, ≤ 120 dòng
│  │  └─ …                           # 1 folder / lab khi lab có CSS riêng
│  ├─ data/
│  │  ├─ seed.js                     # generator có seed (không phải JSON lớn)
│  │  └─ catalog.js                  # metadata mọi problem — single source of truth
│  └─ hub.js                         # landing: filter + progress
├─ tests/                            # mock test, KHÔNG trong deploy path
│  └─ isolation.test.mjs             # ★ canh LUẬT 0: 2 site khong tham chieu nhau
├─ tools/                            # script Node chạy tay, KHÔNG trong deploy path
└─ docs/
   ├─ principles-lab-plan.md
   ├─ principles-lab-ui-plan.md      # tài liệu này
   └─ implement/                     # ke hoach thuc thi theo phase + cong kiem tra
```

Bốn file runtime đánh ★ là bổ sung của mình so với plan cũ. `fmt.js` và `rng.js` tồn tại vì nếu không có chúng, LUẬT 4c (định dạng số) và yêu cầu "kết quả lặp lại được" sẽ bị mỗi lab tự làm một kiểu — tức là site tự vi phạm DRY ngay ở chỗ dễ thấy nhất.

### 10.2. Quy ước đặt tên

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Slug trang | kebab-case, mô tả **triệu chứng** không mô tả nguyên lý | `one-rule-five-places` ✓ · `dry-principle` ✗ |
| Class shell | giữ nguyên nhịp repo, không prefix | `.lesson-hero`, `.metric-strip`, `.tradeoff-grid` |
| Class lab kernel | prefix `lab-` | `.lab-zone`, `.lab-switch`, `.lab-log`, `.lab-readout` |
| Class stage riêng | **bắt buộc** `.stage--<lab-id>` | `.stage--n-plus-one .track` |
| State | `data-state` trên gốc stage | `data-state="running"` |
| Vùng | `data-zone` | `data-zone="internals"` |
| Signal | `data-sig` | `data-sig="bad"` |
| Mode | `data-mode` trên gốc stage | `data-mode="naive"` |

**[LUẬT]** Lab tô màu bằng `data-sig`, **không** bằng class màu (`.red`, `.text-danger`). Lý do: `data-sig="bad"` là một **phát biểu về dữ liệu**; `.red` là một phát biểu về pixel. Khi đổi màu signal toàn site, cách thứ nhất sửa 1 chỗ.

### 10.3. Routing và deep-link state

- Landing (trang chủ của Lab): `/principles/`
- Lesson: `/principles/<slug>.html`
- Trang principle (P3): `/principles/by/<principle-slug>.html`
- Catalog tách riêng (chỉ khi > 12 entry, plan §5.5): `/principles/catalog.html`

**[LUẬT]** Không route nào của Lab trỏ ra ngoài `/principles/`, và không route nào của portfolio trỏ vào (LUẬT 0).

**Deep-link trạng thái lab** — bổ sung của mình, không có trong plan cũ:

```text
/principles/n-plus-one-query.html?mode=naive&rows=500&speed=10
```

`lab.js` đọc query string khi khởi tạo, và dùng `history.replaceState` khi người đọc đổi control (không reload, không thêm history entry rác). Nút `Copy link to this run` ở góc stage.

Vì sao điều này đáng làm ở P2: nó cho phép **gửi một trạng thái hỏng** cho người khác. "Mở link này, kéo lên 500 dòng rồi xem" trở thành một link duy nhất. Trong một PR comment, một chat nhóm, một buổi onboard junior — đó là thứ lan được, và nó phục vụ đúng persona thứ ba (người dạy, plan §2.2). Chi phí: ~25 dòng code. Đây là tỉ lệ giá trị / chi phí cao nhất trong toàn bộ danh sách tính năng.

**[LUẬT]** Param không hợp lệ → im lặng về default, **không** báo lỗi. Người ta sẽ sửa tay URL, và lab không được vỡ vì thế.

---

## 11. Dữ liệu, cache, key và state

Mục này bạn hỏi riêng. Chia **4 tầng lưu trữ**, mỗi tầng một tuổi thọ và một luật khác nhau. Lẫn tầng là nguồn gốc của gần như mọi bug state.

### 11.1. Tổng quan 4 tầng

| Tầng | Chỗ ở | Tuổi thọ | Nội dung | Mất đi thì sao |
|---|---|---|---|---|
| **T0 — Seed** | sinh trong bộ nhớ từ PRNG có seed | vĩnh viễn (deterministic) | 50.000 candidate, company, user, transaction | không mất được |
| **T1 — Run** | biến JS trong module lab | một lần chạy | log, timing, kết quả, accounting | không sao, đã có ở T2 |
| **T2 — Session** | `sessionStorage` | một tab | control hiện tại, kết quả cuối mỗi mode (cho `compare`) | người đọc phải chạy lại — chấp nhận được |
| **T3 — Prefs** | `localStorage` | lâu dài | đã đọc trang nào, sim speed, filter hub | về default, không vỡ gì |

**[LUẬT 12a]** Không có tầng nào khác. Không IndexedDB, không cookie, không server state. Lab chạy hoàn toàn trong tab.

### 11.2. T0 — Dữ liệu được **sinh ra**, không được **tải về**

Quyết định quan trọng: lab `no-index-no-mercy` cần 50.000 dòng. Có hai cách, và chỉ một cách đúng.

| Cách | Hệ quả |
|---|---|
| Ship `candidates.json` 50k dòng | ~4 MB tải về. Phá sạch ngân sách §2.2. Trang mobile mạng yếu thì chết |
| **Sinh từ PRNG có seed** ✓ | ~0 byte tải. ~15 ms dựng 50k dòng. **Và lặp lại được** |

```js
// scripts/runtime/rng.js — mulberry32
export function rng(seed) {
  let a = seed | 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// scripts/data/seed.js
export const candidates = (n, seed = 20261024) => { /* luôn ra cùng một dataset */ };
```

Lợi ích thứ hai, quan trọng không kém: **ảnh chụp và con số của bạn lặp lại được.** Khi bạn ghi "50.000 rows scanned · 420 ms" vào `catalog.js` và vào ảnh OG, người đọc mở lab ra sẽ thấy đúng số đó (± jitter đã công bố). Số liệu ngẫu nhiên mỗi lần load làm cho mọi thứ bạn viết thành không kiểm chứng được.

**[LUẬT 7c]** Mọi dữ liệu lab sinh từ `rng(seed)` với seed ghi trong `defineLab({ model: { seed } })`, và seed đó được in trong `ModelNote`.

### 11.3. T1 — Run state, và luật "runtime không được tối ưu hộ"

Mỗi lần chạy sinh một object, huỷ khi reset:

```js
{ id, mode, inputs, startedAt, events: [], accounting: { queries, rowsScanned, ms, bytes }, outcome }
```

**[LUẬT 7d] `store.js` phải trung thực, không được tối ưu hộ.** Đây là cái bẫy tinh vi nhất của cả kiến trúc: rất tự nhiên khi viết `store.js` là thêm memo cho query lặp lại. Nhưng nếu `store.js` tự cache, thì lab N+1 **sẽ không còn chạy 101 query** — nó chạy 1 query rồi lấy cache 100 lần, và con số dạy học biến mất.

Cụ thể:

- `store.js` mặc định **không có cache**.
- Cache chỉ bật khi lab khai `{ cache: true }` — và chỉ lab `cache-that-lies` được khai, vì ở đó cache **chính là đối tượng nghiên cứu**.
- `store.js` không tự reorder, không tự batch. Lab nào muốn batch thì tự gọi `db.batchGet([...])` — vì chính việc *chọn gọi batch* là nội dung của chế độ Principled.

Phát biểu ngắn: **runtime mô phỏng một hệ thống ngây thơ; sự thông minh phải do lab viết ra, không được có sẵn.**

### 11.4. T2 & T3 — Schema key

**[LUẬT 12b]** Mọi key theo đúng format: `pl:<ver>:<scope>[:<id>]`. Namespace `pl:` cho Principles Lab, **version trong key** để đổi schema là đổi key.

| Key | Chỗ | Kiểu | Nội dung |
|---|---|---|---|
| `pl:v1:prefs` | local | JSON | `{ simSpeed: 1\|10, reveal: "auto"\|"stepped", lang: "en"\|"vi" }` |
| `pl:v1:read` | local | JSON | `{ "<slug>": <epoch ms> }` — đã đọc trang nào |
| `pl:v1:hub` | local | JSON | `{ cat: [], diff: [], blast: [], sort: "blast" }` |
| `pl:v1:lab:<slug>` | **session** | JSON | `{ mode, inputs, last: { naive: {...}, principled: {...} } }` |
| `pl:v1:schema` | local | số | `1` — dùng cho `migrate()` |

Luật đi kèm:

1. **[LUẬT 12c] Mọi truy cập bọc try/catch.** Safari private mode *throw* khi ghi localStorage. Một `try` thiếu ở đây làm trắng cả trang.
2. **Version trong key, không migrate dữ liệu.** Đổi schema → `v2`, và `migrate()` (~10 dòng) chỉ việc xoá sạch `pl:v1:*`. Lý do: toàn bộ dữ liệu này là *tiện nghi*, không có cái nào không thể tái tạo. Viết migration cho nó là over-engineering — và site này dạy đúng điều đó.
3. **Trần 32 KB tổng.** Không bao giờ lưu log, không lưu kết quả thô, không lưu dataset. Chỉ lưu *lựa chọn* và *chỉ số đã rút gọn*.
4. **`compare` dùng `sessionStorage`, không `localStorage`.** Kết quả so sánh phải thuộc về *lần đọc này*. Người quay lại sau 3 tuần mà thấy verdict so sánh với một lần chạy họ không nhớ là trải nghiệm tệ.
5. **Không lưu bất cứ thứ gì do người đọc nhập.** Các lab Attacker Console nhận input tự do; input đó **không bao giờ** được persist. Site dạy least-privilege thì phải làm đúng nó.
6. **Có đường xoá:** footer landing có `Clear my progress` → xoá `pl:v1:*`. Một dòng, nhưng nó là cách duy nhất người đọc biết là họ kiểm soát được.

### 11.5. Lazy-load và cache trong tab

```js
// Trên trang lesson: không nạp lab tới khi stage sắp vào khung nhìn
new IntersectionObserver(async ([e], obs) => {
  if (!e.isIntersecting) return;
  obs.disconnect();
  const { default: lab } = await import(`../scripts/labs/${id}/index.js`);
  lab.mount(stageEl);
}, { rootMargin: "300px" }).observe(stageEl);
```

- **Module singleton = cache tự nhiên.** `import()` cùng một đường dẫn chỉ nạp một lần. Không cần tự viết layer cache nào.
- `rootMargin: 300px` để lab mount xong trước khi người đọc cuộn tới — không ai thấy cái gì "pop" vào.
- **Mạng yếu / `prefers-reduced-data`:** đổi sang nạp theo click, hiện nút `Load the lab (12 KB)` với dung lượng thật. Người đọc được quyền quyết định.
- `scripts/runtime/*` nạp eager trên trang lesson (nhỏ, cần cho skeleton). Trên **landing** chỉ nạp khi lab mini ở khối "How it works" vào khung nhìn — cùng cơ chế `IntersectionObserver` ở trên, không có ngoại lệ riêng.

### 11.6. Cache HTTP và phiên bản asset

| Asset | Chiến lược |
|---|---|
| HTML | ETag mặc định của GitHub Pages. Không cố chỉnh |
| `principles.css`, `lab.css` | **`?v=YYYYMMDD` bump tay** khi sửa. Pages không hash tên file, mà hai file này sửa thường xuyên và sai phiên bản thì layout vỡ ở người đã cache |
| `scripts/**` | ES module có ETag, revalidate nhanh. Không cần `?v=` — và không nên, vì `?v=` trên module làm hỏng cache của các module nó import |
| Google Fonts | `preconnect` (đã có) + `display=swap` (đã có). Không đổi |
| CDN ngoài | **Không có trên site Lab.** Chỉ 2 request ngoài: Google Fonts css + woff2 (§2.2) |

**Service Worker: không, tới hết P3.** Lý do: lợi ích duy nhất là offline, và chưa có ai yêu cầu đọc Lab khi mất mạng. Còn chi phí là một lớp cache phải tự quản version, và một SW stale sẽ hiện phiên bản cũ cho đúng người quay lại nhiều nhất — tức là người đọc trung thành nhất, nhóm duy nhất site này có. Rủi ro không đối xứng. P4 có thể mở lại nếu có lý do mới (§12.5 mảnh E).

### 11.7. Sơ đồ luồng dữ liệu một lần chạy

```text
người đọc bấm Run
   │
   ├─► lab.run({ mode, inputs })            ← T1 bắt đầu
   │      │
   │      ├─► db.query(...)   ─► store.js   ─► accounting += { queries, rowsScanned, ms }
   │      │                        │
   │      │                        └─► logger.emit("query", …)
   │      │                                     │
   │      ├─► clock.wait(ms)  ← sim time, 1×/10×, reduced-motion aware
   │      │                                     │
   │      └─► trả outcome                       ▼
   │                                   ③ Internals (subscriber)
   ├─► ② Response  ← outcome  (aria-live="polite")
   ├─► ④ Verdict   ← fmt(accounting)         ← LUẬT 4c
   └─► persist T2: last[mode] = metrics rút gọn
          │
          └─ đủ cả 2 mode?  ─► data-state="compare"  ─► VerdictBar dạng before→after
```

Điều đáng chú ý về mặt kiến trúc: **③ Internals là subscriber, không phải người gọi.** Nó chỉ nghe `logger`. Nhờ vậy thêm một cách quan sát mới (waterfall, minimap, heatmap) không cần sửa một dòng nào trong `run()` — kể cả khi đã có 18 lab. Đó là separation of concerns, và đây là chỗ nó trả lãi cụ thể nhất trong toàn bộ kiến trúc.

---

## 12. Chi tiết từng phase

Mỗi phase có: **mục tiêu · phạm vi · deliverable · component mới · quyết định UI phải chốt · tiêu chí xong (kiểm được) · tripwire.**

### 12.1. P0 — Chassis & Shell (nền móng)

**Mục tiêu:** một lab **rỗng** chạy được với đủ 4 vùng và đủ 6 trạng thái. Không có nội dung thật nào. Đây là phase mà 80% rủi ro thiết kế được loại bỏ.

**Phạm vi — làm gì**

| Deliverable | Nội dung |
|---|---|
| `source/principles.css` | token bổ sung (mono, signal, motion, spacing), shell 8 khối, hub layout |
| `source/lab.css` | kernel 4 vùng, 6 trạng thái, 14 kernel component (§8.2) |
| `scripts/runtime/` | `store.js`, `server.js`, `clock.js`, `logger.js`, `lab.js`, `fmt.js`, `rng.js`, `persist.js` |
| `scripts/data/seed.js` | generator có seed cho candidates / companies / users / transactions |
| `scripts/data/catalog.js` | schema + 3 entry MVP (chưa cần đủ 18) |
| `principles/_template.html` | khung 8 khối, comment hướng dẫn điền |
| `principles/_states.html` | **gallery: mọi component × 6 trạng thái** |
| Lab rỗng `scripts/labs/_demo/` | 1 control, 1 response giả, 1 log 20 dòng, 1 verdict |

**Component mới:** toàn bộ 14 kernel component ở §8.2. Không có instrument nào.

**Vì sao `_states.html` là deliverable quan trọng nhất của P0:** nó là chỗ bạn thiết kế `idle`, `error` và `compare` **một lần, kỹ**, thay vì mỗi lab tự ứng biến lúc đã mệt. Trong 18 trang, đó là 18 × 3 quyết định được thay bằng 3 quyết định. Nó cũng là trang bạn mở ra để review nhanh mọi khi sửa `lab.css`. Đặt `<meta name="robots" content="noindex">` và không link từ đâu cả.

**Quyết định UI phải chốt trong P0** (chốt xong thì 17 trang sau không phải nghĩ lại):

1. Chiều cao tối thiểu của stage và cách giữ chỗ để CLS < 0.1.
2. Hình dạng `ModeSwitch` ở cả 3 trạng thái (naive / principled / đang chuyển).
3. Hình dạng `idle` của một panel trống: khung + trục + câu mời gọi.
4. Hình dạng `error`: lỗi mô phỏng hiện **như dữ liệu**, không như lỗi trang.
5. Hình dạng `compare`: before → after nằm đâu, chữ gì, có tỉ lệ không.
6. Vị trí và kích cỡ `ModelNote` + `SafetyLine`.

**Tiêu chí xong (kiểm được)**

- [ ] `_states.html` hiện đủ 14 component × 6 trạng thái, không ô nào trống.
- [ ] Lab rỗng chạy được: idle → running → settled → reset → idle, 3 lần, trạng thái giống hệt.
- [ ] Tắt JS → `<noscript>` hiện bảng tĩnh, **không có khung trắng nào**.
- [ ] 360px: không horizontal scroll ở cấp trang.
- [ ] Tab-through đi hết lab; screen reader đọc được Response khi nó đổi.
- [ ] `prefers-reduced-motion`: lab vẫn tiết lộ dần theo 3 bậc.
- [ ] Lighthouse ≥ 95 cả 4 mục trên trang lab rỗng.
- [ ] `wc -c` mọi file trong trần §2.2.

**[TRIPWIRE]** Nếu cuối P0 mà `lab.js` > 300 dòng → runtime đang gánh việc của lab. Đọc lại §11.3 (runtime không được tối ưu hộ) trước khi sang P1.

---

### 12.2. P1 — MVP 3 lab + hub

**Mục tiêu:** chứng minh runtime dùng chung **thật sự dùng chung được** qua 3 khuôn tương tác khác nhau (A, B, C) và 3 category khác nhau — đồng thời chứng minh mô hình 3 tầng cho phép 3 stage **khác hình hoàn toàn** mà vẫn một nhịp đọc.

**Phạm vi**

| Deliverable | Ghi chú |
|---|---|
| `n-plus-one-query.html` + lab | khuôn A, `data`, stage-bg `deep` |
| `sql-injection-contact-form.html` + lab | khuôn B, `security`, stage-bg `void`, có `SafetyLine` trong stage |
| `one-rule-five-places.html` + lab | khuôn C, `code-design`, stage-bg `raised` |
| `principles/index.html` | **landing riêng của Lab**: hero + how-it-works + **lab mini nhúng** + catalog (filter chips, card grid, `Surprise me`) + footer riêng |
| `scripts/hub.js` | filter bằng `data-*` + `classList`; đọc `pl:v1:hub` |
| `index.html` của portfolio | **không chạm vào.** Không nav link, không section giới thiệu (LUẬT 0) |
| `tests/isolation.test.mjs` | canh LUẬT 0 trong CI |
| `tools/check-contract.mjs` | kiểm điều 1, 2, 7, 8 của Stage Contract |

**Component mới:** 8 instrument của P1 ở §8.3 (`TimingWaterfall`, `QueryLogStream`, `RowTable`, `StringBuilder`, `LeakTable`, `FileGraph`, `ScreenTiles`, `DiffColumns`).

**Quyết định UI chốt trong P1**

1. **Số trên landing phải tính từ `catalog.js`, không hardcode.** Plan cũ viết hero là `18 problems · 6 categories`. Ở P1 mới có 3 trang — hiện "18" là nói sai ngay ở dòng đầu tiên người đọc gặp. Chốt: hiện `3 problems · 3 of 6 categories · every one runnable`. Trung thực và vẫn ấn tượng, vì chữ "runnable" mới là chỗ mạnh.
2. Card trong catalog hiện **symptom**, không hiện tên nguyên lý (đã chốt ở plan cũ, nhắc lại vì dễ làm sai lúc code).
3. Mặc định sort theo `blast-radius` giảm dần.
4. Hình dạng của filter chip khi không có kết quả: hiện câu gợi ý bỏ filter nào, **không** hiện "0 results".

**Tiêu chí xong**

- [ ] **Bài test người lạ:** 2 người không biết dự án, mở link **landing** (không phải link trang lesson), và **tự tìm được một trang rồi bấm ra verdict** mà không cần bạn giải thích. Đây là tiêu chí duy nhất thật sự quan trọng của P1 — và phải test từ landing, vì landing giờ là cửa vào duy nhất của site.
- [ ] Ba stage **trông khác hẳn nhau** — đặt 3 ảnh chụp cạnh nhau, không ai nói "cùng một template".
- [ ] Nhưng cả ba đọc theo thứ tự ①②③④ khi tắt CSS.
- [ ] `check-contract.mjs` pass cả 3 trang.
- [ ] `compare` hoạt động: chạy 2 mode → verdict tự ghép.
- [ ] Deep-link `?mode=&rows=` khôi phục đúng state (nếu kịp; nếu không, đẩy sang P2).
- [ ] Lab SQL injection: không chỗ nào khiến người đọc nghĩ site có lỗ hổng thật.

**[TRIPWIRE]** Tới lab thứ 3 mà phải **sửa `lab.js`** để làm được stage → thiết kế runtime sai. Dừng, sửa runtime, rồi mới viết lab 4. (Plan cũ đã nêu; mình giữ y nguyên vì nó đúng.)

---

### 12.3. P2 — Chiều sâu dụng cụ

**Mục tiêu:** mở hai khuôn khó nhất — **D (Load Dial)** và **E (Race Track)** — vì đây là hai khuôn có *thời gian* và *đồng thời*, thứ mà không demo blog nào làm. Và làm catalog đủ card để filter *thật sự có ích*.

**Phạm vi:** +5 trang (tổng 8).

| Trang | Khuôn | Lý do chọn vào P2 |
|---|---|---|
| `no-index-no-mercy` | D | mở `LiveChart` + `PlanBox` + chiều ngược (INSERT) |
| `double-click-double-charge` | E | mở `DualTrack` + `RaceWindow` + 2 hue identity |
| `offset-vs-cursor-pagination` | A | dùng lại khuôn A → kiểm chứng instrument P1 có tái dùng được |
| `trusting-the-client` | B | dùng lại khuôn B |
| `the-function-that-does-seven-things` | G | mở `ComplexityGauge` sớm để P3 nhẹ hơn |

**Component mới:** `LoadDial`, `LiveChart`, `PlanBox`, `ScanBar`, `DualTrack`, `RaceWindow`, `LedgerList`, `InsertCounter`, `ComplexityGauge`.

**Block mới ở cấp site:** prev/next trong cùng category; progress `localStorage` (`pl:v1:read`); `Surprise me`; `Copy link to this run` (deep-link §10.3).

**Quyết định UI chốt trong P2**

1. **Trục của `LiveChart`:** fix scale hay auto scale? Chốt **fix theo kịch bản**, vì auto scale làm đường cong *trông giống nhau* ở mọi mức tải — mà sự khác nhau chính là bài học. Nếu vượt trần thì hiện `clipped at Xms` rõ ràng.
2. **Hai hue identity** (`--id-a`, `--id-b`) được đưa vào `lab.css` vì nay dùng ở 2 lab → rule-of-two (§8.1).
3. **Cửa sổ race hiện thế nào:** vệt mờ `--sig-warn` phủ lên timeline + nhãn `race window: 180 ms`. Không dùng animation nhấp nháy — nó làm người đọc mất chỗ đang nhìn.
4. **Chiều ngược của index** (INSERT chậm đi): tab riêng trong stage, không nhét vào cùng khung. Trang chỉ "senior" khi chiều ngược được trình bày **ngang hàng**, không phải như một chú thích.

**Tiêu chí xong**

- [ ] Filter trên catalog **có ích thật**: 8 card, bỏ filter đi thì khó tìm.
- [ ] 2 lab tái dùng khuôn (A, B) viết xong trong **≤ 2 giờ mỗi cái**. Nếu lâu hơn → runtime chưa đủ tốt, và đó là tín hiệu quan trọng hơn cả việc có thêm trang.
- [ ] `LiveChart` mượt ở 60fps trên máy tầm trung với 200 điểm.
- [ ] Khuôn E đúng về mặt kỹ thuật: người đọc hiểu được *vì sao* race xảy ra, không chỉ thấy nó xảy ra.
- [ ] Deep-link hoạt động trên cả 8 trang.

**[TRIPWIRE]** `lab.css` > 18 KB → có pattern chỉ dùng 1 lần bị nhấc lên sớm. Đẩy về stage.

---

### 12.4. P3 — Hoàn thiện

**Mục tiêu:** đủ 18 trang, mở khuôn F/G còn lại, và **thêm lớp thông tin thứ hai**: trang tổng hợp theo Principle. Đây là phase site chuyển từ "bộ sưu tập trang" thành "một cấu trúc kiến thức".

**Phạm vi**

| Deliverable | Ghi chú |
|---|---|
| +10 trang (tổng 18) | theo backlog plan cũ §7 |
| `principles/by/<principle>.html` | trang theo nguyên lý: liệt kê problem minh hoạ nó (quan hệ nhiều-nhiều) |
| `PrincipleMap` | SVG principle ↔ problem, là trái tim của trang tổng hợp |
| Sơ đồ SVG cho khối ④ mỗi trang | 18 sơ đồ viết tay |
| `tools/stamp.mjs` | **tripwire §2.3 đã nổ từ trang thứ 6** — làm ở đây là muộn nhất |
| `tools/og.mjs` | ảnh OG mỗi trang: symptom + cặp số before/after |
| `tools/budget.mjs` | báo cáo kích thước vs trần |

**Component mới:** `VersionPicker`, `ContractDiff`, `ClientScreen`, `RequirementList`, `CodeSideBySide`, `PrincipleMap`, `OgCard`.

**Quyết định UI chốt trong P3**

1. **Trang principle trông thế nào để không trùng catalog.** Chốt: catalog sắp theo *mức thiệt hại*, trang principle sắp theo *mức độ sâu* (`foundational → advanced`) và mở đầu bằng **một phát biểu nguyên lý + điều kiện biên**, không bằng grid card. Hai trang khác nhau về *câu hỏi*, nên khác nhau về *hình*.
2. **Ảnh OG:** sinh ra, không vẽ tay 18 lần. Template: nền navy, branch color làm vạch trái, symptom 2 dòng, cặp số mono lớn. Phải đọc được ở **kích thước thumbnail** (≈ 240px rộng) — đó là cách nó thật sự xuất hiện khi link được dán vào một chat nhóm hay một PR comment.
3. **`ClientScreen` gãy thật tới đâu:** hiện `undefined` và màn trắng thật trong một frame riêng, kèm nhãn `simulated client`. Không nhái UI của bất kỳ sản phẩm thật nào.

**Tiêu chí xong**

- [ ] 18/18 trang pass Stage Contract 10 điều (chạy `check-contract.mjs`).
- [ ] Dán link vào một chat nhóm / mạng xã hội: preview tử tế — kiểm bằng validator của chính nền tảng đó, và đọc thử ở cỡ thumbnail.
- [ ] Không còn copy tay HTML; `stamp.mjs` là đường duy nhất tạo trang.
- [ ] Trang principle dẫn chéo đúng quan hệ nhiều-nhiều, không có link chết.
- [ ] Mọi trang có khối ⑥ Trade-offs **không rỗng** (LUẬT 6b).

**[TRIPWIRE]** Nếu tới trang 12 mà nhiệt độ giảm: **dừng ở 12**, làm thật tốt, cập nhật `catalog.js`. 12 trang hoàn chỉnh đánh bại 18 trang nửa vời — và landing tính số từ catalog nên không có chỗ nào "trông như bỏ hoang".

---

### 12.5. P4 — Mở

**Mục tiêu:** cho site sống tiếp mà không cần bạn viết thêm trang mới mỗi tuần.

| Deliverable | Ghi chú |
|---|---|
| Bản tiếng Việt `/vi/` | **Chỉ dịch khối văn xuôi (①②④⑤⑥⑦⑧).** Stage giữ nguyên tiếng Anh — vì status code, SQL, `rows scanned` dịch ra là *sai*, không phải khó đọc |
| `LangToggle` | nhớ qua `pl:v1:prefs.lang` |
| RSS / changelog | sinh từ `catalog.js` (`tools/rss.mjs`) |
| `ProgressDashboard` | "bạn đã đọc 7/18, còn 2 category chưa chạm" |
| Submit problem | form (Formspree hoặc GitHub Issue link) — **không** backend |
| Mở lại quyết định SW | chỉ nếu có lý do mới (§11.6) |

**Quyết định UI chốt:** ranh giới dịch. Mình chốt **không dịch stage** vì instrument mô phỏng một hệ thống thật, và hệ thống thật nói tiếng Anh. Dịch `Seq Scan on candidates` thành tiếng Việt làm instrument mất tính xác thực — đúng cái tài sản duy nhất site này có.

**Tiêu chí xong:** có người đọc **gửi về một problem** mà bạn thấy đáng làm. Đó là tín hiệu site đã thành một chỗ người ta quay lại, không còn là một thứ bạn tự đẩy ra.

---

## 13. Rulebook — luật cứng, để trích dẫn khi review

| # | Luật | Mục |
|---|---|---|
| **0** | **Lab và portfolio không tham chiếu nhau: không link hai chiều, không CSS dùng chung, không nội dung về kinh nghiệm tác giả** | plan §1.1 |
| 1 | Nền trang luôn thuộc họ navy. Lab đổi nền *sân khấu*, không đổi nền *trang* | §3.1 |
| 2a | Branch color chỉ ở **khung**; signal color ở **ruột** | §3.2 |
| 2b | Không bao giờ dùng màu một mình — luôn kèm glyph / vị trí / hình dạng | §3.3 |
| 3 | **Naive không mặc định đỏ.** Chỉ hậu quả mới lên màu | §3.3 |
| 4a | Sans = người nói. Mono = máy nói | §4.1 |
| 4b | Văn xuôi ≤ 68ch; instrument không giới hạn | §4.2 |
| 4c | Số đo = mono + tabular-nums + đơn vị + giữ chỗ trước | §4.3 |
| 5 | Thứ tự DOM = ①②③④. Sắp xếp lại chỉ bằng `grid-area` | §1.4 |
| 6a | Stage là khối full-bleed duy nhất của trang | §5.2 |
| 6b | Khối Trade-offs không được rỗng | §5.2 |
| 7a | Không hardcode số — mọi số truy nguyên về accounting | §4.3 |
| 7b | Instrument không có `ModelNote` → reject | §4.4 |
| 7c | Dữ liệu sinh từ `rng(seed)`, seed in trong `ModelNote` | §11.2 |
| 7d | **Runtime phải trung thực, không được tối ưu hộ** | §11.3 |
| 8 | ≤ 2 hue mới mỗi stage | §3.4 |
| 9 | CSS stage scoped `.stage--<id>`, ≤ 120 dòng | §7.1 |
| 10 | Rule of **two** cho hình, rule of **three** cho logic | §8.1 |
| 11 | 360px trước desktop. Trang không bao giờ scroll ngang | §5.4 |
| 12a | Chỉ 4 tầng lưu trữ. Không IndexedDB, không cookie, không server | §11.1 |
| 12b | Key format `pl:<ver>:<scope>[:<id>]` | §11.4 |
| 12c | Mọi truy cập storage bọc try/catch | §11.4 |
| 13 | Không Service Worker tới hết P3 | §11.6 |
| 14 | Không thư viện cho logic lab (chart, highlight, framework) | §2.1 |
| 15 | Sáu trạng thái bắt buộc, cái nào cũng phải trông cố ý | §7.2 |
| 16 | Trần 4 giây mỗi lần chạy; luôn có `Skip` và `Esc` | §6.2 |
| 17 | Reduced-motion = stepped reveal, **không** xoá reveal | §6.3 |
| 18 | Không persist bất cứ gì người đọc nhập vào | §11.4 |

---

## 14. Review gate — mình chấm một lab thế nào

Khi bạn nói "lab X xong rồi", mình chấm theo 7 trục, mỗi trục 0–2 điểm. **Pass = ≥ 11/14 và không trục nào 0.**

| Trục | 0 | 1 | 2 |
|---|---|---|---|
| **Trung thực** | số hardcode, không `ModelNote` | có `ModelNote` nhưng mơ hồ | mô hình phát biểu bằng số, seed công bố, jitter thật |
| **Hình đúng vấn đề** | dùng khung của lab khác cho tiện | khung đúng nhưng nhạt | hình chỉ dùng được cho đúng vấn đề này |
| **Mắt biết nhìn đâu** | nhiều thứ động cùng lúc | có điểm nhấn | có đúng một thứ dạy học, không bỏ sót được |
| **6 trạng thái** | idle/error chưa thiết kế | có nhưng thô | cả 6 đều trông cố ý, `compare` tự ghép |
| **Trade-off** | rỗng hoặc sáo | có nhưng chung chung | nêu được *khi nào áp dụng nguyên lý này là sai* |
| **Mobile + a11y** | scroll ngang / không tab được | dùng được | 360px gọn, keyboard đủ, SR đọc được response |
| **Hợp đồng** | vi phạm ≥ 2 điều §7.1 | vi phạm 1 điều | pass cả 10 |

Và một bài test ngoài rubric, quan trọng hơn rubric: **bài test người lạ 90 giây.** Đưa link cho người chưa biết dự án, không nói gì. Trong 90 giây họ phải tự bấm được ra verdict. Không đạt thì điểm rubric bao nhiêu cũng không cứu được — vì cả site tồn tại để làm đúng việc đó.

---

## 15. Những chỗ mình đổi so với plan cũ

Ghi lại để sau này đọc vẫn biết tại sao.

| # | Plan cũ | Mình đổi thành | Lý do |
|---|---|---|---|
| 1 | "Giữ 4 vùng ở đúng một chỗ trên mọi trang" (§5.1) | Khoá **ngữ nghĩa + thứ tự DOM**, mở **hình học** | Nguyên văn luật cũ **cấm** chính thứ bạn yêu cầu (layout riêng mỗi lab). Thứ tự DOM đã đủ giữ nhịp đọc cho screen reader, keyboard, mobile và khi CSS fail |
| 2 | Reliability = `#a5d6ff` | `#b5e853` | `#a5d6ff` cách API `#79c0ff` ~15° hue, cùng xanh nhạt → pill cạnh nhau không phân biệt được, nhánh mất chức năng |
| 3 | Không nói về font mono | Thêm mono hệ thống + **tabular-nums bắt buộc** | Không có tabular-nums thì mọi counter rung khi đếm, và lab trông như đồ chơi. 0 byte thêm |
| 4 | "Ghi rõ simulated" | Component **`ModelNote`** phát biểu mô hình bằng số | "Simulated" là xin lỗi. Một mô hình công bố được là giả định kiểm chứng được — đó là khoảng cách junior/senior, và site nên đứng ở phía sau |
| 5 | Không có | **`_states.html`** gallery 6 trạng thái | Thiết kế `idle`/`error`/`compare` một lần thay vì 18 lần ứng biến. Deliverable có ROI cao nhất của P0 |
| 6 | Không có | **Deep-link state** `?mode=&rows=` | ~25 dòng code, đổi lấy khả năng *gửi một trạng thái hỏng* cho người khác. Tỉ lệ giá trị/chi phí cao nhất danh sách |
| 7 | reduced-motion → tắt animation | → **stepped reveal 3 bậc** | Tắt hết thì người bật setting đó mất toàn bộ nội dung dạy học của lab |
| 8 | "Copy `_template.html`" cho 18 trang | Copy tay tới trang 5, **trang 6 nổ tripwire** → `stamp.mjs`, commit HTML sinh ra | 18 file copy tay là đúng cái `one-rule-five-places` site đang dạy. Trì hoãn có chủ ý + ghi lại thành changelog biến nó thành bằng chứng, không phải lỗi |
| 9 | Hub hero `18 problems · 6 categories` | Số **tính từ `catalog.js`** | Ở P1 mới có 3 trang. Hiện "18" là nói sai với đúng người bạn muốn thuyết phục |
| 10 | Không nói | **Runtime không được tối ưu hộ** (LUẬT 7d) | Bẫy tinh vi nhất của kiến trúc: `store.js` tự cache thì lab N+1 không còn 101 query, bài học bốc hơi |
| 11 | Không nói | Dữ liệu **sinh từ PRNG có seed**, không ship JSON | 50k dòng JSON = ~4MB. Sinh ra = 0 byte, ~15ms, **và lặp lại được** nên số liệu bạn công bố kiểm chứng được |
| 12 | Không nói | **Không SW, không light mode, không analytics** tới P4 | Mỗi cái là một diện tích bảo trì đổi lấy một nhu cầu chưa ai yêu cầu |

### Đợt sửa thứ hai — bỏ định vị portfolio (2026-10-24)

Sau khi bạn làm rõ: Lab là **site học tập độc lập**, ở sub-path của domain, có landing riêng, **không** map với portfolio. Sáu thay đổi dưới đây là hệ quả, và chúng chạm vào nhiều mục nên ghi riêng thành một đợt.

| # | Bản trước | Đổi thành | Lý do |
|---|---|---|---|
| 13 | Badge `Seen in production` ở hero + card, link tới case study trong `pages/` | **`ProvenanceTag`**: `Classic problem` / `From the field` / `Constructed example` | Badge cũ nói về *CV của tác giả*; nhãn mới nói về *xuất xứ của vấn đề*. Giữ nguyên giá trị chống-nói-quá, bỏ phần phụ thuộc portfolio. Rà soát cho thấy badge **chưa từng là component** (chỉ nằm trong sơ đồ §5.2 + §9.4) nên đây là sửa spec, không phải xoá code — §8.2 |
| 14 | `case-nav` dùng chung + tên tác giả ở góc phải; trang chủ portfolio có nav link + section 3 card | **Nav + footer riêng của Lab**; portfolio **không chạm vào** | Hai site độc lập thì không chia sẻ nav. Và nav chung là cái khiến người đọc tưởng đang xem portfolio — đúng điều cần tránh — §5.2 |
| 15 | "Giữ nguyên 100% token trong `source/styles.css`"; stage-bg "dùng lại giá trị của `case-study.css` để nối liền với case study" | **Lab khai token riêng trong `principles.css`**; stage-bg được biện minh bằng **bậc sáng + contrast**, không bằng nguồn gốc | Hai site đổi vì hai lý do khác nhau → hai nguồn. Trùng *giá trị* không phải chung *nguồn*; gộp lại là coupling, không phải DRY — §3.1, §3.4 |
| 16 | Hub page = filter + grid, nằm trong một site lớn hơn | **Landing đầy đủ**: hero → how-it-works + **lab mini nhúng** → browse by category → catalog → footer | Không còn trang chủ portfolio làm việc giới thiệu. Landing phải tự thuyết phục trong 10 giây đầu, và cách rẻ nhất là cho người ta bấm thử ngay — plan §5.5 |
| 17 | Khối ⑦ *From experience* — trải nghiệm của tác giả | Khối ⑦ ***Where this bites in practice*** — vấn đề xuất hiện ở đâu, dấu hiệu sớm | Người đọc không cần biết tác giả là ai mới dùng được trang. Đồng thời xoá luôn động cơ phóng đại kinh nghiệm — plan §4.1, §9.4 |
| 18 | Lý lẽ dựa trên "recruiter / người phỏng vấn / một portfolio không cần offline" | Lý lẽ dựa trên **3 persona học tập**, đặc biệt **người dạy** | Lý lẽ sai người đọc sẽ kéo thiết kế lệch dần. Persona "người dạy" là lý do deep-link, OG image và lab-không-cần-cài-đặt được ưu tiên cao — plan §2.2 |

**Thêm một luật mới:** [LUẬT 0] ở §13, và nó được **canh bằng test** (`tests/isolation.test.mjs`), không chỉ bằng tài liệu. Lý do: isolation là loại ràng buộc bị phá bởi một lần "thêm tạm một link cho tiện", và sáu tháng sau không ai nhớ vì sao nó từng quan trọng.

Một chỗ mình **không** đổi, dù có thể bị cho là mâu thuẫn: giữ nguyên "không build step" ở P0–P2 *đồng thời* dự đoán nó sẽ hỏng ở trang thứ 6. Đó không phải mâu thuẫn — đó là *reversible decision* được quản lý đúng cách, và nó là ví dụ sống cho đúng trang `build-it-for-the-future`.

---

## 16. Bước tiếp theo ngay

1. **Đọc §3 và §7.** Hai mục này là 80% giá trị tài liệu. Nếu bạn không đồng ý chỗ nào trong đó, nói trước khi mình code — sửa luật thì rẻ, sửa 8 lab đã viết thì không.
2. **Mình dựng P0**, theo đúng thứ tự: `principles.css` → `lab.css` → `runtime/` → `_states.html` → lab rỗng.
3. **Bạn review `_states.html`** trước khi mình viết lab thật đầu tiên. Đây là điểm kiểm soát quan trọng nhất của cả dự án: ở đó bạn thấy toàn bộ ngôn ngữ thị giác của 18 trang, trong một màn hình, trước khi nó bị nhân bản.
4. Chốt xong `_states.html` → làm `n-plus-one-query` trọn vẹn làm chuẩn tham chiếu.
5. Rồi mới sang lab 2, lab 3 — và kiểm đúng một điều: **mình có phải sửa `lab.js` không.** Nếu có, runtime sai, sửa trước khi viết tiếp.
6. Dựng **landing riêng của Lab** (§12.2) — và nhớ: `index.html` của portfolio **không được chạm vào** (LUẬT 0). Trước khi commit P1, chạy `tests/isolation.test.mjs`.
