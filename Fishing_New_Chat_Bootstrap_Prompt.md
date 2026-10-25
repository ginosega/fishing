You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from actual latest `main` before acting; do not rely on an old chat or assume a previously observed commit/release is still current.

## CURRENT NEW-CHAT START — October 24, 2026 PDT, after P3-29 disabled-ingress deployment and independent postflight

**THIS SECTION IS CURRENT AND REPLACES THE HISTORICAL OCTOBER 24 R1/R2 START BELOW.** You are continuing my persistent **Fishing** project. I have copied the **entire canonical `Fishing_New_Chat_Bootstrap_Prompt.md`**, not an abbreviated handoff, into this chat, according to our established standard process. Use Chat mode by default. Do not treat earlier dated checkpoints or chat summaries as the latest repository state.

### Mandatory restore and verification

1. Read the actual latest `main` contents of **all five root records in order**: `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, and **this full Bootstrap Prompt**. This handoff was prepared as documentation-only, then merged to main. Recheck latest main, required GitHub status and production release evidence before repository work.
2. Verify open PRs: unrelated [#268](https://github.com/ginosega/fishing/pull/268) (weight section), **DRAFT #262** P1 AUTH-P0 (owner-accepted G1 with explicit feasibility waivers), and **DRAFT #263** FISH118 P3 (source-only experiments and complete run reports). Do not merge either v3 PR or alter #268. Confirm sandbox repo `ginosega/fishing-p3-sandbox` private main, currently `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05` after PR #15 lockout, separately from public production main.
3. Review the authoritative P3-29 closeout/evidence [report](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_Disabled_Ingress_Deployment_2026-10-24.md) and optional [detailed P3-29 transition log](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_New_Chat_Handoff_2026-10-24.md) **ON DRAFT PR #263**, not main. The canonical five root files and current GitHub checks govern this transition; old bootstrap's R2 "NEXT" is historical.
4. **Do not repeat completed work** or ask for approval of previously signed-off requirements/design/UX/staged implementation plan, AUTH-P0/G1 waiver decision, D1 R1–R4 migrations, Access policy tests, or P3-24/P3-29 disabled deployments. Do not rerun pre-deploy `preflight` on the ingress, which now has three disabled flags and intentionally fails the zero-bindings preflight condition.

### Verified current production and P3 state

**Production and repository boundary (verified October 24 PDT / October 25 UTC):** public `ginosega/fishing` main was `3a3ea08057964f81d32375fe3e90503bcd9f0383` before this documentation-only handoff. The latest successful **actual hosted** production application remains [Full Application workflow #672](https://github.com/ginosega/fishing/actions/runs/39990546320), source `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`, release `504d615b2bef361da06d655ee621d43a`, **577 hosted files / 100 Gear / 60 KB / 12 Catches**. Later Markdown-only commits are *not* PWA releases. Current open PRs include unrelated [#268](https://github.com/ginosega/fishing/pull/268) (weight-section changes; preserve untouched), [#262](https://github.com/ginosega/fishing/pull/262) (P1 AUTH-P0, **DRAFT/UNMERGED**), and [#263](https://github.com/ginosega/fishing/pull/263) (FISH-TODO-118 P3, **DRAFT/UNMERGED**). Always recheck fresh main, open PRs and hosted evidence in the new chat.

**P3 sandbox and migration status:** private `ginosega/fishing-p3-sandbox`, repository ID `1430581407`, owner GitHub ID `265665562`, main after postdeployment lockout `bf9bf2f4b4c0e1dc347cdd2bab58b28f1dc69d05`. Isolated Cloudflare D1 `fishing-p3-sandbox` migrations **R1–R4 completed, reconciled** (7 tables, 4 indexes, 5 triggers); application tables were empty at the last confirmed checkpoint; **no authorized live application writes** since. Preserve private recovery bookmark and all secret values privately; never paste them into chat or GitHub. **Do not resume the historical R2/R3 approval step, rerun migrations or restore D1.** The separate public preview sentinel is read-only/anonymous: `/health` previously `{ok:true,ready:false,mode:"preview-no-publishing"}`; `/session` unauthenticated.

**Hard-disabled Workers and Access (verified):** `fishing-p3-command-bridge-sandbox` is the earlier isolated static-503 command sentinel, no public Production/Preview URLs, isolated D1 + encrypted HMAC bound but both `P3_WRITE_ENABLED=false` and `P3_COMMAND_BRIDGE_ENABLED=false`; independent [command postflight #40133925321](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40133925321) PASS. **`fishing-p3-access-ingress-sandbox`** is separately deployed with pinned **static-503 `ingress-disabled`** code, no D1, service binding, secret or route; exactly three plain-text false flags (`P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, `P3_COMMAND_BRIDGE_ENABLED`), Production and Preview URLs **OFF**. Owner-approved [deploy #40165892787](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165892787) and independent **fresh read-only [postflight #40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523)** PASS. The separately cancelled run [#40165850415](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165850415) stopped before its deployment step. The Wrangler deploy reported success and remote *settings* were verified; **remote script bytes were not independently retrieved/hashed**. Private [PR #15](https://github.com/ginosega/fishing-p3-sandbox/pull/15) retired the one-shot deploy workflow; only read-only `preflight`/`postflight` remain, default `postflight`. Keep both Workers unrouted and hard-disabled.

**Cloudflare Access trust:** exact ingress hostname `fishing-p3-access-ingress-sandbox.ginosega.workers.dev` protected by app `Fishing P3 Sandbox Ingress`, sole **Service Auth** policy `Fishing P3 GitHub Runner Only`, dedicated `Fishing P3 Sandbox GitHub Runner` service token, no Allow/Bypass/other identities. [Access metadata proof #40162761115](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40162761115) PASS; [live benign Hello World edge proof #40163736773](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40163736773) PASS (anonymous and invalid token denied 401/403; dedicated service token reached inert Hello World 200). That live test was **before** static-503 deployment, and does **not** prove active command ingress, service binding or D1 writes. Separate account/worker-scoped encrypted GitHub Actions tokens remain confidential; never request or expose values.

### Security and next action

**Current decision and next work:** **P3-29 CLOSED** with fresh postflight. P3-25 HMAC trusted client / private transport seam, P3-26 Access RS256 JWT verifier and proposed command ingress, and native D1 acceptance are **source-tested only in draft PR #263**, not attached to deployed ingress. P3-29 approval covered *only* the disabled 503 deploy and is exhausted. **Next prospective P3-30 = source/design/security review only**, including actual Access issuer/AUD/service-token `common_name` verification, pinned-domain JWKS retrieval/rotation, GitHub owner/App provenance, exact HMAC URL/path, authenticated private Worker service binding, failure recovery and minimal permissions; any deployment, flag change, remote `Accepted` D1 write, synthetic PR, merge or publishing requires a fresh explicit approval. Do not activate `P3_WRITE_ENABLED`, `P3_INGRESS_ENABLED`, or `P3_COMMAND_BRIDGE_ENABLED`, deploy command-capable code, alter existing preview/Workers, merge PR #262/#263, or change production without separately scoped approval. Approved v3 requirements/design/UX/staged plan and October 22 AUTH-P0/G1 acceptance-with-waivers remain binding; preserve FISH108 release lanes and other unrelated tasks.

**Engineering proof caveat:** source CI P3-29 passed 327/327 [#40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871), approved deployment [#40165892787](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40165892787) plus fresh independent postflight [#40166553523](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40166553523) passed. The new ingress is still static 503 and nonpublic. `p3-access-jwt-verifier.mjs` and `p3-access-ingress.mjs` remain **source-only future code** and are NOT running in Cloudflare. HMAC signer and local D1 acceptance tests are not proof of a live request, GitHub write or active publisher.

**Current project threads beyond v3:** maintain open FISH-TODO-040 RVR119 Garmin Force Current/24V Redodo battery, power-steering pedals, under-seat battery wiring/protection, foam-lined motor storage case and on-water setup; under-seat tackle tray FISH-TODO-008 remains backordered/unpurchased; KastKing deep box FISH-TODO-014 remains open; preserve other still-open gear, KB, fishing research and Science of the Strike standards below. FISH115/116/117 deployed, FISH108 governs eligible content changes, and the user's subjective FISH117 appearance/speed acceptance was not explicitly recorded.

**What to do in this new chat:** first acknowledge repository restoration and the confirmed P3-29 closure; then proceed with **P3-30 source-only security design and prerequisites**, checking current draft code against actual Worker/Access limits. Seek fresh explicit approval for any new provisioned credentials, deployed ingress routing/service bindings, write flags, live sandbox D1 `Accepted` operation, GitHub PR publishing or production release. Avoid background promises. Keep all PWA anonymous-default/single-owner, no-Catch-photo and approved UX constraints.

**Canonical supporting evidence:** [P3-29 final deployment and lockout report](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_Disabled_Ingress_Deployment_2026-10-24.md) and [detailed P3 handoff](https://github.com/ginosega/fishing/blob/feature/fish118-p3-mock-publisher/experiments/p3/preview/P3_29_New_Chat_Handoff_2026-10-24.md) exist only on unmerged draft PR #263, **not main**. The reviewed immutable disabled-ingress source is commit `5df060076ca3cd010727fc9162b33bf03c157790`, blob `8f28f4e1d610fe549388308223bf3e6aa58af1a7`; CI source [#40164090871](https://github.com/ginosega/fishing/actions/runs/40164090871) passed 327/327. Re-read these documents only for detailed P3 evidence; the **five canonical root markdown files** are the transition authority after this docs-only reconciliation.

---

## HISTORICAL NEW-CHAT START — October 24, 2026, after isolated P3-18 R1 success

**Read this current section first. The October 21 and earlier headings below are historical.** The owner asked this chat to reconstruct October 21/23/24 context and update GitHub's five canonical root files before resuming v3. Continue in Chat mode with the approved v3 requirements, technical design, UX and staged plan; do not re-request their sign-offs.

## HISTORICAL Fishing Companion v3 checkpoint — October 24, 2026 (P3-18 R1)

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


## HISTORICAL NEW-CHAT START — October 21, 2026, after FISH117 production closeout

**This is the authorized continuation of the user's Fishing project after requesting a new chat.** The owner approved Fishing Companion v3 requirements, technical design, sign-in/edit/publish/Connection Status UX and staged P0–P8 plan on October 19. All these approvals **remain valid**. P0 analysis and the early v2 reliability/performance maintenance packages have subsequently been implemented and released; **do not restart P0 or ask for earlier approvals**. Read the five files listed in **First actions** and freshly inspect GitHub state before acting.

### Verified GitHub and hosted baseline as of October 21

- **Pre-handoff latest `main`:** `c42d0e737151608b53ffd0de6fa29dbbd76eba32`, with **zero open pull requests**. The documentation-only handoff PR created after this checkpoint will advance `main` **without deploying new PWA bytes**. Always recheck latest actual `main` and open PRs upon starting the new chat.
- **Latest successful main production workflow:** [Full Application run #543](https://github.com/ginosega/fishing/actions/runs/39690549053), source revision `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, **completed successfully** with build/source validation, Chromium/WebKit preview + production-root browser acceptance, Pages deployment, actual hosted file-byte and manifest/release-identity checks.
- **Live PWA:** https://ginosega.github.io/fishing/ · hosted release ID `131ebca9c6d46fa1c1d815ad43a318f6`; manifest **577 files / 100 Gear / 60 KB / 12 Catches**. [Exact hosted evidence](https://github.com/ginosega/fishing/actions/runs/39690549053/artifacts/12388114804). A historical failed main [run #541](https://github.com/ginosega/fishing/actions/runs/39685562142) was a WebKit second offline-reload fixture edge; corrected by PR #259, then successful PR run #542 and main deployment #543. **No unresolved deployment incident** or open release PR remains at the checkpoint.
- **Completed FISH115:** [PR #252](https://github.com/ginosega/fishing/pull/252) released manifest-verified Gear/KB card WebP thumbnails, retaining canonical original media for detail/viewer, and necessary compatible dependency security patches.
- **Completed FISH116 / P0-A:** [PR #254](https://github.com/ginosega/fishing/pull/254) released a verified coherent current-release transition for stale clean tabs. Existing unsaved editor content is protected. New releases supersede older Pages assets; do **not** reintroduce older online asset retention. Owner reproduced original icon failure on held Windows Edge tab (old-release 404s, service-worker 503s) and approved fix; it passed main production #535 and subsequent full #543. Android/iOS field acceptance remains unperformed.
- **Completed FISH117:** [PR #258](https://github.com/ginosega/fishing/pull/258) made **16** canonical 1254×1254 card icons and **2** scenic hero PNGs into **small generated, transparency-safe WebP display images** shipped instead of the big originals; source PNGs remain intact. [PR #259](https://github.com/ginosega/fishing/pull/259) corrected *only* a WebKit browser-fixture issue without runtime image/JS changes. Build source static artwork total **17,090,051 bytes → 253,660 output bytes (98.5% fewer static asset bytes)**, not 98.5% faster page loads. User **explicitly waived pre-release visual/device/performance tests**, authorized direct v2 release and **will inspect the live site personally**; **do not claim user appearance or device-speed approval yet**. [Detailed release report](pwa/docs/Fishing_Companion_FISH117_Static_Artwork_Optimization_2026-10-21.md).
- **P0-C:** User accepted normal Chrome Android installed-PWA external-link opening in a Chrome Custom Tab; no workaround or v2 fix. **Do not confuse this with AUTH-P0 installed-PWA OAuth reentry**, which is still open.
- **Next unused application/architecture task ID:** **FISH-TODO-118**. Regular eligible Gear, KB and Catch source-aware content uses FISH108 Fast Content Release and does not allocate architecture IDs.

### Next v3 work: P1 AUTH-P0 feasibility gate, not production cutover

The next unresolved architecture dependency in the [approved staged plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) is **AUTH-P0**: assess secure owner-only GitHub login via GitHub App plus minimal trusted publishing broker, real desktop and *installed Android/iOS PWA* OAuth callback/return, automatic restoration of existing sessions, expiry/revocation and cross-origin cookies. Prepare an evidence-based minimal **GitHub App permission matrix, provider/hosting/cost options and test plan**. Before provisioning a GitHub App/provider, modifying repository permissions/rules or committing any infrastructure cost, obtain **separate explicit user approval**. Do not expose GitHub credentials in browser code, rely silently on third-party cookies, bypass branch protections, or change approved UX. P3 publishing service and P4 Save and Publish must not proceed without AUTH-P0 success. Final v3 production cutover likewise requires a distinct approval. No new provider, app, OAuth secrets or v3 backend have been provisioned at this checkpoint.

**Approved v3 product rules:** Anonymous read-only usage by default with discreet Sign In entry only in Connection Status; just one authorized owner can edit/publish, restoring valid sessions automatically if possible. One Save and Publish (Gear/KB/Catches under approved schema), secure GitHub/App-backed publishing with atomic validated changes, integrated images for Gear/KB, no Catch pictures, no offline queued sync or broad multi-user features. Connection Status distinguishes network / Work Offline / owner authorization and publish state. Local drafts are provisional and may be removed if unreliable. The UI screens, technical design and requirements are already signed off.

### Continue all fishing and equipment tracks

Preserve the open RVR119 **Garmin Force Current** commissioning/24V Redodo battery, pedals/MOB tag/on-water calibration, removable bin/cushioning task **FISH-TODO-040** (hard plastic, minimum usable internal **38 × 18 × 8 inches**, orange preferred); the backordered RVR119 under-seat tackle tray watch **FISH-TODO-008** and KastKing box watch **014**; open fishing-research, tackle and KB editorial tasks. Do not infer a purchase from a Gear record or close open tasks without explicit evidence. Historical Science of the Strike evidence standards and KB category ownership rules remain in the later sections and decision log.

### New-chat operating instruction

1. Read **README → Fishing_Context → Fishing_TODO → Fishing_Decision_Log → this bootstrap**, from actual latest `main`, and check live production/PR state.
2. Treat the previous October 12/19 headings below as **historical snapshots**. Do not follow old commands to restart already completed P0 analysis or publish already released v2 fixes. Today's primary release is #543, not #520 or #535.
3. Acknowledge the verified v2 improvements and ask only for any genuinely needed separate infrastructure/permission decision before P1 setup. The user may first report a visual/performance issue from personally checking FISH117; address that if raised. Otherwise proceed under the **already approved** AUTH-P0 plan in Chat mode, with a focused security/hosting test proposal rather than reopening requirements.
4. Use Full Application Release and hosted proof for app/runtime changes, FISH108 Fast Content Release for eligible content. Never treat a documentation-only `main` commit as a new production release. Keep explicit approval gates for provider/permissions/costs and v3 cutover.

---

## Operating mode

Use **Chat mode** by default and permanently. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, requires research/calculations, creates artifacts, or involves substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain my approval first, then return to Chat.

## First actions

Read these files from actual latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before repository work, also confirm current open-PR state. Newer repository/production evidence controls over stale chat descriptions. For exact production SHA/release/counts, inspect the latest successful `main` production workflow and hosted verification evidence.

## Previous v3 planning handoff — October 19, 2026 (HISTORICAL, already executed)

**The owner has ALREADY approved Fishing Companion v3 requirements, technical design, UX screens/flows AND the staged implementation plan.** Do not ask for these approvals again. The implementation-plan approval has one explicit prerequisite: **full reconciliation/transfer to this new Chat conversation before beginning P0 or any v3 implementation**. The previous chat performed only documentation approval, latest-main/open-PR/production evidence handoff, and durable-file reconciliation; **P0 itself was not executed, no app code changed, and no deployment or GitHub App/service setup occurred**.

- [Approved requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) and [requirements approval](pwa/docs/Fishing_Companion_v3_Requirements_Approval_2026-10-19.md)
- [Approved technical architecture](pwa/docs/Fishing_Companion_v3_Technical_Design.md) and [design approval](pwa/docs/Fishing_Companion_v3_Technical_Design_Approval_2026-10-19.md)
- [Approved sign-in / editing-and-publishing / Connection Status UX](pwa/docs/Fishing_Companion_v3_UX_Review.md) and [UX approval](pwa/docs/Fishing_Companion_v3_UX_Approval_2026-10-19.md)
- [Approved staged implementation plan, P0–P8](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) and [conditional approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Exact user-reviewed plan commit `7cc7eea06a110e041dbf552855957713df4b1c51`, blob `8d23d327033b1b348abb53d8462ccd2bb8dc0513`.

### Old October 19 start instructions (HISTORICAL; P0 and P2 work completed)

**Start P0 — Restore production and source baseline, investigate/measure reliability and plan tests — only after the first-actions restoration above and verification that the October 19 handoff PR was merged.** Re-read the approved plan, discover current GitHub permissions and exact latest main, open PR state, current production workflow and hosted `release.json`; audit current source/UI/offline/release/tests and safe preview strategy. Investigate and baseline the **Android installed-PWA external-link issue**, **post-deployment stale-session missing images/pages** and **3–4-second card-image appearance**. Gather user-device evidence via short step-by-step instructions as needed. Do not prematurely blame service worker or image sizes without reproduction/measurement. P0 is authorized by the approved plan **in this new chat**; stay within its scope and report results and proposed next stage.

### Current v3 product and architectural contract (do not reopen scope)

- **Public reading remains anonymous by default**, with only a discreet **Sign in with GitHub** link in the refreshed **Connection Status** dialog. Only one authorized GitHub account can edit and publish; valid prior sessions auto-restore if technically possible. Unauthorized accounts get no editing controls. Real PWA session persistence/callback behavior is **AUTH-P0**, a hard feasibility gate.
- **One Save and Publish** action (no separate approval per content item, no user-facing Copy Changes); direct GitHub/App-backed validation, atomic record/Markdown/media writes, safe PR auto-merge, FISH108 eligible content release and **final hosted byte/release verification**. A user can leave an editor after the service durably accepts a submission; status remains accessible.
- **Integrated image uploads**, existing Gear/KB Add/Edit and current-schema **Catch Add/Edit**; local Markdown pictures open existing viewer; **no Catch photos**, GPS, sessions or extra user capture complexity.
- **Connection Status visual refresh:** persist Automatic versus Work Offline across restarts; separate network, offline-library readiness/release identity, owner sign-in/out and any publication progress. Work Offline is for reading a complete verified offline library; no new queued writes.
- **Image performance:** instrument measured causes, consider deterministic build-generated small card thumbnails without changing canonical originals. **Deployment reliability:** protect old/new coherent release selection and preserve source/byte verification. **Android link bug:** ordinary links fail in Chrome installed PWA but work in Chrome and Edge browser tabs; long-press offers Open in browser; YouTube app-link opens in installed Chrome and in Edge browser. Installed Edge app and iOS remain unverified.
- **Local drafts are provisional, device-local only**, automatic Restore/Discard prompt; may continue an already-open edit after selecting Work Offline, but no background sync, offline new-session authoring, or automatic queued publishing. **Remove this support layer if reliability testing finds unacceptable regressions**, retaining safe online authoring.
- **No new features**, broad multi-user support, offline queue/sync, Catch photo/GPS, or parallel content database. Preserve canonical GitHub source and the existing approved v2 application until a separate v3 cutover approval.
- Technical design recommends **GitHub App + minimal trusted publishing broker**, with credentials/authorization verified server-side. **AUTH-P0** must test cross-origin session persistence and OAuth return on real installed Android/iOS PWAs. Do not assume third-party cookies; no unapproved custom domain, paid provider, privilege expansion, or security workaround.
- **Authorization boundaries:** Plan and scoped work approved after transfer. A specific provider/domain/permission or paid infrastructure change, independently released v2 reliability fix, and v3 production cutover require their own later user approvals. No branch-rule bypass. Any application/runtime change uses Full Application Release; eligible normal content stays FISH108.
- **Chat default.** If an upcoming hands-on browser/UI test truly requires Work-only capability, tell the user before that step, explain why and obtain agreement to temporarily switch. Don't wait until a long unresponsive turn. Installed Android/iOS physical-device tests may still require the user's help.

### GitHub/production snapshot verified during October 19 handoff (historical)

- `main` **before** handoff approval commits: `7cc7eea06a110e041dbf552855957713df4b1c51`, **0 open PRs**. The new documentation-only handoff PR changes latest main but **does not publish the PWA**. Confirm its merge and new current main at startup.
- Latest successful main production workflow: **#520** / GitHub Actions run **38686171921**, Fast Content Release, **October 15, 2026 UTC**, published source `4fc893d044b72e61fbc36cfd82103af55bc36f97`.
- Verified hosted release `f5eab01e9d5af6101f03a7094de5b565`, **100 Gear / 60 KB / 12 Catches / 431 files**, `hostedBytesMatch: true`; release/source match confirmed by deploy-content log and hosted-verification artifact. Actual new-chat production evidence may supersede this snapshot.
- This handoff preserves all active fishing, Garmin Force Current commissioning/storage, gear-watch and KB TODOs from this file and the canonical `Fishing_TODO.md`; do not invent resolution. FISH114 remains last completed application milestone at checkpoint; **FISH-TODO-115** was next unused standalone application ID.

**Opening instruction for this new conversation:** Acknowledge the approved plan/handoff state; restore current repository and production evidence, then begin P0 in Chat mode under the approved plan. If implementation requires unavailable tools, make that capability gap explicit before switching modes or performing the work. Do not repeat past requirements/design/UX/plan debates and do not start with an unsolicited approval request.

---

## Prior handoff checkpoint — October 12, 2026 (historical)

Verified production **before** this documentation-only reconciliation:

- source revision: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`;
- last production change: Banks Lake Location representative picture, **PR #228 merged**;
- workflow **#517** / run `38207507318`, Fast Content Release, succeeded;
- hosted release ID: `0f4bd1f9e9e12b2b1981d61b48e3e501`;
- hosted counts: **100 Gear / 60 KB / 12 Catches**, **431 files**;
- exact-current-main guard, Pages deployment and byte/release-identity verification succeeded: `hostedBytesMatch: true`;
- open PRs before handoff: **0**.

This handoff changes only the five root project Markdown records and **does not publish a new PWA release**. Thus the post-handoff `main` commit may differ from the production source revision above. Always inspect the latest workflow, hosted verification and actual `main` at new-chat start.



FISH114 remains the latest completed application/architecture change. FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture ID is **FISH-TODO-115** unless newer `main` has allocated it. Routine FISH108 content work does not consume application IDs.

## Recent canonical content state

Since the prior handoff, current canonical source includes:

- five **Banks Lake catches from September 24, 2026**, all with pictures and Notes Markdown:
  - 12-in smallmouth — Z-Man Ned Rig Kit;
  - 14-in largemouth — Z-Man Ned Rig Kit;
  - 8-in Lake whitefish — Lake whitefish species + Z-Man Ned Rig Kit;
  - 15-in smallmouth — Berkley PowerBait Power Jerk Shad;
  - 14-in smallmouth — Berkley PowerBait Power Jerk Shad;
- **Lake whitefish** as a Species KB entry with picture/content;
- updated **Z-Man Ned Rig Kit** specifications;
- **ZMan Finesse ShadZ**, **ZMan Trick ShotZ**, **ZMan TRD GobyZ** with pictures and Drop Shot Notes links;
- **Blue Fox Flash Spinner** and **Bad River Tackle Company Trout/Panfish Spinners**;
- removal of the old generic/South Bend inline-spinner Gear item and cleanup of its live KB reference;
- **VMC Swimbait Jig** Notes;
- Banks Lake inline-image filename/case/Markdown cleanup;
- Berkley PowerBait Power Jerk Shad Notes wording cleanup;
- Pflueger President Spincast Combo rod/reel Notes updates and reel capacity `110 yd / 4 lb, 90 yd / 6 lb, 70 yd / 8 lb`.
- Earlier motor/battery research in Electronics Research was replaced; its **current Notes are focused on chart plotters/fish finders**. Garmin Force Current has its own Gear record and maintenance Notes.
- October releases added/updated Flutter Spoon content, NRS Zander PFD, YakAttack BackWater DryPak, Z-Man ShroomZ Micro Finesse Jig, Z-Man Finesse TRD, Z-Man branding, Luhr Jensen Trout & Kokanee Dodger, Yamamoto Senko and three lure-picture replacements.

### October 8–12 verified content additions/edits

- **PR #221:** YakAttack Fully Loaded TracPak Combo Kit (orange) and YakAttack 10L Roll-Top Drybag (orange), using existing images.
- **PRs #222–224:** Garmin Force Current with Power Steer foot pedals Gear item, component Notes, and final display name.
- **PR #225:** Electronics Research renamed/refocused to chart plotters/fish finders; dedicated picture. Do **not** reinstate old motor/battery Notes on that page.
- **PR #226:** Lake Stevens Location fishing guide for launch/access, bass, trout, kokanee and perch.
- **PR #227:** Garmin Force Current maintenance checklist and illustrated components Notes.
- **PR #228:** Banks Lake Location representative picture (uploaded image preserved). The previous ChatGPT turn was interrupted, but this PR was **merged and production verified**, so do **not** reopen it.

Current authoritative content at the handoff: **100 Gear / 60 KB / 12 Catches**, including **10 Locations**.

Git history and current canonical source are authoritative for exact values.

## Active RVR119 Force Current commissioning — important

The motorization purchase is complete. **Do not revert to the old “no purchase decision” state.**

### Purchased October 6, 2026

- Garmin **Force Current** trolling motor
- Garmin **Power Steer wireless foot pedals**
- Garmin handheld remote
- Garmin MOB tag
- **Redodo 24V 50Ah LiFePO4 battery**
- Redodo charger
- Garmin high-efficiency propeller
- Garmin weedless propeller
- purchase price: **$2,800**
- seller: Gresham, Oregon
- original Garmin receipt: **July 2026**
- Garmin directly confirmed to the user that the remaining three-year standard warranty will be honored with that receipt
- seller reported **freshwater-only** use

### Current task — FISH-TODO-040

FISH-TODO-040 remains OPEN and now means **commission/integrate the owned Force Current system**, not compare candidate motors.

Current work:

1. clean and inspect motor/mount/shaft/rope/connectors/props/sacrificial anodes;
2. inspect, charge and baseline the Redodo battery/charger;
3. clear prior-user Garmin data and restore factory defaults;
4. restore/re-pair the handheld remote, both Power Steer pedals and MOB tag;
5. update motor/remote/pedals through ActiveCaptain;
6. calibrate both pedals and the handheld remote;
7. install on RVR119 with proper 40A circuit protection;
8. perform on-water motor compass/bow-offset calibration and full propulsion/steering/Anchor Lock/MOB testing.

Do not run the propeller out of water. Do not perform invasive preventive service on this three-month-old warrantied motor unless a fault requires it.

### Active storage-case search and foam insert

Find a **hard-plastic** storage case/bin for the motor and pedals:

- minimum usable internal dimensions: **38 × 18 × 8 in**;
- compact/snug fit strongly preferred;
- **orange preferred**;
- no flexible bags;
- no need for expensive/heavy Pelican/Otter-level construction;
- Hyper Tough 50-gallon tote was rejected as too large;
- verify **usable interior dimensions**, not exterior dimensions alone;
- a **48 × 19 × 14 in lidded hard-plastic bin** is being discussed for the foam-insert solution; purchase/ownership and actual usable interior dimensions were **not confirmed**;
- use a protective insert that leaves the Force Current controls, shaft, pedals and connectors unloaded. Cut closed-cell EVA/PE sheet foam is the safe default; rigid Fireblock/Gaps & Cracks spray foam should not directly encase the gear. Window & Door low-expansion foam was considered as a **test**, not selected as the permanent design;
- **FISH-TODO-040 remains OPEN**; do not infer the storage or commissioning work is done.

Transport constraint remains: the kayak goes on the F-150 roof rack, so the motor, propulsion battery and pedals must remain readily removable before roof loading. The Newport 24V 50Ah LoPRO remains only a possible future lower-profile battery alternative; the **Redodo 24V 50Ah is the currently owned battery**.

## Science of the Strike transcript research

Recent transcript reviews covered:

- largemouth vision;
- scent and taste;
- barometric pressure and lunar cycle;
- crawfish;
- dissolved oxygen and turbidity.

For every transcript extraction, preserve this structure unless the user asks otherwise:

1. Executive summary
2. Main arguments/conclusions
3. Key facts/claims with evidence vs opinion/inference
4. Actionable fishing takeaways
5. Important examples/stories/anecdotes
6. Techniques/gear/seasonal/location/fish-behavior insights worth retaining
7. Short **What I'd add to Fishing Companion** section

Evidence discipline is durable: distinguish study evidence from host inference; do not universalize a single-study threshold, one population, lab results, anecdotal conversions or host extrapolations.

Potential Fishing Companion destinations include Bass Behavior and Habitat, Bass Fishing Techniques, seasonal pages and Electronics Research. Do not recreate retired live Technique pages merely to house podcast material.

`FISH-TODO-031` remains OPEN because the originally targeted episodes 8 and 16 have not both been explicitly confirmed complete; a dissolved-oxygen/turbidity transcript has been reviewed.

## Current KB editorial architecture — critical

### Behavior and Habitat

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat** answer **where fish are and why**: habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth and pattern recognition.

### Fishing Techniques

- **Bass Fishing Techniques** / **Trout Fishing Techniques** answer **how to catch fish once located**: presentation choice, lure/bait/rig selection, retrieves, depth control, strike handling and bank/kayak execution.

### Seasonal playbooks

- Spring Fishing, Summer Fishing, Fall Fishing and Winter Fishing own detailed seasonal location + presentation strategy.

### Topwater

- Topwater Fishing owns broad surface-fishing strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower Gear Guides.

### Linking/retirement rules

- Use curated `kb://` links where they materially help the reader.
- Do not reintroduce retired Technique pages unless explicitly requested: Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility.

## FISH108 release policy — critical

Full policy: `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release

Use only when **every changed repository file** is under one or more of:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

Before mutation, restore current source/open PRs and validate source revision/ancestry, record hashes/base fields where applicable, conflict state, IDs/schema/types/paths/references, notes/media actions and supplied media metadata. Apply only requested changes; preserve unrelated/newer source and user-uploaded bytes.

Use one lightweight content PR, locked cached dependencies, canonical production build/source inventory validation, generated-release verification, exact-current-main guard, Pages deployment and dependency-free byte-for-byte hosted/release-identity verification.

Do not manually escalate routine content-only work to the full app suite unless a genuine non-content issue is discovered. Routine Fast Content Releases do **not** consume application task IDs or require per-item project-state documents.

### Full Application Release

Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture or mixed content+non-content changes use the full suite. Documentation-only project-state reconciliation does not publish the PWA.

## Durable authoring/application behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**; copying is not saving and the browser does not write GitHub source directly.
- GitHub upload links target physical `/pwa/...`; packages use logical `Gear/...`, `KB/...`, `Catches/...` paths.
- Existing IDs remain stable unless intentionally retired/replaced.
- Simple Markdown narrative edits may be direct; structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships use the source-aware workflow.
- KB `description` maximum is 80 characters.
- Same-page Markdown links use renderer-generated lowercase punctuation-stripped hyphenated anchors.
- FISH091: complete offline library is explicitly prepared through **Connection Status → Update offline library**.
- FISH096: Knot sequences use explicit ordered `pictureSequence` frames under `pwa/KB/Knots/assets/<id>/`.
- FISH102: Line-Tackle-Knot Reference is pinned first only under KB → Knots.
- FISH103: external HTTP(S) links open new-tab; internal/local links remain same-tab.
- FISH107: Skylety Fishing Hook Sharpener canonical type is `Tools`.
- `.github/workflows/fishing-production.yml` is the sole active publisher.

## Active backlog highlights

- FISH-TODO-008: RVR119 Under Seat Tackle Storage remains back-ordered/not purchased and is the user's #1 needed fishing equipment item.
- FISH-TODO-014 remains open; do not infer the existing HyperSeal 3600 resolved the historical deep-box target.
- FISH-TODO-019/020/021/022/023: Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons KB pages remain open.
- FISH-TODO-039: Apply T-9 on kayak hardware.
- FISH-TODO-040: purchased Force Current commissioning/integration and hard-plastic storage-case selection, described above.
- Fishing Companion v3 **requirements, design, UX and staged implementation plan all APPROVED October 19, 2026**, the last with **mandatory full new-chat transfer before P0**. See the top CURRENT NEW-CHAT START instructions and [plan approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Plan now authorizes scoped post-transfer P0; AUTH-P0, provider/permission/cost decisions, any v2 maintenance release, provisional draft reliability removal and later explicit v3 production cutover gates remain binding.

FISH-TODO-030 was explicitly deleted and must never be restored. FISH-TODO-038 outer rod holder work is complete.

## Chat-transfer convention

For this project, **“It’s time to transfer to a new chat”** is the standard transfer cue. Ask once to confirm the full handoff. After confirmation, execute it end-to-end without repeated Proceed prompts: restore actual current `main`, open PRs and production evidence; reconcile completed/unresolved work; update authoritative records where durable state changed; preserve purchase uncertainty; cross-check the files; and finish with a clickable GitHub link to this bootstrap prompt.

## Working rules

- Use current GitHub source as authority.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- Fishing Companion change packages are implementation instructions, not JSON merely to explain.
- Do not infer purchases/ownership or close WAITING/OPEN purchase items without explicit evidence.
- Historical milestone docs and old production identities are evidence only; current exact production state comes from current GitHub/Pages evidence.
