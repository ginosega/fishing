# D5 existing private owner candidate — two-step update gate (source only)

**State:** Prepared procedure, NOT deployment authorization or field acceptance. The prior one-time [initial D5 installation procedure](D5_OWNER_ISOLATED_DEPLOY_GATE_2026-11-03.md) must **not** be rerun: the Pages project and Worker route already exist.

## Required identities and boundaries

- Source: `feature/fish118-d5-owner-integration` exact current merged SHA, with successful *push* `Fishing P3 isolated source validation` for that SHA. Run each operator from a clean, detached checkout of that SHA.
- Existing Pages project: `fishing-v3-owner-d5-test`, private Owner candidate scope `/fishing/__v3_owner_candidate__/`; **not** the separate reader Pages project and **not** public V2.
- Existing Worker: `fishing-auth-p0-test`; require owner-verified exact active Worker version, a verified previous *immutable* Pages origin/release and exact previous ignored Wrangler configuration plus unchanged, digest-pinned original D3 pilot bytes.
- Existing source CI success and the earlier Android PASS do **not** authorize a new Pages or Worker write. Obtain separate owner approval for each private rollout; never run `-Deploy` by default.
- Do not clear Chrome storage, unregister a service worker, delete a draft or retry an ambiguous request. Do not enable new credentials, routes, DB mutations, synthetic Save & Publish or public cutover.

## A. Prepare / approve / upload static Pages

In Windows PowerShell from the exact detached source worktree, run the **new** `experiments/p3/preview/tools/update-d5-owner-pages-private.ps1` with `-ExpectedHead`, `-ExpectedCiRun`, `-PreviousPagesOrigin`, `-ExpectedPreviousRelease`, `-ExpectedWorkerVersion` and `-ExpectedPublicV2Digest`. **Omit `-Deploy`.**

This validates clean exact source and exact-head push CI; confirms old immutable Pages release, current private Worker and unchanged V2; builds the candidate into a temporary folder, validates every local asset, and stages the separate owner scope. It prints `NEW_RELEASE_ID` without a provider write.

Only after a separate owner approval, repeat the same verified arguments with `-ExpectedNewRelease` set to the prepared release ID and `-Deploy`. The operator checks the same baseline, creates a **single-attempt marker before** uploading via Wrangler 4.153.0 into the *existing project* and obtains a **new immutable Pages origin**. It verifies the new release pointer and 13 independent hosted SHA-256 samples, then verifies that the previous immutable Pages, private Worker version and public V2 are unchanged. Preserve the new URL and terminal PASS lines. **Do not point the authenticated browser at the bare Pages origin.**

If the upload or post-check is uncertain, **stop** and inspect Cloudflare Pages deployments and the attempt marker before deciding what happened; never repeat the upload blindly. The former immutable Pages origin remains the rollback reference.

## B. Prepare / approve / update the existing private Worker

Supply `update-d5-owner-worker-private.ps1` with exact `-ExpectedHead`, `-ExpectedCiRun`, `-ExpectedWorkerVersion`, old/new immutable Pages origins and release IDs, `-ExpectedPublicV2Digest`, `-PreviousConfig` and `-PreviousGeneratedDir`. The last two must reference the previous owner-deployed **ignored local** configuration and original generated pilot assets; never paste them or secrets into GitHub.

**Omit `-Deploy` first.** The operator verifies the current version, old Worker→Pages release pointer, owner security denials, both immutable releases and new source identity. It ensures exactly one existing `D5_OWNER_PAGES_ORIGIN`, replaces **only that value** in a separate ignored config, copies and SHA-checks original pilot assets, verifies D1 binding count and private secrets are not in config, computes the audited bootstrap CSP SHA-256, and dry-runs Wrangler. It then verifies no Worker or V2 drift and prints `PREPARED ONLY`.

Only after a **separate explicit owner approval** may the same pinned invocation add `-Deploy`. The operator checks the baseline again, creates an atomic single-attempt marker, invokes one private Worker deployment, and proves a distinct new version, old D3 anonymous denial, unchanged V2 digest, source-matched Worker→Pages release pointer and identical HTML, exact expected inline-bootstrap CSP hash, narrow route and preserved old Pages release. The original D1 state, secrets and previous pilot assets must remain unchanged.

If the deploy or any post-check is ambiguous, treat the operation as **UNKNOWN**, retain marker/config/receipts and query Cloudflare before considering any further write. **Never automatically roll back**, because there could be newer versions or operations. A rollback is a separately approved, current-version-locked change after D1 receipt reconciliation.

## C. Field acceptance and checkpoint

The owner tests the private **same-origin Worker URL**, including first launch in a previously untreated browser profile/device with a broader `/fishing/sw.js` present, normal fast read-only pages, Add/Edit-only neutral pending checks, sign-in, denied/offline authoring, no duplicate Restore prompt and preserved existing drafts. Do **not** clear the owner's known unsent draft or use a destructive negative test on it. Report each PASS/FAIL with environment and release/Worker identity. Keep first-visit defect #341, Add/Edit gate #358 and provisional drafts #342 open until their distinct acceptance requirements are met.

After the field checkpoint, reconcile `governance/project-ops` current state and queue via a separately validated protected docs PR. **No public V3 cutover or synthetic publishing is authorized by this procedure.**
