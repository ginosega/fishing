# Fishing Companion Testing Feedback

_Started: 2026-08-31_

This is the temporary working log for mobile-first acceptance testing of Fishing Companion. Capture feedback as it is observed, keep the deployed test build stable during a testing pass when practical, then implement related items in batches. Retire this file after acceptance testing is complete and durable decisions/follow-ups have been moved to the canonical README, decision log, or TODO as appropriate.

## Testing approach

- Primary device/use case: phone first; desktop/tablet secondary.
- Capture first-impression reactions before familiarity masks usability problems.
- Classify observations as BUG, UI/UX, WORKFLOW, FEATURE, DATA/CONTENT, RECOMMENDATION LOGIC, or PERFORMANCE/OFFLINE.
- Do not require the user to pre-classify or prioritize feedback.
- Batch straightforward UI changes so the interface does not change underneath an active testing pass.
- Flag any requested change that would materially affect architecture, deployment, maintenance complexity, performance, or usability before implementing it; discuss the requirement's priority and tradeoff first.

---

## Site-wide rules discovered during testing

- **UI/UX / CLEANUP — ACCEPTED:** Remove dynamic `NNN owned...` / record-count text everywhere. Remove dead code, styles, selectors, variables, or other implementation remnants used only by that removed text.
- **CATEGORY-PAGE SUBTITLE — ACCEPTED:** My Gear category/list pages do not need explanatory subtitle text beneath the H1 unless a specific category later demonstrates a real need for it. This is separate from the leaf-page subtitle rule below.
- **LINK / DATA DISPLAY — ACCEPTED:** For product/item detail pages, Manufacturer / Model should be plain text rather than a hyperlink. Put links in a dedicated **Links** field/box.
- **LINK / DATA QUALITY — ACCEPTED:** Canonical manufacturer link is required where a manufacturer exists. Link text should be the manufacturer company name. If the canonical manufacturer URL is missing, still show the manufacturer name as a visible gap signal; use **Unknown** if manufacturer itself is unknown. Retail and other supplemental links remain optional and should not get `Unknown` placeholders.
- **UI/UX / CLEANUP — ACCEPTED:** Do not expose source-of-truth bookkeeping fields such as `Status`, `Evidence`, or `Detail File` on user-facing item pages. Remove separate link pills when links have been consolidated into the dedicated Links field. Clean up dead CSS/code associated only with removed UI.
- **CATCH HISTORY SCOPE — ACCEPTED:** Show **My Catch History** only for rod/reel setups, lures, and baits. Do not show it for line, weights, snaps & swivels, or hooks.
- **FOOTER — ACCEPTED:** Show the copyright footer on every page. Implement the year dynamically from the current date so it changes automatically each January 1. Current target presentation is `© 2026 Gino Sega`.
- **LEAF-PAGE SUBTITLE — ACCEPTED / SUPERSEDES EARLIER PUNCTUATION:** Use `[gear category] - [type]` beneath the H1 on applicable My Gear leaf pages. Examples: `Line - Braided`, `Weights - Egg sinkers`, `Snaps & swivels - Snaps`, `Rods & Reels - Spinning`.
- **LEAF-PAGE CORE FIELDS — ACCEPTED / SUPERSEDES EARLIER FIELD-LABEL DETAILS:** Standardize applicable My Gear leaf-page identity/detail boxes on **Manufacturer / Model**, **Specifications**, and **Links**. For Rods & Reels, the Rod and Reel H2 sections each use this trio. For Weights, size/weight belongs in Specifications and Brand/Manufacturer belongs in Manufacturer / Model. For Line, test/length/color belong in Specifications. **Specifications** (plural) supersedes the earlier singular `Specification` label.
- **OPTIONAL LINKS RENDERING — ACCEPTED:** The Links field exists in the data model, but the box should be omitted when there are no links rather than rendering an empty box. Required manufacturer-link gaps may still be surfaced through the Manufacturer / Model/Links data-quality behavior described above.
- **RELATIONSHIP PRESENTATION — ACCEPTED:** Where detailed technique/rig content exists on its own Knowledge Base page, gear pages should generally summarize the relationship and link to that page rather than reproducing the full technique. Exceptions are gear categories whose substantive knowledge genuinely belongs to the gear/type itself, including Rods & Reels, Line, and Snaps & Swivels.

---

## Home page — initial mobile impressions

### Positive feedback

- **UI/UX — KEEP:** Black and green visual treatment works very well, particularly with the phone in dark mode.
- **UI/UX — KEEP:** Current icon selections are strong.

### Requested changes

- **UI/UX — ACCEPTED:** Remove the `What do you want to do?` heading and its explanatory paragraph. Replace that hero content with the app name: **Fishing Companion**.
- **UI/UX — ACCEPTED:** Rename the first home button from **My Gear & Knots** to **My Gear**. Keep its existing subtext unchanged.
- **UI/UX / WORKFLOW — ACCEPTED:** Rename **Build a Fishing Plan** to **Knowledge Base**.
- **UI/UX — ACCEPTED:** Replace the Knowledge Base button subtext with: **Build a fishing plan based on your location, gear, and target species.**
- **UI/UX — ACCEPTED:** Replace the footer with the site-wide dynamic copyright footer.

---

## My Gear page — initial mobile impressions

### Requested changes

- **UI/UX — ACCEPTED:** Rename page header from **My Gear & Knots** to **My Gear**.
- **UI/UX — ACCEPTED:** Change page subtext to: **Browse your inventory of equipment, tackle, bait, and your knot library**.

---

## Rods & Reels — requested workflow/model change

### Duplicate-record bug / current data issue

- **BUG — CONFIRMED:** Daiwa Tatula XT and Shimano Zodias rods appear twice on the current Rods page; Daiwa Exceler LT and Shimano SLX DC XT reels appear twice on the current Reels page.
- **ROOT CAUSE:** Current PWA model imports rod/reel/line records from the gear registry and then imports setup components again from the setup tables. The current dedupe logic does not reliably collapse those two representations.
- **WORKFLOW / MODEL:** The `Short rod` and `Pflueger President` representations are components of the same spincast setup, not separate setups. The future setup-centric Rods & Reels UI should represent that as one setup. Exact spincast rod make/model remains missing and should be supplied by the user later.
- **EXPECTED OWNED SETUP COUNT:** Three total setups: one Spinning, one Baitcasting, one Spincasting.

### Category/list page

- **WORKFLOW / IA — ACCEPTED IN PRINCIPLE, ARCHITECTURE REVIEW REQUIRED:** Combine the separate **Rods** and **Reels** categories into one **Rods & Reels** page.
- **UI/UX — ACCEPTED:** Remove search box and `All Types` filter from this page.
- **WORKFLOW — ACCEPTED:** Group all owned setups directly on the **Rods & Reels** page under the headers **Spinning**, **Baitcasting**, and **Spincasting**.
- **WORKFLOW — ACCEPTED:** Each individual setup is a clickable item on that page; clicking it opens that setup's detail page.
- **WORKFLOW / IA — IMPORTANT:** Do **not** create intermediary **Spinning**, **Baitcasting**, or **Spincasting** pages. Setup type is a grouping/classification attribute, not a navigation level. This deliberately flattens the visible hierarchy for faster phone use.
- **SCALABILITY:** If multiple setups of the same type are added later, list all of them directly beneath that type's header on the same **Rods & Reels** page.
- **DATA DISPLAY — ACCEPTED:** Each setup item subtext should show `Rod: [manufacturer model], Reel: [manufacturer model]`.
- **DATA QUALITY SIGNAL — ACCEPTED:** If manufacturer/model is not known, display **unknown** rather than hiding the field so gaps are visible during testing.

### Individual setup page

- **UI/UX — ACCEPTED:** Page header should be the combined setup identity: `Rod: [manufacturer model], Reel: [manufacturer model]`, using **unknown** for missing required identity data.
- **UI/UX — SUPERSEDED FORMAT:** Header subtext uses the site-wide leaf-page pattern, e.g. `Rods & Reels - Spinning`.
- **WORKFLOW / DATA DISPLAY — ACCEPTED:** Replace the generic metadata grid with two H2 sections: **Rod** and **Reel**.
- **DATA DISPLAY — SUPERSEDED STANDARD:** Each Rod/Reel section contains **Manufacturer / Model**, **Specifications**, and **Links**.
- **DATA/CONTENT — ACCEPTED:** Preserve and display any additional Rods & Reels links from the original OneNote page. Specific verified example: the Daiwa Exceler LT reel should include the **Maintenance** link to `Greasing and Oiling Your Spinning Reel`.
- **UI/UX / WORKFLOW — ACCEPTED:** Remove **Knots & connections** from Rods & Reels setup pages.

### Setup guidance / How to use it

- **DATA/CONTENT — ACCEPTED:** The setup page's **How to use it** section should expose the valuable research from the former OneNote **Rods & Reels** page, substantially as written rather than presenting arbitrary text mentions.
- **Spinning:** include `Use spinning gear when:` and all five associated bullets, plus `Typical spinning combo:` and all three associated bullets.
- **Baitcasting:** include `Use baitcasting gear when:` and its bullets, plus the baitcaster `Technique` / setup-and-casting guidance and bullets.
- **REUSE REQUIREMENT:** This guidance belongs to the setup **type**, not only one physical setup. If a second baitcasting setup is added later, it should inherit the same baitcasting guidance automatically.
- **ARCHITECTURE NOTE:** Current PWA model treats rods/reels primarily as independent inventory records and discovers guidance by text mentions. This request points toward first-class **rod/reel setup** records linked to reusable **setup-type guidance**. The data model may preserve that relationship internally, but the UI must not expose every data-model level as a separate navigation page.

### Catch history observation

- **DATA/CONTENT — GAP DISCOVERED:** Empty catch-history sections reveal that the current catch log does not record which rod/reel setup was used.
- **FOLLOW-UP:** Extend catch logging later to include rod/reel setup so setup-specific catch history can become meaningful. Do not fabricate historical setup data unless it can be recovered from source notes or user confirms it.

### Source verification

- Original OneNote/PDF page verified on 2026-08-31. It contains the expected spinning guidance, baitcasting guidance, Daiwa Exceler LT maintenance link, baitcaster setup/casting notes, `Why Use Both`, and `Three Rod Quiver` content.
- Current canonical `Topics/Rods_Reels_Line_Knots.md` preserves most of this research, but the PWA presentation/model does not currently surface it in the setup-centric way requested.

---

## Line — requested workflow/model changes

### Line list page

- **UI/UX — ACCEPTED:** Remove the `N owned/saved records...` subtitle beneath the page header.
- **UI/UX — ACCEPTED, LINE-SPECIFIC:** Remove the Search box and `All Types` dropdown on the Line page. Do **not** generalize this removal to every category; Lures is an example where search/filtering may still be useful.
- **DATA MODEL — CORRECT:** Replace current `Leader`, `Line`, and `Main Line` pseudo-types with the actual fishing-line type taxonomy: **Braided**, **Fluorocarbon**, and **Monofilament**.
- **WORKFLOW / DISPLAY — ACCEPTED:** Organize the Line page into H2 sections **Braided**, **Fluorocarbon**, and **Monofilament**, and place line products beneath the correct section.
- **OWNED INVENTORY — EXPECTED:** Four owned line products currently: Sufix 832 braid, PowerPro Super8 Slick V2 braid, Seaguar InvizX 8 lb fluorocarbon, and Seaguar InvizX 12 lb fluorocarbon. Current page shows each twice; eliminate duplicate imports.
- **LINE TITLE RULE — ACCEPTED:** Product title must not include line type (`braid`, `braided`, `fluorocarbon`, etc.). Type is structured data and grouping context.
- **LINE TITLE RULE — ACCEPTED:** Product title must not include color. Color is specification data.
- **EXAMPLE TARGET DISPLAY:** Under **Braided**, first card title should be **Sufix 832** with subtext **15 lb., Hi-Vis Yellow, 300 yd.**

### Individual line page

- **LINE TITLE RULE — ACCEPTED:** Apply the same normalized product-title rule to the H1.
- **UI/UX — SUPERSEDED FORMAT:** Header subtext uses the site-wide leaf-page pattern, e.g. `Line - Braided`.
- **DATA MODEL — ACCEPTED:** Do not show a separate `Category` field; type is already represented in the header.
- **DATA MODEL — ACCEPTED:** Remove `Component` from the line model/display. Preferred line fields are **Type, Manufacturer, Model, Test, Color, Length**.
- **DATA DISPLAY — SUPERSEDED STANDARD:** User-facing core boxes are **Manufacturer / Model**, **Specifications**, and **Links**. Specifications include line test, length, and color where applicable. Color is optional and primarily applicable to braided line; missing optional color must not display `Unknown`.
- **UI/UX / CLEANUP — ACCEPTED:** Apply site-wide removal of Status, Evidence, Detail File, and standalone link pills.

### Knots & connections on line pages

- **WORKFLOW / CONTENT — KEEP:** Line detail pages should retain **Knots & connections**.
- **CONTENT SOURCE — REQUIRED:** Include relevant knot material from the former OneNote Line page for the current line type.
- **CONTENT SOURCE — REQUIRED:** Include relevant material from the Knots page's **Braided**, **Fluorocarbon**, or **Monofilament** subsection for the current type.
- **CONTENT SOURCE — REQUIRED:** Include relevant line-type mentions from lure/technique pages where those mentions express connection/rigging guidance. Examples supplied by user: fluorocarbon mentions on Drop Shot, Wacky Worm, Inline Spinners, and Swimbait pages.
- **INFORMATION PLACEMENT:** Lure/technique applicability belongs here when it is about how the line is connected/used in a rig; do not clutter the general **How to use it** section with a list of lure types.

### How to use it on line pages

- **CONTENT MODEL — CHANGE:** Current arbitrary mention-search output is not useful enough.
- **DATA/CONTENT — REQUIRED:** Replace it with the substantive OneNote Line-page guidance under the matching **Braided**, **Fluorocarbon**, or **Monofilament** heading, substantially preserving its bullets.
- **REUSE REQUIREMENT:** This guidance belongs to the line **type**. Every product of the same type should inherit the same type-level guidance automatically.

### Catch history on line pages

- **UI/UX — REMOVE:** Do not show **My Catch History** on line pages, per the site-wide catch-history scope rule.

### Architecture implication

- **IA / DATA MODEL:** Like Rods & Reels, Line benefits from separating **owned product records** from **reusable type-level knowledge**. Example: Sufix 832 is a product instance; Braided is a type whose guidance is reusable across all braided products. Markdown remains authoritative; this does not imply a separate database.

---

## Weights — requested workflow/model changes

### Weights list page

- **UI/UX — ACCEPTED:** Remove the subtitle beneath the Weights page header.
- **DATA MODEL — CORRECT:** Represent owned weights/related rigging pieces as four normalized records/types rather than treating a fishing technique as an item type: **Cylinder weights**, **Egg sinkers**, **Swiveling trolling / torpedo weights**, and **Glass beads**.
- **DATA MODEL — CORRECT:** `Drop shot` is a fishing technique/rig relationship, not a weight type. It belongs in the Cylinder weights detail page's **How to use it** relationship section.
- **TITLE NORMALIZATION — ACCEPTED:** Remove `kit` from the Cylinder weights title. Track the owned denominations within the Cylinder weights record.
- **DISPLAY — ACCEPTED:** Card subtext should be the sizes/weight denominations owned for that type, standardized to ounces for weights.
- **EXPECTED CYLINDER WEIGHTS:** `1/8 oz, 1/5 oz, 1/4 oz, 3/8 oz, 1/2 oz`.
- **EXPECTED EGG SINKERS:** `1/4 oz, 1/2 oz`.
- **EXPECTED SWIVELING TROLLING / TORPEDO WEIGHTS:** current canonical inventory records `1/2 oz`.
- **EXPECTED GLASS BEADS:** current canonical inventory records `8 mm` (red, Top Brass); size is not an ounce measurement because this record is a bead rather than a sinker.

### Individual weight pages

- **TITLE — ACCEPTED:** H1 should use the normalized type title from the Weights list page, e.g. **Egg sinkers**.
- **UI/UX — SUPERSEDED FORMAT:** Header subtext uses the site-wide leaf-page pattern, e.g. `Weights - Egg sinkers`.
- **DATA DISPLAY — SUPERSEDED STANDARD:** User-facing core boxes are **Manufacturer / Model**, **Specifications**, and **Links**. Owned size/weight denominations go in Specifications; brand/manufacturer belongs in Manufacturer / Model. This supersedes the earlier separate `Size / Weight` and `Brand` boxes.
- **DATA DISPLAY — OPTIONAL LINKS:** The Links box is omitted when empty. Current Cylinder weights record has an Amazon link; other weight types need no empty Links placeholder.
- **UI/UX / CLEANUP — ACCEPTED:** Remove `Status / Notes` from the user-facing page.
- **KNOTS & CONNECTIONS — OPTIONAL:** Keep this relationship available in the weight model but do not render the section when no content exists. Current weights have no explicit tying/connection guidance, but future techniques may add it.
- **HOW TO USE IT — OPTIONAL / RELATIONSHIP-DRIVEN:** Render only when relationships exist. Current expected relationships include **Cylinder weights → Drop shot rig** and **Egg sinkers → Slip sinker rig**.
- **HOW TO USE IT — LINK BEHAVIOR:** The relationship label (e.g. **Drop shot rig**, **Slip sinker rig**) should link to that technique's Knowledge Base page rather than dumping arbitrary mention text into the weight page.
- **CATCH HISTORY — REMOVE:** Do not show **My Catch History** on weight pages, per site-wide rule.

### Architecture implication

- **RELATIONSHIP MODEL:** Weights reinforce the need for explicit relationships between owned gear/tackle records and Knowledge Base technique records. A weight record should not be renamed/reclassified based on the technique that uses it; instead, the relationship points from the physical item/type to the applicable technique page.
- **OPTIONAL SECTIONS:** Detail-page sections such as Links, Knots & connections, and How to use it should be data-driven and omitted entirely when empty rather than rendering empty-state boxes unless an empty state itself serves a specific testing/data-quality purpose.

---

## Snaps & Swivels — requested workflow/model changes

### Snaps & Swivels list page

- **UI/UX — ACCEPTED:** No subtitle beneath the page header.
- **UI/UX — ACCEPTED:** Remove the Search box on this page.
- **DATA MODEL — ACCEPTED:** Three types for this gear category: **Snaps**, **Swivels**, and **Snap swivels**.
- **TITLE DISPLAY — ACCEPTED:** Keep the existing product/card titles even when they include the type because that wording is necessary for clear identification in this category.
- **CARD SUBTEXT — ACCEPTED:** Use `[type] - [known specification data]`. Example target: **VMC CRS Crankbait Snaps** with subtext `Snaps - Size 0, 50 lb`.

### Individual Snaps & Swivels pages

- **LEAF SUBTITLE — ACCEPTED / GENERALIZED:** Use the site-wide `[gear category] - [type]` pattern. Example: `Snaps & swivels - Snaps`.
- **CORE BOXES — ACCEPTED / GENERALIZED:** Use **Manufacturer / Model**, **Specifications**, and **Links**, following the site-wide manufacturer/link rules.
- **KNOTS & CONNECTIONS — REQUIRED WHEN APPLICABLE:** Surface explicit line/knot/terminal-tackle relationships rather than generic text matches. Example: for a swivel used with fluorocarbon, show guidance such as `Use a Trilene knot when using a swivel on a fluorocarbon line`, with **Trilene knot** linked to the Trilene knot leaf page.
- **HOW TO USE IT — TYPE-LEVEL KNOWLEDGE:** Use the substantive OneNote Snaps & Swivels guidance for the current type. The OneNote source has separate **Snaps**, **Swivels**, and **Snap Swivels** sections with multiple bullets; each owned product should inherit the relevant type-level guidance.

### Source verification

- Original OneNote/PDF verified on 2026-08-31: owned terminal items include **VMC CRS Crankbait Snaps, size 0, 50 lb**, **Tsuridamashii ball-bearing swivels, size 0, 55 lb**, and **Tsuridamashii ball-bearing snap swivels, size 0, 55 lb**.
- OneNote Snaps & Swivels guidance includes when to use/avoid snaps, when to use swivels to prevent twist, ball-bearing vs barrel-swivel guidance, and cautions about attaching snap swivels directly to lures.
- OneNote Knots guidance explicitly maps **fluorocarbon → swivel = Trilene** and **fluorocarbon → snap = Trilene**.

### Architecture implication

- **TYPE-LEVEL KNOWLEDGE + EXPLICIT RELATIONSHIPS:** Snaps & Swivels reinforce the emerging model: owned product records carry manufacturer/spec/link data; reusable type records carry general usage guidance; explicit relationships connect line types, knot records, terminal tackle, and techniques. Avoid relying on broad arbitrary mention-search output for these curated relationships.

---

## Hooks — requested workflow/model changes

### Hooks list page

- **UI/UX — ACCEPTED:** No subtitle beneath the H1 and no Search box.
- **UI/UX — KEEP:** Retain the type dropdown because it is useful for Hooks.
- **DATA NORMALIZATION — ACCEPTED:** Change **VMC Crossover Rings** from type `Wacky rigging` to **Wacky** and remove the separate `Wacky rigging` type.

### Individual Hook pages

- **GENERAL RULES — APPLY:** Use the site-wide leaf subtitle, core fields, links, bookkeeping-field cleanup, and catch-history rules.
- **DATA NORMALIZATION — GAMAKATSU OCTOPUS:** `Part 02210, 8-pack` belongs in **Model**; `#1` belongs in **Specifications**.
- **KNOTS & CONNECTIONS — CURATED RELATIONSHIP WORDING:** Prefer the clearest technique-specific source wording rather than generic connection-table text when available. Example target for Gamakatsu Octopus Hook: `When using with a Wacky Worm, tie directly to a leader with a Palomar knot`, with **Wacky Worm** and **Palomar knot** linked to their respective KB leaf pages.
- **HOW TO USE IT — RELATIONSHIP-DRIVEN:** Do not repeat full technique instructions. Express concise relationships and link to the technique. Example: `This hook is commonly used with a Ned rig`, with **Ned rig** linked to the technique page.
- **CONTENT MODEL:** Where multiple techniques mention a hook, do not mechanically dump every mention. Curate the meaningful relationships and let the technique pages own detailed instructions.

### Source verification

- Canonical Fishing Techniques content explicitly associates the size-1 **Gamakatsu Octopus Hook** and **VMC Redline Weedless Wacky Neko** with the **Wacky worm** technique and says `Tie direct with Palomar`.
- Canonical Fishing Techniques content explicitly associates **Z-Man Finesse ShroomZ** with the **Ned rig** and includes direct-tie/Palomar guidance.
- Canonical knot content identifies the **Palomar** as strong/easy and suitable for small hooks/light line; use the knot page for the reusable knot details rather than repeating them on every hook page.

---

## Lures — requested workflow/model changes

### Lures list page

- **UI/UX — ACCEPTED:** No subtitle beneath the H1, following the My Gear category-page rule.
- **UI/UX — KEEP:** Retain both Search and the type dropdown on Lures; they are useful here.
- **UI/UX / TAXONOMY — KEEP:** Current lure types, card titles, and card subtext are generally good.
- **VARIANT GROUPING — ACCEPTED:** Group multiple owned variants of the same lure/product family into one card when the distinction is only owned size/weight/color variants, analogous to normalized grouping on Weights.
- **EXAMPLE — KASTMASTER:** Replace separate Kastmaster variant cards with one **Kastmaster** record/card. Specifications should aggregate the owned variants: `1/8 oz, 1/4 oz, Chrome, Gold, Neon Blue`.
- **EXAMPLE — PANTHER MARTIN:** Replace four Panther Martin cards with one **Panther Martin** record/card. Specifications should aggregate: `1/8 oz, Blue, Black, Silver, Yellow`.
- **MODEL NOTE:** Preserve the individual owned variants as structured inventory data even when the list UI aggregates them into a product-family card; do not lose variant-level data needed later for planning or catch history.

### Individual Lure pages

- **GENERAL RULES — APPLY:** No generic `Item` field. Use **Manufacturer / Model**, **Specifications**, and **Links**; combine size/weight/color in Specifications; remove Status / Notes and redundant link pills.
- **CATCH HISTORY — KEEP:** Lures remain one of the categories where My Catch History is relevant.

### Knots & connections

- **CONTENT MODEL — CHANGE:** Current generic connection summaries are often directionally correct but too lossy. Prefer the definitive lure-type/technique source and retain important knot, hardware, caveat, and maintenance details.
- **CHATTERBAIT TARGET:** Use guidance substantially equivalent to: `Tie line directly to lure using a Palomar knot. No snap/swivel; can disrupt blade startup/vibration. Use a loop knot in cold water or finesse situations to let the blade swing more freely. Retie often, as vibrations stress the knot.` Link **Palomar knot** and **Loop knot** to their knot leaf pages.
- **LOOP-KNOT CONFLICT — PRESERVE:** The KB currently contains an unresolved conflict: lure/technique guidance sometimes recommends a loop knot for action while the knot page says not to use loop knots because they are weak. Do not silently erase either source. The Chatterbait page may present the technique-specific caveat and link to the Loop knot page, while the Loop knot page retains the unresolved warning until the user resolves it.
- **INLINE SPINNER TARGET — USER-PROVIDED DEFINITIVE TEXT:** Use the following as the single Knots & connections entry for Inline Spinners:
  - `Tackle: If using only fluoro or mono line, use a swivel about 12–18 inches ahead of the lure and don't add a dressing. Add a snap if changing lures. Mainline → swivel → 12–18” leader → snap (optional) → lure. If using braided line and a leader, insert a swivel in the leader. Mainline → 12-18" leader → swivel → 12-18" leader → snap (optional) → lure.`
  - `Knot: Improved Clinch. Retie often, as vibrations stress the knot over time.`
- **LINK BEHAVIOR:** Link named knot records such as Palomar, Loop, and Improved Clinch to their knot leaf pages when rendered.

### How to use it

- **CONTENT MODEL — CHANGE:** Current arbitrary mention/excerpt behavior is not sufficient for lure pages.
- **INLINE SPINNER DEFINITIVE CONTENT:** Pull in the substantive OneNote **Use**, **Technique**, and **Color** sections for Inline Spinners. Preserve the useful bullet structure substantially as written.
- **DEFER TABLES:** Do not bring in the two Inline Spinner OneNote tables yet, even though they contain useful information; defer until a later refinement pass.
- **PATTERN TO GENERALIZE CAREFULLY:** For other lure types, identify the definitive lure-type page/section and surface the actual type-specific **Use / Technique / Color (or equivalent)** guidance rather than arbitrary text mentions. Do not invent a generic template when the source structure differs; preserve the best source organization for each lure type.

### Architecture implication

- **PRODUCT FAMILY + VARIANTS:** Lures need a product-family layer that can aggregate multiple owned variants for browsing while preserving each size/color/weight variant underneath for planning and catch-log precision.
- **TYPE-LEVEL CURATED KNOWLEDGE:** Knots & connections and How to use it should be driven from curated lure-type/source sections and explicit relationships, not broad mention search.

---

## Implementation status

**QUEUED / DO NOT DEPLOY DURING FIRST PASS.** Continue reviewing remaining My Gear categories on the current stable build. Consolidate repeated patterns into reusable page/data-model rules before implementing the My Gear batch.