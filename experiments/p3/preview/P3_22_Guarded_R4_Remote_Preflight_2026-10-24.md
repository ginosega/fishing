# FISH118 P3-22 — Guarded remote R4 D1 preflight

**October 24, 2026 — PRE-FLIGHT VERIFIED / R4 NOT APPLIED.** After source-only P3-20/21 and owner direction to proceed, the next isolated schema stage was prepared in the private `ginosega/fishing-p3-sandbox` GitHub Actions infrastructure. There has been no Worker deploy, publishing enablement, App write, PR merge or production change.

## Automated source and identity safeguards

Private sandbox [PR #7](https://github.com/ginosega/fishing-p3-sandbox/pull/7) passed sandbox-only infrastructure CI and was squash-merged to private sandbox main at `150d4f6814a2458f754e45f2b28b0d87b9e234b1`. New `.github/workflows/fishing-p3-r4-d1.yml` triggers an **automatic read-only preflight only** when its reviewed workflow/guard/tests are pushed to sandbox main; write-mode can be invoked **only** by a separate manual `workflow_dispatch` with `apply-r4` and exact owner-entered phrase `APPLY-R4-ONLY-TO-FISHING-P3-SANDBOX`.

All source SQL is fetched from fixed immutable Fishing draft commit `3e70b7b24827ded712e03f43cd38cd70e2ff2546`, compared to SHA-256 for 0001/0002/0003/0004; R4 0004 SHA-256 is `6f200533f27b60c06b8653140ccfd1c8c1d1300303230fbadf4f364e412d8be5`. No dynamic SQL input or generalized remote migration is possible.

## Actual automatic remote READ-ONLY preflight

[GitHub Actions run #40125707688](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40125707688) triggered by private sandbox main push; **completed/success**, actual logs reviewed:

- Six R4 guard tests passed, including absolute push-trigger prohibition on `apply`, exact confirmation requirement, immutable source pin and SQL mutation denial.
- `PASS: Exact isolated D1 UUID/name/backend match against Cloudflare GET and Wrangler inventory; 4 immutable SQL files staged.`
- `PASS: R4 preflight: exact ledger, canonical 14 objects individually checked, all expected rows empty, FK clean, hosted Worker disabled.` The ordered remote ledger remains only `0001_initial.sql`, `0002_durable_snapshot_and_audit.sql`, `0003_ci_observation_recovery.sql`.
- `PASS: Only R4 SQL migration pending.`

The new R4 file adds exactly `p3_command_nonces` and index `p3_command_nonces_consumed_at`. Expected postflight is **16 P3 objects** (seven tables, four indexes, five triggers), ordered ledger 0001+0002+0003+0004, seven empty P3 application/nonce tables, clean foreign keys and preview Worker still disabled/anonymous.

## Remaining human execution boundary

The GitHub connector can review runs, jobs and sanitized logs but **cannot initiate `workflow_dispatch`**. The owner must invoke `Fishing P3 isolated D1 R4 (auto preflight, manual apply)` from the private repository's Actions tab, branch `main`, mode `apply-r4`, and enter **exactly** `APPLY-R4-ONLY-TO-FISHING-P3-SANDBOX`. This manual action reruns the preflight, privately uploads a fresh D1 Time Travel bookmark **before** the sole remote R4 migration, and performs segmented postflight. Bookmarks remain a private seven-day Actions artifact; do not paste identifiers, tokens, or bookmarks into chats or PRs. Do not rerun `apply-r4` if the job fails after the migration step: review remote state first. No automatic restore.

**Scope:** This authorizes only the explicitly owner-dispatched isolated schema migration, not a new Worker route, secret provisioning, GitHub App write-token creation, publish enablement, any PR merge or production cutover. Once the owner run is independently verified, close R4 and then review sandbox Worker service design and deployment as a **separate gate**.
