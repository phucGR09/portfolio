# DIP — Dependency Inversion Principle

> Category: Code Design · Difficulty: advanced · Blast radius: expensive
> Part of the [SOLID](./solid.md) family. Module: **Billing & Invoicing**.

---

## 1. Lecture

**Formal statement:** high-level modules should not depend on low-level modules;
both should depend on abstractions.

**Plain version:** the part of your code that encodes a *business rule* ("charge
this subscription monthly") should not know or care which specific *tool* carries
it out ("call this one payment provider's SDK this specific way"). The rule
should depend on an abstraction — "something that can charge a card" — and the
specific tool should be the thing that plugs into that abstraction, not the other
way around.

This is the letter most often confused with just "use interfaces." Using an
interface doesn't automatically invert anything — if the high-level rule still
*constructs* the concrete low-level thing itself (`new StripeClient()` sitting
inside the billing rule), the dependency still points the wrong way, interface or
not. Inversion means the high-level code receives its dependency from outside,
already knowing only the abstraction's shape.

**The rule in one sentence:** *the business rule should define what it needs from
a dependency; the dependency should be built to match the rule — not the other
way around.*

### Why production code cares

When the business rule is welded to one concrete provider, every test of that
rule has to go through (or elaborately fake) the real provider's SDK, every
region or compliance requirement that needs a second provider means editing the
rule itself, and every provider outage takes the business rule down with it even
though the *rule* — "charge this subscription" — never changed.

---

## 2. Example — Billing & Invoicing, HireFlow

HireFlow charges a monthly subscription fee per hiring team. The subscription
rule — "on the billing date, charge the team's card for the plan amount, and
record the invoice" — is written directly against one payment provider's SDK:
it constructs that provider's client, calls that provider's `charge()` method,
and reads that provider's specific response shape to decide if the charge
succeeded.

Two things go wrong independently. First, testing the subscription rule means
either hitting the real provider's sandbox over the network for every test run,
or writing a brittle fake that mimics that one SDK's exact response shape —
either way, the *business logic* test is really a test of the *SDK integration*.
Second, when HireFlow needs to support a second payment provider for a region the
first provider doesn't serve, the fix has to edit the subscription rule itself —
the same function that every other region's billing already depends on and has
been running correctly for two years — to branch on which provider a team uses.

The fix: the subscription rule depends on an abstraction — "something with a
`charge(amount) → succeeded or failed`" — that it receives from outside, rather
than constructs itself. The concrete provider client is built once, at the
application's edge, and handed in. The rule never imports, names, or knows about
any specific provider's SDK.

---

## 3. The Lab

**Phase 1 — Real app UI.** HireFlow's "Billing settings" page, with a provider
dropdown (Provider A / Provider B) that's supposed to let a team switch who
processes their subscription charge. In `Naive` mode, changing the dropdown does
nothing — the subscription rule is hard-wired to Provider A regardless of the
setting, and the lab flags the dropdown as cosmetic. In `Principled` mode, the
dropdown actually swaps which concrete client the rule is handed, and the next
simulated billing run visibly routes through the selected provider.

**Phase 2 — Architecture flow.** Naive: the `SubscriptionBillingRule` box has an
arrow pointing *down and out* to a specific box, `ProviderAClient`, drawn as if
the rule reaches outside itself to grab a particular tool — the dependency arrow
originates from the high-level rule and terminates at a named low-level detail.
Principled: the rule box has an arrow pointing to a small shape labeled
`PaymentGateway (abstraction)`, drawn *between* the rule and any provider; two
peer boxes, `ProviderAClient` and `ProviderBClient`, each point *their own* arrow
at that same shape — the dependency has reversed direction: the low-level
details now depend on the shape the high-level rule defined, not the reverse.

**Phase 3 — Explain & response.** Switch the dropdown to Provider B in Naive
mode: the lab reports `setting saved: true · provider actually used: A (unchanged)
· charge routed through: A` — a silent mismatch between configuration and
behavior, the kind of bug that survives in production because nothing throws.
In Principled mode: `setting saved: true · provider actually used: B · charge
routed through: B`. A second run shows the *test* story: swapping in a fake
`PaymentGateway` in Naive mode requires impersonating Provider A's SDK response
shape exactly; in Principled mode, the fake only has to implement the 7-word
abstraction — `charge(amount) → succeeded or failed` — a difference the lab reports
as `test setup: 40 simulated lines → 4 simulated lines`.

---

## 4. Trade-offs

**Apply this when** a business rule either needs to swap the concrete tool
underneath it (multiple providers, multiple storage backends) or needs to be
tested without the real tool involved — both are real, common needs for a
billing-like rule.

**Don't when** there is, realistically, only ever going to be one implementation,
and testing against the real thing is cheap and fast (an in-memory list instead
of an external SDK, say). Inserting an abstraction with exactly one implementer
forever is ceremony with no payoff — the same trap [YAGNI](./yagni.md) names for
seams built before a second case is real.

## 5. Where this bites in practice

Payment providers, email/SMS senders, and third-party identity providers are the
classic trio — any business rule that imports a specific vendor SDK by name
instead of depending on a shape your own code defines. The early sign: a
business-logic file whose imports include a vendor's SDK package directly.

## 6. Carry it away

- If the business rule *constructs* its own dependency (`new SomeSdkClient()`
  inside the rule), the dependency still points the wrong way — adding an
  interface on top doesn't fix that by itself.
- Define the abstraction from the high-level rule's point of view ("what do I
  need?"), not the low-level tool's point of view ("what does this SDK offer?").
- A quick test for inversion: can you test the business rule with a fake that
  knows nothing about the real provider's SDK? If not, the dependency hasn't
  actually been inverted yet.

## 7. Connections

Parent: [`solid.md`](./solid.md). Previous in the shared story:
[`isp.md`](./isp.md). This module's next lesson: [`dry.md`](./dry.md) — same
Billing & Invoicing module, a different letter. Cousin: [`lsp.md`](./lsp.md) —
both are about trusting an abstraction's promise; LSP asks whether a sibling
honors it, DIP asks whether the dependency even points the right direction to
let you swap in a sibling at all.
