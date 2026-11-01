# ISP — Interface Segregation Principle

> Category: Code Design · Difficulty: intermediate · Blast radius: annoying
> Part of the [SOLID](./solid.md) family. Module: **Admin Dashboard widgets**.

---

## 1. Lecture

**Formal statement:** no client should be forced to depend on methods it does not
use.

**Plain version:** a contract (an interface, a shared base class, an API surface)
should be sized to what the *smallest* caller actually needs — not to the union of
everything every caller has ever needed. When one fat contract serves everyone,
every new caller either implements methods it will never call, or every existing
caller gets touched when one unrelated caller needs one more method added to the
shared contract.

ISP is SRP's question — "does this thing have one job?" — asked about a *contract*
instead of a class. A fat interface is a single-responsibility violation one
altitude up: instead of one class doing four unrelated jobs, it's one interface
*promising* four unrelated capabilities, and every implementer has to answer for
all four whether it needs them or not.

**The rule in one sentence:** *a contract should promise exactly what its
smallest caller needs — split it by who actually uses what, not by what's
convenient to declare once.*

### Why production code cares

A fat interface couples unrelated callers through the contract itself: adding a
method for caller A's benefit means every other implementer of that interface —
including caller B, who will never call the new method — has to provide *some*
implementation of it, even if it's a stub that does nothing or throws. That stub
is a landmine: harmless until something calls it, at which point it's a
production incident traced back to a method nobody realized was fake.

---

## 2. Example — Admin Dashboard widgets, HireFlow

HireFlow's data layer exposes one `CandidateRepository` contract, used by the
full application screens: search candidates, export a candidate list to CSV,
anonymize a candidate's record for a GDPR deletion request, and sync a hire
decision to the billing system so invoicing can start. All four methods, one
interface, because it was convenient to have one thing to inject everywhere.

A small admin-dashboard widget is added — a sidebar card that just needs to
*search and display* the five most recent candidates. It depends on
`CandidateRepository`, because that's the thing that has `search`. Since the
language requires implementing the whole contract to use it in this codebase's
testing setup, the widget's test double provides `export`, `anonymizeForGdpr`,
and `syncToBilling` as stubs that do nothing.

Months later, someone extends `anonymizeForGdpr` to also revoke the candidate's
active interview invites, and ships it behind the assumption that "every
implementer of this method already does the full anonymization flow, so this
addition is safe everywhere." The admin widget's stub, untouched since it was
written, doesn't revoke anything — because it was never a real implementation, it
was a method that had to exist so the widget would compile. The bug isn't
discovered until a GDPR audit finds candidates who were "anonymized" through the
dashboard's quick-action button and still have live interview invites.

The fix: split the fat contract into `CandidateSearch` (what the widget actually
needs), `CandidateExport`, `CandidateCompliance`, and `CandidateBillingSync` — the
widget depends on `CandidateSearch` alone, and has no stub to go stale, because
there's nothing on that narrow contract it doesn't actually use.

---

## 3. The Lab

**Phase 1 — Real app UI.** HireFlow's admin dashboard, with a "Recent Candidates"
widget and an "Export" button that doesn't belong to this widget's job. In
`Naive` mode, the widget's export button is wired to the shared repository's stub
implementation and silently does nothing when clicked — no error, no file, no
feedback, because the stub was never real. In `Principled` mode, the widget has
no export button at all — it was never part of this widget's contract — and a
second control shows the *separate*, fully-implemented export widget that depends
on the narrow `CandidateExport` contract instead.

**Phase 2 — Architecture flow.** Naive: one large box, `CandidateRepository`,
with four labeled compartments (search / export / anonymize / billing-sync), and
four implementer boxes all drawn with an arrow to the *entire* large box — each
implementer's arrow is the same thickness regardless of how many compartments it
actually uses. Principled: four small boxes, one per compartment, each with
arrows only from the implementers that use that specific capability — the admin
widget's box now has exactly one outgoing arrow.

**Phase 3 — Explain & response.** Click "Export" on the dashboard widget in Naive
mode: the lab reports `method called: export() · stub executed: true · file
produced: none · error raised: none` — the single most dangerous combination in
the whole site, a call that looks successful and does nothing. In Principled
mode, the same button doesn't exist on this widget, so there's no call to make —
the lab reports `0 unused contract methods on this implementer`. The explanation:
the bug in Naive mode isn't a missing feature, it's a *present but fake* one, and
fat interfaces are exactly the shape that produces fake methods nobody meant to
leave half-built.

---

## 4. Trade-offs

**Apply this when** different callers of a shared contract genuinely use
different, non-overlapping subsets of it — that mismatch is the signal the
contract is bundling unrelated capabilities.

**Don't when** every real caller actually uses the whole contract. Splitting a
cohesive, fully-used interface into five narrow ones just to satisfy the letter
of ISP creates five contracts to keep in sync for zero actual decoupling benefit
— the same trap SRP warns against for classes.

## 5. Where this bites in practice

Repository/DAO interfaces that accumulate a method per feature over a codebase's
lifetime, and plugin or SDK interfaces that every integration has to implement in
full even when they only use one capability. The early sign: an implementer whose
body is mostly `throw new NotImplementedError()` or empty stubs.

## 6. Carry it away

- A stub method that "does nothing for now" is not neutral — it's a promise that
  the contract is being honored, made by code that isn't honoring it.
- If an implementer's test double needs to fake three methods it never calls,
  that's the contract's problem, not the test's.
- Split a contract along "who uses what," checked against real callers — not
  along a guess at what future callers might someday want.

## 7. Connections

Parent: [`solid.md`](./solid.md). Previous in the shared story:
[`lsp.md`](./lsp.md). Next: [`dip.md`](./dip.md). Same question, one altitude
down: [`srp.md`](./srp.md) — a fat interface is a single-responsibility violation
at the contract level instead of the class level.
