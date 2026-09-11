# Fishing Companion production application

This directory contains the active v2 application, replacing the former root `v2/` folder and obsolete v1 PWA files. The site is published at https://ginosega.github.io/fishing/. Current layout/release evidence: [repository cleanup](docs/Repository_Cleanup_2026-09-10.md).

| Location | Purpose |
|---|---|
| `src/` | Browser application, editor, verified offline releases and service worker |
| `tools/` | Build, source validation and local/hosted verification |
| `test/` | Core integrity and Chromium/WebKit acceptance, including retained v1 stores |
| `contracts/` | Canonical domain schema |
| `migration/` | Original reconciliation/image approvals and current absent-picture decisions used by validation; no executable migration remains |
| `docs/` | Approved requirements, exact user feedback, technical references and historical release/recovery evidence |
| `revised-icon.png` | Exact user-uploaded runtime app, favicon and Apple touch icon |
| `icon.svg` | Historical icon, not included in new builds |
| `dist/` | Generated build, ignored by Git |

## Development and publication

Use Node24. From this directory run `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`. `.github/workflows/fishing-production.yml` runs both browser scopes, the actual archived-v1 worker transition, dependency audit, exact-current-main guard, serialized Pages deployment and actual hosted verification. Preview-scope fixtures are tests; there is no source dependency on an old preview directory. Documentation-only changes do not deploy.

Canonical content stays in repository-root `Gear/`, `KB/` and `Catches/`. The build reads those sources plus this directory. No production dependency remains on root `v2/`, `History/`, `Topics/` or the deleted v1 files. V1 recovery tests read the exact durable ZIP from checkpoint commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`.

## Add/Edit and file hygiene

Gear/KB Prepare Changes → Copy Changes produces a package for the Fishing project chat; it cannot write repository files directly. Normal implementation updates the canonical domain JSON and requested Markdown/pictures in domain category folders. It does not create per-item JavaScript helpers, one-off tests or release Markdown in the repository or PWA root. Do not add such scaffolding for routine content changes. Use the existing source-derived validation; update the existing project records when needed. Substantial application-release evidence belongs in `docs/`.

Older Dagger Axis, Cranberry Lake and Joyride helpers were v1 release scaffolding and are removed. Recovery and historical facts remain accessible through [pre-cleanup source](https://github.com/ginosega/fishing/tree/edca2a3f04fc8c32dec65b9330d43944be1a561c) and [v1 recovery](docs/Fishing_v2_Production_Release_2026-09-10.md).

## FISH084 production closeout — September 11, 2026

FISH-TODO-084's eight UI/authoring changes are implemented and live through the single PR89 production release: source `1f3f6df97390db186303148dcb5fa62ad0ba90e9`, release `7572c94504e4482c9987828b95a653f6`. [Production run 34565111477](https://github.com/ginosega/fishing/actions/runs/34565111477) passed all 20 core tests, 24 preview-scope and 26 production-scope Chromium/WebKit scenarios, the archived-v1 transition, Pages publication and exact comparisons of all 205 hosted files. Its subsequent hosted browser verifier failed on an ambiguous Yellow Perch heading: the page h1 and the new Catch-card h2 now share that text. The workflow is NOT green.

Direct cloud-browser follow-up verified the published home/KB/Catch wording, normal-weight dates below Species, page search, exact runtime icon references, Yellow Perch page/image viewer, Offline Ready for 203 files, real clipboard instruction plus valid JSON, Gear/KB Add Exit to the originating roots and KB Edit Exit to its original item without a warning. The original hosted verifier had already completed actual offline reload before reaching the ambiguous selector. No physical-device inspection or browser-originated repository writes are claimed.

FISH-TODO-085 tracks the permanent verifier-only selector correction (`level:1` for the Yellow Perch page-heading locator) and automated verification closeout. The user's one-PR/one-release instruction prevents silently adding a follow-up PR/release; that exception requires user direction. No second release was made.

The runtime uses the exact user-uploaded `pwa/revised-icon.png` (1,243,451 bytes, 1254 × 1254 PNG; SHA-256 `89a81bac58c460cdb6ccc509b6b240ac84937b619990c6ac9b187ddc4b75980c`). The older documentation reference is historical and was not substituted. The favicon, manifest and Apple touch icon use this image; complete offline release integrity includes it and older SVG-icon releases remain readable for recovery.

Catch card dates appear directly below Species at regular weight, including derived Catch History cards. Existing search inputs use `Search [page title]`; no new search inputs were added. Knowledge Base card/subtitle reads `Fishing reference library`; Catch Log home-card subtext and list-page heading read `Recorded catches`. Back buttons retain only `Back`.

After a successful Copy Changes, Exit returns edits to their original item and adds to their originating Gear/KB root or category. Exit alone bypasses the unsaved-changes warning. Further edits invalidate the prepared package and remove Exit; ordinary Back, Cancel, navigation and reload remain guarded. Copy text contains an explicit repository implementation/deployment instruction above valid `fishing-companion-change-v2` JSON; manual-copy fallback includes that same instruction. Preparing/copying is not saving. KB Notes remain required; its schema and viewer behavior are unchanged.
