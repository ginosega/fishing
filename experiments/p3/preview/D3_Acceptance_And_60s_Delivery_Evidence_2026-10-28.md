# FISH118 D3 — KB recovery acceptance and V3 60-second delivery evidence
Date: 2026-10-28. Scope: owner-only PRIVATE sandbox D3 + historical PUBLIC content-release timing. Source branch: `feature/fish118-p3-mock-publisher`, draft PR #263. **Not a V3 cutover or public-main write authorization.**

## 1. D3 owner-pilot publication evidence

- The owner reported the **Knowledge Base** operation `p3_5527208d-a67c-4a2c-876d-9edaee353bc8` as **Live** after deploying the independently verified, no-repeat merge-tree recovery Worker `4266c366-c41b-412a-9158-6552950be9e8`. On October 28, the owner also ran the independently prepared, **read-only remote D1 audit** `tools/audit-d3-kb-pr18-readonly.ps1`, which returned **PASS** with the exact operation, source merge, terminal state, cleared lease and sandbox verified release identity.
- GitHub private sandbox PR [#18](https://github.com/ginosega/fishing-p3-sandbox/pull/18) is closed and merged, `2026-10-27T23:25:43Z`. Recorded head `9276f35348e43a23c72208f3b2134e28554382fd`; parent/base `7418cc15e5e392b6e52a48eb533804a5055ca8d7`; merge/main `97f68efc932084f2e607480c12cee37a94f81758`. Its head and merge Git commits have the same tree `dc90f7c4fdad86b79baa791af7e6f2b54c66711c`.
- The merge modifies exactly `pwa/KB/kb.json` and `pwa/KB/Locations/content/P3 Test Lake.md`; the name/heading are `P3 Test Lake D3 Verification`. Nothing in public `ginosega/fishing` main was merged by this pilot.
- The D3 private verifier requires current private `main`, exact PR evidence, independent read-only GitHub GET merge-status 204, exact single-parent/commit tree/file proof and both hosted file bytes + metadata before `Verifying -> Live`. The independent D1 audit now also confirms **`state=Live`, `reason_code=NULL`, `verified_release_id=1dcb68bab0f88638b009d3ce13d69426`**, matching merge SHA `97f68efc932084f2e607480c12cee37a94f81758` and the original head/PR/CI references. This proves the sandbox receipt, **not** public canonical V3 release.
- The observed interrupted-merge path originally left D1 in `Merging`, `reason_code=merge_attempted`, with expired lease and no merge receipt. It was **not** resubmitted or merged again. After independent recovery the owner reported Live. The root technical incompatibility was the GitHub App PR summary omitting merged/SHA metadata; the recovery no longer depends on missing summary fields, but still denies conflicting non-null SHAs and mismatched immutable trees.
- **Read-only D1 audit completed (owner PowerShell output, October 28):** `PASS: KB PR18 durable operation is Live with exact sandbox merge receipt and verified release identity`; `OPERATION_ID=p3_5527208d-a67c-4a2c-876d-9edaee353bc8`; `MERGE_SHA=97f68efc932084f2e607480c12cee37a94f81758`; `SANDBOX_VERIFIED_RELEASE_ID=1dcb68bab0f88638b009d3ce13d69426`; `AUDIT_EVENT_COUNT=7`; `AUDIT_TRANSITIONS=Accepted -> Validating -> Checking -> Merging -> Deploying -> Verifying -> Live`. No failed or conflict terminal event. This still does not prove a publicly deployed production release or a 60-second delivery.

### D3 acceptance matrix (do not mark untested items completed)

| Criterion | Evidence/status |
| --- | --- |
| Authorized Gear edit, one-click publication | Owner pilot prior Gear PR #17 reached sandbox Live; source-level owner + idempotency cases exist. |
| Authorized KB edit and return to status | Owner confirmed KB PR #18 **Live**, and read-only D1 audit confirmed terminal state, exact source merge, seven transitions and release identity. |
| Interrupted merge / restart recovery | Real PR #18 recovered through read-only merge evidence with no replay; stage-recovery tests included in source CI. |
| Independently verified hosted bytes | Mandatory implementation guard for sandbox Live, with its final `verified_release_id` and D1 terminal transition independently audited; no separate public V3 proof. |
| Anonymous and wrong-owner denial | Source integration tests and private anonymous-route postflight checks; complete hosted negative-user test matrix still to be consolidated. |
| Conflict, duplicate, stale base, lost acknowledgment | Source tests; broader real-device D3 acceptance not yet evidenced as complete. |
| Installed Android Chrome PWA, OAuth return, sign-out, reload / navigation | Must be retested specifically in integrated D3 pilot; prior AUTH-P0/D2 tests do not automatically close this. |
| Production public V3 Live and <60 seconds | **Not yet implemented or proven**; private sandbox test status is not canonical public Live. |

**D3 remains open** until missing integrated-owner/mobile and negative-flow evidence is recorded, despite both sample Gear/KB publications reaching private sandbox Live.

## 2. Historical actual production fast-content delivery samples

GitHub Actions: `ginosega/fishing`, successful *main push* content-only production workflow runs. Duration measured conservatively from **Actions `created_at`** (already after the source push; does not include Save/PR/check/merge) to completion of the **`Verify hosted bytes and release identity` step**, using GitHub API job/step timestamps. Durations are measurements of the **existing release path**, not full V3 Save-and-Publish timings.

| Production run | UTC date | Content validation (sec) | Deployment job (sec) | Run creation -> hosted verification (sec) |
| --- | --- | ---: | ---: | ---: |
| [#520](https://github.com/ginosega/fishing/actions/runs/38686171921) | Oct 15 | 35 | 52 | **99** |
| [#517](https://github.com/ginosega/fishing/actions/runs/38207507318) | Oct 12 | 29 | 43 | **85** |
| [#512](https://github.com/ginosega/fishing/actions/runs/37953015607) | Oct 9 | 29 | 142 | **183** |
| [#510](https://github.com/ginosega/fishing/actions/runs/37947602051) | Oct 9 | 36 | 51 | **100** |
| [#503](https://github.com/ginosega/fishing/actions/runs/37891311432) | Oct 9 | 45 | 56 | **117** |
| [#502](https://github.com/ginosega/fishing/actions/runs/37890919676) | Oct 9 | 32 | 76 | **138** |
| [#500](https://github.com/ginosega/fishing/actions/runs/37890243751) | Oct 9 | 39 | 47 | **99** |
| [#495](https://github.com/ginosega/fishing/actions/runs/37887329753) | Oct 9 | 28 | 53 | **95** |
| [#491](https://github.com/ginosega/fishing/actions/runs/37255448422) | Oct 5 | 32 | 51 | **164** |

Nine of nine successful observed current-path samples already exceed the **approved firm 60-second** window **after** main push. This does not prove no possible optimized GitHub Pages workflow could ever succeed, but **the present Actions/Pages path demonstrably has not satisfied the production acceptance gate**. Five-minute D3 Cron scheduling adds further unpredictable delay and cannot be the normal primary path.

Sandbox KB run [#37](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40600896518) completed an exact-head CI job in about **18 seconds** (`2026-10-27T23:15:47Z` to `23:16:05Z`). Its successful PR #18 did not merge until 23:25:43Z, consistent with the pilot's scheduled-step latency. The sandbox test host has a separate synthetic verified-release identity; it is **not** a substitute for public GitHub Pages release identity.

## 3. Gate and recommended implementation direction

Approved requirement: `V3-SAVE-09`, ordinary Gear/KB/Catch JSON+Markdown text-only owner click to *independently publicly retrievable* canonical source/release bytes in **60 seconds or less**, for every normal-operation acceptance sample. No routine CI queue/Pages delay/Cron exception, and no falsely early Live. Only evidenced external provider outages qualify for an exception.

1. **Do not promise compliance from the existing two-lane Pages workflow or 5-minute Cron.** Preserve current public V2, protected source/CI rules, and isolated D3 sandbox.
2. **Measure the actual critical path**: owner click, durable receipt, source validation, PR creation, exact-head checks, merge, public delivery, immutable release identity and byte proof. Record UTC timestamps with millisecond precision in a bounded, non-secret owner/server trace. D1's second-resolution state audit cannot reconstruct the original click time; do not fabricate it from `created_at`.
3. **Develop and benchmark an event-driven primary progression** in isolation while retaining durable/lease no-repeat reconciliation and the Cron as recovery-only. Polling for workflow completion alone does not shorten the observed Actions/Pages publication time.
4. **Run two explicit feasibility alternatives before routing changes:** (A) measure a deliberately minimized compliant content-only GitHub Actions/Pages sequence while preserving all canonical/hosted proofs; (B) prototype a versioned, atomically visible verified-content delivery path on the intended same origin, sourced strictly from approved GitHub commits, with independently computed SHA/blob/release proof and session-pinned assets. Candidate B may require a **material production hosting/routing change and separate owner approval**. Do not turn a synthetic sandbox release ID or unpublished Worker cache into public Live.
5. **Stop any production cutover** if the actual end-to-end consecutive Gear, KB and Catch normal-operation acceptance runs cannot all meet 60 seconds. A faster but noncanonical or unverified publication is not compliant.

### Next evidence, rather than a new milestone chain

- **Done:** record exact read-only D1 receipt and event audit for PR #18. **Still needed:** confirm Gear/KB owner can navigate away/return, restore a valid session, and inspect status without losing unsent changes.
- Execute the [prepared owner-device acceptance checklist](D3_Owner_Device_Acceptance_2026-10-28.md). Start with Android Chrome's real private pilot route and OAuth return; record each PASS/FAIL/GAP. **A browser tab does not prove installed Android PWA integration**, because the current pilot route is outside `/fishing/` scope. Integrated installed-PWA D3 remains pending. Avoid unnecessary re-publication.
- Begin separately isolated source-only timing instrumentation and delivery-path feasibility; **do not activate a public writer, change origin/routing, merge public main, or release V3** without its distinct consequential approval.

This report is an evidence checkpoint, **not** a sign-off on D3, D4, D5, D6, or `V3-SAVE-09`.
