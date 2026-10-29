# FISH118 D3 — completed publishing-latency investigation and ranked recommendations

**Investigation date:** October 28, 2026 PDT. **Status:** source-only, no public routing, GitHub main writer, or R2 billing change. This is the completed **historical/code-path investigation**, NOT proof of a newly optimized 60s V3 end-to-end run. V3 public Save-and-Publish does not yet exist; a full click-to-public empirical baseline cannot truthfully be reconstructed.

## Executive decisions

1. **Do not activate R2.** Removing the median 13s Pages deploy action in isolation still leaves **73–142s (median 90s)** from the observed main-workflow creation to hosted proof: **zero of nine samples** would meet 60s. This exact same-run counterfactual keeps all other stages fixed. Therefore R2/D1 storage alone cannot solve the problem.
2. **Fix slow orchestration first.** The actual *private-sandbox* Gear #17 / KB #18 PRs took 596 / 602s PR-created-to-merge, of which 547 / 577s were **after** the initial CI workflow completed. This includes scheduled processing and, for KB, interrupted-merge recovery, not simply "GitHub CI was slow." The scheduler uses a one-transition-per-Cron-tick state machine with five-minute Cron as the primary trigger; a 60s SLA requires event-driven progression and Cron only for recovery.
3. **PR-side latency is a separate hard constraint.** For six real public PRs, PR creation→merge measured **58, 62, 62, 68, 92, 98s**; five of six already exceed 60s **before** any hosting and before the owner's click-to-PR preparation. Merely changing Pages to D1/R2 cannot meet V3-SAVE-09.
4. **The fast Pages pipeline is not only the Pages API call.** Nine valid content pushes took **85–183s, median 100s** from Actions creation to independently hosted verification. PR CI was 42–80s (median 47s), and 6 PR-created-to-public intervals 150–249s (median 180s). The detailed reproducible source is the [baseline fixture](fixtures/publishing-stage-baseline-2026-10.json) and its Node regression.
5. **Keep post-merge source identity correct.** \`pwa/tools/build.mjs\` embeds the actual main commit's \`--source-revision\` into the release ID, manifest, content paths and release pointer. A pre-merge PR-head build does **not** have the same identity as the merged main commit. Dropping the main rebuild by reusing the PR artifact unmodified would break the documented release-integrity guard. Treat any PR-artifact-reuse design as a separately proven integrity transformation, not a trivial duplicate-step removal.

## Sources, populations and metric definitions

- **Public cohort A**: nine successful main-push production content-only runs #491, #495, #500, #502, #503, #510, #512, #517 and #520 (Oct 5–15, 2026). GitHub Actions REST: \`created_at\` to \`Verify hosted bytes and release identity\` completed timestamp; REST job/step timestamps for subintervals. **Six** were merged PRs; **three** were direct pushes.
- **Public cohort B**: six merged PRs #221, #223, #225, #226, #228 and #230, each joined to its historical PR-CI workflow and main-push hosted-proof time. \`updated_at\` is the CI workflow's completion approximation, **not** the exact moment the required check became valid. Human-triggered merge intervals are not fully autonomous.
- **Private cohort C**: sandbox Gear PR #17 and KB PR #18, Oct 27. Private D3 hosted-release identity is NOT the public \`ginosega/fishing\` release. KB needed read-only no-repeat interrupted-merge recovery, so its 577s CI-done-to-merge interval cannot all be attributed to normal scheduling.
- **E2E missing**: actual owner Save click, request/CSRF, durable Accepted acknowledgment, D1 lease/transition and individual API spans, GitHub PR-preparation duration, dispatch gaps, final Live D1 write, browser status refresh. Existing \`p3_events.event_at\` has only integer-second event timestamps, and GitHub/Cloudflare/client clocks cannot be naïvely subtracted as one monotonic timer.
- This historical cohort is a **performance diagnostic**; it is not a representative prospective V3 sample of exact same operations across every candidate. Numbers below labeled "targets" or "models" are NOT achieved measurements.

## Public cohort A — nonoverlapping job decomposition

| Phase | Median | Range | Notes |
| --- | ---: | ---: | --- |
| Main-push Actions created → proof complete | **100s** | 85–183s | Includes runner queues, all jobs and hosted verification |
| Initial queue | 2s | 2–69s | Outlier #491 consumed 69s |
| \`classify\` runner job | 9s | 7–11s | Actual classification shell logic is near-zero; separate checkout/runner dominates |
| Job handoff classify→validation | 2s | 1–3s | Serial dependency |
| \`validate-content\` runner job | 32s | 28–45s | Node setup, locked deps, build, verify, upload artifact |
| ↳ Nested build + verify step | 11s | 9–13s | MUST NOT add to containing 32s job |
| Handoff validation→deployment | 4s | 3–4s | Serial dependency |
| \`deploy-content\` job start→hosted proof | 48s | 40–138s | Startup, transfer, Pages, proof |
| ↳ Download artifact | 5s | 3–6s | Nested |
| ↳ Upload Pages artifact | 6s | 4–15s | Nested; not the same as prior build artifact |
| ↳ \`deploy-pages\` actual action | **13s** | 6–93s | Long-tail #512, 93s |
| ↳ All 577+ hosted-byte/release verification | 10s | 7–22s | Nested, required independent verification |

Medians are **not additive**, except for single-sample, nonoverlapping intervals. The 577-file public proof fetches hosted assets 12 at a time in \`pwa/tools/verify-hosted-fast.mjs\`, followed by release pointer and manifest linkage assertions.

## Six public PRs: minimum GitHub-side budget

| PR | PR→CI complete | CI complete→merge | Merge→hosted proof | PR→hosted proof |
| --- | ---: | ---: | ---: | ---: |
| #221 | 80s | 12s | 98s | 190s |
| #223 | 54s | 14s | 102s | 170s |
| #225 | 48s | 50s | 102s | 200s |
| #226 | 42s | 20s | 187s | 249s |
| #228 | 46s | 16s | 88s | 150s |
| #230 | 46s | 12s | 102s | 160s |

- PR→merge: **58–98s, median 65s**. Five out of six over 60s, even with hypothetical instantaneous hosting.
- PR→CI completed: **42–80s, median 47s**.
- PR creation→hosted proof: **150–249s, median 180s** (no Save-click/pre-PR time).
- Actual private D3 PR-to-merge 596/602s is **not** comparable to these public cohorts. It exposes coordinator/gap/recovery behavior, rather than a new long GitHub CI baseline.

## Stage-removal counterfactuals (exact historical sample arithmetic, not deployable designs)

- Set **Pages \`deploy-pages\` action alone to 0s**, preserving all other measured intervals: **remaining 73–142s, median 90s; 0/9 pass** the 60s release-only sub-budget. Thus a fast object/DB upload replacement for only that action fails.
- Set **post-merge validate-content job alone to 0s** while preserving all else: **remaining 56–154s, median 67s; only 2/9 pass**. Also UNSAFE unmodified because main release/source identity differs from PR artifact identity.
- Set **both** job and deploy action to 0s, all else unchanged: **remaining 44–110s, median 54s; only 6/9 pass**. This fantasy still excludes owner click, PR, CI and merge. Queue/verification tails persist.
- These zero-duration counterfactuals are **optimistic lower bounds for their specific modifications**, not forecasted optimized pipeline latencies. They demonstrate exactly why the SLA requires a critical-path redesign, not one swapped step.

## Ranked recommendations and forecast evaluation

### P0 — instrument real stages and define the critical path (do now, no public behavior change)
- Added **default-off** \`src/d3-publishing-span-recorder.mjs\` with fixed allowlisted event names, per-invocation \`performance.now()\` durations, UTC markers, redacted success/refusal, optional sink, failure isolation and tests. Threaded optional \`measure\` through the source-only owner operations API, D3 sandbox runner and local publication lifecycle. No new route, provider subscription, Worker deployment or D1 write.
- In a future owner-approved pilot, activate **only for synthetic sandbox operations**, persist short spans and millisecond UTC state boundaries, and collect one browser monotonic click→receipt and click→public proof timeline. Correlate GitHub check run IDs and SHA, D1 accepted/lease/Live, Pages source revision and byte proof, and child host requests. No secrets, file contents, credentials or token headers. Server timestamps across clocks are approximate; client same-clock elapsed is SLA authority.
- Benefit **0s** itself; resolves unmeasured stages and makes every later performance prediction falsifiable. Failure to capture complete evidence invalidates a benchmark, **not** the content operation.

### P1 — replace five-minute, one-state-per-tick primary Cron with event-driven progression (first active orchestration fix)
- Immediately run/continue allowed transient stages after Accepted, record leases/idempotency/CAS; on exact-head successful GitHub CI, use a **signed, authenticated webhook/callback or equivalently reliable event** to claim operation and advance guarded merge and verified hosting. Cron remains an independent durable **recovery** backstop, not a primary SLA path. The HTTP Worker's \`waitUntil\` lifetime has a 30s limit after response, so do not rely on unbounded background polling. A one-minute Cron is supported but still cannot guarantee ≤60s by itself.
- The private observed delays after first CI were **547s and 577s**. *What fraction is ordinary polling and what fraction is actual recovery is not measured.* Do **not** promise 550+s routine savings from two samples. Engineering acceptance target: normal **check success→merge attempt ≤5–10s**, without duplicate merge, while handling burst/webhook loss and read-only uncertain-outcome recovery. Need provider test to prove.
- Risks: forged or replayed webhook, missing/duplicated events, stale main/check, HTTP worker lifetime, plan quotas. Mitigations: GitHub \`X-Hub-Signature-256\` raw-body verification, repo/App/installation ID and exact SHA validation, fresh independent GitHub check GET, D1 lease/CAS, write-ahead merge marker, immutable receipt and recovery Cron. Any webhook setup/credential changes need separate consequential approval.

### P2 — streamline **protected PR** validation without reducing its coverage (parallel early feasibility)
- The original PR CI workflow has its own \`classify\` and \`validate-content\` jobs and a separate \`fishing-merge-ready\` required check; build is about **9–13s**, while total CI completion is **42–80s**. Evaluate combining decision and validation inside one read-only required-check job named **exactly** \`fishing-merge-ready\`, while retaining full-app and docs branch distinctions and full existing validation. Keep current required check source identity and ruleset; don't rename or bypass branch protection.
- **Engineering target only:** reduce normal content PR CI median **47s → 25–35s** (12–22s saving), by removing serial runner/check handoffs. The lower private 22s CI run shows that a smaller test suite can be quick but is **not equivalent coverage**. Mandatory benchmark the actual public-equivalent validation with identical rules and content changes; do not claim this as achieved savings.
- Risks: accidentally selecting a smaller test lane, weakened required check, PR workflow gaining public deploy privileges, missing main race. Use separate read-only PR job, isolated main-only deployment permissions, adversarial path classification and exact SHA/current-main checks.

### P3 — collapse redundant **main-push** job handoffs while preserving the main SHA rebuild (first hosting workflow change)
- For a content-only **main** push, move classification, canonical validation+build, Pages artifact upload, exact-current-main guard, deployment, and hosted verification into one explicitly main-only protected job on a trusted SHA. Eliminate separate main \`classify\` and \`validate-content\` runner boundaries and intermediate generic \`upload-artifact → download-artifact\`, unnecessary repeat checkout/Node. Preserve \`--source-revision=$GITHUB_SHA\`, locked validation, Pages environment restrictions and independent hosted proof. PR jobs remain read-only, never \`pages:write\`.
- Measured avoidable components include 7–11s classification runner (classification shell itself essentially zero), 1–3s handoff to validation, 3–4s handoff to deployment, 3–6s artifact download plus extra job checkout/setup time. Some work overlaps with necessary first-runner startup: **do not add these blindly**.
- **Model, not actual timing:** a typical **15–35s** release-only saving, moving median **100s toward ~65–85s**, still subject to 69s queue / 93s Pages tails. Standalone P3 cannot meet the 60s SLA, especially after adding GitHub PR/merge. Deploy a protected main version only under separate approval; verify safe rollback.

### P4 — preserve full-hosted proof but measure critical first-byte versus complete 577-file audit
- Current verification is **7–22s median 10s**, including complete remote checks. Instrument changed Gear/KB/Catches JSON and Markdown, \`release.json\`, manifest SHA, immutable release and all-file audit separately. A critical-path proof of the exact changed bytes and canonical release identity may be faster, but no release may claim complete offline/library coherence without adequate proof.
- Potential single-digit seconds improvement (absolute maximum bounded by 7–22s observed verification step), **not** a 60s solution alone. Prefer retaining full proof until an explicit source-integrity threat review and comprehensive after-release audit can guarantee all referenced assets. Avoid 577 individual requests in every Save if identical static assets can be attested through a complete immutable bundle, but benchmark correctness and mixed-release caching first.
- Risk: falsely early Live, stale SW/cache, missing assets, a release pointer visible before all files. Guard fail-closed on manifest, file digests, exact source revision and rollback.

### P5 — evaluate a **new D1-only immutable content delivery** ONLY after P1+P2+P3 measurements
- D1 would replace the existing entire post-merge content release lane **only** if we build versioned coherent immutable releases with an atomic D1 pointer and independent user-retrievable exact main-commit bytes. The potential upper opportunity is the **85–183s** existing main-release interval, *not merely the 13s Pages action*. New D1 publication/HTTP propagation latency is **unmeasured**; a proposed 1–10s is an experimental **target**, not evidence.
- Important feasibility boundary: current public app and SW serve \`https://ginosega.github.io/fishing/\`, while the private owner Worker is on a \`.workers.dev\` origin. Serving content from D1 is **not a drop-in replacement** for GitHub Pages under that origin. It requires deliberate app loading/URL/scope/cache/origin choices, or a separately approved hosting/routing change. Preserve verified full release snapshots and old-version reads for offline rollback; don't conflate an owner-private test path with anonymous canonical Live.
- Even instantaneous D1 public delivery still leaves the historical **PR→merge median 65s plus unknown click→PR**, so P1/P2 are prerequisites.
- Risks: new storage authority, D1 database/row/size limits, release coherence across 577 assets, outage/recovery, workers subrequest limits, same-origin authentication and PWA SW scope; requires a separately approved architecture gate.

### P6 — retain R2 as optional later media capability; don't subscribe now
- R2's value is immutable object storage and large media delivery; current text-only Save target can be investigated with existing D1. Current Cloudflare account R2 is disabled (Wrangler 10042) and subscription activation needs owner approval.
- Any object-store change by itself cannot shorten required GitHub CI/merge. No empirical R2 E2E gain exists, so no quantitative justification for paid onboarding.

### Defer — reusing PR build artifact as final main release
- Tempting theoretical savings from avoiding 28–45s main validation/build job, but the current release ID **hashes \`sourceRevision\`**, tied to the actual main commit, plus code/content/assets. Raw PR artifacts would falsely claim the PR head as the canonical main release.
- Could be designed with authenticated artifact provenance and a source-tree/commit identity rebind, recalculating every derived SHA and immutable folder name. This has significant reproducibility, supply-chain and cache-integrity risks; not recommended as the first optimization.
- Absolutely do not weaken exact-head CI, skip main SHA guard, force push, bypass protected merge, treat \`Accepted\` as Live or eliminate independent public proof.

## Quantitative outcome / decision framework

| Candidate | Measured baseline | Target / model (NOT measured) | Expected standalone 60s result |
| --- | --- | --- | --- |
| Remove only Pages deploy call | 100s median main→proof | **90s median**, 73–142s using exact per-run zero-call counterfactual | **0/9 pass** |
| P1 event-driven D3 coordinator | Private 547/577s initial CI-done→merge | Target trigger→merge attempt ≤5–10s; savings unquantified due KB recovery | Needed, insufficient alone |
| P2 compact protected PR checks | 47s median PR→CI completed | Target 25–35s | Helps but no proof |
| P3 one main content-release job | 100s median postmain | Model 65–85s median (15–35s saving) | Insufficient alone |
| P4 optimize hosted proof | 10s median | Test small single-digit savings | Insufficient alone |
| P5 alternate D1 public delivery | 85–183s postmain | **Unknown new latency**; target 1–10s in eventual live pilot | No, if PR→merge remains ~65s |
| P6 R2 storage for text | No existing R2 timing | Unknown until enabled + public integrated test | No standalone solution |

The **end-to-end 60,000ms gate is conjunctive**: owner click→PR preparation + exact required CI + guarded merge + verified published bytes + status must all fit and stay under 60s for every normal acceptance run. Historical public PR creation→proof median **180s**, but pre-PR and owner timing are **unknown**. Do not sum cohort medians or assume extreme optimistic targets combine reliably.

### Required next empirical gate before an architecture choice

Run **actual 9 representative text-only normal Save operations**: 3 Gear, 3 KB, 3 Catch, on the intended protected branch/hosting path (after Catch D4 integration); additionally test CI queue outliers, idempotent retries, replays, concurrent edits and interrupted merge. For baseline and each candidate collect a single browser monotonic click→externally independently verified canonical public release, plus safely correlated local same-clock Worker spans, PR/Actions run/check status, merged SHA, exact hosted hash/manifest, durable terminal state, and no sensitive context. Record **each** full result, min/median/range and failures (p95 only for sufficiently sized samples). A median under 60s is NOT enough: every normal acceptance sample ≤60s, with provider-outage exceptions requiring independent evidence.

The existing user installation's public V2, private D2/D3 durable sandbox successes, GitHub rulesets and Pages release remain unchanged. This investigation authorizes **no public deployment, storage subscription, permission broadening or route change**.
