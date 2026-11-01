# LSP — Liskov Substitution Principle

> Category: Code Design · Difficulty: intermediate · Blast radius: catastrophic
> Part of the [SOLID](./solid.md) family. Module: **Notification Channels**.

---

## 1. Lecture

**Formal statement:** objects of a subtype must be substitutable for objects of
their supertype without altering the correctness of the program.

**Plain version:** if your code says "this works for any `Notifier`," every single
kind of notifier has to actually honor that promise — not just the common ones you
tested by hand. A subtype that technically compiles against the parent's contract
but secretly throws, secretly returns a different shape, or secretly needs to be
called in a different order isn't a subtype — it's a bug wearing the parent's
costume.

This is the subtlest of the five letters because the violation is invisible at the
type-checker level. The code compiles. The tests for the common case pass. The
break only shows up the first time calling code trusts the general contract
instead of hand-checking which concrete subtype it has — which is the entire point
of writing against an abstraction in the first place.

**The rule in one sentence:** *if calling code has to ask "but which concrete kind
is this, really?" before it can trust the result, the substitution has already
failed — abstractions only pay off when every subtype keeps the same promise.*

### Why production code cares

The whole reason to write `notify(candidate, Notifier)` instead of `notify(candidate,
EmailNotifier)` is so new channels can be added without touching every caller. If
one channel secretly breaks the contract (throws where others return a status,
or needs setup the interface never mentions), every caller that trusted the
abstraction is now wrong — and the bug surfaces far from the code that caused it,
usually in production, usually for the one channel nobody manually tested that day.

---

## 2. Example — Notification Channels, HireFlow

HireFlow sends candidates two kinds of updates: email and SMS. Both implement the
same contract: `send(message) → returns a delivery status, never throws — a
failed send comes back as a status, not an exception`, because the calling code
(the review handler from the [SRP](./srp.md) lesson) is written once, against
that contract, and loops over every channel a candidate has opted into.

A third channel, Slack, gets added for internal recruiter alerts. Slack's SDK
throws an exception if the workspace isn't configured — and the fastest way to
ship it is to implement `send()` by calling that SDK directly, letting the
exception propagate. It compiles. It implements the same method signature. It
passes a quick manual test, because the test workspace happens to be configured.

In production, a recruiter who never set up Slack triggers a review. The loop
that trusted every channel to "return a status, never throw" hits the one channel
that does throw, and the whole notification step — including the *email*, which
would have worked fine — crashes before it runs. The candidate never gets their
email, not because email broke, but because the loop trusted a promise one
channel secretly didn't keep.

---

## 3. The Lab

**Phase 1 — Real app UI.** HireFlow's candidate timeline, showing a "Review
complete" event and whether each enabled channel delivered. The toggle is which
channel set is active: `Email + SMS` (both honor the contract) vs `Email + SMS +
Slack (misconfigured)` (Slack throws). A `Principled` mode swaps in a Slack
implementation that catches its own SDK's exception internally and returns a
`failed` status like every other channel does — same channel, same feature,
contract honored.

**Phase 2 — Architecture flow.** A family-tree diagram: `Notifier` at the top,
three children (`EmailNotifier`, `SmsNotifier`, `SlackNotifier`) below it, and the
review handler drawn calling the parent type in a loop — it never knows or asks
which child it's holding, by design. In the broken version, `SlackNotifier`'s box
is drawn with a jagged edge where its `send()` connects back up to the parent
contract, flagging the one child whose actual behavior (can throw) doesn't match
what the other two promise (never throws). In the fixed version, all three edges
are drawn identically.

**Phase 3 — Explain & response.** Run the misconfigured-Slack case: the lab
reports the loop halting mid-iteration — `email: not attempted · sms: not
attempted · slack: threw ConfigError` — because the exception propagated out of
the loop on the first channel it reached, and channel order (alphabetical, in
this run) decided which channels never got their turn. Run the Principled case:
`email: delivered · sms: delivered · slack: failed (status) · 0 unaffected
channels blocked`. The explanation: the bug was never really "Slack is broken" —
it's that every *other* channel's reliability was quietly resting on a promise
one sibling didn't keep.

---

## 4. Trade-offs

**Apply this when** calling code is written once against a shared abstraction and
genuinely should not need to know which concrete type it's holding — that's the
entire value LSP protects.

**Don't when** two "kinds" of a thing are similar in name but don't actually need
to be interchangeable anywhere in the code. Forcing a shared parent type onto two
things that are never substituted for each other in practice buys the restrictions
of inheritance (matching signatures, matching preconditions) for zero substitution
benefit — that's a cost paid for a promise nobody is relying on.

## 5. Where this bites in practice

Payment gateways, storage backends (local disk vs. cloud bucket), and — as above —
notification channels are the classic trio: one new implementation added under
time pressure that quietly changes what happens on failure, what's returned on an
edge case, or what order setup has to happen in. The early sign: a subtype whose
tests all pass individually, but that nobody has run through the *same test suite*
the other subtypes share.

## 6. Carry it away

- A new subtype should pass the existing abstraction's test suite, unchanged — if
  it needs its own special-cased tests to pass, the contract isn't actually shared.
- "Never throws" (or any other promise in a contract's description) is part of the
  contract, even when the type checker can't enforce it — a subtype that throws
  where its siblings don't has broken the contract even though the code compiles.
- When a bug report says "it only happens with channel/provider X," suspect LSP
  before suspecting channel X's code — the real defect is often in the shared
  assumption every *other* implementation gets to rely on.

## 7. Connections

Parent: [`solid.md`](./solid.md). Previous in the shared story:
[`srp.md`](./srp.md) — the notifier abstraction LSP protects here is the same one
SRP pulled out of the review handler. Next: [`isp.md`](./isp.md). Cousin outside
SOLID: [`dip.md`](./dip.md) — both are about trusting an abstraction to behave the
way its contract promises; LSP is about a *sibling* breaking the promise, DIP is
about a *dependency direction* that makes the promise impossible to swap in the
first place.
