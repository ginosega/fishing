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

### START_HERE.md
- Project/repository identity, the currently relevant **working branch** and active-doc location. Clarify that public `main`, development branch and docs PR can differ.
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

### DECISIONS_INDEX.md and ADRs
- Index fields: `ID | topic | status | effective scope | approved date | canonical record | supersedes`.
- An ADR has `ID`, `status` (`proposed`, `accepted`, `superseded`, `rejected`), `decision`, `scope`, `rationale`, `approval evidence`, `supersedes/superseded by`, and relevant requirements.
- For historical approvals, **link to exact October 19 approval records and original blob**; do not rewrite a record as if it approved October 27/31 changes. Use standalone amendment references where owner acceptance actually exists.
- Decision indexes are curated; they cannot manufacture or expand authorizations. A choice made by an assistant alone is a proposal until authorized by the owner where needed.

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
