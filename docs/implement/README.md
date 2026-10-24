# Principles Lab — Implementation Program (supervisor plan)

> Tài liệu điều phối thực thi. Nguồn thiết kế: [`../principles-lab-plan.md`](../principles-lab-plan.md) (nội dung & mục tiêu) và [`../principles-lab-ui-plan.md`](../principles-lab-ui-plan.md) (UI, rulebook, stage contract).
> Vai trò tài liệu này: **chia việc thành phase thực thi được, mỗi phase có cổng kiểm tra tự động pass/fail.**
> Ngày: 2026-10-24 · Trạng thái: chưa code dòng nào.

---

## 0. Cách dùng bộ tài liệu này

| File | Dùng khi nào |
|---|---|
| `README.md` (file này) | Trước khi bắt đầu, và mỗi lần chuyển phase |
| `phase-00-gates.md` | Dựng cổng kiểm tra (typecheck / lint / test / build) |
| `phase-01-chassis.md` | Dựng nền: CSS chassis, runtime, `_states.html`, lab rỗng |
| `phase-02-mvp.md` | 3 lab MVP + landing riêng của Lab |
| `phase-03-instruments.md` | +5 trang, khuôn D & E, deep-link, progress |
| `phase-04-completion.md` | Đủ 18 trang, `stamp.mjs`, trang theo principle, OG |
| `phase-05-open.md` | Bản `/vi/`, RSS, submit problem, dashboard |
| `_self-check-template.md` | Copy vào mỗi PR / mỗi lab mới làm checklist |

**Luật đọc:** không bắt đầu phase N khi mục *Exit gate* của phase N−1 còn ô chưa tick. Đây là luật cứng duy nhất của chương trình này.

---

## 1. Quyết định của supervisor (chốt, kèm lý do)

Những quyết định này **thay đổi hoặc làm rõ** tài liệu thiết kế. Ghi lại để sau đọc còn biết tại sao.

| # | Quyết định | Lý do | Ảnh hưởng |
|---|---|---|---|
| D1 | **Thêm `package.json` chỉ có `devDependencies`** | Bạn yêu cầu typesafe + eslint + test. Không có package manager thì không có cổng kiểm tra; không có cổng thì "xong" là ý kiến, không phải sự thật | Deploy **không đổi**: Pages vẫn serve HTML/CSS/JS thô |
| D2 | **Deploy pipeline khác verification pipeline** | Tài liệu thiết kế chốt "không build step" — đúng, và vẫn giữ. Cái bị cấm là *bundler/transpile để chạy site*, không phải *script kiểm tra* | `npm run build` = `verify`, không sinh artifact nào để deploy |
| D3 | **Typesafe = JSDoc + `tsc --noEmit --checkJs`**, không chuyển sang `.ts` | Giữ được "chạy trực tiếp trên Pages" (file `.js` nạp thẳng) mà vẫn strict. Chuyển `.ts` buộc phải transpile để chạy → vi phạm D2 | Mọi public API trong `scripts/` phải có JSDoc type |
| D4 | **Phase 00 (gates) đi TRƯỚC phase chassis** | Dựng runtime trước rồi mới thêm lint/type sẽ sinh một đợt refactor vô nghĩa. Cổng phải tồn tại trước thứ nó canh | Thêm 1 phase nhỏ vào đầu lộ trình |
| D5 | **Mock test = `node --test` (built-in) + `linkedom` cho DOM** | 0 dependency cho logic thuần; `linkedom` để test `lab.js` render 4 vùng. Không Jest/Vitest: chúng kéo theo transform pipeline mà D2 vừa loại bỏ | `tests/` nằm ngoài phần được deploy |
| D6 | **CI chạy gate trước khi deploy** | Workflow hiện tại upload thẳng lên Pages, không kiểm gì — một lab hỏng type vẫn lên production | Thêm job `verify`, `build` phải `needs: verify` |
| D7 | **`node_modules/`, `tests/`, `tools/`, `docs/` bị loại khỏi artifact Pages** | Không ship thứ người đọc không cần | Thêm `.nojekyll` + bước lọc file trong workflow |
| D8 | **Stylelint: hoãn tới P03** (không làm ở P00) | Bạn chỉ yêu cầu eslint cho JS. CSS ở P01 do một người viết một lượt — lint chưa trả lãi. Tới P03 có ≥ 8 stage CSS mới cần | Budget check (`wc -c`) đã canh phần quan trọng nhất của CSS từ P01 |
| D9 | **Playwright: hoãn tới P04, và là optional** | 90% giá trị test nằm ở logic runtime (thuần, nhanh). E2E chỉ đáng khi có 18 trang cần smoke-check hàng loạt | P01–P03 kiểm tương tác bằng checklist tay + `linkedom` |
| D10 | **Mỗi phase kết thúc bằng 1 commit "gate green"** | Cần một điểm rollback sạch giữa các phase | Không squash commit xuyên phase |
| **D11** | **LUẬT 0 (isolation Lab ↔ portfolio) được canh bằng test, từ P00** | Người dùng đã chốt: Lab là **site học tập độc lập**, ở sub-path, có landing riêng, **không map với portfolio** (plan §1.1). Loại ràng buộc này bị phá bởi một lần "thêm tạm một link cho tiện", nên tài liệu không đủ — phải có test | `tests/isolation.test.mjs` ra đời ở P00, mở rộng ở P01, chạy trong `npm test` mọi phase |
| **D12** | **Giữ tên code `hub` (`scripts/hub.js`, key `pl:v1:hub`), nhưng prose dùng "landing"** | `hub` chỉ **khối catalog** bên trong landing. Rename file + key chỉ để khớp từ vựng là churn không đổi lấy gì, và key đã có version nên đổi sau vẫn rẻ | Đọc `hub.js` = "code của catalog trên landing" |

### Hệ quả của D11 cho mọi phase

| Phase | Việc liên quan tới isolation |
|---|---|
| P00 | Tạo `tests/isolation.test.mjs` (case 4 của Step 0.4) |
| P01 | Mở rộng: trang Lab **không nạp** `source/styles.css` / `case-study.css` |
| P02 | **Không chạm `index.html`** của portfolio; landing tự giới thiệu; `ProvenanceTag` thay badge cũ |
| P03–P05 | Mỗi trang mới chạy lại test; `/vi/` cũng không được link ra ngoài |

---

## 2. Lộ trình & mapping với tài liệu thiết kế

| Phase | Tên | Tương ứng UI plan | Kết quả kiểm chứng được | Ước lượng |
|---|---|---|---|---|
| **P00** | Gates & toolchain | *(mới — D4)* | 4 lệnh `npm run` pass trên repo gần như rỗng | 0.5 ngày |
| **P01** | Chassis & Shell | §12.1 (P0) | `_states.html`: 14 component × 6 trạng thái; lab rỗng chạy idle→settled→reset | 3–4 ngày |
| **P02** | MVP 3 lab + landing | §12.2 (P1) | Người lạ mở **landing**, tự tìm được một trang và bấm ra verdict trong 90s | 4–5 ngày |
| **P03** | Chiều sâu dụng cụ | §12.3 (P2) | 8 trang; khuôn D & E chạy; filter catalog có ích thật | 5–7 ngày |
| **P04** | Hoàn thiện 18 trang | §12.4 (P3) | 18/18 pass stage contract; `stamp.mjs` là đường duy nhất tạo trang | 7–10 ngày |
| **P05** | Mở | §12.5 (P4) | Có người gửi về một problem đáng làm | mở |

```text
P00 ──► P01 ──► P02 ──┬──► P03 ──► P04 ──► P05
 gates  chassis  MVP   │
                       └── điểm dừng an toàn: site đã dạy được một bài học thật
```

**Điểm dừng an toàn:** sau P02, site đã là một thứ **gửi link được cho người khác và họ học được**. P03+ là mở rộng. Nếu hết nhiệt, dừng ở P02 **vẫn là sản phẩm hoàn chỉnh**, không phải phế tích — vì landing tính số từ `catalog.js` nên 3 trang trông như *3 trang đã xong*, không như *15 trang còn thiếu*.

---

## 3. Bốn cổng kiểm tra — định nghĩa dùng chung cho mọi phase

Mọi phase tham chiếu đúng 4 cổng này. Định nghĩa một lần ở đây, không lặp lại trong từng file.

### G1 — Type safety

```bash
npm run typecheck     # tsc -p tsconfig.json --noEmit
```

- Pass = **0 error**. Không `@ts-ignore` trong `scripts/`; nếu buộc phải thì dùng `// @ts-expect-error <lý do>` kèm 1 dòng trong `docs/implement/decisions.log`.
- Bật `strict`, `checkJs`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- Public API của mọi module `scripts/runtime/` phải có JSDoc `@param` / `@returns`.

### G2 — Lint

```bash
npm run lint          # eslint . --max-warnings 0
npm run lint:fix      # eslint . --fix
```

- Pass = **0 error, 0 warning**.
- Rule đặc thù dự án (không phải preset):
  - chặn `innerHTML` / `outerHTML` / `insertAdjacentHTML` trong `scripts/labs/**` — XSS-by-habit trên chính site dạy security là lỗi không thể bào chữa;
  - chặn `setTimeout` / `setInterval` thô ngoài `scripts/runtime/clock.js` — LUẬT 16 (trần 4 giây, có `Skip`/`Esc`) chỉ thực thi được nếu mọi thời gian đi qua `clock`;
  - chặn `console.log` trong `scripts/**` (cho phép trong `tools/**`) — quan sát phải đi qua `logger.js` (§6.3 UI plan).

### G3 — Build success

```bash
npm run build         # alias của npm run verify
npm run verify        # typecheck && lint && test && check:budget && check:contract
```

- **P00 → P03:** `build` không sinh file nào — nó là composite gate. "Build success" = cả 5 bước exit 0.
- **Từ P04:** `build` = `stamp.mjs` (sinh HTML từ catalog) **rồi** verify, cộng bước `check:generated` xác nhận HTML đã commit khớp HTML vừa sinh (golden file). Đây là lúc dự án có build thật — đúng thời điểm tripwire §2.3 UI plan dự đoán.

### G4 — Mock test

```bash
npm test              # node --test tests/
npm run test:watch    # node --test --watch tests/
```

- Pass = **0 fail**, không `todo` bị bỏ quên.
- "Mock" ở đây có nghĩa chính xác: **không backend thật, không network, không browser thật**. Toàn hệ thống được mô phỏng trong bộ nhớ (`store.js` + `server.js`), nên test chạy được full-stack-logic trong vài trăm ms.
- Ngưỡng coverage **theo module, không theo repo**: `scripts/runtime/**` ≥ 85% line (`node --test --experimental-test-coverage`); `scripts/labs/**` chỉ cần test hàm `run()` — phần UI do checklist tay + contract check canh.

### G5 — Budget & contract (phụ trợ, chạy trong G3)

```bash
npm run check:budget     # tools/budget.mjs        — trần byte §2.2 UI plan
npm run check:contract   # tools/check-contract.mjs — stage contract §7.1, điều 1,2,4,7,8
```

### Checklist tay (không tự động hoá được, bắt buộc mỗi phase)

| Mã | Kiểm | Cách làm |
|---|---|---|
| M1 | 360px không scroll ngang | DevTools 360×640, mọi trang mới |
| M2 | Keyboard đi hết | Tab-through, không bẫy focus, `Esc` dừng run |
| M3 | Screen reader đọc Response | NVDA / VoiceOver, `aria-live="polite"` |
| M4 | `prefers-reduced-motion` | Bật OS setting → reveal 3 bậc, **không mất nội dung** |
| M5 | Tắt JS | `<noscript>` hiện bảng tĩnh, không khung trắng |
| M6 | Lighthouse ≥ 95 cả 4 mục | Chrome DevTools, chế độ mobile |
| M7 | 6 trạng thái trông cố ý | Mở `_states.html`, so với lab thật |

---

## 4. Cấu trúc thư mục đích (sau P04)

```text
repo/                            # 1 repo, 2 site doc lap (LUAT 0 / D11)
├─ index.html                    # PORTFOLIO — khong doi, khong link toi Lab
├─ pages/                        # PORTFOLIO — khong doi
├─ principles/                   # ===== LAB: site hoc tap doc lap =====
│  ├─ index.html                 # landing: hero + how-it-works + lab mini + catalog
│  ├─ _template.html             # P01 (bị stamp.mjs thay thế ở P04)
│  ├─ _states.html               # P01 — noindex, không link từ đâu
│  ├─ <slug>.html                # 1 file / problem
│  └─ by/<principle>.html        # P04
├─ source/  styles.css · case-study.css        # PORTFOLIO (Lab khong nap)
│           principles.css · lab.css           # LAB (token rieng)
├─ scripts/
│  ├─ runtime/  store · server · clock · logger · lab · fmt · rng · persist (.js)
│  ├─ labs/     <lab-id>.js
│  ├─ data/     seed.js · catalog.js
│  ├─ hub.js                     # catalog tren landing (D12)
│  └─ types.d.ts                 # D3 — typedef dùng chung
├─ tests/        *.test.mjs       # KHÔNG deploy (D7)
├─ tools/        check-contract · budget · stamp · og · rss (.mjs)  # KHÔNG deploy
├─ docs/implement/*.md            # KHÔNG deploy
├─ package.json · tsconfig.json · eslint.config.mjs · .nojekyll
└─ .github/workflows/deploy.yml   # verify ──► build ──► deploy
```

---

## 5. Nhật ký quyết định

Mọi lệch khỏi plan trong lúc code ghi vào `docs/implement/decisions.log`, format 1 dòng:

```text
2026-10-26 P01 | lab.js 320 dong > nguong 300 | tach render 4 vung sang zones.js | tripwire §12.1
```

Lý do: 18 trang viết trong nhiều tuần, người viết sẽ quên vì sao đã nhượng bộ. Đây là single source of truth cho các nhượng bộ — và một phần của nó trở thành nội dung thật trên trang `build-it-for-the-future` (changelog ở P04).
