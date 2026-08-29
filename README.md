# Fishing Knowledge Base

This repository is the durable Markdown knowledge base for fishing, kayak fishing, kayak rigging, tackle, electronics, local waters, and related equipment.

## Migration status

**Status: MIGRATION COMPLETE / ONENOTE PDF MIGRATED / ONENOTE LINKS EMBEDDED INLINE / AUDIT CLOSED**

The OneNote PDF export (`Fishing.pdf`, 73 pages, exported 2026-08-29 in ChatGPT) was migrated into the Markdown files. The migration preserved current owned equipment, researched/candidate items, technique notes, location notes, catch logs, TODOs, and known conflicts.

The later OneNote Single File Web Page export (`Fishing OneNote Export.mht`) was used to restore external hyperlink targets. Those links are embedded inline in the relevant Markdown pages so they are clickable in GitHub Preview. The temporary `Fishing_Reference_Links.md` index was removed after inline restoration.

On 2026-08-29, the user designated the OneNote notebook as the most up-to-date historical source of truth and closed the migration audit without requiring a line-by-line reconciliation of every earlier ChatGPT transcript. Historical Fishing chats remain useful supplemental evidence and decision history, but they are not a completeness gate for the knowledge base.

This repository is now the active working knowledge base and OneNote replacement. Future corrections, recovered historical details, or conflicts should be handled as ordinary updates rather than automatically reopening the migration audit.

## Start here

1. `Fishing_Context.md` — compact current-state summary and routing guide.
2. `Fishing_Gear_Registry.md` — owned/installed gear and current configurations.
3. `Fishing_Tackle_Inventory.md` — lure, bait, hook, sinker, and terminal-tackle inventory.
4. `Fishing_TODO.md` — canonical backlog.
5. `Fishing_Migration_Audit.md` — migration source inventory, scope decision, and completed audit record.
6. `Fishing_Source_Reconciliation_Exceptions.md` — material that was not imported or was imported with limitations/conflicts.
7. `Fishing_New_Chat_Bootstrap_Prompt.md` — final bootstrap prompt for starting a new Fishing chat.

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
