# Lab detail component system — plan (draft, chưa code dòng nào)

> Mục tiêu: biến 3 mockup UI đã duyệt sơ bộ (`candidates-admin.html`, `request-architecture.html`, `server-terminal.html`) thành **nội dung thật** bên trong Stage Contract của từng trang lab, và chốt 1 bộ rule/style dùng chung cho **toàn bộ** `/labs/*` — không phải riêng n-plus-one-query.
> Nguồn: `docs/implement/instrument-revamp.md` (lý do đổi), `docs/principles-lab-ui-plan.md` §7 (Stage Contract, luật cứng), `source/lab.css` (chassis thật hiện có).
> **Mockup gộp đã duyệt**: `lab-detail-sample.html` v2 — https://claude.ai/artifact/RG5ig9Cc8JZp4epBHG8qCQ (trang mẫu n-plus-one-query, 4 vùng Stage Contract + 3 khối nội dung, data giả). Plan dưới đây mô tả lại đúng cấu trúc của bản mockup này, chưa code vào repo.
> Status: **plan, mockup đã duyệt**. Chưa sửa `scripts/`, `source/lab.css`, hay bất kỳ trang lab thật nào.

---

## 0. Ràng buộc cứng phải tôn trọng (không phải chỗ để sáng tạo lại)

Đây là luật đã có, không phải đề xuất — lấy từ `principles-lab-ui-plan.md` §7 và `source/lab.css`:

| Luật | Nội dung | Hệ quả cho 3 mockup |
|---|---|---|
| LUẬT 5 / Stage Contract #1 | 4 vùng `data-zone="control\|response\|internals\|verdict"` phải tồn tại, đúng thứ tự DOM | Không được xoá vùng `control` như mockup Component 1 đã làm (mockup bỏ action bar vì nó là demo độc lập — trang lab thật **không được bỏ**) |
| Stage Contract #7/#8 | CSS riêng từng lab = `.stage--<id>`, **≤ 120 dòng** | Diagram/terminal/table không thể mỗi lab viết CSS riêng đầy đủ — phải là **kernel component dùng chung**, mỗi lab chỉ khai `.stage--<id>` cho layout/grid-area |
| `[data-zone="verdict"]` | border-left 3px theo `--accent-line` | Giữ nguyên quy tắc viền, chỉ đổi token màu |
| `[data-zone="control"] > .lab-state-banner` | `margin-left: auto` | Banner trạng thái (Idle/Running/Settled/Error) vẫn nằm bên phải control zone như cũ |
| `ResponseCard` kernel (status + ms + body collapsible) | Đã spec sẵn, chưa lab nào dùng thật | Dùng `ResponseCard` làm khung bọc ngoài cho nội dung response zone, thay vì bọc mới |

→ **Quyết định của plan này**: 3 mockup không thay thế Stage Contract, chúng trở thành **nội dung bên trong 2 vùng `response` và `internals`**, còn `control` và `verdict` giữ cấu trúc cũ, chỉ đổi token màu/font cho đồng bộ.

---

## 1. Map 3 mockup vào 4 vùng

| Vùng | Nội dung thật | Lấy từ mockup nào | Ghi chú |
|---|---|---|---|
| `control` | Mode switch (Naive/Principled), Run, Reset, state banner | *(giữ nguyên, chỉ restyle)* | Không bỏ — đây là luật cứng |
| `response` | Bảng dữ liệu thật (candidates/companies/...) bọc trong `ResponseCard` | `candidates-admin.html` (bảng + sort + avatar chip), **bỏ** phần sidebar/topbar admin-app (những thứ đó là layout trang, không phải nội dung 1 zone) | Mỗi lab khác nhau sẽ có cột khác nhau — component là **table kernel có thể cấu hình cột**, không hardcode "candidate" |
| `internals` | Request-flow diagram + terminal log, xếp dạng tab hoặc stack | `request-architecture.html` (card node + connector 1 hướng) + `server-terminal.html` (log lock, auto-scroll) | Diagram vẽ **đường đi + data thật từ `store.costs()`**, không phải số đếm giả; terminal in lại `LogStream` (đã sửa bug `{ text }` ở bước trước) dưới dạng dòng access-log |
| `verdict` | Số liệu trước/sau | *(giữ nguyên, chỉ restyle)* | Không đổi cấu trúc |

**Vì sao bỏ action bar/sidebar/topbar của mockup Component 1**: những phần đó là khung của *một trang web độc lập* (dùng để demo "trang thật trông như thế nào"), không phải nội dung của 1 zone. Khi ráp vào lab thật, trang lab đã có header/nav riêng (`lab-nav`) — không ráp thêm 1 bộ nav khác.

---

## 2. Bộ rule/style chung cho toàn `/labs/*` (chốt theo mockup đã duyệt)

**Quyết định đã sửa sau khi xem bản gộp v1** (bản v1 bọc cả 3 mockup vào 1 kiểu "zone card" đồng nhất — bị bác vì làm mất cá tính riêng của từng mockup, và bị nhận xét giống lại kiểu dựng trang chung chung). Bản v2 (đã duyệt) tách rõ 2 lớp:

**Lớp A — chassis chung** (hero, `control`, `verdict`, label vùng): dùng 1 bộ token `--lab-*`, có dark-mode, đây là phần *dùng chung thật* cho toàn site.

| Token | Giá trị (light) | Vai trò |
|---|---|---|
| `--lab-ink` / `--lab-paper` / `--lab-panel` | `#13151c` / `#eef0f4` / `#ffffff` | Nền trang, chữ chính |
| `--lab-accent` | `#5a35d6` | Điểm nhấn duy nhất (nút Run, số verdict, viền trái verdict) |
| `--lab-sig-ok` / `--lab-sig-warn` / `--lab-sig-bad` | — | Màu tín hiệu ngữ nghĩa, dùng trong state banner |
| Font UI / dữ liệu | IBM Plex Sans / IBM Plex Mono | Toàn site |

**Lớp B — 3 module nội dung, mỗi module giữ bảng màu/bo góc/shadow RIÊNG, port gần như nguyên văn từ mockup gốc của nó, không gộp chung với Lớp A:**

| Module | Nguồn mockup | Đặc điểm giữ nguyên, không đồng hoá với module khác |
|---|---|---|
| `DataTable` (response) | `candidates-admin.html` | Bo góc 10px, status pill theo ngữ cảnh (`fresh/cached/slow`), avatar-initial chip tím nhạt, skeleton shimmer lúc load |
| `FlowDiagram` (internals, khối 1) | `request-architecture.html` v2 | Node-card bo 10px, icon vẽ bằng div thuần (không icon font/emoji), connector SVG 1 hướng duy nhất, badge đếm đặt góc trên-phải card |
| `LogTerminal` (internals, khối 2) | `server-terminal.html` | Bảng màu **cố định** đen/xanh-phosphor (`#0b0d0c` nền, `#39ff85` chữ lệnh) — **không đổi theo light/dark mode của trang**, đúng chủ đích gốc "nơi duy nhất cố ý dùng 1 bảng màu khác" |

→ Lý do tách 2 lớp: "cùng 1 structure cho whole labs" nghĩa là **mọi lab dùng đúng 3 module này ở đúng vị trí**, không phải "mọi thứ tô cùng 1 màu". Mỗi module là 1 kernel component độc lập về style; lab chỉ truyền data vào, không viết lại CSS của module.

### Quy tắc cấu trúc bắt buộc cho mọi lab (không riêng n-plus-one-query)
1. `response` luôn bọc bởi `DataTable`/`ResponseCard` — giữ đúng style module ở trên; cột table đổi theo data từng lab, màu/bo góc/pill không đổi.
2. `internals` luôn có **đúng 2 khối xếp chồng**: `FlowDiagram` trên, `LogTerminal` dưới — không lab nào thêm khối thứ 3 tự chế; nếu 1 lab không cần diagram phức tạp, diagram co lại còn 1–2 node, **không xoá khối**.
3. `FlowDiagram` dùng đúng ngôn ngữ node-card + connector 1 hướng của mockup gốc — không lab nào tự vẽ SVG tay kiểu khác.
4. `LogTerminal` luôn giữ đúng bảng màu phosphor cố định, read-only, auto-scroll-to-latest, dùng `formatLogLine`/`{ text }` convention đã sửa ở `lab.js`.
5. Lớp A (`--lab-*`) chỉ chi phối hero/control/verdict/label — **không rò vào style riêng của 3 module**; 3 module chỉ dùng chung `--accent` (tím) và font-family với Lớp A, còn lại giữ token riêng của mình.

### Việc này đổi gì trong tài liệu đã có
- `source/lab.css` hiện định nghĩa token mint/navy — cần thêm bộ token `--lab-*` (Lớp A) cho chassis, và 3 file CSS kernel riêng (hoặc 3 block scoped class) cho Lớp B. Đề xuất: **thay hẳn** mint/navy ở chassis, vì đó là lý do bị chê "trash" ban đầu; giữ 2 hệ song song chỉ gây rối.
- `docs/principles-lab-ui-plan.md` §7/§8 cần 1 đoạn "amendment" ghi rõ 2 lớp token này + lý do, **không xoá nội dung cũ** (giữ lịch sử quyết định).
- `docs/implement/decisions.log` thêm 1 dòng mới: đổi hệ màu/font instrument theo mô hình 2 lớp, tham chiếu file plan này + link mockup v2.

---

## 3. Component kernel cần build thật (dùng chung, không viết lại mỗi lab)

| Kernel component | File dự kiến | CSS riêng (Lớp B, không chung với chassis) | Input |
|---|---|---|---|
| `ResponseCard` (đã spec, chưa code) | `scripts/runtime/response-card.js` | dùng style `.rc-*` port từ `candidates-admin.html` | status, ms, body node/children |
| `DataTable` (mới — thay cho bảng admin hardcode) | `scripts/runtime/data-table.js` | tiếp tục `.rc-*` (table/pill/avatar) | columns config + rows (từ `store.select()` kết quả thật) |
| `FlowDiagram` (mới — thay SVG tay) | `scripts/runtime/flow-diagram.js` | style `.fd-*` port từ `request-architecture.html` | list node (id, label, icon) + list edge (from, to) + đếm lần bắn lại (từ `costs().length` theo table) |
| `LogTerminal` (mới — thay LogStream thô) | `scripts/runtime/log-terminal.js` | style `.lt-*` port từ `server-terminal.html`, bảng màu cố định không theo theme trang | dùng lại `buildLogStream`/`formatLogLine` đã sửa, chỉ đổi lớp vỏ hiển thị |

Mỗi lab (`scripts/labs/*.js`) chỉ gọi 4 kernel này với data thật của mình qua `RunContext.els` — không viết lại UI riêng, và không được sửa CSS riêng (`.rc-*`/`.fd-*`/`.lt-*`) của từng kernel để "hợp" màu lab đó — màu đã cố định theo mockup đã duyệt.

---

## 4. Thứ tự thực hiện đề xuất

1. ~~Duyệt sample gộp~~ — **xong**: `lab-detail-sample.html` v2 đã duyệt (link ở đầu file). Layout 4 vùng + 2-lớp style (chassis chung / 3 module riêng) đã chốt, dùng làm tham chiếu khi code thật.
2. Code 4 kernel component thật trong `scripts/runtime/`, port đúng CSS `.rc-*` / `.fd-*` / `.lt-*` từ mockup (không thiết kế lại), viết test (`tests/`) cho từng kernel riêng (giống cách `lab.js` đang được test).
3. Áp vào **1 lab duy nhất** (n-plus-one-query) với data thật từ `store.costs()` — đúng thứ tự `instrument-revamp.md` §6 đã đề xuất.
4. Thêm token `--lab-*` (chassis) trong `source/lab.css`, chạy `npm run verify`, xác nhận không phá 18 trang khác (lúc này mới có 3 trang) và không phá `tools/check-contract.mjs`.
5. Roll-out sang 2 lab còn lại, cập nhật `docs/principles-lab-ui-plan.md` (amendment), ghi `decisions.log`.

---

## 5. Việc không nằm trong plan này
- Không đổi routing `/labs/` (đó là plan khác: `labs-rename-and-landing-revamp.md`).
- Không đổi nền động/card hug ở trang landing — đó là UI của landing, khác với UI *trong* 1 lab.
- Không quyết định thay số liệu diagram bằng animation phức tạp hơn mức mockup đã duyệt.
