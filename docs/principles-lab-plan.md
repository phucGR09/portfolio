# Principles Lab — Phân tích mục tiêu & thiết kế tính năng

> Tài liệu định hướng cho **một site học tập độc lập**: dạy **nguyên lý kiến trúc / nguyên lý lập trình** thông qua **vấn đề thật và demo tương tác được ngay trên web**.
> Trạng thái: bản thảo thiết kế (chưa code). Ngày: 2026-10-24 · **Cập nhật định vị: 2026-10-24** (xem §1.1).
> Hosting: sub-path `/<domain>/principles/` — HTML/CSS tĩnh, không build step, deploy GitHub Pages.
> **Đây không phải một khu vực của portfolio.** Site không nói về kinh nghiệm của tác giả và không liên kết với portfolio ở bất kỳ chiều nào.

---

## 1. Hiểu lại ý tưởng của bạn (restate)

Bạn muốn làm một site học tập độc lập, gọi là **Principles Lab**, với các đặc điểm:

1. Dạy các **nguyên lý dùng phổ biến** khi lập trình và phát triển phần mềm (KISS, DRY, SOLID, YAGNI, separation of concerns, least privilege, idempotency, ...).
2. Không dạy theo kiểu định nghĩa, mà **xuất phát từ vấn đề thật** (real problem) gặp khi làm sản phẩm.
3. Vấn đề được **phân loại theo nhóm/tầng kỹ thuật**: database, security, code design, API, performance, concurrency...
4. **Mỗi vấn đề = một trang riêng**, trình bày được: bối cảnh (situation), cơ chế hỏng, và **đặc biệt là ví dụ thật chạy được trên web** — người đọc thấy *kết quả*, thấy *phản hồi của hệ thống*, và thấy *cấu trúc bên trong* khi chạm vào vấn đề đó.
5. Bạn cần mình bổ sung: nội dung, cách người dùng tương tác, và cách build site/page thật.

Tài liệu này trả lời đúng 3 phần đó: **(A) mục tiêu & định vị**, **(B) mô hình nội dung + cách tương tác**, **(C) kiến trúc kỹ thuật để build thật**.

### 1.1. Ranh giới: đây KHÔNG phải một phần của portfolio

Bản đầu của tài liệu này định vị sai: nó coi Lab là một *portfolio artifact* và thiết kế nhiều thứ quanh giả định đó (persona recruiter, badge "Seen in production", link hai chiều với case study, nav chung với trang chủ). **Toàn bộ phần đó đã được loại bỏ.** Ghi lại ở đây vì nó là thay đổi định vị lớn nhất của dự án, và vì nhiều quyết định phía sau chỉ hợp lý khi đọc kèm ranh giới này.

| | Bản đầu (sai) | Bản này (chốt) |
|---|---|---|
| Site là gì | khu vực của portfolio | **site học tập độc lập**, tự đứng một mình |
| Mục tiêu | chứng minh năng lực tác giả | **dạy được một nguyên lý cho người đang đau** |
| Người đọc chính | recruiter / interviewer | **dev đang gặp vấn đề, dev học chủ động, người dạy team** |
| Nội dung nói về | kinh nghiệm của tác giả | **cơ chế của vấn đề** — ai gặp cũng được, không cần biết tác giả là ai |
| Link từ portfolio → Lab | nav link + section 3 card ở trang chủ | **không có** |
| Link từ Lab → portfolio | badge "Seen in production" → case study | **không có** |
| Landing | hub page dùng chung nhịp với portfolio | **landing riêng của Lab**, nav riêng, wordmark riêng |

**[LUẬT 0 — ISOLATION]** Không có link nào giữa hai site, ở cả hai chiều.

- `index.html`, `pages/*.html` (portfolio) **không được** chứa link tới `principles/`.
- `principles/**` **không được** chứa link tới `index.html` hoặc `pages/*.html`.
- Trang Lab **không nạp** `source/styles.css` hay `source/case-study.css`; Lab có token riêng trong `principles.css` (xem §6.1).

Luật này được **kiểm tự động** (`tests/isolation.test.mjs`), không phải chỉ ghi trong tài liệu — vì đây là loại ràng buộc bị xói mòn bằng một lần "thêm tạm một link cho tiện".

**Chung repo, khác site.** Vì sub-path trên cùng domain nghĩa là cùng một GitHub Pages deploy, hai site **chung repo và chung bộ cổng kiểm tra** (`package.json`, CI). Đây là quan hệ *hạ tầng*, không phải quan hệ *nội dung*. Nếu sau này muốn tách hẳn sang `lab.<domain>` thì đó là một repo riêng + CNAME riêng — *reversible decision*, chi phí thấp, chưa cần làm bây giờ.

**Một ngoại lệ duy nhất — đã chốt (2026-10-24):** footer Lab có đúng một dòng, đúng chuỗi này, không thêm gì:

```text
Built and maintained by Phuc
```

Ràng buộc kèm theo, cứng:

- **Không phải link.** Không `<a>`, không `href`, không `mailto`, không icon social. Là text thuần.
- **Không tên đầy đủ, không chức danh, không "fullstack developer", không ảnh.** Chỉ `Phuc`.
- **Không xuất hiện ở đâu khác** ngoài footer: không ở nav, không ở hero, không trong khối ⑦.

Lý do giữ dòng này: một site dạy học hoàn toàn vô danh thì khó tin hơn — có người chịu trách nhiệm là một tín hiệu chất lượng. Lý do giữ nó **trần như vậy**: ngay khi nó thành link hoặc có thêm chức danh, nó biến thành cửa sau giới thiệu portfolio, và cả §1.1 này mất hiệu lực. Dòng này được **canh bằng test** (khớp chính xác chuỗi, và không có phần tử `<a>` nào trong footer).

---

## 2. Phân tích mục tiêu (target analysis)

### 2.1. Mục tiêu bề mặt vs mục tiêu thật

| | Mục tiêu bề mặt | Mục tiêu thật (cái đáng tối ưu) |
|---|---|---|
| Nội dung | "Viết bài về DRY, KISS" | Làm người đọc **thấy được hậu quả kỹ thuật**, không chỉ nhớ tên nguyên lý |
| Hình thức | "Có thêm vài page" | Một **dụng cụ dạy học chạy được**, dùng lại được khi dạy người khác |
| Người đọc | "Ai vào đọc cũng được" | Dev đang đau quét 90 giây → phải nhận ra **đúng vấn đề của mình** |
| Kết quả | "Site đẹp" | Mỗi trang để lại **một con số và một quyết định** người đọc mang về được |

**Kết luận định hướng:** đây không phải blog, và cũng không phải portfolio. Đây là một **interactive teaching tool**. Giá trị lớn nhất không nằm ở chữ, mà ở việc **mô phỏng được hệ thống hỏng** rồi **sửa nó trước mắt người đọc**.

### 2.2. Ba nhóm người đọc và nhu cầu khác nhau

| Persona | Vào site để làm gì | Họ cần gì ở trang vấn đề | Thiết kế phục vụ họ thế nào |
|---|---|---|---|
| **Dev đang đau** (vào từ Google / một người gửi link) | Tìm cách sửa cái đang hỏng *hôm nay* | Nhận ra đúng triệu chứng của mình trong 10 giây, rồi lấy được cách sửa | Hero là **symptom** bằng lời phi kỹ thuật; khối ⑧ `Carry it away` là checklist mang về được ngay |
| **Dev học chủ động** (ôn tập, chuẩn bị phỏng vấn, tự nâng cấp) | Hiểu *vì sao*, không chỉ *làm thế nào* | Cơ chế bên trong, số đo, trade-off, khi nào KHÔNG áp dụng | Panel ③ Internals + khối ⑥ Trade-offs + `related` dẫn chéo thành chuỗi |
| **Người dạy** (tech lead, mentor, người onboard team) | Lấy một thứ **mở ra là dạy được** | Một link gửi cho junior, bấm là thấy, không cần giải thích trước | `Break it yourself`, deep-link một trạng thái hỏng, lab chạy không cần cài gì |

Persona thứ ba là lý do site này có giá trị lâu dài: **một người dạy sẽ gửi lại link nhiều lần**, còn một người đọc chỉ ghé một lần. Mọi tính năng phục vụ "gửi link được" (deep-link, OG image, lab không cần cài đặt) đều ưu tiên cao vì nó phục vụ nhóm này.

Hệ quả thiết kế: mỗi trang phải **đọc được ở 3 độ sâu** (xem 4.2 — progressive disclosure). Không bắt người đang đau đọc hết, không bắt người học chỉ thấy bề mặt.

### 2.3. Định vị khác biệt (tại sao site này không giống 10.000 bài blog khác)

Thị trường nội dung về DRY / KISS / SOLID đã bão hoà, và gần như toàn bộ là **văn bản tĩnh + snippet code**. Khoảng trống còn lại:

> **Không ai cho người đọc *bấm vào* nguyên lý và xem hệ thống hỏng.**

Vậy nên luận điểm trung tâm của site là:

**"Mỗi nguyên lý ở đây là một cái công tắc. Bạn tắt nó, hệ thống phản hồi tệ đi — và bạn thấy chính xác tệ ở đâu, tệ bao nhiêu."**

Đây là thứ mình đề nghị lấy làm tagline của landing (bản EN):
`Flip the principle off. Watch the system answer.`

### 2.4. Tiêu chí thành công (định nghĩa "xong" cho từng trang)

Một trang vấn đề chỉ được coi là đạt khi thoả **cả 5**:

- [ ] **Có demo tương tác được**, không phải ảnh / GIF.
- [ ] Demo có **2 chế độ**: `Naive` (vi phạm nguyên lý) và `Principled` (áp dụng) — và **cả hai đều chạy**, không phải một bên chỉ là mô tả.
- [ ] Hiển thị được **phản hồi hệ thống** (status code, payload, thời gian, thông báo lỗi) — đúng như yêu cầu "the responsing" của bạn.
- [ ] Hiển thị được **cấu trúc bên trong** (query log, số lần gọi, bảng dữ liệu, sơ đồ luồng) — đúng yêu cầu "the structure".
- [ ] Có **một con số so sánh** trước / sau (ms, số query, số dòng rò rỉ, số chỗ phải sửa...).

Nếu một vấn đề không thể mô phỏng ra con số → **không làm trang riêng**, gộp vào bài tổng quan. Đây là bộ lọc quan trọng nhất của dự án.

---

## 3. Mô hình nội dung (content model)

### 3.1. Phân biệt hai thực thể: Principle vs Problem

Đây là quyết định kiến trúc thông tin quan trọng nhất, và cũng dễ làm sai nhất.

- **Principle** (nguyên lý): DRY, KISS, YAGNI, Least Privilege, Single Responsibility, Idempotency, Fail Fast...
- **Problem** (vấn đề thật): "N+1 query làm trang danh sách chậm 40 lần", "form liên hệ bị SQL injection", "sửa thuế VAT ở 5 chỗ, sót 1 chỗ"...

Quan hệ: **nhiều-nhiều**. Một problem thường vi phạm 2–3 principle; một principle xuất hiện ở nhiều problem.

**Trang riêng thuộc về Problem, không thuộc về Principle.** Principle chỉ là **tag / filter + trang tổng hợp** liệt kê các problem minh hoạ nó.

Lý do: người ta không google "DRY là gì" khi đang đau; người ta google "sửa 1 chỗ sót 4 chỗ". Vấn đề là cửa vào, nguyên lý là bài học mang ra.

### 3.2. Taxonomy — 6 nhóm (category)

Dùng đúng 6 nhóm, mỗi nhóm một màu accent riêng (tận dụng cơ chế `--accent` inline đang có trong `pages/*.html`):

| # | Category | Slug | Accent đề xuất | Câu hỏi nhóm này trả lời |
|---|---|---|---|---|
| 1 | **Data & Database** | `data` | `#64ffda` (mint — mặc định) | Dữ liệu được hỏi và lưu như thế nào? |
| 2 | **Security & Trust** | `security` | `#ff7b72` (đỏ san hô) | Chuyện gì xảy ra khi có người cố tình phá? |
| 3 | **Code Design** | `code-design` | `#d2a8ff` (tím) | Code này 6 tháng sau sửa được không? |
| 4 | **API & Contracts** | `api` | `#79c0ff` (xanh) | Hai hệ thống nói chuyện với nhau ra sao? |
| 5 | **Performance & Scale** | `performance` | `#ffa657` (cam) | Khi lưu lượng ×100 thì gãy ở đâu? |
| 6 | **Reliability & Operations** | `reliability` | `#a5d6ff` (xanh nhạt) | Khi nó hỏng lúc 2 giờ sáng, bạn biết gì? |

Mỗi trang còn có **2 trục phụ** để filter:

- `difficulty`: `foundational` | `intermediate` | `advanced`
- `blast-radius` (mức thiệt hại nếu bỏ qua): `annoying` | `expensive` | `catastrophic`

Trục `blast-radius` là điểm nhấn đắt giá: nó dạy người đọc phân biệt **"code xấu"** và **"code nguy hiểm"** — một phân biệt mà hầu hết tài liệu về nguyên lý không hề nhắc tới, dù nó quyết định việc gì cần sửa trước.

### 3.3. Schema của một trang Problem

Mỗi trang là một object có các field sau (sống trong `scripts/data/catalog.js` để landing render, và lặp lại trong HTML của trang):

```js
{
  slug: "n-plus-one-query",
  title: "The list page that fired 101 queries",
  category: "data",
  principles: ["Know your query cost", "Batch over loop"],
  difficulty: "intermediate",
  blastRadius: "expensive",
  symptom: "Trang danh sách load 3.2s dù chỉ có 100 dòng.",
  verdict: "1 query thay vì 101. Cùng dữ liệu, cùng lượng code, nhanh hơn 38 lần.",
  metrics: { before: "101 queries / 3180ms", after: "1 query / 84ms" },
  provenance: "classic",                               // classic | field-report | derived
  lab: "n-plus-one",                                   // id của demo
  related: ["offset-vs-cursor-pagination", "no-index-no-mercy"]
}
```

#### Field `provenance` — thay cho `seenIn` đã bỏ

Bản đầu có field `seenIn` để gắn badge `Seen in production` link tới case study trong portfolio. **Đã bỏ hoàn toàn** theo §1.1: site không nói về kinh nghiệm của tác giả.

Nhưng cái *giá trị* mà `seenIn` đang bảo vệ thì vẫn cần giữ: **không được nói quá về độ "thật" của một vấn đề.** Nên nó được thay bằng một field nói về **xuất xứ của vấn đề**, không về CV của ai:

| `provenance` | Nghĩa | Nhãn hiện trên trang |
|---|---|---|
| `classic` | Vấn đề đã được tài liệu hoá rộng rãi trong ngành; có tên gọi riêng, có trong sách / docs chính thức | `Classic problem` |
| `field-report` | Lấy từ một tình huống thật gặp trong quá trình làm việc, **đã ẩn danh hoàn toàn**: không tên công ty, không tên sản phẩm, không tên người | `From the field` |
| `derived` | Dựng lên có chủ ý để cô lập đúng một cơ chế; không phải báo cáo một sự cố cụ thể nào | `Constructed example` |

Ba luật đi kèm:

1. **`field-report` không được kèm bất kỳ định danh nào** — không tên công ty, không link ra ngoài, không "ở một công ty fintech ở Q1". Ẩn danh hoàn toàn hoặc đổi sang `derived`.
2. **`derived` không phải loại thấp hơn.** Một ví dụ dựng tốt dạy tốt hơn một sự cố thật kể lệch. Nhãn chỉ nói *xuất xứ*, không nói *chất lượng*.
3. **Mặc định là `classic`**, không phải `field-report`. Nếu lưỡng lự thì chọn cái thấp hơn về mức khẳng định.

Lý do giữ lại field này dù đã bỏ portfolio: đây là site **dạy** người khác. Một trang dạy mà phóng đại xuất xứ của ví dụ thì phá đúng thứ nó đang xây — và nhãn `Constructed example` công khai lại làm tăng độ tin cậy, chứ không giảm.

---

## 4. Thiết kế một trang Problem

### 4.1. Bộ khung 8 khối (dùng chung cho mọi trang)

| # | Khối | Mục đích | Độ dài mục tiêu |
|---|---|---|---|
| 1 | **Hero — Symptom** | Nêu triệu chứng bằng ngôn ngữ người dùng / PM, chưa nói nguyên lý | 1 câu lớn + 2 dòng |
| 2 | **Situation** | Bối cảnh: sản phẩm gì, ai yêu cầu gì, deadline, vì sao code ban đầu *hợp lý* | 120–180 từ |
| 3 | **The Lab** | Demo tương tác. **Trái tim của trang.** | — |
| 4 | **Under the hood** | Giải thích cái lab vừa cho thấy: sơ đồ luồng / bảng / query log | 150 từ + 1 sơ đồ SVG |
| 5 | **The principle** | Giờ mới gọi tên nguyên lý, kèm 1 phát biểu ngắn đóng khung | 60 từ |
| 6 | **Trade-offs & when NOT to** | Khi nào áp dụng là sai / thừa. Phần phân biệt junior vs senior | 100 từ, dạng 2 cột |
| 7 | **Where this bites in practice** | Vấn đề này xuất hiện ở đâu trong ngành, dấu hiệu nhận ra trên hệ thống thật, và nhãn `provenance` | 80 từ |
| 8 | **Carry it away** | Checklist 4–6 gạch đầu dòng actionable + link trang liên quan | — |

**Về khối ⑦:** bản đầu gọi khối này là *From experience* và dùng nó để kể trải nghiệm của tác giả. Theo §1.1, khối này giờ nói về **vấn đề**, không về người viết: nó xuất hiện ở loại hệ thống nào, dấu hiệu sớm là gì, và tại sao người ta vẫn mắc dù đã biết. Người đọc không cần biết tác giả là ai mới dùng được trang này.

Thứ tự này có chủ ý: **triệu chứng → bối cảnh → trải nghiệm trực tiếp (bấm thử) → giải thích → đặt tên → giới hạn**. Làm ngược lại (đặt tên nguyên lý trước) là cách mọi blog đang làm, và là lý do không ai nhớ.

### 4.2. Progressive disclosure — 3 độ sâu đọc

- **Độ 1 (10 giây):** Hero symptom + dải `metrics` before/after + câu `verdict`. Người đang đau dừng ở đây là đã biết **trang này có đúng vấn đề của mình hay không** — đó là việc duy nhất 10 giây đầu phải làm được.
- **Độ 2 (90 giây):** Bấm 2–3 nút trong Lab, thấy hệ thống phản hồi khác nhau.
- **Độ 3 (5 phút):** Mở panel `Internals`, đọc trade-offs, mở code diff.

Code diff và log chi tiết đặt trong `<details>` (native, không cần JS) để mặc định gọn trên mobile.

---

## 5. Cách người dùng tương tác — thiết kế "The Lab"

Đây là phần bạn hỏi nhiều nhất, nên mình đi sâu nhất ở đây.

### 5.1. Hợp đồng tương tác (interaction contract)

Mọi Lab, bất kể chủ đề gì, phải trả lời **4 câu hỏi theo đúng thứ tự**, bằng 4 vùng cố định trên màn hình:

| Vùng | Câu hỏi nó trả lời | Nội dung |
|---|---|---|
| **① Control** | *Tôi vừa làm gì?* | Toggle `Naive / Principled`, input, nút action, slider tải |
| **② Response** | *Hệ thống trả lời gì?* | Status code, thời gian, payload JSON, thông báo lỗi UI |
| **③ Internals** | *Bên trong xảy ra gì?* | Query log, số lần gọi hàm, bảng dữ liệu, cache hit/miss, sơ đồ |
| **④ Verdict** | *Số nào thay đổi?* | Thanh so sánh before/after, luôn có đơn vị |

Giữ 4 vùng này **ở đúng một chỗ trên mọi trang** là quyết định UX quan trọng nhất của site: sang trang thứ hai, người đọc đã biết chỗ bấm. (Và bản thân việc này chính là DRY + consistency — site tự minh hoạ nguyên lý mà nó dạy.)

### 5.2. Nguyên tắc tương tác

1. **Toggle là hành động chính.** Một công tắc `Naive ⇄ Principled`, giữ nguyên mọi input khác. Người đọc thấy *cùng một hành động* cho *hai kết quả khác nhau*.
2. **Không bao giờ hiện kết quả ngay.** Luôn có độ trễ mô phỏng (fake latency) để cảm nhận được "chậm". Nhanh / chậm phải *cảm* được, không chỉ *đọc* được con số.
3. **Để người đọc tự phá.** Mỗi lab có ô "Break it yourself" với 2–3 payload gợi ý bấm-là-dán. Tự tay phá đáng nhớ gấp 10 lần đọc mô tả.
4. **Không có trạng thái "sai".** Mọi input đều cho ra phản hồi có nghĩa, không crash lab.
5. **Reset luôn thấy.** Nút `Reset lab` ở góc, trả về state ban đầu.
6. **Chạy được khi không có JS? Không — nhưng phải suy biến đẹp.** Nếu JS fail, hiện `<noscript>` với bảng kết quả tĩnh + ảnh. Không được để khung trắng.

### 5.3. Catalog 7 dạng tương tác (interaction archetypes)

Thay vì thiết kế lại mỗi trang từ đầu, chuẩn hoá **7 khuôn**. Trang mới chỉ chọn khuôn + nạp dữ liệu.

| Khuôn | Cơ chế | Dùng cho |
|---|---|---|
| **A. Request Inspector** | Người đọc bấm "Load page" → hiện request, response, timing waterfall | N+1, over-fetching, pagination, caching |
| **B. Attacker Console** | Ô input + payload gợi ý → hiện câu lệnh / truy vấn được sinh ra + dữ liệu rò rỉ | SQL injection, XSS, IDOR, mass assignment |
| **C. Change Propagation** | Sửa 1 giá trị → animation lan toả qua các file; chế độ Naive sót chỗ → sinh bug | DRY, single source of truth, magic numbers |
| **D. Load Dial** | Slider số user đồng thời → biểu đồ latency / error rate theo thời gian thực | Scale, rate limit, connection pool, index |
| **E. Race Track** | Hai "client" chạy song song, bấm cùng lúc → thấy ghi đè / oversell | Concurrency, lock, idempotency, transaction |
| **F. Contract Diff** | Đổi version API ở dropdown → client cũ gãy hoặc không gãy | Versioning, backward compatibility, nullable migration |
| **G. Complexity Meter** | Thêm / bớt requirement (checkbox) → đếm branch, nesting, số test cần | KISS, YAGNI, premature abstraction |

### 5.4. Đặc tả cụ thể cho 6 Lab đầu tiên

Đây là mức chi tiết đủ để code ngay.

#### Lab 1 — `n-plus-one-query` (Data · khuôn A)

- **Bối cảnh:** trang danh sách 100 ứng viên, mỗi dòng cần tên công ty ứng tuyển.
- **Control:** nút `Load candidates`; toggle `Naive (loop) / Principled (join + batch)`; slider số dòng 10 / 100 / 500.
- **Response:** bảng 100 dòng render dần; tổng thời gian đếm lên theo thời gian thực (quan trọng: phải thấy nó *bò*).
- **Internals:** query log cuộn, in từng dòng dạng `SELECT * FROM companies WHERE id = 42` — người đọc tận mắt thấy 101 dòng log. Chế độ Principled: đúng 2 dòng.
- **Verdict:** `101 queries · 3180ms` → `2 queries · 84ms`.
- **Break it yourself:** đẩy slider lên 500 ở chế độ Naive → thấy nó gần như treo. Đây là moment "ồ" của trang.

#### Lab 2 — `sql-injection-contact-form` (Security · khuôn B)

- **Bối cảnh:** một form liên hệ / tra cứu đơn giản — thứ gần như mọi dự án đều có, và là chỗ chuỗi SQL hay bị nối tay nhất. `provenance: classic`.
- **Control:** input `email`; toggle `String concat / Parameterized`; 3 chip payload bấm-là-dán (các chuỗi kết thúc sớm câu lệnh rồi chèn điều kiện luôn-đúng, hoặc comment phần còn lại).
- **Response:** chế độ Naive trả về **toàn bộ bảng users** (dữ liệu giả, tên fake rõ ràng); chế độ Principled trả `200 { matched: 0 }`.
- **Internals:** hiện **câu SQL cuối cùng được tạo ra**, highlight phần payload chèn vào bằng màu đỏ. Đây là khoảnh khắc dạy học mạnh nhất — người đọc thấy chuỗi bị "mọc thêm" logic.
- **Verdict:** `3 rows leaked (incl. password_hash)` → `0 rows · payload treated as literal`.
- **Lưu ý quan trọng:** chỉ mô phỏng trong bộ nhớ trình duyệt, không có backend thật. Ghi rõ dòng "This runs entirely in your browser. No server, no real data." để không ai nghĩ site của bạn có lỗ hổng thật.

#### Lab 3 — `one-rule-five-places` (Code Design · khuôn C)

- **Bối cảnh:** thuế VAT 8% → 10%, logic tính giá nằm rải ở `cart.js`, `invoice.js`, `email-template.js`, `admin-report.js`, `mobile-api.js`.
- **Control:** input "VAT mới"; toggle `Duplicated / Single source`; nút `Deploy`.
- **Response:** 5 "màn hình" nhỏ (giỏ hàng, hoá đơn, email, báo cáo, app) hiện số tiền. Chế độ Duplicated: 4 màn đúng, **1 màn vẫn 8%** → gắn nhãn đỏ `inconsistent`.
- **Internals:** sơ đồ file; đường nối từ chỗ sửa toả đi; file bị sót nhấp nháy đỏ.
- **Verdict:** `5 files to change · 1 missed · 1 silent money bug` → `1 file · 0 missed`.
- **Trade-off phải nói rõ:** DRY sai chỗ sinh coupling. Thêm ô "khi 2 chỗ *trông* giống nhau nhưng thay đổi vì lý do khác nhau thì đừng gộp" — đó không phải duplicate code mà là hai domain rule khác nhau.

#### Lab 4 — `no-index-no-mercy` (Performance · khuôn D)

- **Bối cảnh:** tìm ứng viên theo email trên bảng 50.000 dòng.
- **Control:** ô tìm kiếm; toggle `No index / B-tree index`; slider kích thước bảng 1k → 50k.
- **Response:** kết quả tìm kiếm + thời gian.
- **Internals:** hiển thị **plan giả lập** kiểu `Seq Scan on candidates (rows scanned: 50000)` vs `Index Scan using idx_candidates_email (rows scanned: 1)`; thanh bar số dòng phải quét.
- **Verdict:** `50.000 rows scanned · 420ms` → `1 row · 2ms`.
- **Trade-off:** index làm `INSERT` chậm hơn và tốn dung lượng — cho người đọc bấm nút `Insert 1000 rows` để thấy chiều ngược lại. Trang này chỉ "senior" khi có chiều ngược đó.

#### Lab 5 — `double-click-double-charge` (Reliability · khuôn E)

- **Bối cảnh:** người dùng bấm "Thanh toán" hai lần vì mạng lag.
- **Control:** nút `Pay 500.000đ` (cho bấm liên tục); toggle `No idempotency key / With idempotency key`.
- **Response:** danh sách giao dịch. Naive: 2 giao dịch, trừ tiền 2 lần. Principled: giao dịch thứ 2 trả `200` nhưng kèm `replayed: true`.
- **Internals:** timeline 2 request song song, hiện cửa sổ race.
- **Verdict:** `balance -1.000.000đ · 2 charges` → `-500.000đ · 1 charge`.

#### Lab 6 — `build-it-for-the-future` (Code Design · khuôn G)

- **Bối cảnh:** yêu cầu là "export CSV", bạn build `ExportStrategyFactory` cho 6 format chưa ai cần.
- **Control:** checkbox các format "có thể cần trong tương lai"; toggle `Abstract now / Build the one`.
- **Response:** hai cột code cạnh nhau, số dòng đổi theo lựa chọn.
- **Internals:** đồng hồ đo `files: 7 · interfaces: 3 · branches: 11 · tests needed: 14` vs `files: 1 · branches: 2 · tests: 3`.
- **Verdict:** `7 files to maintain, 1 format ever shipped` → `1 file, 1 format, refactor when the second arrives`.
- **Trade-off:** YAGNI không phải cái cớ để không thiết kế. Ghi rõ ranh giới: *reversible decision* → cứ làm đơn giản; *irreversible* (schema, public API, định dạng lưu trữ) → suy nghĩ trước.

### 5.5. Landing page (`/principles/index.html`) — cửa vào của một site độc lập

Vì Lab không còn được giới thiệu từ trang chủ portfolio (§1.1), **trang này phải tự làm toàn bộ việc giới thiệu**. Nó không còn là một "hub" nằm trong một site lớn hơn; nó là **trang chủ của site**. Người lạ vào đây từ Google hoặc từ một link được gửi, và không biết gì cả.

**Năm việc landing phải làm, theo đúng thứ tự trên màn hình:**

| # | Khối | Trả lời câu hỏi | Nội dung |
|---|---|---|---|
| 1 | **Hero** | *Đây là cái gì?* | Wordmark `Principles Lab` + tagline `Flip the principle off. Watch the system answer.` + 1 câu nói rõ: site dạy nguyên lý bằng demo chạy được, miễn phí, không cần đăng ký |
| 2 | **How it works** | *Tôi sẽ thấy gì?* | 3 bước có hình: chọn một triệu chứng → bật/tắt nguyên lý → xem số đổi. Kèm **một lab mini nhúng ngay trên landing** (xem dưới) |
| 3 | **Browse by category** | *Có những gì?* | 6 nhánh, mỗi nhánh một câu hỏi nó trả lời (§3.2) + số trang trong nhánh, tính từ `catalog.js` |
| 4 | **Catalog** | *Cho tôi xem hết* | Filter bar + card grid (chi tiết dưới) |
| 5 | **Footer** | *Ai làm, và nó trung thực tới đâu?* | Dòng `Every number on this site is computed by a simulation that runs in your browser` + link changelog + 1 dòng attribution trung tính (§1.1) |

**Lab mini nhúng trên landing** là thay đổi đáng giá nhất so với bản đầu. Trước đây trang chủ portfolio làm việc "thuyết phục người ta bấm vào Lab"; giờ không còn trang đó nữa, nên **landing phải tự chứng minh trong 10 giây đầu**. Một lab nhỏ nhất (một toggle, một con số đổi) nhúng ngay dưới hero làm được việc đó mà không cần một chữ quảng cáo nào. Dùng đúng runtime và kernel component đã có — không viết riêng.

**Catalog (khối 4):**

- **Filter bar:** chips theo category (6), difficulty (3), blast-radius (3). Filter bằng `data-*` attribute + `classList` — không cần framework.
- **Card grid:** mỗi card gồm symptom (**không phải tên nguyên lý!**), category pill, cặp số before/after, và `ProvenanceTag` (§3.3) — **không còn badge `Seen in production`**.
- **Sắp xếp:** mặc định theo `blast-radius` giảm dần — thứ nguy hiểm nhất lên trước.
- **"I've read this":** lưu `localStorage` → đánh dấu card đã đọc. Nhỏ nhưng tạo cảm giác tiến độ, kéo người đọc sang trang thứ 3, thứ 4.
- **Random:** nút `Surprise me` → mở trang ngẫu nhiên. Rẻ, vui, tăng page / session.

**Landing và catalog nằm cùng một trang hay tách hai trang?** Chốt: **cùng một trang** cho tới khi catalog vượt 12 entry. Dưới ngưỡng đó, tách ra chỉ thêm một cú click giữa người đọc và nội dung. Khi vượt 12 → tách `/principles/catalog.html`, landing giữ lại 6 card nổi bật. Đây là một *reversible decision* có ngưỡng rõ ràng, và nó chính là bài học `build-it-for-the-future` áp vào chính site.

### 5.6. Điều hướng giữa các trang

- **Nav riêng của Lab** trên mọi trang: wordmark `Principles Lab` (về landing) + `All problems` + `By principle` (từ P3). **Không có link nào ra ngoài site** (LUẬT 0).
- Trang nào cũng có **prev / next trong cùng category** ở footer → tạo cảm giác "khoá học", không phải bãi bài rời.
- Section `related` dẫn chéo sang category khác (ví dụ N+1 → pagination → index) → người đọc tự nhận ra các vấn đề **kết nối với nhau**, đúng tinh thần "kiến trúc".
- Link `← Back to all problems` ở đầu mỗi trang lesson — đích là landing của Lab, **không** phải trang chủ portfolio.

---

## 6. Kiến trúc kỹ thuật — build thật thế nào

### 6.1. Ràng buộc đang có (phải tôn trọng)

- HTML / CSS tĩnh, **không build step** để chạy site.
- Deploy: GitHub Actions upload lên Pages; Lab nằm ở sub-path `/principles/` của cùng domain → **chung repo, chung CI** với portfolio (§1.1), nhưng **không chung nội dung và không chung CSS**.
- Hiện **chưa có một dòng JS nào** trong repo.

**Quyết định 1 — giữ nguyên "không build step" để chạy.** Dùng **vanilla ES modules** (`<script type="module">`), chạy trực tiếp trên Pages. Không React, không bundler. Lý do: Lab là nhiều widget nhỏ độc lập, không phải SPA; thêm toolchain là chính cái YAGNI mà site này đang dạy. (Nếu sau này > 25 trang và state phức tạp thì mở lại quyết định này — nhưng ghi lại lý do.)
Một `package.json` **chỉ chứa devDependencies** được thêm để chạy cổng kiểm tra (typecheck / lint / test) — nó không tham gia vào việc serve site. Chi tiết ở `docs/implement/README.md` (D1, D2).

**Quyết định 2 — Lab có CSS riêng, không dùng lại CSS của portfolio.**

Bản đầu nói "tái dùng token màu trong `source/styles.css` và `source/case-study.css`". Theo §1.1 thì **không**: trang Lab chỉ nạp `principles.css` + `lab.css`, và `principles.css` tự khai báo `:root` token của nó.

Hai site có thể đang dùng **cùng giá trị màu** (navy + mint là một nền tốt cho instrument, không có lý do kỹ thuật nào để đổi). Nhưng *cùng giá trị* không có nghĩa là *cùng nguồn*:

> Hai thứ trông giống nhau nhưng **thay đổi vì lý do khác nhau** thì không phải duplicate — chúng là hai domain rule.

Đây đúng là trade-off mà trang `one-rule-five-places` dạy (§5.4, Lab 3). Nếu một ngày Lab muốn đổi nền hoặc thêm light mode, nó phải đổi được **mà không chạm vào portfolio**, và ngược lại. Gộp hai bộ token lại sẽ biến mỗi thay đổi nhỏ thành một quyết định cho cả hai site — đó là coupling, không phải DRY.

Hệ quả kiểm được: `tests/isolation.test.mjs` khẳng định không file nào trong `principles/**` tham chiếu `source/styles.css` hoặc `source/case-study.css`.

### 6.2. Cấu trúc thư mục đề xuất

```text
repo/                              # 1 repo, 2 site doc lap (§1.1)
├─ index.html                      # PORTFOLIO — khong doi gi, khong co link toi Lab
├─ pages/                          # PORTFOLIO — khong doi gi
├─ principles/                     # ===== LAB: site doc lap =====
│  ├─ index.html                   # landing + catalog (§5.5)
│  ├─ _template.html               # khung 8 khối, copy cho trang mới
│  ├─ n-plus-one-query.html
│  ├─ sql-injection-contact-form.html
│  ├─ one-rule-five-places.html
│  └─ ...                          # 1 file / problem
├─ source/
│  ├─ styles.css                   # PORTFOLIO (giữ nguyên, Lab khong nap)
│  ├─ case-study.css               # PORTFOLIO (giữ nguyên, Lab khong nap)
│  ├─ principles.css               # LAB: token rieng + landing + shell lesson
│  └─ lab.css                      # LAB: skin 4 vùng (Control/Response/Internals/Verdict)
├─ scripts/
│  ├─ runtime/
│  │  ├─ store.js                  # in-memory "database" + đếm chi phí truy vấn
│  │  ├─ server.js                 # fake HTTP: route, status, latency, error
│  │  ├─ clock.js                  # latency mô phỏng, có thể tăng tốc ×10 để demo
│  │  ├─ logger.js                 # event bus → đổ ra panel Internals
│  │  └─ lab.js                    # defineLab(): render 4 vùng, bind control
│  ├─ labs/
│  │  ├─ n-plus-one.js
│  │  ├─ sql-injection.js
│  │  └─ ...                       # 1 file / lab, chỉ chứa phần khác biệt
│  ├─ data/
│  │  ├─ seed.js                   # dữ liệu giả: candidates, companies, users...
│  │  └─ catalog.js                # metadata mọi problem (landing đọc file này)
│  └─ hub.js                       # landing: filter + localStorage progress
└─ docs/
   └─ principles-lab-plan.md       # tài liệu này
```

**Đọc cây này theo một luật duy nhất:** nhánh `principles/` + `source/principles.css` + `source/lab.css` + `scripts/**` là **site Lab**. Mọi thứ còn lại ở cấp gốc là **portfolio**. Hai nhánh không tham chiếu nhau (LUẬT 0).

### 6.3. Ý tưởng kỹ thuật trung tâm: một "mini runtime" dùng chung

Đây là phần làm cho dự án này **giữ được 18 trang mà không sụp** thay vì chỉ là mấy trang HTML rời.

Thay vì mỗi trang viết demo riêng, build **một runtime nhỏ mô phỏng hệ thống phần mềm** rồi mọi lab đều chạy trên nó:

- **`store.js`** — bảng dữ liệu trong bộ nhớ (`candidates`, `companies`, `users`, `transactions`). Mọi lần truy cập đều **ghi lại chi phí**: số dòng quét, có dùng index hay không, thời gian giả lập. Chính nhờ accounting này mà các con số ở panel Verdict là **tính ra được**, không phải hardcode.
- **`server.js`** — `fakeFetch(route, body)` trả `{ status, headers, body, ms }`, hỗ trợ latency, lỗi 500, 429 rate limit, và chạy song song (cho khuôn Race Track).
- **`logger.js`** — mọi thứ xảy ra bên trong đều phát ra event; panel Internals chỉ là subscriber. Tách biệt quan sát khỏi thực thi.
- **`lab.js`** — `defineLab(spec)`: nhận **đặc tả khai báo** rồi tự dựng DOM 4 vùng.

Mỗi lab trở thành dữ liệu, không phải code UI:

```js
defineLab({
  id: "n-plus-one",
  modes: { naive: "Loop per row", principled: "Join + batch" },
  controls: [
    { type: "button", id: "load", label: "Load candidates" },
    { type: "range",  id: "rows", label: "Rows", values: [10, 100, 500], default: 100 }
  ],
  run: async ({ mode, rows, db, log }) => { /* phần duy nhất mỗi lab tự viết */ },
  metrics: [
    { key: "queries", label: "Queries", unit: "" },
    { key: "ms",      label: "Total time", unit: "ms" }
  ]
});
```

**Vì sao cách này đúng:** nó làm chính site trở thành một ví dụ sống của DRY, separation of concerns và single source of truth — thứ mà site đang dạy. Lợi ích cụ thể, kiểm được: trang thứ 10 viết nhanh như trang thứ 2, và một thay đổi về cách quan sát (thêm waterfall, thêm minimap) không phải sửa 18 lab.

Hệ quả cho nội dung: khi một lab cần phá luật của runtime để chạy, đó là tín hiệu **thiết kế runtime sai** — không phải lý do để copy-paste. Tripwire này được ghi vào mọi phase trong `docs/implement/`.

### 6.4. Hiệu năng & chất lượng — ràng buộc tự đặt

- Mỗi trang lesson: **< 60KB JS**, nạp lazy (`import()` lab chỉ khi scroll tới); landing chỉ nạp code của lab mini nhúng ở khối 2, không nạp lab nào khác.
- Không phụ thuộc CDN bên ngoài cho logic. Font Google: giữ. `cdn.simpleicons.org`: **không dùng trên site Lab** — nó phục vụ logo stack của portfolio, và Lab không có nhu cầu đó. Icon chức năng là inline SVG.
- Sơ đồ: **inline SVG viết tay**, không thư viện chart. Nhẹ, dễ theme 2 màu.
- Mobile: 4 vùng của Lab xếp dọc theo thứ tự ①②③④; query log giới hạn `max-height` + cuộn riêng.
- A11y: toggle dùng `role="switch"` + `aria-checked`; panel Response là `aria-live="polite"` để screen reader đọc kết quả; mọi animation tôn trọng `prefers-reduced-motion`.
- Lab khai báo **bộ token riêng** trong `principles.css` (§6.1 quyết định 2); trong bộ đó **không thêm hệ màu mới** giữa các lab — chỉ thêm biến `--accent` theo category, set inline trên `<body>`.

### 6.5. Quy trình viết một trang mới (authoring workflow)

Chuẩn hoá để trang thứ 10 nhanh như trang thứ 2:

1. Viết **symptom** trước. Nếu không viết nổi triệu chứng bằng lời người không-dev → vấn đề chưa đủ thật, bỏ.
2. Xác định **con số** before / after. Nếu không đo được → gộp vào bài khác (xem 2.4).
3. Chọn **khuôn tương tác** (A–G ở 5.3).
4. Chọn **`provenance`** (§3.3) — mặc định `classic`; chọn `field-report` chỉ khi ẩn danh được hoàn toàn.
5. Copy `principles/_template.html`, điền 8 khối.
6. Viết `scripts/labs/<id>.js` — chỉ hàm `run`.
7. Thêm entry vào `scripts/data/catalog.js` → landing tự có card.
8. Tự kiểm 5 tiêu chí ở 2.4 + test trên mobile + tắt JS xem có suy biến đẹp + **kiểm không có link nào ra ngoài site** (LUẬT 0).

---

## 7. Backlog nội dung — 18 problem đề xuất

Nhóm theo category, đã lọc qua tiêu chí "mô phỏng được".

### Data & Database
1. `n-plus-one-query` — 101 query cho 1 trang danh sách *(Lab 1)*
2. `no-index-no-mercy` — tìm kiếm trên 50k dòng không index *(Lab 4)*
3. `offset-vs-cursor-pagination` — trang 2 lặp dòng khi có insert mới
4. `nullable-column-deploy-order` — thêm cột NOT NULL khi app cũ còn chạy
5. `transaction-or-two-half-truths` — tạo user xong, tạo profile fail

### Security & Trust
6. `sql-injection-contact-form` — chuỗi nối tay làm rò bảng users *(Lab 2)*
7. `trusting-the-client` — sửa giá trong request, server tin luôn
8. `idor-the-other-users-invoice` — đổi `/invoice/128` thành `/invoice/129`
9. `least-privilege-one-key-to-rule-them-all` — API key full quyền bị lộ
10. `jwt-you-can-edit` — sửa `role: user` → `admin`, chữ ký nói không

### Code Design
11. `one-rule-five-places` — VAT đổi, sót 1 chỗ *(Lab 3)*
12. `build-it-for-the-future` — factory cho 6 format, ship 1 *(Lab 6)*
13. `the-function-that-does-seven-things` — hàm 180 dòng, sửa 1 chỗ gãy 3 chỗ
14. `magic-number-in-the-wild` — số `86400` rải khắp codebase

### API & Contracts
15. `breaking-change-at-3pm` — đổi tên field, app mobile cũ trắng màn hình
16. `error-shapes-that-lie` — trả `200 { success: false }`, client không retry

### Performance & Reliability
17. `double-click-double-charge` — thiếu idempotency key *(Lab 5)*
18. `cache-that-lies` — invalidation sai, user thấy giá cũ 10 phút

**MVP = 3 trang:** `n-plus-one-query`, `sql-injection-contact-form`, `one-rule-five-places`.

Ba trang này cover 3 category và 3 khuôn tương tác khác nhau (A, B, C) → vừa đủ để kiểm chứng rằng runtime dùng chung thực sự dùng chung được. Nếu đến trang thứ 3 mà `lab.js` phải sửa nhiều → thiết kế runtime sai, sửa trước khi viết tiếp trang 4.

---

## 8. Roadmap

| Phase | Việc làm | Kết quả kiểm chứng được |
|---|---|---|
| **P0 — Nền** | `principles.css`, `lab.css`, `runtime/` (store, server, logger, lab), `seed.js`, `_template.html` | Một lab rỗng chạy được với 4 vùng |
| **P1 — MVP** | 3 trang MVP + **landing riêng của Lab** (hero, how-it-works, lab mini, catalog) | Gửi link cho 2 người lạ, họ tự bấm ra được verdict mà không cần giải thích |
| **P2 — Chiều sâu** | +5 trang (lên 8), prev/next, localStorage progress, `Surprise me` | Catalog có đủ card để filter *thật sự có ích* |
| **P3 — Hoàn thiện** | Đủ 18 trang, sơ đồ SVG mỗi trang, trang tổng hợp theo Principle, OG image mỗi trang | Share ra mạng xã hội / chat nhóm có preview tử tế |
| **P4 — Mở** | RSS / changelog, bản tiếng Việt (`/vi/`), cho người đọc submit problem | — |

Ưu tiên **xong 3 trang thật tốt hơn 18 trang nửa vời**. Một trang có lab chạy mượt đáng giá hơn 10 trang chỉ có chữ.

---

## 9. Rủi ro & cách phòng

| Rủi ro | Dấu hiệu sớm | Cách phòng |
|---|---|---|
| **Demo giả quá, không ai tin** | Con số tròn trĩnh, luôn giống nhau | Tính số từ accounting thật trong `store.js`, thêm jitter; ghi rõ "simulated" |
| **Biến thành blog chữ** | Trang mới ra mà lab chỉ là ảnh | Bộ lọc 5 tiêu chí ở 2.4 là cứng, không ngoại lệ |
| **JS phình ra thành framework tự chế** | `lab.js` > 400 dòng, có routing | Mỗi phase đọc lại `lab.js`; nếu cần routing thì dừng, xem lại 6.1 |
| **Mobile vỡ** | Query log tràn, bảng ngang | Làm mobile-first cho vùng Lab, test ở 360px trước desktop |
| **Nội dung sai kỹ thuật** | Phát biểu tuyệt đối ("luôn", "không bao giờ") | Khối Trade-offs là **bắt buộc**, không được để trống |
| **Nói quá xuất xứ ví dụ** | Nhiều trang gắn `field-report`, hoặc có chi tiết nhận dạng được công ty / sản phẩm | Mặc định `classic`; `field-report` phải ẩn danh hoàn toàn; lưỡng lự thì hạ mức (§3.3) |
| **Rò rỉ định vị portfolio trở lại** | Xuất hiện một link `../index.html`, một dòng "dự án tôi từng làm", hay một badge kinh nghiệm | LUẬT 0 + `tests/isolation.test.mjs` chạy trong CI. Đây là loại ràng buộc chỉ giữ được bằng test, không bằng thiện chí |
| **Landing không tự giải thích được** | Người lạ vào landing rồi thoát mà không bấm lab nào | Lab mini nhúng ngay dưới hero (§5.5); đo bằng bài test người lạ, không bằng cảm giác |
| **Mất nhiệt sau trang thứ 4** | Backlog đứng yên 3 tuần | Template + catalog làm trang mới chỉ còn ~2 giờ; giữ danh sách 18 cái ở chỗ dễ thấy |

---

## 10. Đo lường thành công

- **Hành vi:** tỉ lệ người bấm vào Lab (mục tiêu > 60% người vào trang), số lần tương tác trung bình / trang (> 3), tỉ lệ đọc sang trang thứ 2 (> 35%).
- **Chất lượng:** 100% trang đạt cả 5 tiêu chí ở 2.4; Lighthouse ≥ 95 cả 4 mục; vẫn đọc được khi tắt JS (suy biến tĩnh).
- **Tín hiệu thật (quan trọng hơn mọi số ở trên):** **có người gửi link một trang cụ thể cho người khác** — trong một PR review, một chat nhóm, một buổi onboard. Đó là lúc site đã trở thành dụng cụ dạy học của người khác, không chỉ là trang của bạn.
  Tín hiệu thứ hai: có người **gửi về một problem** đáng làm. Tín hiệu thứ ba: có người quay lại đọc trang thứ 3, thứ 4 (đo bằng progress `localStorage`, không bằng analytics).
- **Không đo:** mọi chỉ số liên quan tới tuyển dụng, phỏng vấn, hay lượt xem portfolio. Site này không phục vụ mục tiêu đó (§1.1), và đo nó sẽ kéo thiết kế lệch về phía trình diễn.

---

## 11. Quyết định cần bạn chốt

| # | Câu hỏi | Khuyến nghị của mình |
|---|---|---|
| 1 | Ngôn ngữ nội dung trên site? | **Tiếng Anh** (thị trường người đọc rộng nhất cho nội dung kỹ thuật); bản `/vi/` để P4 |
| 2 | Tên site? | `Principles Lab` — route `/principles/`, wordmark riêng, nav riêng |
| 3 | Vanilla ES modules hay thêm toolchain? | **Vanilla** để chạy; devDeps chỉ để kiểm tra (lý do ở 6.1) |
| 4 | ~~Badge "Seen in production"?~~ | **Đã bỏ** (§1.1). Thay bằng `provenance`: `classic` / `field-report` / `derived` (§3.3) |
| 5 | Làm MVP 3 trang trước, hay dựng khung 18 trang rỗng? | **3 trang hoàn chỉnh**. Khung rỗng tạo cảm giác site bỏ hoang |
| 6 | Lab có lưu state người đọc không? | Chỉ `localStorage` cho "đã đọc" + mode cuối; không nhiều hơn |
| 7 | **Footer Lab có dòng attribution tác giả không?** | **✅ ĐÃ CHỐT:** đúng một dòng text thuần `Built and maintained by Phuc`. Không link, không chức danh, không nơi nào khác (§1.1) |
| 8 | **Landing và catalog: một trang hay hai?** | **Một trang** tới khi vượt 12 entry, rồi tách (§5.5) |
| 9 | **Có tách sang subdomain `lab.<domain>` không?** | **Không, chưa cần.** Sub-path đủ; tách là repo riêng + CNAME riêng, *reversible* (§1.1) |

---

## 12. Bước tiếp theo ngay

1. Chốt mục 11 (9 câu, trả lời nhanh được) — đặc biệt câu 7.
2. Dựng **P0**: `source/principles.css` (token riêng của Lab), `source/lab.css`, `scripts/runtime/*`, `principles/_template.html` + một lab rỗng để bạn xem 4 vùng chạy thật.
3. Làm **Lab 1 (`n-plus-one-query`)** trọn vẹn làm chuẩn tham chiếu cho mọi trang sau.
4. Dựng **landing riêng của Lab** (hero + how-it-works + lab mini + catalog). **Không** chạm vào `index.html` của portfolio.
5. Review cùng nhau, chỉnh khuôn, rồi mới nhân bản sang Lab 2 và Lab 3.

> Kế hoạch thực thi chi tiết theo phase (action, target, self-check, cổng typecheck / eslint / build / mock test): **`docs/implement/`**.
