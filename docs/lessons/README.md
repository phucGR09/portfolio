# Lesson content plan — SOLID, DRY, KISS, YAGNI, SoC

> Role of this folder: **content only**. No code, no file structure, no component
> design. Every file here is lecture + example + lab-mockup copy, written so it can
> be handed to implementation later without re-deriving the pedagogy.
> Companion to [`docs/principles-lab-plan.md`](../principles-lab-plan.md) and
> [`docs/principles-lab-ui-plan.md`](../principles-lab-ui-plan.md) — this folder fills
> the *content* layer those documents leave open; it does not change any decision
> already locked there (8-block shell, 4-zone Stage Contract, 6 states, category
> taxonomy, `provenance` tags).

---

## 1. Why these 10 lessons need one spine, not 10 islands

Your brief had three requirements that only work together if the content is built
as a *set*, not as 10 independent write-ups:

1. **Consistency** — a reader who finishes lesson 1 should already know how to read
   lesson 7, without re-learning a format.
2. **Connection** — the lessons should refer to each other, not sit side by side.
3. **A real app, not a toy snippet** — "real app UI" only means something if the
   same app shows up more than once.

The fix: **one fictional product, one cast of modules, used by every lesson.**
Not because the format is rigid — each lesson still picks its own shape (§3) — but
because the *world* the examples live in has to hold still for the connections to
read as real instead of coincidental.

---

## 2. The shared app — **HireFlow**

A small applicant-tracking product. Chosen deliberately close to what's already
live in your lab (`n-plus-one-query` uses a candidate list; `one-rule-five-places`
uses a VAT-invoice flow) — so these two existing labs become **native members of
this same universe** instead of unrelated demos sitting next to it.

| Module | What it does | Lesson that lives here |
|---|---|---|
| **Application Review** | A recruiter opens a submitted application: parse résumé, score it, notify the candidate, log the decision | SRP |
| **Interview Scorecards** | Each interview type (phone screen, technical, culture-fit) has its own scoring rule | OCP |
| **Notification Channels** | Email / SMS / Slack — candidate and recruiter alerts | LSP |
| **Admin Dashboard widgets** | Small read-only panels built against a shared data-access interface | ISP |
| **Billing & Invoicing** | Subscription charges, VAT, provider integration (Stripe-like) | DIP, and — already built — DRY |
| **Interview Scheduling** | Picking a time slot that doesn't clash with an existing one | KISS |
| **Export / Reporting** | Turning a candidate list into a downloadable file | YAGNI — already backlogged in your plan as `build-it-for-the-future` |
| **Offer Letters** | Approve a candidate, generate a PDF, email it, record it | SoC |

One app, eight corners of it, ten lessons. A reader who has been through three
lessons already recognizes "the candidate list" or "the VAT rate" the fourth time
it shows up — that recognition **is** the connective tissue your brief asked for.

---

## 3. The shape every lesson follows — and where it's free to differ

Locked (so lessons 1 and 10 read as the same course):

1. **Lecture** — the plain-language hook, the formal rule, why production code
   cares, one sentence to carry away.
2. **Example** — the HireFlow scenario, told as a before/after story. No code —
   described entirely in prose: what one piece of the module is responsible for,
   what changes, what breaks.
3. **The Lab**, told in three phases, matching how your Stage Contract already
   separates "what you see" from "what's underneath" from "what it means":
   - **Phase 1 — Real app UI.** What screen the learner is looking at, what the
     Naive/Principled toggle actually changes on that screen.
   - **Phase 2 — Architecture flow.** The module's internal shape, described as
     boxes and relationships in words — which piece calls which, where the
     violation lives structurally.
   - **Phase 3 — Explain & response.** What the system says back differently in
     each mode (an error, a number, a missed update), and the one-paragraph
     explanation of *why* that response changed.
4. **Trade-offs**, **where this bites**, **carry it away** — same job as the 8-block
   shell's blocks 6/7/8, phrased per lesson.
5. **Connections** — explicit links to sibling lessons and, where one exists
   already, to the real lab page.

Free to differ (per your "don't force the same format" instruction):

- **How Phase 2 is told.** A class hierarchy (LSP) reads as "a family tree with one
  cousin who doesn't behave like the others." A fat interface (ISP) reads as "one
  key that's supposed to open four doors." A scheduling check (KISS) barely needs
  a diagram at all — two time ranges and a yes/no. Pick what the mechanism asks for.
- **Length and tone of the Example.** SRP needs one paragraph; SoC — the same shape
  of problem, one function instead of one class — needs almost the same paragraph,
  on purpose (see §4). OCP needs a short sequence ("first ship, then extend") because
  the whole point is what happens *the second time* a requirement shows up.
- **Whether the lab is "spot it" or "run it."** Most lessons mirror the Request-
  Inspector / Attacker-Console style your existing labs use. SOLID's own page
  (`solid.md`) is the exception: it's a hub, not a runnable lab, and is written
  as one.

---

## 4. The connection map

Read this as the thing a "related" footer link should point to.

```text
SOLID (hub)
 ├─ SRP   → Application Review          → feeds the "what should split" question OCP answers next
 ├─ OCP   → Interview Scorecards        → cousin problem to YAGNI (OCP: extend without editing;
 │                                          YAGNI: don't pre-build the extension point you don't need yet)
 ├─ LSP   → Notification Channels       → cousin to DIP (both are about trusting an abstraction
 │                                          to behave the way its contract promises)
 ├─ ISP   → Admin Dashboard widgets     → cousin to SRP (a fat interface is a SRP violation
 │                                          one level up, at the contract instead of the class)
 └─ DIP   → Billing & Invoicing         → sets up DRY (same module, next lesson)

DRY   → Billing & Invoicing (VAT)       → already live as `labs/one-rule-five-places.html`
KISS  → Interview Scheduling            → cousin to YAGNI (KISS: this solution is too complex
                                            for the problem; YAGNI: this solution solves a problem
                                            that doesn't exist yet)
YAGNI → Export / Reporting              → already backlogged as `build-it-for-the-future` (Lab 6)
SoC   → Offer Letters                   → structurally the SRP story again, at the request-handler
                                            altitude instead of the class altitude
```

Three pairs are worth calling out by name in the actual lesson copy, because
learners confuse them constantly:

- **OCP vs YAGNI** — look like opposites, aren't. OCP says *design the seam before
  the second case arrives*; YAGNI says *don't build the seam before you have
  evidence a second case is coming*. The resolution both lessons should state:
  OCP is about how you extend once a second case is *real*; YAGNI is about not
  paying for a third, fourth, fifth case that's still imaginary.
- **KISS vs YAGNI** — KISS is about solution complexity for a problem that
  *exists*; YAGNI is about building for a problem that *doesn't exist yet*. Same
  smell (too much machinery), different cause.
- **SRP vs ISP vs SoC** — the same underlying question ("does this thing have one
  job?") asked at three altitudes: a class (SRP), a contract/interface (ISP), and
  a request handler / function (SoC). Naming this explicitly is what makes 10
  lessons feel like one course instead of ten synonyms.

---

## 5. Files in this folder

| File | Lesson | Existing lab it connects to |
|---|---|---|
| [`solid.md`](./solid.md) | SOLID (hub — not a standalone lab) | links to the 5 below |
| [`srp.md`](./srp.md) | Single Responsibility Principle | — |
| [`ocp.md`](./ocp.md) | Open/Closed Principle | — |
| [`lsp.md`](./lsp.md) | Liskov Substitution Principle | — |
| [`isp.md`](./isp.md) | Interface Segregation Principle | — |
| [`dip.md`](./dip.md) | Dependency Inversion Principle | — |
| [`dry.md`](./dry.md) | Don't Repeat Yourself | `labs/one-rule-five-places.html` (already built) |
| [`kiss.md`](./kiss.md) | Keep It Simple, Stupid | — |
| [`yagni.md`](./yagni.md) | You Aren't Gonna Need It | `build-it-for-the-future` (backlogged, plan §7, Lab 6) |
| [`soc.md`](./soc.md) | Separation of Concerns | — |

Suggested reading/build order: `solid.md` → `srp.md` → `ocp.md` → `lsp.md` →
`isp.md` → `dip.md` → `dry.md` → `soc.md` → `kiss.md` → `yagni.md`. This walks
HireFlow from the inside (one class) outward (one function, one module boundary,
one duplicated fact, one oversized feature) — each step reuses the vocabulary the
step before it just established.
