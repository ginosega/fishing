# Fishing Companion v3 — Staged Implementation Plan (Draft for Approval)

**Status:** **DRAFT — NOT APPROVED; NO IMPLEMENTATION AUTHORIZATION.** This plan implements, but does not amend, the separately signed-off requirements, technical design and UX flows.
**Date:** October 19, 2026
**Repository:** `ginosega/fishing`
**Plan baseline:** inspected `main` at `f0ead8e94edffda6f073cde30e44fc24b7c5c3af` before drafting; refresh `main`, PR state and production evidence before beginning any authorized work.
**Workstream:** FISH-TODO-037 (v3 planning and delivery); next unallocated standalone application task ID was FISH-TODO-115 at plan baseline. Do not allocate implementation IDs or modify application source merely by approving this plan.
**Authority:** [approved requirements](Fishing_Companion_v3_Requirements.md) · [approved technical design](Fishing_Companion_v3_Technical_Design.md) · [approved UX review](Fishing_Companion_v3_UX_Review.md) · [UX approval](Fishing_Companion_v3_UX_Approval_2026-10-19.md) · [FISH108 release policy](FISH108_Fast_Content_Release_Policy_2026-09-14.md).

## 1. What implementation-plan approval would and would not mean

The user's explicit approval of this plan would authorize **the specified v3 implementation work only within the approved architecture, UX and stage gates**, unless the user restricts the authorization. It would **not** pre-authorize: a new public domain, a paid third-party service, deployment of GitHub App credentials without scoped approval, policy/ruleset bypasses, unsafe auto-merging, code/data migrations outside agreed scope, removal of reliability checks, or a production v3 cutover without final user acceptance.

**Until that explicit authorization occurs, this entire plan is a proposal.** No code, production workflow, secrets, hosted API, GitHub App, preview environment, or production state may be created as part of this documentation exercise.

Design choices requiring empirical feasibility proof (especially AUTH-P0 browser/PWA authentication) remain conditional. The implementation plan must be updated and reapproved if that proof materially changes the approved architecture or UX.

## 2. Nonnegotiable guardrails

1. **Preserve production v2.** Do not couple investigative prototypes or incomplete v3 features to the production GitHub Pages URL or production credentials. Any isolated v2 reliability maintenance must have its own reviewed scope and Full Application Release with hosted verification.
2. **Keep GitHub canonical.** Source-of-truth remains canonical `pwa/Gear`, `pwa/KB`, `pwa/Catches` JSON, Markdown and original picture bytes in `ginosega/fishing`. No second editable content database.
3. **Public reads, one authorized writer.** Anonymous remains default. The only anonymous sign-in entry is in Connection Status. Every write is authenticated and reauthorized on the trusted service using the authorized numeric GitHub identity.
4. **Keep FISH108.** Eligibility and release guards continue unchanged: only content-root-only diffs use the Fast Content Release lane; runtime/schema/build/test/service worker/workflow diffs take the Full Application Release path.
5. **Automatic publication, not automatic overwrite.** One Save and Publish action; auto merge only if exact source/PR/CI checks pass. Preserve GitHub history and hosted source/byte verification before reporting success.
6. **No new features.** No offline queued sync, multi-device drafts, multi-user roles, Catch photos/GPS or planner/session feature. Device-local draft recovery is explicitly provisional/removable.
7. **Tool-capability checkpoint.** Chat mode remains default for source/code reviews, GitHub connector work, documentation and supported CI orchestration. Before browser-driving tests, interactive hosting/provider setup, or real GUI work requiring missing capability, notify the user of the specific need and request a **temporary Work mode switch**; physical installed Android/iOS device results may still require precise user-run tests.
8. **No silent scope escalation.** A proposed new service, vendor cost, domain change, GitHub App permission, security exception, branch-rule bypass, schema migration, or feature expansion requires a separate stop-and-review decision.

## 3. Work-package sequence and authorization gates

Dependencies are intentional. Each package has a separate PR or small PR series and reproducible acceptance evidence. Packages can be regrouped after approval if a later source audit justifies it, without losing test coverage.

### P0 — Restore production and source baseline; plan practical tests

**Depends on:** Plan approval and GitHub access.

**Tasks**
- Re-read current `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, `Fishing_New_Chat_Bootstrap_Prompt.md` in order; current latest `main`, open PRs, production GitHub workflow, deployed `release.json`, and latest hosted-verification artifact determine reality.
- Inventory current app releases, test suites, SW scope, visual styles, canonical data, media, and ongoing edits. Confirm no existing branch/PR conflicts with v3.
- Establish controlled preview/test scopes and security boundaries **only after** any required preview setup is approved.
- Measure current desktop/Android image-grid latency; reproduce deployment post-update and external-link bugs, gathering user-device observations where essential.
- Record a test matrix for Windows Edge/Chrome, Android Edge/Chrome browser/installed PWA and iPhone Safari/Chrome; document what automation cannot prove.

**Acceptance:** Reproducible baseline, documented critical failure cases, nonproduction test location strategy, existing v2 production identity and intact fallback. No application mutation without approved scope.

### P1 — AUTH-P0 authentication feasibility proof (**hard go/no-go**)

**Depends on:** P0, user-approved GitHub App permissions and any nonproduction infrastructure/hosting cost, and a real-device testing plan.

**Tasks**
- Propose the minimal GitHub App permission matrix, secret management and owner numeric-ID allowlist. Review repository branch protection and whether bot-created PRs/merges trigger workflows correctly.
- Build an isolated proof of concept for GitHub sign-in from Connection Status (do not alter v2 production), validated callback and correct owner/unauthorized distinction.
- Compare same-site first-party session design with GitHub Pages + separately hosted API. Explicitly test blocked cross-site cookies and installed-PWA redirect/reentry. If a custom domain, browser-held short-lived *app* session, or alternative provider seems required, **pause for separate explicit decision**.
- Verify silently restored *existing* authorized sessions on desktop, Android installed Chrome/Edge and iPhone, where supported. Verify initial sign-in, sign-out/revocation, expiry and failure behavior; no bearer Github tokens embedded in static HTML/JS or app URL.
- Exercise unauthorized accounts and direct write-endpoint attempts; record backend rejection and audit trail.

**Evidence:** Authentication matrix with real devices, selected hosting/session mechanism and security risk assessment, minimal verified permissions, provider/cost decision, and demonstration that the session transport works without a hidden third-party cookie dependency.

**Stop conditions:** Session restoration/return cannot be made sufficiently secure/reliable; service credentials would need to be browser-exposed; GitHub App auto-merge cannot respect rules. **Do not proceed to publishing; return to user with alternatives.** AUTH-P0 is a prerequisite, not an excuse to change signed-off requirements silently.

### P2 — Independent v2 maintenance candidates (**optional early releases**)

**Depends on:** P0 root-cause evidence and separate release approval; independent of authentication where possible.

**Candidates**
1. Android installed-PWA HTTP(S) external-link activation, preserving YouTube app delegation and ordinary desktop/browser behavior.
2. Post-deployment open-session release consistency, preventing missing pages/pictures; preserve exact verified releases.
3. Card-grid image rendering/loading improvements, including deterministic build thumbnails if their benefit is validated and the change can safely be independently released.
4. Markdown local-image Picture Viewer activation when self-contained and regression-safe.

**Strategy:** Each independent issue gets a narrow diagnosis, minimal design decision, isolated app PR, Full Application Release validation, real-device user acceptance when required, production hosted verification and rollback plan. If intertwined with v3 SW/auth build architecture, leave it for v3 instead. Do not simultaneously ship unrelated risky rewrites to v2.

**Stop conditions:** Unreproduced bug, uncertain regression risk, missing real-device validation, negative performance metrics or unapproved schema/release migration. Deferral is preferable to a speculative production fix.

**Outcome:** The user gets independently safe improvements sooner, without waiting for the complete v3 release. **This plan itself does not authorize a v2 maintenance deployment.**

### P3 — Trusted publishing service foundation

**Depends on:** Successful AUTH-P0 and approved service infrastructure/permissions.

**Tasks**
- Implement smallest permitted, authenticated service: owner session, CSRF/state protection, GitHub App installation token management, input limits, rate limits, idempotent operation creation, durable operation status, bounded media upload staging and relevant events/logging.
- Implement server-side package validation using current `main`, source-aware semantics from `pwa/src/handoff.mjs`, `validation.mjs`, canonical JSON/Markdown paths, media SHA and real bytes. Ensure atomic candidate changes in a branch commit.
- Create one content-only PR; select exact CI/check status for the current head; revalidate fresh `main` before merge, respect rulesets, trigger production normally, and read the actual hosted-verification result.
- Model Accepted → Validating → Merging → Deploying → Verifying → Live, with Conflict, Failed and Pending states. Service restart/retry must not duplicate edits.
- Test conflicting concurrent edits, edited Markdown, moving branch head, invalid IDs/paths, unauthorized user and repo, missing pictures, workflow failure, merge race, deploy failure and hosted SHA mismatch.
- Never treat GitHub-merged content as Live until production hosted verification matches the intended merged SHA.

**Acceptance:** End-to-end test publication in an isolated test repo/branch or equivalent nonproduction environment; exact PR/CI/merged SHA/hosted identity linkage; tested recovery/idempotency and security rejections; no production canonical changes.

### P4 — UI sign-in plus Gear/KB Save and Publish

**Depends on:** P3 verified trusted service, approved UX and safe auth session.

**Tasks**
- Integrate Connection Status GitHub sign-in, owner identity/Sign out; hide all Add/Edit controls when anonymous or unauthorized.
- Change existing Gear and KB Add/Edit from Prepare Changes/Copy Changes to **Save and Publish**. Keep existing fields, validation, pictures and Knot sequence controls, stable IDs and visual language.
- After authenticated service returns durable **Accepted**, allow user to leave the editor; provide persistent discoverable publication details and final outcome even if user navigates away.
- Preserve safe data snapshots and unsaved-change guard before Accepted. On source conflict, do not silently overwrite; show explicit remediation. Handle token/session expiry during edit and submission.
- Confirm no manual Copy Changes fallback appears in v3 UI; keep internal validated package/promoter behavior as a security component.

**Acceptance:** Real test content publishes to verified hosted preview; anonymous visitor cannot invoke editor or trusted write; owner can publish a Gear and KB item, navigate away and recover status; unsuccessful/partial publishing does not show Live.

### P5 — Integrated upload and Catch authoring

**Depends on:** P4 workflow.

**Tasks**
- Tie existing file picker, browser preflight and server image validation to atomic GitHub record + Markdown + binary file commit; preserve original image bytes and canonical path semantics.
- Cover static picture add/replace/removal; Knot ordered sequences and final-frame representative image. Simulate missing/duplicate/over-size/corrupt file, sequence collisions and partial upload failures.
- Add Catch Add/Edit with current approved fields only; validate optional relations, dates/times, source-aware notes and stable identity. Keep derived Species picture and history.
- Allow missing/unavailable upload component to block publication safely but not destroy already edited text; maintain consistent Save status.

**Acceptance:** Picture and related canonical content deployed together and byte-verified, no broken resources; Catch Add/Edit is usable without pictures/GPS/new schema, and history still works.

### P6 — Persistent reading mode, Connection Status and release coherence

**Depends on:** P0/P2 findings; coordinate with P4 owner UX and P5 to avoid rework.

**Tasks**
- Introduce persistent Automatic / Work Offline preference readable by service worker *before* app startup fetches. Distinguish actual network availability, mode, verified library status and owner authorization.
- Preserve explicit atomic offline library Update/Repair and previous-complete fallback, without hidden bulk downloads or weakening SHA checks. Refuse Work Offline when no verified library exists.
- Resolve old-session/new-deploy release context coherently; use evidence to decide whether per-client state persistence, verified asset leases/cache or bounded older releases are needed. Handle SW termination/restart and new release availability safely.
- Implement polished Connection Status as approved, with signed-in/out states, publication status and safe reload. Exercise weak-signal behavior and offline mode restarts.
- Ensure offline reading does not attempt GitHub publishing; an already-open editor can **provisionally** continue locally after switching offline with a clear notice, but never queue uploads.

**Acceptance:** No missing pages/images across a content-only deploy and stale open session, SW restart or offline library transition; Work Offline persists and really selects prepared verified content; no unsafe reload/dirty-state destruction.

### P7 — Performance, viewer and optional draft reliability

**Depends on:** P4–P6 as relevant, unless standalone v2 fixes already released in P2.

**Tasks**
- Generate deterministic disposable card thumbnails at build time, mapped to canonical originals. Prove source images unchanged, release manifest/hash coverage, and acceptable complete offline library size.
- Tune above-fold/near-fold image priority only after profiling. Compare observed visual loading on PC/mobile and controlled network profiles.
- Activate existing Picture Viewer from suitable local Markdown images, with accessibility and linked-image noninterference.
- Add optional IndexedDB draft store and automatic Restore/Discard prompt; preserve media Blobs and exact source bases; never mix drafts with SW release caches. Keep online publishing functional when draft DB unavailable.
- Exercise editor's already-open continuation after selecting Work Offline; this is one provisional, removable feature area. Implement kill-switch/removal and test the no-draft fallback before acceptance.
- Provide Copy Diagnostics without credentials/private drafts; ensure failures are explainable.

**Acceptance:** Measurably better image appearance; originals and Markdown intact; viewer and links work cross-browser; draft interruption/quota/update tests pass. If draft persistence/continuation materially harms reliability, **remove it under the signed-off contingency** before v3 cutover, report to user, and preserve core online authoring.

### P8 — Full v3 acceptance, production cutover and rollback (**separate approval**)

**Depends on:** P1–P7 required acceptance, live UX review, full tool access and explicit user production go-ahead.

**Tasks**
- Complete security, browser, real installed-PWA, CI, source integrity, conflict, media, Catch, offline, drafts, image performance and release-coherence matrices.
- Exercise first-login/new-device/expired-auth/revocation, double Save/retry, accepted operation across browser exit, failed deploy, branch race and hostile payload tests.
- Verify preview and production-root builds under the Full Application Release lane, including Chromium/WebKit, real cutover regression fixture, Pages deployment and actual hosted byte/release-identity verification.
- Reconcile runtime secrets/hosting/permissions, operational costs, alarms and ongoing account management; document service recovery and manual emergency procedure.
- Present final release readiness report: passing cases, remaining known issues, optional draft keep/remove decision, observed performance, rollback route, and precise source/release IDs.
- Obtain **separate explicit v3 production cutover approval**. Only then publish v3, verify actual hosted data and important user journeys, and retain a recoverable healthy v2 route. On failure, enact the validated rollback and report actual status.

**Acceptance:** User sign-off, successful deployed release with hosted identity/byte proof, real-device acceptance and a tested rollback. Do not equate implementation-plan approval with production cutover permission.

## 4. Deliverables and traceability by gate

| Gate | Required evidence | Explicit owner review |
|---|---|---|
| G0 Plan | This staged plan, authorization boundary, scope exclusions | **Pending** |
| G1 AUTH-P0 | GitHub App permissions, PWA auth/session feasibility evidence, hosting/session decision | Required for any change to approved security/hosting assumptions; user permission before provisioning secrets/provider |
| G2 Reliability | Repro steps, before/after tests and rollback for independent v2 fixes | Specific maintenance release approval |
| G3 Publishing | Trusted service threat model, CI integration and fail-closed test results | Stop/review if branch protection or GitHub permissions force new design |
| G4 Authoring | Verified anonymous/owner flows, real source validation and atomic media tests | UX/acceptance checks against approved screens |
| G5 Offline/release | Coherent old/new release behavior, persistent mode and no data loss | User-device confirmation where automation insufficient |
| G6 Draft gate | Failure/eviction/quota tests; explicit keep/remove outcome | Notify/review if exercising preapproved removal contingency |
| G7 v3 cutover | Full acceptance, hosted release verification, rollback tested | **Separate explicit production approval** |

Current requirements, design and UX approvals are **complete**, but **G0 has not been approved**. Number work packages after implementation authorization in a source-aware task plan; do not invent completed task IDs in a draft.

## 5. Tool capability, timing and collaboration

- Treat Chat as the primary planning/repository-work mode. Verify installed GitHub tooling as tasks change, rather than assuming the same permissions remain available.
- Before test stages that require a graphical browser/GUI capability missing from Chat, proactively say what operation requires Work and obtain temporary-switch approval **before** starting it. Do not require Work just because a package is technically complex.
- Some installed Android/iOS PWA behaviors cannot be proven through cloud desktop browsing. Supply the user step-by-step device instructions, exact link/scenario and expected evidence at the relevant stage.
- Do not give background-work promises or defer the answer. Provide a complete current-phase deliverable each time. Use manageable PRs/checkpoints and visible issue reporting rather than starting a long opaque multi-stage process.
- Estimate schedules only after AUTH-P0, repository permissions, preview hosting and test/device capabilities are known. Avoid an arbitrary calendar commitment unsupported by the architecture's main feasibility gate.

## 6. User decisions needed before implementation authorization

**I1 — Plan scope and sequence:** Accept this staged plan and the suggested order, including optional early v2 maintenance only through its own approved release gate.

**I2 — AUTH-P0 first:** Approve conducting a limited nonproduction feasibility test for GitHub owner sign-in, session restoration and installed PWA callbacks as the first security-dependent implementation phase. Review permissions/vendor/cost before provisioning anything.

**I3 — Automated release guard:** Agree that routine Save and Publish can auto-merge only after exact content PR/source/CI checks, and Live requires hosted byte/identity verification. Any incompatible repo rulesets result in stop-and-discuss, not bypass.

**I4 — Provisional local drafts:** Retain the approved test-and-remove condition. A failed optional draft subsystem must not block reliable core online editing.

**I5 — Cutover gate:** Confirm that a later specific approval is required to replace v2 production with v3 after preview acceptance and rollback testing.

The approved requirements, architecture and UX are not reopened by these questions. They ask only for authorization to execute the corresponding staged work safely.

**Overall status: This plan is a draft for user review. No application implementation, external service provisioning, GitHub App installation or production deployment has begun or been authorized.**
