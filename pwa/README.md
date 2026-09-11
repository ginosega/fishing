# Fishing Companion production application

## Current production and repository-layout state — September 11, 2026

Current deployed production source is `32759b83305e1dbb3818b676accb0aee3961ddf7`, release `a81d35da0db7b000ed031c17a9387de3`, fully verified by [production run 34645325275](https://github.com/ginosega/fishing/actions/runs/34645325275) after FISH094/[PR99](https://github.com/ginosega/fishing/pull/99). The complete source/core, Chromium/WebKit preview and production scopes, archived-v1 cutover, exact-current-main Pages deployment, hosted-byte and hosted-browser gates passed; hosted verification reported 210 v2 files.

FISH090/[PR95](https://github.com/ginosega/fishing/pull/95) is DONE: Edit Gear can create the first link when `links` is absent, and canonical `pwa/icon.png` now contains the exact user-uploaded replacement bytes (1,541,464 bytes; 1254×1254 RGBA; SHA-256 `055cea4acde10ac18a74cc0a42f03a03190ea4a12df17acc0d5808a1637b822a`). FISH091/[draft PR96](https://github.com/ginosega/fishing/pull/96) remains requirements-only, WAITING ON USER and unimplemented; do not infer authorization for online-only-default runtime/service-worker work.

FISH092/[PR97](https://github.com/ginosega/fishing/pull/97) made `content/` and `assets/` durable across all KB categories and documented the convention in `KB/README.md`. FISH093/[PR98](https://github.com/ginosega/fishing/pull/98) made `assets/` and `content/` durable across all Gear categories and documented the convention in `Gear/README.md`. FISH094/[PR99](https://github.com/ginosega/fishing/pull/99) applied only the validated Trout Fishing record change: description `Casting, bank-fishing, still-fishing, and kayak-trolling guidance`, picture `KB/Techniques/assets/Trout Fishing.png`, no invented caption and Notes unchanged. The existing PNG was preserved exactly (1,867,783 bytes; SHA-256 `7f883a4d7d6bbc5dfba152414ac81513f5bac8c896648769349e85bebd220306`).

FISH077/P2 remains DEFERRED. FISH090 and FISH092–094 are DONE; FISH091 remains unimplemented pending requirements signoff. Next unused canonical task ID is FISH-TODO-095. Documentation-only reconciliation does not republish the application.

## FISH087 KB authoring batch production closeout — September 11, 2026

FISH-TODO-087 is DONE through [PR92](https://github.com/ginosega/fishing/pull/92). Verified production source `dee0ff76f6b15e861fa8864151aad88c8fe28f5e`, release `40c849b4014013f22200843c9d222c2c`, passed [production run 34614884273](https://github.com/ginosega/fishing/actions/runs/34614884273): full validation, archived-v1 cutover acceptance, exact-current-main Pages deployment, all 205 hosted-file comparisons and hosted browser verification.

PR92 was a routine canonical-content authoring release plus one regression expectation aligned with intentional Species description removal. It did not alter the application architecture, schema, picture model, authoring workflow or P2 boundary. The restored `KB/Locations/content/lake-bosworth.md` is included in the verified deployed release. FISH077/P2 remains deferred; next unused canonical task ID is FISH-TODO-088. Documentation-only reconciliation after this release does not republish the application.

## Icon filename cleanup and current state — September 11, 2026

FISH-TODO-086 is DONE through [PR91](https://github.com/ginosega/fishing/pull/91). Current production source `afd7afc9ee91fb3dc81a15635e14ec932bda2b1b`, release `11789b7bace383d161add0ac7d313579`, passed [production run 34608018650](https://github.com/ginosega/fishing/actions/runs/34608018650): 21 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and complete hosted browser verification.

The approved transparent PNG is now `pwa/icon.png`; its bytes are unchanged (SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The obsolete `pwa/icon.svg` and former `pwa/revised-icon.png` paths are removed from current source. New builds use `icon.png` for the manifest, favicon and Apple touch icon. Historical filenames remain accepted only by release validation and compatibility tests so retained cached releases stay readable. Git history retains both removed paths. Canonical Gear/KB/Catch files are unchanged.

FISH084, FISH085 and FISH086 are complete; PR89–PR91 are merged and no release or icon work remains pending. P2/FISH077 remains deferred, all unrelated backlog is retained, and next unused task ID is FISH-TODO-087. Continue in Chat using actual latest main. This documentation reconciliation does not redeploy.

This directory contains the active v2 application, replacing the former root `v2/` folder and obsolete v1 PWA files. The site is published at https://ginosega.github.io/fishing/. Current layout/release evidence: [repository cleanup](docs/Repository_Cleanup_2026-09-10.md).

| Location | Purpose |
|---|---|
| `src/` | Browser application, editor, verified offline releases and service worker |
| `tools/` | Build, source validation and local/hosted verification |
| `test/` | Core integrity and Chromium/WebKit acceptance, including retained v1 stores |
| `contracts/` | Canonical domain schema |
| `migration/` | Original reconciliation/image approvals and historical accepted-absence decisions used by validation; no executable migration remains |
| `docs/` | Approved requirements, exact user feedback, technical references and historical release/recovery evidence |
| `icon.png` | User-supplied fish/hook artwork with the authorized transparent exterior; runtime app, favicon and Apple touch icon |
| `dist/` | Generated build, ignored by Git |

## Development and publication

Use Node24. From this directory run `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`. `.github/workflows/fishing-production.yml` runs both browser scopes, the actual archived-v1 worker transition, dependency audit, exact-current-main guard, serialized Pages deployment and actual hosted verification. Preview-scope fixtures are tests; there is no source dependency on an old preview directory. Documentation-only changes do not deploy.

Canonical content stays in repository-root `Gear/`, `KB/` and `Catches/`. The build reads those sources plus this directory. No production dependency remains on root `v2/`, `History/`, `Topics/` or the deleted v1 files. V1 recovery tests read the exact durable ZIP from checkpoint commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`.

## Add/Edit and file hygiene

Gear/KB Prepare Changes → Copy Changes produces a package for the Fishing project chat; it cannot write repository files directly. Normal implementation updates the canonical domain JSON and requested Markdown/pictures in domain category folders. It does not create per-item JavaScript helpers, one-off tests or release Markdown in the repository or PWA root. Do not add such scaffolding for routine content changes. Use the existing source-derived validation; update the existing project records when needed. Substantial application-release evidence belongs in `docs/`.

Older Dagger Axis, Cranberry Lake and Joyride helpers were v1 release scaffolding and are removed. Recovery and historical facts remain accessible through [pre-cleanup source](https://github.com/ginosega/fishing/tree/edca2a3f04fc8c32dec65b9330d43944be1a561c) and [v1 recovery](docs/Fishing_v2_Production_Release_2026-09-10.md).

## PR89/PR90 production closeout — historical release evidence

FISH-TODO-084 and FISH-TODO-085 are DONE. The eight UI/authoring refinements from PR89 and the user-authorized icon transparency/verifier correction in [PR90](https://github.com/ginosega/fishing/pull/90) are live at production source `240dbfa67a1810ef51fde24f7bd0fb1d1c867bcf`, release `c15f12f49c4162706fb14eb2791e3204`. [Production run 34566907478](https://github.com/ginosega/fishing/actions/runs/34566907478) is green: 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, archived-v1 worker/store transition, exact-current-main Pages deployment, all 205 hosted-file comparisons and the complete hosted browser verifier passed. PR90 CI [run 34566584530](https://github.com/ginosega/fishing/actions/runs/34566584530) also passed.

Historical PR89 evidence: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`, [run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) published successfully and compared all 205 hosted files, but its browser verifier failed because Yellow Perch matched both the page h1 and a Catch History h2. That historical run remains failed; PR90 repairs the selector with `level:1` and completes a new fully verified release.

Historical PR89 direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

The user explicitly authorized the follow-up PR/release and clarified: “The white border surrounding the green button image should be transparent.” This supersedes the earlier one-PR limit for this correction. No further icon transfer or approval is pending.

The PR90 runtime used the transparent-background edit of `pwa/revised-icon.png` (renamed without byte changes to `pwa/icon.png` in PR91) (1,208,529 bytes, 1254 × 1254 RGBA PNG; SHA-256 `e46bcb2260f550380c4df2a42d512bbcd19b24dbf9e987815a0070afd350b922`). The built-in image editor was instructed to remove only the exterior white background and preserve the green button and fish/hook artwork. Alpha inspection and browser regressions verify transparent exterior pixels, retained center opacity, source-derived dimensions and exact served bytes. The original opaque upload remains recoverable in PR89 history (SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). Favicon, manifest and Apple touch icon all use the corrected PNG; offline integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.

## Historical Chat handoff audit — before icon filename cleanup

Production and all hosted checks remain green at the release recorded above; FISH084/FISH085 are complete. This handoff changes documentation only. Current continuation and Chat-default policy: [Context](../Fishing_Context.md) and [bootstrap](../Fishing_New_Chat_Bootstrap_Prompt.md).