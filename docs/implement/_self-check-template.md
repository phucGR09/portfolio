# Self-check — copy một bản cho MỖI lab / MỖI PR

> Dùng: copy toàn bộ file này vào mô tả PR (hoặc `docs/implement/checks/<slug>.md`), điền, không xoá ô nào.
> Ô không áp dụng → ghi `n/a` **kèm lý do**. Ô trống = chưa kiểm, và chưa kiểm thì chưa xong.

```text
Lab / trang:  ................................   Phase: P0_
Khuôn (A–G):  ...............   Category: ...............   Stage bg: ...............
Ngày:         ............      Thời gian viết thật: ...... giờ   (ghi vào decisions.log)
```

---

## 1. Cổng tự động (dán output thật, không viết "pass")

```bash
npm run typecheck
npm run lint
npm run lint:css        # tu P03
npm test
npm run check:budget
npm run check:contract
npm run build
```

| Cổng | Lệnh | Kết quả dán vào |
|---|---|---|
| G1 typesafe | `npm run typecheck` | |
| G2 lint | `npm run lint` | |
| G4 mock test | `npm test` | |
| G5 budget | `npm run check:budget` | |
| G5 contract | `npm run check:contract` | |
| G3 build | `npm run build` | |

- [ ] 0 error, 0 warning ở cả 6 dòng trên.
- [ ] Test mới cho lab này: ..... case, tất cả pass.
- [ ] `scripts/runtime/**` coverage vẫn ≥ 85% (`npm run test:coverage`).

---

## 2. Stage Contract — 10 điều (§7.1 UI plan)

| # | Điều | Cách kiểm | ✓ |
|---|---|---|---|
| 1 | 4 vùng có `data-zone` đúng tên | tự động (`check:contract`) | |
| 2 | Thứ tự DOM = ①②③④; sắp lại chỉ bằng `grid-area` | **tắt CSS, đọc lại trang** | |
| 3 | 6 trạng thái đều trông cố ý | so với `_states.html` | |
| 4 | Mọi số truy nguyên về accounting `store.js` | tự động (grep số literal) | |
| 5 | 360px không horizontal scroll ở cấp trang | DevTools 360×640 | |
| 6 | Keyboard đi hết; `role="switch"` + `aria-checked`; Response `aria-live="polite"` | tab-through + screen reader | |
| 7 | ≤ 2 hue mới, lấy từ signal set hoặc identity | tự động (đếm trong stage CSS) | |
| 8 | Stage CSS scoped `.stage--<id>`, ≤ 120 dòng | `wc -l` | |
| 9 | `Reset` trả về idle **giống hệt** ban đầu | reset 3 lần, so sánh | |
| 10 | Có `ModelNote`; có dòng "runs in your browser"; CLS < 0.1 | Lighthouse + đọc | |

**Vi phạm ≥ 1 điều → lab không có trang riêng.** Gộp vào bài tổng quan, đừng thương lượng với chính mình ở đây.

---

## 3. Sáu trạng thái (§7.2 UI plan)

| State | Phải thấy gì | ✓ |
|---|---|---|
| `idle` | câu mời gọi rõ; instrument hiện **khung + trục**; giữ đúng chiều cao cuối cùng | |
| `running` | dữ liệu nhỏ giọt + counter chạy + `Skip to result` sau 1.2s | |
| `settled` | kết quả đầy đủ, Verdict có số, `Reset` sẵn sàng, **không đẩy layout** | |
| `compare` | chạy cả 2 mode → before/after **tự ghép** | |
| `error` | lỗi mô phỏng hiện **như dữ liệu**, không alert, không console | |
| `noscript` | bảng tĩnh + verdict + 1 ảnh; **không khung trắng** | |

- [ ] Đã mở từng trạng thái bằng tay (kể cả `error` — kích bằng cách inject lỗi, không chỉ đọc code).

---

## 4. Checklist tay M1–M7

| Mã | Kiểm | ✓ | Ghi chú |
|---|---|---|---|
| M1 | 360px không scroll ngang | | |
| M2 | Tab-through đi hết; `Esc` dừng run; không bẫy focus | | |
| M3 | Screen reader đọc Response khi nó đổi | | |
| M4 | `prefers-reduced-motion`: reveal 3 bậc, **không mất nội dung dạy học** | | |
| M5 | Tắt JS: `<noscript>` đủ nghĩa | | |
| M6 | Lighthouse ≥ 95 cả 4 mục (mobile) | | P:__ A:__ BP:__ SEO:__ |
| M7 | 6 trạng thái khớp `_states.html` | | |

---

## 5. Nội dung — 8 khối

| # | Khối | ✓ | Ghi chú |
|---|---|---|---|
| 1 | Hero — **symptom bằng ngôn ngữ người dùng/PM**, chưa nói nguyên lý | | |
| 2 | Situation 120–180 từ; nói rõ vì sao code ban đầu *hợp lý* | | |
| 3 | The Lab | | |
| 4 | Under the hood + **sơ đồ SVG riêng của trang này** | | |
| 5 | The principle — giờ mới gọi tên, ≤ 60 từ | | |
| 6 | **Trade-offs & when NOT to — KHÔNG ĐƯỢC RỖNG** (LUẬT 6b) | | |
| 7 | From experience — hoặc ghi rõ "mô phỏng từ X", **không nói quá** | | |
| 8 | Carry it away — checklist 4–6 gạch + link liên quan | | |

- [ ] Khối 6 nêu được **khi nào áp dụng nguyên lý này là SAI** (không phải chỉ "cần cân nhắc").
- [ ] Không có câu tuyệt đối ("luôn", "không bao giờ") mà thiếu điều kiện biên.
- [ ] `provenance` đúng mức: mặc định `classic`; `field-report` chỉ khi **ẩn danh hoàn toàn** (không tên công ty / sản phẩm / người); lưỡng lự thì hạ mức (plan §3.3).

---

## 6. Trung thực (§9.4 UI plan — mục dễ bị bỏ nhất)

- [ ] `ModelNote` phát biểu mô hình **bằng số** (ví dụ: `1 round-trip ≈ 0.8ms + 0.02ms/row, jitter ±12%`), không phải chữ "simulated".
- [ ] `seed` được in ra trên trang → người đọc dựng lại được đúng bộ dữ liệu.
- [ ] Không số literal nào trong lab (grep đã pass, nhưng đọc lại bằng mắt một lượt).
- [ ] Dữ liệu người rõ ràng là giả (`.invalid`, `Ứng viên 0042`, `$2b$fake$…`).
- [ ] Trang security: `SafetyLine` **trong stage**, không ở footer.
- [ ] **LUẬT 0:** trang không có link nào ra ngoài `/principles/`, không nạp CSS của portfolio, không nhắc kinh nghiệm tác giả. `npm test -- --test-name-pattern isolation` pass.
- [ ] Verdict không làm tròn theo hướng có lợi; đơn vị đi kèm mọi số.

---

## 7. Review gate — tự chấm trước khi nhờ review (§14 UI plan)

Pass = **≥ 11/14 và không trục nào 0**.

| Trục | 0 | 1 | 2 | Điểm |
|---|---|---|---|---|
| Trung thực | số hardcode, không `ModelNote` | có `ModelNote` nhưng mơ hồ | mô hình bằng số, seed công bố, jitter thật | |
| Hình đúng vấn đề | dùng khung lab khác cho tiện | đúng nhưng nhạt | hình chỉ dùng được cho đúng vấn đề này | |
| Mắt biết nhìn đâu | nhiều thứ động cùng lúc | có điểm nhấn | đúng một thứ dạy học, không bỏ sót được | |
| 6 trạng thái | idle/error chưa thiết kế | có nhưng thô | cả 6 cố ý, `compare` tự ghép | |
| Trade-off | rỗng hoặc sáo | chung chung | nêu được *khi nào áp dụng là sai* | |
| Mobile + a11y | scroll ngang / không tab được | dùng được | 360px gọn, keyboard đủ, SR đọc được | |
| Hợp đồng | vi phạm ≥ 2 điều §7.1 | vi phạm 1 điều | pass cả 10 | |
| | | | **Tổng** | /14 |

---

## 8. Bài test người lạ 90 giây (quan trọng hơn mọi mục trên)

Đưa link cho người **chưa biết dự án**, **không nói gì**. Bấm đồng hồ.

```text
Người 1: tự ra verdict trong ....... giây   | bấm sai / lưỡng lự ở: .....................
Người 2: tự ra verdict trong ....... giây   | bấm sai / lưỡng lự ở: .....................
```

- [ ] Cả hai ra được verdict trong 90 giây **mà không cần giải thích**.

Không đạt thì **điểm rubric bao nhiêu cũng không cứu được** — cả site tồn tại để làm đúng việc đó. Danh sách "bấm sai ở đâu" chính là việc cần sửa, không phải phản hồi để an ủi.

---

## 9. Nhượng bộ đã chấp nhận (ghi cả vào `decisions.log`)

```text
1. .............................................. vì ..............................
2. .............................................. vì ..............................
```

- [ ] Mỗi dòng trên đã có một dòng tương ứng trong `docs/implement/decisions.log`.
