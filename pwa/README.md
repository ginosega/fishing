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
| `icon.svg` | Preserved application icon |
| `dist/` | Generated build, ignored by Git |

## Development and publication

Use Node24. From this directory run `npm ci`, `npm test`, `npm run build -- --base=/fishing/`, `npm run verify`. `.github/workflows/fishing-production.yml` runs both browser scopes, the actual archived-v1 worker transition, dependency audit, exact-current-main guard, serialized Pages deployment and actual hosted verification. Preview-scope fixtures are tests; there is no source dependency on an old preview directory. Documentation-only changes do not deploy.

Canonical content stays in repository-root `Gear/`, `KB/` and `Catches/`. The build reads those sources plus this directory. No production dependency remains on root `v2/`, `History/`, `Topics/` or the deleted v1 files. V1 recovery tests read the exact durable ZIP from checkpoint commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`.

## Add/Edit and file hygiene

Gear/KB Prepare Changes → Copy Changes produces a package for the Fishing project chat; it cannot write repository files directly. Normal implementation updates the canonical domain JSON and requested Markdown/pictures in domain category folders. It does not create per-item JavaScript helpers, one-off tests or release Markdown in the repository or PWA root. Do not add such scaffolding for routine content changes. Use the existing source-derived validation; update the existing project records when needed. Substantial application-release evidence belongs in `docs/`.

Older Dagger Axis, Cranberry Lake and Joyride helpers were v1 release scaffolding and are removed. Recovery and historical facts remain accessible through [pre-cleanup source](https://github.com/ginosega/fishing/tree/edca2a3f04fc8c32dec65b9330d43944be1a561c) and [v1 recovery](docs/Fishing_v2_Production_Release_2026-09-10.md).
