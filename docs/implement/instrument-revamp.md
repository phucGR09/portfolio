# Instrument revamp — directive for the next session

> Written 2026-10-25 by the previous session, after the user rejected the
> current lab instruments as "trash" with two concrete screenshots. This
> document exists so a **fresh agent session**, with full context budget,
> can execute a real redesign instead of continuing the reactive
> patch-and-screenshot loop the previous session got stuck in.
>
> **Read this document FIRST, before `principles-lab-plan.md` /
> `principles-lab-ui-plan.md`.** Those two docs are still the source of
> truth for everything NOT contradicted here (isolation rule, budget
> mechanism, test infrastructure, file layout, token system). This doc
> only overrides their instrument-design and catalog-content sections,
> per explicit user direction captured in `decisions.log` (search for
> "EXPLICIT PLAN OVERRIDE" and the 2026-10-25 entries after it).

## 1. What the user actually said (verbatim, keep this un-sanitized)

On the catalog card / hero naming (already implemented, do not redo):
> "I Need only, only, only, the name of problem in the card, by type of
> problem."

On the real lesson page, after running the N+1 lab (100 rows) and seeing a
screenshot of the result — a plain table in Response and a raw log in
Internals:
> "the lab is not the component like shit you create, that will have
> simple page UI of the admin page, of the dashboard or whatever you can
> apply the n+1 query ... user can see the action they do: search, filter,
> see the table. beside the lab, will show the table, the graph of server
> in real life, you can make it as UI only for show user. then when user
> click, the query will run, the response will show to user in the
> terminal component, or show in card, something for user know, the
> table, the sql query, the server graph will highlight, to show to user
> know what they just doing and touch what component in server."

> "stop the work now, you now so stale. I need you revamp the plan,
> create new or make any thinking you can apply for document for next
> agent AI will do next."

Read that paragraph three times before designing anything. The concrete
asks inside it:

1. A **persistent visual of "the server"** (a diagram/graph, not prose) sits
   beside the normal response/table — not a replacement for Response, an
   addition that gives spatial context.
2. When the reader clicks Run, that diagram **highlights the exact part
   it just touched** (a table, a row range, a component) — the causal
   link between "I clicked" and "this part of the system reacted" must be
   visible, not just implied by two panels updating independently.
3. The actual query/request text shows in something that reads as a
   **terminal or response card**, not a debug log.
4. This needs to work for **every lab, present and future** — it is a
   kernel-level pattern, not a one-off for N+1.

## 2. Confirmed bugs (fix these regardless of the redesign)

- **`scripts/runtime/lab.js:163`** — the kernel LogStream renders
  `${type}${JSON.stringify(payload)}`, so every lab that calls
  `log("log", { sql: "..." })` produces literal
  `log {"sql":"SELECT * FROM companies WHERE id = 6"}` lines in the
  Internals zone. This is what's in the user's second screenshot. It
  reads as debug output, not a product. At minimum, a lab should be able
  to pass a pre-formatted string and have it render as plain text with no
  JSON wrapper, no `type` prefix. Decide whether `log(type, payload)`
  keeps its generic signature (and formats per a `payload.text` field
  convention) or whether it's replaced entirely by the server-graph
  concept below (in which case the raw `LogStream`/`log()` pairing may
  not even survive — see §4).

- **Idle-state previews are inconsistent across labs.** `n-plus-one.js`
  has a `renderIdle` (ghost table rows); `sql-injection.js` and
  `one-rule-five-places.js` also have one but they're thinner. Whatever
  the new instrument shape is, every lab needs a real idle preview — not
  just an empty bordered box with a tiny uppercase zone label.

## 3. Target experience — concrete, not vibes

This is one way to satisfy the user's paragraph; treat it as a strong
starting point, not gospel — validate the specific visual with the user
early (a rough screenshot, not a full implementation) before building all
3 labs against it, since this is exactly the kind of decision that burned
the previous session when made without checking in first.

**The "server map"**: a small, always-visible diagram (SVG, inline,
consistent with how `svg` diagrams already work in the "Under the hood"
section of each lesson page) showing the *shape* of the backend for this
specific problem — e.g. for N+1: two boxes, `candidates` and `companies`,
connected by a line. For SQL injection: a box `users` and a box
`query parser`. For one-rule-five-places: 5 boxes, one per screen. This
map is **part of the stage**, likely replacing or augmenting the
Internals zone (or living as a new sub-area within it — the Stage
Contract's 4 zones are still mandatory, data-zone names don't change;
this is about what a lab draws *inside* its zones, same mechanism
`els.response`/`els.internals` already give every lab).

**On every query/action** (`db.select(...)` call), the lab:
1. Highlights the matching box in the server map (`data-sig="focus"` or
   similar, a brief pulse/outline — respect `prefers-reduced-motion`,
   stepped not smooth, per the existing LUẬT in lab.css).
2. Writes the actual request as a clean line into a **terminal-style
   panel** — monospace, prompt-style (`$ SELECT * FROM companies WHERE
   id = 6`), not a JSON dump. This can reuse `ResponseCard` from §8.2 of
   the UI plan (status + body, already specced, under-used today) instead
   of `LogStream`'s raw event log.
3. Updates the Response table/content as today.

The key engineering point: **`store.js` already has every fact needed to
drive this** — `costs()` returns `{ table, op, rowsScanned, rowsReturned,
usedIndex, ms }` per access, in order. The server-map highlight and the
terminal line should be driven from the same accounting data a lab
already pulls for its Verdict numbers (RULE 7a — no new fabricated
state), via the existing `log(type, payload)` callback or a new
`els`-based hook — whichever ends up cleaner once you prototype it.

## 4. Design questions a fresh session needs to resolel before coding

- Is the "server map" a new **kernel component** (built once in
  `lab.js`/`lab.css`, parameterized by a simple box/edge list each lab
  declares) or a **per-lab custom SVG** (full freedom, more work per
  lab, consistent with Stage Contract's "stage is 100% free layout"
  philosophy)? Given 3 labs already need 3 different shapes (2 boxes
  linked / 1 box + parser / 5 parallel boxes), a configurable kernel
  component (an array of `{ id, label }` boxes + which one lights up per
  event) is probably the right rule-of-two call — but prototype one lab
  first before committing.
- Does this replace `LogStream` entirely, or do some labs still want a
  scrolling log (e.g. N+1's "watch 101 lines scroll by" IS part of its
  specific lesson — the sheer count is the point) alongside the new
  terminal/highlight? Likely both coexist: terminal/highlight for "what
  just happened", LogStream kept for "how many times has it happened" —
  don't delete LogStream without checking whether a lab's lesson depends
  on its specific "it just keeps going" effect (N+1 does).
- Where does the server-map box state live — a plain object keyed by
  zone, redrawn on every log event? Keep it cheap; these are small SVGs,
  not real diagrams.

## 5. What NOT to re-litigate

Already decided and tested — do not reopen without new user direction:

- Catalog card shows `principle` (short name) as primary text, not the
  long symptom `title`. Hero has a `.hero-principle` eyebrow before the
  pills. (`scripts/data/catalog.js`, `scripts/types.d.ts`)
- `[data-lab]` max-width 1600px, centered; `.landing` sections use a
  non-editorial single-column layout, centered at 1100px; `.lesson-block`
  at 900px+ keeps its 0.43fr/1fr editorial split but capped at 1200px.
  (`source/principles.css`, `source/lab.css`)
- Blast-radius pill uses signal colors with a filled background;
  difficulty pill is neutral; category pill keeps the branch accent.
- `scripts/runtime` budget raised 24KB→26KB, `scripts/hub.js` 6KB→7KB —
  both logged with reasoning in `decisions.log`. If the server-map work
  needs more kernel budget, the same reasoning applies: raise it and log
  it, don't fight for bytes on real functionality.
- The isolation rule (LUẬT 0), the gate pipeline (typecheck/lint/test/
  budget/contract), and the test infrastructure are unaffected by any of
  this — keep them green throughout.

## 6. Suggested execution order for the next session

1. Fix the `JSON.stringify` log bug in isolation first — cheap, and it
   stops the bleeding regardless of what else happens.
2. Prototype the server-map concept on **one lab only** (n-plus-one-query
   is the reference lab for a reason — if it works there, it generalizes).
   Get a screenshot in front of the user before touching the other 2
   labs or the mini landing demo.
3. Once approved, decide kernel-vs-per-lab per §4, implement for real,
   then roll to `sql-injection.js` and `one-rule-five-places.js`, then
   `_mini.js`.
4. Update `tests/labs/*.test.mjs` for whatever new DOM/behavior results.
5. Log every deviation in `decisions.log` the same way this session did —
   the user reads it and has reacted well to transparent reasoning even
   while frustrated with the output.
