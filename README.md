# Fishing Knowledge Base

This repository is the durable Markdown knowledge base for fishing, kayak fishing, kayak rigging, tackle, electronics, local waters, and related equipment.

## Migration status

**Status: MIGRATION COMPLETE / ONENOTE MIGRATED / LINKS EMBEDDED INLINE**

The OneNote PDF export (`Fishing.pdf`, 73 pages, exported 2026-08-29 in ChatGPT) was migrated into the Markdown files. The later OneNote Single File Web Page export (`Fishing OneNote Export.mht`) was used to restore external hyperlink targets, which are embedded inline in the relevant Markdown pages for GitHub Preview.

On 2026-08-29, the migration audit and reconciliation work were closed. OneNote was designated as the most up-to-date historical source of truth, so exhaustive line-by-line reconciliation of every earlier ChatGPT transcript was not required. Historical Fishing chats remain useful supplemental evidence and decision history. The temporary migration audit, reconciliation-exceptions, and link-index files were removed after closure to keep the repository focused on active durable content.

This repository is now the active working knowledge base and OneNote replacement. Future corrections, recovered historical details, or conflicts should be handled as ordinary project updates.

## Fishing Companion PWA

A mobile/offline front end is under active development in `pwa/`. Its purpose is to make the Markdown knowledge base fast and actionable in the field without creating a second source of truth.

The two primary workflows are:

1. **My Gear & Knots** — browse owned rods, reels, line, weights, snaps/swivels, hooks, lures, bait, and saved knots. Item views combine inventory data with relevant instructions, links, knot/connection guidance, and catch history.
2. **Build a Fishing Plan** — start with any combination of location, date/time, target species, current setup, or lure/bait and assemble relevant structure targets, owned gear, techniques, knots/connections, and similar historical catches.

The PWA build copies selected canonical Markdown files into its deploy bundle and parses them at runtime. Those copies are generated artifacts only; **the Markdown files in this repository remain authoritative**. Core content is cached for offline use after first load.

Fishing Companion is deployed automatically through GitHub Actions to GitHub Pages at:

`https://ginosega.github.io/fishing/`

The app remains a single-user/personal product even though the deployment URL is publicly reachable. Access control is not a current requirement.

See `pwa/README.md` and the PWA items in `Fishing_TODO.md` for current implementation status.

## Start here

1. `Fishing_Context.md` — compact current-state summary and routing guide.
2. `Fishing_Gear_Registry.md` — owned/installed gear and current configurations.
3. `Fishing_Tackle_Inventory.md` — lure, bait, hook, sinker, and terminal-tackle inventory.
4. `Fishing_TODO.md` — canonical backlog.
5. `Fishing_Decision_Log.md` — major decisions, corrections, and rationale.
6. `Fishing_New_Chat_Bootstrap_Prompt.md` — final bootstrap prompt for starting a new Fishing chat.

Detailed topic files live in `Topics/`.

## Evidence / status labels

Use these labels consistently:

- **OWNED / INSTALLED** — equipment actually owned or installed.
- **USER VERIFIED** — physically measured, inspected, or explicitly confirmed by the user.
- **USER OBSERVED** — behavior personally observed by the user.
- **MANUFACTURER DOCUMENTED** — supported by manufacturer documentation.
- **ONENOTE SOURCE** — imported from the OneNote PDF export.
- **ONENOTE LINK RESTORED** — external URL restored from the Single File Web Page export and embedded inline where practical.
- **HISTORICAL CHAT SEED** — imported from prior Fishing chat context as supplemental historical evidence; not necessarily reconciled line-by-line against the original transcript.
- **RESEARCHED / CANDIDATE** — considered but not purchased or installed.
- **REJECTED / SUPERSEDED** — no longer current, but preserved for decision history.
- **PROBABLE** — strong inference but not verified.
- **UNKNOWN / UNRESOLVED** — not established.

## Time-sensitive information

Fishing regulations, stocking, product availability, launch/access rules, weather, and current fishing conditions are time-sensitive. Reverify with current authoritative sources when planning a trip or purchase.

## Canonical ownership rule

Store each detailed fact in one canonical file and cross-reference it elsewhere. Avoid duplicating exact procedures, part numbers, or setup details across multiple files.

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
