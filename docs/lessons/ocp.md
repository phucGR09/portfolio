# OCP — Open/Closed Principle

> Category: Code Design · Difficulty: intermediate · Blast radius: expensive
> Part of the [SOLID](./solid.md) family. Module: **Interview Scorecards**.

---

## 1. Lecture

**Formal statement:** software entities should be open for extension, but closed
for modification.

**Plain version:** adding a new *case* of something your code already handles
should mean *adding* code next to the existing cases, not *editing* the code that
already handles the old ones. "Closed" doesn't mean frozen forever — it means a
working, tested piece of logic shouldn't have to be re-opened and re-verified just
because a sibling case showed up.

This is the SOLID letter people misread most often, usually in one of two
directions: as "never change anything, ever" (impossible, and not what it says),
or as "build an extension point for everything up front" (that's **not** OCP —
that's the mistake [YAGNI](./yagni.md) exists to catch; see the note at the end of
this lesson).

**The rule in one sentence:** *when the second case of a thing arrives, you should
be adding a new branch next to the first one, not reopening and re-testing the
branch that already works.*

### Why production code cares

Every "if this type, do X; if that type, do Y" chain is a ticking OCP violation:
the third type means editing a function that the first two types already depend
on working correctly. One typo in that edit silently changes behavior for a type
nobody meant to touch. OCP's payoff is narrow but real: the blast radius of
"add case #3" shrinks to "the new code for case #3," instead of "the function
that case #1 and #2 also run through."

---

## 2. Example — Interview Scorecards, HireFlow

HireFlow originally scores one kind of interview: the phone screen. The scoring
function reads a fixed set of answers and produces a 1–5 rating. Six months in,
the team adds the technical interview, which scores differently — code quality,
problem-solving, communication, each weighted. The fastest path is an `if` inside
the existing scoring function: `if interviewType == "phone", score this way; if
interviewType == "technical", score that way`. It ships, it works.

Three months later, culture-fit interviews need scoring too, and the same function
gets a third branch. Now a bug fix to the phone-screen branch — tightening how a
borderline rating rounds — requires reading and re-testing a function that also
decides technical and culture-fit scores, because all three live in one body. A
typo in the shared setup code above the `if` chain silently shifts every
interview type's score on the next deploy, and nobody who touched the file that
day was working on phone screens at all.

The fix: each interview type's scoring lives in its own self-contained rule,
registered into a lookup the orchestrator consults by type. Adding culture-fit
scoring becomes *writing a new rule file*, not *editing the file phone-screen
scoring depends on*.

---

## 3. The Lab

**Phase 1 — Real app UI.** HireFlow's "Interview Scorecards" settings page. The
control is a dropdown: "Add a new interview type." In `Naive` mode, adding
"Panel Interview" opens a simulated diff of the *existing* scoring function with
a new branch inserted mid-file. In `Principled` mode, the same action creates a
new, self-contained rule card next to the existing ones — no existing card is
touched.

**Phase 2 — Architecture flow.** Naive: one box, `ScoreCalculator`, with an
internal branch per interview type — phone, technical, culture-fit all drawn as
forks *inside* the same box, sharing the box's setup code. Adding panel interview
means adding a fourth fork inside that same box. Principled: one small
`ScoreCalculator` box that does nothing but look up a rule by type, with four
peer boxes beside it (`PhoneScreenRule`, `TechnicalRule`, `CultureFitRule`,
`PanelRule`) — each independent, none aware the others exist, the calculator
unchanged by the fourth box's arrival.

**Phase 3 — Explain & response.** Add "Panel Interview" in Naive mode: the lab's
diff view highlights the inserted branch in context, and reports
`1 new case added · 1 existing function re-opened · 3 existing cases re-tested as
a precaution`. Same action in Principled mode: `1 new case added · 0 existing
files touched · 0 existing cases re-tested`. The explanation underneath: the
*cost of adding a case* didn't change — what changed is whether that cost is paid
by code that already shipped.

---

## 4. Trade-offs

**Apply this when** you can already see a second or third case on the horizon
*with real evidence* — a second interview type already in the product roadmap,
not a hypothetical fourth one. The seam (the lookup, the rule interface) earns its
cost the moment case #2 actually exists.

**Don't when** there is exactly one case and no second one in sight. Building the
rule-lookup machinery for a single scoring type is not OCP — it's premature
abstraction, and it's indistinguishable in cost from the mistake
[YAGNI](./yagni.md) is written to catch. The resolution to hold onto: **OCP tells
you how to extend once a second case is real; YAGNI tells you not to build the
extension point while it's still imaginary.** Ship the `if` for case #1. Extract
the seam when case #2 arrives, not before.

## 5. Where this bites in practice

Payment method handling, file-format exporters, discount-rule engines, pricing
tiers — anywhere "type" is a parameter to a function with a growing `if`/`switch`
chain. The early sign: a function whose first ten lines are unrelated to the type
being branched on, repeated inside every branch.

## 6. Carry it away

- The first case doesn't need a seam. The second case is where OCP's advice
  actually applies — not before.
- If adding a new case means scrolling through code for cases you didn't touch,
  that function is closed when it should be open.
- A growing `if`/`switch` on a "type" field is the single most common shape of an
  OCP violation — and the easiest to recognize before it grows a fourth branch.

## 7. Connections

Parent: [`solid.md`](./solid.md). Previous in the shared story:
[`srp.md`](./srp.md) — OCP's seam only has somewhere clean to live once scoring has
already been pulled into its own responsibility. Most confused with:
[`yagni.md`](./yagni.md) (see §4 above) and [`dry.md`](./dry.md) (OCP is about
*behavior* that varies by case; DRY is about a *fact* that must stay identical
everywhere — don't reach for OCP's seam just because two branches currently look
similar).
