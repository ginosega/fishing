# Fishing Companion UI Refinement — Approved Scope

**Decision date:** September 10, 2026  
**Task:** FISH-TODO-084  
**Status:** IMPLEMENTED / LIVE — automated verifier follow-up FISH085 open

This document preserves the approved scope and the verified PR89 implementation. The user supplied the runtime icon directly in GitHub and explicitly authorized the complete coordinated PR, merge, deployment and hosted verification.

## Approved changes

1. **Application icon.** Use the exact user-uploaded `pwa/revised-icon.png`, SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`, 1,243,451 bytes, 1254 × 1254. This latest explicit instruction supersedes the older documentation-only reference. Preserve its artwork and proportions.
2. **Catch Log cards.** Species remains first; move date to the second line directly under Species and render the date with normal, not bold, weight.
3. **Search placeholders.** General site rule: search inputs use `Search [page title]`, e.g. `Search My Gear`, `Search Lures`, `Search Knowledge Base`, `Search Gear Guides`.
4. **Post-copy Exit.** After Copy Changes on a Gear/KB Add or Edit page, show an `Exit` button. On edit, Exit returns to the original item page. On add, Exit returns to the originating Gear/KB page. This exit must not show the `Changes have not been saved...` warning.
5. **Self-describing copied package.** The clipboard text must place a plain-language instruction outside and above the JSON so a fresh ChatGPT chat knows how to process it. Intended instruction: `Fishing Companion change package: Please implement the JSON change package below in the ginosega/fishing repository, validate it against current main, carry it through PR/CI, merge, production deployment and hosted verification, and reconcile project records as appropriate.` The JSON itself remains valid `fishing-companion-change-v2`.
6. **Knowledge Base wording.** Main-page card subtext and KB page subtitle become `Fishing reference library`.
7. **Catch Log wording.** Main-page card subtext/page title string becomes `Recorded catches` with no period.
8. **Back buttons.** General site rule: remove the arrow glyph from Back buttons, retaining the `Back` label. This is intended to save horizontal space on mobile.

## Explicit exclusion

The earlier request to make KB Notes optional was withdrawn. Do **not** change KB Notes validation, schema or viewer behavior as part of FISH084. The user intends to add Notes to every KB item eventually and may use a placeholder string temporarily when authoring.

## FISH084 production closeout — September 11, 2026

FISH-TODO-084's eight UI/authoring changes are implemented and live through the single PR89 production release: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`. [Production run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) passed all 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, the archived-v1 transition, Pages publication and exact comparisons of all 205 hosted files. Its subsequent hosted browser verifier failed on an ambiguous Yellow Perch heading: the page h1 and the new Catch-card h2 now share that text. The workflow is NOT green.

Direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

FISH-TODO-085 tracks the permanent verifier-only selector correction (`level:1` for the Yellow Perch page-heading locator) and automated verification closeout. The user's one-PR/one-release instruction prevents silently adding a follow-up PR/release; that exception requires user direction. No second release was made.

The runtime uses the exact user-uploaded `pwa/revised-icon.png` (1,243,451 bytes, 1254 × 1254 PNG; SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). The older documentation reference is historical and was not substituted. The favicon, manifest and Apple touch icon use this image; complete offline release integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

## Release discipline

Before implementation, restore actual latest `main`. Implement as one coordinated feature branch/PR where practical, update regression/browser tests as needed, use the normal full production acceptance pipeline, exact-current-main merge guard, Pages deployment and actual hosted verification, then reconcile current authority records. Do not claim any FISH084 item is live until hosted verification succeeds.
