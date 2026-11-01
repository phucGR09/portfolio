# YAGNI — You Aren't Gonna Need It

> Category: Code Design · Difficulty: intermediate · Blast radius: expensive
> Module: **Export / Reporting**. This lesson's lab is already on the roadmap as
> `build-it-for-the-future` (`docs/principles-lab-plan.md §5.4`, Lab 6, interaction
> archetype **G — Complexity Meter**). This file is the lecture content for that
> planned lab, reframed into the HireFlow world used across this lesson set.

---

## 1. Lecture

**Formal statement:** don't implement something until it is actually needed.

**Plain version:** YAGNI is about *when* to pay a cost, not whether a feature is
good. Every piece of flexibility — a plugin system, a configuration option, a
format you support "just in case" — costs something the moment it's written:
more code to read, more paths to test, more surface area for the next change to
break. YAGNI says pay that cost when a *second real case* shows up, not when you
can merely imagine one might.

The hardest part of YAGNI is that the imagined future case often sounds
reasonable — "we'll probably need to export to PDF eventually" is a plausible
sentence. YAGNI doesn't ask whether it's plausible. It asks whether there is
*current evidence* — a customer asking, a roadmap commitment, a real deadline —
or just a guess dressed up as foresight.

**The rule in one sentence:** *build the one thing you have evidence for; refactor
into the general version when the second real case actually arrives, not before.*

### Why production code cares

Speculative generality doesn't just cost the time to build it — it costs
*everyone who ships a feature after it*. Every new requirement now has to
navigate the flexibility that was added for cases that never happened, and the
abstraction built for six formats still has to be understood, tested around, and
kept working, in service of one format that ever shipped.

---

## 2. Example — Export / Reporting, HireFlow

Product asks for one thing: let a recruiter export the candidate list as a CSV
file. The team, anticipating that "customers will probably want other formats
too," builds an `ExportStrategyFactory`: an interface for export strategies, a
registry, and six implementations — CSV, PDF, XLSX, JSON, XML, and Parquet —
plus the configuration plumbing to pick one, scaffolded in before launch because
it seemed like the obvious way to build an export feature "properly."

Eighteen months later, exactly one format has ever been used: CSV. The other
five formats have no customers, no tests anyone trusts (because nothing exercises
them), and a security review flags the XML exporter for an entity-expansion
vulnerability in a code path that has never once run outside a test file. Fixing
it takes a day, for a format nobody has ever requested. Meanwhile, the one format
real customers actually use sits behind the same factory abstraction as the five
nobody touches — any change to CSV export has to go through the same seam built
for formats that don't exist in practice.

The fix in hindsight: ship the CSV export as one function. When a second format
is actually requested — with a real customer attached — extract the seam then,
shaped by what the *second* real case needs, which is almost never identical to
what was guessed a year earlier.

---

## 3. The Lab (as planned)

The plan's own spec for this lab (Lab 6, interaction archetype G — Complexity
Meter) already matches this lesson's shape closely; restated here across the
same three phases used throughout this lesson set:

**Phase 1 — Real app UI.** HireFlow's "Export candidates" button. The control is
a checklist of formats "that might be needed in the future" (PDF, XLSX, JSON,
XML, Parquet) next to a toggle: `Abstract now` (build the factory for all
checked formats) vs `Build the one` (ship CSV only). Checking more boxes in
`Abstract now` mode visibly grows the exporter; `Build the one` stays flat
regardless of what's checked, because nothing is actually being built for the
unchecked, hypothetical formats.

**Phase 2 — Architecture flow.** `Abstract now`: one box, `ExportStrategyFactory`,
with a peer box per checked format, a shared interface connecting all of them,
and a configuration layer deciding which to instantiate — six boxes for one real
customer-facing feature. `Build the one`: a single box, `CsvExporter`, with no
factory, no interface, no registry — nothing between the button and the CSV
output.

**Phase 3 — Explain & response.** The plan's own verdict numbers apply directly:
`Abstract now` reports something like `files: 7 · interfaces: 3 · branches: 11 ·
tests needed: 14`, against `Build the one`'s `files: 1 · branches: 2 · tests: 3`
— and the lab's punchline metric is `7 files to maintain, 1 format ever shipped`
versus `1 file, 1 format, refactor when the second arrives`. The explanation: the
six-format version isn't more "complete" — it's the same one real feature, plus
five maintenance liabilities with no customer behind them.

---

## 4. Trade-offs

**Apply this when** there is no concrete evidence yet for a second case — ship
the smallest thing that satisfies the actual request.

**Don't when** the decision is genuinely *irreversible* or expensive to change
later: a public API's request shape, a database schema, a file format you'll
have to keep reading forever. YAGNI is a license to skip speculative work on
*reversible* decisions — it is not a license to skip thinking ahead on
decisions that are hard to undo. The plan's own backlog note states this
boundary directly: build simple for reversible choices; think before committing
to irreversible ones.

## 5. Where this bites in practice

Plugin architectures, configuration systems, and "extensible" exporters or
importers built ahead of any second real integration — anywhere "flexible" was
chosen over "sufficient" without a second customer in hand. The early sign: an
abstraction with exactly one real implementation, long after it shipped.

## 6. Carry it away

- "We'll probably need X eventually" is not evidence. A roadmap commitment, a
  signed customer, or a real deadline is evidence — build for that, not for the
  plausible guess.
- Ship the one case. Extract the general version when the second case is real,
  shaped by what that case actually needs.
- Before adding flexibility, ask whether the decision is reversible. If it is,
  default to simple. If it isn't, that's the one place YAGNI steps back.

## 7. Connections

Cousin, same smell different cause: [`kiss.md`](./kiss.md). Most confused with:
[`ocp.md`](./ocp.md) — OCP is about how to extend cleanly *once a second case is
real*; YAGNI is about not building that extension seam while the second case is
still imaginary. Read together, they resolve the apparent contradiction between
"design for change" and "don't over-engineer."
