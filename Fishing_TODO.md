# Fishing TODO

_Last updated: 2026-09-04_

This file is the canonical backlog for unresolved Fishing-project verification items, research tasks, equipment questions, technique work, and owner follow-ups.

The application has three durable data domains: My Gear uses structured JSON/IndexedDB, the Knowledge Base uses a unified structured entity index over complete Markdown documents, and Catch Log is separate structured historical data. Legacy OneNote/PDF and migrated topic files remain historical/reference sources, not parallel runtime sources of truth.

## Status convention

- **OPEN** — ready to work.
- **WAITING ON USER** — requires information, photos, documents, measurements, purchase confirmation, acceptance, or a decision from the user.
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
| FISH-TODO-008 | P2 | WAITING ON USER | Kayak accessories | Confirm whether Bonafide RVR119 Under Seat Tackle Storage was purchased. | Historical material still lists as buy/research item, not owned. |
| FISH-TODO-009 | P2 | WAITING ON USER | Kayak accessories | Confirm whether YakAttack 38 x 13 fish cooler bag was purchased. | If purchased, add exact SKU/status to the proper current source. |
| FISH-TODO-010 | P2 | OPEN | Tackle | Buy/consider tubes and internal tube jigheads. | Useful for Lake Washington/Sammamish smallmouth. |
| FISH-TODO-011 | P2 | OPEN | Tackle | Buy/consider bullet weights for Texas rigs. | Needed for Rage Craw / soft-plastics Texas-rig use. |
| FISH-TODO-012 | P2 | OPEN | Tackle | Buy/consider 1/8 oz weighted EWG hooks. | Useful for Berkley Power Jerk Shad and soft-jerkbait depth control. |
| FISH-TODO-013 | P2 | OPEN | Tackle | Buy/consider Carolina Keepers. | OneNote listed as buy item; useful as alternative to bead/swivel in some slip-sinker rigs. |
| FISH-TODO-014 | P3 | OPEN | Tackle | Watch for KastKing 3600 deep box. | OneNote tackle-management note. |
| FISH-TODO-015 | P3 | OPEN | Tackle | Buy/consider Berkley Warpig. | OneNote buy item: 1/2 oz, 3", Blue Shad. |
| FISH-TODO-016 | P3 | OPEN | Tackle | Buy/consider Bait Pop with red flake. | OneNote scent TODO; prefer water-soluble scent, shrimp-extract flavor noted. |
| FISH-TODO-017 | P2 | OPEN | Techniques | Resolve hook-size guidance for PowerBait still rigs. | OneNote rig uses #4 hook; prior guidance often used #8 for PowerBait/Power Eggs. Keep both until tested/decided. |
| FISH-TODO-018 | P2 | OPEN | Techniques / knots | Resolve loop-knot guidance conflict. | Knot content preserves OneNote's warning while some equipment/technique content recommends loop knots for action. Resolve deliberately rather than incidentally. |
| FISH-TODO-019 | P2 | OPEN | KB / Equipment | Build Texas Rig page. | OneNote page is TODO only. |
| FISH-TODO-020 | P3 | OPEN | KB / Equipment | Build Carolina Rig page. | OneNote page is TODO only. |
| FISH-TODO-021 | P3 | OPEN | KB / Equipment | Build Alabama Rig page. | OneNote page is TODO only. |
| FISH-TODO-022 | P3 | OPEN | KB / Equipment | Build Neko Rig page. | OneNote contains seed gear/bait references; needs full article. |
| FISH-TODO-023 | P3 | OPEN | KB / Equipment | Build Spoons page. | OneNote page is TODO only, though spoon inventory/usage is captured elsewhere. |
| FISH-TODO-024 | P3 | OPEN | Locations | Research Lake Bosworth bass. | OneNote `Go` item only. |
| FISH-TODO-025 | P3 | OPEN | Shopping/local | Visit/check Holiday Sports in Burlington. | OneNote `Go` item. |
| FISH-TODO-026 | P3 | OPEN | Community | Research/join fish club. | OneNote buy/listen page note. |
| FISH-TODO-027 | P2 | OPEN | Clothing | Buy/consider NRS ATB Wetshoe size 11. | OneNote clothing buy item, not owned unless user confirms. |
| FISH-TODO-028 | P2 | OPEN | Clothing | Buy/consider NRS Champion Jacket and Bib. | Jacket must have neoprene cuffs, waterproof zipper, articulated hood; Champion Jacket and Bib listed as candidates. |
| FISH-TODO-029 | P2 | OPEN | Kayak safety/storage | Determine how to tie off bow-hatch items. | Tool bag/bilge-pump tie-off question in OneNote. |
| FISH-TODO-030 | P3 | DEFERRED | Power/electronics | Evaluate whether trailer battery could work for kayak motor/electronics scenario. | Resume only if the kayak-motor project returns. |
| FISH-TODO-031 | P3 | OPEN | Learning | Listen/watch Science of the Strike episodes 8 and 16. | Dissolved oxygen and turbidity noted. |
| FISH-TODO-032 | P3 | OPEN | Catch Log | Continue adding structured catch records. | Track catches only, not trips or no-bite sessions. Use stable species/location/gear references and do not infer setup or technique. |
| FISH-TODO-033 | P3 | OPEN | Safety/regulations | Create regulation recheck checklist. | Include Fish Washington app, lake-specific rules, species ID, bait/retention implications. |
| FISH-TODO-034 | P3 | OPEN | Markdown usability | Spot-check inline links in GitHub Preview and PWA. | Applies especially to newly expanded authored documents under `pwa/kb-content/`. |
| FISH-TODO-037 | P3 | DEFERRED | PWA / multi-user product | Generalize Fishing Companion for multiple users. | Current app remains intentionally single-user/personal. Revisit only after the personal version is mature. |
| FISH-TODO-039 | P2 | OPEN | PWA / Catch Log | Record rod/reel setup on new catches when known. | Existing historical catches remain null where setup attribution was not recorded and must not be invented. |
| FISH-TODO-045 | P2 | DEFERRED | PWA / My Gear v2 editing | Add normal Add/Edit/Delete forms and expose validated JSON import/export when v2 work resumes. | Current UI remains browse-only. Future bulk-edit preference is Export JSON → edit externally → Import JSON; no raw JSON editor. |

---

## Completed Items

| ID | Completed | Area | Resolution |
|---|---|---|---|
| FISH-TODO-001 | 2026-08-29 | Project migration | OneNote fishing/kayak notebook content migrated into the durable GitHub Markdown knowledge base. |
| FISH-TODO-002 | 2026-08-29 | Project migration | Migration audit/reconciliation closed by user scope decision: OneNote was the most up-to-date historical source of truth; exhaustive transcript-by-transcript historical-chat reconciliation was not required. Dedicated audit/reconciliation files were retired after closure. |
| FISH-TODO-003 | 2026-08-29 | Project architecture | GitHub-based new-chat bootstrap prompt completed for normal ongoing project use. |
| FISH-TODO-004 | 2026-08-29 | Project migration / links | OneNote MHT export used to restore external links inline for GitHub Preview; temporary link-index file deleted afterward. |
| FISH-TODO-036 | 2026-09-01 | PWA / data model | Superseded Markdown-parser metadata approach for My Gear with explicit stable IDs and structured JSON/IndexedDB records. |
| FISH-TODO-038 | 2026-08-31 | PWA / GitHub Pages | GitHub Pages enabled with Source = GitHub Actions; Fishing Companion is live at `https://ginosega.github.io/fishing/`. |
| FISH-TODO-040 | 2026-09-01 | Gear registry | Exact shore/spincast setup identified as Pflueger President Spincast Combo, part `PRESSC-606L2CBO`. |
| FISH-TODO-041 | 2026-09-01 | PWA / catch history UI | Rods & Reels empty catch-history state standardized. |
| FISH-TODO-042 | 2026-09-01 | PWA / Line content | Braided-line resources presented as normal user-facing resources rather than OneNote-framed prose. |
| FISH-TODO-043 | 2026-09-01 | PWA / Knot content | Trilene reverse link to Snaps & Swivels removed and video link normalized. |
| FISH-TODO-044 | 2026-09-01 | Tackle / PWA data | Cylinder weights corrected to manufacturer THKFISH, model `28 pcs sinkers set`. |
| FISH-TODO-048 | 2026-09-01 | PWA / My Gear routing | Sev 1 post-refactor routing/layout regression fixed in PR #10; structured My Gear owns all `#/inventory` routes and regression tests guard the boundary. |
| FISH-TODO-035 | 2026-09-02 | Fishing Companion PWA | User accepted the complete post-PR #10 My Gear browse flow as working correctly. |
| FISH-TODO-046 | 2026-09-02 | PWA / Knowledge Base architecture | Adopted and implemented unified indexed-Markdown KB entity architecture with stable IDs; later extended with flat Equipment peer type while preserving the same envelope. |
| FISH-TODO-047 | 2026-09-02 | PWA / Catch Log | Migrated five historical catches to structured records with exact stable relationships where known and nulls where not recorded. |
| FISH-TODO-049 | 2026-09-02 | Project handoff / operating mode | Reconciled state after unified KB release and added durable Chat-mode-by-default instruction. |
| FISH-TODO-050 | 2026-09-03 | PWA / media reliability | Recovered from repeated image-transfer failures. PR #26 established repository-local image validation/materialization; user-supplied binaries are now uploaded directly to GitHub rather than transported through ChatGPT tool calls. Merge `9af96810cb02c81da2a0e3f5463071e020ae6cfc`; production run #113 / `33833494282` succeeded. |
| FISH-TODO-051 | 2026-09-04 | Fishing Companion final content batch | PR #27 completed Recovery B Gear/browse updates, then PR #28 added/refreshed final Equipment/Technique articles, direct local rig/species images, authored cross-links, lure-type renames, Search/filter alignment fix, and South Bend spec cleanup. PR #28 exact-head CI #120 / `33840154633` passed; merge `093139e5314af55691e608277b68b79b2d369166`; production #121 / `33840208952` completed build and GitHub Pages deployment successfully. |
| FISH-TODO-052 | 2026-09-04 | Fishing Companion acceptance / Markdown | User completed the PR #28 Equipment/Technique formatting cleanup. Final review covered all 15 modified article files, fixed residual Chatterbait/Jerkbait list nesting, Inline Trolling Rig hard wraps, and Spring Fishing export artifacts, updated the final-content regression to validate stable-ID links rather than a `## Related` heading, and validated the replacement Largemouth/Smallmouth Bass images. PR #32 head `973b8cb0294cfbab789b2f9dde69830199c5b83a` passed CI #151 / `33848718142`; merge `356174e1376d591e9b33bef06e52e9fdb5c3d31c`; production #152 / `33848766888` passed build, local-media validation, bundle verification, artifact upload, and Pages deployment. |
| FISH-TODO-053 | 2026-09-04 | PWA / production recovery | Diagnosed and fixed the Fishing Companion startup outage caused by Gear-backed KB picture paths being rejected at runtime. PR #30 exact head `ffa4c500f2bf23be8d883736aed235a1e1011677` passed PR CI #124 / `33843072806`; merge `f64217485df024ebebf15af5adfb9bbd7018be5d`; production #125 / `33843111957` passed build, transformed-data validation, Pages artifact upload, and deployment. User verified the site healthy afterward. |
| FISH-TODO-054 | 2026-09-04 | Project recovery / handoff | Reconstructed the interrupted-chat build sequence from repository history and recovered prior context. No distinct post-PR #29 feature branch/commit/PR or recoverable unmerged application change was found. The recovered sequence is now closed through PR #32 final-content acceptance. |
