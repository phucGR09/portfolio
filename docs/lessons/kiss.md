# KISS — Keep It Simple, Stupid

> Category: Code Design · Difficulty: foundational · Blast radius: annoying
> Module: **Interview Scheduling**.

---

## 1. Lecture

**Formal statement:** systems work best when they are kept simple rather than
made complex; unnecessary complexity should be avoided.

**Plain version:** the question KISS asks is narrow and specific: **does the
machinery in this code match the actual shape of the problem it's solving?**
Not "is this code short" — short code can be cryptic, and cryptic isn't simple.
Not "is this code dumb" — the name is a joke, not an instruction to write naive
code. KISS is violated when a problem that a plain comparison would solve gets
solved with a configurable rule engine, a state machine, or a layer of
abstraction that exists because it felt more "professional," not because the
problem demanded it.

KISS and [YAGNI](./yagni.md) are frequently the same code smell with two
different causes, and it's worth separating them clearly: KISS is about solving
a *real, present* problem with more machinery than it needs; YAGNI is about
building machinery for a problem that doesn't *exist* yet. A scheduling
conflict-checker built as a generic rule engine for one simple overlap check is
a KISS problem — the problem is real, the solution is oversized. A rule engine
built to handle five kinds of conflict the product doesn't have yet is a YAGNI
problem — the extra cases are imaginary.

**The rule in one sentence:** *solve the problem you actually have, with the
smallest mechanism that solves it correctly — complexity has to be earned by a
complex problem, not assumed as a default.*

### Why production code cares

Unnecessary complexity has a cost that compounds: every engineer who touches the
code first has to understand the machinery before they can find the two lines
that do the actual work, every bug fix has more surface area to search, and the
mechanism itself — the rule engine, the state machine — now needs its own tests,
documentation, and maintenance, for a problem that was never that hard.

---

## 2. Example — Interview Scheduling, HireFlow

HireFlow needs to check, before confirming an interview slot, whether it
overlaps with any time the interviewer already has booked. The actual problem is
exactly one comparison: does the new time range start before the existing one
ends, and end after the existing one starts?

The version that shipped instead models scheduling as a configurable rule
engine: a list of named "conflict rules" that get evaluated in priority order,
each rule returning a weighted score, with a threshold that decides whether the
booking is "allowed," "allowed with warning," or "blocked." It was built this
way because someone reasoned that conflict-checking "might need to get more
sophisticated later" — soft conflicts, buffer time, interviewer preferences.

None of that arrived. What arrived instead was a bug: the threshold tuning for
"allowed with warning" had an off-by-one in the scoring weights, and two
interviewers were double-booked for three weeks before anyone noticed, because
diagnosing *why* a specific booking was allowed required tracing through the
rule evaluator's scoring, not reading a single `if` statement that says what it
means.

---

## 3. The Lab

**Phase 1 — Real app UI.** HireFlow's "Schedule Interview" page: a recruiter
picks a time slot against an interviewer's existing calendar. The toggle is
`Naive` (the rule-engine version) vs `Principled` (the direct overlap check) —
both are offered the same set of test bookings, including one deliberately
tricky back-to-back pair, to show that both versions produce the correct
allow/block decision for every case that actually occurs.

**Phase 2 — Architecture flow.** Naive: a box labeled `ConflictRuleEngine`
containing four internal sub-boxes (rule registry, priority sorter, weighted
scorer, threshold evaluator) that a booking request has to pass through in
sequence before producing a yes/no. Principled: one box, `hasOverlap(a, b)`, with
a single arrow in and a single arrow out — no sub-boxes, because there is nothing
underneath the comparison worth drawing.

**Phase 3 — Explain & response.** Run the tricky back-to-back pair through both:
both report the correct decision, `allowed: true`. The lab's point isn't a
different outcome — it's a different *cost to understand* the outcome. The
report for Naive mode includes `rules evaluated: 4 · scoring weights applied: 3
· lines a reviewer must read to confirm this decision: ~40`; Principled reports
`comparisons made: 1 · lines a reviewer must read: 1`. The explanation: both are
correct today, but only one of them is checkable at a glance when the next
developer has to trust why a booking was allowed.

---

## 4. Trade-offs

**Apply this when** a direct, obvious implementation already handles every case
the problem actually has. If the simple version is correct and the complex
version isn't *more* correct — only more elaborate — simple wins.

**Don't when** the problem genuinely has the complexity the code reflects: a
pricing engine with real regional tax rules, a permissions system with real
overlapping roles. Collapsing real complexity into a falsely simple single
function doesn't satisfy KISS — it just hides the complexity somewhere harder to
find, usually as a pile of special cases bolted onto the "simple" version later.

## 5. Where this bites in practice

Validation logic, conflict/overlap checks, and permission checks are common
sites for invisible over-engineering — each looks like it "should" be
configurable, so it gets built that way before anyone confirms it needs to be.
The early sign: a mechanism (engine, registry, pipeline) whose entire configured
behavior, read end to end, is one comparison or one rule.

## 6. Carry it away

- Ask what the problem actually requires before reaching for a general
  mechanism — not what it might require if it changes later.
- If a reviewer has to trace through more than one layer to confirm a decision
  that's logically one comparison, the code is more complex than the problem.
- A generic rule engine for one rule isn't flexible — it's one rule wearing a
  costume, and the costume is what breaks under a tuning mistake.

## 7. Connections

Cousin, same smell different cause: [`yagni.md`](./yagni.md) — KISS is "too much
machinery for a problem that exists," YAGNI is "machinery for a problem that
doesn't exist yet." Related: [`soc.md`](./soc.md) — splitting concerns is not the
same move as adding machinery; a KISS violation often hides *inside* one of the
"concerns" SoC would otherwise correctly separate.
