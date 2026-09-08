# Buzzbait and Jack Hammer image release

**Status: DEPLOYED / CLOSED.** September 8, 2026. FISH-TODO-062 DONE. Browser acceptance remains a normal follow-up; no independent live HTTP response is claimed.

## Release evidence

- PR52: https://github.com/ginosega/fishing/pull/52
- Final head: `28d84e650e0b3e1722a81d4abeeed7cb7572662c`.
- Normal PR CI: #266 / `34185963172`, success against main `4ca1613d089859cfd554636e8c554acd6178cdc1`. An earlier successful run #265 / `34185865010` preceded a metadata-provenance correction; #266 validates the actual merged head.
- Merge: `91ee0966eff5ef95d6a7d192a95b10940d0b534e`.
- Production: #267 / `34186006471`, success. All model/routing/authoring/media/content tests, build, authored-Notes and local-media materialization, final transformed-bundle verification and artifact uploads passed. The actual Deploy to GitHub Pages step completed successfully at 2026-09-08 04:10:18 UTC.
- Production workflow: https://github.com/ginosega/fishing/actions/runs/34186006471
- Live site: https://ginosega.github.io/fishing/

## Scope and preservation

The authorized handoffs add the representative picture for KB `technique-buzzbait` and replace the picture for owned Gear `zman-jack-hammer`. No article, Gear facts, Notes, identities, ownership mapping, taxonomy or historical Catch data were changed. Source schema/data versions remain Gear4/`2026-09-06-my-gear-v4-ordered-links-1`, KB1/`2026-09-04-kb-v1-final-content-1`, and Catch2/`2026-09-04-catches-v2-external-notes-1`. Record counts remain 64/54/5.

### Buzzbait

The user-uploaded source `pwa/assets/kb/equipment/technique-buzzbait.jpg` is preserved. Its original Git blob `7abd3259ddb1d813d9282eed4400e3f0b39897bc` (137372 bytes) was reused to create the approved destination `pwa/assets/kb/entries/technique-buzzbait.jpg`, so the repository copy is byte-identical. The KB overlay registers `./assets/kb/entries/technique-buzzbait.jpg` with alt/caption `Booyah Buzz buzzbait`, credit null, and source URL `https://a.co/d/02qedNlw`. The source index retains the same stable ID, type, description, null source picture and Content path. The supplied `keep` Markdown was verified against the current file; the existing article was not rewritten. No Gear ownership was inferred from the representative picture.

### Z-Man Jack Hammer

The existing source `pwa/assets/gear-source/zman-jack-hammer.png` is Git blob `20c4bf7be24755dc37e3de558d75a7085d189df0` (2787253 bytes). The normal local-media pipeline validates its actual PNG format and copies its bytes without recompression. The active source registration preserves media ID `zman-jack-hammer` and the existing exact Gear owner `zman-jack-hammer`. All product facts, links and `gear-content/zman-jack-hammer.md` remain unchanged.

Historical remote provenance is retained in the unchanged source/override records: previous source page `https://www.ebay.com/itm/336474453546`, image `https://i.ebayimg.com/images/g/MKoAAeSwO1hpsd4D/s-l500.png`, and manufacturer destination `https://zmanfishing.com/products/chatterbait-r-jackhammer#`. The new local record retains that exact historical source page and manufacturer destination, not a generic eBay homepage. The external origin of the newly supplied PNG is not independently known and is not inferred from the old image. No repository source image was deleted. The original remote URL and metadata remain in Git history; continued availability at the third-party host is not guaranteed. The new source is preserved in the repository.

## Validation and scope boundary

The standard PR and production pipelines succeeded without omitting tests or rerunning migrations. Actual image validation, final transformed KB/Gear/Catch validation, offline asset manifests and bundle checks passed. The Buzzbait original and destination share the same Git blob; the Jack Hammer source blob identity is preserved. The live site was independently requested, but the HTTP fetch tool could not retrieve it; therefore this record claims verified GitHub Pages deployment, not a separate browser/HTTP acceptance test.

The earlier `buzzbait.jpg` filename error remains a separate usability issue, FISH-TODO-063. Improve the editor's generated filename and explicit destination guidance without weakening safe-path/stable-ID requirements. No runtime editor changes were included in this image-only release. The full pre-closeout project records were preserved byte-for-byte in `History/2026-09-07-pre-image-closeout/`, and authoritative Context, TODO, Decision Log, README, PWA README and bootstrap were reconciled. No application release remains pending.
