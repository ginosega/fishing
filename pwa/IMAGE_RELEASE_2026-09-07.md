# Buzzbait and Jack Hammer image release

Status: IN PROGRESS. See the final closeout below for CI and deployment evidence.

## Scope and source preservation

The authorized handoffs add the representative picture for KB `technique-buzzbait` and replace the picture for owned Gear `zman-jack-hammer`. No article, Gear facts, Notes, identities, ownership mapping, taxonomy, or historical Catch data are changed.

The existing user-uploaded Buzzbait source `pwa/assets/kb/equipment/technique-buzzbait.jpg` is preserved. The approved handoff destination `pwa/assets/kb/entries/technique-buzzbait.jpg` is an exact Git-blob copy of `7abd3259ddb1d813d9282eed4400e3f0b39897bc` (137372 bytes). The representative picture uses the supplied alt, caption and Amazon source URL. The KB source index remains unchanged: this is a media-only promotion through the existing source/derived picture overlay. Its source schema/data version and all 54 entities remain stable. The validated handoff's original article Markdown is identical to the current source and is not rewritten.

The Jack Hammer source is `pwa/assets/gear-source/zman-jack-hammer.png`, blob `20c4bf7be24755dc37e3de558d75a7085d189df0` (2787253 bytes). Its existing media ID and exact Gear owner are retained. The new local-source registration uses the original manufacturer destination and its descriptive alt. The previous image source `https://i.ebayimg.com/images/g/MKoAAeSwO1hpsd4D/s-l500.png` is retained here as historical provenance. The original `media-sources.json` record is unchanged. The old image is not deleted; the source bytes are copied without recompression by the normal build.

## Verification and release

The permanent source/model/authoring/media tests, local-media materialization and final transformed-bundle validation are required. Production must be verified through the actual GitHub Pages deployment step. Do not describe browser acceptance or independent HTTP verification as completed unless actually performed. The authoring filename usability feedback remains a separate follow-up; no editor runtime changes are included in this two-picture release.
