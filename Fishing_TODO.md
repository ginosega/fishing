# Fishing TODO

_Last updated: 2026-08-30_

This file is the canonical backlog for unresolved Fishing-project verification items, research tasks, equipment questions, technique work, and owner follow-ups.

GitHub Markdown is the sole active project knowledge base. The legacy OneNote/PDF may be consulted as a historical migration source, but it is not a parallel active source of truth.

## Status convention

- **OPEN** — ready to work.
- **WAITING ON USER** — requires information, photos, documents, measurements, purchase confirmation, or a decision from the user.
- **IN PROGRESS** — actively being worked.
- **DEFERRED** — intentionally postponed.
- **DONE** — resolved; update the authoritative topic/registry/inventory file before moving the item to Completed Items.

## Priority convention

- **P1** — high value / materially affects safety, core equipment state, or source of truth.
- **P2** — useful verification, documentation, equipment, or technique work.
- **P3** — optional cleanup / lower urgency.

---

## Active Backlog

| ID | Priority | Status | Area | Work item | Next action / notes |
|---|---|---|---|---|---|
| FISH-TODO-005 | P2 | WAITING ON USER | Gear registry | Verify exact fish-finder power system installed state. | OneNote has parts: Amped Outdoors 12V 8Ah battery, 3A inline fuse, 2-pin IP68 connector, disconnects; confirm what is actually installed. |
| FISH-TODO-006 | P2 | OPEN | Kayak | Verify Bonafide RVR119 brass insert bolt/thread sizes. | Recover source details from historical chats/OneNote, manufacturer documentation, or user measurement. |
| FISH-TODO-007 | P2 | OPEN | Kayak rigging | Decide whether/how to modify rear flush rod-holder angle. | Preserve installed Pelican rod-holder details; evaluate alternatives to heat-bending. |
| FISH-TODO-008 | P2 | WAITING ON USER | Kayak accessories | Confirm whether Bonafide RVR119 Under Seat Tackle Storage was purchased. | OneNote still lists as buy/research item, not owned. |
| FISH-TODO-009 | P2 | WAITING ON USER | Kayak accessories | Confirm whether YakAttack 38 x 13 insulated fish cooler bag was purchased. | If purchased, add exact SKU/status to gear registry. |
| FISH-TODO-010 | P2 | OPEN | Tackle | Buy/consider tubes and internal tube jigheads. | Useful for Lake Washington/Sammamish smallmouth. |
| FISH-TODO-011 | P2 | OPEN | Tackle | Buy/consider bullet weights for Texas rigs. | Needed for Rage Craw / soft plastics Texas-rig use. |
| FISH-TODO-012 | P2 | OPEN | Tackle | Buy/consider 1/8 oz weighted EWG hooks. | Useful for Berkley Power Jerk Shad and soft jerkbait depth control. |
| FISH-TODO-013 | P2 | OPEN | Tackle | Buy/consider Carolina Keepers. | OneNote listed as buy item; useful as alternative to bead/swivel in some slip-sinker rigs. |
| FISH-TODO-014 | P3 | OPEN | Tackle | Watch for KastKing 3600 deep box. | OneNote tackle-management note. |
| FISH-TODO-015 | P3 | OPEN | Tackle | Buy/consider Berkley Warpig. | OneNote buy item: 1/2 oz, 3", Blue Shad. |
| FISH-TODO-016 | P3 | OPEN | Tackle | Buy/consider Bait Pop with red flake. | OneNote scent TODO; prefer water-soluble scent, shrimp-extract flavor noted. |
| FISH-TODO-017 | P2 | OPEN | Techniques | Resolve hook-size guidance for PowerBait still rigs. | OneNote rig uses #4 hook; prior guidance often used #8 for PowerBait/Power Eggs. Keep both until tested/decided. |
| FISH-TODO-018 | P2 | OPEN | Techniques | Resolve loop-knot guidance conflict. | OneNote knots page says loop knot is weak/don't use; some technique notes still recommend loop knots for finesse/jerkbait action. |
| FISH-TODO-019 | P2 | OPEN | Techniques | Build Texas Rig page. | OneNote page is TODO only. |
| FISH-TODO-020 | P3 | OPEN | Techniques | Build Carolina Rig page. | OneNote page is TODO only. |
| FISH-TODO-021 | P3 | OPEN | Techniques | Build Alabama Rig page. | OneNote page is TODO only. |
| FISH-TODO-022 | P3 | OPEN | Techniques | Build Neko Rig page. | OneNote contains seed gear/bait references; needs full technique details. |
| FISH-TODO-023 | P3 | OPEN | Techniques | Build Spoons page. | OneNote page is TODO only, though spoon inventory/usage is captured elsewhere. |
| FISH-TODO-024 | P3 | OPEN | Locations | Research Lake Bosworth bass. | OneNote `Go` item only. |
| FISH-TODO-025 | P3 | OPEN | Shopping/local | Visit/check Holiday Sports in Burlington. | OneNote `Go` item. |
| FISH-TODO-026 | P3 | OPEN | Community | Research/join fish club. | OneNote buy/listen page note. |
| FISH-TODO-027 | P2 | OPEN | Clothing | Buy/consider NRS ATB Wetshoe size 11. | OneNote clothing buy item. |
| FISH-TODO-028 | P2 | OPEN | Clothing | Buy/consider NRS Champion Jacket and Bib. | Jacket must have neoprene cuffs, waterproof zipper, articulated hood; Champion Jacket and Bib listed as candidates. |
| FISH-TODO-029 | P2 | OPEN | Kayak safety/storage | Determine how to tie off bow-hatch items. | Tool bag/bilge pump tie-off question in OneNote. |
| FISH-TODO-030 | P3 | DEFERRED | Power/electronics | Evaluate whether trailer battery could work for kayak motor/electronics scenario. | OneNote motor/battery research item; resume only if the kayak-motor project returns. |
| FISH-TODO-031 | P3 | OPEN | Learning | Listen/watch Science of the Strike episodes 8 and 16. | Dissolved oxygen and turbidity noted. |
| FISH-TODO-032 | P3 | OPEN | Trip logs | Continue adding catch/no-bite reports. | OneNote catch log migrated; future trips should be appended. |
| FISH-TODO-033 | P3 | OPEN | Safety/regulations | Create regulation recheck checklist. | Include Fish Washington app, lake-specific rules, species ID, bait/retention implications. |
| FISH-TODO-034 | P3 | OPEN | Markdown usability | Spot-check inline links in GitHub Preview. | Links were embedded from MHT; spot-check during normal use and fix any link placement/context issues that affect OneNote-replacement usability. |
| FISH-TODO-035 | P1 | IN PROGRESS | Fishing Companion PWA | Build and acceptance-test the mobile/offline front end for the Fishing knowledge base. | MVP source is under `pwa/`: two workflows (`My Gear & Knots` and `Build a Fishing Plan`), runtime Markdown parsing, offline service worker, inventory/item pages, knot/connection guidance, deterministic plan ranking, catch-history matching, and CI build artifact. Next: complete browser/device acceptance testing and refine parser/ranking issues found in real use. |
| FISH-TODO-036 | P2 | OPEN | PWA / data model | Add lightweight stable IDs/metadata to Markdown only where the PWA parser needs stronger relationships. | Preserve Markdown as source of truth; do not create a separately maintained application database. Prioritize ambiguous links such as lure ↔ technique ↔ species ↔ structure ↔ knot ↔ catch. |
| FISH-TODO-037 | P1 | WAITING ON USER | PWA / hosting | Choose the PWA hosting/privacy model and install path. | Build-check workflow intentionally does not publish. Decide whether/how the private knowledge base can be deployed without exposing information unintentionally; then add deployment and install on phone/desktop. |

---

## Completed Items

| ID | Completed | Area | Resolution |
|---|---|---|---|
| FISH-TODO-001 | 2026-08-29 | Project migration | OneNote fishing/kayak notebook content migrated into the durable GitHub Markdown knowledge base. |
| FISH-TODO-002 | 2026-08-29 | Project migration | Migration audit/reconciliation closed by user scope decision: OneNote was the most up-to-date historical source of truth; exhaustive transcript-by-transcript historical-chat reconciliation was not required. Dedicated audit/reconciliation files were retired after closure. |
| FISH-TODO-003 | 2026-08-29 | Project architecture | Final GitHub-based new-chat bootstrap prompt completed for normal ongoing project use. |
| FISH-TODO-004 | 2026-08-29 | Project migration / links | OneNote Single File Web Page/MHT export used to restore external links inline for GitHub Preview; temporary link-index file deleted afterward. |
