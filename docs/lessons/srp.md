# SRP — Single Responsibility Principle

> Category: Code Design · Difficulty: foundational · Blast radius: expensive
> Part of the [SOLID](./solid.md) family. Module: **Application Review**.

---

## 1. Lecture

**Formal statement:** a class should have one reason to change.

**Plain version:** if you can describe what a class does only by using the word
"and," it has more than one job — and each job is a different person, a different
deadline, and a different reason someone is going to come back and edit this file.

Reasons to change are not the same as number of methods. A class can have ten tiny
methods and still have one responsibility (they all serve the same job), or two
methods and have three responsibilities (each method does something unrelated to
the other). The test is never "how big is this class" — it's **"how many different
people, for how many different reasons, will open this file over the next year?"**

**The rule in one sentence:** *one class, one reason to change — if marketing,
compliance, and the DBA all need to edit the same file for unrelated reasons,
that file has too many owners.*

### Why production code cares

A class with four unrelated jobs can't be tested in isolation (testing the scoring
logic means also faking email delivery), can't be reused on its own (another
screen that needs scoring, but not notification, gets notification anyway), and
turns an unrelated change ("update the rejection email wording") into a risk to
code nobody touched ("did that also change how applications get scored?").

---

## 2. Example — Application Review, HireFlow

A recruiter opens a submitted application. One class, call it the application's
review handler, currently does all four things in sequence: it reads the uploaded
résumé and pulls out structured fields; it runs the scoring rule against those
fields; it sends the candidate a notification about the outcome; and it writes an
entry to the audit log so compliance can show *why* a decision was made.

The day this becomes a problem: the notification wording needs a tone change for
a new region, and the same file also happens to own the scoring math. The person
editing the email template has to read — and be careful not to break — code they
have no stake in and no context for. Two weeks later, scoring changes for an
unrelated reason, and now the audit log entries are missing a field, because the
someone who touched the file to fix tone didn't know logging's shape depended on
timing inside the same function.

The fix is not "split into more files" for its own sake — it's **give parsing,
scoring, notifying, and logging each their own single reason to change**, so the
email-tone person and the scoring person never have to read each other's code to
make an unrelated edit safely.

---

## 3. The Lab

**Phase 1 — Real app UI.** HireFlow's "Review Application" screen: a recruiter
clicks **Approve** or **Reject** on a candidate. The toggle is `Naive` (one
handler does parsing + scoring + notifying + logging) vs `Principled` (four
separate, single-purpose collaborators). Both toggles produce the same visible
outcome on this screen — the difference is invisible to the recruiter and entirely
about what happens when *one* of the four needs to change next. A second control
lets the learner simulate "marketing changes the rejection email wording" and
watch what else lights up as touched.

**Phase 2 — Architecture flow.** In Naive mode: one box labeled `ApplicationReviewHandler`
with four thick arrows leaving it — to the résumé parser, the scorer, the notifier,
and the audit log — all four wired directly inside the same function body, so an
edit anywhere inside that box can reach all four arrows. In Principled mode: four
separate boxes (`ResumeParser`, `ApplicationScorer`, `CandidateNotifier`,
`AuditLogger`), each with exactly one outgoing arrow, coordinated by a thin
"orchestrator" box that calls each in turn but contains no logic of its own —
editing any one box cannot reach the others.

**Phase 3 — Explain & response.** Run "marketing changes the rejection email
wording" in Naive mode: the simulated diff touches the single shared file, and the
lab highlights that the scoring function's line numbers shifted too — nothing
*broke*, but the blast radius of a one-line copy change is "the entire review
handler," and the lab reports `1 intended change · 1 file at risk · 3 unrelated
functions re-touched`. Run the same edit in Principled mode: the diff touches only
`CandidateNotifier`, and the report reads `1 intended change · 1 file at risk · 0
unrelated functions re-touched`. The explanation: responsibility count isn't a
style opinion — it's the measurable size of what one edit can accidentally touch.

---

## 4. Trade-offs

**Apply this when** a class's jobs are owned by different people, change on
different schedules, or need to be tested or reused independently of each other.

**Don't when** the "multiple things" a class does are actually one cohesive job
described badly. A `Money` class that can add, format, and compare amounts has one
responsibility — *being an amount of money* — even though it has three methods.
Splitting those into `MoneyAdder`, `MoneyFormatter`, `MoneyComparer` is not SRP,
it's fragmentation: three files that always change together, which is the
opposite problem.

## 5. Where this bites in practice

"God classes" — a `UserService`, `OrderManager`, or `ApplicationHandler` that
every feature quietly adds one more method to, because it's already wired into
everything. The early sign: a class whose import list spans unrelated subsystems
(email, database, PDF generation, payment) with no shared reason.

## 6. Carry it away

- Before adding a method to an existing class, ask: is this the *same* reason to
  change as the class's existing methods, or a new one?
- "And" in a class's one-sentence description is the tell — "parses and scores and
  notifies" is three responsibilities wearing one name.
- Splitting code that always changes together isn't SRP — it's just more files to
  keep in sync. Split along *independent* reasons to change, not along line count.

## 7. Connections

Parent: [`solid.md`](./solid.md). Next in the shared story: [`ocp.md`](./ocp.md)
— once scoring is its own class, what happens when a second interview type needs
its own scoring rule? Same-altitude cousin outside SOLID: [`soc.md`](./soc.md) asks
this exact question one level down, at a function instead of a class. One level up:
[`isp.md`](./isp.md) is the same question asked about a contract instead of a class.
