# FISH118 D2 — interrupted execution recovery, source integration, and real-host activation gate

**October 25, 2026 PDT** · **Status: D2 SOURCE INTEGRATION ADVANCED; REAL NONPRODUCTION SANDBOX PUBLICATION NOT YET EXECUTED.** This report closes the investigation of the interrupted long-running assistant turn and records an explicit operational stop condition, **not** a new P3 phase or an assertion that D2 delivered a live publication.

## 1. What the interruption actually left in GitHub

The user's preceding assistant run timed out without delivering a final response. GitHub retained **30 committed source updates** since the previous user-visible D2 checkpoint `b09de0b2a43a8deecfd965d3ccca886911e78a01`; the latest interrupted head was `ac3dc4c86be6bb39352f6d2070cc212509d9a228`. The associated isolated CI [#40219351779](https://github.com/ginosega/fishing/actions/runs/40219351779) failed **one** runner test out of 386 P3 tests (`D2-R05`): the test's `invalidPR` fixture supplied a different but syntactically valid commit SHA, while the new runner appropriately pins the actual SHA returned by its trusted PR adapter. This was a fixture error, NOT proof that GitHub/Cloudflare had been activated or written to. The recovery commit `bc607c2babaaab02bd119d948f21bf33b326f853` instead feeds a genuinely wrong PR branch, which the runner denies; [exact-head CI #40220298411](https://github.com/ginosega/fishing/actions/runs/40220298411) completed SUCCESS **509/509** (80 PWA, 43 broker, 386 P3).

Recovered commits provide substantive source-only D2 implementations:
- Worker-compatible immutable private-sandbox tree+SHA-1 Git-blob validation using the real Gear/KB/Catches schemas, canonical source-aware text-only `p3-test-rod` edit, branch-stale/unsafe-source denial;
- Ported AUTH-P0 first-party OAuth/session and original read-only Pages proxy into a single default-off production-origin gateway with CSRF write API and isolated owner-only test-asset path;
- One-repo GitHub App read-token issuer that scopes to **`contents:read`** or **`contents:read + pull_requests:read + checks:read`**, with exact selected installation checks (source only; PEM not provisioned);
- Bounded `pwa/Gear/gear.json` sandbox draft-PR adapter, exact-head Actions `validate-sandbox-head` observer, normal GitHub ready/merge adapter without bypass, merge receipt D1 persistence, private test-asset loader that verifies Git tree/blob bytes;
- Default-off, one-transition-per-invocation D1 operation runner with simulated PR/CI/merge/host recovery tests.

**Production repo `ginosega/fishing` main remained `587b978118df64cc9ec584375c458fa2b10fecfa`; private `ginosega/fishing-p3-sandbox` main remained `69b236c8af663cdce687dc855bb117a01874060a` at recovery. Open public PR #263 remains DRAFT and UNMERGED.**

## 2. Recovery security fix: blind retries of an ambiguous merge

After inspecting the source we identified a real hole in the simulated private runner: an uncertain GitHub `PUT .../merge` outcome could be followed by lease expiry and another automated call. That violates D1's lost-response = UNKNOWN/no-blind-retry contract.

Changes now make the **D1 SQLite write-ahead barrier** mandatory:

- `d1-operation-store.mjs` adds `markMergeAttempt({operationId,leaseOwner})`: a CAS/D1 row update to durable `reason_code='merge_attempted'` under an unexpired, exact owner/repo and Merging lease **before contacting GitHub**. `saveMergeReceipt` now refuses any merge success receipt without that durable marker. A successful `Merging → Deploying` CAS clears the marker.
- `d2-sandbox-operation-runner.mjs` refuses to resume any Merging row carrying the marker, and requires the mark to succeed before entering the remote merge adapter. A crash/unknown remote response therefore needs separately authorized **read-only reconciliation**, never an automatic second merge.
- `d1-operation-store.mjs` also exposes `nextEligible()`, returning only one eligible sandbox owner operation; importantly it **excludes** all rows with a non-null `reason_code`, so a scheduled runner doesn't inadvertently select a merge with unknown outcome.
- New `test/d2-durable-merge-barrier.test.mjs` (D2-B01..B04) uses REAL in-memory SQLite, checks lease-restart persistence, mark-once CAS, exact receipt-required before clearing and unknown-result exclusion. `test/d2-sandbox-operation-runner.test.mjs` checks marker-before-remote-action and no reattempt after a simulated crash.

## 3. Source-only composition of private coordinator

`src/d2-sandbox-scheduled-coordinator.mjs` now assembles the previously separate Worker-compatible source validator, sandbox PR adapter, exact-check observer, normal merge and operation runner. It requires **injected server-controlled** GitHub read/write token issuers and a separately implemented trusted production-origin hosted proof callback. A single `tick()` reads one D1 eligible operation and can advance at most one durable state, defaulting to DENY unless all independent server flags are *explicitly* enabled:

- `D2_RUNNER_ENABLED=true`
- `D2_WRITE_ENABLED=true`
- `D2_READ_TOKENS_ENABLED=true`
- `D2_TEST_HOST_ENABLED=true`
- `D2_SANDBOX_REPO_ID=1430581407`

These flags in source do **not** enable any real provider service. There is **NO Cloudflare `scheduled()` event binding**, no deployed source for this coordinator, no App secret in GitHub Actions, no production-hosted byte verifier callback, and no claimed real private PR/merge. A one-step real runtime must be reviewed and wired before any genuine operations; a test double is **not** a valid hosted proof. New `test/d2-sandbox-scheduled-coordinator.test.mjs` verifies hard-off behavior, immutable repo gate, bounded one-operation selection and required capability presence.

**Source check:** [isolated GitHub validation #40221019547](https://github.com/ginosega/fishing/actions/runs/40221019547) passed at commit `5469d7ece04938d9bd5f16745b445b27a61b8004` with 80 PWA + 43 broker + 395 P3 = **518/518 source tests**, disabled-Worker parity and bundling checks. Final documentation commit needs its own exact-head validation before claiming that whole branch is green.

## 4. What is STILL needed for actual D2 completion

The user's explicit D2 done criterion is still **ONE real sandbox Gear edit that passes owner-session authorization, durable D1 acceptance, private sandbox PR, exact-head GitHub Actions, normal protected merge and byte-verified test content on the intended production Cloudflare origin**. Under the approved October 25 production-first variance, do **not** set up a second preview site or mutate canonical `ginosega/fishing` data.

**Operational gate A — Cloudflare deployment/custody:** We do not have connected Cloudflare management tools in the available chat. The previously validated AUTH-P0/preview Cloudflare control-plane configurations and existing App PEM are **not** accessible through the GitHub connector; source-only commits do not change Cloudflare. The owner must explicitly authorize provisioning/mounting the existing **write-capable** App private signing key in the trusted Cloudflare gateway, scoped D1 DB bindings and a tightly gated scheduled handler and test-only production-origin path. Do **not** paste secret keys into ChatGPT/GitHub source/logs.

**Operational gate B — actual runtime composition:** Before deployment, mount the scheduled coordinator to a real privately triggered Worker event using the independently reviewed real token issuer, D1 store and **genuine** source-aware GitHub GETs. Complete the production-origin external byte-observer callback and prove exact merged SHA, Git blob SHA-1/SHA-256, authorized owner test GET, correct CI/run provenance, no caching and a truthful test-only receipt; synthetic `verified:true` is unacceptable.

**Operational gate C — provider authorization / real end-to-end write:** Reconfirm currently granted selected GitHub App installation permissions and sandbox repo branch/rules, D1 schema, actual Cloudflare quotas, secure key custody, and rollback. Then with owner authorization enable only the sandbox identity and submit the existing private fixture `p3-test-rod` change, pass latest-head check, merge and fetch externally at the production origin isolated path. Keep `D2_WRITE_ENABLED=false` and privileged routes disabled before this gate. Private sandbox is the ONLY repo mutation target.

**Operational gate D — record live evidence:** Capture exact sandbox PR number, base SHA, head SHA, check run ID, actual merge SHA, hosted origin/path and independently verified SHA-256 of returned bytes, D1 operation status and rollback result; do not announce D2 COMPLETE or V3 Live without actual values. If ambiguous merge result, use the write-ahead marker and manually reconcile rather than auto-retry.

**Safety / process:** Standing approval covers source-only design, tests and read-only verification, **not** App PEM key transfer, new live Worker/Cron bindings or genuine GitHub write enablement. Continue D2 at that meaningful owner-controlled operational gate, not by inventing P3-42+ checkpoints. Changing the production website host is allowed under the approved strategy with downtime, but data-integrity and release safeguards remain required.

## 5. Finish-line status

**D2 is NOT DONE.** The interrupted turn's source was recovered, a real crash-safety defect was fixed, and the end-to-end private runner composition is more complete and tested. There is no genuine deployed sandbox publication. Until control-plane access and consequential credentials are approved, source mocks/CI cannot satisfy the owner's D2 definition. The next handoff must be an exact operational decision—not another internal checkpoint report.

All work remains in public *draft* PR #263. Do not edit the five canonical public-main project handoff Markdown files until the established full new-chat transfer process.
