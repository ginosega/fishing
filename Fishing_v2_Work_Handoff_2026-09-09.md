# Fishing Companion v2 — Work Handoff

**Checkpoint:** September 9, 2026, Pacific time. This is the durable source-backed continuation record for the user-authorized temporary Work session. It is not a completed v2 acceptance or production-release certificate. Restore current GitHub state before acting; the identifiers below are dated evidence, not instructions to reset newer work.

## Repository and release state

The durable repository is `ginosega/fishing`. Main at the engineering checkpoint was `79f36144abad39a9515b8f2d7710852f1c7e7114`. The implementation branch is `feature/v2-implementation-20260908`, observed head `24f57ca7d72a9751e0935c6eb46e842f61493db2`. Draft PR 64 is open and unmerged. The successful migration commit is `6615ae7296e48d90dceab303b6b5a1fbc041ab80`. No runtime fixes were committed after the failed browser run during this handoff session. The documentation branch is `docs/v2-work-handoff-20260909`; the new Work session must fetch its latest state and integrate the reconciled documentation without overwriting newer work.

The existing production application remains at https://ginosega.github.io/fishing/. The last verified v1 production build is run #312, `34237232075`, source `4f2fe70f47da9cca3704722de87f7282bcc00f83`. The intended v2 preview is `/fishing/v2-preview/`; it has not been published or accepted. The user has authorized the isolated preview, not production cutover or P2 features.

## Verified migration and source preservation

Migration run `34328748390` succeeded on September 9, 2026. It preserves 66 source Gear records as 69 destination records through the approved three-to-six rod/reel split, all 54 KB entries, all five Catches, original authored Markdown bytes, unaffected identities, measurements and actual relationships. The canonical destination SHA-256 values are:

| File | SHA-256 |
|---|---|
| `Gear/gear.json` | `e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256` |
| `KB/kb.json` | `85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4` |
| `Catches/catches.json` | `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b` |

The source is pinned to `79f36144abad39a9515b8f2d7710852f1c7e7114`, archive source `4f2fe70f47da9cca3704722de87f7282bcc00f83`. The full machine evidence is `v2/migration/reconciliation.json`, with `v2/migration/reproduce.py`, `v2/migration/image-decisions.csv`, and the original migration workflow. Do not rerun the one-time migration merely to resume work. A justified current-source refresh must preserve destination edits and reconcile each intentional difference.

The user approved 49 of 51 archived image captures for exact-byte adoption and rejected two. Eight exceptions remain: malformed Tsuridamashii snap-swivels; absent Rapala Original Floating F-3; remote KB pictures for Perch, Popper and Whopper Plopper; rejected Mack's Pee Wee Hoochie and River2Sea Whopper Plopper 60 captures; and one optional generic inline-spinner picture. Seven are required and one optional. The committed report erroneously marks Rapala optional, producing six pending flags; correct its classification and regression checks. No automatic image acquisition or invented replacement is authorized. The rejected capture hashes are `562c1081c6407a306fb8dfd3f1bbed39d39586b4855bc68117689a8c2fb3924f` and `0a62d3625752927423ac1d3d4867d6d9887dbe0ad98a4df36e9c2babb15810ac`. Six KB pictures reuse Gear files; the unused invalid Kokanee WebP was excluded in favor of the valid PNG.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this baseline. No device inspection was performed. Retain old browser stores and reconcile newly discovered local-only data before retirement. The original approved requirements and fourteen Design Review decisions remain unchanged.

## Implementation and browser acceptance

The feature contains the Node 24/ESM application, three independent domain contracts, strict validation, source-aware Gear/KB handoffs, Markdown sanitizer, image validation/viewer, deterministic builder/verifier, versioned offline service worker, migration tooling and Playwright suite. The lockfile pins Ajv 8.20.0, DOMPurify 3.4.15, markdown-it 15.0.1, esbuild 0.28.2, sharp 0.35.4 and Playwright 1.62.0. Hosted CI passed all 15 core tests, production dependency audit with zero vulnerabilities, and full build verification.

The first hosted browser acceptance run `34330339245` failed with two of six tests passing. Its job ID is `102397189100`, tested PR merge commit `3b68d951b19f1c51e16c9d6b427ae884168bb5f9`. The successful scenarios are complete-library installation/hash verification/offline reload and mobile layout/isolated worker scope. The four failures are:

1. Navigation/viewer test timed out on a button named `Zoom in`. The implementation uses visible `+` text and a title; correct accessible naming or the test selector without weakening viewer coverage.
2. Editor test uses a broad `#app h1` selector matching both `Edit entry` and `Edit Daiwa Tatula XT`. Use a precise page-heading selector and preserve the actual authoring assertions.
3. Corrupt-update recovery reached the reload step but continued to report the old release ID rather than the new complete release. Investigate pointer selection, activation, cache versioning and actual update semantics. This is not established as a mere selector issue.
4. Tampered cached content was rejected, but the repaired article did not reappear in the expected state after restoring connectivity. Investigate retry/navigation state, verified network repair and cached failure handling; do not simply remove the assertion.

The browser suite is `v2/test/browser.spec.mjs`, config `v2/playwright.config.mjs`. Inspect the full source and current implementations of `v2/src/sw.mjs`, `loader.js`, `offline.mjs`, `ui.mjs`, `editor.mjs`, `viewer.mjs` and release validation. Known review points include preserving the last complete cache until replacement is committed, validating complete cache bytes rather than trusting a marker alone, selecting an actually verified release consistently across pointer/manifest/code/content, retaining immutable older URLs for open tabs, safe recovery from cache corruption, and avoiding stale asynchronous editor state. Treat these as investigation leads, not proven conclusions. The browser fixture should preserve the migration reconciliation when building its second release, correctly handle unsaved-form dialogs, use precise accessible selectors, and retry a failed article through a real navigation/reload path. Keep meaningful tests strict.

The failed-run artifact `10095686186` contains only release metadata because `.test-output` was excluded as a hidden directory. Update artifact upload to include hidden files so screenshots, videos, traces and HTML reports are retained. The complete job log remains available through GitHub Actions. The evidence artifact expires October 9, 2026. Fix the evidence capture before the next hosted run.

## Exact next engineering sequence

Restore current main and feature branch, inspect PR 64 and all newer commits, and reconcile the documentation branch. Do not restart the vertical slice or regenerate source records. Correct the media classification and test defects, then implement and verify the release-upgrade/retry fixes. Add regression coverage for complete-cache rollback, corruption rejection/repair, pinned old-release reads, dirty-form protection, and no code/data mixing. Run the full core/build/browser gate and inspect the actual results. Do not claim acceptance from a passing build alone.

Once the gate passes, reconcile current main and production source, preserve a recoverable v1 root artifact and hash inventory, and publish only an isolated v2 preview using a safe combined deployment. Verify hosted HTML, pointer, manifest, code, content, representative images and v1 root availability. Provide the live preview and review checklist to the user. Stop before production cutover until explicit preview acceptance and separate cutover approval. P2 Save/auth/uploads/offline sync/Catch authoring remain deferred. Consolidate temporary migration/workspace/acceptance workflows into the normal release path when safe, without deleting needed evidence or meaningful checks.

## Recovery and handoff discipline

The production `fishing-pwa` artifact from run `34237232075` is ID `10060378687`, SHA-256 `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`, retained through December 7, 2026. The migration evidence artifact is `10094858407`, SHA-256 `f3f3fc8637654852951a5a6b9d56292cd8a282db1e847ebe1c9dddd1cb610385`, retained through October 9, 2026. The source-audit artifact is `10088691303`, SHA-256 `ff909f020af9460b8d745a4bed5c46bccd199f695ac84626a8cd8cca65f5d0cb`. Git history and committed source are durable; runner artifacts and temporary chat files are not. Obtain a fresh authenticated workspace rather than relying on a previous container path.

Chat remains the default. The user explicitly authorized temporary Work for the particular repository/development/browser execution need, not complexity alone. Continue the authorized P1 engineering through the isolated preview without repeated Proceed interruptions. Preserve direct-main changes, original requirements, source bytes and existing user data. The canonical TODO uses FISH-TODO-073 and 075 IN PROGRESS, 074 and 079 DONE, 076 and 078 OPEN, 077 DEFERRED, 080 for this reconciliation, and 081 for browser failures; next unused ID 082. Update the authoritative documents after actual milestones and verify their consistency before returning to Chat.
