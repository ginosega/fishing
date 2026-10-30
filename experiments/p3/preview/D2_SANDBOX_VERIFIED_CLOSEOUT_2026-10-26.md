# FISH118 D2 private-sandbox publishing — verified closeout (2026-10-26)

**Scope:** One owner-authenticated synthetic Gear edit, end-to-end in the isolated private repository `ginosega/fishing-p3-sandbox` (repository ID `1430581407`). **Not a public Fishing Companion v3 cutover or production website release.** The canonical public `ginosega/fishing` main branch is not updated by this test; implementation continues on draft [PR #263](https://github.com/ginosega/fishing/pull/263) (`feature/fish118-p3-mock-publisher`).

## Verified result

- **Durable operation:** `p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f`; final D1 `p3_operations.state = Live`, `reason_code = NULL`.
- **Submission:** owner-authenticated `POST /api/v3/operations` returned HTTP 202, `Accepted`, `duplicate=false`, `canonicalLive=false` on the test Worker `fishing-auth-p0-test`.
- **Published change:** only `pwa/Gear/gear.json`, changing Gear item `p3-test-rod` name from `P3 Test Rod` to `P3 Test Rod D2 Verification`.
- **Sandbox [PR #16](https://github.com/ginosega/fishing-p3-sandbox/pull/16):** exact head `fc7879d67217e0f0a36676e40dadbce7060f66a6`, original base `69b236c8af663cdce687dc855bb117a01874060a`, draft-to-ready review transition, successfully squash-merged October 26, 2026 at 08:20:29 UTC.
- **CI:** `validate-sandbox-head` run [40288266980](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40288266980) completed **success**, bound to the exact PR head.
- **Merged sandbox `main`:** `89be79a9c933dd36bd909edd585091232831c835`. Independently fetched GitHub PR, `main` ref, and merge commit agree. The merge has exactly one parent (the recorded base SHA), and the only changed file is `pwa/Gear/gear.json`.
- **Hosted verification:** D1 `verified_release_id = 73362eb77bd59219aa6f78fb93e9d47b`. The Cloudflare HMAC-protected test-host verifier reached its `Live` success criterion comparing delivered bytes with the immutable sandbox blob. Independent SHA-256 of the retrieved merged `pwa/Gear/gear.json` bytes is `73362eb77bd59219aa6f78fb93e9d47b7f0b8bffb9ef15f7f57eb82a33e095ad`; the first 32 characters match D1.
- **Final D2 Worker deployment:** `fishing-auth-p0-test` version `83da1949-1b82-43c9-9e63-3b99cb553e5a`; isolated D1 bindings `DB=fishing-auth-p0`, `OPERATIONS_DB=fishing-p3-sandbox`. Test enabled flags `D2_WRITE_ENABLED`, `D2_RUNNER_ENABLED`, `D2_READ_TOKENS_ENABLED`, `D2_TEST_HOST_ENABLED`; Cron `*/5 * * * *`.

## Reconciliation and operational limits

- After GitHub successfully merged PR #16, the scheduler's durable write-ahead `reason_code=merge_attempted` held state at `Merging` without a recorded `merge_sha`. **This prevented an unsafe automatic merge retry.**
- The first manual D1 `--file` reconciliation was rejected by Cloudflare's import endpoint with authentication error `10000` and was not applied. A separate pinned, single-row compare-and-swap recovery using Wrangler's `--command` path **succeeded**, restoring `Deploying` with the known merge SHA and clearing the reason code; the existing scheduler then advanced through `Verifying` to `Live`.
- **Do not rerun** the one-time merge reconciliation script or resubmit the browser operation. D1 already holds the final verified receipt.
- A successful synthetic sandbox pipeline **does not authorize** enabling the editor or publishing to the public `ginosega/fishing` repository. The signed-off production cutover gates and other uncompleted v3 milestones remain separate.
- The tested Cloudflare Worker still has a five-minute Cron and D2 test flags enabled at this checkpoint. A separate deliberate post-test disposition should be recorded before expanding any deployment scope.
- This closeout file is on draft **PR #263** and does not by itself amend the canonical `main` repository's five handoff files. During the next formal chat transition, reconcile `README.md`, `Fishing_Context.md`, `Fishing_Decision_Log.md`, `Fishing_TODO.md`, and the **full** `Fishing_New_Chat_Bootstrap_Prompt.md` against this evidence and current GitHub/Cloudflare state.

## Outstanding

D2 isolated end-to-end publishing proof is **complete**. Remaining work is a separately controlled v3 implementation/production release path, operations-hardening decisions (including automatic non-mutating reconciliation of unknown remote merge outcomes, if approved), disposition of active test Cron and secrets, and eventual canonical project-document handoff. Do not conflate those with a completed public site launch.

## Post-test Worker disposition — completed October 26, 2026

The owner executed the guarded `tools/prepare-d2-parked-worker.ps1` against the exact terminal D1 `Live` receipt. The local ignored parked configuration was dry-run validated, then deployed successfully by Wrangler 4.153.0. **Confirmed deployed Worker version: `82b678b2-b024-4428-922c-d2363f2bcbc2`.** All four D2 flags (`D2_WRITE_ENABLED`, `D2_RUNNER_ENABLED`, `D2_READ_TOKENS_ENABLED`, `D2_TEST_HOST_ENABLED`) reported **false**. Deployed triggers output listed the production Worker URL **without a Cron schedule**, confirming the five-minute test scheduler was removed. Existing `DB` and `OPERATIONS_DB` bindings were retained; no D1 mutation, GitHub merge, new operation submission, or PWA publication was part of this deployment. The earlier description of an active Cron above is historical at the first closeout checkpoint, superseded by this disposition.
