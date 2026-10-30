# FISH118 — D4 publication audit / D5 implementation start

**Date:** October 29, 2026 PDT (GitHub timestamps after 00:00Z are October 30 UTC). **Scope:** private V3 sandbox and unmerged draft source PR #263. **Public V2 unchanged; V3 production cutover not authorized.**

## D4: read-only CI and repository evidence

| Acceptance | Evidence | State |
|---|---|---|
| Catch Add | [sandbox PR #31](https://github.com/ginosega/fishing-p3-sandbox/pull/31) merged at `7186980c3971918887c3830202fe2ba70afc688c`, exact-head GitHub CI #40972962610 passed, owner reported Live | Functional PASS |
| Gear original image Add | [PR #32](https://github.com/ginosega/fishing-p3-sandbox/pull/32) merged at `cdd4812cfb99442435c7217e451d63ba307f7884`; CI #40973209473 passed; `Vision TEST.jpg` displayed in list and detail after private asset URL correction | Functional PASS |
| Ordered Knot two-frame Add | [PR #34](https://github.com/ginosega/fishing-p3-sandbox/pull/34) merged at `78fb5ae03a488ccace69198ad37cd2b1b06635d2`, CI #40978770278 passed; owner saw both frames | Functional PASS |
| Gear original image Replace | [PR #35](https://github.com/ginosega/fishing-p3-sandbox/pull/35) merged at `8ca5f95ea778f58366d3a6adfad0e2146e363406`; CI #40986075048 passed; item now references `Gear/Rods-Reels/assets/rapala-dt06.png` (original binary added in same PR); owner reported successful change | Functional PASS, D1/hosted direct-byte proof pending |
| Catch Edit | [PR #37](https://github.com/ginosega/fishing-p3-sandbox/pull/37) merged at `c93da0a79ae37c243b6bd0f32f8cb9b484c5a40b`, CI #40989928229 passed; original Catch ID preserved, date/species/Markdown changed; owner reported Live | Functional PASS, D1/hosted direct-byte proof pending |
| Synthetic-content denial | [PR #36](https://github.com/ginosega/fishing-p3-sandbox/pull/36) is OPEN/UNMERGED; CI #40988106690 failed `NON_SYNTHETIC_SANDBOX_SOURCE` on a fabricated Catch changed to unsuffixed `Shark`. No forced merge, and user safely retried as a fresh operation (#37). Old invalid Knot PR #33 remains unmerged. | Negative CI PASS |
| Unauthorized, corrupt and partial media | Automated cases D4-M01..07 (exact original/MIME/path/hash, complete sequence, duplicates, Catch exclusion), D4-T01..04 (ticket integrity), D4-ST01..05 (GitHub staging/expiry/size/anonymous), guarded D3 API (owner, CSRF and write gates) | Source negative-test coverage; no destructive owner test requested |
| D1 operation states and private hosted-byte proof | Read-only Cloudflare D1 output not accessible from GitHub alone; GitHub merge and CI are independent but not substitutes for final D1 status/hosted SHA proof | **OPEN** |
| Knot existing sequence Replace, interrupted media upload on real device | Ordered sequence Add passed, but owner has not tested replacement/interruption; validation tests cover missing/changed frames and partial candidate rejection | **Deferred / not claimed PASS** |
| Public V2 byte identity during latest owner publications | Prior guarded private deployments verified public-v2 preservation; independent latest operator read-only observation not repeated after PR #37 | **Reconfirm at final gate** |

**D4 exit recommendation:** Core functionality and source/CI safety passed. Do not unconditionally declare full D4 complete until D1 and hosted media receipts are reconciled (at least #35 and #37), and record accepted bounded real-device coverage gaps. Do not write/merge/rebase failed PRs.

## D5: Work Offline implementation (unreleased, feature-flagged)

The current V2 service worker already supports explicit atomic download and integrity validation of a complete public library; it does *not* have an owner-selectable persistent offline reading mode. The new D5 source code:

- Introduces SW `__FISHING_V3_READING_MODE__`, **compiled false in all normal builds**, enabled only by an explicit `--v3-reading-mode` candidate-build option. The private sandbox pilot stays online-only and does not inherit or cache public V2 content.
- Provides `V3_READ_MODE` / `V3_SET_MODE` control messages. Stores at most `{version:1,mode:'Work Offline'}` in existing scoped CacheStorage metadata; default is Automatic, which deletes that value. The preference survives a new SW instance/browser restart.
- Requires a **fully verified** selected offline library *before* persisting Work Offline. Failed readiness, corrupted asset, invalid mode and CacheStorage write denial leave previous mode untouched.
- Prevents ordinary navigation, asset loads and release-current checks from making network requests while Work Offline is selected. It serves only integrity-checked files from the selected full local library; missing/corrupt data returns an error rather than silently mixing network content. Explicit user-requested library Update remains separately available.
- Adds V3 Connection Status choice and owner publishing guard; current owner-only forms may keep unsent content in memory but cannot publish until Automatic/online is restored. Owner refresh/polling is suspended during Work Offline.
- New unit tests D5-O01..04 cover V2 inert/default, no-library denial, persistent no-network reads and return to Automatic, corruption/quota rollback. The existing V2 offline-integrity and release-transition tests remain mandatory.

**Limitations:** Source changes are not a deployed V3 offline app. The private owner sandbox lacks a complete public verified library by design. Additional D5 work: complete installed-Android PWA mode test, SW/owner-auth session transitions, offline library update/rollback stress, explicit publication-negative tests and Connection Status visual polish, local Markdown Picture Viewer, draft recovery keep/remove evaluation. Build-flag opt-in and public production cutover require separate integration and approval.

**Independent pre-cutover gates:** D3 installed Android V3 owner OAuth/SW and V3-SAVE-09 genuine publicly hosted text-only <=60-second proof remain OPEN. D6 consolidated traceability/rollback/cutover decision follows D5; no new P3 milestone series.
