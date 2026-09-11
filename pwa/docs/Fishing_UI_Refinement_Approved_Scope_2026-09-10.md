# Fishing Companion UI Refinement — Approved Scope

**Decision date:** September 10, 2026  
**Task:** FISH-TODO-084  
**Status:** APPROVED / NOT YET IMPLEMENTED

This document preserves the exact scope agreed in Chat before implementation. It is a requirements/reference record only and is not evidence that any runtime change has been deployed. Implement the batch as one coordinated feature PR/release in Chat mode unless a genuinely Work-only capability is encountered and separately approved.

## Approved changes

1. **Application icon.** Replace the current runtime icon with the user-approved fish-and-hook design. The signed-off reference is [`assets/Fishing_Companion_Approved_Icon_2026-09-10.png`](assets/Fishing_Companion_Approved_Icon_2026-09-10.png), SHA-256 `3245b6768ce1952e5f47d13d1d662de57240e1bf53bcb961643e09328065efab`, 64,790 bytes. It was recolored to complement the actual production CSS dark palette: `#101b18`, `#172722`, `#203b34`, `#344940`, `#80c9b5`, `#247c6d`, `#e4ede8`, `#a2b5aa`. The reference asset under `pwa/docs/` is documentation only; do not treat its presence as runtime icon implementation.
2. **Catch Log cards.** Species remains first; move date to the second line directly under Species and render the date with normal, not bold, weight.
3. **Search placeholders.** General site rule: search inputs use `Search [page title]`, e.g. `Search My Gear`, `Search Lures`, `Search Knowledge Base`, `Search Gear Guides`.
4. **Post-copy Exit.** After Copy Changes on a Gear/KB Add or Edit page, show an `Exit` button. On edit, Exit returns to the original item page. On add, Exit returns to the originating Gear/KB page. This exit must not show the `Changes have not been saved...` warning.
5. **Self-describing copied package.** The clipboard text must place a plain-language instruction outside and above the JSON so a fresh ChatGPT chat knows how to process it. Intended instruction: `Fishing Companion change package: Please implement the JSON change package below in the ginosega/fishing repository, validate it against current main, carry it through PR/CI, merge, production deployment and hosted verification, and reconcile project records as appropriate.` The JSON itself remains valid `fishing-companion-change-v2`.
6. **Knowledge Base wording.** Main-page card subtext and KB page subtitle become `Fishing reference library`.
7. **Catch Log wording.** Main-page card subtext/page title string becomes `Recorded catches` with no period.
8. **Back buttons.** General site rule: remove the arrow glyph from Back buttons, retaining the `Back` label. This is intended to save horizontal space on mobile.

## Explicit exclusion

The earlier request to make KB Notes optional was withdrawn. Do **not** change KB Notes validation, schema or viewer behavior as part of FISH084. The user intends to add Notes to every KB item eventually and may use a placeholder string temporarily when authoring.

## Release discipline

Before implementation, restore actual latest `main`. Implement as one coordinated feature branch/PR where practical, update regression/browser tests as needed, use the normal full production acceptance pipeline, exact-current-main merge guard, Pages deployment and actual hosted verification, then reconcile current authority records. Do not claim any FISH084 item is live until hosted verification succeeds.
