# FISH118 D3 — approved isolated R2 + D1 delivery benchmark

Approved by owner October 28, 2026 PDT. **This is a scoped provider experiment,
not approval for public V3, public-main writes, a custom domain, paid-plan
upgrade, GitHub App permission changes, or altering the public /fishing/ site.**

## Technical and security boundaries

- Private, **Standard class** R2 bucket: `fishing-v3-delivery-benchmark`.
  **DO NOT** enable the bucket's `r2.dev` URL, public domain, S3 credentials,
  lifecycle deletion of source, or external access.
- Existing isolated D1 database: `fishing-p3-sandbox` (**never** auth D1).
  New migration: `migrations/0005_d3_r2_d1_delivery_benchmark.sql`.
  It adds only `p3_delivery_benchmark_pointer`, initialized to an
  empty test-only singleton. It does not modify existing operation rows,
  migrations R1–R4, sessions or audit events.
- Existing owner-protected Cloudflare Worker target:
  `fishing-auth-p0-test`. Mount only three owner-session protected
  `/__d3_benchmark__/` paths; the existing `/__d3_pilot__/` and
  `/fishing/` routes are unchanged. A separate preview WEBSITE is not needed.
- Add R2 binding **`DELIVERY_BENCH_R2`** to the private bucket.
  Preserve existing `DB` (AUTH-P0 D1), `OPERATIONS_DB`, encrypted
  GitHub App/CSRF/host secrets, OAuth, existing D3 pilot settings and
  disabled D2 flags. **Never** put secrets into repo/terminal output/chat.
- New string flag **`D3_BENCHMARK_ENABLED=false`** by default.
  The route denies before D1/R2 access when false. Enabling it is
  owner-only synthetic testing under the approval, after verified deployment
  and route denial checks. Do not change `D3_WRITE_ENABLED`,
  `D3_RUNNER_ENABLED`, `D3_TEST_HOST_ENABLED` or GitHub grants.
- D1 pointer reads explicitly prefer `withSession('first-primary')` so
  an unbookmarked asynchronous replica cannot report stale active versions.
  No replica enablement or account setting change is required.
- `POST /__d3_benchmark__/run` requires the **existing** authenticated
  owner and same-origin CSRF/publish-intent guards; payload contains
  only `runId`, `expectedVersion`, `sizeBytes` (1024–65536).
  It writes deterministic synthetic bytes through R2 conditional
  create-once, reads/rehashes, atomically CAS-updates D1, reads back.
  No GitHub calls. Errors do not trigger retries.
- `GET /__d3_benchmark__/current` and `/asset` require owner
  session. Every response is no-store/private. These GETs measure
  authenticated **test** delivery; they are NOT public/canonical Live.
  The source-only benchmark never claims to satisfy V3-SAVE-09.
- **Acceptance** requires multiple owner-device timings and actual
  provider evidence. Repeated normal content Save-and-Publish public
  acceptance remains separately blocked until integrated V3 canonical
  GitHub protected merge + anonymous public SHA/release/byte proof
  can complete within 60 seconds.

## Operator sequence — local Cloudflare account access required

The GitHub connector cannot create R2 buckets, run remote D1 migrations,
or manage Cloudflare Worker bindings. No remote action has occurred
merely because this source/test branch passes CI.

1. From your known Windows checkout, update the already approved
   `feature/fish118-p3-mock-publisher` branch to the verified exact head
   after CI, then `Set-Location .\experiments\p3\preview`.
   Retain an offline local copy of the current **working** Wrangler
   config and note the currently deployed Worker version privately.
   Do not paste the config (which can contain private identifiers) in chat.
2. Confirm `npx.cmd wrangler whoami` identifies the intended Cloudflare
   account. Read-only inspect R2 with
   `npx.cmd wrangler r2 bucket list`. If the named bucket is absent,
   create only `fishing-v3-delivery-benchmark` with
   `npx.cmd wrangler r2 bucket create fishing-v3-delivery-benchmark`.
   Creation uses Standard by default; confirm with
   `npx.cmd wrangler r2 bucket info fishing-v3-delivery-benchmark`.
   Use `r2 bucket dev-url get` to ensure public dev URL is OFF.
   **Stop** rather than create a paid-plan upgrade or complete an
   unapproved billing/checkout enrollment. Cloudflare may require
   an R2 subscription even when expected usage stays within free allowances.
3. Using the owner's existing, fully verified **local** Wrangler config
   bound to `fishing-p3-sandbox`, list pending migrations with
   `npx.cmd wrangler d1 migrations list fishing-p3-sandbox --remote --config <LOCAL_CONFIG>`.
   The only pending migration must be
   `0005_d3_r2_d1_delivery_benchmark.sql`; earlier 0001–0004
   must already be applied. Abort on any other pending migration or
   target discrepancy. Keep `migrations_dir` pointing at the actual
   `migrations/` directory in this checkout.
4. Then, and only then, execute
   `npx.cmd wrangler d1 migrations apply fishing-p3-sandbox --remote --config <LOCAL_CONFIG>`;
   confirm the preview lists only `0005`. Verify read-only using
   `npx.cmd wrangler d1 execute fishing-p3-sandbox --remote --config <LOCAL_CONFIG> --command "SELECT scope,active_version,active_sha256,last_run_id FROM p3_delivery_benchmark_pointer"`.
   Expected: **exactly one** `d3-r2-d1-v1` row with three NULL values.
   No restore/replay or manual editing of existing D1 operations.
5. Update **the local, noncommitted config** for the existing
   `fishing-auth-p0-test` Worker, preserving its complete current vars,
   D1 bindings, secret references and Cron settings, to add:
   ```json
   "r2_buckets": [
     {"binding":"DELIVERY_BENCH_R2",
      "bucket_name":"fishing-v3-delivery-benchmark"}
   ]
   ```
   and `"D3_BENCHMARK_ENABLED":"false"` in its current `vars`
   object. Do not replace the working config with the outdated example.
6. Validate the exact bundle with the pinned source-only GitHub CI,
   local pilot bundle checks and **Wrangler dry-run** before any deploy.
   The existing owner OAuth, D3 pilot, R2 privacy and disabled D2/D3
   publishing guards must remain intact. A subsequent version-locked
   worker deployment would add benchmark-only bindings and route; never
   deploy from the example config or enable the publishing flags.
7. After safe deployment/postflight, run owner-authenticated local
   benchmark timing: read `/current`, submit one new synthetic
   `runId` with its returned expected version, and independently
   read `/asset`, comparing SHA256 to the response. Measure the
   complete click-to-asset-proof on the same browser monotonic clock;
   do not confuse it with public canonical Live. Record samples,
   browser, R2 stage time, D1 CAS latency, independent GET time and
   errors. No private cookies/CSRF/payload in logs.

**Stop rule:** Do not mutate/publicly route `/fishing/`, create
production-main PRs, open the R2 bucket, enable any GitHub writer, or
claim V3-SAVE-09 satisfied from synthetic data. Public v2 rollback
must remain available and unchanged.

## Checked Cloudflare references (October 28)

- https://developers.cloudflare.com/r2/reference/consistency/
- https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/workers/wrangler/commands/r2/
- https://developers.cloudflare.com/d1/reference/migrations/
- https://developers.cloudflare.com/workers/wrangler/configuration/
