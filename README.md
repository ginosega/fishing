# Fishing

## CURRENT Fishing Companion V3 handoff — October 26, 2026: D2 verified and parked; D3 in progress

**Authoritative latest checkpoint; all October 25 `D2 IN PROGRESS` and October 24 `NEXT P3-N` instructions below are HISTORICAL.** New chats must read the five root handoff files from the **actual latest `main`**, recheck live GitHub/host status, then resume D3; do not assume the SHA below remains current after this documentation PR merges.

**Verified GitHub before the documentation merge:** public `ginosega/fishing` `main` `64503470a2db7364a437b5e1eb0f4c120da61644`; private `ginosega/fishing-p3-sandbox` `main` `89be79a9c933dd36bd909edd585091232831c835`; FISH118 development [draft PR #263](https://github.com/ginosega/fishing/pull/263) exact head `4fdc75bb77dd5452b61866d1401c573569e130f2` with [isolated source CI #467](https://github.com/ginosega/fishing/actions/runs/40349790051) **SUCCESS**. Owner-approved AUTH-P0 feasibility [draft PR #262](https://github.com/ginosega/fishing/pull/262) remains unmerged. Unrelated [PR #268](https://github.com/ginosega/fishing/pull/268) must be preserved. These experimental branches are NOT wholesale production merge candidates.

**Public V2 remains the live Fishing Companion.** Latest successful production `main` workflow was [#672](https://github.com/ginosega/fishing/actions/runs/39990546320), source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, hosted release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**. Documentation updates do not constitute V3 rollout. FISH115–117 v2 fixes remain released; FISH108 still governs content vs application release lanes. Confirm latest hosted release independently if source/deploy state changes.

**D1: completed** at approved architecture/design level. The fixed six-deliverable roadmap remains **D1–D6**, never new open-ended P3-numbered milestones. **D2: COMPLETE** end-to-end for a single owner-authenticated, sandbox-only Gear text edit. D1 operation `p3_343ef7ba-1c87-4d5d-a2ad-92e91eab420f` reached `Live`, `reason_code=NULL`, GitHub [private sandbox PR #16](https://github.com/ginosega/fishing-p3-sandbox/pull/16) merged, exact-head [workflow 40288266980](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40288266980) passed, merge SHA `89be79a9c933dd36bd909edd585091232831c835`, verified hosted-byte release ID `73362eb77bd59219aa6f78fb93e9d47b`. A successful GitHub merge briefly lacked its D1 receipt (`merge_attempted`); the **one-time, exact-match read-only-proof-based reconciliation already succeeded**, after which Cron reached Live. **Never resubmit this operation or rerun reconciliation**. Full [D2 verified closeout](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_SANDBOX_VERIFIED_CLOSEOUT_2026-10-26.md).

**D2 Cloudflare test Worker safely PARKED by owner.** `fishing-auth-p0-test` at `https://fishing-auth-p0-test.ginosega.workers.dev`, deployed version `82b678b2-b024-4428-922c-d2363f2bcbc2`: `D2_WRITE_ENABLED=false`, `D2_RUNNER_ENABLED=false`, `D2_READ_TOKENS_ENABLED=false`, `D2_TEST_HOST_ENABLED=false`; deployed triggers have **no Cron**. Existing `DB=fishing-auth-p0` and `OPERATIONS_DB=fishing-p3-sandbox` bindings remain, and verified D1 data is retained. Do not redeploy or reactivate D2 for the next chat; this shutdown is complete. No public canonical source was changed by this experiment.

**D3: IN PROGRESS, not deployed or accepted.** The D3 source work is on draft #263: `experiments/p3/preview/src/d3-authoring-client.mjs` (same-origin session/CSRF and durable receipts), `d3-publication-lifecycle.mjs` (original idempotency key, no silent retries or storage of packages/credentials, status persistence), `d3-trusted-gear-kb-candidate.mjs` (sandbox-only source-aware text Gear edits and KB adds/edits, canonical/Markdown/conflict safeguards); gated opt-in `publishChange` in `pwa/src/editor.mjs`, and opt-in owner-authoring restrictions in `pwa/src/ui.mjs`. Production app `pwa/src/app.mjs` **does not activate `ctx.v3`**. The real trusted GitHub reader, generic sandbox Gear/KB PR/runner, same-origin Connection Status sign-in UI and end-to-end D3 tests **are not yet implemented or deployed**. D3's earlier isolated test failure was fixed; exact-head **CI #467 passed**. [D3 checkpoint](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D3_OWNER_AUTHORING_START_2026-10-26.md).

**NEXT ACTIVE WORK:** Finish **D3**, without an approval stop for routine source/CI work: implement a trusted immutable private-sandbox snapshot loader, securely connect source-aware Gear/KB add/edit candidate to guarded idempotent D1 + GitHub PR/check/merge + actual hosted proof, implement Connection Status-only owner sign-in/restore/Sign out and real `Save and Publish` UI with durable status after navigation, verify anonymous/unauthorized/deep-link denial, conflict/expired/offline/ambiguous-save behavior, and run Windows + Android installed-PWA integration tests. Keep privileged runtime gates off until specific live authorization/security checks; do not expose private tokens. Move next to **D4** uploads and Catch editing, **D5** offline/Connection Status/viewer/release reliability, **D6** integrated acceptance and separately approved production cutover. The owner approved using intended production Cloudflare infrastructure rather than building a separate preview website, accepts temporary downtime, but **not public-main writes, bypass, data loss, unverified Live claims or an unapproved final cutover**. No new per-save owner signing ceremony.

**Other Fishing work:** Do not discard existing unresolved equipment, kayak/Force Current commissioning, purchase availability, catching and KB items elsewhere in this file and `Fishing_TODO.md`. Do not infer purchases, silently close active items or reopen completed v2 releases. The user requested this complete GitHub-based transfer and will copy the **entire canonical Bootstrap prompt**, not a short substitute.


## HISTORICAL Fishing Companion V3 handoff — October 25, 2026 PDT: D2 real-publisher gate

**This is the authoritative new top-level checkpoint.** The October 24 P3-29 “NEXT P3-30” block below is HISTORICAL and must NOT be followed. Continue D2, not an endless P3 subphase series.

**Verified before this documentation handoff (October 25, 2026 PDT):** public production main was 587b978118df64cc9ec584375c458fa2b10fecfa; private ginosega/fishing-p3-sandbox main was 69b236c8af663cdce687dc855bb117a01874060a; public draft [PR #263](https://github.com/ginosega/fishing/pull/263) was OPEN, DRAFT at f2673d2c3fc343c8ebce44c0e306429c8be387ab; owner-accepted AUTH-P0 [PR #262](https://github.com/ginosega/fishing/pull/262) was also OPEN/DRAFT; unrelated [PR #268](https://github.com/ginosega/fishing/pull/268) remains open and must be preserved. After this docs-only PR merges, re-read GitHub main/PRs/hosted deployment to establish NEW exact SHAs; these are pre-handoff observations.

**Actual live V2 application:** latest verified full Pages release remains [main workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320), source 4a1a8c44317b56a4d47e818db9cd2b5587a966d8, release 504d615b2bef361da06d655ee621d43a, 577 hosted files (100 Gear, 60 KB, 12 Catches). A documentation-only main merge does NOT publish a V3 build or establish a new release; verify this independently after merge. FISH115–117 remain released; FISH108 governs eligible content-only changes.

**Approved V3 experience:** anonymous access by default; only one owner signs in via a discreet link inside Connection Status; valid session restored automatically; Gear/KB/Catch Add/Edit; ONE Save and Publish without per-item approval/signature, source-aware conflict protection, direct Gear/KB/Knot image uploads (original bytes preserved), Catch without photos/GPS, Markdown Picture Viewer, persistent Automatic/Work Offline reading preference (NO offline publishing queue), honest Accepted/Live states, optional local drafts only if reliable, release coherence, accessibility and Android/Windows acceptance. The October 19 requirements, technical design and UX remain signed off; October 22 AUTH-P0/G1 feasibility accepted with documented seven-day-cookie/revocation/untested security/iOS exceptions, NOT broad V3 security waivers. Per-change owner ECDSA and independent attestor P3-40/41 are optional research and conflict with normal Save and Publish if made mandatory.

**Finite delivery roadmap approved October 25:** STOP generating open-ended P3-N milestones. D1 architecture consolidation is COMPLETE at design level; D2 real sandbox publishing is IN PROGRESS; D3 owner sign-in and Gear/KB editing UI; D4 integrated media and Catch editing; D5 offline/Connection Status/viewer/reliability; D6 final acceptance and production rollout. [Finite D1–D6 plan](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md), [D1 selected architecture](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md), [signed-off requirements audit](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D1_V3_Requirements_Compliance_Audit_2026-10-25.md). The owner APPROVED **production-first** development on the intended Cloudflare production host, accepting downtime, and explicitly declined a separate preview WEBSITE; first GitHub test WRITES must still target ONLY the private sandbox repo and isolated test paths/data, never canonical public main. Temporary downtime is acceptable; data loss and false Live claims are not.

**D2 latest source recovery:** After a previous assistant turn was interrupted, the draft retained ~30 source commits. [D2 recovery, durable merge barrier and real-operation gate](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/D2_Interrupted_Run_Recovery_and_Operational_Gate_2026-10-25.md) reconciles them. D2 now has AUTH-P0-compatible session+HMAC CSRF guarded API, D1 Accepted/idempotency/status, Worker-compatible private sandbox immutable source-aware Gear edit validator, read-only Pages gateway, sandbox-scoped App token adapters, draft PR / exact-head checks / normal merge adapters, isolated test-asset loader, default-OFF scheduled coordinator and a **durable D1 markMergeAttempt write-ahead barrier**: ambiguous GitHub merge outcome must never be blindly retried. The latest [exact-draft CI #40221266389](https://github.com/ginosega/fishing/actions/runs/40221266389) on f2673d2c3fc343c8ebce44c0e306429c8be387ab passed **518/518** (80 PWA + 43 broker + 395 P3), including disabled Worker bundling/parity; this is **SOURCE-ONLY CI**. No live Cloudflare V3 publisher, Cron integration, real App/GitHub write, merged sandbox Gear change or actual production-origin hosted test bytes yet.

**D2 completion criterion and immediate next work:** Deliver ONE genuine owner-authorized private sandbox p3-test-rod Gear edit → durable D1 Accepted → immutable source-aware checks → sandbox draft PR → true latest-head validate-sandbox-head CI → normal merge with protections → byte-identical test-only asset served and verified at an isolated path on the intended production Cloudflare origin. Capture PR/base/head/check/merge SHA, release bytes/digest, persisted status and rollback. No second preview website. First conduct exact read-only provider/runtime inventory (App installed grants, private repo rules, current Cloudflare bindings/quotas, origin/service-worker behavior). Then require one **consequential owner approval** before provisioning/moving GitHub App PEM, binding secret/D1/cron, enabling write-capable Worker/route or making the first real sandbox write. Existing connected GitHub tools do not provide Cloudflare control-plane access; user may have to perform approved Cloudflare steps in their UI/terminal. Do NOT falsely label D2 COMPLETE because 518 tests passed. Continue D2 to its real finish line rather than pausing at routine internal source checkpoints.

**Operational safety:** Existing isolated D1 migrations R1–R4 were completed/reconciled (last verified seven tables, four indexes, five triggers; application tables empty at that time); do not reapply or restore them or expose a private recovery bookmark. The P3 command bridge and Access ingress Workers remain hard-disabled/unrouted with production/preview URLs OFF at the last verified postflight [#40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523). The live [GitHub-signed OIDC proof #40207347824](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40207347824) verified only its exact read-only manual workflow, not a future privileged publisher. Historical Access/App metadata evidence is not a deployed publishing proof. GitHub App PEM has write-capable authority; never place it in public source, logs, browser or GitHub Actions merely for convenience.

**New-chat handoff SOP:** This update is a **docs-only branch → PR → required GitHub checks → merge to public main**, never a V3 deployment. Update/reconcile all five root files: README.md, Fishing_Context.md, Fishing_TODO.md, Fishing_Decision_Log.md, Fishing_New_Chat_Bootstrap_Prompt.md. The owner opens the **full canonical Bootstrap Prompt on main and copies its ENTIRE contents**, including historical sections, into a new Fishing chat. No short handoff substitute. Historical headings below remain archival and any old “NEXT P3-30/R2” statements are SUPERSEDED.

---


## HISTORICAL Fishing Companion v3 / project transition — October 24, 2026 PDT (P3-29 CLOSEOUT)

**This is the authoritative latest snapshot.** The older "Current Fishing Companion v3 checkpoint — October 24 ... P3-18 R1" further below is **HISTORICAL**; its "NEXT: R2" direction has already been completed and must not be followed.

**Production and repository boundary (verified October 24 PDT / October 25 UTC):** public `ginosega/fishing` main was `3a3ea08057964f81d32375fe3e90503bcd9f0383` before this documentation-only handoff. The latest successful **actual hosted** production application remains [Full Application workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320), source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**. Later Markdown-only commits are *not* PWA releases. Current open PRs include unrelated [#268](https://github.com/ginosega/fishing/pull/268) (weight-section changes; preserve untouched), [#262](https://github.com/ginosega/fishing/pull/262) (P1 AUTH-P0, **DRAFT/UNMERGED**), and [#263](https://github.com/ginosega/fishing/pull/263) (FISH-TODO-118 P3, **DRAFT/UNMERGED**). Always recheck fresh main, open PRs and hosted evidence in the new chat.

**P3 sandbox and migration status:** private `ginosega/fishing-p3-sandbox`, repository ID `1430581407`, owner GitHub ID `265665562`, main after postdeployment lockout `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`. Isolated Cloudflare D1 `fishing-p3-sandbox` migrations **R1–R4 completed, reconciled** (7 tables, 4 indexes, 5 triggers); application tables were empty at the last confirmed checkpoint; **no authorized live application writes** since. Preserve private recovery bookmark and all secret values privately; never paste them into chat or GitHub. **Do not resume the historical R2/R3 approval step, rerun migrations or restore D1.** The separate public preview sentinel is read-only/anonymous: `/health` previously `{ok:true,ready:false,mode:"preview-no-publishing"}`; `/session` unauthenticated.

**Hard-disabled Workers and Access (verified):** `fishing-p3-command-bridge-sandbox` is the earlier isolated static-503 command sentinel, no public Production/Preview URLs, isolated D1 + encrypted HMAC bound but both `P3_WRITE_ENABLED=false` and `P3_COMMAND_BRIDGE_ENABLED=false`; independent [command postflight #40133925321](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40133925321) PASS. **`fishing-p3-access-ingress-sandbox`** is separately deployed with pinned **static-503 `ingress-disabled`** code, no D1, service binding, secret or route; exactly three plain-text false flags (`P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, `P3_COMMAND_BRIDGE_ENABLED`), Production and Preview URLs **OFF**. Owner-approved [deploy #40165892787](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165892787) and independent **fresh read-only [postflight #40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523)** PASS. The separately cancelled run [#40165850415](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165850415) stopped before its deployment step. The Wrangler deploy reported success and remote *settings* were verified; **remote script bytes were not independently retrieved/hashed**. Private [PR #15](https://github.com/ginosega/fishing-p3-sandbox/pull/15) retired the one-shot deploy workflow; only read-only `preflight`/`postflight` remain, default `postflight`. Keep both Workers unrouted and hard-disabled.

**Cloudflare Access trust:** exact ingress hostname `fishing-p3-access-ingress-sandbox.ginosega.workers.dev` protected by app `Fishing P3 Sandbox Ingress`, sole **Service Auth** policy `Fishing P3 GitHub Runner Only`, dedicated `Fishing P3 Sandbox GitHub Runner` service token, no Allow/Bypass/other identities. [Access metadata proof #40162761115](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40162761115) PASS; [live benign Hello World edge proof #40163736773](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40163736773) PASS (anonymous and invalid token denied 401/403; dedicated service token reached inert Hello World 200). That live test was **before** static-503 deployment, and does **not** prove active command ingress, service binding or D1 writes. Separate account/worker-scoped encrypted GitHub Actions tokens remain confidential; never request or expose values.

**Current decision and next work:** **P3-29 CLOSED** with fresh postflight. P3-25 HMAC trusted client / private transport seam, P3-26 Access RS256 JWT verifier and proposed command ingress, and native D1 acceptance are **source-tested only in draft PR #263**, not attached to deployed ingress. P3-29 approval covered *only* the disabled 503 deploy and is exhausted. **Next prospective P3-30 = source/design/security review only**, including actual Access issuer/AUD/service-token `common_name` verification, pinned-domain JWKS retrieval/rotation, GitHub owner/App provenance, exact HMAC URL/path, authenticated private Worker service binding, failure recovery and minimal permissions; any deployment, flag change, remote `Accepted` D1 write, synthetic PR, merge or publishing requires a fresh explicit approval. Do not activate `P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, or `P3_COMMAND_BRIDGE_ENABLED`, deploy command-capable code, alter existing preview/Workers, merge PR #262/#263, or change production without separately scoped approval. Approved v3 requirements/design/UX/staged plan and October 22 AUTH-P0/G1 acceptance-with-waivers remain binding; preserve FISH108 release lanes and other unrelated tasks.

**Canonical supporting evidence:** [P3-29 final deployment and lockout report](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_Disabled_Ingress_Deployment_2026-10-24.md) and [detailed P3 handoff](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_New_Chat_Handoff_2026-10-24.md) exist only on unmerged draft PR #263, **not main**. The reviewed immutable disabled-ingress source is commit `5df060076ca3cd010727fc9162b33bf03c157790`, blob `8f28f4e1d610fe549388308223bf3e6aa58af1a7`; CI source [#40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871) passed 327/327. Re-read these documents only for detailed P3 evidence; the **five canonical root markdown files** are the transition authority after this docs-only reconciliation.

**Standard new-chat transfer:** Update/cross-check these five canonical root files, merge the docs-only PR into `main` without publishing PWA assets, then open **the entire** [Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md), copy **all** its contents into a new Fishing Chat, and continue there. Do *not* use only a short auxiliary handoff.

---

## HISTORICAL Fishing Companion v3 checkpoint — October 24, 2026, P3-18 R1 (superseded by P3-29)

**Authority and scope:** Reconstructed from the owner-accepted October 22 AUTH-P0 feasibility closeout, the current draft [PR #262](https://github.com/ginosega/fishing/pull/262) and [PR #263](https://github.com/ginosega/fishing/pull/263), the GitHub production/sandbox repository state, the owner-reported October 24 R1 evidence, and the [P3-18 R1 final report](https://github.com/ginosega/fishing/blob/4e5f084a8be0f766b157d021a8346710dc38f85a/experiments/p3/preview/P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) on the **draft P3 branch**. Later dated evidence in this section supersedes historical October 12/19/21 statements below. Keep experimental branches draft and unmerged.

- **Production:** `ginosega/fishing` `main` at `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`; latest successful [main Full Application workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320) (October 23), production release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**; exact-source Pages/hosted verification, including browser acceptance, passed. This documentation update is **not a PWA deploy**. FISH115–117 v2 releases remain complete. FISH117 owner's subjective visual/mobile speed acceptance is **not recorded**.
- **Open experiments:** [PR #262](https://github.com/ginosega/fishing/pull/262) AUTH-P0 and [PR #263](https://github.com/ginosega/fishing/pull/263) FISH118/P3 remain **OPEN, DRAFT, UNMERGED**. No v3 application UI, live publishing, or production cutover. **FISH-TODO-118 is allocated to this work**, not the next unused ID; allocate a new application ID only after inspecting current TODO/source.
- **P1 AUTH-P0/G1:** **OWNER-ACCEPTED/CLOSED WITH EXCEPTIONS on October 22**, not still awaiting its original feasibility decision. The owner approved the **same-origin Cloudflare gateway architecture in principle** after Windows/Android real installed-PWA OAuth reentry, session restoration/revoke-all and offline use. The seven-day absolute Secure HttpOnly D1 session, local Sign out/Revoke all and **no GitHub-side revocation webhook** were accepted; an externally revoked GitHub authorization may leave a current app session valid until local revoke or seven-day expiry. Live negative/expiry tests, provider metrics and independent two-origin byte-comparison were **waived/not verified**, not passed; iOS unavailable/not tested. Subsequent implementation/release acceptance and any new production origin/cutover remain separate approval gates. [Final G1 decision](https://github.com/ginosega/fishing/blob/081af3c0a5e6eff4cea04c8fc1a26688f7445bf1/experiments/auth-p0/AUTH_P0_G1_Final_Decision_and_Waivers_2026-10-22.md) is on draft PR #262, not `main`.
- **P3 approved scope and real sandbox:** Cloudflare **Free** disabled Worker `fishing-p3-sandbox-preview` on `https://fishing-p3-sandbox-preview.ginosega.workers.dev`, isolated D1 `fishing-p3-sandbox`; separate **private** `ginosega/fishing-p3-sandbox`, GitHub repository ID **1430581407**, `main` `e37db3b18bd9948bf4453d7f885f868e830a9a9a`, and dedicated sandbox-only GitHub App. The owner reported a successful HTTP 200 *Contents-read-only* installation-token/identity diagnostic, then removal of its temporary diagnostic key. No GitHub write-path proof or publication route is enabled; `P3_WRITE_ENABLED=false`. No App authorization for `ginosega/fishing`. Secrets, Cloudflare account/D1 identifiers, private configurations and Time Travel bookmarks must **never** be placed in chat or GitHub.
- **P3 progress:** P3-0 broker/real canonical validator, scoped sandbox App read probe, source security/operation tests, P3-3 durable D1/session foundation and subsequent sandbox/CI/migration safety design have progressed on draft PR #263. The **P3-17 actual Wrangler 4.152.0 local rehearsal of unchanged canonical 0001, 0002, 0003 is complete** (staged individually, local ledger 3 entries, six tables/three indexes/five triggers, FK clean). Isolated source and full PR validation on current P3 head are recorded as successful; **tests do not prove active publishing**.
- **P3-18 remote sandbox migration R1: COMPLETED/VERIFIED October 24.** After guarded isolated-target/unchanged-source checks and private fresh recovery bookmark, the owner approved Wrangler's interactive preview listing **only `0001_initial.sql`**, and Wrangler executed it successfully. Remote `d1_migrations` ledger now has **exactly 0001**; original three P3 tables/three indexes are unchanged; all three application tables have zero rows; FK check clean. Hosted anonymous `GET /health`: `{ok:true,ready:false,mode:"preview-no-publishing"}`; `GET /session`: `{authenticated:false,authorized:false}`. **R1 is closed; do not repeat it or disclose/restore from the bookmark.** [Detailed R1/R2 gate and owner evidence](https://github.com/ginosega/fishing/blob/4e5f084a8be0f766b157d021a8346710dc38f85a/experiments/p3/preview/P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) are on draft PR #263.
- **NEXT: review R2 ONLY, no automatic migration.** `0002_durable_snapshot_and_audit.sql` would add **one `p3_requests` table + three audit/transition triggers**. It needs **new explicit owner approval**, fresh exact-target/schema/zero-row/hash preflight and private Time Travel bookmark, and a restricted Wrangler migration directory with **only 0001+0002**. Pending preview must show **only 0002**. Successful R2 postflight would have ledger 0001+0002, **four tables/three indexes/three triggers**, FK clean, zero unexpected data, Worker still disabled. **R3 (`0003_ci_observation_recovery.sql`) requires an independent later approval**, as do new Worker deployment, sandbox GitHub write/merge, PR #262/#263 merge, `P3_WRITE_ENABLED` change and production v3 cutover. No automatic remote D1 restore.
- **Other project tracks:** Preserve `FISH-TODO-040` owned Garmin Force Current/Redodo 24V system commissioning, kayak removable motor/battery/pedals installation and hard-plastic bin with protected foam fit; open `FISH-TODO-008` under-seat tackle tray, `014` KastKing box watch and all outstanding fishing/KB/research tasks. Never infer purchase or closure. Normal Gear/KB/Catch content remains under FISH108 Fast Content Release.

**New chat procedure:** Restore these five root files and live `main`/PRs/deployed evidence; next read [P3-18 R1/R2 gate](https://github.com/ginosega/fishing/blob/4e5f084a8be0f766b157d021a8346710dc38f85a/experiments/p3/preview/P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) from draft PR #263, not `main`, and review the *R2 approval decision* before any remote write. Chat mode by default; preserve all past signed-off v3 requirements/design/UX/plan and separate permission/cutover gates.

---

## Historical Fishing handoff — October 21, 2026

**Purpose:** The owner requested a fresh Fishing Chat after successful FISH117 production release. The repository and its actual latest `main` are the durable authority; all older October 12/19 snapshots below are historical, not the current production identity.

- **Pre-handoff `main`:** `c42d0e737151608b53ffd0de6fa29dbbd76eba32`; **zero open PRs**; no outstanding application release or deploy job. This new documentation-only handoff PR will advance `main` without republishing the PWA.
- **Latest successful actual hosted deployment:** Full Application [workflow #543](https://github.com/ginosega/fishing/actions/runs/39690549053), source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, production release `131ebca9c6d46fa1c1d815ad43a318f6`, **577 verified files; 100 Gear / 60 KB / 12 Catches**. Pages publication, hashed-byte identity, Chromium/WebKit application/offline acceptance and hosted browser verification succeeded.
- **FISH117 completed:** [PR #258](https://github.com/ginosega/fishing/pull/258) compresses **16 fixed page icons** (128px WebP derivatives from original 1254px PNGs) and **two scenic headers** (responsive WebP), keeping full original PNGs untouched in GitHub. **17,090,051 original source bytes → 253,660 shipped derivative bytes**, a **98.5% static-artwork byte reduction**, not a measured user speed improvement. PR #259 fixed only a WebKit second-offline-reload test fixture after initial production [run #541](https://github.com/ginosega/fishing/actions/runs/39685562142) failed validation; final #543 passed. The user explicitly waived pre-release visual/performance/device tests and will check appearance and speed on production; **owner verification is not yet recorded**. [Release report](pwa/docs/Fishing_Companion_FISH117_Static_Artwork_Optimization_2026-10-21.md).
- **Other completed v2 P0 improvements:** FISH115 Gear/KB image thumbnails with originals retained and compatible dependency security patches (PR #252); FISH116 stale-session release transition (PR #254), automatic coherent current-release reload for clean tabs, preserves unsaved edits; no prior-release online asset retention. P0-C Android external Chrome Custom Tab behavior accepted, no fix required.
- **v3:** Requirements, technical design, UX and staged implementation plan are approved. **AUTH-P0 / P1**, secure single-owner GitHub sign-in, installed-PWA return and persistent-session feasibility, is the next unresolved hard gate. Do not provision a new GitHub App/provider, service, credentials, permissions or cost without the separate owner decisions specified by the approved plan; v3 production cutover also requires separate authorization. **Next unused application task ID is FISH-TODO-118**. Routine eligible canonical content remains FISH108 Fast Content Release. All other active equipment, research and KB TODOs remain open unless explicitly completed.
- **New-chat entry point:** [Fishing_New_Chat_Bootstrap_Prompt.md](Fishing_New_Chat_Bootstrap_Prompt.md). Read the five canonical files in order, recheck actual latest `main`, open PRs and production, then proceed with the owner's next request in **Chat mode**, without repeating previous planning approvals.

---

Persistent Fishing project and source repository for Fishing Companion.

**October 19, 2026 — v3 approvals and full handoff checkpoint:** The [v3 requirements](pwa/docs/Fishing_Companion_v3_Requirements.md), [technical design](pwa/docs/Fishing_Companion_v3_Technical_Design.md), [UX](pwa/docs/Fishing_Companion_v3_UX_Review.md), and [staged implementation plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) are **all separately APPROVED**. The plan's [approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md) records the user's caveat: **perform this full new-chat handoff before beginning P0/any implementation**. No app code, hosting, authentication setup or deployment was changed here. The [bootstrap prompt](Fishing_New_Chat_Bootstrap_Prompt.md) is the starting point for the new Chat conversation; actual latest main and production must be reverified there.

**Latest verified published PWA as observed during handoff:** workflow **#520** / run **38686171921**, `main` source SHA `4fc893d044b72e61fbc36cfd82103af55bc36f97`, hosted release `f5eab01e9d5af6101f03a7094de5b565`, **100 Gear / 60 KB / 12 Catches, 431 files, hostedBytesMatch=true** (October 15, 2026 UTC). Latest `main` when beginning handoff: `7cc7eea06a110e041dbf552855957713df4b1c51`, 0 open PRs. Subsequent documentation-only handoff merge advances `main` but **does not deploy**. These are historical as-of-checkpoint facts; recheck them in new chat.

## Previous continuation checkpoint — October 12, 2026 (historical)

`ginosega/fishing` is the durable source of truth. Fishing Companion remains a three-domain PWA with canonical source under `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`.

Always restore actual latest `main`, current open PRs, and the latest successful production evidence before relying on exact SHA/release/count values. Historical checkpoint identifiers in project Markdown are evidence only.

### October 12 verified production checkpoint

- production source revision: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`;
- latest source change: add the **September 24, 2026 Banks Lake representative picture** to the Banks Lake Location record (PR [#228](https://github.com/ginosega/fishing/pull/228));
- production workflow: **#517** / run `38207507318`, **Fast Content Release**;
- hosted release ID: `0f4bd1f9e9e12b2b1981d61b48e3e501`;
- hosted counts: **Gear 100 / KB 60 / Catches 12**; hosted files: **431**;
- exact-current-main guard, Pages publication and hosted byte/release-identity verification passed: `hostedBytesMatch: true`;
- **PR #228 is merged; open PRs: 0** at the start of this reconciliation.

This October 12 handoff only changes the five root project Markdown files. These documentation-only changes **do not publish the PWA**; after merging the handoff, `main` can be ahead of the production source revision. For the next task, always recheck actual current `main`, open PRs and latest successful hosted verification rather than assuming these identifiers are current.

## Current application state

FISH114 — Android/Edge maskable launcher icon — remains the latest completed application/architecture change and is **implemented, production-verified, user-verified, and closed**. The approved transparent `pwa/icon.png` remains unchanged; the production build generates the opaque maskable variant.

FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture task ID is **FISH-TODO-115** unless newer `main` allocates it. Routine FISH108 content work does not consume application IDs.

## Recent canonical content state

Since the September 18 handoff, routine content work has added or reconciled:

- five **Banks Lake catches from September 24, 2026**, each with a Catch record, picture and Notes Markdown;
- the **Lake whitefish** Species KB entry and picture;
- the 12-inch smallmouth, 14-inch largemouth and 8-inch Lake whitefish catches linked to **Z-Man Ned Rig Kit**;
- the 15-inch and 14-inch smallmouth catches linked to **Berkley PowerBait Power Jerk Shad**;
- updated **Z-Man Ned Rig Kit** specifications;
- **ZMan Finesse ShadZ**, **ZMan Trick ShotZ**, and **ZMan TRD GobyZ**, including pictures and Drop Shot Notes links;
- **Blue Fox Flash Spinner** and **Bad River Tackle Company Trout/Panfish Spinners**;
- retirement of the old generic/South Bend inline-spinner Gear item and cleanup of its live KB link;
- **VMC Swimbait Jig** Notes;
- Banks Lake inline-image filename/case and Markdown formatting cleanup;
- Berkley PowerBait Power Jerk Shad Notes wording cleanup;
- Pflueger President Spincast Combo rod/reel content and reel-capacity updates.
- Electronics Research previously covered motor/battery research; **its current Notes were refocused on chart plotters and fish finders** on October 9.
- October content releases added/updated Flutter Spoon guidance, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko, and the Sixth Sense/Berkley lure pictures.

Current canonical source, not this summary, controls exact record values.

## October 8–12 canonical content reconciliation

The following content changes are **implemented, merged and hosted-verified**, not outstanding application tasks:

- **PR #221:** two orange YakAttack Gear items — Fully Loaded TracPak Combo Kit and 10L Roll-Top Drybag with Air Valve; both use previously uploaded PNGs.
- **PRs #222–224:** Garmin Force Current with Power Steer Foot Pedals Gear entry, illustrated component Notes, and corrected display name. Current Gear ID remains `garmin-force-current-kayak-trolling-motor-with-power-steering-foot-pedals`.
- **PR #225:** `electronics-research` is now **Electronics Research**, with a new representative PNG; its Notes cover **chart plotters/fish finders**. Earlier motor and battery research sections were removed from this page. Do not restore them solely because prior handoff documents mentioned them.
- **PR #226:** detailed **Lake Stevens** kayak-fishing Location page, including North Cove/Davies Beach launches, bass/perch/trout/kokanee strategies, tackle from My Gear, seasonal patterns and regulations. It has no representative picture; one was not requested.
- **PR #227:** expanded Garmin Force Current Notes with a maintenance checklist and component links/three inline pictures; the canonical Gear metadata and picture were unchanged.
- **PR #228:** Banks Lake Location representative picture `KB/Locations/assets/2026-09-24 Banks Lake, WA.png`, using the uploaded PNG without altering it. This was the release interrupted in ChatGPT, but it **subsequently passed PR validation, merged and deployed** in production run #517.

Current canonical source has **100 Gear / 60 KB / 12 Catches**, including **10 Location** KB entries. The published application has no new architecture/feature work from these releases. Keep all source-aware validation, fast-release and ownership rules unchanged.

## Current RVR119 motorization / commissioning

The motorization purchase decision is complete. On **October 6, 2026**, the user purchased a used **Garmin Force Current with Power Steer wireless foot pedals** for the Bonafide RVR119.

Purchased package:

- Garmin Force Current trolling motor;
- Garmin Power Steer wireless foot pedals;
- Garmin handheld remote and MOB tag;
- **Redodo 24V 50Ah LiFePO4 battery** and Redodo charger;
- Garmin high-efficiency propeller and weedless propeller;
- total purchase price: **$2,800** from the seller in Gresham, Oregon.

The seller supplied the original **July 2026 Garmin receipt**. Garmin support confirmed directly to the user that the remaining three-year standard warranty will be honored with that original receipt. The motor has never been used in saltwater.

### Active commissioning work

FISH-TODO-040 remains OPEN, but its purpose has changed from purchase research to commissioning and RVR119 integration. Current work is to:

- clean and inspect the motor, mount, shaft, rope, connectors, props and sacrificial anodes without invasive disassembly;
- fully charge and baseline the Redodo battery/charger;
- clear prior-user navigation data and restore Garmin factory defaults;
- reset/re-pair the remote, both Power Steer pedals and MOB tag as applicable;
- update the motor, remote and pedals through Garmin/ActiveCaptain;
- calibrate the Power Steer pedals and handheld remote;
- after installation on the RVR119, perform the required on-water compass/bow-offset calibration and full functional test;
- preserve the Garmin requirement for a 40A protected power feed and never run the propeller out of water.

### Storage case search

The user is actively looking for a **hard-plastic storage case/bin** for the motor and pedals. Durable requirements:

- minimum usable **internal dimensions: 38 × 18 × 8 in**;
- snug/compact fit strongly preferred;
- **orange preferred** if available;
- hard plastic is required; flexible storage bags are rejected;
- a heavy/expensive Pelican/Otter-style case is unnecessary;
- the previously considered Hyper Tough 50-gallon tote is too large.

### Storage-case cushioning and fit — current exploration

The current discussion concerns a **48 × 19 × 14 in lidded hard-plastic bin** for the motor and pedals. Its **actual usable interior dimensions and purchase/ownership status are not independently confirmed**; the old minimum **38 × 18 × 8 in usable interior** remains the fit requirement until measurements confirm otherwise. The user is considering a custom cushioning insert. Cut **closed-cell EVA or polyethylene foam** is the safer reusable baseline. Construction **Fireblock/Gaps & Cracks** spray foam is too firm/unpredictable for direct equipment cushioning; flexible Window & Door foam is only a cautious sample experiment, not an approved permanent solution. Never apply expanding foam to the motor or pedals directly, and do not compromise connectors/shaft/controls or trap water.

The Newport LoPRO battery remains an interesting form factor for future packaging, but the currently owned propulsion battery is the Redodo 24V 50Ah LiFePO4.

## Science of the Strike research

Recent transcript reviews covered:

- largemouth vision;
- scent and taste;
- barometric pressure and lunar cycle;
- crawfish;
- dissolved oxygen and turbidity.

When turning these into Fishing Companion content, preserve the distinction between study evidence and host inference. Avoid converting single-study values or host extrapolations into universal rules. Potential additions belong primarily in Bass Behavior and Habitat, Bass Fishing Techniques, seasonal pages and Electronics Research according to the existing editorial ownership model.

## Release model

FISH108 establishes two release lanes. Full policy: [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

- **Fast Content Release:** only when every changed repository file is under `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`.
- **Full Application Release:** any change outside those roots that can affect application/runtime behavior.
- Documentation-only project-state reconciliation does not publish the PWA.

Routine source-aware content releases do not consume an application task ID or require per-item closeout documents. Preserve unrelated/newer source changes and user-uploaded binary bytes.

## Durable product/editorial behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**, producing `fishing-companion-change-v2`; the browser does not write GitHub directly.
- FISH091: ordinary online use does not provision the complete offline library; **Connection Status → Update offline library** explicitly prepares/refreshes it.
- FISH096: Knot-only ordered `pictureSequence`; frames live under `pwa/KB/Knots/assets/<id>/`.
- FISH102: Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- FISH103: external HTTP(S) links open in a new tab; internal/local links remain same-tab; authoring upload links use physical `/pwa/...` paths.
- FISH107: Skylety Fishing Hook Sharpener canonical type is `Tools`.
- Broad Behavior/Habitat pages answer **where fish are and why**; broad Fishing Techniques pages answer **how to catch them once located**; detailed seasonal strategy belongs in Spring/Summer/Fall/Winter Fishing.
- Same-page Markdown links target renderer slugs: lowercase, punctuation removed, spaces converted to hyphens.

## Project continuation

Chat mode is the permanent default. At the start of a new chat, restore actual latest `main`, confirm open PR state, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

When the user says **“It’s time to transfer to a new chat”**, ask once to confirm the full handoff, then reconcile repository/production state, update durable records, preserve unresolved work and purchase uncertainty, cross-check the files, and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

`.github/workflows/fishing-production.yml` is the sole active production publisher.
