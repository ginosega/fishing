# Fishing TODO

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. The cleanup is undergoing the full build/browser/hosted gate; the prior verified production release remains the release checkpoint until publication completes.


_Last reconciled: September 10, 2026._

This is the canonical backlog. Preserve source, ownership uncertainty and unrelated work.

## V2 project

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Production revision `ceef1df0dd8b204e7aa59c63e95a0d75346f4a92`, release `7ff6f62d921d5e86e0d97ae89b361120`, passed [publication and hosted verification](https://github.com/ginosega/fishing/actions/runs/34441600093). PR64 is merged. The user authorized production and waived another preview review; all seven previously required missing pictures are explicitly deferred. The affected records remain available without pictures. No acceptance or media approval blocks this release.

Validation: 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios, including the actual archived-v1 worker transition and retained browser stores. All 197 hosted files match the verified production build; live navigation, image viewer, offline reload, counts and absent-picture behavior pass. These are automated browser and direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources are archived in Git history and the pre-cleanup checkpoint; exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. This authorized Work phase is complete; continue in Chat.


| ID | Priority | Status | Work item / next action |
|---|---|---|---|
| FISH-TODO-071 | P1 | DONE | Reconcile the approved Inventory and fourteen Design Review decisions into the authoritative baseline. Preserve original responses. PR 62. |
| FISH-TODO-072 | P1 | DONE | Complete the pinned source/dependency/data/media audit and minimal technical contracts. Source and verified-build evidence retained; browser/device gates tracked separately. |
| FISH-TODO-073 | P1 | DONE | P1 implementation and review corrections integrated through PR64; production evidence is in the September10 release record. |
| FISH-TODO-074 | P1 | DONE | Pinned one-time migration completed at `6615ae7296e48d90dceab303b6b5a1fbc041ab80`, run 34328748390 success. Gear 66 → 69, KB 54, Catches 5, exact narrative preservation, 49 approved image adoptions and machine reconciliation. Remaining media exceptions are 078; any required current-main source refresh is part of 076. Do not rerun the original migration. |
| FISH-TODO-075 | P1 | DONE | 20 core tests, 20 preview-scope and 22 production-scope Chromium/WebKit scenarios pass, plus actual hosted verification. Includes actual-v1 worker transition and retained stores; no physical-device inspection claimed. |
| FISH-TODO-076 | P1 | DONE | User-authorized production cutover completed through PR64, consolidated single pipeline, root-scope offline/browser acceptance, hosted-byte verification and record reconciliation. V1 rollback preserved in Git; obsolete publishers and one-time workflows retired in history. |
| FISH-TODO-077 | P2 | DEFERRED | Direct Save/authentication, integrated uploads, Catch browser authoring and offline editing/outbox/sync require separate approval. No P2 infrastructure in P1. |
| FISH-TODO-078 | P2 | DEFERRED | User approved leaving all seven formerly required pictures absent and will add them later. All Gear/KB items remain. Generic inline-spinner is optional. Original migration report is preserved; media-decisions.json records the new disposition. No automatic acquisition or adoption of unapproved F-3/new images. |
| FISH-TODO-079 | P1 | DONE | User accepted source equivalence and waived a separate device-only IndexedDB export for the pinned migration. No device inspection is claimed. Preserve old stores and reconcile any later-discovered local-only data before retirement. |
| FISH-TODO-080 | P1 | DONE | Reconcile current project records, decisions, TODO, source/technical addenda and bootstrap for temporary Work handoff. Preserve original requirements and complete a cross-file consistency audit. Details in the dated Work Handoff. |
| FISH-TODO-081 | P1 | DONE | Viewer names/selectors, dirty navigation, update/reload race, failed-content retry, atomic release publication and honest Offline Ready state repaired. Regression tests cover corruption, missing assets, quota/promotion failure, old-release immutability and repair. Full hosted gate passes without weakening integrity assertions. |
| FISH-TODO-082 | P1 | DONE | Supplied Word/twelve-screenshot review implemented in PR69 and published through PR64. Verbatim feedback is retained; layout, loading, missing-picture and clipboard success/failure checks pass. |
| FISH-TODO-083 | P1 | IN PROGRESS | User-requested repository cleanup: consolidate application/reference under pwa, remove obsolete roots/v1 helpers, preserve current source uploads and recovery; complete full CI and hosted verification. Routine Add/Edit must not accumulate per-item scaffolding. |
| FISH-TODO-063 | P2 | SUPERSEDED | Historical v1 KB filename/upload usability issue. V2 approved filename/authoring model replaces old ID-prefix/source-owner requirements; v1 is now historical. |
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

FISH069/070 were completed in PR 60; FISH068 in PR 58; FISH067 in PR 57; FISH064–066 in PR 54/56; FISH062 in PR 52; FISH061 in PR 50; FISH060 in PR 48/49; FISH058 in PR 47; FISH059 was the Cylinder Weights media release. Complete evidence and the earlier completed-task table are preserved in Git history, `History/2026-09-07-pre-recovery/Fishing_TODO.md` and the dated release files. The historical duplicate FISH060 handoff ID remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next unused canonical task ID is FISH-TODO-084. No completed task has been reopened or discarded by this reconciliation.
