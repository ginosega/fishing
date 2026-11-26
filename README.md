# Fishing

Fishing Companion V3 is the production progressive web application (PWA) for Gear, Knowledge Base and Catches, with authenticated owner editing and verified offline reading on Windows and Android.

**Production:** https://fishing.ginosega.workers.dev/fishing/

## Current authority

- [Project router](PROJECT_ROUTER.md): first entry point for current project state and approved operating rules on the canonical governance branch.
- [Standard new-chat prompt](NEW_CHAT_PROMPT.md): use unchanged for project recovery and handoff.
- [Application source and development guide](pwa/README.md).
- [Maintenance and recovery guide](backups/README.md), [orphan cleanup prompt](backups/ORPHAN_CLEANUP_PROMPT.md), [maintenance workflow](https://github.com/ginosega/fishing/actions/workflows/fishing-maintenance.yml), [maintenance reports](https://github.com/ginosega/fishing/issues/593) and [recovery archives](https://github.com/ginosega/fishing/releases).

GitHub holds software, governance, maintenance tooling and approved public recovery backups. Cloudflare D1 holds live records/Markdown and R2 holds originals; edits are saved directly by the owner in the application. GitHub Pages V2 and the private V3 test sites are retired. There is no per-edit GitHub publication pathway.

GitHub Actions validates software; production deployment remains a separately approved owner-operated action. The hosted maintenance workflow supports automatic monthly backups and orphan audits and manual complete/audit-only execution. No automated orphan deletion.

## Historical evidence

The old root context, TODO, decision log and bootstrap files are frozen historical records, not current routing or authorization. The [previous root README](https://github.com/ginosega/fishing/blob/e6d4bd77b2cae81da5383ce7fbf872a281420804/README.md) and [historical application documentation](pwa/docs/README.md) retain the original milestone evidence. Use the canonical router instead of following old deployment commands.
