# FISH118 P3-0 — Real source-aware candidate validation integration

**Date:** October 22, 2026  
**Approval scope:** Owner approved the P3 staged implementation proposal and said to continue. This is **source-only code plus unit/integration tests** on [draft PR #263](https://github.com/ginosega/fishing/pull/263). **No new Worker/D1, no GitHub sandbox or App write privileges, no merging, no production change.**

## What changed

- **Real canonical promoter:** [`src/source-aware.mjs`](src/source-aware.mjs) calls the canonical `pwa/src/handoff.mjs` `validatePackage` + `promoteChange({conflictPolicy:'review'})`. It starts with a server-trusted checkout root and asserted current `mainSha`, selects the current record and Markdown from that root, preserves unrelated current fields, and returns `CONFLICT` when a modified base field or narrative no longer matches.
- **Full candidate inventory:** It creates a **temporary copy** of the trusted PWA source, stages the single candidate content bundle/Markdown/media changes there, and runs the existing `pwa/tools/library.mjs` `inventorySource({pendingMedia:false})`. That canonical validator includes Ajv bundle/schema semantics, references/Markdown/path collision checks, and actual image decoding/verification using Sharp. No source files in the trusted checkout are rewritten; temporary source copy is cleaned up.
- **Media guard:** Source metadata for each added/replaced picture/sequence asset must match the submitted bytes/length/SHA-256; only declared files are staged; a picture action `add` cannot overwrite an existing source asset. The real canonical inventory rejects malformed image bytes/format and broken references.
- **Root containment:** Current Markdown is read using `fileUnder` with realpath/symlink containment rather than a blind `fs.readFile`.
- **End-to-end mock bridge:** The existing P3 broker accepts this adapter as its required `sourceAware.promote` dependency. The integration test verifies that a simulated GitHub PR is not created until the real validator returns a fully checked candidate.
- **Tests:** Added [`pwa/test/p3-source-aware.test.mjs`](../../pwa/test/p3-source-aware.test.mjs), nine scenarios: preserve concurrent unrelated field, reject colliding field edits, taxonomy/schema denial, reject missing KB Markdown resource, accept valid KB Add, reject media without metadata, reject narrative overwrite, reject malformed trusted source identity, and exercise broker-to-validator-to-fake-PR flow.

## Test status and distinction

The **original 16 isolated mock-broker tests passed previously**, with exact source blob verification recorded in [P3-0 report](P3_0_Mock_Publishing_Implementation_Report_2026-10-22.md).

**The nine newly added integration tests are NOT yet recorded as PASS in this document.** GitHub pull-request [full validation](https://github.com/ginosega/fishing/pull/263/checks) was triggered by source changes and must complete before integration sign-off. Node 24 and locked `pwa` dependencies are needed because the canonical inventory imports `ajv`, `markdown-it`, `dompurify` and the native `sharp` decoder, which are not installed in the isolated local tool container. Check GitHub workflow results and fix any concrete failures before finalizing this stage. The exact current branch source and checks, not an older chat claim, control outcomes.

## Important architecture limitation (NOT a hosted publishing service)

The adapter is **Node.js code using filesystem APIs and native Sharp**. It does **not** run inside a Cloudflare Worker as-is. The planned Cloudflare service must enforce server-owned authentication, allowlists, CSRF, request/media bounds and source-conflict control; a trusted Node.js CI/validation step must still perform the full canonical image and library inventory **before permitting an automated merge**. An exact SHA-linked PR/check/merge protocol and preview deployment are still required. This is deliberately a *reusable validator contract and test reference*, not a deployable Worker implementation.

Other pre-privilege gaps remain: real GitHub source checkout must be tied to the fetched commit SHA; no ability to forge the checkout root from browser input; prevent overwriting an image shared by unrelated articles; enforce canonical picture ownership and source paths; real D1 durable CAS/leases/recovery; GitHub App installation token scope; exact checks/branch-rule enforcement; operational failure/restart and hosted release identity tests.

**Next separately gated phase:** design and approval for the protected Cloudflare Free preview Worker/D1 and a disposable sandbox repository with precise GitHub App Contents/PR permissions. No actual infrastructure or permissions have been requested or modified by this source-only integration.

**Disposition:** P3-0 source-aware adapter **implemented, full PR validation pending**. Both [AUTH-P0 draft PR #262](https://github.com/ginosega/fishing/pull/262) and [P3 draft PR #263](https://github.com/ginosega/fishing/pull/263) remain unmerged. Canonical production PWA is unchanged.
