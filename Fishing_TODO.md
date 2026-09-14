# Fishing TODO

## Current project task state — September 14, 2026

**FISH-TODO-107 — DONE / production-verified.** FISH107 implemented the supplied Fishing Companion Gear edit package for `skylety-fishing-hook-sharpener` through [PR136](https://github.com/ginosega/fishing/pull/136), changing only its canonical type from `Kayaks` to `Tools`. Notes, picture, picture sequence, all other fields and unrelated source were preserved.

The package base revision `9b419e07f9a3a56a2be1ddbfb0df1760fe2730cb`, record hash `31811a75b2d315a2c98a7b25bf8b51fd52c77195b6c54783e90cdb0aa4c57db8`, and base type `Kayaks` were validated before application. Final feature acceptance passed at exact PR head `f36be26dddfb2da8c0957917c0fceb389192177e` in [run 34811426937](https://github.com/ginosega/fishing/actions/runs/34811426937).

Verified production is application source `6fae3afbe8f227b4c12875c5d5e8f0d4c0c8861f`, release `21d203ccdef509cd99626680ae34de98`, [run 34811980881](https://github.com/ginosega/fishing/actions/runs/34811980881), with **342 hosted v2 files** and hosted-verification artifact `10334949254`. Canonical counts remain **80 Gear, 56 KB and 5 Catches**; measured source baselines remain **110 canonical library paths** and **245 inventory references**. Full source/core, Chromium/WebKit, production-browser, archived-v1 cutover, exact-main, Pages, hosted-byte and hosted-browser verification passed.

FISH-TODO-102 through FISH-TODO-106 remain DONE / production-verified. FISH106's original Skylety `Kayaks` classification is superseded in current canonical state by FISH107's `Tools` correction.

**Fishing Companion v3** — historically `FISH-TODO-077/P2` — remains **DEFERRED**. Future scope includes authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization. Do not treat any of that as current production or implicitly approved implementation work.

The next unused canonical application task ID is **FISH-TODO-108**.

## Completed/superseded application work

FISH071–076 and FISH078–107 are complete. Historical `FISH-TODO-077/P2` is the intentional deferred future-phase boundary now called **Fishing Companion v3**. Historical v1-only items FISH-TODO-063 (old KB filename/upload constraints) and FISH-TODO-039 (structured setup recording on catches) are superseded by the approved current architecture and must not be used to reintroduce retired structures.

Detailed completion/release evidence remains in Git history and dated `pwa/docs/` records. This TODO intentionally keeps current open/deferred work instead of repeating every historical release.

## Existing fishing, equipment and content backlog

These items remain open/deferred independently of Fishing Companion release work. Preserve explicit purchase uncertainty; do not infer ownership or completion without user confirmation.

FISH104 documents a fish-finder power architecture and parts list, but it does **not** explicitly confirm that every listed part is the installed configuration. Therefore FISH-TODO-005 remains WAITING ON USER rather than being closed by inference.

FISH105 adds a KastKing HyperSeal Waterproof Tackle Box in size 3600, but the supplied package does **not** explicitly identify that item as the specific “KastKing 3600 deep box” target in FISH-TODO-014. Preserve FISH-TODO-014 as OPEN unless the user explicitly resolves that backlog item. FISH106 and FISH107 do not change either backlog conclusion.

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
| FISH-TODO-037 | P3 | DEFERRED | Multi-user generalization only as part of a future explicitly approved Fishing Companion v3 requirement. |

## Continuation rules

Use Chat mode by default. Restore actual latest `main` before acting. For new application work, allocate **FISH-TODO-108** unless a newer task has already been created on current `main`. Do not reopen FISH096–FISH107 or Fishing Companion v3 work without an explicit new user request.

When the user says **“It’s time to transfer to a new chat”**, ask for confirmation of the full handoff. After confirmation, perform the durable handoff protocol recorded in `Fishing_Decision_Log.md`: reconcile current state, update the authoritative project records and bootstrap prompt as needed, cross-check them, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`. This handoff protocol is not itself a new FISH-TODO application task and does not consume FISH-TODO-108.
