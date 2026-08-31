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

## Home page — initial mobile impressions

### Positive feedback

- **UI/UX — KEEP:** Black and green visual treatment works very well, particularly with the phone in dark mode.
- **UI/UX — KEEP:** Current icon selections are strong.

### Requested changes

- **UI/UX — ACCEPTED:** Remove the `What do you want to do?` heading and its explanatory paragraph. Replace that hero content with the app name: **Fishing Companion**.
- **UI/UX — ACCEPTED:** Rename the first home button from **My Gear & Knots** to **My Gear**. Keep its existing subtext unchanged.
- **UI/UX / WORKFLOW — ACCEPTED:** Rename **Build a Fishing Plan** to **Knowledge Base**.
- **UI/UX — ACCEPTED:** Replace the Knowledge Base button subtext with: **Build a fishing plan based on your location, gear, and target species.**
- **UI/UX — ACCEPTED:** Remove the dynamic footer text showing the number of owned gear/tackle/knot records.
- **UI/UX — ACCEPTED:** Replace the footer with **© 2026 Gino Sega**.

---

## My Gear page — initial mobile impressions

### Requested changes

- **UI/UX — ACCEPTED:** Rename page header from **My Gear & Knots** to **My Gear**.
- **UI/UX — ACCEPTED:** Change page subtext to: **Browse your inventory of equipment, tackle, bait, and your knot library**.
- **UI/UX / CLEANUP — ACCEPTED, SITE-WIDE:** Remove the dynamic `NNN owned...` / record-count text everywhere in the site. Remove dead code, styles, selectors, variables, or other implementation remnants used only by that removed text rather than leaving unused debris behind.

---

## Rods & Reels — requested workflow/model change

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
- **UI/UX — ACCEPTED:** Header subtext should read `Rods & Reels · Spinning`, `Rods & Reels · Baitcasting`, or `Rods & Reels · Spincasting` as applicable.
- **WORKFLOW / DATA DISPLAY — ACCEPTED:** Replace the generic metadata grid with two H2 sections: **Rod** and **Reel**.
- **DATA DISPLAY — ACCEPTED:** Each Rod/Reel section should contain only three fields/boxes: **Manufacturer / Model**, **Specification**, and **Links**.
- **UI/UX — ACCEPTED:** Rename `Important specifications` to **Specification**.
- **LINK MODEL — ACCEPTED:** Remove hyperlinks from Manufacturer / Model text and move them into the **Links** box.
- **LINK MODEL — ACCEPTED:** The canonical manufacturer link is required. Link text should be the manufacturer company name (for example, Daiwa or Shimano). If its URL is missing, still show the manufacturer name (or **Unknown**) as a visible data-gap signal.
- **LINK MODEL — ACCEPTED:** Retail/other links remain optional. Do not show `Unknown` placeholders for missing optional links.
- **DATA/CONTENT — ACCEPTED:** Preserve and display any additional Rods & Reels links from the original OneNote page. Specific verified example: the Daiwa Exceler LT reel should include the **Maintenance** link to `Greasing and Oiling Your Spinning Reel`.
- **UI/UX — ACCEPTED:** Remove `Status`, `Evidence`, and `Detail File` boxes from the setup page.
- **UI/UX — ACCEPTED:** Remove the separate link pills because links are being consolidated into the Links box.
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

### Implementation status

**QUEUED / DO NOT DEPLOY DURING FIRST PASS.** Straightforward text/UI changes are accepted. The Rods & Reels setup-centric model change requires a brief architecture decision before implementation.