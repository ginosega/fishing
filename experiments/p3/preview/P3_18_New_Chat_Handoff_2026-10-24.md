# Fishing Companion — New-chat handoff, October 24, 2026

**Project:** FISH118 v3 authenticated authoring/publishing, isolated P3 rehearsal.  
**Workstream at transfer:** P3-18 isolated remote D1 migration staged rollout. **R1 COMPLETE; R2/R3 NOT APPROVED.**  
**Draft PR:** [ginosega/fishing #263](https://github.com/ginosega/fishing/pull/263) on `feature/fish118-p3-mock-publisher`. Preserve draft/unmerged status; no production or private-sandbox GitHub merge/publish.

## Most important current state

**Owner-completed R1 (remote D1 on October 24, 2026):** Wrangler **4.152.0** applied exactly the canonical `0001_initial.sql` to the isolated Cloudflare D1 `fishing-p3-sandbox`, which already had an identical 0001 schema installed manually but lacked Wrangler's `d1_migrations` table. Owner's R1 command output explicitly showed **`Resource location: remote`**, exactly one pending migration `0001_initial.sql`, interactive human confirmation, **7 commands succeeded** and a success tick. The guarded preflight had verified the correct isolated D1 `DB` binding, immutable 0001 SHA-256 matching the earlier local rehearsal, the six matching original schema definitions, zero session/operation/event rows, no foreign-key violations, and a disabled preview Worker. **A fresh pre-change Time Travel bookmark was privately saved and confirmed by owner. Never request/publish its value.**

**Owner-verified remote postflight:**
- `SELECT name FROM d1_migrations ORDER BY id;` => **only `0001_initial.sql`**.
- `sqlite_master` => same **three P3 tables + three P3 indexes**, correct definitions; no 0002/0003 objects.
- `p3_sessions`, `p3_operations`, `p3_events` => all **0** records.
- `PRAGMA foreign_key_check;` => empty results; read-only verification wrote **0** rows.
- Preview Worker `GET /health` => `{"ok":true,"ready":false,"mode":"preview-no-publishing"}`.
- Anonymous `GET /session` => `{"authenticated":false,"authorized":false}`.
- Owner separately confirmed Cloudflare Dashboard preview Worker `DB` points to the isolated sandbox D1 and `P3_WRITE_ENABLED` is the literal string `"false"`.
- **R1 COMPLETED AND VERIFIED; no further R1 commands, retries, or restore needed.** The real remote D1 has now changed **only** by establishment of Wrangler's migration ledger. No publisher activated, GitHub sandbox write or Worker deployment occurred.

## Relevant evidence and source

- [P3-18 approval/stage/R1 final report](P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) — authoritative owner-reported transcript, postflight, approvals and R2/R3 gates.
- [P3-17 local Wrangler history reconciliation](P3_17_Wrangler_Migration_History_Reconciliation_2026-10-23.md) — **real Wrangler 4.152.0 local-only** 0001/0002/0003 rehearsals performed step-by-step, final local `d1_migrations` 0001–0003, 6 tables/3 indexes/5 triggers, zero foreign-key violations, no pending local migration.
- [P3-16 remote read-only inventory](P3_16_Read_Only_Cloudflare_Inventory_2026-10-23.md).
- Immutable canonical migrations, from reviewed source commit `d58833d3f4faa093f6a78b883af89f82eafddfb0`: `experiments/p3/preview/migrations/0001_initial.sql`, `0002_durable_snapshot_and_audit.sql`, `0003_ci_observation_recovery.sql`.
- PR #263 also contains a pure, fail-closed P3-17 migration reconciliation module, isolated SQLite fixtures, Worker/preview work. **No actual remote Cloudflare connector is available**; all D1 live evidence came from owner-executed PowerShell/Wrangler output.
- Latest exact-head isolated CI before handoff: [run #40106865526](https://github.com/ginosega/fishing/actions/runs/40106865526), **success 272/272** (80 PWA, 43 standalone broker, 149 preview) for final R1 report commit `59fa197f77cd32d0d9177a8e96c83bbe2ca10513`. Update this when new source-only handoff commit completes.
- GitHub protection checkpoint immediately before handoff: public production `ginosega/fishing` `main` **`4a1a8c44317b56a4d47e818db9cd2b5587a966d8`**, synthetic private `ginosega/fishing-p3-sandbox` `main` **`e37db3b18bd9948bf4453d7f885f868e830a9a9a`**. PR #263 draft/open/unmerged.
- GitHub API `update_pull_request` previously returned **HTTP 422 "too many files changed"** due to PR size (88 changed files). A top-level [PR comment documenting R1 closure](https://github.com/ginosega/fishing/pull/263) was added instead. Do not assume an updated PR body exists. Github `fetch` of pull request is available; use connector functions.

## Next requested workflow in the new chat

**Pause at an explicit R2 approval gate.** The user's last intent was to **transfer to a new chat**, *not* to authorize R2. Begin the new chat by confirming R1 is done and presenting/reviewing the R2 remote migration risks/plan. **Do not execute R2 from the earlier "proceed": that authorized only R1.**

R2 adds the canonical `0002_durable_snapshot_and_audit.sql`: `p3_requests` table plus `p3_operation_accepted_audit`, `p3_operation_transition_guard`, `p3_operation_transition_audit` triggers. On a fresh, **separately approved** R2:
1. Recover or rebuild a **private** Wrangler `--config` with only `DB` matching *isolated* `fishing-p3-sandbox` and no `fishing-auth-p0` or production binding; do not reuse synthetic `LOCAL_P3` settings. Verify database identity, current Worker disablement and immutable 0002 SHA-256 versus local rehearsal.
2. Create a **restricted migration directory containing only 0001 + 0002**, verify no extra migrations. Fresh remote read-only ledger must contain **exactly 0001**, schema must contain original 3 tables/3 indexes only, app row counts must remain zero, and foreign keys clean. Check anonymous `/health`, `/session`, Worker binding and `P3_WRITE_ENABLED=false`.
3. Obtain a **new private pre-R2 Time Travel bookmark**, separate from the R1 bookmark. Confirm it is stored privately; never publish any bookmark or tokens/UUIDs.
4. Only with **explicit owner R2 authorization and passing safeguards**, run Wrangler 4.152.0 `d1 migrations apply DB --remote --config <private-config>` with human-reviewed interactive prompt listing **exactly 0002**. Stop if error or unexpected prompt. Do not use auto-confirmation on Wrangler apply.
5. Postflight read-only SQL should give Wrangler ledger **0001 then 0002**, **4 P3 tables / 3 indexes / 3 triggers**, zero P3 records, no foreign-key violation; preview remains disabled. Review results and stop before R3.
6. **R3 is a distinct, later approval** and would add two CI-observation tables + two triggers. Do not stage or run 0003 prematurely.

## Constraints and operational lessons

- Never mutate production GitHub `main`, private sandbox GitHub `main`, authentication P0 D1, production D1/Worker, or enable publishing as part of these migrations.
- GitHub owner/editor is single-user; anonymous use default; v3 source remains draft PR until separate gates for deployments/publishing/GitHub write scopes.
- On the user's Windows PowerShell **5.1**, `@((... | ConvertFrom-Json))` can create a **nested array**, leading to false UUID-mismatch errors; the corrected pattern was `ConvertFrom-Json -InputObject ($raw -join "`n")`, then `@($databases | Where-Object {...})`. Use a complete, guarded `try { ... } catch { ...; throw }` block. Ordinary PowerShell interactive scripts continue after exceptions if pasted line by line; never display a success message unless all assertions ran successfully.
- Cloudflare `d1 list --json` once returned **API code 10000** but succeeded on repeat with authenticated OAuth and `d1 (write)` scope. Treat recurrence as fail closed. The deprecated `num_tables:0` from D1 list is **not** a trustworthy schema count; use `sqlite_master` instead.
- Cloudflare R1 private PowerShell temp config and local rehearsal directory existed during owner run; **do not presume environment/session variables survive** into a new chat or terminal.
- No automatic database restore: Time Travel restoration would overwrite D1 state and requires separate recovery approval. R2/R3 approval does not allow deployment, publishing, PR merge or GitHub writes.

**Handoff disposition:** R1 closed, ready for R2 plan/approval discussion. Stop before remote R2 migration without fresh owner authorization.
