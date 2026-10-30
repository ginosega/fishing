# Fishing TODO

## October 29 late (October 30 UTC) — D5 Viewer/Diagnostics Windows source PASS

**Owner exact-source Windows test: PASS 129/129, zero failures, zero skipped** on V3 draft head `57a598453a97cd28ee11e45b77f475b8098e30b1`. User ran `git pull --ff-only`, verified the full expected commit SHA, and executed `npm.cmd test` from `pwa`. The prior 123/128 five-failure run is **superseded**: D5-V01..V06 all pass, D5-C01..C03 all pass, D5-O01..O04 all pass, and existing release/media/owner lifecycle regressions remain green. This **closes D5 Picture Viewer and Copy Diagnostics Windows source-validation** at the tested source revision (as well as the prior D5 Work Offline source gate). It is **not** an independent GitHub Actions full-suite result, browser/installed Android acceptance, or deployed V3 verification. Documentation commits after this checkpoint do not silently change the code SHA that was tested.

**Next D5 work:** source-aware real V3 candidate/integrated installed Android and Windows browser acceptance with independently verified release scope; persistent Work Offline/Automatic, Connection Status diagnostics and Picture Viewer interaction, and editor draft-protection/recovery assessment. Private sandbox pilot remains online-only and separate from the public V2 cached PWA. No V3 public cutover, material production routing change, or public-main write approved. Separately retain D3 installed-PWA OAuth/session gate and V3-SAVE-09 genuine public Save-to-Live <=60 seconds gate. Preserve D4 original-byte audit caveat and untested Knot replacement/interrupted upload cases.

---

## October 29, 2026 — D5 Work Offline source PASS; Viewer/Diagnostics follow-up pending validation

**New Viewer/Diagnostics Windows test:** owner reran 128 tests at `236872d` — **123 PASS, 5 FAIL**, with all D5 Work Offline and prior v2 tests still passing. Four new Viewer failures revealed a real V3-only reference-kind bug (`...resolved` had always supplied `kind:'local'`, so image detection using `kind:'image'` failed); patched by an explicit V3-only `isImage` marker, preserving all old V2 link-kind fields, and added D5-V06 compatibility test. One diagnostics test expected a literal escaped newline; its assertion is now whitespace-independent. **Corrected new source is not yet rerun; require fresh exact-head `npm.cmd test` before claiming D5 Viewer/Diagnostics PASS.** No deployment made.


**Owner's Windows npm test at source `8bf524f326e1494711c3fa20016d045248c1013e`: 120/120 PASS, zero failures.** The D5 Work Offline source gate is validated across no-library rejection, persistent CacheStorage preference, no ordinary network in Work Offline, V2 mode isolation, and corrupt/quota rollback. D4 D1 read-only audit separately **PASSED** for #35 Live, #36 Failed, #37 Live. This does not substitute for installed Android V3 testing or separately verified hosted original-image bytes.

**New D5 source on unmerged draft PR #263 (NOT YET RETESTED):** V3-only Markdown Picture Viewer for safe local inline images (using original bytes, native keyboard-open button, preserve linked images, inline missing-image fallback), Copy Diagnostics strict allowlist (no owner credentials/operation identifiers/drafts), and fail-closed offline preference revalidation before publishing. Explicit V3-only reading-mode flag now contributes to immutable release identity. Unit regressions D5-V01..V05 and D5-C01..C03 added; next validate all with a fresh exact-head Windows test. Follow-up: real V3 release-scope offline/Android acceptance, Connection Status polish and removable draft recovery evaluation; independent <=60-second public Save-to-Live gate remains open.

**Public V2 untouched; no private D5 deployment, draft PR merge or production V3 cutover authorized.** [D4/D5 transition](experiments/p3/preview/D4_D5_Transition_2026-10-29.md) is the evidence checkpoint.

---

## October 29, 2026 — V3 D5 verified offline-reading source checkpoint

**D5 implementation underway, SOURCE ONLY — WINDOWS RETEST PENDING AND NOT DEPLOYED.** A Work Offline mode backed by the existing complete verified CacheStorage release has been added to the V3 code path, compiled **OFF by default** for all V2 builds. The separate `--v3-reading-mode` build option is for an eventual reviewed V3 candidate, not an authorization for production. Connection Status offers Automatic and Work Offline in V3 non-sandbox app mode, protects publishing and owner-status network polling while offline, and persists selection in service-worker metadata across restarts. Private sandbox pilot remains online-only.

D5-O01..04 regressions cover V2 hard-off, no-library rejection, zero normal network requests, persistence/switchback, and corrupt/quota rollback. Owner Windows run at old head `b945bb7` passed 107/120; 12 tests failed due an invalid Windows SW test-fixture URL pathname and one stale editor-gate source assertion. Both test fixtures are patched on the new unmerged branch; **Windows rerun and a successful exact-head test run remain required.** Further D5 work: obtain passing exact-head source CI, exercise the mode in a real V3 installed Android/desktop integration, complete draft/remove decision, Markdown Picture Viewer, Connection Status/rollback acceptance. Details and authoritative D4 CI/PR inventory: [D4/D5 Transition](experiments/p3/preview/D4_D5_Transition_2026-10-29.md). Final D4 Cloudflare D1 read-only receipts #35/#36/#37 **PASSED** on owner Windows: #35 Live, #36 Failed, #37 Live; guarded audit script `experiments/p3/preview/tools/audit-d4-final-receipts-readonly.ps1` is source-only.

**Public V2 unchanged; draft PR #263 remains unmerged.** The separate D3 installed Android owner OAuth/SW proof, publicly hosted text-only <=60-second Save-to-Live benchmark, and owner-approved V3 production cutover remain OPEN.

---

## October 29, 2026 — V3 D4 owner publishing acceptance

**Private V3 sandbox functional tests: PASSED; D4 operational/security closeout remains OPEN.** The owner reports Live for Catch Add and **Catch Edit**, Gear image Add and Replace, and a two-frame Knot Add; private GitHub PRs [#31](https://github.com/ginosega/fishing-p3-sandbox/pull/31), [#37](https://github.com/ginosega/fishing-p3-sandbox/pull/37), [#32](https://github.com/ginosega/fishing-p3-sandbox/pull/32), [#35](https://github.com/ginosega/fishing-p3-sandbox/pull/35), and [#34](https://github.com/ginosega/fishing-p3-sandbox/pull/34) respectively are merged with successful exact-head sandbox checks. Catch Edit #37 retains the prior stable ID, commits revised date, fabricated Species and Markdown notes, and was confirmed Live by the owner. Original Catch attempt [#36](https://github.com/ginosega/fishing-p3-sandbox/pull/36) correctly failed synthetic-only CI and is not merged.

**Finish D4:** reconcile read-only D1 operation/hosted-byte verification for recent #35/#37, consolidate negative media/timeout/unauthorized tests, explicitly record any untested Knot sequence replacement; do not manufacture unnecessary failed owner publications. Private-only source fixes to pre-submit synthetic Catch validation and persistent failed-operation acknowledgement are CI-passing on draft [PR #263](https://github.com/ginosega/fishing/pull/263), but not yet redeployed. Full owner-functional evidence and exact PRs are documented in [D4 checkpoint](experiments/p3/preview/D4_Catch_And_Media_Implementation_Checkpoint_2026-10-29.md).

**Next D5:** persistent Automatic/Work Offline, atomic verified library, release/service-worker coherence, Connection Status, Markdown Picture Viewer and optional safe drafts (per the finite D1–D6 plan). D3 installed Android V3 OAuth/scope acceptance and publicly hosted <=60-second text-only delivery remain **OPEN** before D6 cutover decision. **Public V2 remains untouched; no V3 production cutover approved.** Earlier dated sections below are historical and should not override this checkpoint.

---

## October 21, 2026 new-chat transfer — active checkpoint

**Release engineering:** FISH115 (record-card thumbnails and security patches), FISH116 (P0-A stale-session reliability fix), and FISH117 (small WebP category icons/scenic headers) are **implemented, authorized, merged and hosted-verified**. **Latest [production workflow #543](https://github.com/ginosega/fishing/actions/runs/39690549053) succeeded**, source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, release `131ebca9c6d46fa1c1d815ad43a318f6`, **577 hosted files, counts 100/60/12**. Pre-handoff `main` `c42d0e737151608b53ffd0de6fa29dbbd76eba32`, **0 open PRs**. The new handoff PR is documentation only and is not a production deployment. FISH117 measured 18 assets **17,090,051 original bytes vs 253,660 shipped bytes**; the user chose to visually/time-check the live site rather than run prepublication acceptance and **has not yet provided that subjective result**. [FISH117 report](pwa/docs/Fishing_Companion_FISH117_Static_Artwork_Optimization_2026-10-21.md).

**Next architecture work (not yet implemented):** v3 **P1 AUTH-P0** feasibility and permissions/provider decision. All v3 requirements, UX, design and plan approvals stand; no reapproval of planning required. Prove actual installed-PWA sign-in return/session persistence securely before P3 service or P4 publishing, with explicit permission and cost/vendor approval before provisioning. No v3 cutover authorization. **FISH-TODO-118 remains the next unused application/architecture task number.** P0-C ordinary Android Chrome PWA external Custom Tabs behavior was accepted and closed.

**Retain active non-v3 backlog:** FISH-TODO-008 under-seat RVR119 tackle tray, 014 KastKing box availability, 040 Garmin Force Current commissioning/battery/motor/pedals/storage and all other still-OPEN fishing/KB/purchase items later in this file. Preserve prior specifics and unknown purchase status. Normal eligible Gear/KB/Catch source-aware content uses FISH108.

**Older dated entries below are historical progress snapshots.** They must not override this latest checkpoint; for exact live facts, recheck the newest successful GitHub Actions publication and hosted verification.

---

## Current production release — FISH117 complete October 21, 2026

**FISH-TODO-117 / Home, My Gear, KB static artwork optimization: RELEASED AND HOSTED-VERIFIED.** Owner explicitly authorized direct v2 production publishing, waived separate visual/mobile preview and additional performance measurements. [PR #258](https://github.com/ginosega/fishing/pull/258) creates transparent 128px WebP versions of 16 category icons plus two responsive compressed scenic headers, preserving original source PNGs but not publishing redundant large originals. [PR #259](https://github.com/ginosega/fishing/pull/259) made an **isolated WebKit second-offline-reload fixture correction**; production runtime unchanged by that follow-up. [Main Full Application run #543](https://github.com/ginosega/fishing/actions/runs/39690549053) **SUCCEEDED**, including actual Pages and hosted byte/release/browser verification. Source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, live release `131ebca9c6d46fa1c1d815ad43a318f6`, **577 files / 100 Gear / 60 KB / 12 catches**. Build reports 18 static images **17,090,051 source bytes → 253,660 published bytes (98.5% smaller)**; this is asset-byte reduction, not a measured end-user page-load improvement. Owner will verify appearance/speed directly on production. [Full report](pwa/docs/Fishing_Companion_FISH117_Static_Artwork_Optimization_2026-10-21.md). P0-A reliability fix remains live, AUTH-P0 and v3 cutover gates remain open. **Next unused application task ID: FISH-TODO-118.**

## Latest application release checkpoint — October 21, 2026

**FISH-TODO-116 / P0-A stale-session defect: RELEASED AND HOSTED-VERIFIED.** The owner explicitly authorized the standalone v2 Full Application maintenance release. [PR #254](https://github.com/ginosega/fishing/pull/254) merged commit `953cba549515b08aec76a8408868a6b3bdac2117` after source-aware main reconciliation and successful exact-head CI [#534](https://github.com/ginosega/fishing/actions/runs/39643607290). Main production [workflow #535](https://github.com/ginosega/fishing/actions/runs/39676555110) then **SUCCEEDED** with full tests, Pages deployment, actual hosted byte/release-identity and browser verification at `https://ginosega.github.io/fishing/`. Hosted release `855b2b33d7d3fdca7ac5e92be881824b`, **577 files / 100 Gear / 60 KB / 12 Catches**. Clean stale tabs now change to the latest verified release with a whole-page reload preserving the hash route; dirty editors are protected. Older hosted release assets are not retained, per owner's preference. Already-open sessions running the **previous unpatched** version may still require one final manual refresh; subsequent release transitions use the fix. Physical Android/iOS acceptance remains untested. [Release implementation/acceptance report](pwa/docs/Fishing_Companion_v3_P0A_Transition_Fix_2026-10-21.md). AUTH-P0 owner OAuth sign-in/session/callback feasibility and v3 cutover remain independent/open. Next unused application task ID: **FISH-TODO-117**.

## Current project task state — October 19, 2026

**V3 P0 progress — October 20, 2026:** Fresh source/production baseline restored; P0-A stale-client release defect reproduced in isolated source-level tests (run #521), **fix not yet selected or released**. P0-B [draft, unmerged thumbnail prototype PR #248](https://github.com/ginosega/fishing/pull/248) now builds manifest-verified, deterministic card derivatives, retains all original pictures, and passed Full Application validation [run #525](https://github.com/ginosega/fishing/actions/runs/39431537020). All 146 derivatives total ~1.56 MiB vs 102.94 MiB of their originals; tested above-fold decode-to-display latency improved by ~1.6–2.1× in local Chromium/WebKit fixtures. [P0-B report](pwa/docs/Fishing_Companion_v3_P0B_Thumbnail_Prototype_2026-10-20.md) preserves measurements/caveats. **Owner update October 21, 2026:** Thumbnail implementation **APPROVED**; owner accepts measured latency gain and **waives visual review and Android preview**. Exact-head Full Application CI [#526](https://github.com/ginosega/fishing/actions/runs/39436154092) succeeded for PR #248 head `6bd9d5e04c69851b2f4c64813c3b6821f6ff8db6`. **Still required:** separate express authorization to publish a v2 Full Application maintenance release, including awareness that P0-A stale-session issue remains unfixed; until then PR #248 stays draft/unmerged and production stays unchanged. **P0-C CLOSED:** owner accepted Chrome Android installed-PWA Custom Tabs; no workaround. AUTH-P0 owner sign-in/session/callback feasibility, permission/provider gate, and v3 cutover gate remain unresolved.

**October 21, 2026 post-release reconciliation — P0-A FIELD REPRODUCED, P0-B PRODUCTION RELEASED:** The owner held Edge release A `f5eab01e9d5af6101f03a7094de5b565` open while [PR #252](https://github.com/ginosega/fishing/pull/252) (approved thumbnails + security patches) deployed successfully through [Full Application workflow #531](https://github.com/ginosega/fishing/actions/runs/39624670945). Hosted B release `9f6464d53fe49d1e986bb35d2630c21a` from source `805972165f88f10898807639d8b9591ce0cf3d08`, 577 files / 100 Gear / 60 KB / 12 Catches, passed hosted verification. Old A My Gear category-card `card-icons/*.png` returned **HTTP 404** from new hosting and **503 from the service worker**, with missing icons; fresh B tab succeeded. New B tab displayed a likely overbroad `controllerchange` update notification. [Field evidence, exact URLs, limitations and fix candidates](pwa/docs/Fishing_Companion_v3_P0A_Edge_Field_Reproduction_2026-10-21.md). **P0-A fix remains open/unimplemented**, real field repro sufficient to begin isolated fix design; independent v2 reliability release requires its own approval. P0-B enhancement is no longer a prototype-only release candidate; close superseded draft PR #248 unmerged after this reconciliation. AUTH-P0 and v3 cutover gates remain separate.

**October 21, 2026 — P0-A fix implemented and validated, NOT DEPLOYED:** The owner directed us to fix stale sessions by **moving to the new verified release instead of retaining prior-release online assets**. [Draft PR #254](https://github.com/ginosega/fishing/pull/254) implements release-aware clean-tab automatic reloads with preserved hash route, protection of dirty editors, and removal of inaccurate service-worker update notices. [Exact-head Full Application CI #534](https://github.com/ginosega/fishing/actions/runs/39643607290) **PASSED** (46 core, 54 preview-browser and 56 production-root browser tests; no deployment). [Design, field-derived regressions and outstanding authorization](pwa/docs/Fishing_Companion_v3_P0A_Transition_Fix_2026-10-21.md). **Separate owner approval is still required before merging/publishing this v2 reliability maintenance change**. Current published v2 remains thumbnail/security-patched B; v3 AUTH-P0 and cutover remain open.

### Application / architecture state

- **FISH-TODO-108 — IMPLEMENTED.** Two-lane release policy: Fast Content Release for routine canonical Gear/KB/Catch content, Full Application Release for application/runtime/tooling/schema/workflow changes.
- **FISH-TODO-109 — IMPLEMENTED / PRODUCTION-VERIFIED.** Run-attempt-safe Pages/evidence artifacts and hosted-verification retry hardening.
- **FISH-TODO-110 — IMPLEMENTED / PRODUCTION-VERIFIED.** Release-aware Gear/KB **Copy Changes** handoff.
- **FISH-TODO-111 — IMPLEMENTED / PRODUCTION-VERIFIED.** Shared site-header/page horizontal content grid and full-width long-form Notes.
- **FISH-TODO-112 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Fixed bundled cross-platform card icons.
- **FISH-TODO-113 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Responsive scenic page heroes.
- **FISH-TODO-114 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Android/Edge maskable launcher icon.

FISH071–076 and FISH078–115 are complete/implemented. **FISH-TODO-115** is the production-verified thumbnail/security patch application release (#252/#531). **FISH-TODO-116** is the P0-A stale-session reliability fix: implemented and full-CI validated in draft PR #254 but **not released**. The next unused application/architecture task ID is **FISH-TODO-117**.

**Fishing Companion v3 (FISH-TODO-037): REQUIREMENTS + DESIGN + UX + IMPLEMENTATION PLAN APPROVED October 19, 2026, WITH MANDATORY NEW-CHAT TRANSFER FIRST.** [Approved requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) · [approved design](pwa/docs/Fishing_Companion_v3_Technical_Design.md) · [approved UX](pwa/docs/Fishing_Companion_v3_UX_Review.md) · [approved implementation plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) · [plan approval with transfer caveat](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Complete [full handoff](Fishing_New_Chat_Bootstrap_Prompt.md), **then begin P0 in a new Chat**, freshly restoring main/PR/production evidence. No implementation, GitHub App setup, hosting or deployment in the handoff chat. AUTH-P0 required before security-dependent work. New provider/cost/domain/permissions, separately released v2 fixes and v3 cutover require their own stage-specific approvals. Excluded: offline sync/queue, broad multi-user, Catch photos/GPS; drafts provisional/removable.

### Recent routine content work completed

Routine FISH108 content work is complete/canonical and does not consume application IDs. Since the prior handoff this includes:

- five September 24 Banks Lake catches with pictures and Notes;
- Lake whitefish Species KB entry;
- Z-Man Ned Rig Kit specification update and Catch links;
- ZMan Finesse ShadZ, Trick ShotZ and TRD GobyZ with pictures;
- Blue Fox Flash Spinner and Bad River Trout/Panfish Spinners;
- removal of the old generic/South Bend inline-spinner item and live reference cleanup;
- VMC Swimbait Jig Notes;
- Banks Lake inline-image/case/format cleanup;
- Berkley PowerBait Power Jerk Shad Notes cleanup;
- Pflueger President Spincast Combo rod/reel Notes and reel-capacity update.

Additional **October 8–12 completed content**: orange YakAttack TracPak combo and 10L drybag; Garmin Force Current with Power Steer Gear/Notes and maintenance update; Electronics Research renamed and refocused on fish finders with new image; new Lake Stevens Location fishing plan; Banks Lake Location representative picture (**PR #228 merged and deployed**). Verified production source: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`, counts **100 Gear / 60 KB / 12 Catches**, workflow **#517**, release `0f4bd1f9e9e12b2b1981d61b48e3e501` at this handoff. None requires an application task ID. This **documentation-only reconciliation does not publish a PWA release**.

Current canonical source controls exact values and counts.

## Active fishing, equipment and content backlog

Preserve explicit purchase uncertainty; do not infer ownership/completion without user confirmation.

The RVR119 Under Seat Tackle Storage has **not** been purchased, remains on back-order, and is the user's **#1 needed fishing equipment item**.

| ID | Priority | Status | Work item |
|---|---|---|---|
| FISH-TODO-008 | P2 | OPEN | Purchase RVR119 Under Seat Tackle Storage when available; currently back-ordered and the user's #1 needed fishing equipment item. |
| FISH-TODO-011 | P2 | OPEN | Buy/consider bullet weights for Texas rigs/Rage Craw. |
| FISH-TODO-012 | P2 | OPEN | Buy/consider 1/8 oz weighted EWG hooks for Power Jerk Shad/depth control. |
| FISH-TODO-013 | P2 | OPEN | Buy/consider Carolina Keepers as slip-sinker alternative. |
| FISH-TODO-014 | P3 | OPEN | Watch for KastKing 3600 deep box; do not infer the existing HyperSeal 3600 resolved this. |
| FISH-TODO-015 | P3 | OPEN | Buy/consider Berkley Warpig, 1/2 oz, 3 in, Blue Shad; Gear record does not prove purchase. |
| FISH-TODO-019 | P2 | OPEN | Build Texas Rig KB page. |
| FISH-TODO-020 | P3 | OPEN | Build Carolina Rig KB page. |
| FISH-TODO-021 | P3 | OPEN | Build Alabama Rig KB page. |
| FISH-TODO-022 | P3 | OPEN | Build Neko Rig KB page using historical seed references and complete authored article. |
| FISH-TODO-023 | P3 | OPEN | Build Spoons KB page. |
| FISH-TODO-024 | P3 | OPEN | Research Lake Bosworth bass. |
| FISH-TODO-025 | P3 | OPEN | Visit/check Holiday Sports in Burlington. |
| FISH-TODO-026 | P3 | OPEN | Research/join fishing club. |
| FISH-TODO-027 | P2 | OPEN | Buy/consider NRS ATB Wetshoe size 11. |
| FISH-TODO-028 | P2 | OPEN | Buy/consider NRS Champion Jacket and Bib, with neoprene cuffs, waterproof zipper and articulated hood requirements. |
| FISH-TODO-029 | P2 | OPEN | Determine bow-hatch item tie-offs, including tool bag/bilge pump. |
| FISH-TODO-031 | P3 | OPEN | Continue/confirm Science of the Strike episodes 8 and 16 (dissolved oxygen/turbidity). A dissolved-oxygen/turbidity transcript was reviewed in September; do not close until both originally targeted episodes are confirmed complete. |
| FISH-TODO-037 | P3 | PLAN APPROVED / TRANSFER BEFORE P0 | v3: all four gates approved October 19 with mandatory full new-chat handoff before starting P0; proceed under staged safeguards after fresh source/production restoration. No production cutover approval. |
| FISH-TODO-039 | P2 | OPEN | Apply T-9 on kayak hardware. |
| FISH-TODO-040 | P2 | OPEN | Commission and integrate the purchased Garmin Force Current system on the RVR119: clean/inspect/service exposed items, charge/baseline the Redodo 24V 50Ah battery, reset/re-pair/update/calibrate motor/remote/Power Steer pedals/MOB tag, complete on-water calibration and functional testing, and fit/protect a snug hard-plastic storage case/bin with at least 38 × 18 × 8 in **verified usable interior** dimensions (orange preferred); determine safe reusable cushioning without encasing the electronics in spray foam. |

### Current Force Current ownership / commissioning state

Purchased **October 6, 2026** for **$2,800** from a seller in Gresham, Oregon: Garmin Force Current motor, Power Steer wireless pedals, handheld remote, MOB tag, Redodo 24V 50Ah LiFePO4 battery + charger, high-efficiency prop and weedless prop. The original Garmin receipt is from July 2026; Garmin confirmed to the user that the remaining three-year standard warranty will be honored with the original receipt. Seller reported freshwater-only use.

Storage requirement for the motor/pedals: **hard plastic**, minimum usable interior **38 × 18 × 8 in**, compact/snug, orange preferred. Flexible bags are rejected; the Hyper Tough 50-gallon tote was rejected as too large. A **48 × 19 × 14 in lidded bin** is now being considered/discussed for foam inserts; **confirmed usable interior measurements and actual purchase/ownership status are not established**. Consider cut closed-cell EVA/PE foam before sprayed construction foam, protect controls and connectors, and avoid moisture entrapment.

## Resolved/deleted items that must not be resurrected

- FISH-TODO-005 resolved: installed fish-finder power is Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and 22–18 AWG disconnects.
- FISH-TODO-006 no longer needed.
- FISH-TODO-007 complete.
- FISH-TODO-009 resolved by purchase of Canyon fish bag.
- FISH-TODO-010 no longer needed.
- FISH-TODO-017 resolved: PowerBait still-rig hook size #4.
- FISH-TODO-018 resolved: non-slip loop knot accepted.
- FISH-TODO-030 explicitly deleted; never restore.
- FISH-TODO-032, -033 and -034 no longer needed.
- FISH-TODO-038 complete: outer rod holders remounted.

## Continuation rules

Use Chat mode by default. Restore actual latest `main` and open-PR state before repository work.

For routine source-aware Gear/KB/Catch authoring, use FISH108 Fast Content Release without consuming an application ID. FISH-TODO-115 and FISH-TODO-116 are allocated as recorded above; the next unused application ID is FISH-TODO-117 unless newer `main` has allocated it.

Do not reopen completed FISH096–FISH114 without an explicit new request. Fishing Companion v3 requirements, design, UX and implementation plan are each approved. **Full transfer to a new Chat must occur before P0 work.** Implement only within the approved staged plan after source/production restoration and satisfy all conditional security/provider/release gates; v3 production cutover requires separate explicit sign-off.

When the user says **“It’s time to transfer to a new chat”**, ask once for confirmation of the full handoff. After confirmation, reconcile current repository/production state, update authoritative records where durable state changed, preserve unresolved work and purchase uncertainty, cross-check the files, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.
