# FISH-OPS-V2 — P1 Operating-Model Design Proposal

**Status:** P1 design proposal, **not yet accepted** as the active project operating policy  
**Prepared:** 2026-10-31 · **Initiative:** [#282](https://github.com/ginosega/fishing/issues/282) · **Draft PR:** [#283](https://github.com/ginosega/fishing/pull/283)  
**Audit and traceability:** [AUDIT_2026-10-31.md](AUDIT_2026-10-31.md) · [MIGRATION_COVERAGE_MATRIX.md](MIGRATION_COVERAGE_MATRIX.md)  
**Reference source:** `feature/fish118-p3-mock-publisher@406723f880960d33d40bd07984559432c8caa233`. Never infer a live deployment from a Git commit.

## 1. Objectives, boundaries and decision

**Objective:** A new ChatGPT session can recover the currently relevant work, binding operational safeguards and next safe action with **small, targeted reads**. Historical source, requirements, approvals and deployment evidence remain accessible by immutable Git refs or durable links; they are not automatically loaded.

**Invariants:**
- Do not weaken the original Fishing Companion v2/v3 authoring, security, release, rollback or owner-approval policy.
- No V3 feature work, publishing, production cutover, Cloudflare/D1 mutation, provider-permission change or merge is approved merely by an operating-model document.
- Preserve full source provenance; **GitHub is the versioned documentation/code record, while hosted reality requires independent evidence**.
- New "current" updates replace their previous content **in place**. Evidence accumulates in Git commits, CI, PRs, dated reports and decisions, not in five prepended logs.
- State `unknown/not verified` where information is unavailable; never turn successful source CI into a claim that a Cloudflare Worker, Pages release or Android behavior is accepted.

### Authority precedence (topic-specific, not naive "newest wins")

1. **Product behavior / permission:** exact approved baseline plus *specifically authorized* later amendments, with an explicit supersession relation. October 19 approval remains for its fixed baseline; October 27 V3-SAVE-09 and October 31 Notes amendment have their own later authority. Mere author-written "latest" prose is not new authorization.
2. **Implementation/source:** current repo/ref and exact code/CI evidence, checked at the time of the task. PR #263 development head is not public `main`.
3. **Hosted operations:** separately verified GitHub Pages, Cloudflare Worker/D1 state and owner/device observations. GitHub source cannot resolve provider-only facts.
4. **Current plan and next actions:** current active `CURRENT_STATE` and `WORK_QUEUE` route to the above evidence. Neither may override approved behavior or missing operational proof.
5. **Dated experiment/history:** useful reference, no current-commands authority unless consciously re-adopted with specific decision ID and dated evidence.

If these conflict, **record the inconsistency and stop the consequential step** (e.g. publish or permission change); do not resolve by assuming the latest date or by searching ever-larger history.

## 2. Five-document active set and file ownership

All active files live under `project-ops/v2/`; the old five root files remain frozen history during transition. At cutover, root `README.md` becomes a short routing entry, with its pre-refactor content accessible via a pinned historical Git ref. Other legacy root documents are marked as historical/superseded for *current operational routing* without deleting their substantive content.

| Active file | Single question it answers | Soft target / hard cap (UTF-8 bytes) | Maintainer |
| --- | --- | ---: | --- |
| `START_HERE.md` | Where to start and what to read **only if needed** | 2,048 / 4,096 | Project operating model |
| `CURRENT_STATE.md` | What was verified, from which authority, and what is **unknown now** | 8,192 / 12,288 | Current task/session closeout |
| `WORK_QUEUE.md` | Which action is next, blocked, ready, and what must pass | 10,240 / 16,384 | Work-item lifecycle |
| `OPERATING_RULES.md` | Security/authorization, CI, deployment, verification, chat handoff | 10,240 / 16,384 | Stable rule change by reviewed PR/owner decision |
| `DECISIONS_INDEX.md` | Where is the effective signed-off decision or supersession | 5,120 / 8,192 | Decision approval/amendment |

**Budgets are design guardrails, not justification for truncating safety requirements.** Exceeding a soft target triggers review/restructuring; hard caps would fail new operating-doc changes after migration. Detailed protocols belong in already approved specs or individual scoped references, not duplicated prose in the active set.

Additional *reference-only* files may include `project-ops/v2/decisions/ADR-NNNN-*.md`, a historical source index and a scoped non-V3 fishing equipment/content backlog index. They are never part of mandatory startup. Existing v2/v3 requirements, `pwa/docs/`, `experiments/`, content Markdown, CI logs and PRs remain at their original paths.

## 3. Exact document contracts

### PROJECT_ROUTER.md and NEW_CHAT_PROMPT.md — stable default-branch entry (outside the five active work files)
- `PROJECT_ROUTER.md` must be reachable from the repository's **current default branch**, independently of any unmerged V3 development branch. It declares the **active workstream(s)**, primary workstream for a generic "resume" request, GitHub branch and approved operating-doc entry path, routing update date and supporting issue/PR pointers. It is a locator, **not** a second `CURRENT_STATE`.
- Update the router **when a workstream or its branch/approved docs entry changes**, not after every commit or status transition. On each chat start, verify the pointers against current refs, open/merged PR state and approval evidence; if stale or missing, inspect root README/relevant GitHub issues/PRs and state uncertainty before consequential action.
- `NEW_CHAT_PROMPT.md` is a **static copyable instruction** on the default branch and contains **no time-bound branches, commits, issue IDs or statuses**. Both normal and emergency transfers use exactly that text. It can remain valid for months. The file's description outside its copyable block may label its adoption status.
- Following the router must never allow an unmerged draft operating model to be silently treated as approved. The final docs activation requires separately reviewed, documentation-only root/default-branch routing changes and owner acceptance. Do not merge V3 app PR or deploy to add a router.

### START_HERE.md
- Stable purpose/scope and short read protocol for its routed workstream. Its contents do not duplicate the root router or track every source commit.
- Minimal read order: `START_HERE` -> `CURRENT_STATE`; read `WORK_QUEUE` when an action is requested and `OPERATING_RULES` when an operational gate matters. Read only targeted design/decision/code sections when required.
- One-paragraph rules for uncertainty, bounded retrieval, source/host evidence, and historical-file treatment.
- Links to authoritative indexes; **no project transcript, repeated status paragraphs, entire bootstrap, or environment secrets**.

### CURRENT_STATE.md
- A single `Last reconciled (UTC)` marker and `Evidence baseline` (branch + immutable SHA for source); distinguish **the audit snapshot** from fresh provider evidence.
- Concise table by workstream/environment: **source status**, **exact-head CI**, **private hosted status + version if verified**, **public hosted status + release if verified**, **field-accepted status + device/date**, blockers and evidence pointers.
- State vocabulary for evidence fields: `not-started`, `implemented`, `validated`, `verified`, `failed`, `blocked`, `unknown`, `not-applicable` as suited to the field; no general-purpose single `Done`.
- An `observed_at` timestamp and origin for each claim whose accuracy depends on external state; prior evidence can remain labeled historic without being presented as current.
- References to one issue/work-queue item for the next action; not full implementation stories.

### WORK_QUEUE.md
- Top priority and a bounded number of active items, each having a **stable issue/task reference**, status (`blocked`, `ready`, `in-progress`, `review`, `closed`), owner, milestone (D1–D6 where applicable), explicit prerequisites, next safe step, acceptance proof and pointer to related current state.
- Work items remain distinct from domain requirements/approval records. Do not invent `P3-42+` milestones or re-open historically completed items.
- Keep separate ongoing fishing/kayak/gear/content backlog through a scoped index. Do not delete owner-facing non-V3 work when narrowing V3 working context.
- Closed items leave the active queue after recorded acceptance, with GitHub issue/PR evidence links.

### OPERATING_RULES.md
- Scope and authorization: routine read-only/source-only steps can proceed under existing standing approvals; material credential/permission/hosting/cost/schema/cutover steps require their actual gate.
- Git/CI: exact ref, compare/merge controls, FISH108 content vs full release, no false hosted success, safe rollback/receipts, deny-by-default/security tests.
- Safe client workflow: Windows Edge/Chrome, Android Chrome/installed PWA coverage as applicable; only claim field acceptance for observed device/context.
- Document workflow: one state owner, current updates in place, decision amendments by ID, proof links; stop on unresolved conflicting authority.
- Bounded new-chat entry and session closeout; zero production credentials, personal secrets, or private drafts stored in operational docs.

### DECISIONS_INDEX.md, topic catalogs and ADRs — scalable lazy loading
- `DECISIONS_INDEX.md` is a **small table of contents of topics**, not a growing table of every project decision. It points to topic catalogs beneath `project-ops/v2/decisions/topics/` (e.g. `publishing.md`, `security-auth.md`, `editor-ux.md`, `architecture.md`, `offline-reliability.md`, `project-operations.md`, `content-and-gear.md`). A new domain is introduced only when needed.
- Topic catalogs carry **one short entry per consequential decision or amendment**: `ID | title | component/tags/aliases | status | short rationale/rejection reason | effective/superseded relationship | canonical detail link`. Organize by subsystem/problem, not purely by date. Synonyms make searches robust to changed terminology.
- Canonical individual decision records live in `project-ops/v2/decisions/records/ADR-NNNN-*.md` where new records are warranted. Each includes stable ID, scope, status (`proposed`, `accepted`, `rejected`, `deferred`, `superseded`), problem, decision, alternatives considered, **why options were rejected**, evidence/owner approval, `reconsider_only_if` condition for negative decisions, and supersession links. **Do not create an ADR for each ordinary bug fix, CI run or status update.**
- The **original** `Fishing_Decision_Log.md`, exact October 19 approvals and later signed amendments remain preserved at their historical Git refs and paths. For an old decision, the topic catalog may link straight to its authoritative legacy section or original approval rather than duplicate the text or fabricate a new approval.
- **Query algorithm before substantive proposals:** (1) read only `DECISIONS_INDEX` (~5 KB target), (2) choose the relevant topic catalog(s) by subsystem, keywords, synonyms and rejected alternatives, (3) open only matching ADRs/legacy records and any supersessions, (4) test the proposal against the identified prior rationale and changed constraints. If no topic is obvious, search catalog/record filenames and titles or conduct bounded GitHub content search; never default to ingesting the whole historical log.
- **Growth control:** Topic catalogs target <= 8 KB and hard-limit at 12 KB; split a growing topic by meaningful subtopic and update only the compact index link. `DECISIONS_INDEX` retains a <= 5 KB soft target / 8 KB hard cap. Each new/changed ADR must update exactly one topic catalog and its supersession references in the **same PR**. Validation verifies links, unique IDs, status/relationship consistency and budgets; human review checks relevance/semantic coverage.
- The objective is to preserve **negative lessons** and rationale without putting all historical reasoning in routine context. Decision indexes never create owner authorization or override explicitly approved original records.

## 4. Maintenance transaction: one work item, one source of truth

**At task start:** (1) read two short routing/state docs, (2) select one work item, (3) retrieve only needed requirement/ADR/code ranges, (4) reconcile source + CI + hosted if consequential. Never load the entire 145 KB legacy bootstrap or history by default.

**During work:** use exact refs, small tool output, a branch/PR with bounded scope, tests and evidence links. Keep user-facing reports concise; no claim of background execution or future delivery.

**At a validated state transition:** update the work item once; revise `CURRENT_STATE` field(s) **in place**, including source/CI/deploy/field evidence independently; add a decision ADR only when an actual binding decision changes. If routine content release changes no behavior/backlog, its PR/CI/hosted evidence is enough under FISH108; do not mandate documentation rewrites per content item.

**At chat handoff:** commit any durable state changes first, then provide a minimal prompt with repo, **branch**, START_HERE path, current issue and explicit safety gate. The recipient verifies current HEAD and latest evidence rather than trusting a pasted snapshot. Historical conversations and full legacy files are available **on demand**.

**At conflicting or missing evidence:** preserve drafts/receipts, mark `unknown`, and do not automatically retry an ambiguous accepted publication or flip a production/Worker enablement switch.

## 5. Operating-model migration with no data loss

1. **Preserve exact baseline:** keep reference `406723f...`, all existing Git history and original root documents; inventory historical non-V3 gear/content tasks and older approval decisions explicitly. Store pointers, not duplicated full text.
2. **Populate active docs:** generate the five proposed documents from *current checked* source plus properly labeled historical evidence. Any private Worker/version or public hosting assertion without current proof is `unknown`.
3. **Dual-read verification:** compare new references and status against legacy source and approval records, using the [coverage matrix](MIGRATION_COVERAGE_MATRIX.md). Confirm that requirements, special owner decisions, backlog items and negative exclusions remain indexed.
4. **Activate after review:** short root README/router and historical labels are applied only after traceability checks. Never delete legacy records or use a docs refactor to silently edit product/source/credentials. If the team later wants to physically archive legacy files, that is a separately reviewed link-impact change.
5. **Cold-start test:** fresh Fishing-project conversation using no historical paste reads small docs, identifies exact repo/branches, V3 Gear Notes + Catch blockers, which states are unverified, the next safe action, and required owner gates. Run adversarial test with a historical "latest" instruction and confirm it is not followed.
6. **Acceptance:** documentation validator passing; independent owner confirmation; restore V3 development only after fresh deployment reconciliation. PR #263 remains draft until its own release gates are satisfied.

## 6. Versioning and branch convention

- **Current V3 working branch:** `feature/fish118-p3-mock-publisher` (not deployed public by default).
- **Operating-model draft branch:** `docs/fish-ops-v2-2026-10-31` based on that V3 branch, PR #283. Work only in `project-ops/v2/*.md` through P1.
- **Public `main`:** separate public V2 and canonical content; any eventual routing changes must be reconciled with it. Do not infer `main` from a feature branch or merge PR #263 as part of docs adoption.
- Use branch names for current movement and immutable commit SHAs for evidence, with an observation date. Reconcile if source branches advance.
- Scope future tooling/CI changes to a separate full-lane-reviewed PR, as specified in [DOC_VALIDATION_DESIGN.md](DOC_VALIDATION_DESIGN.md) and [issue #284](https://github.com/ginosega/fishing/issues/284).

## 7. P1 acceptance questions and decision gate

P1 is ready for owner approval once these are clear:
- Approve five active roles under `project-ops/v2/` and proposed byte targets/hard caps?
- Approve maintaining state *in place* and freezing historical root files, retaining approvals and uniquely owned independent non-V3 backlog?
- Approve explicit immutable-approval vs later-owner-amendment indexing, with source/CI/deploy/field evidence separate?
- Approve the two-tier documentation validation design and a **separate scoped tooling/CI PR** under existing FISH108 full-lane requirements?
- Approve minimal new-chat startup and cold-start acceptance as the cutover gate?

**No implementation policy change or document deprecation takes effect until owner sign-off and P2/P3/P4 validation.**

## 8. P1 owner clarification — exact normal and emergency chat transfer

**Static copy/paste prompt:** [`NEW_CHAT_PROMPT.md`](../../NEW_CHAT_PROMPT.md) is deliberately free of temporary branches, commit IDs and issue numbers. After adoption, it and **`PROJECT_ROUTER.md`** must be discoverable on the repository's default branch. The prompt never needs updating just because project work advances; only the router changes when the workstream/ref changes, while `CURRENT_STATE` changes as needed. Both planned and emergency transfers use **the exact same static first message**, and both require verification that the routed documents are approved, not merely in a draft PR.

**Normal:** (1) owner says **"Prepare to transfer to a new chat."** (2) Assistant stops consequential new work, safely checkpoints any ongoing operation, commits/verifies durable state and exact refs, then **prints the complete copyable GitHub prompt in its reply** (not just a link). (3) Owner starts a new chat in the Fishing ChatGPT project, pastes the prompt, and (4) new assistant reads only active router/state/task docs and reconciles actual source/CI/provider uncertainties before continuing. Do **not** demand owner approval for routine source-only documentation bookkeeping.

**Emergency:** If the old chat errors, freezes or declares itself too long, no old-chat interaction or prepared handoff is necessary. Owner opens the static `NEW_CHAT_PROMPT.md` on GitHub, copies the prompt, starts a new Fishing-project chat and pastes it as the first message. New assistant **assumes the previous turn may have failed mid-operation**, retrieves last durable GitHub checkpoint, checks pending operations and provider records where possible, preserves unsaved drafts and receipts, does not blindly repeat accepted/ambiguous writes, and distinguishes unknown/in-flight state from confirmed completion. Missing chat-only decisions cannot be recovered automatically: seek evidence first, then ask one narrow question only if necessary.

**Cold-start acceptance:** Test both normal and unprepared emergency transfers using the static file verbatim. Demonstrate discovery of active vs draft docs, branch and approval status, critical rejected approaches, and unknown hosted-state handling. Do not activate the new handoff convention until it passes and the owner approves.

## 9. P1 owner clarification — semantic/evidence review triggers and responsibility

"Tier 2" is **semantic and evidence verification** by the assistant, plus owner sign-off only where mandatory. Do **not** describe assistant-only analysis as independent human verification. Trigger by defined operations rather than intuition:

| Trigger | Mandatory analysis before status/decision is changed | Owner input |
| --- | --- | --- |
| Requirement, architecture, UX or scope proposal | Query relevant accepted/rejected/superseded decisions; check original approval and specific later amendment; evaluate change impact | For material new/changed approval |
| Permission, credentials, service, cost, deployment, merge, schema, public cutover or rollback | Verify allowed scope, exact refs/CI, real provider version and safety/rollback gates; no evidence = halt consequential action | Only when existing gate requires authorization |
| Claim moves to `deployed`, `verified`, `field accepted`, `closed` | Validate direct evidence for exact environment and date; do not infer from source CI | For tests only owner can perform and explicit acceptance gates |
| Conflict, provider failure, unknown/out-of-band operation | Inspect independent status/receipts; preserve user drafts and recover safely | If evidence cannot be accessed and decision cannot be made safely |
| Significant new approach or repeating a previous rejected solution | Mandatory topic/constraint search in `DECISIONS_INDEX` and linked ADRs/lessons; explain new evidence before reconsidering | If reversing material decision |
| Chat handoff, milestone closeout, or material docs authority change | Check branch, state, work ownership, source/host evidence and completeness | No routine approval; final operating-model acceptance separately required |

Each triggered review records a compact **review trigger, evidence link(s), outcome and any owner authorization** in the relevant PR/issue or decision; do not create another growing narrative in active state. A normal small content release stays governed by FISH108 and does not trigger a heavyweight project-wide Tier 2 exercise.

The assistant is accountable for preparing/checking docs, links, CI evidence, ambiguity flags and handoff text. The owner is **not** responsible for routine doc administration, validator runs, GitHub reconciliation or re-explaining approved decisions.

## 10. P1 owner clarification — retention of hard-earned project memory

**The point is to move historical reasoning out of the startup payload, not to lose it.** Four layers preserve the benefit:

1. **Always-on "do not repeat" guardrails:** Concise, high-impact constraints and already-rejected dangerous approaches are referenced from `OPERATING_RULES` in every operationally relevant chat, without the full historical transcripts.
2. **Decision index for accepted, rejected, superseded and deferred options:** Every significant decision is searchable by **topic, affected component, alternatives considered, why rejected, prerequisites for reconsideration, approval evidence and supersession ID**. Link the original approval and technical analysis rather than copying it. An abandoned approach cannot silently become "new" because its PR is old.
3. **Required pre-proposal historical check:** Before suggesting a substantive design/technology/product-path change, search the decision index **by problem and alternatives**, retrieve only relevant records, and state if/how a new proposal differs. A rejected approach may be reconsidered **only if constraints or evidence materially changed**, with explicit rationale and owner approval where required.
4. **Regression/cold-start tests:** Include one or more prior rejected V3 approaches as adversarial tests. A fresh assistant must recognize the historical rejection and explain it without having to load the five original root files.

This approach cannot guarantee perfect recall: an undocumented conversation-only choice or poor topic indexing can still be missed. P2 must explicitly preserve a **coverage inventory of negative decisions and lessons learned**, not merely the final approved requirements. The owner should not have to supervise us into relearning discarded ideas.

## 11. P1 owner clarification — prevent drift continuously

**Primary prevention occurs on each change, not at periodic audit:** single active-owner rules, in-place status editing (no prepend-only active logs), size budgets, bounded document ownership, verified evidence fields, static-link checks and duplicate-ID checks all run when relevant PRs are prepared. The assistant also performs a **semantic duplicate/supersession check** on each substantive update, because CI cannot prove all paraphrased contradictions.

Once P3 validation is operational, doc CI must reject structural violations **before the PR is accepted**, with explicit failure fixtures; before then use the identical manual checklist and keep PR #283 draft. At milestones, a broader reconciliation remains a secondary backstop for subtler authority drift; it is not the primary sprawl-control mechanism. Historical archive growth is permitted and expected, but it must be linked and excluded from routine context.

**P1 acceptance additional gates:** Static normal/emergency recovery prompt exists and is tested; required pre-proposal rejected-decision lookup is included; Tier 2 triggers, owner involvement and continuous per-change checks are explicitly tested. Owner acceptance of these clarifications does not by itself activate the operating model before P2/P3/P4 checks.
