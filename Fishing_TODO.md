# Fishing TODO

## Current project task state — September 13, 2026

**FISH-TODO-099 — DONE / production-verified.** Four user-supplied `fishing-companion-change-v2` KB packages were validated and applied through [PR116](https://github.com/ginosega/fishing/pull/116). Branch validation [run 34738967489](https://github.com/ginosega/fishing/actions/runs/34738967489) verified the record/content bases and all **45** uploaded JPG byte counts/SHA-256 hashes before promotion. Pre-merge acceptance [run 34738991146](https://github.com/ginosega/fishing/actions/runs/34738991146) passed.

Requested canonical results: Albright description/Markdown updated while its 15-frame sequence was kept; Arbor description/Markdown updated and its 9-frame sequence activated; Bowline Knot added with Markdown and a 7-frame sequence; FG Markdown replaced and its 29-frame sequence activated while keeping its structured description. Representative frames are Albright `step-15.jpg`, Arbor `step-09.jpg`, Bowline `step-07.jpg`, and FG `step-29.jpg`.

The initial production deploy exposed a stale hosted-verifier expected KB count (56 instead of the correct 57 after adding Bowline). Verification-only [PR117](https://github.com/ginosega/fishing/pull/117) repaired that one-line expectation and passed full CI. Final verified production is source `9899849be676e971e3670fe72eba7ffd66986d68`, release `b331a8c5575769159113a59a17b12bca`, [run 34740072017](https://github.com/ginosega/fishing/actions/runs/34740072017), with **288 hosted v2 files** and hosted-verification artifact `10312475498`.

FISH-TODO-077/P2 remains **DEFERRED**. Authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring are not part of current production.

The next unused canonical task ID is **FISH-TODO-100**.
## Completed/superseded application work

FISH071–076 and FISH078–099 are complete. FISH077 is the intentional deferred P2 boundary. Historical v1-only items FISH-TODO-063 (old KB filename/upload constraints) and FISH-TODO-039 (structured setup recording on catches) are superseded by the approved v2 architecture and must not be used to reintroduce retired structures.

Detailed completion/release evidence remains in Git history and dated `pwa/docs/` records. This TODO intentionally keeps current open/deferred work instead of repeating every historical release.

## Existing fishing, equipment and content backlog

These items remain open/deferred independently of Fishing Companion release work. Preserve explicit purchase uncertainty; do not infer ownership or completion without user confirmation.

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

## Continuation rules

Use Chat mode by default. Restore actual latest `main` before acting. For new application work, allocate **FISH-TODO-100** unless a newer task has already been created on current `main`. Do not reopen FISH096/FISH097/FISH098/FISH099 or P2 work without an explicit new user request.