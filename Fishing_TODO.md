# Fishing TODO

## Production execution — September 10, 2026

The user authorized production cutover and waived another preview review, then explicitly resolved the picture gate: “Yes, omit those, and those gear and KB items can just have no picture. I will add these to the site later.” The seven named pictures are intentionally absent; all Gear/KB records remain. The generic inline-spinner picture remains optional. `v2/migration/media-decisions.json` records this decision separately from the preserved original migration report. No images were acquired or canonical records changed.

Production implementation and root-scope acceptance are in progress. The consolidated `fishing-production.yml` replaces the old v1/preview publishers and one-time workflows; history and the exact v1 rollback ZIPs remain in Git. The root loader now verifies the v2 worker protocol because v1 and v2 share the same `sw.js` URL. Acceptance covers the actual archived v1 worker, retained IndexedDB/cache stores, both browser engines, full offline reading and all prior integrity/editing assertions. Do not claim deployment until the hosted production gate passes. No additional user approval is needed.

The earlier media-blocked and preview-only checkpoints below are historical and superseded by this decision. See [production release](Fishing_v2_Production_Release_2026-09-10.md) for current execution evidence.


_Last reconciled: 2026-09-09 (Pacific time)._

This is the canonical backlog. Current facts live in structured source and authored Markdown; historical task descriptions, completed release details and prior versions remain in Git/History. Statuses: OPEN, WAITING ON USER, IN PROGRESS, DEFERRED, DONE, SUPERSEDED. P1 is necessary for the approved core/data integrity; P2 is useful but not required at launch; P3 is optional. Do not infer purchases, ownership or historical Catch attribution.

## Current review correction and production checkpoint

The supplied first-review corrections are implemented at `d5f09f058e298f3852f4bf6d0ca2545984a0d6ab` on `feature/v2-implementation-20260908` (PR 69 merged into that feature only). The [feedback record](Fishing_v2_Review_Feedback_2026-09-09.md) preserves the user wording. Engineering and prepublication validation pass 19 core tests and all 20 Chromium/WebKit scenarios, with all 217 live v1 files matching their preserved archive.

**Latest user authorization:** “take this all the way to production; I don't need to test these changes in preview, let's go ahead with this build.” This authorizes production cutover and waives another user preview-review gate. Do not ask again for general cutover or preview acceptance. It does not explicitly resolve the seven previously required missing-image exceptions. The actual production build failed with `Migration has 7 unresolved media exceptions; pending-media preview only`. A decision to defer those required pictures or approved replacement images is the current blocker.

No correction refresh or production cutover has been published. The existing live v1 root and original preview (`5da786ef…`, release `b924b223850b4a2741fedb92ce924584`) remain unchanged. PR 70 passed prepublication validation but was closed unmerged after the user requested direct production. Its branch retains the verified combined-deployment and durable-archive approach as reference. PR 64 remains draft/unmerged pending media resolution and production integration. No one-time migration was rerun, source data changed, new images acquired or browser stores removed.

See [Review correction checkpoint](Fishing_v2_Review_Release_2026-09-09.md) for exact refs, CI and continuation. This checkpoint supersedes older statements below that still require user preview acceptance/cutover approval. Chat remains the permanent default; the explicitly authorized Work implementation phase is paused only on the required-media decision.

## V2 project

The approved requirements and fourteen decisions are complete. P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery. P2 remains deferred.

| ID | Priority | Status | Work item / next action |
|---|---|---|---|
| FISH-TODO-071 | P1 | DONE | Reconcile the approved Inventory and fourteen Design Review decisions into the authoritative baseline. Preserve original responses. PR 62. |
| FISH-TODO-072 | P1 | DONE | Complete the pinned source/dependency/data/media audit and minimal technical contracts. Source and verified-build evidence retained; browser/device gates tracked separately. |
| FISH-TODO-073 | P1 | DONE | P1 implementation repaired and verified at `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6` in draft PR 64. Preview published; production integration awaits 076. |
| FISH-TODO-074 | P1 | DONE | Pinned one-time migration completed at `6615ae7296e48d90dceab303b6b5a1fbc041ab80`, run 34328748390 success. Gear 66 → 69, KB 54, Catches 5, exact narrative preservation, 49 approved image adoptions and machine reconciliation. Remaining media exceptions are 078; any required current-main source refresh is part of 076. Do not rerun the original migration. |
| FISH-TODO-075 | P1 | DONE | P1 browser gate passed: 19 core tests and 16 Chromium/WebKit scenarios, including full-library offline reload, source-aware handoffs, viewer, dirty forms, mobile viewport and scope isolation. Actual hosted verification also passed. No physical-device inspection is claimed. |
| FISH-TODO-076 | P1 | WAITING ON USER | Production cutover and waiver of another preview review explicitly authorized. Corrected implementation `d5f09f0…` passes 19 core / 20 browser tests; production build stops on the seven required media exceptions in 078. Need explicit deferral or approved replacements, then complete production integration/pipeline consolidation, root-scope offline/browser tests, serialized deployment, hosted verification and obsolete-v1 cleanup. No further general cutover approval required. |
| FISH-TODO-077 | P2 | DEFERRED | Direct Save/authentication, integrated uploads, Catch browser authoring and offline editing/outbox/sync require separate approval. No P2 infrastructure in P1. |
| FISH-TODO-078 | P1 | WAITING ON USER | Media: 49 approved captures adopted, 2 rejected. Production-build blocker: obtain explicit deferral or resolve seven required items (Tsuridamashii, Rapala F-3, Perch, Popper, Whopper Plopper KB pictures, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60). Generic inline-spinner picture is optional. Rapala's required flag and exact seven-required/one-optional accounting are corrected and tested. The newer v1 archive contains an F-3 capture, retained as evidence only pending approval; it was not adopted into v2. No automatic acquisition, invented replacements or silent deletion. |
| FISH-TODO-079 | P1 | DONE | User accepted source equivalence and waived a separate device-only IndexedDB export for the pinned migration. No device inspection is claimed. Preserve old stores and reconcile any later-discovered local-only data before retirement. |
| FISH-TODO-080 | P1 | DONE | Reconcile current project records, decisions, TODO, source/technical addenda and bootstrap for temporary Work handoff. Preserve original requirements and complete a cross-file consistency audit. Details in the dated Work Handoff. |
| FISH-TODO-081 | P1 | DONE | Viewer names/selectors, dirty navigation, update/reload race, failed-content retry, atomic release publication and honest Offline Ready state repaired. Regression tests cover corruption, missing assets, quota/promotion failure, old-release immutability and repair. Full hosted gate passes without weakening integrity assertions. |
| FISH-TODO-082 | P1 | DONE | Implement supplied layout/authoring review from Word and twelve PNGs; PR 69 merged into v2 feature, 19 core and 20 browser scenarios pass; layout screenshots inspected. Publication is tracked separately under 076 and remains blocked by 078. Verbatim feedback and exact checkpoint are preserved. |
| FISH-TODO-063 | P2 | SUPERSEDED | Historical v1 KB filename/upload usability issue. V2 approved filename/authoring model replaces old ID-prefix/source-owner requirements; preserve v1 behavior until cutover. |
| FISH-TODO-039 | P2 | SUPERSEDED | Historical structured setup recording on catches. V2 removes setup references; equipment details belong in Catch Notes. |

## Existing fishing, equipment and content backlog

The following items remain open/deferred independently of the v2 rebuild. Their original full descriptions and history remain available in the prior TODO and source documents. Retain explicit purchase uncertainty.

| ID | Priority | Status | Work item |
|---|---|---|---|
| FISH-TODO-005 | P2 | WAITING ON USER | Verify exact installed fish-finder power system; historical Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and disconnects need confirmation. |
| FISH-TODO-006 | P2 | OPEN | Verify Bonafide RVR119 brass insert thread sizes. |
| FISH-TODO-007 | P2 | OPEN | Decide whether/how to modify rear flush rod-holder angle; preserve Pelican installation details and evaluate alternatives to heat-bending. |
| FISH-TODO-008 | P2 | WAITING ON USER | Confirm whether RVR119 Under Seat Tackle Storage was purchased; do not infer ownership. |
| FISH-TODO-009 | P2 | WAITING ON USER | Confirm whether YakAttack 38 x 13 fish cooler bag was purchased; verify exact SKU/status. |
| FISH-TODO-010 | P2 | OPEN | Buy/consider tubes and internal tube jigheads for Lake Washington/Sammamish smallmouth. |
| FISH-TODO-011 | P2 | OPEN | Buy/consider bullet weights for Texas rigs/Rage Craw. |
| FISH-TODO-012 | P2 | OPEN | Buy/consider 1/8 oz weighted EWG hooks for Power Jerk Shad/depth control. |
| FISH-TODO-013 | P2 | OPEN | Buy/consider Carolina Keepers as slip-sinker alternative. |
| FISH-TODO-014 | P3 | OPEN | Watch for KastKing 3600 deep box. |
| FISH-TODO-015 | P3 | OPEN | Buy/consider Berkley Warpig, 1/2 oz, 3 in, Blue Shad. |
| FISH-TODO-016 | P3 | OPEN | Buy/consider Bait Pop with red flake; water-soluble/shrimp-extract preference. |
| FISH-TODO-017 | P2 | OPEN | Resolve PowerBait still-rig hook size (#4 versus #8). |
| FISH-TODO-018 | P2 | OPEN | Resolve loop-knot guidance conflict. |
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
| FISH-TODO-030 | P3 | DEFERRED | Evaluate trailer battery for kayak motor/electronics only if motor project returns. |
| FISH-TODO-031 | P3 | OPEN | Listen/watch Science of the Strike episodes 8 and 16 (dissolved oxygen/turbidity). |
| FISH-TODO-032 | P3 | OPEN | Continue individual structured Catch records, with no trips/no-bite sessions or inferred relationships. |
| FISH-TODO-033 | P3 | OPEN | Create regulations recheck checklist for Fish Washington, lake rules, species identification and bait/retention implications. |
| FISH-TODO-034 | P3 | OPEN | Spot-check authored links in GitHub Preview and PWA. |
| FISH-TODO-037 | P3 | DEFERRED | Multi-user generalization only if a future explicit requirement arises. |

## Historical completion and release references

FISH069/070 were completed in PR 60; FISH068 in PR 58; FISH067 in PR 57; FISH064–066 in PR 54/56; FISH062 in PR 52; FISH061 in PR 50; FISH060 in PR 48/49; FISH058 in PR 47; FISH059 was the Cylinder Weights media release. Complete evidence and the earlier completed-task table are preserved in Git history, `History/2026-09-07-pre-recovery/Fishing_TODO.md` and the dated release files. The historical duplicate FISH060 handoff ID remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next unused canonical task ID is FISH-TODO-083. No completed task has been reopened or discarded by this reconciliation.
