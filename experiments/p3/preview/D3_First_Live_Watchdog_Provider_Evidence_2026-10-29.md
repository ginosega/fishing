# FISH118 P1 — first owner-run private watchdog release (2026-10-29)

## Grounded observed result

Owner reports pressing **Save and Publish at approximately 9:10 AM America/Los_Angeles** on a small text edit to `location-p3-test-lake`, then observing **Live roughly 1–2 minutes later** in the private D3 owner pilot. The private pilot sign-in incident was fixed immediately before this test by aligning `D3_PILOT_SHA256` with the bundled JS. Do not interpret this as a production V3 deployment or verified ≤60s SLA.

### Independent GitHub evidence (timestamps in PDT)

- PR #19 `https://github.com/ginosega/fishing-p3-sandbox/pull/19`: created **09:10:30**, merged **09:11:10** (40s PR creation-to-merge), head SHA `1ea29fbf6efc52147a758df5a95f8ca7a85a3808`.
- Exact-head private `validate-sandbox-head` workflow **40908952978** created 09:10:34 and completed successfully **~09:10:55** (21s). GitHub check completion → merge approximately **15s**.
- PR #19 changed exactly `pwa/KB/Locations/content/P3 Test Lake.md` and `pwa/KB/kb.json`. No unexpected paths.
- New sandbox main squash commit `f8167b2167731cff50772debae413bf18e6c55ce`, commit time **09:11:09**. Main commit verified separately by GitHub API.
- Subsequent workflow **40909052560** ran **09:11:09–09:11:36**, event **`pull_request`** (not a GitHub Pages production release). Its successful completion must **not** be misrepresented as private hosted-byte verification or as D1 Live time.
- The original private Worker Cron remains `*/5 * * * *`, so its relevant wake times were **09:10:00** and **09:15:00**. PR #19 did not exist at 09:10:00 and was already merged by 09:11:10. Thus the 09:11 merge **cannot** be explained by the periodic 5-minute Cron alone. The enabled Durable Object watchdog is the only configured newly active progression path for that interval.
- During this test `D3_FAST_WATCHDOG_ENABLED=true`, `D3_FAST_WEBHOOK_ENABLED=false`, `D3_FAST_TRACE_ENABLED=false`. The separately created GitHub repository hook was inactive.

## What is and is not established

**Passed:** owner-observed private Live, confirmed exact approved GitHub changes, check-run success, precise PR-head and merge, and fast progression **without webhook delivery**. This is one real-provider positive test of watchdog-assisted processing and lost-event tolerance.

**Not yet established:** exact owner click timestamp; exact D1 Accepted, Verifying and Live timestamps; whether the observed 60–120s duration can be shortened below 60s; durable alarm behavior under dropped event/restart beyond this ordinary missing-hook case; public V3 host/PWA, public Pages CI/merge/deploy paths. No claim of production public SLA compliance.

**Next:** read-only D1 audit for the new operation `p3_3a45cec8-3838-4964-898e-24575a740588` using exact merge SHA, preserve all 4 prior Live receipts and existing public V2, then activate signed `check_run` receiver on private Worker with GitHub hook still inactive. Confirm unauthorized requests 401, then manually check Active on GitHub repository-only webhook, test fresh text-only publication, compare event-received path with watchdog-only baseline. No production workflow change or public publication authorized.

## Second owner-run private webhook-enabled publication (October 29, 2026)

Owner reports Save and Publish → Connection Status Live **129 seconds (2m09s)**, clicking Check publication status about every two seconds. **Merging** appeared longest, then **Checking**. These are owner-observed UI dwell impressions, not exact D1 transition durations.

- GitHub PR #20: https://github.com/ginosega/fishing-p3-sandbox/pull/20; D1 operation `p3_9be42fb6-9ceb-4b52-b5b8-4f7539a95a74`. Created **09:45:40 PDT**, merged **09:46:18 PDT** (38 seconds PR→merge). Exact head `fa4e00d83f0a19419aba8090ec4fbe7e823d9c3e`.
- Exact-head private PR run `40914738853` created **09:45:44 PDT**, completed success ~**09:46:03 PDT** (19s); CI end→merge ~15s.
- Subsequent run `40914825824` created **09:46:17 PDT**, completed ~**09:46:35 PDT**; GitHub identifies it as another `pull_request` validation, NOT a Pages/hosted verification.
- Private sandbox main merge commit `05d71a936a979610eae82907909d5599bcdee0a0`.
- Comparison: watchdog-only PR #19 created→merged 40s; webhook-enabled PR #20 created→merged 38s. One webhook-enabled test does **not demonstrate an end-to-end improvement**.
- The owner-observed end-to-end **129s exceeds 60s**. Need exact read-only D1 `p3_events` state transition times and a GitHub repository webhook Recent Deliveries response (HTTP 202 and `accepted` value) before attributing delays. Do not infer the webhook matched an operation merely because the PR merged.
- Next: query D1 events by exact operation ID using event_at Unix seconds and per-state `LEAD(event_at)-event_at`, without database mutation. Verify GitHub check_run completed delivery response `accepted:true/false` without copying signatures or secrets. Preserve all prior verified operation receipts.

The owner-approved future Connection Status automatic polling (~5 seconds while the panel is visible and a publication is pending, stopping in terminal states) is documented separately. UI polling is not a fix for backend publication latency.

## Exact D1 event audit for private PR #20 — owner supplied 2026-10-29

Read-only Wrangler query on remote `fishing-p3-sandbox` (`p3_events`, operation `p3_9be42fb6-9ceb-4b52-b5b8-4f7539a95a74`), success true, changes 0, rows_written 0, served_by_primary true.

| Durable state | D1 event_at (Unix seconds) | Local PDT | Seconds until next transition |
| --- | ---: | --- | ---: |
| Accepted | 1793292327 | 09:45:27 | 1 |
| Validating | 1793292328 | 09:45:28 | 13 |
| Checking | 1793292341 | 09:45:41 | 27 |
| Merging | 1793292368 | 09:46:08 | **78** |
| Deploying | 1793292446 | 09:47:26 | 0 (second-resolution) |
| Verifying | 1793292446 | 09:47:26 | 7 |
| Live | 1793292453 | 09:47:33 | terminal |

Total D1 Accepted→Live **126s** versus owner-observed Save→Live **129s** (~3s before Accepted). Merging occupies **78/126 = 61.9%** of server pipeline; Checking 27s (21.4%).

Independent GitHub PR #20 merged at **09:46:18**, only ~10s after entering Merging, but durable D1 did not enter Deploying until **09:47:26**, around **68s after the actual GitHub merge**. The intended 60-second exclusive D1 lease (`leaseSeconds=60`) plus its conservative `merge_attempted` write-ahead barrier is a strong candidate explanation: on an ambiguous post-merge receipt or provider read, a 60s lease expiration forces independent read-only reconciliation instead of replaying PUT /merge. **Audit transition rows do not prove which adapter call failed or precisely when the marker was set. Do not assert definitive cause without event/log evidence.**

GitHub repository webhook Recent Deliveries: HTTP **202**, body `{"ok":true,"accepted":false}`. This confirms a valid request was handled but was not a match to an *eligible Waiting/Checking* operation at handling time. It does **not** prove that signed event waking occurred. A webhook-only performance benefit is therefore unproven.

**Actionable next engineering hypothesis:** add a fast, independently verified read-only merged-PR reconciliation path for the *exact* marked operation, without waiting a full 60s after GitHub merge acknowledgement uncertainty; retain compare-and-swap guards, write-ahead safety, no repeat PUT /merge, exact SHA/base/tree/changed paths validation, and hosted proof before Live. Instrument redacted merge-attempt/ack/error/reconciliation timings; test acknowledged, ambiguous/lost ACK, concurrent wake, provider stale projection, forbidden replay, and terminal cases. Keep private webhook and public V2 untouched during source-only work. Measure again before claiming any 60s SLA.

## Third private publication #21: fast original-lease merge recovery deployed — owner audit October 29, 2026

Owner measured Save→Live **72 seconds** (versus 129s for PR #20). Read-only D1 query for operation `p3_fb8a59a5-5fe3-4dad-a468-96b8dd5706ec` succeeded: `served_by_primary=true`, `changes=0`, `rows_written=0`.

| State | Unix seconds | PDT | Duration |
| --- | ---: | --- | ---: |
| Accepted | 1793294717 | 10:25:17 | 1s |
| Validating | 1793294718 | 10:25:18 | 11s |
| Checking | 1793294729 | 10:25:29 | 36s |
| Merging | 1793294765 | 10:26:05 | 14s |
| Deploying | 1793294779 | 10:26:19 | 1s |
| Verifying | 1793294780 | 10:26:20 | 6s |
| Live | 1793294786 | 10:26:26 | terminal |

**Exact Accepted→Live was 69 seconds** versus 126s for previous run (57s faster); owner E2E 72s versus 129s (57s faster). Merging fell **78s→14s** (64s improvement, approximately 82%), while Checking grew **27s→36s** (+9s), Validating fell 13s→11s, Deploying grew 0s→1s, and Verifying fell 7s→6s. This validates elimination of the long after-merge gap, although these audit events do NOT by themselves prove which original-lease verification or ordinary merge result branch executed.

Independent GitHub PR #21: https://github.com/ginosega/fishing-p3-sandbox/pull/21. Created 10:25:29 PDT, merged **10:26:14 PDT**, merge commit `9df2d11cc7f8c93f3ffed8ea672a5e9dd918bbcd`, exact head `2303473640f5116ad8515de77068b91caa5c7cc7`. Only `pwa/KB/Locations/content/P3 Test Lake.md` and `pwa/KB/kb.json` changed.

- Initial exact-head validation workflow `40921201069`: created 10:25:33, check-run completed ~10:26:02 (provider check run `123614571641`), CI→D1 Checking exit ~3s. GitHub PR opened to merge 45s. D1 Merging entered 10:26:05, actual provider merge 10:26:14 (~9s), D1 Deploying 10:26:19 (~5s after merge, rather than prior ~68s).
- Second pull-request-triggered validation `40921306175`: created ~10:26:12, completed ~10:26:34 (check-run `123614943837`), after PR merge; **not** hosted verification. The workflow listens for `opened`, `synchronize`, `reopened`, and `ready_for_review`, causing this duplicate check. No evidence this second check was on the critical path.
- GitHub hook recent delivery: HTTP 202 body `{"ok":true,"accepted":false}`. The specific delivery's event timestamp/check-run identity is not supplied; the second run's post-merge notification would be ineligible by design. Do not infer the signed webhook accelerated CI progression from this.
- Read-only inspection of the initial workflow log showed the second checkout action (`ginosega/fishing` pinned immutable trusted validator) around **10:25:41.05–10:25:55.35 PDT**, approximately **14.3s**, a major part of the 36s Checking stage. Other components include GitHub job startup and npm dependency installation. The pinned trusted validation and same-repo full source verification cannot be weakened to gain speed.

**Next bottleneck / goal:** end-to-end 72s remains **12s above ≤60s target**. First evaluate safe CI checkout/performance improvements to the exact, pinned trusted validator fetching/installation, preserving the exact-head/base/tree/full-validator security requirements; also separately consider removing redundant `ready_for_review` validation (cost/noise, not primary critical path). Measure after independent CI/sandbox tests; do not claim public V3 SLA compliance from private sandbox timing.

## CI optimization — vetted private-sandbox workflow and full source benchmark (2026-10-29)

**Result:** Private sandbox's exact-head validation workflow optimized with an immutable-SHA pinned, Git blob-filtered sparse checkout of the full *required module graph*, `pwa/contracts`, `pwa/src`, `pwa/tools`, package.json and the locked package-lock.json, and `experiments/p3/preview/tools/validate-sandbox-head.mjs`. GitHub PR head/base ancestry, trusted commit identity, locked `npm ci` and complete canonical source-inventory validation are unchanged. The redundant `ready_for_review` event is removed; `opened`, `synchronize` and `reopened` continue to validate every changed content head. No Worker or public v2 deployment.

- Workflow infrastructure PR #22 https://github.com/ginosega/fishing-p3-sandbox/pull/22 merged after existing infrastructure lane passed, main SHA `9f267ad09544b948b0e57d5be42df0bcc91ba19b`.
- First proof PR #23 (synthetic KB-only comment, NOT MERGED) exposed missing `pwa/contracts/schema.json` import under the sparse checkout; test failed closed. Fix infrastructure PR #24 https://github.com/ginosega/fishing-p3-sandbox/pull/24 merged after infrastructure lane passed, main SHA `e93589414fee07ad126b3114e2f97679154964e1`. Added the **same pinned revision's** contracts folder to checkout; no validator logic altered.
- Synthetic KB-only benchmark PR #25 https://github.com/ginosega/fishing-p3-sandbox/pull/25 validated the *actual* content lane with new workflow, **passed** https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40924064274, and was CLOSED WITHOUT MERGE. No benchmark fixture publication.
- Previous ordinary publisher PR #21 check run https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40921201069 completed **~30 seconds** (17:25:33–17:26:03 UTC). Pinned trusted GitHub checkout phase ~17:25:40.75–17:25:56.02 UTC (~15.3s), of which source repository fetch ~14.3s.
- Optimized proof run #40924064274 completed **~14 seconds** (17:43:38–17:43:52 UTC). Git filtered sparse clone phase ~17:43:44.67–17:43:45.57 UTC (~0.9s). Both passed full unaltered canonical validation, including Git identity/ancestry/diff, same exact pinned trusted validator SHA and `npm ci` from trusted lockfile. On proof PR, canonical inventory passed (`gear=1`, `kb=1`, `catches=0`, 4 files).
- **Observed gain:** ~16s on whole CI workflow, ~14.4s on trusted checkout. This is one standalone proof run, not yet replicated over multiple actual user publications; runner/network variance can affect future performance. User's last Save→Live was 72s; subtracting 16s **hypothetically** gives 56s, not evidence of compliant public ≤60s SLA.
- **Next:** one normal owner-authenticated synthetic P3 Test Lake publication in private pilot; measure user click→Live and read-only D1 state transition audit. Verify hosted bytes, exact PR SHA, Webhook Recent Deliveries `accepted` separately. Do not change public V2 or infer public V3 rollout readiness.

## First measured ≤60-second owner publication — sandbox PR #26 (October 29, 2026)

**Owner-measured result:** Save & Publish → Connection Status **Live in 59 seconds**, the first observed private-sandbox run meeting the owner's normal-operation **≤60-second** target. The owner also reports GitHub webhook Recent Deliveries **HTTP 202** and response `{"ok":true,"accepted":true}`. The signed GitHub check webhook matched an eligible Checking operation and armed its named-operation watchdog (not a claim that this notification itself proved CI or caused the merge).

**Independent GitHub evidence:** Sandbox content PR #26 https://github.com/ginosega/fishing-p3-sandbox/pull/26; operation `p3_23bf8ff9-c95b-40ba-9c1d-b4463b2e6489`; head `3591e7605090b08c8b4b717fe0faca9392320a5d`; base `e93589414fee07ad126b3114e2f97679154964e1`; exact squash merge/main `45f3d5da6aa797d01be61b3078585ea4449bcf91`. Only `pwa/KB/kb.json` and `pwa/KB/Locations/content/P3 Test Lake.md` changed.

| Milestone | 2026-10-29 PDT | Delta |
| --- | --- | --- |
| PR #26 created | 10:47:56 | – |
| Workflow created | 10:48:01 | +5s from PR |
| Check run started | 10:48:04 | +3s |
| Exact-head check run completed success | 10:48:13 | 9s check duration; 12s workflow end-to-end |
| GitHub PR merged | 10:48:27 | 14s after CI workflow completed; 31s PR→merge |

- Initial optimized validation workflow [run #40924758753](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40924758753) succeeded, created 17:48:01Z, completed 17:48:13Z. Single `validate-sandbox-head` success check-run ID `123627179179`, GitHub Actions App ID `15368`. No duplicate post-merge ready-for-review run appeared for this publication.
- Compared with the pre-optimization run PR #21: workflow 30s→12s; PR creation→merge 45s→31s. Owner-observed Save→Live 72s→59s (13 seconds faster). The new E2E measurement is one pass with a **1-second margin**; private sandbox evidence cannot establish a reliable production-public-site SLA.
- D1 transition audit for operation #26 has **not yet been supplied**. Exact stage durations, durable independent hosted-release verification time, and original-lease merge branch usage require primary read-only D1 evidence. GitHub PR merge and UI Live alone cannot substitute for the underlying complete D1/hosted verification audit.
- Next steps: request one read-only `p3_events` audit for #26 to reconcile 59s, confirm exact D1 Live and post-merge dwell. Add a small statistically meaningful repeat-sample criterion with no unauthorized self-publishing; retain disabled/public-V2 invariants and address upcoming Connection Status auto-poll approved requirement separately. Do not claim V3 cutover complete.
