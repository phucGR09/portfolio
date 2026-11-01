# DRY — Don't Repeat Yourself

> Category: Code Design · Difficulty: intermediate · Blast radius: expensive ·
> Provenance: classic problem
> Module: **Billing & Invoicing**. **This lesson's lab already exists** —
> `labs/one-rule-five-places.html`. This file is the lecture companion to that
> lab, written to be read either before or after it.

---

## 1. Lecture

**Formal statement:** every piece of knowledge should have a single,
unambiguous, authoritative representation in a system.

**Plain version:** DRY is not about repeated *code* — it's about repeated
*facts*. A tax rate, a limit, a feature flag, a formula: if the same fact is
written down in five places, those five places are a promise that all five will
always agree. Nothing in the computer enforces that promise. A human has to
remember it, every time, forever — and the day one of the five is forgotten, the
system is quietly wrong in exactly one place, which is the hardest kind of wrong
to notice.

**The rule in one sentence:** *a fact that must be identical everywhere it's used
belongs in one place — not because duplication is ugly, but because a duplicated
fact will eventually disagree with itself.*

### Why production code cares

A duplicated fact doesn't fail loudly. It fails as a silent disagreement: four
screens show the new price, one still shows the old one, and nothing crashes,
nothing logs an error — a customer just gets charged the wrong amount, or quoted
the wrong tax, and the first anyone hears about it is a support ticket, not an
alert.

---

## 2. Example — the VAT rate, HireFlow billing

HireFlow's subscription price includes VAT, and the VAT rate started as one
number written into the checkout screen's code. When the invoice email needed the
same number, someone copied it over — one line, shipped the same day, entirely
reasonable in isolation. Then the admin billing report needed it. Then the
mobile app's account screen needed it. Each copy, on its own, looked like the
cheapest possible fix for the feature in front of whoever wrote it.

Then the VAT rate changed. Updating it meant finding and editing every place the
old number had been copied to — and the team found four. The fifth, the mobile
app, kept charging the old rate for weeks, because nobody who updated the other
four had the mobile codebase open that day, and nothing in the system said "there
is a fifth place."

---

## 3. The lab, as built

The real lab (`labs/one-rule-five-places.html`) runs exactly this scenario, and
its three phases map directly onto the Stage Contract's zones:

**Phase 1 — Real app UI.** Five small screens rendered side by side — cart,
invoice, email receipt, admin report, mobile app — each showing a VAT-inclusive
price. The control is a new rate plus a `Deploy` action, under a `Duplicated /
Single source` toggle. In duplicated mode, deploying updates four of the five
screens and leaves one on the old rate, labeled `inconsistent`. In single-source
mode, all five update from the one deploy.

**Phase 2 — Architecture flow.** The lab's "Under the hood" diagram draws the
rate fanning out from one source into the five screens — four lines in the
"honored" signal color, one line dashed and in the "missed" color, landing on
whichever screen a seeded random pick chooses that run (reproducible, not
hand-picked, so the lesson doesn't depend on "the mobile app is always the one
that forgets").

**Phase 3 — Explain & response.** The lab's verdict reports `5 files to change ·
1 missed · 1 silent money bug` for duplicated mode, against `1 file · 0 missed`
for single-source — the same fact, told as a number instead of a description.
The explanation underneath is the lesson's whole point stated plainly: deploying
from a single source doesn't make the team more careful, it removes the four
other places there was ever anything to forget.

---

## 4. Trade-offs

**Apply this when** a value must be *identical* everywhere it's used — a rate, a
limit, a flag, a formula that only has one correct answer at any given moment.

**Don't when** two pieces of code merely *look* similar today but change for
different reasons. That's the trade-off the lab itself calls out: two blocks that
coincidentally match right now aren't duplication, they're two domain rules that
happen to agree today and will need to diverge later — merging them creates
coupling between two things that were never actually the same fact.

## 5. Where this bites in practice

Pricing and tax rates, feature flags, API version strings, timeout values typed
as a literal number in more than one file — anywhere a value got copied because
setting up a shared source felt like overkill for something that "never
changes." The early sign, as the lab's own copy notes: grep the codebase for the
literal value and count more than one hit outside of tests.

## 6. Carry it away

- Before copying a value a second time, ask where it will need to change next,
  and put it there once.
- A number used in more than one place is a shared fact, not a coincidence —
  give it one address.
- Two similar-looking blocks aren't necessarily duplicates — check whether they
  change for the same reason before merging them.

## 7. Connections

Same module, previous lesson: [`dip.md`](./dip.md). Most confused with:
[`ocp.md`](./ocp.md) — OCP is about *behavior* that legitimately varies by case;
DRY is about a *fact* that must stay identical. Don't reach for an OCP-style seam
just because two values currently happen to match.
