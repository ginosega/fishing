# V3 Notes Markdown Editor — October 31, 2026 approved UX and scope clarification

## Owner-approved Insert link extension (October 31, 2026)

Owner approved the shared Insert link dialog alongside Insert image in every V3 Notes editor (Gear, KB, Catches), in normal and expanded modes. Show selectable Site page versus External URL, a customizable label prefilled from highlighted Markdown, a searchable and category-filterable page selector, and insert at the editing cursor. **Picker includes Gear + Knowledge Base entries and Home/My Gear/Knowledge Base/Catch Log navigation, but NEVER individual Catch records.** Manual `catches://<ID>` references still work if the Catch exists; `gear://<ID>` and `kb://<ID>` remain unchanged. New `site://home`, `site://gear`, `site://kb`, `site://catches` use stable navigation routes. External links require HTTP(S), no credentials, and open separately. No new storage or schema changes. Source work: [edd2fcb](https://github.com/ginosega/fishing/commit/edd2fcb96dcbe47fcb5a4fcf9136d60f5e7e8682); private build UX/device acceptance and other D6 release gates remain OPEN. No deploy for this individual feature.


**Owner decision:** The Notes editor design was approved for implementation, not yet for deployed-build acceptance. Field acceptance must occur in a deployed V3 build. This amendment updates the October 19 V3 product baseline without changing its canonical public-read/owner-write architecture, Gear/KB/Catch data model, no offline queue, or separately approved public cutover requirement.

## Shared authoring experience

Gear, Knowledge Base and Catch Notes use the same full-featured Markdown editing controls:

- Compact **Insert image**, **Preview Markdown / Edit Markdown**, and **Expand / Exit full page** controls at the **top** of the Markdown area, not full-width below it.
- Expanded editing uses nearly the full window, and exiting preserves the same text and editing position; Escape exits expanded mode.
- Preview shows rendered Markdown and pending local image previews without publishing.
- Image insertion uses the owner-facing file picker, original image preview, required alternative text, optional **Enable Picture Viewer** checkbox (OFF by default), and optional viewer caption. **Insert into Notes** places Markdown at the cursor and retains the original file in memory until the single **Save and Publish** action.
- The inserted file is stored beneath an item-specific `assets/<item-id>/notes/` directory. Source paths are generated automatically. The existing GitHub/manual-upload authoring route does not require new work; direct V3 editor authoring is the target.

## Markdown syntax and renderer safety

Inside Markdown table cells, support both `- First<br/>- Second` and `1. First<br/>2. Second` as unordered and ordered lists respectively; allow the safe `<br/>` separator without broadly enabling embedded HTML. The owner will manually update historical `<br>` tags and does not request a special migration. The Humminbird Fish Finder table in public `main` is the target regression example; the older V3 branch content must not overwrite newer canonical Markdown during integration.

For ordinary images the viewer is OFF, including existing Markdown images. Explicit per-image conventions:

```markdown
![Fish photo](../assets/catch-id/notes/fish.jpg)
![Fish photo](../assets/catch-id/notes/fish.jpg "viewer")
![Fish photo](../assets/catch-id/notes/fish.jpg "viewer: Landing the fish")
```

The image title marker is a Fishing Companion extension. Ordinary GitHub Markdown still displays the image; the V3 renderer interprets only the narrow viewer marker and optionally uses the remainder as a caption.

## Clarification of Catch picture exclusion

The earlier exclusion of **Catch photos** means **no Catch representative/card/cover picture field**: the top image must remain automatically derived from the Catch's species. **Photographs embedded within Catch Notes are expressly INCLUDED**, with the same editor upload, Markdown, optional viewer and caption capabilities as Gear/KB Notes. No addition to the Catch JSON schema, no Catch pictureSequence, no GPS/session changes.

## Publication and safety contract

- Continue using the existing owner-only GitHub App, Cloudflare D1 receipt and D4 private original-image staging, including the source-aware immutable snapshot, CSRF, signed media tickets, SHA256/size/MIME validation, exact-head CI, ordinary protected merge and hosted-byte proof.
- Stage image bytes under valid item-specific folders for Gear, KB and Catches, never exposed as a new representative Catch photo.
- Require each proposed inline Notes image to actually appear as a validated local Markdown image reference; refuse missing/unowned/colliding/stale/partial media, retain unsent content on errors, and do not falsely report Live.
- Do not require a new storage service or extra D1 migration for this work.
- Release path and **V3-SAVE-09 ≤60s** text-only public publishing acceptance remain separate, unresolved D6 requirements; media uploads have their own measurable latency.

## Stage and acceptance

**D3:** Shared Notes editor toolbar, expanded mode, preview and image insertion UX.
**D4:** Include Gear/KB/Catch inline Notes originals in guarded atomic source/media publication.
**D5:** Safe table-cell lists, viewer opt-in default-off, and offline reader compatibility.
**D6:** Deployed private owner desktop/Android end-to-end field acceptance, source/media failure tests, release/rollback and separate explicit final public cutover.

**Not complete solely from source CI:** live deployed image-insertion UX and preview fidelity, Android keyboard/fullscreen behavior, ordered table list appearance, actual Catch Notes photo publication/viewer, anonymous denial, interrupted upload recovery, hosted original-byte verification and final public release. No private pilot or public V2 deployment accompanies this source amendment.
