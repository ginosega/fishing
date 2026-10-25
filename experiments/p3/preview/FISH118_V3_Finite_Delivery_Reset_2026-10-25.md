# FISH118 — Finite Fishing Companion V3 Delivery Reset

## D1 architecture reconciliation — October 25, 2026

**D1 design and source-port contract prepared** after the owner's approval to proceed. See [D1 V3 architecture consolidation](D1_V3_Architecture_Consolidation_2026-10-25.md). The selected minimum architecture is **one owner-facing same-origin Cloudflare gateway**, the already accepted OAuth session model, a strict session+CSRF write boundary, **server-side-only Cloudflare App-PEM custody if later authorized**, ID-scoped GitHub App tokens, immutable repo/policy checks, canonical source-aware validation and durable D1 status, without per-item owner ECDSA/attestor signatures. GitHub Apps/Workers/D1 writes remain disabled in real provider environments; no publication was attempted. The current public-main ruleset requires one PR, strict `fishing-merge-ready` status from GitHub Actions integration 15368, **zero ordinary approvals**, and no bypass; private-sandbox rule/protection and currently effective dedicated App grants require authorized D2 verification. The P1 and P3 session formats are different and **must be unified before the first owner-authorized write**.

**Next:** D2 first source-only API/session/CSRF/operation implementation and adversarial tests; **separate consequential owner approval before installing App PEM, enabling sandbox write routes, or executing the first true nonproduction publish**. The six D1–D6 delivery names and approved V3 UX remain fixed. This checkpoint is not V3 release acceptance.

**Assessment date:** October 25, 2026 PDT · **Status:** Proposed delivery rebaseline for owner review; planning-only change · **Workstream:** existing FISH-TODO-118

## Executive decision

**There is no fixed total count of “P3-N” substeps. Stop creating them.** P3-0 through P3-41 are experimental/review checkpoints inside **one** of the approved P0–P8 work packages, *not* 42 milestones toward a preagreed end. Substantial validated source and some real provider/security groundwork exist, but the end-user V3 authoring/publishing experience is **not built or deployed**.

Recenter on the **October 19 owner-approved requirements, technical design, UX and P0–P8 staged plan**, especially [V3-SAVE-05](../../pwa/docs/Fishing_Companion_v3_Requirements.md) and its **one Save and Publish with NO new user confirmation per change**. The source-only P3-40/P3-41 independent owner-signing/attestor branch **would impose per-change human signing** and contradict that UX if required. Treat it as OPTIONAL research, **not a go-live prerequisite**. Any required security must be accomplished transparently by an authenticated, owner-scoped backend/session, an appropriately permissioned GitHub App, exact canonical/source-aware validation, idempotency/conflict/CI/merge/release proof and audit without a separate owner approval ceremony for each edit. This does NOT waive security/least-privilege, branch rules or the separate **one-time production cutover authorization**.

**Six finite implementation-and-release deliverables remain.** Do not create new P3-N milestones. Defects and narrowly required hardening belong **inside** these six, with acceptance evidence and a consolidated blocker list, not a new chain of numbered preflights. P3 experiments are reusable ingredients only after an explicit **keep/retire/port** review; do not merge the experimental PR wholesale into production.

## 1. Confirmed delivery inventory (what exists and what does not)

| Area | Supported checkpoint | User-facing V3 delivery? |
| --- | --- | --- |
| Requirements / design / UX / implementation plan | All approved October 19. Approved scope includes anonymous-first, owner-only auth in Connection Status, single **Save and Publish**, Gear/KB/Catch, Gear/KB integrated uploads, viewer, Work Offline preference, release coherence, optional drafts. | **Specification approved** |
| P0/P2 v2 reliability and performance | FISH115/116/117 released: generated Gear/KB thumbnails and smaller category artwork; stale-open-tab release fix; Android Chrome Custom Tab behavior accepted. Latest independently verified successful **main Pages release #672**, source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, 577 hosted files / 100 Gear / 60 KB / 12 Catches. | **Useful v2 improvements live**, not V3 |
| P1 AUTH-P0 / G1 | Draft public [PR #262](https://github.com/ginosega/fishing/pull/262); real Windows and installed Android OAuth + same-origin Cloudflare gateway proof, session persistence/revoke-all; **owner accepted G1 October 22 with specific waivers**. Seven-day Secure HttpOnly D1 session and no GitHub revocation webhook are accepted for feasibility; production write authorization/negative checks still required. iOS waived/not tested. | **Feasibility passed**, not deployed V3 auth UI/service |
| P3 broker | Draft public [PR #263](https://github.com/ginosega/fishing/pull/263), P3-0..41; isolated private `ginosega/fishing-p3-sandbox`; D1 R1–R4 remote schema; mocked CI/draft PR/authentication/D1 receipt and owner-signature source tests; live read-only OIDC provenance **PASS** in private [run #40207347824](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40207347824); historical App/Access read proofs. Last exact-head local source CI [#40211094462](https://github.com/ginosega/fishing/actions/runs/40211094462) passed **440/440**. | **No real content accepted, merged or published** via V3 |
| P3 runtime isolation | Two P3 Cloudflare Workers are **static 503, unrouted**; Production/Preview Worker URLs disabled at last verified postflight; D1 app write path disabled; App private key has historical write-capable grant and is not to be moved casually into GitHub Actions. | **No active private publisher**, intentional |
| P4–P7 | Approved planned UI/service consumption, uploads, Catch editor, persistent Work Offline, Connection Status, Markdown image viewer, optional drafts and additional reliability/real-device acceptance. P0/P2 covers SOME prerequisite reliability/performance. | **Core V3 user journeys not yet implemented** |
| P8 | Nonproduction integrated end-to-end V3 acceptance, preview, rollback and **separately owner-approved production cutover** remain. | **Not started** |

Repository boundaries rechecked for this assessment: public production `main` `587b978118df64cc9ec584375c458fa2b10fecfa`; public draft P3 head `b51ede1de493cbb1acc0c0734a7ed7a3273c7103` before this document; private sandbox `main` `69b236c8af663cdce687dc855bb117a01874060a`. Other open PRs: #262 draft AUTH, #268 unrelated content feature. Treat new timestamps/SHAs as fresh after any move. **Do not conflate markdown-only main commits with a new hosted app release.**

## 2. The **six** remaining V3 delivery milestones (fixed list)

### D1 — Freeze minimum architecture and reunify AUTH + publishing
**Input:** approved P1 same-origin gateway/session decision, P3 useful sandbox components, owner-approved UX.
**Work:** choose ONE deployable owner-only trusted backend design; document domain/cookie/CSRF/session boundaries and the smallest GitHub App grants and secret-custody model; decide what P3 code to port and retire. Replace the mandatory per-change ECDSA/independent-attestor proposal with **automated, server-side owner authorization** while preserving exact source/conflict safety, token custody, idempotency, protected-branch policy, and audit. Confirm rule-protection compatibility without bypass. One shared PWA/origin and backend strategy, not parallel frameworks. Record a finite implementation/endpoint contract and rollout/rollback choices. Complete full currently available source-level auth-negative regression tests.
**Done when:** a concise, approved deployable data flow from PWA owner session → validated backend operation → GitHub App and status is documented; the security/cost/permissions decision is made; real user confirmation is required only for the final production cutover, not each content save. No new operation-substage counter.

### D2 — One real nonproduction vertical slice through verified publication
**Work:** implement and provision the **minimum guarded** nonproduction write path with existing permitted isolated sandbox: owner/session + CSRF guard; canonical source-aware validation of current repo state; one idempotent Gear edit; bounded/allowlisted GitHub App commit/PR; exact-head CI; automatic merge **only if allowed under actual branch rules**; nonproduction hosted/release-byte verification; durable Accepted → processing → verified result, conflicts and safe uncertain-outcome recovery. Do not rely on source-only mock passes. Use a controlled sandbox/test release; never publish to public production main.
**Done when:** an **actual** owner-authorized Gear edit becomes a correct hosted, byte-verified **preview** with exact PR/commit/check/run/release lineage, and the same end-to-end path denies anonymous, wrong owner, stale base, duplicates and unsafe content. Explicitly distinguish Accepted from Live. Failure/rollback documented.

### D3 — Owner sign-in and one-click Gear/KB authoring UI
**Work:** port/harden the approved Connection Status-only sign-in, automatic valid-session restoration, Sign out and owner-only editing. Wire current Gear and KB Add/Edit to one **Save and Publish**; show durable status even after leaving the editor; preserve source changes and failed edits, conflicts, session expiration and duplicate submissions. Remove the **user-facing** Copy Changes fallback (retain internal source-aware package logic).
**Done when:** actual preview owner journey signs in, adds/edits Gear and KB, submits once, navigates away, returns to final hosted-verification status; anonymous/unauthorized users cannot edit or invoke writes. Browser and installed Android return/session rechecked in integrated preview.

### D4 — Integrated Gear/KB media and Catch Add/Edit
**Work:** securely transfer existing supported local images and ordered Knot sequences along with canonical record + Markdown changes; preserve original bytes, validate references/resource paths, atomic source candidates and media failures. Add Catch Add/Edit with **current** fields/relations, *no* new Catch photos/GPS. Preserve history and inferred Species images.
**Done when:** owner uploads/replaces a Gear/KB/Knot image with its content in one publish and hosted bytes verify; Catch Add/Edit works end-to-end; invalid file/sequence/reference, content collision, timeout and partial failure do not show false Live or destroy a draft.

### D5 — Connection Status, offline reading, viewer and remaining reliability
**Work:** persist Automatic / Work Offline, preserve verified library/rollback, distinguish actual network/auth/publication states, prohibit offline publishing/queue; ship approved Connection Status visual refresh and Markdown image Picture Viewer; confirm existing v2 image/release improvements suffice or make only measured fixes. Test release upgrades with dirty editors, offline reload and owner device. Optional local draft recovery: **keep only if safe**; otherwise use the approved removal contingency.
**Done when:** Work Offline survives restart and reads a verified full library with no write/network surprise; local Markdown images open existing Picture Viewer; old/new releases do not break images/pages or lose unpublished changes; measured performance remains acceptable and optional draft decision is recorded.

### D6 — Consolidated V3 acceptance, owner cutover decision and rollback
**Work:** ONE traceability matrix against every included approved requirement (auth, Gear/KB/Catch, media, conflict, offline, status, security, deployment identity and recovery). Nonproduction regression/hosted proof plus Windows/Android installed-PWA acceptance, explicitly record supported iOS waiver/absence. Validate monitoring/quota/recovery, provenance of deployment/source/hosted bytes and tested rollback. Produce concise, factual readiness report, identify unresolved issues and decide to fix/defer under approved scope.
**Done when:** preview all required cases pass (or user explicitly accepts documented bounded exceptions), the owner explicitly approves **V3 production cutover**, V3 is hosted and verified against precise release/bytes and key real user flows, and the rollback is exercised/ready. If cutover fails, revert and mark V3 *not released*. No new speculative feature before this exit.

**Each milestone closes only on its acceptance, not on a test count or a long design report.** Security defects are fixed inside the relevant milestone. The six names remain the entire delivery list.

## 3. Security decisions and work to defer instead of expanding P3

**Required for shipping**: owner-authenticated session on the chosen same-origin, server-side authorization *on every write*, CSRF/state safety, protected GitHub App secret custody, least privilege, exact repo/path/content validation, atomic candidate/media commit, replay/idempotency controls, CI/rulesets and PR integrity, durable operation/audit status, hosted verification, enabled rollback and negative security tests.

**Defer as optional research, NOT critical path**: per-change P3-40/P3-41 human ECDSA signature, new independent content attestor, separate attestor signing-key hierarchy, a novel approval-device UX, repeated no-op OIDC-only preflights, additional parallel signed-proof transport protocols or arbitrary P3-42+ work. Keep experimental source for reference; do not claim these are product-required or deploy them automatically. If a specific documented threat cannot be mitigated adequately by the simpler architecture, escalate **one focused decision with evidence**, without automatically restarting an open-ended milestone chain.

**Already excluded by original requirements**: queued offline authoring and background sync, broad multi-user, Catch photos/GPS/session metadata, canonical thumbnails, per-content manual approval, full revision-history UI, new schema redesign and unrelated equipment/KB backlog.

**Release approvals still material**: granting or expanding GitHub App write permissions, moving signing secrets, activating a write-enabled Worker, changing production origin/hosting/routing, changing protected branch rules, production cutover. The user's standing approval covers *interim source-only tests/read-only reviews and routine workflows*, not these consequential actions.

## 4. Reporting cadence, honest progress and stop rule

From now on, report **D1–D6** only. A status update should show *current D#, explicit done criteria and real blocker*, plus a compact V3 requirements coverage table and one latest validated repo/CI checkpoint. Avoid monthly or daily open-ended milestone multiplication. The approved P3-0..41 history stays accessible on PR #263 but does not determine new work numbering.

**First action:** complete D1 architecture consolidation by choosing the minimum viable secure path from AUTH-P0's already owner-accepted same-origin gateway, P3's validated schema/CI machinery, and the existing production Pages/release model. Inspect the current GitHub App write permissions and branch protections before making an operational decision. Present **one** architecture/permissions review for owner sign-off if it materially differs from already granted authority; continue otherwise. No new attestor implementation.

**Stop only at a true milestone blocker**: unapproved *material* credential/hosting change, unresolvable protected branch conflict, failed preview production-safety evidence, required real-device validation, or separate production cutover approval. Do not stop merely to seek another approval for routine source-only tests or read-only workflow runs.

## 5. Project handoff and document governance

This is a **planning-only** proposal on public draft PR #263, **not** a merge, live publisher or owner approval of privileged operations. The canonical public main root README, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, and complete `Fishing_New_Chat_Bootstrap_Prompt.md` are updated *together* at a future explicit new-chat handoff under the established owner workflow, not silently edited while P3 remains in draft. When a transfer is requested, the user copies the **entire** canonical Bootstrap prompt; a condensed handoff cannot replace it.
