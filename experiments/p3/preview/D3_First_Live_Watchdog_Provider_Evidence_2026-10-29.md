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
