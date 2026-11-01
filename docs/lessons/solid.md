# SOLID — hub lesson

> Category: Code Design · Difficulty: foundational → advances into the 5 sub-lessons
> Not a runnable lab on its own — this page is a **syllabus with one shared story**,
> and five doors out to the real lessons. See [`README.md`](./README.md) for the
> HireFlow app this lesson and its five children all live in.

---

## 1. Lecture

Five letters, one worry: **what happens to this code the second time it has to
change?** Each letter is a different way that worry shows up:

| Letter | The worry, in one line |
|---|---|
| **S** — Single Responsibility | This class has more than one reason to change. |
| **O** — Open/Closed | Adding a new case means editing code that already works. |
| **L** — Liskov Substitution | A "kind of" X doesn't actually behave like an X. |
| **I** — Interface Segregation | Callers are forced to depend on methods they never use. |
| **D** — Dependency Inversion | A high-level rule is welded to one low-level detail. |

SOLID is not five unrelated rules bolted together — it's five angles on the same
object-oriented question: **how do you draw the boundaries of a class so that
change in the business stays local to one place in the code?** That's the line to
hold onto across all five lessons; without it, SOLID turns into five things to
memorize instead of one thing to recognize.

**The rule in one sentence:** *a class, and the contracts it exposes, should have
exactly one reason to change — and extending behavior should never require
re-opening code that already ships.*

### Why production code cares

A startup's first version of a feature is almost always SOLID-violating, and that
is **fine** — five letters of discipline on a feature nobody has validated yet is
wasted discipline. SOLID starts earning its cost at the *second* change: the
second notification channel, the second interview type, the second billing
provider. The lessons below are all written at that second-change moment, on
purpose — that's the moment each letter is actually arguing about.

---

## 2. The shared story — one module, five refactors

Every sub-lesson below touches a different corner of HireFlow, but they are
sequenced so that **the same underlying shape** ("one class is quietly doing two
unrelated jobs") shows up five times, and each time the fix is a different letter:

1. **SRP** — `Application Review`: one class parses, scores, notifies, and logs an
   application. First crack: pull these four jobs apart.
2. **OCP** — `Interview Scorecards`: once scoring is its own thing (thanks, SRP), a
   second interview type arrives. Does adding it mean editing the thing that scores
   phone screens, or adding next to it?
3. **LSP** — `Notification Channels`: the class that SRP pulled out to "just send a
   notification" now has three kinds of channel. One of them doesn't honor the
   same promise the other two do.
4. **ISP** — `Admin Dashboard widgets`: the data-access contract those channels and
   everything else talk to has grown fat. A small widget now has to implement
   methods it will never call.
5. **DIP** — `Billing & Invoicing`: the high-level "charge this subscription" rule
   is hard-wired to one payment provider's concrete client — the same wrong-direction
   dependency, one layer up from where SRP started.

Reading all five in order is reading one feature grow up.

---

## 3. The Lab — a hub page, not a stage

Because this page doesn't run a simulation of its own, its "lab" is a **map**,
told the same three-phase way the sub-lessons are, scaled down:

**Phase 1 — Real app UI.** A single screen: HireFlow's `Application` detail page,
the one a recruiter opens after a candidate applies. Five small labeled hotspots
sit on it — Parsing, Scoring, Notifying, Logging, Billing-on-hire — one per letter.
Hovering a hotspot previews, in one line, what breaks there if that letter is
ignored.

**Phase 2 — Architecture flow.** The same page's module map, drawn once, with each
of the five sub-lesson's "after" boundary already in place — this is the
end-state diagram the five lessons build toward piece by piece. Reading it here
first, then meeting each piece again inside its own lesson, is what makes the
later lessons feel like zooming in rather than starting over.

**Phase 3 — Explain & response.** No system response to show — instead, a short
comparison table: the same five user-visible symptoms ("the wrong candidate got
the rejection email," "adding panel interviews touched four files," "Slack alerts
silently vanish," "the billing widget crashes," "switching payment providers takes
a sprint") each pointing at the letter that explains it. This is the table a
learner should be able to fill in **from memory** after finishing the five
sub-lessons — it doubles as the course's own self-check.

---

## 4. Trade-offs

SOLID is a vocabulary for a specific kind of pain — **code that resists the second
change** — not a checklist to apply to every file on day one. Over-applying it to
code with no evidence of a second case yet is exactly what the [YAGNI](./yagni.md)
lesson warns against; under-applying it to code already on its third or fourth
change is what the other four lessons below are for.

## 5. Carry it away

- Don't start with SOLID. Start with the second change, and reach for the letter
  that names what hurt.
- If you can't say *which* letter a refactor serves, it's probably a style
  preference, not a SOLID fix — name the letter before you touch the code.
- The five letters share one question across different altitudes. Keep that
  question, not the acronym, as the thing you actually check for.

## 6. Connections

Children: [`srp.md`](./srp.md) · [`ocp.md`](./ocp.md) · [`lsp.md`](./lsp.md) ·
[`isp.md`](./isp.md) · [`dip.md`](./dip.md)

Siblings outside SOLID: [`soc.md`](./soc.md) asks the same question SRP does, one
altitude down, at a function instead of a class. [`dry.md`](./dry.md) and
[`yagni.md`](./yagni.md) are the two lessons most often confused with OCP — see
the connection map in [`README.md §4`](./README.md#4-the-connection-map).
