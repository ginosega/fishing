# Fishing TODO

_Last updated: 2026-09-07_

This is the canonical backlog. Current runtime facts are owned by the structured PWA data and stable-ID authored Markdown; historical OneNote/PDF/Topics and the archived pre-recovery TODO are reference sources, not parallel current databases. All original task descriptions and completed release evidence are preserved byte-for-byte in `History/2026-09-07-pre-recovery/Fishing_TODO.md`.

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

## Completed Items

| ID | Completed | Area | Resolution |
|---|---|---|---|
| FISH-TODO-061 | 2026-09-07 | Project/production recovery | PR50 fixed the frozen Bonafide Notes regression and incorporated the full audit branch. Head `6b5f9221803c265a78c5d4f391813c9517a9ebc0`; normal CI #259 / `34184091548` passed; merge `fcf28f34b89f68c22e8a2200e8410509801ff801`; production #260 / `34184126036` passed including actual Pages deployment. Latest user edits/images preserved; permanent tests retained; no migration. Documentation reconciled and pre-recovery records archived. See `Fishing_Recovery_Closeout_2026-09-07.md`. |
| FISH-TODO-060 | 2026-09-07 | KB authoring | PR48 deployed Add/Edit for all five KB types, complete Markdown/Preview, immutable IDs/paths, source-aware media and validated handoffs. Head `85245de2451db97370268e14dfc2c66a53c8c61d`; CI #251 / `34142498510`; merge `6d04e29b6770000eaa50f6c449ad82bc88f7326d`; production #252 / `34142574286` succeeded. PR49 reconciled release records, merge `024bec08a51c103e98c9913e786db2de40155b64`, production #254 / `34159581055`. |
| FISH-TODO-058 | 2026-09-07 | Gear schema4 | PR47 merge `f05b7ec532d8e45f3fc36c1e0976c5ea40eb9983`; CI #239 / `34135260691`; production #240 / `34135326910` passed. Ordered links, Equipment/Gear Guides, Notes images, picture replacement and permanent regression gates deployed/user accepted. |
| FISH-TODO-059 | 2026-09-07 | Cylinder Weights media | User-uploaded `thkfish-cylinder-weights.jpg` registered with original ID/owner/provenance; user verified image live. |

The complete prior completed-task table, including FISH001–004, 035–057 and the historical duplicate-number handoff row, is preserved in `History/2026-09-07-pre-recovery/Fishing_TODO.md`. No completed task has been reopened or discarded. The duplicate historical FISH060 handoff identifier remains retired as `ARCHIVE-2026-09-06-HANDOFF`. The next new canonical task ID is FISH-TODO-062. Future work begins from current main and this backlog; do not resume closed release branches or one-time migrations.
