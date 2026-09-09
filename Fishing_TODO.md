# Fishing TODO

_Last reconciled: 2026-09-08 (Pacific time)._

This is the canonical backlog. Current facts live in structured source and authored Markdown; historical task descriptions, completed release details and prior versions remain in Git/History. Statuses: OPEN, WAITING ON USER, IN PROGRESS, DEFERRED, DONE, SUPERSEDED. P1 is necessary for the approved core/data integrity; P2 is useful but not required at launch; P3 is optional. Do not infer purchases, ownership or historical catch attribution.

## V2 project

The approved requirements source is `Fishing_Companion_v2_Approved_Baseline.md`; exact user responses remain in the Inventory and Design Review. All fourteen review decisions are resolved. Application implementation has not started. Do not start a P2 synchronization or direct-save system without its own approval.

| ID | Priority | Status | Work item / next action |
|---|---|---|---|
| FISH-TODO-071 | P1 | DONE | Reconcile the completed v2 Inventory and fourteen Design Review decisions into the approved requirements/architecture baseline. Preserve original responses, update authoritative project records, and distinguish design approval from implementation/deployment. |
| FISH-TODO-072 | P1 | OPEN | Read-only current-source, dependency, data/media and CI audit. Inventory actual records/files/bytes/dimensions/remote-only images, current active media choices, source links, browser-only data risks and failure categories. Prepare the complete migration mapping and testable engineering contracts. Do not claim an audit or browser test passed before it has run. |
| FISH-TODO-073 | P1 | WAITING ON USER | After explicit build authorization, implement the approved minimal v2 architecture and a representative Gear/KB/Catch vertical slice without retired media/persistence machinery. Validate contracts and representative browser behavior before expanding. |
| FISH-TODO-074 | P1 | OPEN | Complete verified one-time data/media migration, including six independent rod/reel records, exact component fact/Notes copying, unaffected IDs, simplified Catch fields, all authored content and local images. Preserve browser-only differences and resolve remote-only images using user uploads. Produce a machine-checkable reconciliation report. Depends on 072–073. |
| FISH-TODO-075 | P1 | OPEN | Complete approved browsing, Gear/KB handoffs, search/filter/sort rules, viewer and entire-library offline reading. Validate supported browsers and last-known-good cache behavior. Depends on 073–074. |
| FISH-TODO-076 | P1 | OPEN | One-time separate v2 preview, current-main reconciliation, acceptance, production cutover, actual deployment/asset verification, rollback checkpoint and removal of obsolete active v1 code. Depends on 074–075. |
| FISH-TODO-077 | P2 | DEFERRED | Review direct Save/authentication, integrated upload, Catch browser authoring/filters and offline outbox as separately approved stages. No P2 infrastructure in P1. |
| FISH-TODO-063 | P2 | SUPERSEDED | Historical v1 KB filename/upload-destination usability issue. The approved v2 media/filename/authoring model replaces its old ID-prefix/source-owner requirements. Preserve the existing v1 behavior until cutover; resolve the underlying usability issue through 073–075. |
| FISH-TODO-039 | P2 | SUPERSEDED | Historical request to record rod/reel setups on new catches. V2 explicitly removes structured setup references. Do not reintroduce them; optional equipment information belongs in Catch Notes. |

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

FISH069/070 were completed in PR60; FISH068 in PR58; FISH067 in PR57; FISH064–066 in PR54/56; FISH062 in PR52; FISH061 in PR50; FISH060 in PR48/49; FISH058 in PR47; FISH059 was the Cylinder Weights media release. Complete evidence and the earlier completed-task table are preserved in Git history, `History/2026-09-07-pre-recovery/Fishing_TODO.md` and the dated release files. The historical duplicate FISH060 handoff ID remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next unused canonical task ID is FISH-TODO-078. No completed task has been reopened or discarded by this reconciliation.
