# Fishing Source Reconciliation Exceptions Report

**Scope:** OneNote PDF export (`Fishing.pdf`, 73 pages) plus hyperlink recovery from OneNote Single File Web Page export (`Fishing OneNote Export.mht`) performed 2026-08-29.

**Status:** OneNote PDF migration pass complete with exceptions; OneNote hyperlink targets restored and embedded inline in the relevant Markdown pages; migration audit closed 2026-08-29.

This report lists material that did not import, imported only partially, or imported with unresolved conflicts/limitations.

## Audit-scope note

On 2026-08-29, the user designated OneNote as the most up-to-date historical source of truth. Exhaustive line-by-line reconciliation of all earlier ChatGPT transcripts is therefore not required for migration completion. Historical chats remain supplemental evidence and may still surface useful details later, but that possibility is treated as normal future maintenance rather than an open migration exception.

## Format limitations

| Exception | Disposition | Reason / next action |
|---|---|---|
| Actual hyperlink targets behind labels such as `mfr`, `Amazon`, `video`, `link`, and some resource titles | RESTORED INLINE WHERE PRACTICAL | The PDF preserved visible link labels but not reliable destination URLs. The Single File Web Page export preserved the targets, and those links were embedded inline in the relevant Markdown pages so they are clickable in GitHub Preview. The temporary `Fishing_Reference_Links.md` index was deleted after inline restoration. |
| Embedded link context for videos/playlists/resources | MOSTLY RESTORED INLINE | The MHT export preserved URL targets. Generic labels remain generic where OneNote used generic labels, but the surrounding Markdown text was updated where practical so links are understandable in context. |
| Possible embedded attachments from OneNote | UNKNOWN | The PDF/MHT did not show separate embedded attachment files. If OneNote contains attachments beyond rendered page content and they later matter, import them as ordinary project maintenance. |
| Tables/diagrams rendered as images | IMPORTED WHERE TEXT WAS PARSED OR VISUALLY CLEAR | Rendered page images were available. Text was generally sufficient. The trout flasher rig diagram on page 4 and several tables were reflected in rigging/technique files. |

## Intentionally excluded as empty/header-only

| Page(s) | Content | Reason |
|---|---|---|
| 13 | `Gear` section title page | No substantive content beyond section title. |
| 25 | `Lures` resources page | Resource links were embedded into technique pages where relevant; no substantive technique/inventory notes beyond resource titles. |
| 29 | `Finesse Lures` title page | No substantive content beyond section title. |
| 37 | `Power Lures` title page | No substantive content beyond section title. |
| 59 | Blank page | No content to import. |
| 61 | `Locations` title page | No substantive content beyond section title. |
| 73 | Fish species resource links | Resource links were embedded into technique/species-reference context; no substantive source notes beyond links/titles. |

## Imported as TODO only because source had no detailed content

| Page(s) | Source item | Destination | Reason |
|---|---|---|---|
| 33 | `TODO: Texas Rig` | `Fishing_TODO.md` | No technique details provided. |
| 34 | `TODO: Alabama Rig` | `Fishing_TODO.md` | No technique details provided. |
| 36 | `TODO: Carolina Rig` | `Fishing_TODO.md` | No technique details provided. |
| 41 | `TODO: Spoons` | `Fishing_TODO.md` | Dedicated spoon technique page had no details, though spoon inventory/use notes were imported from other pages. |
| 69 | `Lake Bosworth - bass` | `Fishing_TODO.md`; `Topics/Local_Waters_Locations.md` | No actionable lake details beyond a go/research note. |

## Imported as candidate/researched, not owned

These items were deliberately **not** added as owned gear because the source framed them as buy/research/maybe items or purchase status is unknown.

| Item | Disposition | Reason |
|---|---|---|
| Bonafide RVR119 Under Seat Tackle Storage | PURCHASE UNKNOWN / TODO | OneNote lists it as buy/accessory item; chat product searches found leads, but user has not confirmed purchase. Source link embedded where item appears. |
| YakAttack 38" x 13" Insulated Fish Cooler Bag | PURCHASE UNKNOWN / TODO | Product was searched in chat, not confirmed purchased. |
| YakAttack Drop Shot Anchor Reel and 6 lb anchor | CANDIDATE | OneNote says maybe; user previously stated no anchor. Source links embedded where item appears. |
| YakAttack BlackPak Pro | CANDIDATE | OneNote says maybe; not owned. Source links embedded where item appears. |
| Garmin Force Current motor and stern motor mount | RESEARCHED / NOT OWNED | OneNote research only; current kayak remains paddle-only. Source links embedded where item appears. |
| Garmin EchoMap Ultra 2 / LiveScope / GT56UHD equipment | RESEARCHED / NOT OWNED | Electronics research only; current fish finder remains Humminbird Helix 5. Source links embedded where item appears. |
| NRS ATB Wetshoe, NRS Champion Jacket, NRS Champion Bib | BUY / CANDIDATE | Clothing buy list, not confirmed owned. Source links embedded where item appears. |
| Berkley Warpig 1/2 oz Blue Shad | BUY / CANDIDATE | OneNote buy item, not listed as owned. |
| Carolina Keepers | BUY / CANDIDATE | OneNote buy item, not listed as owned. |
| Bait Pop with red flake | BUY / CANDIDATE | OneNote TODO, not owned. |
| Ryugi Talisman Brutal Wacky/Neko hook and Berkley Maxscent Flux Gill | CANDIDATE | Listed in TODO Neko Rig page, not owned. Source links embedded where item appears. |

## Imported with unresolved conflicts

| Conflict | How it was handled | Next action |
|---|---|---|
| PowerBait hook size: OneNote still/bobber rigs use #4 hooks, while prior chat guidance often recommended #8 for PowerBait/Power Eggs | Both preserved; TODO created to resolve through testing/user preference | Decide preferred default after actual use. Likely #8 remains good for small PowerBait/eggs; #4 may be better for larger nuggets/worms. |
| Loop knot guidance: OneNote knot page says loop knot is weak/don't use; Ned/jerkbait/crankbait notes mention loop knots for lure action | Both preserved; loop knot flagged as unresolved | Review knot preferences and decide whether to keep loop knot as special-case option or remove from default guidance. |
| Battery naming: prior historical seed called it Eco Fishing 8Ah; OneNote lists Amped Outdoors 12V 8Ah with Eco Fishing source/price | Normalized to Amped Outdoors 12V 8Ah battery, purchased/sourced via Eco Fishing | User can confirm battery label if needed. |
| Mepps Aglia size: prior chat said 1/4 oz red; OneNote says Meps Aglia #3 red | Normalized as Mepps Aglia #3 / 1/4 oz class red | No action unless package label differs. |
| Color-vision/color-selection claim on OneNote research page | Imported as an owner note but marked needs verification | Verify before using as scientific basis for lure color decisions. |

## Imported but marked time-sensitive / requiring recheck

| Material | Reason |
|---|---|
| Regulations and access rules | Must be rechecked against Fish Washington, WDFW emergency rules, and park signage before trips. |
| Product prices and availability | OneNote prices and prior product searches age quickly. |
| Stocking/species assumptions | Species lists and stocking info should be checked from current authoritative sources when needed. |
| Warranty text | OneNote warranty note imported, but current manufacturer terms should be checked before any claim. |

## Historical-chat coverage

Historical chats were used as supplemental seeds and decision history during the migration. They were **not exhaustively reconciled transcript-by-transcript**, and under the 2026-08-29 source-of-truth decision they do not need to be. If a useful older detail is recovered later, incorporate it into the canonical Markdown files and preserve conflicts or superseded decisions where appropriate.
