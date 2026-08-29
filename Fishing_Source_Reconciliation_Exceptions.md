# Fishing Source Reconciliation Exceptions Report

**Scope:** OneNote PDF export (`Fishing.pdf`, 73 pages) plus hyperlink recovery from OneNote Single File Web Page export (`Fishing OneNote Export.mht`) performed 2026-08-29.

**Status:** OneNote PDF migration pass complete with exceptions; OneNote hyperlink targets restored into `Fishing_Reference_Links.md`. Overall historical-chat migration is not complete.

This report lists material that did not import, imported only partially, or imported with unresolved conflicts/limitations.

## Format limitations

| Exception | Disposition | Reason / next action |
|---|---|---|
| Actual hyperlink targets behind labels such as `mfr`, `Amazon`, `video`, `link`, and some resource titles | RESTORED TO LINK INDEX | The PDF preserved visible link labels but not reliable destination URLs. The Single File Web Page export preserved the targets, which were restored in `Fishing_Reference_Links.md`, grouped by original OneNote page and surrounding context. |
| Embedded link context for videos/playlists/resources | MOSTLY RESTORED | The MHT export preserved URL targets. Generic labels remain generic when OneNote used generic labels, but surrounding context was preserved in the link index. |
| Possible embedded attachments from OneNote | UNKNOWN | The PDF/MHT did not show separate embedded attachment files. If OneNote contains attachments beyond rendered page content, provide another export or the attachments separately. |
| Tables/diagrams rendered as images | IMPORTED WHERE TEXT WAS PARSED OR VISUALLY CLEAR | Rendered page images were available. Text was generally sufficient. The trout flasher rig diagram on page 4 and several tables were reflected in rigging/technique files. |

## Intentionally excluded as empty/header-only

| Page(s) | Content | Reason |
|---|---|---|
| 13 | `Gear` section title page | No substantive content beyond section title. |
| 25 | `Lures` resources page | Resource links restored in `Fishing_Reference_Links.md`; no substantive technique/inventory notes beyond resource titles. |
| 29 | `Finesse Lures` title page | No substantive content beyond section title. |
| 37 | `Power Lures` title page | No substantive content beyond section title. |
| 59 | Blank page | No content to import. |
| 61 | `Locations` title page | No substantive content beyond section title. |
| 73 | Fish species resource links | Resource links restored in `Fishing_Reference_Links.md`; no substantive source notes beyond links/titles. |

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
| Bonafide RVR119 Under Seat Tackle Storage | PURCHASE UNKNOWN / TODO | OneNote lists it as buy/accessory item; chat product searches found leads, but user has not confirmed purchase. Link restored in `Fishing_Reference_Links.md`. |
| YakAttack 38" x 13" Insulated Fish Cooler Bag | PURCHASE UNKNOWN / TODO | Product was searched in chat, not confirmed purchased. |
| YakAttack Drop Shot Anchor Reel and 6 lb anchor | CANDIDATE | OneNote says maybe; user previously stated no anchor. Links restored in `Fishing_Reference_Links.md`. |
| YakAttack BlackPak Pro | CANDIDATE | OneNote says maybe; not owned. Links restored in `Fishing_Reference_Links.md`. |
| Garmin Force Current motor and stern motor mount | RESEARCHED / NOT OWNED | OneNote research only; current kayak remains paddle-only. Links restored in `Fishing_Reference_Links.md`. |
| Garmin EchoMap Ultra 2 / LiveScope / GT56UHD equipment | RESEARCHED / NOT OWNED | Electronics research only; current fish finder remains Humminbird Helix 5. Links restored in `Fishing_Reference_Links.md`. |
| NRS ATB Wetshoe, NRS Champion Jacket, NRS Champion Bib | BUY / CANDIDATE | Clothing buy list, not confirmed owned. Links restored in `Fishing_Reference_Links.md`. |
| Berkley Warpig 1/2 oz Blue Shad | BUY / CANDIDATE | OneNote buy item, not listed as owned. |
| Carolina Keepers | BUY / CANDIDATE | OneNote buy item, not listed as owned. |
| Bait Pop with red flake | BUY / CANDIDATE | OneNote TODO, not owned. |
| Ryugi Talisman Brutal Wacky/Neko hook and Berkley Maxscent Flux Gill | CANDIDATE | Listed in TODO Neko Rig page, not owned. Links restored in `Fishing_Reference_Links.md`. |

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

## Not yet covered by this exceptions report

This report covers the **OneNote PDF migration and OneNote MHT hyperlink restoration**. A separate historical-chat reconciliation may uncover additional conflicts, corrections, or omitted details from earlier project conversations.
