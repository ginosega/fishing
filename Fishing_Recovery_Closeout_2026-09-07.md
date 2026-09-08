# Fishing Companion — Recovery closeout, September 7, 2026

**Status: Application recovery deployed; documentation closeout in progress.** This is the authoritative recovery record and supersedes older release-status statements. The September 6 handoff and earlier failed-chat checkpoints are historical, not pending work.

## Failure and repair

Current main at the start of recovery was `f7ef47aec0e8a62ea27fd87ab1627d13aa2e6df0`. Production workflow #258 / `34182440715` failed at `pwa/final-content.test.mjs`: an exact equality assertion still expected the original four-line Bonafide RVR119 Notes. The user had legitimately expanded that Markdown with accessories, prices, resources and warranty information. All preceding model, routing, authoring and media tests passed; the build and deployment were skipped. The prior production run #257 failed for the same stale-content class. This was a test/content contract failure, not evidence of a schema migration or a newly broken application runtime.

PR #50 repaired the assertion by checking the original durable facts without freezing the entire authored document. Regression fixtures accept both the original and expanded Notes. All other permanent tests remain intact. The completed audit branch `docs/full-reconciliation-2026-09-07` was incorporated with its history as a merge parent. Its architecture and release-document corrections, including the schema4 diagnostic wording, were retained; the temporary audit-export workflow was excluded. The latest main user edits were preserved, including the expanded Bonafide Markdown and the Z-Man Jack Hammer and Buzzbait image uploads. No data migration, image replacement or new ownership attribution was performed.

## Verified release evidence

- PR: https://github.com/ginosega/fishing/pull/50
- PR head: `6b5f9221803c265a78c5d4f391813c9517a9ebc0`
- Normal PR CI: #259 / `34184091548`, all permanent tests, build, authored Notes/media materialization and final-bundle verification succeeded.
- Merge: `fcf28f34b89f68c22e8a2200e8410509801ff801`.
- Production: #260 / `34184126036`, build and actual Deploy to GitHub Pages step succeeded.
- Production URL: https://ginosega.github.io/fishing/

The GitHub Actions deployment is verified. A separate independent HTTP fetch of the live site was unavailable in the available tools; do not describe it as having been performed. User device/browser acceptance is a normal follow-up, not a condition for recognizing the successful release. The latest application-feature release remains PR48; PR50 is the latest recovery/maintenance release.

## Preservation and architecture

The accepted baseline remains Gear schema4 / 64 records, KB schema1 / 54 entities, and Catch schema2 / five historical records. Structured facts, stable IDs, authored Markdown, exact relationships, media ownership/provenance and source image bytes are preserved. `gear://` and `kb://` links are authored navigation, not speculative relationship graphs. No Planner, sessions, multi-user expansion, duplicate local database or one-time migration was introduced.

The full pre-recovery documentation is preserved byte-for-byte in `History/2026-09-07-pre-recovery/` and in Git history at the PR50 merge. Current root records are concise authoritative summaries; the archived copies are historical evidence, not competing current state. All unresolved backlog items are retained in the current TODO, and completed history is available in the archive. No user-authored runtime content was removed or rewritten for this documentation cleanup.

## Durable process and remaining work

Treat an authorized change as one end-to-end transaction through implementation, tests, PR/CI, expected-head merge, production verification, cleanup and authoritative-record reconciliation. Progress reports are not approval gates. Read current main before acting; preserve new user edits; avoid concurrent Pages releases and direct-main content writes. Never bypass denied permissions or remove required permanent checks. No temporary migration or audit workflow should be left in main.

FISH-TODO-061 records this recovery and is DONE upon documentation closeout. Existing backlog items remain open at their prior statuses. KB editor user acceptance and new requested features may proceed from current main. The original audit branch is preserved as historical provenance; the temporary recovery and documentation branches may be removed after successful merge and verification. Do not treat them as pending feature work.
