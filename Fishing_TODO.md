# Fishing TODO

## Current project task state — September 13, 2026

**FISH-TODO-104 — DONE / production-verified.** FISH104 implemented the supplied Fishing Companion Gear add package for `humminbird-fish-finder` through [PR130](https://github.com/ginosega/fishing/pull/130). It added the Humminbird Fish Finder record, Markdown operating/setup/navigation/kayak-installation notes, and referenced the exact user-supplied `Humminbird Helix 5 Chirp DI GPS G3.png` picture.

Final FISH104 verified production is source `89e6871d81c509eed7e17d4b437db78be16310b8`, release `6aff63420b64bb790847a7af37f44c10`, [run 34800306796](https://github.com/ginosega/fishing/actions/runs/34800306796), with **329 hosted v2 files** and hosted-verification artifact `10331027567`. Canonical counts are **70 Gear, 56 KB and 5 Catches**. Full source/core, Chromium/WebKit, production-browser, archived-v1 cutover, exact-main, Pages, hosted-byte and hosted-browser verification passed.

The representative Humminbird PNG is **579,304 bytes**, SHA-256 `2ec799df4d20af22031ca7fde682aca1f5c695a5cab028fb251fd2457f3e0d4e`, matching the supplied change package.

FISH-TODO-102 and FISH-TODO-103 remain DONE / production-verified. FISH102 added the Line-Tackle-Knot Reference. FISH103 relocated canonical physical source beneath `pwa/` and fixed authoring/link regressions.

**Fishing Companion v3** — historically `FISH-TODO-077/P2` — remains **DEFERRED**. Future scope includes authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization. Do not treat any of that as current production or implicitly approved implementation work.

The next unused canonical application task ID is **FISH-TODO-105**.

## Completed/superseded application work

FISH071–076 and FISH078–104 are complete. Historical `FISH-TODO-077/P2` is the intentional deferred future-phase boundary now called **Fishing Companion v3**. Historical v1-only items FISH-TODO-063 (old KB filename/upload constraints) and FISH-TODO-039 (structured setup recording on catches) are superseded by the approved current architecture and must not be used to reintroduce retired structures.

Detailed completion/release evidence remains in Git history and dated `pwa/docs/` records. This TODO intentionally keeps current open/deferred work instead of repeating every historical release.

## Existing fishing, equipment and content backlog

These items remain open/deferred independently of Fishing Companion release work. Preserve explicit purchase uncertainty; do not infer ownership or completion without user confirmation.

FISH104 documents a fish-finder power architecture and parts list, but it does **not** explicitly confirm that every listed part is the installed configuration. Therefore FISH-TODO-005 remains WAITING ON USER rather than being closed by inference.

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

Use Chat mode by default. Restore actual latest `main` before acting. For new application work, allocate **FISH-TODO-105** unless a newer task has already been created on current `main`. Do not reopen FISH096–FISH104 or Fishing Companion v3 work without an explicit new user request.

When the user says **“It’s time to transfer to a new chat”**, ask for confirmation of the full handoff. After confirmation, perform the durable handoff protocol recorded in `Fishing_Decision_Log.md`: reconcile current state, update the authoritative project records and bootstrap prompt as needed, cross-check them, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`. This handoff protocol is not itself a new FISH-TODO application task and does not consume FISH-TODO-105.
