# Fishing TODO

_Last reconciled: 2026-09-09 (Pacific time)._

This is the canonical backlog. Current facts live in structured source and authored Markdown; historical task descriptions, completed release details and prior versions remain in Git/History. Statuses: OPEN, WAITING ON USER, IN PROGRESS, DEFERRED, DONE, SUPERSEDED. P1 is necessary for the approved core/data integrity; P2 is useful but not required at launch; P3 is optional. Do not infer purchases, ownership or historical Catch attribution.

## V2 project

The approved requirements and fourteen decisions are complete. P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery. P2 remains deferred.

| ID | Priority | Status | Work item / next action |
|---|---|---|---|
| FISH-TODO-071 | P1 | DONE | Reconcile the approved Inventory and fourteen Design Review decisions into the authoritative baseline. Preserve original responses. PR 62. |
| FISH-TODO-072 | P1 | DONE | Complete the pinned source/dependency/data/media audit and minimal technical contracts. Source and verified-build evidence retained; browser/device gates tracked separately. |
| FISH-TODO-073 | P1 | DONE | P1 implementation repaired and verified at `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6` in draft PR 64. Preview published; production integration awaits 076. |
| FISH-TODO-074 | P1 | DONE | Pinned one-time migration completed at `6615ae7296e48d90dceab303b6b5a1fbc041ab80`, run 34328748390 success. Gear 66 → 69, KB 54, Catches 5, exact narrative preservation, 49 approved image adoptions and machine reconciliation. Remaining media exceptions are 078; any required current-main source refresh is part of 076. Do not rerun the original migration. |
| FISH-TODO-075 | P1 | DONE | P1 browser gate passed: 19 core tests and 16 Chromium/WebKit scenarios, including full-library offline reload, source-aware handoffs, viewer, dirty forms, mobile viewport and scope isolation. Actual hosted verification also passed. No physical-device inspection is claimed. |
| FISH-TODO-076 | P1 | WAITING ON USER | Isolated preview published and hosted-verified; current main reconciled; exact v1 root and durable rollback preserved. Review [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md). Explicit preview acceptance and separate cutover authorization are still required before PR 64 integration, production publication and obsolete-v1 cleanup. Consolidate temporary workflows during that approved production integration. |
| FISH-TODO-077 | P2 | DEFERRED | Direct Save/authentication, integrated uploads, Catch browser authoring and offline editing/outbox/sync require separate approval. No P2 infrastructure in P1. |
| FISH-TODO-078 | P1 | WAITING ON USER | Media: 49 approved captures adopted, 2 rejected. Resolve seven required items (Tsuridamashii, Rapala F-3, Perch, Popper, Whopper Plopper KB pictures, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60). Generic inline-spinner picture is optional. Rapala's required flag and exact seven-required/one-optional accounting are corrected and tested. The newer v1 archive contains an F-3 capture, retained as evidence only pending approval; it was not adopted into v2. No automatic acquisition, invented replacements or silent deletion. |
| FISH-TODO-079 | P1 | DONE | User accepted source equivalence and waived a separate device-only IndexedDB export for the pinned migration. No device inspection is claimed. Preserve old stores and reconcile any later-discovered local-only data before retirement. |
| FISH-TODO-080 | P1 | DONE | Reconcile current project records, decisions, TODO, source/technical addenda and bootstrap for temporary Work handoff. Preserve original requirements and complete a cross-file consistency audit. Details in the dated Work Handoff. |
| FISH-TODO-081 | P1 | DONE | Viewer names/selectors, dirty navigation, update/reload race, failed-content retry, atomic release publication and honest Offline Ready state repaired. Regression tests cover corruption, missing assets, quota/promotion failure, old-release immutability and repair. Full hosted gate passes without weakening integrity assertions. |
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

FISH069/070 were completed in PR 60; FISH068 in PR 58; FISH067 in PR 57; FISH064–066 in PR 54/56; FISH062 in PR 52; FISH061 in PR 50; FISH060 in PR 48/49; FISH058 in PR 47; FISH059 was the Cylinder Weights media release. Complete evidence and the earlier completed-task table are preserved in Git history, `History/2026-09-07-pre-recovery/Fishing_TODO.md` and the dated release files. The historical duplicate FISH060 handoff ID remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next unused canonical task ID is FISH-TODO-082. No completed task has been reopened or discarded by this reconciliation.
