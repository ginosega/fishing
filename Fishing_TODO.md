# Fishing TODO

_Last updated: 2026-09-08_

This is the canonical backlog. Runtime facts are owned by structured PWA data and stable-ID authored Markdown; historical OneNote/PDF/Topics and archived records are references, not parallel databases. Complete prior task descriptions and release evidence are preserved in `History/` and Git history.

Status: OPEN (ready), WAITING ON USER (requires confirmation/input), IN PROGRESS (active), DEFERRED (intentionally postponed), DONE (resolved with authoritative source updated). Priority: P1 affects safety/core source of truth; P2 useful verification/gear/technique work; P3 optional/lower urgency. Do not infer purchases, ownership or historical Catch attribution.

## Active Backlog

| ID | Priority | Status | Area | Work item / next action |
|---|---|---|---|---|
| FISH-TODO-005 | P2 | WAITING ON USER | Gear | Verify exact installed fish-finder power system. Historical parts include Amped Outdoors 12V 8Ah, 3A fuse, 2-pin IP68 connector and disconnects; confirm actual installation. |
| FISH-TODO-006 | P2 | OPEN | Kayak | Verify Bonafide RVR119 brass insert thread sizes from manufacturer documentation or measurement. |
| FISH-TODO-007 | P2 | OPEN | Kayak rigging | Decide whether/how to modify rear flush rod-holder angle. Preserve installed Pelican details; evaluate alternatives to heat-bending. |
| FISH-TODO-008 | P2 | WAITING ON USER | Kayak accessories | Confirm whether RVR119 Under Seat Tackle Storage was purchased. Latest authored Notes still list it as needed; do not infer ownership. |
| FISH-TODO-009 | P2 | WAITING ON USER | Kayak accessories | Confirm whether YakAttack 38 x 13 fish cooler bag was purchased; record exact SKU/status only after confirmation. |
| FISH-TODO-010 | P2 | OPEN | Tackle | Buy/consider tubes and internal tube jigheads for Lake Washington/Sammamish smallmouth. |
| FISH-TODO-011 | P2 | OPEN | Tackle | Buy/consider bullet weights for Texas rigs/Rage Craw. |
| FISH-TODO-012 | P2 | OPEN | Tackle | Buy/consider 1/8 oz weighted EWG hooks for Power Jerk Shad/depth control. |
| FISH-TODO-013 | P2 | OPEN | Tackle | Buy/consider Carolina Keepers as alternative to bead/swivel in slip-sinker rigs. |
| FISH-TODO-014 | P3 | OPEN | Tackle | Watch for KastKing 3600 deep box. |
| FISH-TODO-015 | P3 | OPEN | Tackle | Buy/consider Berkley Warpig, 1/2 oz, 3", Blue Shad. |
| FISH-TODO-016 | P3 | OPEN | Tackle | Buy/consider Bait Pop with red flake; water-soluble/shrimp-extract preference noted. |
| FISH-TODO-017 | P2 | OPEN | Techniques | Resolve PowerBait still-rig hook size: historical #4 versus prior #8 guidance. Preserve both until tested/decided. |
| FISH-TODO-018 | P2 | OPEN | Techniques/knots | Resolve loop-knot guidance conflict between historical warning and action-oriented recommendations. |
| FISH-TODO-019 | P2 | OPEN | KB Equipment | Build Texas Rig page. |
| FISH-TODO-020 | P3 | OPEN | KB Equipment | Build Carolina Rig page. |
| FISH-TODO-021 | P3 | OPEN | KB Equipment | Build Alabama Rig page. |
| FISH-TODO-022 | P3 | OPEN | KB Equipment | Build Neko Rig page; use historical seed references, full authored article needed. |
| FISH-TODO-023 | P3 | OPEN | KB Equipment | Build Spoons page; inventory/usage exists elsewhere. |
| FISH-TODO-024 | P3 | OPEN | Locations | Research Lake Bosworth bass. |
| FISH-TODO-025 | P3 | OPEN | Shopping/local | Visit/check Holiday Sports in Burlington. |
| FISH-TODO-026 | P3 | OPEN | Community | Research/join fish club. |
| FISH-TODO-027 | P2 | OPEN | Clothing | Buy/consider NRS ATB Wetshoe size 11. |
| FISH-TODO-028 | P2 | OPEN | Clothing | Buy/consider NRS Champion Jacket and Bib; jacket requirements include neoprene cuffs, waterproof zipper, articulated hood. |
| FISH-TODO-029 | P2 | OPEN | Kayak safety/storage | Determine how to tie off bow-hatch items, including tool bag/bilge pump. |
| FISH-TODO-030 | P3 | DEFERRED | Power/electronics | Evaluate trailer battery for kayak motor/electronics only if motor project returns. |
| FISH-TODO-031 | P3 | OPEN | Learning | Listen/watch Science of the Strike episodes 8 and 16 (dissolved oxygen/turbidity). |
| FISH-TODO-032 | P3 | OPEN | Catch Log | Continue structured catch records; no trips/no-bite sessions, no inferred relationships. |
| FISH-TODO-033 | P3 | OPEN | Safety/regulations | Create regulation recheck checklist: Fish Washington, lake rules, species ID, bait/retention implications. |
| FISH-TODO-034 | P3 | OPEN | Markdown usability | Spot-check links in GitHub Preview and PWA, especially expanded KB articles. |
| FISH-TODO-037 | P3 | DEFERRED | PWA multi-user | Generalize for multiple users only after personal version is mature. |
| FISH-TODO-039 | P2 | OPEN | Catch Log | Record rod/reel setup on new catches when known; do not invent historical null values. |
| FISH-TODO-063 | P2 | OPEN | KB image authoring | Make filename and exact upload destination explicit in the editor. Address the reported `buzzbait.jpg` rejection without weakening safe-path, stable-ID, replacement, ownership or source/derived validation. Consider a clearly generated filename/path and guidance for already-uploaded files. No runtime fix was included in PR52, PR56 or PR58. |

## Completed Items

| ID | Completed | Area | Resolution |
|---|---|---|---|
| FISH-TODO-068 | 2026-09-08 | My Gear / KB media metadata | PR58 added owned Perception Joyride 10.0 as Gear/media ID `perception-joyride-10-0` exactly as supplied, using existing uploaded source `pwa/assets/gear-source/perception-joyride-10.png`, explicit owner, no Notes, and Gear dataVersion `2026-09-08-my-gear-v4-perception-joyride-1` (66 records). It also changed only the Rods & Reels picture caption to `Baitcasting reel`, advancing KB dataVersion to `2026-09-08-kb-v1-rods-reels-caption-1` (54 entities) while preserving the image bytes and authored Markdown. Final head `001249eeb3fb3a17cdc7ffc668fe289d3eb58084`; normal CI #297 / `34189898597`; merge `8cceecc42d7ffab1c672e6991378d032136145b4`; production #298 / `34189948481` passed all permanent tests, build/final-media checks and actual Pages deployment. See `pwa/RELEASE_2026-09-08_JOYRIDE_RODS_CAPTION.md`. |
| FISH-TODO-067 | 2026-09-08 | Media regression | PR57 accepts validated user replacements of the Dagger PNG without freezing a historical image hash, while preserving exact source-to-bundle bytes and ownership. Latest source blob `cfb44c09b6ab3d79a53d50e626664dde5e148a3a` (259840 bytes). |
| FISH-TODO-066 | 2026-09-08 | KB media | PR56 registered Fishing Line, Walking Bait and Rods & Reels hero pictures with exact user-supplied metadata and source bytes; Fishing Line links to Sufix 832, other ownership not inferred. Authored Markdown preserved. CI #284 / `34188600391`; merge `531f04a84c0d75e2a7f23dc368149de5026b607b`; production #285 / `34188668110`. |
| FISH-TODO-065 | 2026-09-08 | Kayak specifications | User confirmed Dagger Axis 10.5 Length is `10' 6"`; corrected and deployed in PR56/production #285. |
| FISH-TODO-064 | 2026-09-08 | My Gear | PR54 added Dagger Axis 10.5 with stable ID, supplied facts and explicit local-media owner; later length correction tracked separately. |
| FISH-TODO-062 | 2026-09-08 | KB/Gear media | PR52 registered Buzzbait and Jack Hammer images while preserving IDs/owners/provenance and authored content. |
| FISH-TODO-061 | 2026-09-07 | Project/production recovery | PR50 fixed the Bonafide Notes regression and incorporated the audit branch; production #260 succeeded. |
| FISH-TODO-060 | 2026-09-07 | KB authoring | PR48 deployed Add/Edit for all five KB types and source-aware media; PR49 closed records. |
| FISH-TODO-058 | 2026-09-07 | Gear schema4 | PR47 deployed schema4, ordered links, Equipment/Gear Guides, Notes images and media replacement gates. |
| FISH-TODO-059 | 2026-09-07 | Cylinder Weights media | User-uploaded Cylinder Weights image registered with original ID/owner/provenance; user verified image live. |

The complete prior completed-task table, including FISH001–004, 035–057 and the historical duplicate-number handoff row, is preserved in `History/2026-09-07-pre-recovery/Fishing_TODO.md` and Git history. No completed task has been reopened or discarded. The duplicate historical FISH060 handoff identifier remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next new canonical task ID is FISH-TODO-069. Future work begins from current main and this backlog; do not resume closed release branches or one-time migrations.
