# Fishing TODO

## Current project task state — September 13, 2026

**FISH-TODO-101 — DONE / production-verified.** The submitted Knot change-package batch plus the explicit request to remove Double Uni Knot and Single Uni Knot were validated and applied through [PR121](https://github.com/ginosega/fishing/pull/121). Branch validation [run 34766670229](https://github.com/ginosega/fishing/actions/runs/34766670229) confirmed all submitted stale-base checks and recomputed the exact byte counts/SHA-256 hashes for all **39** pre-uploaded media files. Full pre-merge production acceptance [run 34766717362](https://github.com/ginosega/fishing/actions/runs/34766717362) passed.

The requested canonical result activates Improved Clinch (11 PNG), Modified Uni (12 JPG), and Trilene (15 PNG) sequences; adds the submitted static Non-Slip Loop picture; applies the submitted content/structured Knot refinements; updates Bowline's description; keeps Palomar's 13-frame sequence while applying its Markdown refinement; and removes Double Uni Knot and Single Uni Knot records plus their Markdown articles. Canonical KB count is now **55**.

The feature merge source was `360d71ff2bfaf075ad498d18f05126268f6606f1`. Its first exact-main Pages deployment succeeded but the hosted verifier still expected 57 KB records. Verification-only [PR122](https://github.com/ginosega/fishing/pull/122) changed only that stale expectation to 55.

Current verified production is source `2b76f9f91757705e361ed3485da0627e493c8d7d`, release `eeba6be85560163522778e2e795d91d9`, [run 34768935480](https://github.com/ginosega/fishing/actions/runs/34768935480), with **325 hosted v2 files** and hosted-verification artifact `10322070321`.

FISH-TODO-077/P2 remains **DEFERRED**. Authentication, Direct Save, integrated uploads, offline authoring, outbox/sync and Catch authoring are not part of current production.

The next unused canonical task ID is **FISH-TODO-102**.

## Completed/superseded application work

FISH071–076 and FISH078–101 are complete. FISH077 is the intentional deferred P2 boundary. Historical v1-only items FISH-TODO-063 (old KB filename/upload constraints) and FISH-TODO-039 (structured setup recording on catches) are superseded by the approved v2 architecture and must not be used to reintroduce retired structures.

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

Use Chat mode by default. Restore actual latest `main` before acting. For new application work, allocate **FISH-TODO-102** unless a newer task has already been created on current `main`. Do not reopen FISH096–FISH101 or P2 work without an explicit new user request.