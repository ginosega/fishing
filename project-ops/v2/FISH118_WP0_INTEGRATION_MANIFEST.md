# FISH118 WP0 — Selective D5→D6 integration and PR disposition

**Audit date:** 2026-11-10. **Status:** WP0 inventory prepared for owner review; NOT authorization to implement/merge app code or deploy. **Companion:** [66-ID requirement matrix](FISH118_WP0_REQUIREMENT_MATRIX.md) and stable [WP0–WP6 contract](FISH118_V3_COMPLETION_CONTRACT.md). No additional V3 milestones.

## Verified source and evidence boundaries

- Default public `main@fc85bd38c4c688026700971b4c2d463c293eebf3`; public V2 still live/unchanged. Operating model on protected `governance/project-ops`, independent of app release. Canonical V3 release ticket: [#377](https://github.com/ginosega/fishing/issues/377).
- **D5 private owner:** `feature/fish118-d5-owner-integration` (verify tip before port). D5 authenticated editor / offline / Notes / Catch UX and private hosted owner field checks were accepted in bounded evidence [#357](https://github.com/ginosega/fishing/issues/357) and [#341](https://github.com/ginosega/fishing/issues/341); private sandbox Save→Live is not canonical repo publishing authority.
- **D6 current application:** [draft #424](https://github.com/ginosega/fishing/pull/424), branch `feature/fish118-d6-integrated-real-records-stage`, head `7f8478bfcae05e7038f4470bcb97d824e6ece850`, based on source-tested #423 head `dd691adc9d2b217688318879bc7cd30f10fc7dbb`. Most D6 components are default-OFF, read-only or source-only. No D6 real authorized owner publisher is routed.
- **CI split:** #423 full source-only CI PASS (425/425 application, 54 preview, 56 production browsers, 4 accepted owner Connection Status). [#424 Actions #42919892308](https://github.com/ginosega/fishing/actions/runs/42919892308) **FAILED** at physical Pages packaging (`unapproved staging release pointer`); 427/427 source and six owner Connection Status/real-record browser checks PASS, full merge readiness FAILED; artifact not uploaded/deployed. No public D6 release was created.

## Source selection, adaptation and boundary

| WP | Prefer and preserve | Must integrate / replace safely | Explicitly reject |
| --- | --- | --- | --- |
| WP1 | D5 `pwa/src/{d5-owner-candidate,editor,catch-editor,notes-markdown-editor,notes-link,catch-lure-picker,editor-preview}.mjs`; tested D5 owner UX; D6 already has much shared UI code and D6 Connection Status | D6 `pwa/src/entry.mjs` currently invokes `bootstrap` with read-only D6 context. Add narrowly gated **production owner authoring composition** with approved D5 UX, not D5 sandbox session/URLs; preserve anonymous reader and approved Connection Status. Fix #424 marker/build-to-staging mismatch. | Wholesale prototype UI, V2 Copy Changes fallback, sandbox-only auth entry, cosmetic redesign of accepted UX |
| WP2 | D6 `d6-production-{oauth-session-issuer,owner-session,owner-signout,app-signer,read-token,write-token,read-composition,runtime-bindings}.mjs`, D6 canonical source loader / source route / browser readiness | Wire single same-origin trusted session/CSRF/canonical main source to approved owner editor. Set deployment env in a separately approved test infrastructure gate. | Transplanting D3/D4 sandbox owner/repo ID/keys or creating a second auth layer |
| WP3 | D6 `d6-production-{publish-intake,source-review,operation-receipts,pr-creation-fence,github-step-writer,github-readback}.mjs`; private D5 `d3-sandbox-{scheduled-coordinator,operation-runner}.mjs`, `d4-{media-tickets,git-blob-stage,media-integrity}.mjs` as **behavioral references** | D6 intake/receipts/step writer explicitly limit to **Gear and KB text**. Add production-safe Catch JSON/Markdown and atomic original images, Notes photos, Knot sequence updates; complete durable step CAS and outcome reconciliation, canonical PR binding and authenticated operation/status endpoints. Write/update only operation branch using reviewed source and bounded paths. | Treating read-back success as D1 completion, blind replay of any uncertain Git write, or changing sandbox repo constants in-place |
| WP4 | FISH108 two-lane CI and existing `pwa/tools/{build,verify,verify-hosted}.mjs`, D6 `d6-production-publish-evidence-gate.mjs`; private D5 coordinator/fast-watchdog tests | Production coordinator advances verified PR→exact-head CI→guarded merge→release build/deploy→public hosted-byte verification→Live; reconcile #303 fast wake/Cron recovery and ≤60-second normal text Save→public verified Live. Keep explicit failure/Conflict/Unknown handling. | Add redundant independent attestor, HMAC receiver, unsafe bypass or normal five-minute polling loop |
| WP5 | D5 prior Windows/Android owner field results and #396 final approved UX; D6 CI/browser suites | **Full signed-in and anonymous** private hosted V3 release candidate with real canonical records, no sandbox writes; install/upgrade, offline, conflicts, media, security, release-byte, latency, and owner Windows/Android acceptance. #342 durability either passes or exercises approved removal gate. | Treat #424 read-only preview or source-only CI as full RC |
| WP6 | Approved single-user brief V2 downtime/direct cutover, protected production release workflow | Fresh owner approval for GitHub App permissions, D1 migration/Cloudflare routing and final public cutover. Controlled real-record edit and complete source→public asset proof; preserve other records and receipt history. | Unapproved `main` merge (auto deploys), live writing from sandbox, elaborate V2 dual-running/rehearsal |

## Exact draft PR treatment (no automatic merging)

| Existing PR group | Disposition at WP0 |
| --- | --- |
| [#263](https://github.com/ginosega/fishing/pull/263) original prototype | **Exclude wholesale merge** under ARC-003. Port only approved, tested D5 functions per WP1/WP3 manifest; PR remains draft. |
| [#395](https://github.com/ginosega/fishing/pull/395) Stage A security/static and D6 source #380–#413 | **Retain audited selective source history**; accepted D5 Connection Status UI and reader guards are reusable. No automatic unstacked merge or public activation. |
| [#415](https://github.com/ginosega/fishing/pull/415)–[#423](https://github.com/ginosega/fishing/pull/423) auth/source/publisher pieces | **Retain source and tests as WP2–WP4 inputs**. Compose into one coordinator and verify all domains/media/recovery; no standalone component declared production-complete. |
| [#424](https://github.com/ginosega/fishing/pull/424) | **WP1 fix required**: CI package identity marker mismatch. Real-record browser checks PASS only; no deploy or completed RC. |
| [#425](https://github.com/ginosega/fishing/pull/425) | **MERGED** to protected governance; stable completion contract and WP0 queue pointer. Not an application PR. |

## Open integration risks / owner exception review

1. **D6 publishing functional gap (WP3):** Gear/KB text-only restrictions, no canonical Catch/media GitHub publisher, no complete durable step completion and no provider-authenticated coordinator. This is **missing integration**, not a new scope proposal.
2. **#424 staging integration defect (WP1):** package verifier expects an approved owner-read-only marker combination that the candidate builder did not emit; fix/retest rather than weaken verifier or redeploy public V2.
3. **D5 local drafts #342 (WP1/WP5):** private IndexedDB implementation stores text/record but NOT media bytes; Android process loss/quota and stale draft conflict remain provisional. Approved removal fallback exists.
4. **Fast publishing #303 (WP4):** owner-observed five-minute fallback in private D3 recovery. Need production full pipeline timing/fast wake proof; not permitted to omit 60-second normal text target.
5. **V3-X-01 original iPhone acceptance vs owner's later Windows/Android-only test preference (WP5):** seek a narrow requirement-test exception at WP0 acceptance, no invented iPhone PASS. Do not reopen device support implementation unilaterally.
6. **V3-PERF-05 (WP1/WP5):** establish measurable card-thumbnail load acceptance on representative Windows/Android environment. Do not confuse with firm V3-SAVE-09 <=60 seconds.
7. **Cloud provider/config (WP2/WP5/WP6):** preferred `https://fishing.ginosega.workers.dev/fishing/` accepted in principle; actual routing, session/permissions, D1 and public activation need explicit separate approval.

## WP0 completion gate (not yet declared PASS)

- The matrix explicitly maps **all 66 numbered approved V3 requirements** to one WP, targeted source/test evidence and remaining acceptance gate; detailed later Notes/UX amendments are traced through accepted topic catalog and WP1/WP3.
- Owner reviews this selective source/PR disposition and the two scoped test exceptions (iPhone test matrix, card-performance metric). Resolve any conflict without silently editing the approved requirements.
- Only then mark **WP0 accepted** in the *single* FISH-TODO-118 work queue and move active state to WP1; implementation PRs must cite a WP and explicit missing full-app test.

**Never use this inventory as a new startup prompt.** `PROJECT_ROUTER.md` → `START_HERE.md` → active queue remain the only startup reading path; load the WP0 inventory/matrix on demand.
