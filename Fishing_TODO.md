# Fishing TODO

_Last updated: 2026-09-02_

This file is the canonical backlog for unresolved Fishing-project verification items, research tasks, equipment questions, technique work, and owner follow-ups.

The project has two application-data domains: My Gear uses structured JSON/IndexedDB, while the Knowledge Base uses a unified structured entity index over complete Markdown documents plus a separate structured Catch Log. The legacy OneNote/PDF and migrated topic files may be consulted as historical/reference sources, but they are not parallel runtime sources of truth.

## Status convention

- **OPEN** — ready to work.
- **WAITING ON USER** — requires information, photos, documents, measurements, purchase confirmation, or a decision from the user.
- **IN PROGRESS** — actively being worked.
- **DEFERRED** — intentionally postponed.
- **DONE** — resolved; update the authoritative source for that data domain before moving the item to Completed Items.

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
| FISH-TODO-009 | P2 | WAITING ON USER | Kayak accessories | Confirm whether YakAttack 38 x 13 fish cooler bag was purchased. | If purchased, add exact SKU/status to gear registry/reference data. |
| FISH-TODO-010 | P2 | OPEN | Tackle | Buy/consider tubes and internal tube jigheads. | Useful for Lake Washington/Sammamish smallmouth. |
| FISH-TODO-011 | P2 | OPEN | Tackle | Buy/consider bullet weights for Texas rigs. | Needed for Rage Craw / soft plastics Texas-rig use. |
| FISH-TODO-012 | P2 | OPEN | Tackle | Buy/consider 1/8 oz weighted EWG hooks. | Useful for Berkley Power Jerk Shad and soft jerkbait depth control. |
| FISH-TODO-013 | P2 | OPEN | Tackle | Buy/consider Carolina Keepers. | OneNote listed as buy item; useful as alternative to bead/swivel in some slip-sinker rigs. |
| FISH-TODO-014 | P3 | OPEN | Tackle | Watch for KastKing 3600 deep box. | OneNote tackle-management note. |
| FISH-TODO-015 | P3 | OPEN | Tackle | Buy/consider Berkley Warpig. | OneNote buy item: 1/2 oz, 3\", Blue Shad. |
| FISH-TODO-016 | P3 | OPEN | Tackle | Buy/consider Bait Pop with red flake. | OneNote scent TODO; prefer water-soluble scent, shrimp-extract flavor noted. |
| FISH-TODO-017 | P2 | OPEN | Techniques | Resolve hook-size guidance for PowerBait still rigs. | OneNote rig uses #4 hook; prior guidance often used #8 for PowerBait/Power Eggs. Keep both until tested/decided. |
| FISH-TODO-018 | P2 | OPEN | Techniques / knots | Resolve loop-knot guidance conflict. | The unified Knot content preserves the conflict: OneNote says loop knot is weak/don't use; some Technique content still recommends loop knots for action. Resolve through content review/user decision. |
| FISH-TODO-019 | P2 | OPEN | Techniques | Build Texas Rig page. | OneNote page is TODO only. |
| FISH-TODO-020 | P3 | OPEN | Techniques | Build Carolina Rig page. | OneNote page is TODO only. |
| FISH-TODO-021 | P3 | OPEN | Techniques | Build Alabama Rig page. | OneNote page is TODO only. |
| FISH-TODO-022 | P3 | OPEN | Techniques | Build Neko Rig page. | OneNote contains seed gear/bait references; needs full technique details. |
| FISH-TODO-023 | P3 | OPEN | Techniques | Build Spoons page. | OneNote page is TODO only, though spoon inventory/usage is captured elsewhere. |
| FISH-TODO-024 | P3 | OPEN | Locations | Research Lake Bosworth bass. | OneNote `Go` item only. |
| FISH-TODO-025 | P3 | OPEN | Shopping/local | Visit/check Holiday Sports in Burlington. | OneNote `Go` item. |
| FISH-TODO-026 | P3 | OPEN | Community | Research/join fish club. | OneNote buy/listen page note. |
| FISH-TODO-027 | P2 | OPEN | Clothing | Buy/consider NRS ATB Wetshoe size 11. | OneNote clothing buy item, not owned unless user confirms. |
| FISH-TODO-028 | P2 | OPEN | Clothing | Buy/consider NRS Champion Jacket and Bib. | Jacket must have neoprene cuffs, waterproof zipper, articulated hood; Champion Jacket and Bib listed as candidates. |
| FISH-TODO-029 | P2 | OPEN | Kayak safety/storage | Determine how to tie off bow-hatch items. | Tool bag/bilge pump tie-off question in OneNote. |
| FISH-TODO-030 | P3 | DEFERRED | Power/electronics | Evaluate whether trailer battery could work for kayak motor/electronics scenario. | OneNote motor/battery research item; resume only if the kayak-motor project returns. |
| FISH-TODO-031 | P3 | OPEN | Learning | Listen/watch Science of the Strike episodes 8 and 16. | Dissolved oxygen and turbidity noted. |
| FISH-TODO-032 | P3 | OPEN | Catch Log | Continue adding structured catch records. | Track catches only, not trips or no-bite sessions. Use stable species/location/gear references and do not infer setup or technique. |
| FISH-TODO-033 | P3 | OPEN | Safety/regulations | Create regulation recheck checklist. | Include Fish Washington app, lake-specific rules, species ID, bait/retention implications. |
| FISH-TODO-034 | P3 | OPEN | Markdown usability | Spot-check inline links in GitHub Preview. | Applies to the remaining Knowledge Base Markdown while it remains active. |
| FISH-TODO-037 | P3 | DEFERRED | PWA / multi-user product | Generalize Fishing Companion for multiple users. | Current app remains intentionally single-user/personal even though its deployment URL may be publicly reachable. Revisit only after the personal version is mature. |
| FISH-TODO-039 | P2 | OPEN | PWA / catch history | Record rod/reel setup on new catches when known. | The structured field exists. Existing historical catches remain null because setup attribution was not recorded and must not be invented. |
| FISH-TODO-045 | P2 | DEFERRED | PWA / My Gear v2 editing | Add normal Add/Edit/Delete forms and expose JSON import/export when v2 work resumes. | IndexedDB/repository layers are writable, but current v1 UI intentionally exposes neither CRUD forms nor the temporary My Gear data import/export card. Future bulk-edit preference is Export JSON → edit externally → Import JSON; no raw JSON editor. |

---

## Completed Items

| ID | Completed | Area | Resolution |
|---|---|---|---|
| FISH-TODO-001 | 2026-08-29 | Project migration | OneNote fishing/kayak notebook content migrated into the durable GitHub Markdown knowledge base. |
| FISH-TODO-002 | 2026-08-29 | Project migration | Migration audit/reconciliation closed by user scope decision: OneNote was the most up-to-date historical source of truth; exhaustive transcript-by-transcript historical-chat reconciliation was not required. Dedicated audit/reconciliation files were retired after closure. |
| FISH-TODO-003 | 2026-08-29 | Project architecture | GitHub-based new-chat bootstrap prompt completed for normal ongoing project use. |
| FISH-TODO-004 | 2026-08-29 | Project migration / links | OneNote Single File Web Page/MHT export used to restore external links inline for GitHub Preview; temporary link-index file deleted afterward. |
| FISH-TODO-036 | 2026-09-01 | PWA / data model | Superseded the Markdown-parser metadata approach for My Gear. My Gear now has explicit stable IDs and structured JSON/IndexedDB records; the Knowledge Base will receive its own separate data-model design. |
| FISH-TODO-038 | 2026-08-31 | PWA / GitHub Pages | GitHub Pages enabled with Source = GitHub Actions; Fishing Companion is live at `https://ginosega.github.io/fishing/`. |
| FISH-TODO-040 | 2026-09-01 | Gear registry | Exact shore/spincast setup identified as the Pflueger President Spincast Combo; rod and reel specs and part `PRESSC-606L2CBO` recorded. |
| FISH-TODO-041 | 2026-09-01 | PWA / catch history UI | Rods & Reels empty catch-history state standardized to `No catches have been recorded with this rod & reel.` |
| FISH-TODO-042 | 2026-09-01 | PWA / Line content | Braided-line resources are presented as normal user-facing Video/Article resources rather than OneNote-framed prose. |
| FISH-TODO-043 | 2026-09-01 | PWA / Knot content | Trilene reverse link to Snaps & Swivels removed and video link normalized to `How to tie the Trilene knot`. |
| FISH-TODO-044 | 2026-09-01 | Tackle / PWA data | Cylinder weights corrected to manufacturer THKFISH, model `28 pcs sinkers set`. |
| FISH-TODO-048 | 2026-09-01 | PWA / My Gear routing | Sev 1 post-refactor routing/layout regression fixed in PR #10. Structured My Gear now owns all `#/inventory` routes; accepted header layout and Home subtext restored; temporary My Gear data import/export card removed; routing/layout regression tests added. Production commit `8af0c654168cdefad37f79368719ac66a69c98b1`, run #70 / `33590304599`, build and Pages deploy successful. |
| FISH-TODO-035 | 2026-09-02 | Fishing Companion PWA | User accepted the complete post-PR #10 My Gear flow as working correctly. |
| FISH-TODO-046 | 2026-09-02 | PWA / Knowledge Base architecture | Adopted and implemented one unified KB Entity schema for Location, Species, Technique, and Knot: ID, Type, Name, optional Description, optional Picture, and one complete Markdown Content document. Planner/session/trip-history concepts were retired. |
| FISH-TODO-047 | 2026-09-02 | PWA / Catch Log | Migrated five historical catches to structured records with stable species, location, and lure IDs; optional setup/technique fields remain null where not historically recorded. Catch backlinks now use exact IDs rather than text matching. |
