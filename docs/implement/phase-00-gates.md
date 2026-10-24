# P00 — Gates & Toolchain

> **Mục tiêu:** dựng 4 cổng kiểm tra (typecheck · lint · test · build) **trước khi có code để kiểm**, trên một repo hiện chưa có dòng JS nào.
> **Vì sao đi trước:** quyết định D4 trong [`README.md`](README.md). Thêm lint/type vào sau khi runtime đã viết xong = một đợt refactor không tạo giá trị nào.
> **Ước lượng:** 0.5 ngày · **Tiền đề:** không có.

---

## 1. Phạm vi

**Làm:** `package.json`, `tsconfig.json`, `eslint.config.mjs`, `tests/` khởi tạo, 2 tool kiểm tra rỗng-nhưng-chạy-được, cập nhật `.gitignore`, cập nhật CI.

**Không làm:** bất kỳ CSS / runtime / trang nào. Nếu trong P00 bạn thấy mình đang viết `store.js` → sai phase, dừng.

---

## 2. Các bước thực thi

### Step 0.1 — `package.json` (chỉ devDependencies)

**Action:** tạo file ở root.

```json
{
  "name": "principles-lab",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20.11" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "test": "node --test tests/",
    "test:watch": "node --test --watch tests/",
    "test:coverage": "node --test --experimental-test-coverage tests/",
    "check:budget": "node tools/budget.mjs",
    "check:contract": "node tools/check-contract.mjs",
    "verify": "npm run typecheck && npm run lint && npm run test && npm run check:budget && npm run check:contract",
    "build": "npm run verify",
    "serve": "python -m http.server 8000"
  },
  "devDependencies": {
    "@eslint/js": "^9.14.0",
    "@types/node": "^22.9.0",
    "eslint": "^9.14.0",
    "globals": "^15.12.0",
    "linkedom": "^0.18.5",
    "typescript": "^5.6.3"
  }
}
```

**Target:**
- `dependencies` **rỗng vĩnh viễn**. Mọi thứ người đọc tải về phải là file mình viết (LUẬT 14).
- `"type": "module"` để `tests/*.mjs` và `scripts/**/*.js` cùng một hệ module → test import thẳng file production, không có shim.
- `serve` giữ nguyên cách chạy cũ trong `README.md` gốc của repo — không đổi trải nghiệm dev.

**Require self-check:** `npm install` xong, `git status` **không** thấy `node_modules` (xem Step 0.6).

---

### Step 0.2 — `tsconfig.json` (typesafe cho JS thuần — D3)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node"],

    "allowJs": true,
    "checkJs": true,
    "noEmit": true,

    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["scripts/**/*.js", "scripts/**/*.d.ts", "tools/**/*.mjs", "tests/**/*.mjs"]
}
```

**Target:** type check **không** sinh file nào (`noEmit`) → site vẫn nạp `.js` gốc, D2 không bị vi phạm.

**Quyết định cần ghi nhận:** `noUncheckedIndexedAccess: true` sẽ làm việc truy cập `rows[i]` phải kiểm null. Đây là chủ ý — labs làm việc với bảng dữ liệu sinh ra, và `undefined` lọt vào instrument là lỗi hiển thị khó tìm nhất của loại UI này.

---

### Step 0.3 — `eslint.config.mjs` (flat config, eslint 9)

```js
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "assets/**", "certificates/**"] },

  js.configs.recommended,

  // Code chạy trên trình duyệt
  {
    files: ["scripts/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.browser },
    rules: {
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      curly: ["error", "multi-line"],
      "no-implicit-globals": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name=/^(innerHTML|outerHTML|insertAdjacentHTML)$/]",
          message: "Dung textContent hoac tao node. Site day security khong duoc dung innerHTML."
        }
      ]
    }
  },

  // LUAT 16: moi thoi gian mo phong phai di qua clock.js
  {
    files: ["scripts/labs/**/*.js", "scripts/hub.js"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "setTimeout", message: "Dung clock.js (tran 4s, Skip, Esc)." },
        { name: "setInterval", message: "Dung clock.js." }
      ]
    }
  },

  // Tool va test chay tren Node
  {
    files: ["tools/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.node },
    rules: { "no-console": "off" }
  }
];
```

**Target:** 3 rule đặc thù (`innerHTML`, `setTimeout`, `console`) là **cơ chế thực thi rulebook**, không phải sở thích style. Mỗi rule map tới một luật trong UI plan §13 — ghi message bằng tiếng Việt không dấu để đọc được trong mọi terminal.

---

### Step 0.4 — Khởi tạo `tests/` với fixture thật

**Action:** tạo `tests/_helpers.mjs` và `tests/toolchain.test.mjs`.

`tests/_helpers.mjs` — 3 helper dùng cho mọi phase sau:

| Helper | Vai trò |
|---|---|
| `makeDom(html)` | bọc `linkedom.parseHTML`, trả `{ document, window }`; dùng cho test `lab.js` từ P01 |
| `fakeStorage()` | `localStorage` giả, có chế độ `throwing` để test LUẬT 12c (bọc try/catch) |
| `readFile(rel)` | đọc file repo cho test golden / budget |

`tests/toolchain.test.mjs` — 3 case kiểm chính bộ cổng (tránh tình trạng "test pass vì không có test"):

1. `linkedom` dựng được DOM và `document.querySelector` hoạt động.
2. `fakeStorage({ throwing: true })` ném khi `setItem` → xác nhận helper mô phỏng đúng môi trường Safari private mode.
3. `package.json` có `dependencies` rỗng — **test này canh LUẬT 14 vĩnh viễn**, và là một trong hai test đáng giá nhất của P00.

`tests/isolation.test.mjs` — **test đáng giá thứ hai, canh LUẬT 0** (D11 trong [`README.md`](README.md); plan §1.1). Bốn case:

| # | Case | Vì sao |
|---|---|---|
| 1 | Không file nào trong `index.html` + `pages/**` chứa chuỗi `principles/` | Portfolio không được giới thiệu Lab |
| 2 | Không file nào trong `principles/**` link tới `../index.html`, `index.html` ở gốc, hay `pages/*.html` | Lab không được dẫn về portfolio |
| 3 | Không file nào trong `principles/**` nạp `source/styles.css` hoặc `source/case-study.css` | Hai site không chung CSS (plan §6.1 quyết định 2) |
| 4 | Không file nào trong `principles/**` chứa `cdn.simpleicons.org` | Lab không có logo stack; đó là nhu cầu của portfolio |

**Ở P00 chưa có file nào trong `principles/`** → 3 case cuối pass theo kiểu "không có gì vi phạm". Đúng và cố ý: test tồn tại **trước** thứ nó canh, nên không có cửa sổ thời gian nào mà vi phạm lọt vào không bị phát hiện.

**Target:** từ P00, repo đã có hai test *bảo vệ hai quyết định kiến trúc* (`dependencies` rỗng, và isolation), không phải test trang trí.

---

### Step 0.5 — 2 tool kiểm tra (rỗng ở P00, có nội dung từ P01)

**`tools/budget.mjs`** — đọc bảng trần byte §2.2 UI plan từ một object literal trong chính file, `stat` từng file, in bảng, exit 1 nếu vượt.

```js
const BUDGET = {
  "source/principles.css": 14 * 1024,
  "source/lab.css": 18 * 1024,
  "scripts/runtime": 24 * 1024,   // tong thu muc
  "scripts/hub.js": 6 * 1024
};
```

- File chưa tồn tại → **skip, không fail** (P00 chưa có file nào). Cấu trúc này cho phép tool chạy pass từ P00 và tự chặt dần theo phase.
- Thêm cột `% trần` để thấy đang gần ngưỡng — quan trọng hơn pass/fail, vì nó cảnh báo trước.

**`tools/check-contract.mjs`** — P00 chỉ dựng khung: nhận danh sách file `principles/*.html`, hiện chưa có file nào → exit 0 kèm dòng `no pages yet`. Từ P02 kiểm thật (xem phase-02 Step 2.7).

**Target:** cả 2 tool chạy được ngay ở P00 → `npm run verify` xanh ngay từ commit đầu. **Một pipeline xanh từ commit đầu là điều kiện để nó không bao giờ bị bỏ qua.**

---

### Step 0.6 — `.gitignore` + `.nojekyll`

`.gitignore` thêm:

```gitignore
node_modules/
*.tsbuildinfo
coverage/
.DS_Store
```

`.nojekyll` (file rỗng ở root): tắt xử lý Jekyll của Pages — cần vì sẽ có file bắt đầu bằng `_` (`_template.html`, `_states.html`) mà Jekyll bỏ qua theo mặc định. **Không có file này thì P01 sẽ mất `_states.html` trên production và rất khó đoán ra lý do.**

---

### Step 0.7 — CI: verify trước deploy (D6, D7)

**Action:** sửa `.github/workflows/jekyll-docker.yml` → đổi tên file thành `deploy.yml` (tên cũ nói sai, repo không dùng Jekyll), thêm job `verify`.

```yaml
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npm run verify

  build:
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Strip non-site files
        run: rm -rf tests tools docs node_modules package.json package-lock.json tsconfig.json eslint.config.mjs
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: "." }
```

**Target:**
- `needs: verify` → không thể deploy code hỏng type/lint/test.
- Bước `Strip non-site files` thực thi D7. **Kiểm bằng cách mở `phucphanvan.site/package.json` sau khi deploy — phải 404.**

**Require:** `npm ci` cần `package-lock.json` được commit. Commit nó.

---

## 3. Deliverables

| File | Trạng thái cuối P00 |
|---|---|
| `package.json` + `package-lock.json` | devDeps only, 10 script |
| `tsconfig.json` | strict + checkJs, noEmit |
| `eslint.config.mjs` | recommended + 3 rule đặc thù dự án |
| `tests/_helpers.mjs` | `makeDom`, `fakeStorage`, `readFile` |
| `tests/toolchain.test.mjs` | 3 case, có case canh `dependencies` rỗng |
| `tests/isolation.test.mjs` | 4 case canh LUẬT 0 (link 2 chiều, CSS dùng chung, CDN) |
| `tools/budget.mjs` | chạy được, skip file chưa có |
| `tools/check-contract.mjs` | khung, exit 0 |
| `.gitignore`, `.nojekyll` | cập nhật / mới |
| `.github/workflows/deploy.yml` | verify → build → deploy |

---

## 4. Self-check (bắt buộc chạy, dán output vào commit message)

### Cổng tự động

```bash
npm install
npm run typecheck     # G1 → 0 error
npm run lint          # G2 → 0 error 0 warning
npm test              # G3 → 3 pass 0 fail
npm run build         # G4 → ca 5 buoc exit 0
```

### Kiểm tiêu cực (quan trọng hơn kiểm xanh)

Một cổng chưa được chứng minh là *bắt được lỗi* thì chưa phải cổng. Làm 4 phép thử phá hoại rồi revert:

| # | Phá | Kỳ vọng |
|---|---|---|
| 1 | Tạo `scripts/tmp.js` với `/** @param {number} n */ export const f = (n) => n.toUpperCase();` | `typecheck` **fail** |
| 2 | Thêm `el.innerHTML = x;` vào `scripts/labs/tmp.js` | `lint` **fail** kèm message tiếng Việt |
| 3 | Thêm `"linkedom"` vào `dependencies` | `test` **fail** ở `toolchain.test.mjs` case 3 |
| 4 | Tạo `source/lab.css` 20 KB rác | `check:budget` **fail** |
| 5 | Thêm `<a href="principles/">Principles</a>` vào `index.html` | `test` **fail** ở `isolation.test.mjs` case 1 |
| 6 | Tạo `principles/tmp.html` có `<link href="../source/styles.css">` | `test` **fail** ở `isolation.test.mjs` case 3 |

Sau 6 phép thử: `git checkout .` và `rm` file tạm. **Phase này chưa xong nếu chưa chạy 6 phép thử — đây là deliverable thật của P00, không phải các file config.**

Phép thử 5 và 6 quan trọng riêng: chúng chứng minh **LUẬT 0 có hiệu lực kỹ thuật**, không chỉ là một dòng trong tài liệu. Nếu một trong hai không fail thì isolation chưa được canh, và sáu tháng nữa sẽ không ai nhớ nó từng là một quyết định.

### Kiểm tay

- [ ] M-CI: push lên branch phụ → thấy job `verify` chạy và pass trên GitHub Actions.
- [ ] Deploy thử → `/<domain>/package.json` trả 404, `/<domain>/` vẫn hiện trang cũ bình thường.

---

## 5. Exit gate — tick hết mới sang P01

- [ ] `npm run build` exit 0, không warning.
- [ ] 6 phép thử phá hoại đều fail đúng cổng kỳ vọng, đã revert.
- [ ] `git status` sạch, `node_modules` không bị track.
- [ ] CI: `verify` → `build` → `deploy` chạy đủ 3 job trên `main`.
- [ ] Site cũ **không thay đổi gì về mặt người dùng** (P00 là phase vô hình với người đọc).
- [ ] `docs/implement/decisions.log` đã tạo, có dòng đầu ghi ngày chốt D1–D10.
- [ ] Commit `chore(p00): verification gates green`.

---

## 6. Tripwire

| Dấu hiệu | Hành động |
|---|---|
| Cần thêm bất kỳ gói vào `dependencies` | **Dừng.** Đọc lại LUẬT 14. Nếu vẫn cần → ghi decisions.log, đổi §2.1 UI plan trước khi cài |
| `tsc` đòi chuyển sang `.ts` để diễn đạt được type | Dùng `scripts/types.d.ts` (ambient) — đó là lý do D3 chọn `.d.ts` thay vì annotate inline |
| P00 vượt 1 ngày | Đang làm quá phạm vi: nhiều khả năng đã bắt đầu viết runtime. Cắt lại, đẩy phần đó sang P01 |
| Muốn thêm prettier / husky / lint-staged | Hoãn. Chưa có file nào để format, và pre-commit hook trên repo 1 người là ma sát không đổi lấy gì |
