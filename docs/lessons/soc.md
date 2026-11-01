# SoC — Separation of Concerns

> Category: Code Design · Difficulty: foundational · Blast radius: expensive
> Module: **Offer Letters**.

---

## 1. Lecture

**Formal statement:** a program should be divided into distinct sections, each
addressing a separate concern, with minimal overlap between them.

**Plain version:** SoC is the broadest of the ten principles in this set — it's
the general instinct that [SRP](./srp.md) applies to a class and
[ISP](./isp.md) applies to a contract. SoC applies it everywhere: to a function,
a layer, an entire codebase's folder structure. The concerns it usually names in
a typical web request are: *parsing the input*, *enforcing a business rule*,
*talking to storage*, and *producing output* — four different jobs that are easy
to write as one function and expensive to untangle later.

The giveaway that concerns have merged into one place isn't length — a 20-line
function can mix concerns just as easily as a 200-line one. The giveaway is:
**can each concern be tested, changed, or reasoned about without dragging the
others along?** If testing "does this request get approved correctly" requires
also standing up a real database and a real email sender, the business rule and
the infrastructure have merged into one concern.

**The rule in one sentence:** *parsing, business rules, storage, and output are
four different jobs — keep them in four different places so that changing one
doesn't require re-reading or re-risking the other three.*

### Why production code cares

A function that mixes concerns can't be unit-tested without faking half the
world, can't be reused in a different context (a batch job that needs the same
approval rule without the HTTP layer around it has to copy the whole function),
and turns a one-line infrastructure change (switching email providers) into an
edit of the same code that also decides who gets approved.

---

## 2. Example — Offer Letters, HireFlow

Approving a candidate and sending their offer letter is, today, one function
triggered by a single "Send Offer" button: it reads the raw HTTP request body,
checks the business rule for whether this candidate is eligible for an offer at
this stage, generates the offer PDF, writes the decision to the database, and
calls the email provider to send it — all five steps, one function, in order.

The business rule — eligibility — changes for a legitimate reason: a new policy
requires a second approver's sign-off above a certain salary band. Implementing
it means editing the same function that also parses the HTTP body, generates
PDFs, and calls the email provider, because there's no boundary inside the
function to edit around. Testing the new sign-off rule means either mocking the
PDF generator and the email provider just to check one `if` statement, or — more
commonly — not testing it in isolation at all, and finding out it's wrong when a
candidate's offer silently skips the second approval in production.

The fix: split the five jobs into their own places — a request parser, an
eligibility rule, a PDF generator, a persistence step, and a notifier — connected
by a thin coordinator that calls each in order but makes no decisions of its own.
The sign-off change becomes an edit to the eligibility rule alone, testable with
no PDF generator and no email provider in the loop at all.

---

## 3. The Lab

**Phase 1 — Real app UI.** HireFlow's "Send Offer" button on a candidate's
profile. The toggle is `Naive` (one handler does everything) vs `Principled`
(parsing, rule, PDF, storage, and notification are separate steps coordinated by
a thin handler). Both produce the same visible outcome for a straightforward
approval. The control that shows the difference: "simulate adding the
second-approver sign-off rule" — in Naive mode this opens a diff of the whole
handler; in Principled mode it opens a diff of the eligibility rule alone.

**Phase 2 — Architecture flow.** Naive: one box, `SendOfferHandler`, with the
HTTP parsing, the eligibility check, the PDF generation call, the database write,
and the email call all drawn as sequential steps *inside* that one box — no
internal boundary, so an arrow pointing into the eligibility step and an arrow
pointing into the email step both terminate inside the same box. Principled: five
boxes in a row (`RequestParser`, `EligibilityRule`, `OfferPdfGenerator`,
`OfferRepository`, `OfferNotifier`), connected by a thin `OfferCoordinator` whose
only job is to call each one in turn and pass the result along — no business
logic lives in the coordinator itself.

**Phase 3 — Explain & response.** Add the sign-off rule in Naive mode: the lab
reports `1 rule changed · 1 function re-opened · PDF generation and email-sending
code re-touched in the same diff`. In Principled mode: `1 rule changed ·
EligibilityRule only · 0 unrelated steps touched`. A second run shows the testing
story directly: testing the new rule in Naive mode requires the lab's simulated
PDF generator and email sender to both be stood up just to check the approval
logic; in Principled mode, the rule is tested with nothing else running at all.
The explanation: "send an offer" was never one job — it was five, and only
Principled mode lets each one change on its own.

---

## 4. Trade-offs

**Apply this when** a piece of code visibly does more than one *kind* of job —
parsing, deciding, storing, and notifying are different enough in nature that
they almost always benefit from separation, even in a small feature.

**Don't when** the "separation" would split one genuinely atomic step into
pieces that only ever change together and are never tested or reused
independently — at that point it's the same trap [SRP](./srp.md) warns against:
fragmentation without any real decoupling benefit.

## 5. Where this bites in practice

Request handlers in web frameworks are the single most common site for this
violation — "controller" code that quietly accumulates business rules and
database calls directly inside the function that parses the HTTP request,
because that's where it's easiest to add one more line. The early sign: a
request handler whose test requires a running database or a real network call
to exercise a rule that has nothing to do with either.

## 6. Carry it away

- Name the concerns in a function before writing it: parsing, deciding, storing,
  responding. If one function does all four, that's four reasons it will change.
- If testing one business rule requires faking storage and a network call, the
  rule and the infrastructure have merged into one concern.
- A thin coordinator that only calls other pieces in order, with no decisions of
  its own, is the signal concerns have actually been separated — not just moved
  around.

## 7. Connections

Structurally the same question as [`srp.md`](./srp.md), asked at a function's
altitude instead of a class's. Previous module in the shared story:
[`dip.md`](./dip.md) → [`dry.md`](./dry.md), both in Billing & Invoicing. Related
smell: [`kiss.md`](./kiss.md) — a function with merged concerns often also hides
unnecessary complexity *inside* one of those concerns; separating them is usually
the first step toward noticing the second problem.
