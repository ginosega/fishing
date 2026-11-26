# Fishing Companion V3 — production application source

Production: https://fishing.ginosega.workers.dev/fishing/

This directory is the authoritative software source on `main`, not a deployed V2 website or a mirror of the live library. Cloudflare D1 stores Gear, Knowledge Base and Catch records and Markdown; private R2 stores original images; Cloudflare Images provides image transformations. The production Worker serves the static application and its public reading/owner-only authoring routes. Owner Save writes directly to D1/R2, not GitHub. Offline reading uses verified current-content snapshots; offline Save is blocked and supported text drafts are device-local.

## Directory layout

| Location | Purpose |
| --- | --- |
| `src/` | Browser application, editing, Notes, Picture Viewer, offline reading and service worker |
| `server/` | Production Worker, owner authentication, D1/R2 content/media operations and snapshot validation |
| `assets/`, `icon.png` | Static artwork and source icon |
| `contracts/` | Content validation schemas |
| `tools/` | Software build, verification and shared schema/validation helpers |
| `test/`, `playwright.config.mjs` | Automated regression and final release acceptance |
| `package.json`, `package-lock.json` | Node 24 commands and locked dependencies |
| `wrangler.jsonc` | Sole retained deployment configuration, for the permanent `fishing` Worker |
| `docs/` | Historical requirements, approval and implementation evidence, not current instructions |

The production D1/R2 resources intentionally retain their historical test names; do not infer that they are disposable. No physical Gear/KB/Catches content directories are maintained here. Logical content paths remain part of the application contract.

## Development and validation

Use Node.js 24, Git and the locked dependencies. From a clean checkout on Windows:

```powershell
Set-Location '<checkout>\pwa'
npm.cmd ci --no-audit --no-fund
npm.cmd test
$Revision = (git rev-parse HEAD).Trim()
npm.cmd run build -- --source-revision=$Revision
npm.cmd run verify
```

Generated software output defaults to `dist-v3-pilot` (historical build directory name; not a separate hosted environment). Do not commit generated output. [Software validation workflow](../.github/workflows/fishing-production.yml) runs fast checks for ordinary PRs and full release acceptance on manual dispatch before an approved production release. It does not deploy. A code or test change is not proof of a hosted deployment.

Production changes require separate approval, current exact-source/CI/provider verification and owner field acceptance under the [project router](../PROJECT_ROUTER.md). The production config is `wrangler.jsonc`; do not deploy retired private configs or reuse old migration procedures. No permanent parallel test environment is retained. Never share secret values or use old private deployment scripts.

## Maintenance and recovery

[Maintenance guide](../backups/README.md) is the current backup, retention and recovery authority. The GitHub-hosted maintenance workflow reuses the current snapshot validator from this directory. Live content changes do not require application-source edits. [Historical documentation](docs/README.md) and the [previous application README](https://github.com/ginosega/fishing/blob/e6d4bd77b2cae81da5383ce7fbf872a281420804/pwa/README.md) preserve earlier context, not current authority.
