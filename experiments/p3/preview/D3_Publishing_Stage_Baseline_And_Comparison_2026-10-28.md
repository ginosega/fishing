# FISH118 / V3-SAVE-09 — measured publishing baseline and comparison protocol

**Compiled:** October 28, 2026 PDT, from the real historical GitHub
Actions run/job/step timestamps, canonical GitHub pull requests, D3 private
sandbox PRs, and [earlier D3 evidence](D3_Acceptance_And_60s_Delivery_Evidence_2026-10-28.md).

**Key distinction:** This is a **partial operational baseline**, NOT a
completed one-clock owner Save-click → independently verified *public*
V3 Live benchmark. No authorized public V3 GitHub writer has been activated.
Do not add dissimilar clocks and call the result a measured E2E time.

## Cohort A — existing publicly hosted content-only main-push workflow

Nine successful `ginosega/fishing` **content-only** production pushes:
#491, #495, #500, #502, #503, #510, #512, #517, #520, run on Oct 5–15,
2026. Main-push Actions `created_at` to the terminal timestamp of
`Verify hosted bytes and release identity`. **After** merge/push;
does not include any prior owner action, PR validation, protected merge,
or client refresh. Three sample pushes were direct commits (no identifiable
PR): #491, #502, #503. Six resulted from merged PRs: #221, #223, #225,
#226, #228, #230. Do NOT represent these as nine PR-based E2E flows.

| Stage or interval (inclusive of its own subprocesses) | Min | Median | Max | Sample size |
| --- | ---: | ---: | ---: | ---: |
| Main-push Actions created → successful hosted proof | 85s | **100s** | 183s | 9 |
| Actions creation → classify job starts (queue) | 2s | 2s | 69s | 9 |
| Classify job, including checkout and lane choice | 7s | 9s | 11s | 9 |
| Classify end → validation job start | 1s | 2s | 3s | 9 |
| **Validate-content job**, including setup/install/build/artifact | 28s | **32s** | 45s | 9 |
| Nested **build and verify** step only | 9s | 11s | 13s | 9 |
| Validation job end → deploy-content job start | 3s | 4s | 4s | 9 |
| Deploy-content job start → hosted-proof step end | 40s | **48s** | 138s | 9 |
| Nested artifact download step | 3s | 5s | 6s | 9 |
| Nested Pages artifact upload step | 4s | 6s | 15s | 9 |
| Nested **deploy-pages** action only | 6s | **13s** | 93s | 9 |
| Nested **independent hosted-byte/release verification** | 7s | **10s** | 22s | 9 |

**Do not add medians or nested steps:** validation job already includes
its build, deployment job already includes Pages/verification. The
release interval includes classify, scheduling and both jobs.

| Main-push run | Source PR | Main Actions created → hosted proof | Validate job | Deploy-pages action | Hosted verify step |
| --- | --- | ---: | ---: | ---: | ---: |
| [#491](https://github.com/ginosega/fishing/actions/runs/37255448422) | direct push | 164s | 32s | 22s | 7s |
| [#495](https://github.com/ginosega/fishing/actions/runs/37887329753) | #221 | 95s | 28s | 7s | 12s |
| [#500](https://github.com/ginosega/fishing/actions/runs/37890243751) | #223 | 99s | 39s | 6s | 12s |
| [#502](https://github.com/ginosega/fishing/actions/runs/37890919676) | direct push | 138s | 32s | 13s | 22s |
| [#503](https://github.com/ginosega/fishing/actions/runs/37891311432) | direct push | 117s | 45s | 22s | 8s |
| [#510](https://github.com/ginosega/fishing/actions/runs/37947602051) | #225 | 100s | 36s | 13s | 10s |
| [#512](https://github.com/ginosega/fishing/actions/runs/37953015607) | #226 | 183s | 29s | 93s | 17s |
| [#517](https://github.com/ginosega/fishing/actions/runs/38207507318) | #228 | 85s | 29s | 12s | 7s |
| [#520](https://github.com/ginosega/fishing/actions/runs/38686171921) | #230 | 99s | 35s | 13s | 8s |

The GitHub Actions workflow
[`.github/workflows/fishing-production.yml`](https://github.com/ginosega/fishing/blob/main/.github/workflows/fishing-production.yml)
explicitly **rebuilds and revalidates after main is merged**, then
downloads its build artifact, uploads a Pages artifact, guards current
main, invokes Pages deployment and verifies public hosted bytes/release.
Thus the apparent "Pages bottleneck" is mostly the **entire post-merge
release lane**, not necessarily the `deploy-pages` API step itself.
On the median sample, deployment action is only 13s within a 100s
post-push interval. Removing only that action would not meet 60s.

## Cohort B — historical production PR creation to public proof

For the six Cohort A runs which were actual **merged public PRs**,
`pull_request.created_at` → successful PR workflow `updated_at`
(last-run timestamp, not precise instant the required check went green),
then actual `merged_at`, then main-push-to-hosted proof.

| Public PR | PR → CI workflow complete | CI workflow complete → merge | Merge → public hosted proof | PR created → hosted proof |
| --- | ---: | ---: | ---: | ---: |
| [#221](https://github.com/ginosega/fishing/pull/221) | 80s | 12s | 98s | **190s** |
| [#223](https://github.com/ginosega/fishing/pull/223) | 54s | 14s | 102s | **170s** |
| [#225](https://github.com/ginosega/fishing/pull/225) | 48s | 50s | 102s | **200s** |
| [#226](https://github.com/ginosega/fishing/pull/226) | 42s | 20s | 187s | **249s** |
| [#228](https://github.com/ginosega/fishing/pull/228) | 46s | 16s | 88s | **150s** |
| [#230](https://github.com/ginosega/fishing/pull/230) | 46s | 12s | 102s | **160s** |

Summary: **150–249s, median 180s PR-created → hosted proof**, for
six historically manually managed public PRs. PR CI-complete interval:
42–80s, median 47s. CI-complete → merge: 12–50s, median 15s.
These six public PRs are useful **full GitHub PR-to-host** observations,
but the process had human interactions, is not the current automatic
V3 Save flow, and starts only once a PR exists. A true click-to-proof
baseline remains missing.

## Cohort C — two real private D3 sandbox publications, NOT public Live

Private sandbox Gear [PR #17](https://github.com/ginosega/fishing-p3-sandbox/pull/17):
created Oct 27 19:00:42Z; initial successful CI workflow
[#40565214328](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40565214328)
created 19:00:45Z / completed 19:01:31Z; PR merged 19:10:38Z.
**PR-created → merge 596s; CI-complete → merge 547s.**

Private sandbox KB [PR #18](https://github.com/ginosega/fishing-p3-sandbox/pull/18):
created Oct 27 23:15:41Z; initial successful CI
[#40600896518](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40600896518)
created 23:15:44Z / completed 23:16:06Z; PR merged 23:25:43Z.
**PR-created → merge 602s; CI-complete → merge 577s.**
The KB run required separately verified no-repeat interrupted-merge
recovery; cannot assume all elapsed time is ordinary Cron delay.

These are **two private, scheduled/recovered D3 sample flows**, with
different PR validation and hosting from the public production cohort.
Both eventually reached private sandbox verified Live, but no
one-clock Save-click/Accepted/hosted-proof timestamps exist. Existing
D1 audit is useful for event ordering and identity, not millisecond
stage-level latency. An every-five-minute scheduled stepper can
introduce substantial normal idle time; attribution of specific delays
requires Worker/D1 telemetry rather than guesswork.

## Complete proposed V3 stage map and current timing coverage

| Phase | Stages (retain independent security/identity guarantees) | Evidence |
| --- | --- | --- |
| A Client | Save click; serialize change/validate; owner session/CSRF; browser → Worker request | **NO timed real E2E samples** |
| B Accept | Verify owner; parse/reject; fetch canonical GitHub source; validate conflict/content; D1 idempotency snapshot/Accepted receipt; browser response | **NO per-stage latency**; D1 state proof only |
| C Dispatch | Wait/claim lease; Accepted → Validating; durable retry and coordinator | **NO attributable interval**; five-minute Cron known |
| D Prepare PR | GitHub read/token; fetch base/current content; revalidate; write blob(s), tree, commit, branch, durable branch receipt, draft PR | **Partial PR created timestamp only**; no full preparation duration |
| E Exact-head checks | GitHub Actions queue, canonical PR build/validation, check observation; Checking → Merging | **YES PR CI workflow timing** for 6 public/2 private samples; no callback/poll wait partition |
| F Merge | Recheck branch rules, main/head/CI; D1 write-ahead marker; protected normal merge; durable merge receipt, independent merge-status/tree proof | **YES merge timestamp**; NO per-call/lease timing |
| G Release | Post-main classify/queue, production validation, artifact transfer, Pages deploy, verify hosted SHA/release | **YES 9 detailed main-push samples**; 0/9 ≤60s even when only this portion is counted |
| H Terminal proof | D1 Deploying → Verifying → Live once all canonical hosted paths and release are proven | D1 private terminal **YES**, but **NO millisecond or total elapsed measurements** |
| I UX | Browser status poll/notification, owner visibility, cross-device status restore, installed PWA refresh | **NO correlated stage latency**; private browser functional acceptance only |

## Mandatory comparison before adopting architectural changes

For **current path**, **optimized Pages lane**, and **D1-only** or
**R2 + D1 versioned-content** candidate, use one fixed stage schema:

- One monotonic client clock from *actual Save-and-Publish click* to
  independent authenticated/anonymous-as-appropriate **canonical public
  byte+release+commit proof**. Preserve server UTC events for
  cross-service correlation, but do not subtract unrelated system clocks
  as if they are a monotonic one-clock measurement.
- Record idempotent operation ID, content domain and byte count,
  candidate type, GitHub PR/head/CI/merge SHA, verified release ID,
  stage timestamps and provider request spans **without sensitive
  tokens, cookies, payloads, CSRF, or identity-bearing URLs**.
- Separately time Accept (including GitHub source validation), dispatch
  wait, PR preparation, CI queue+validation, CI observation wait,
  merge authorization+API, host staging/deploy, public propagation,
  independent byte proof and UI update. Uncertain writes are
  read-only reconciled; never blindly replayed.
- For each candidate collect at least **three** normal representative
  text-only saves in **each** of Gear, KB and Catch, ideally on a
  controlled production-equivalent path with the same protected branch
  rules. Record min/median/max, p95 when sample count is meaningful,
  failures and a stacked critical path. A synthetic storage microbenchmark
  does **not** substitute for real canonical Save-to-public.
- Compare **stage savings** and **total end-to-end** against an equivalent
  current-path run (not older direct pushes and private sandbox mixed
  together). New provider/storage cost, write throughput, caching
  coherence, security and rollback are independent acceptance dimensions.
  The firm **60,000ms** click-to-public-proof requirement applies
  to every normal-operation acceptance run, not average/median alone.

**Decision:** Freeze R2 activation, public routing and D1-only preference
until the missing **real click/accept/PR/merge/proof timing** is observed
and both fast delivery alternatives can be measured against these
baseline cohorts. Optimize the duplicated post-merge build and scheduled
idle before attributing the entire performance problem to R2/Pages.
