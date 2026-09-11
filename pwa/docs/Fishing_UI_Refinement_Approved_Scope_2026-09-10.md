# Fishing Companion UI Refinement — Approved Scope

**Decision date:** September 10, 2026  
**Task:** FISH-TODO-084  
**Status:** IMPLEMENTED / LIVE / VERIFIED — FISH084 and FISH085 DONE

This document preserves the approved scope and the verified PR89 implementation and PR90 transparency/verifier correction. The user supplied the runtime icon directly in GitHub and explicitly authorized the complete coordinated PR, merge, deployment and hosted verification.

## Approved changes

1. **Application icon.** Use the supplied `pwa/revised-icon.png` fish/hook artwork with the exterior white border made transparent, as explicitly clarified and authorized on September 11. Preserve the green button, artwork and proportions. Current image hash and verification are recorded below.
2. **Catch Log cards.** Species remains first; move date to the second line directly under Species and render the date with normal, not bold, weight.
3. **Search placeholders.** General site rule: search inputs use `Search [page title]`, e.g. `Search My Gear`, `Search Lures`, `Search Knowledge Base`, `Search Gear Guides`.
4. **Post-copy Exit.** After Copy Changes on a Gear/KB Add or Edit page, show an `Exit` button. On edit, Exit returns to the original item page. On add, Exit returns to the originating Gear/KB page. This exit must not show the `Changes have not been saved...` warning.
5. **Self-describing copied package.** The clipboard text must place a plain-language instruction outside and above the JSON so a fresh ChatGPT chat knows how to process it. Intended instruction: `Fishing Companion change package: Please implement the JSON change package below in the ginosega/fishing repository, validate it against current main, carry it through PR/CI, merge, production deployment and hosted verification, and reconcile project records as appropriate.` The JSON itself remains valid `fishing-companion-change-v2`.
6. **Knowledge Base wording.** Main-page card subtext and KB page subtitle become `Fishing reference library`.
7. **Catch Log wording.** Main-page card subtext/page title string becomes `Recorded catches` with no period.
8. **Back buttons.** General site rule: remove the arrow glyph from Back buttons, retaining the `Back` label. This is intended to save horizontal space on mobile.

## Explicit exclusion

The earlier request to make KB Notes optional was withdrawn. Do **not** change KB Notes validation, schema or viewer behavior as part of FISH084. The user intends to add Notes to every KB item eventually and may use a placeholder string temporarily when authoring.

## FISH084/FISH085 production closeout — September 11, 2026

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The runtime uses the transparent-background edit of `pwa/revised-icon.png` (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

## Release discipline

Before implementation, restore actual latest `main`. Implement as one coordinated feature branch/PR where practical, update regression/browser tests as needed, use the normal full production acceptance pipeline, exact-current-main merge guard, Pages deployment and actual hosted verification, then reconcile current authority records. Do not claim any FISH084 item is live until hosted verification succeeds.
