# P05 — Mở (sống tiếp mà không cần viết trang mới mỗi tuần)

> **Tương ứng:** UI plan §12.5 (P4) · plan cũ §8 (P4).
> **Mục tiêu:** cho site sống tiếp mà không phụ thuộc vào việc bạn còn nhiệt. Chuyển từ *một sản phẩm đã xong* sang *một chỗ*.
> **Ước lượng:** mở (làm từng mảnh, mỗi mảnh độc lập) · **Tiền đề:** P04 exit gate xanh.
> **Lưu ý:** P05 là phase **duy nhất được phép làm từng phần và dừng giữa**. Mỗi mảnh dưới đây là một đơn vị giao hàng độc lập, có cổng riêng.

---

## 1. Phạm vi — 5 mảnh độc lập

| # | Mảnh | Giá trị | Chi phí | Ưu tiên |
|---|---|---|---|---|
| A | Bản tiếng Việt `/vi/` + `LangToggle` | mở ra toàn bộ thị trường tuyển dụng VN | cao nhất | 1 |
| B | RSS / changelog sinh từ `catalog.js` | người đọc quay lại mà không cần bạn nhắc | thấp | 2 |
| C | `ProgressDashboard` | "bạn đã đọc 7/18, còn 2 category chưa chạm" | thấp | 3 |
| D | Submit problem (form, **không backend**) | biến người đọc thành nguồn nội dung | thấp | 4 |
| E | Mở lại quyết định Service Worker | **chỉ nếu có lý do mới** | — | 5 |

Làm theo thứ tự ưu tiên. **Mảnh A một mình đã đáng giá hơn B+C+D cộng lại** — làm nó trước, và nếu chỉ làm được một mảnh thì làm nó.

---

## 2. Mảnh A — Bản tiếng Việt `/vi/`

### Quyết định ranh giới dịch (quan trọng nhất của P05)

**Chỉ dịch khối văn xuôi ①②④⑤⑥⑦⑧. Stage (③ và mọi instrument) giữ nguyên tiếng Anh.**

Lý do: status code, SQL, `rows scanned`, `Seq Scan on candidates` dịch ra là **sai**, không phải khó đọc. Instrument mô phỏng một hệ thống thật, và hệ thống thật nói tiếng Anh. Dịch nó làm instrument mất tính xác thực — đúng cái tài sản duy nhất site này có.

### Thực thi

| Bước | Action | Target |
|---|---|---|
| A.1 | `catalog.js` thêm field `i18n.vi` cho `symptom`, `verdict`, `title` | một nguồn, hai ngôn ngữ — không fork catalog |
| A.2 | `labs/content/<slug>.vi.html` — partial tiếng Việt, **chỉ khối văn xuôi** | thiếu file `.vi` → `stamp.mjs` **bỏ qua trang đó ở bản vi**, không sinh trang nửa dịch |
| A.3 | `stamp.mjs` sinh `/vi/<slug>.html` từ partial vi + **cùng** stage/script tiếng Anh | stage là file dùng chung, không nhân bản |
| A.4 | `LangToggle` — nhớ qua `pl:v1:prefs.lang` | scope `prefs` đã có whitelist từ P01; không thêm scope mới |
| A.5 | `hreflang` + `<link rel="alternate">` cho cặp en/vi | SEO đúng, không bị đánh trùng nội dung |

**Chống nửa vời:** nếu một trang chưa có bản vi, `LangToggle` trên trang đó **hiện nhưng nói rõ** "bản tiếng Việt chưa có cho trang này" và dẫn về `/vi/` index. Không bao giờ dẫn tới 404 — đó là cách nhanh nhất làm site trông bỏ hoang.

---

## 3. Mảnh B — RSS / changelog

| Bước | Action |
|---|---|
| B.1 | `tools/rss.mjs` sinh `feed.xml` từ `catalog.js` (cần thêm field `publishedAt` cho mỗi entry) |
| B.2 | `labs/changelog.html` — sinh cùng lúc, liệt kê theo ngày, **có cả dòng về `stamp.mjs` ra đời ở P04** |
| B.3 | `<link rel="alternate" type="application/rss+xml">` trên landing |
| B.4 | Thêm `rss.mjs` vào `npm run build` |

**Target:** changelog là chỗ hiếm hoi mà **lịch sử kỹ thuật của chính site** trở thành nội dung. Dòng "trì hoãn generator tới trang thứ 6, đây là commit" thuộc về đây.

---

## 4. Mảnh C — `ProgressDashboard`

- Đọc `pl:v1:read` (đã có từ P03), hiện `7/18 đã đọc · 2 category chưa chạm`.
- Nằm trên landing, **không** thành trang riêng (một trang riêng cho tiến độ của một người là over-engineering — chính là bài học `build-it-for-the-future`).
- Storage bị chặn → dashboard **ẩn hoàn toàn**, không hiện `0/18` (hiện 0/18 cho người vừa đọc 10 trang là nói sai).

---

## 5. Mảnh D — Submit problem

- Form → **Formspree** hoặc link mở sẵn **GitHub Issue** với template. **Không backend** (LUẬT 12a).
- Nếu dùng Formspree: thêm một dòng trên chính form nói rõ dữ liệu đi đâu. Site dạy least-privilege và "không analytics âm thầm" thì không được âm thầm gửi form đi đâu cả.
- **Khuyến nghị: chọn GitHub Issue.** Không third-party, không email, và người gửi thấy được vấn đề của họ công khai — điều đó làm họ quay lại.

---

## 6. Mảnh E — Service Worker: mở lại hay không

**Mặc định vẫn là KHÔNG** (LUẬT 13). Chỉ mở lại nếu có **lý do mới**, cụ thể là một trong hai:

1. Có số đo thật cho thấy người đọc ở mạng chậm bỏ trang trước khi lab nạp xong.
2. Có nhu cầu offline thật từ người dùng thật (không phải suy đoán).

Không có lý do mới → **không làm**, và ghi vào `decisions.log` là đã xem xét lại và giữ nguyên. Một quyết định được xem xét lại và giữ nguyên **có giá trị khác** một quyết định chưa bao giờ được xem lại.

---

## 7. Mock test bắt buộc (G4)

| Mảnh | File test | Case tối thiểu |
|---|---|---|
| A | `tests/i18n.test.mjs` | mỗi `/vi/<slug>.html` có **cùng số khối văn xuôi** với bản en; **stage/instrument text không bị dịch** (grep chuỗi tiếng Việt trong vùng `data-zone="internals"` → phải rỗng); thiếu partial vi → không sinh trang; `LangToggle` persist đúng `pl:v1:prefs.lang`; `hreflang` thành cặp đủ hai chiều |
| B | `tests/rss.test.mjs` | `feed.xml` well-formed XML; số item = số entry có `publishedAt`; ngày đúng RFC 822; link tuyệt đối tới domain; changelog có dòng `stamp.mjs` |
| C | `tests/progress-dashboard.test.mjs` | `7/18` tính từ storage; storage throw/chặn → dashboard **ẩn**, không hiện `0/18`; "category chưa chạm" đếm đúng từ catalog |
| D | `tests/submit.test.mjs` | link GitHub Issue có template đúng; nếu dùng Formspree thì có dòng công bố đích dữ liệu (test grep) |
| E | — | không có test; chỉ một dòng `decisions.log` |

**Regression:** suite P01–P04 pass không sửa. Mảnh A là lần đầu `stamp.mjs` sinh 2 ngôn ngữ — `tests/stamp.test.mjs` phải vẫn pass **nguyên văn** cho bản en.

---

## 8. Self-check

### Cổng tự động

```bash
npm run build         # stamp (en + vi) -> --check -> verify -> rss
npm test
npm run check:links   # ca /vi/, hreflang hai chieu
npm run check:budget  # /vi/ khong lam trang nao vuot tran
```

### Checklist tay

- [ ] Mở `/vi/n-plus-one-query.html`: văn xuôi tiếng Việt, **stage vẫn tiếng Anh**, và điều đó **đọc tự nhiên** chứ không như lỗi dịch sót.
- [ ] `LangToggle` giữ lựa chọn khi sang trang khác.
- [ ] Trang chưa có bản vi: toggle nói rõ, **không 404**.
- [ ] `feed.xml` nạp được trong một RSS reader thật (không chỉ validator).
- [ ] Dashboard ẩn hoàn toàn khi chặn storage.
- [ ] Form submit: gửi thử 1 lần thật, nhận được thật.
- [ ] M1–M7 trên 2 trang `/vi/` đại diện.

### Kiểm tiêu cực

| # | Phá | Kỳ vọng |
|---|---|---|
| 1 | Dịch `Seq Scan on candidates` sang tiếng Việt trong partial vi | `i18n.test.mjs` fail (ranh giới dịch) |
| 2 | Xoá 1 partial `.vi` | trang đó không được sinh; toggle nói rõ; `check-links` không báo link chết |
| 3 | Chặn storage | dashboard ẩn, `LangToggle` vẫn hoạt động (chỉ không nhớ) |
| 4 | Thêm analytics script | **không có test nào bắt được** → thêm ngay một test grep chặn script bên thứ ba ngoài whitelist (`fonts.googleapis.com`, `cdn.simpleicons.org`). Đây là lỗ hổng duy nhất còn lại của bộ cổng, bịt nó ở P05 |

---

## 9. Exit gate (theo từng mảnh, không phải cả phase)

Mỗi mảnh xong = cổng của mảnh đó xanh + commit riêng:

- [ ] A: `feat(p05a): vietnamese edition`
- [ ] B: `feat(p05b): rss + changelog`
- [ ] C: `feat(p05c): progress dashboard`
- [ ] D: `feat(p05d): submit a problem`
- [ ] E: `docs(p05e): service worker re-reviewed, decision unchanged`

**Tiêu chí xong của cả P05 (và của cả dự án):** có người đọc **gửi về một problem mà bạn thấy đáng làm**. Đó là tín hiệu site đã thành một chỗ, không còn là một CV.

Tín hiệu thật thứ hai, quan trọng không kém: **có người gửi link một trang cụ thể cho người khác** — trong một PR review, một chat nhóm, một buổi onboard. Khi điều đó xảy ra, ghi lại trang nào — nó cho biết trang nào đang làm việc, và trang nào chỉ đang tồn tại.

---

## 10. Tripwire

| Dấu hiệu | Hành động |
|---|---|
| Dịch tới trang thứ 5 thì chán | **Dừng.** Dịch 5 trang mạnh nhất là đủ; 18 bản dịch nửa vời tệ hơn 5 bản tốt. `stamp.mjs` đã xử lý trang thiếu bản vi một cách tử tế |
| Muốn thêm backend cho submit | Không (LUẬT 12a). GitHub Issue đã giải quyết vấn đề thật |
| Muốn thêm analytics "để biết người đọc làm gì" | Nếu thêm thì **phải ghi rõ trên trang** (§2.1 UI plan). Site dạy least-privilege không được âm thầm theo dõi. Khuyến nghị: không thêm; dùng tín hiệu thật ở mục 9 |
| Muốn làm lại thiết kế từ đầu vì "giờ nhìn thấy chỗ sai" | Ghi danh sách vào `decisions.log`, làm thành P06 có phạm vi rõ. Không refactor mở giữa P05 |
| Site đứng yên 3 tháng | Không phải vấn đề. 18 trang chạy được không cần cập nhật để còn giá trị. Chỉ cần `npm run build` vẫn xanh khi bạn quay lại — và đó là lý do P00 tồn tại |
