# FISH118 V3-SAVE-09 — P1/P2/P3 implementation, tests and isolated rollout gate

**Date:** October 28, 2026 PDT. **Branch:** `feature/fish118-p3-mock-publisher`, open draft PR #263.
**Scope:** P1 event-driven lost-event-safe publication, P2 compact exact-head protected PR CI, P3 single-job public Pages content release.

**DO NOT DEPLOY THIS DOCUMENT AS CONFIG.** All changes below are unmerged in
a draft PR, and there is NO R2 requirement, no production routing change, no
public V3 authoring, no public main GitHub writer, no forced merge, and no
new Cloudflare resource provisioned by this source work.

## Completed source implementation

### P1 — Lost GitHub event does not stall a sandbox operation forever

Modules:
- `src/d3-fast-check-webhook.mjs`: HMAC-SHA256 verify **raw** webhook
  body; 64 KiB bound; exact private repository ID, exact GitHub Actions
  App ID, exact check-run name/status/head; optional installation identity
  (repository webhooks can omit it). A webhook is NEVER success/merge proof.
- `src/d1-operation-store.mjs`: new read-only `findCheckingByHead`
  strictly owner/repo/head/Checking scoped, primary read and ambiguity
  rejection. **No schema migration or new D1 table.**
- `src/d3-fast-watchdog.mjs`: bounded one-step progress; durable
  per-operation alarm scheduling; 8.5-second initial checking rechecks
  with escalating backoff after 5/20 stalls; read-only-only reconciliation
  of ambiguous merges, no blind POST /merge retry.
- `src/d3-fast-wake-do.mjs`: a real named Cloudflare Durable Object
  alarm-compatible class, packaged with the owner Worker but default-OFF
  and NOT yet bound/provisioned. Internal-only stub `fetch('/arm')`;
  no public browser endpoint. Duplicate notifications keep earliest
  alarm, alarm handlers always schedule the *next* wake even when their
  current alarm is visible, and the stall count is durable.
- `src/d3-gated-auth-gateway.mjs` / `src/d3-guarded-operations-api.mjs`:
  after D1 Accepted or original idempotency-key recovery, require
  successful alarm acknowledgment when fast mode enabled. Signed webhook
  `POST /__d3_fast__/github-check` is **404 unless both** separate
  enablement flags are set and the existing strict sandbox readiness
  predicate passes; it never authorizes a merge. Owner-only source
  and public V2 paths retain their original behavior.
- `src/d3-owner-runtime.mjs`: exports `D3FastWakeAlarm` for a **future**
  SQLite DO migration. This does not create a namespace by itself.
- Optional server spans gated by `D3_FAST_TRACE_ENABLED=true`: redacted
  one-clock operation/CI/merge/host latency without cookies, secrets or
  request bodies. No new DB trace schema.

A **separate repository-level** `check_run` webhook is preferred over
editing the existing GitHub App's webhook subscription. No additional
GitHub App permissions are required for this route. To receive Check Runs
events on a repo webhook, select only completed check events. See
https://docs.github.com/en/webhooks/webhook-events-and-payloads .

**Lost event detection:** the operation's D1 Accepted receipt arms the
alarm immediately, even if a GitHub check webhook never arrives. On
Checking it independently queries GitHub every 8.5s initially. A signed
completed webhook advances its alarm sooner; duplicates are harmless.
The original Cron remains a coarse safety net, not the normal fast path.
For future approved deployment, consider a 1-minute Cron *reconciliation
backup*, not an SLA success claim. No automatic retry of an ambiguous
GitHub merge or invalid/failing check.

### P2 — protected PR validation candidate

`design/fishing-production-fast-candidate.yml` contains a consolidated
read-only PR validation job retaining the required name
`fishing-merge-ready`. It preserves the prior docs/content/full path
classification, trusted source checkout, locked dependencies, canonical
content/build verification, full existing browser/rollback acceptance
steps and fail-closed final lane-result check.

It remains a **candidate file**, not installed under
`.github/workflows/fishing-production.yml`. The real branch ruleset,
required-check source binding and provider-native job result must be
re-verified on the **exact replacement workflow** before any merge.

### P3 — one main-only content release job candidate

The same candidate workflow includes `main-fast-content`, which reuses
the existing main-push classification job and **rebuilds on the actual merged main
SHA**, validates canonical/release integrity, uploads directly to Pages,
guards current main, deploys, and independently verifies hosted files
and release identity **inside one main-only job**.

It preserves the main classifier to avoid an unnecessary `github-pages`
environment activation on full-application pushes, but removes the
separate main content validation job, cross-job generic artifact handoff
and second checkout.
The original full application validation and deployment path is carried
forward. No PR job receives Pages write or id-token write.

`main-fast-content` is guarded by `needs.classify.outputs.mode == 'content'`,
so full-application pushes do not enter its Pages environment. The original
top-level main concurrency key is retained; no nested same-key job
concurrency is permitted.

### Source acceptance evidence

Isolated GitHub Actions runs verify Node tests, actual SQLite D1
enforcement, malformed/forged webhook rejection, ambiguous/duplicate
notifications, persisted alarm re-arm, CI watchdog backoff, main/PR
workflow guardrails, local YAML parse where Ruby is available, browser
pilot bundle parity, and Wrangler worker dry-run packaging. Record the
*latest exact-head* successful CI run before any approval.

## Owner approval and engineering guardrail update (October 29, 2026)

The owner **approved** sandbox-only new SQLite Durable Object provisioning,
a repository-level signed `check_run` webhook, and a guarded refresh of the
existing private test Worker. This does **not** approve public route changes,
R2 activation, GitHub production writer permissions, or production publishing
workflow cutover.

Actual Cloudflare/GitHub account changes remain **unperformed** from this
session: no Cloudflare management connector and no GitHub repository webhook
create action are connected. Owner local Wrangler/GitHub UI execution is
required to apply approved changes. The guarded owner-run script
`tools/prepare-d3-fast-watchdog.ps1` defaults to **PREPARE+DRY-RUN**,
derives from the actual ignored known-good
`wrangler.d3-cross-device-status-fix.local.jsonc`, preserves D1,
existing flags/Cron/Pages, verifies current Worker version, and requires
a separate `-Deploy` switch plus the exact predecessor Worker version.
Both modes reject changed baseline D1/public V2 and configuration drift.

One further P1 safety correction: named-operation DO alarms now call
`coordinator.tick({targetOperationId})` and use the exact matching
`store.nextRecoverableMergeFor(operationId)`; they can no longer
advance another owner's older queued operation. The existing periodic
Cron continues global ordered recovery. A marked merge remains
ineligible for a second merge call.

## Before any live sandbox activation — explicit scope-gated owner decision

The approved P1–P3 engineering work **does not automatically approve**
these separate Cloudflare/GitHub account-side changes:

1. Add a **new SQLite Durable Object** namespace binding to the existing
   private owner test Worker, preserving its existing two D1 bindings,
   encrypted secrets, source version, Cron settings, owner OAuth,
   existing D3 pilot and public V2. Proposed local Wrangler *diff*:

   ```jsonc
   "durable_objects": {
     "bindings": [{
       "name": "D3_FAST_WAKE_DO",
       "class_name": "D3FastWakeAlarm"
     }]
   },
   "migrations": [{
     "tag": "d3_fast_wake_v1",
     "new_sqlite_classes": ["D3FastWakeAlarm"]
   }]
   ```

   If existing DO migrations are already present, append a uniquely
   tagged migration, never overwrite history. Do not deploy a synthetic
   example config. Verify Wrangler 4.153.0 dry-run and current exact
   Worker predecessor version before one guarded Worker replacement.
2. Set new independent encrypted 32+-byte
   `D3_FAST_WEBHOOK_SECRET` using a local cryptographic generator
   and `wrangler secret put`; never send it in chat, GitHub, or logs.
   Set `D3_FAST_WATCHDOG_ENABLED=false`,
   `D3_FAST_WEBHOOK_ENABLED=false`,
   `D3_FAST_TRACE_ENABLED=false` for first deploy.
   Do **not** modify existing D3/D2 publishing flags, App grants or
   public routing.
3. Verify the anonymous check webhook path responds 404 while disabled,
   existing public V2 byte identity unchanged, private Gear/KB Live
   D1 receipts preserved, and no R2 changes. Then enable the
   watchdog **only** in a controlled sandbox test, inspect timing,
   duplicate wakeups and recoverable failures.
4. Create a **new** signed repository-level webhook **only** on
   `ginosega/fishing-p3-sandbox`, event `check_run`, pointing to the
   private test Worker `/__d3_fast__/github-check`. Do not change
   existing GitHub App webhook destinations or credentials. Enable
   `D3_FAST_WEBHOOK_ENABLED` only after signature/denial checks pass.
5. Run a new **fresh** sandbox-only Gear or KB content test with
   exact PR head and CI, and observe the webhook-triggered merge
   versus an intentionally withheld event (watchdog recovery).
   No replay of already-verified Gear PR #17 or KB PR #18.
   Keep immutable D1 evidence and verify private hosted bytes.
   Record event receipt, webhook→wake, CI check→merge, probe time,
   errors, and the measured interval from owner's Save click.
6. Change **only after separately verified** protected-workflow parity:
   install the candidate optimization under the real workflow path
   and validate on an isolated branch and required-check ruleset;
   subsequently allow the first main-only content deployment with
   explicit production-change approval, preserved V2 rollback,
   and independent hosted verification.

Cloudflare Durable Object SQLite is supported on Workers Free, with
usage caps; it is not an R2 subscription. See
https://developers.cloudflare.com/durable-objects/ and
https://developers.cloudflare.com/durable-objects/api/alarms/ .
These account-side changes are NOT performed by the GitHub connector.

## Quantitative targets, NOT observed performance

| Phase | Existing measured interval | Engineering target | Risk |
| --- | --- | --- | --- |
| P1 private D3 initial check completion → merge | 547/577s (2 samples, with KB recovery) | Normal webhook recognition → merge attempt within ~5–10s; lost event detected in ~8.5s + provider query latency | DO alarm failures, forged/replayed events (HMAC/D1 CAS), ambiguous merge (read-only reconciliation) |
| P2 public PR creation → CI complete | 42–80s; median 47s (six PRs) | Median 25–35s, *not yet benchmarked* | CI lane classification and required-check identity |
| P3 main Actions creation → all hosted proof | 85–183s; median 100s (nine runs) | Model ~65–85s median, *not yet benchmarked* | GitHub Pages long-tail, job environment, SHA/source-coherent release |
| SLA full public Save → independent Live | **Not measured/implemented** for V3 | Every normal Gear/KB/Catch ≤60s | P1–P3 alone likely insufficient; re-evaluate later with measurements |

**No claim** that P1–P3 combined will achieve 60s. Initial PR→merge
already 58–98s in six production samples and post-merge Pages
remains slow even if optimized. Preserve the ability to evaluate D1
content delivery **after** P1–P3 data rather than enabling R2 now.

## Bounded stop rules

No production public-main write, merge, account webhook, DO namespace,
routing, Worker version replacement, authentication scope or paid-plan
change is carried out as a side effect of source-only development.
A new material cloud/deployment action needs the owner's explicit
scope-specific approval. An operation never becomes Live due to a
webhook or storage acknowledgment alone, and the 60,000ms requirement
cannot be waived for normal queue/Pages latency.
