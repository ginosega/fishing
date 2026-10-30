# FISH118 P3-21 — Durable command replay ledger and atomic sandbox acceptance

**Date:** October 24, 2026

**Status:** SOURCE-ONLY TESTED on draft [PR #263](https://github.com/ginosega/fishing/pull/263). The owner confirms that dedicated P3 GitHub App permissions already allow Contents read/write, Pull requests read/write, and Checks read. No further App permission updates are requested.

## Reviewed changes

- `migrations/0004_command_nonce_ledger.sql`: **proposed, unapplied R4** ledger `p3_command_nonces` and timestamp index. Unique SHA-256 nonce is consumed once; fixed isolated repo ID, owner ID and time constraints. This file must **never** be applied to the existing remote R3 database except under a separately reviewed and owner-authorized R4 migration procedure.
- `src/p3-command-nonce-store.mjs`: creates a native Worker-D1 prepared single-statement `INSERT ... ON CONFLICT DO NOTHING RETURNING` replay gate. The native D1 statement is atomically unique across Worker instances; a second nonce attempt cannot authorize a second operation. Invalid owner/repo/hash/age is rejected. It does not expose a general SQL executor, cleanup, arbitrary D1 write, or GitHub mutation.
- `src/p3-internal-command-gate.mjs`: source-only HMAC-SHA256 command verification: exact sandbox origin/method/path; canonical signed request-byte hash, timestamp, nonce; bounded 8 KiB streamed payload; narrow Gear/KB `accept` operation; server-owned owner ID and repository ID; triple-disabled flag/operator gates, no public route/deploy.
- `test/p3-command-nonce-store.test.mjs`: tests prepared native-SQL duplicate rejection, concurrent replays, wrong owner/repo/stale nonce, missing migration refusal, and real local SQLite signed command → nonce consume → `createD1OperationStore.accept` native `DB.batch` storing Accepted+request+audit. The earlier HMAC tests cover signature/body tampering, replay rejection, disabled flags, and response redaction.

## Source CI proof

At GitHub branch commit `cc61290baef171fbb6886a901609c0763498e6f6`, isolated full [CI run #40124928871](https://github.com/ginosega/fishing/actions/runs/40124928871) **completed success**: 80 PWA, 43 broker, **168 preview P3** tests (291 total). The actual job logs confirm all P3-N01…N05 and P3-G01…G08 source tests passed.

This validates simulated/native SQL behavior under the in-memory SQLite fixture, **not** a Cloudflare remote Worker service or write-enabled publisher. The currently deployed preview Worker still denies public operation/auth/publication routes, and the dedicated private sandbox D1 remains R1+R2+R3 with **14 P3 schema objects**. The new 0004 ledger is absent remotely by design. `P3_WRITE_ENABLED=false` remains mandatory.

## Blockers and remaining gates

1. R4 migration requires new explicit owner approval and Cloudflare isolated target preflight, independent recovery bookmark, exactly-once migration, and detailed postflight. Never apply an unapproved migration automatically.
2. An internal-command service route / trusted caller needs a new threat-model review and separately approved Worker deployment. Authentication and nonce storage must be bound together in the actual native Worker; no generic SQL endpoint and no public unguarded admin route. HMAC secret provisioning must be private; never send keys in chat.
3. P3 source-aware candidate validation, checked draft PR creation, CI observation, rollback/recovery, and any sandbox GitHub write require separate reviewed enablement. The current bridge only supports durable `Accepted` state; it **does not publish, create PRs, merge, or deploy**.
4. Public production `ginosega/fishing` `main`, AUTH-P0, App installations and experimental PR statuses remain unchanged. Production cutover still requires a separate explicit owner approval.

**Recommendation:** Keep this tested implementation source-only until the R4 and Worker architecture/deployment gates are approved; avoid introducing write-enabled infrastructure simply because code tests pass.
