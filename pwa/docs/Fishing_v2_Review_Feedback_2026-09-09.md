# Fishing Companion v2 user review feedback

> Repository layout: production source/tests/contracts now live under `pwa/`; this document is retained PWA reference. Old `v2/`, v1 `pwa/`, History and Topics paths in dated evidence refer to the [pre-cleanup snapshot](https://github.com/ginosega/fishing/blob/edca2a3f04fc8c32dec65b9330d43944be1a561c/). Current instructions: [PWA README](../README.md).

Source: user-authored `v2 feedback.docx` and twelve supplied PNG screenshots, reviewed September 9, 2026 (Pacific). This record preserves the feedback wording. These requested UI corrections supplement the approved baseline; they do not authorize production cutover or P2.

## 1. Library loading screen

Observed v2 behavior:

No style applied – white background with default text & buttons

Requested behavior (verbatim):

Match the site style

Referenced attachments: Library Loading Screen.jpg

## 2. All site pages – top row/header

Observed v2 behavior:

Newly styled Fishing Companion page header on the left, My Gear, Knowledge Base, and Catch Log links on the right. “Green dot” (online status) has been removed.

Requested behavior (verbatim):

Keep the new page header. 
Remove the My Gear, Knowledge Base, and Catch Log links. 
Restore the “green dot,” give it a hover text of “Connection status,” and when clicked have it display a “Connection status” UI that shows the information that is in the left side of the v2 footer, including the offline readiness, # of files, and update & reload buttons. 

Referenced attachments: v2 Home Page.png

## 3. All site pages – bottom row/footer

Observed v2 behavior:

Offline readiness, # of files, and update & reload buttons on the left side, release/source/status info on right

Requested behavior (verbatim):

Relocate the connection status info to the UI that appears when you click the green dot (see above
Remove the release/source/status info from the production build

Referenced attachments: v2 Home Page.png

## 4. Home page

Observed v2 behavior:

Left-justified cards containing arrow image

Requested behavior (verbatim):

Center the three cards on the screen, similar to how the two cards were centered on the v1 home page
Remove the arrow image from the cards
General rule for cards across the site – no arrow icons

Referenced attachments: v1 Home Page.png, v2 Home Page.png

## 5. My Gear and Knowledge Base pages

Observed v2 behavior:

Back button replaced by link located above page header text, page subtitle text below page header missing, search box has text label above it and has been relocated below page header text and full width, cards missing icons and subtitles, arrow image added to cards, “Add Gear” and “Add Entry” links missing from below cards.

Requested behavior (verbatim):

Apply general rules
Restore v1 UX for back button – locate on same row as the page title, and right-justify
General rule for all site pages with “Back” button: Locate on same row as the page title, and right-justify
Restore page subtitle to v1 strings – should immediately follow page title and match text of button on home page. 
Restore card subtitles to v1 strings
Move Search box to top row in between page title and Back button, and right-justify alongside Back button.
General rule for search and type/category dropdown lists across the entire site: locate search box and type/category dropdown list on the same row and in between the page title and Back buttons, and right justify alongside the Back button
Remove label above Search box 
General rule for search boxes and category/type dropdown lists: no labels above them. Does not apply to Add or Edit pages.
Restore v1 card icons

Referenced attachments: v1 My Gear Page.png, v2 My Gear Page.png

## 6. My Gear and Knowledge Base category page (e.g., “Lures,” “Locations”)

Observed v2 behavior:

Back link above page title, Add Gear/KB Item button to right of page title, Search and Type control (when present) on next row and left-justified, arrows on cards, cards for it3ms with no pictures include a second arrow and their text is not aligned with other cards

Requested behavior (verbatim):

Apply general rules
Remove “Add Gear/Add Entry” button; replace with “Add Gear/Entry” link below cards and left-justify. 
If item has no picture, do not display arrow and align card text with other tiles

Referenced attachments: v2 Gear Category Page.png, v2 Gear Category Page – tile with no picture.png. The Lures page is used as an example, but these changes apply to all My Gear category pages.

## 7. Gear and KB item pages

Observed v2 behavior:

Back link above page, Copy Link and Edit buttons to right of and on same row as page title, Type is below image, Category name is not shown, Notes section incorrectly labeled on KB item pages

Requested behavior (verbatim):

Apply general rules
Remove Copy Link button and relocate it on Edit page
General rule for all site pages with “Copy Link” capability:  Copy Link button is located on the Edit page
Remove Edit button and relocate as a link to below the Catch History section with “Edit item” link text
General rule for all site pages with Edit links: put below lowermost page section, left-justified, and with “Edit item” link text
Gear item page only: Relocate Type text to immediately below page title and preface it by the category name followed by a dash: [category] – [type]”.
KB item page only: Relocate description text to immediately below page title
If there is not a picture available, do not display the “No picture available” box.
General rule for all site pages with pictures: If there is not a picture available, do not display the “No picture available” box.
KB item page only: Change “Content” label to “Notes.” Make sure that “Notes” heading and section only displays if the KB item has a markdown file included.

Referenced attachments: v2 Gear Item Page.png. A lure page is used as an example, but these changes apply to all My Gear category leaf/item pages.

## 8. Image viewer

Observed v2 behavior:

Two Close buttons, “null” text displays for images with no caption

Requested behavior (verbatim):

Remove top-right Close button
Don’t display “null” for images with no caption – leave caption area blank

Referenced attachments: v2 Image Viewer.png

## 9. Add gear/KB item page, edit gear/KB item entry page, copy link screen

Observed v2 behavior:

Title is “Add entry;” Picture section not in the same position as the Gear item page, various text anomalies

Requested behavior (verbatim):

Apply general rules
Add page only: Change title to “Add Gear” (this is already on the v2 page, but it is below the unwanted “Add entry” text)
Edit page only: Change title to “Edit [item name]” (this is already on the v2 page, but it is below the unwanted “Edit entry” text)
Edit page only: Add “Create Link” button to the same row as the page title, and right justify
General rule for all site Edit pages: Add “Create Link” button to the same row as the page title, and right justify
Both: Remove title subtext
Both: Remove text under ID text box
Both: Move Picture section to bellow ID text entry box
Both: Change text above “Choose File” button/card to “Choose a local picture” and text below the button/card to say “File must be manually uploaded to repository”
Both: Remove “Markdown in authoritative…” text below Notes entry box, and “Prepare changes creates…” text above Prepare Changes button
Both: In Specifications and Links sections, remove labels above label, value, and URL text entry box; they are duplicative of the default text already in these boxes
Both: In Links section, change default text of HTTP(S) URL text entry box to “URL”
Copy link screen: Change “Stable internal link” label to “Internal link.” Change “Copy stable link” button text to “Copy internal link.” Add space above close button.
KB add/edit item page only: Change “Content” label to “Notes.
Both: After clicking “Prepare Changes” button and then clicking “Copy Change” button, there should be a confirmation that the changes have been copied to the clipboard and should be added to the project chat for implementation and deployment.

Referenced attachments: v2 Add Gear Page.png, v2 Add Gear Page – Specs, Links, and Pictures.png, v2 Copy Link Screen.png

## Implementation interpretation

The document references a Library Loading Screen JPG; the supplied matching image is `v2 Library Loading Page.png`. The Specifications/Links/Picture filename likewise differs slightly; its supplied PNG was inspected. All twelve supplied screenshots were reviewed. Gear category cards have no v1 subtitles; KB category cards retain their exact five v1 descriptions. Root page subtitles match their home cards. Add Gear and Add Entry are domain-specific headings. The desktop title row groups controls at the right; narrow screens wrap controls without horizontal overflow. Labels removed visually retain accessible names. Missing-picture cards reserve empty space for title alignment, while detail/editor pages omit absent-image boxes. Catch remains read-only and has no editor or Create Link control in P1. Release diagnostics remain only in preview output.
