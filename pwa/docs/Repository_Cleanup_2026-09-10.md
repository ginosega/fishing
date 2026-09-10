# Repository cleanup — September10, 2026

User request: remove obsolete root/history/v1 files, retain required PWA references under pwa, and prevent per-item edit scaffolding from accumulating.

## Dependency result and layout

Root `v2/` was the active production source, not merely a preview. The application, contracts, tests and validation have moved into `pwa/`; the old root directory is removed. The sole dependency on the former v1 `pwa/` was `icon.svg`, preserved byte-for-byte. No runtime/build dependency exists on History, Topics or the old v1 scripts/assets/data.

Root now keeps README, Context, TODO, Decision Log and bootstrap, plus production Gear/KB/Catches, pwa and workflow/config files. Approved specifications, verbatim user decisions/review feedback and PWA release/recovery references are under `pwa/docs/`. Original migration reconciliation, image-decision CSV and absent-media decisions remain under `pwa/migration/` because they support validation and accepted source evidence. One-time migration/reproduction scripts and their workspace manifest/dependency file are removed.

All former v1 runtime/data/assets, per-item Dagger Axis/Cranberry Lake/Joyride helpers, root History/Topics, obsolete registries and dated root handoffs are removed from main. They remain in [pre-cleanup source](https://github.com/ginosega/fishing/tree/edca2a3f04fc8c32dec65b9330d43944be1a561c), also named `checkpoint/pre-repo-cleanup-20260910`. The original v1 rollback ZIPs remain at checkpoint commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`; actual-v1 cutover tests continue to use them. No browser stores or canonical Gear/KB/Catch files are removed or modified. The new unreferenced `pflueger-president-spincast-rod.png` uploaded directly on main is preserved without automatic adoption.

## File hygiene

Add/Edit creates a copyable change package. It does not write repository files or generate helper scripts/release records. Routine promotion updates canonical JSON and requested Markdown/picture files, plus existing authoritative project records as appropriate. Do not create one-off per-item scripts/tests/release documents in root or pwa; reusable validation belongs in tools/test and substantial application release records in docs.

## Validation and publication

Local source validation, 20 core tests and production build/byte verification pass. The unchanged runtime still contains 69 Gear, 54 KB and5 Catches and195 manifest assets. Full Chromium/WebKit acceptance and actual hosted verification are required before cleanup closeout. All original browser/offline/integrity assertions remain; no tests were removed from the active suite. The workflow uses the new paths and excludes docs-only edits from publication.
