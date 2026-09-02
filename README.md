# Fishing Project

This repository is the durable working home for the Fishing project: fishing and kayak knowledge, owned gear/tackle data, local-water notes, catch observations, and the **Fishing Companion** PWA.

## Migration status

**Status: ONENOTE MIGRATION COMPLETE / LINKS RESTORED / NORMAL PROJECT MAINTENANCE**

The OneNote PDF export (`Fishing.pdf`, 73 pages, exported 2026-08-29 in ChatGPT) was migrated into the Markdown files. The later OneNote Single File Web Page export (`Fishing OneNote Export.mht`) was used to restore external hyperlink targets, which are embedded inline in the relevant Markdown pages for GitHub Preview.

On 2026-08-29, the migration audit and reconciliation work were closed. OneNote was designated as the most up-to-date historical source of truth, so exhaustive line-by-line reconciliation of every earlier ChatGPT transcript was not required. Historical Fishing chats remain useful supplemental evidence and decision history. The temporary migration audit, reconciliation-exceptions, and link-index files were removed after closure.

Future corrections or recovered historical details are ordinary project maintenance rather than a reopened migration project.

## Current data architecture

The project now has **two deliberately different data domains**.

### My Gear

My Gear no longer derives its application records from Markdown tables.

- Bundled baseline / portable representation: `pwa/data/gear.seed.json`
- Schema and validation: `pwa/gear-model.js`
- Live local/offline store: browser **IndexedDB** through `pwa/gear-store.js`
- My Gear UI: `pwa/gear-app.js`
- Current seed: schema version `1`, data version `2026-09-01-my-gear-v1`
- Current seed contains structured records for Rods & Reels, Line, Weights, Snaps & Swivels, Hooks, Lures, and Bait.

Manufacturer, model, specifications, manufacturer links, retailer links, usage guidance, and connection guidance are explicit fields rather than facts inferred from prose.

**Knots are not My Gear records.** They are unified Knowledge Base entities and remain intentionally absent from My Gear.

The old Markdown inventories (`Fishing_Gear_Registry.md` and `Fishing_Tackle_Inventory.md`) remain useful migrated/reference material, but they are **not application data sources**.

### Knowledge Base and Catch Log

The Knowledge Base uses a small structured index over complete Markdown documents:

- Bundled entity index: `pwa/data/kb.seed.json`
- Entity schema/validation: `pwa/kb-model.js`
- Complete authored documents: `pwa/kb-content/`
- UI and route owner: `pwa/kb-app.js`
- Safe presentation renderer: `pwa/markdown-render.js`

Every Location, Species, Technique, and Knot uses the same six fields: stable ID, Type, Name, optional Description, optional Picture, and one complete Markdown Content document. Type is only the top-level discriminator; Technique has no grouping subtype. Use, Rigging, Notes, Resources, tables, links, and embedded pictures remain normal Markdown content rather than atomic data fields.

Catch Log is separate structured data in `pwa/data/catches.seed.json`. Catch records use stable species, location, optional technique, optional rod/reel setup, and lure-or-bait IDs. Historical setup and technique values remain null unless actually recorded. Catch backlinks on KB and My Gear pages are computed from these records.

The unsuccessful Planner and session/trip-history concepts were retired. The Knowledge Base is a browsable information repository and does not assemble plans from parsed prose.

## Fishing Companion PWA

Fishing Companion is deployed at:

`https://ginosega.github.io/fishing/`

Current product scope is **single-user and personal**. A publicly reachable but non-advertised URL is acceptable; access control remains a P3 requirement unless explicitly elevated.

The two top-level workflows are:

1. **My Gear** — browse owned rod/reel setups, line, weights, snaps/swivels, hooks, lures, and bait.
2. **Knowledge Base** — browse Locations, Species, Techniques, Knots, and the structured Catch Log.

### Current production state

The structured local-first My Gear refactor was merged in PR #9. A subsequent Sev 1 routing/layout regression was fixed in PR #10.

Current verified production commit:

`8af0c654168cdefad37f79368719ac66a69c98b1`

Production workflow:

- GitHub Actions run **#70 / 33590304599**
- structured My Gear model tests: success
- My Gear routing/layout regression tests: success
- PWA build and bundle verification: success
- GitHub Pages deployment: success

PR #10 also restored the accepted UI behavior:

- Home My Gear subtext: `Browse your inventory of equipment, tackle, and bait`
- My Gear page title/subtitle aligned left with Back button on the right
- all `#/inventory/...` routes are owned by the structured My Gear app so category cards can open leaf pages reliably
- `pwa/kb-app.js` owns Home and all `#/kb/...` routes; the retired legacy parser/planner is not bundled
- the temporary **My Gear data** import/export card was removed from the current UI

### Deferred v2 editing features

The underlying IndexedDB/repository architecture is writable, but **v2 editing UI is intentionally deferred**.

Do not add current-version Add/Edit/Delete forms or expose JSON import/export controls unless the user explicitly resumes that v2 work. The preferred future manual bulk-edit pattern remains export → edit JSON externally → import, rather than an in-app raw JSON editor.

## Start here

For a new chat or project handoff, read:

1. `Fishing_New_Chat_Bootstrap_Prompt.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`

For My Gear data/content work, inspect `pwa/data/gear.seed.json` and the structured model/repository files. Read the legacy gear/tackle Markdown only for historical/migrated context.

For Knowledge Base work, inspect `pwa/data/kb.seed.json`, `pwa/data/catches.seed.json`, and the relevant complete documents under `pwa/kb-content/`. The `Topics/` files remain migrated/reference sources, not runtime inputs.

## Evidence / status labels

Use these labels consistently in Markdown knowledge/reference material:

- **OWNED / INSTALLED** — equipment actually owned or installed.
- **USER VERIFIED** — physically measured, inspected, or explicitly confirmed by the user.
- **USER OBSERVED** — behavior personally observed by the user.
- **MANUFACTURER DOCUMENTED** — supported by manufacturer documentation.
- **ONENOTE SOURCE** — imported from the OneNote PDF export.
- **ONENOTE LINK RESTORED** — external URL restored from the Single File Web Page export and embedded inline where practical.
- **HISTORICAL CHAT SEED** — imported from prior Fishing chat context as supplemental historical evidence.
- **RESEARCHED / CANDIDATE** — considered but not purchased or installed.
- **REJECTED / SUPERSEDED** — no longer current, but preserved for decision history.
- **PROBABLE** — strong inference but not verified.
- **UNKNOWN / UNRESOLVED** — not established.

## Time-sensitive information

Fishing regulations, stocking, product availability, launch/access rules, weather, and current fishing conditions are time-sensitive. Reverify with current authoritative sources when planning a trip or purchase.

## Development / deployment rule

For meaningful PWA changes, use a normal feature/fix branch and pull request. Let PR CI perform build-only validation, then merge and verify **both** the production build job and GitHub Pages deploy job before calling the change live. Avoid disposable workflows and direct-to-main editing that creates unnecessary Actions notification noise.

Before implementing a requirement with substantial architecture, deployment, maintenance, performance, or usability impact, surface the tradeoff and confirm its priority. Privacy/access control is P3 unless explicitly elevated.

## Topic files

- `Topics/Bonafide_RVR119_Kayak.md`
- `Topics/Kayak_Rigging_Accessories_Storage.md`
- `Topics/Fish_Finder_Electronics_Wiring.md`
- `Topics/Rods_Reels_Line_Knots.md`
- `Topics/Fishing_Techniques.md`
- `Topics/Local_Waters_Locations.md`
- `Topics/Trip_Logs_Field_Observations.md`
- `Topics/Safety_Regulations_Fish_Handling.md`
- `Topics/Maintenance_Repairs_Procedures.md`
- `Topics/Researched_Candidate_Gear.md`
