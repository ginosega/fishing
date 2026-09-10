# Closure — September 7, 2026

This is a historical recovery/release record, not an active continuation instruction. The preserved Gear feature was reconciled with PR46 and the user-uploaded Cylinder Weights image, cleaned, validated and merged in PR47. Final head `fd0f07e2929343303f93f8b9433326c7301543bb` passed PR CI #239 / `34135260691`; merge `f05b7ec532d8e45f3fc36c1e0976c5ea40eb9983` passed production #240 / `34135326910`, including actual Pages deployment. The user verified the Gear refinement and new Cylinder Weights image. FISH-TODO-058 and 059 are DONE. The seven one-time migration/finalization artifacts were removed; permanent image validation, media policy and final-bundle checks remain.

## KB Add/Edit follow-on release

PR #48, final head `85245de2451db97370268e14dfc2c66a53c8c61d`, passed normal PR CI #251 / `34142498510` against main `f05b7ec532d8e45f3fc36c1e0976c5ea40eb9983`. Merge `6d04e29b6770000eaa50f6c449ad82bc88f7326d` passed production #252 / `34142574286`, including the actual Deploy to GitHub Pages step. The production run completed September 7, 2026 at 16:18:08 UTC. The deployed release is ready for user acceptance. FISH-TODO-060 is DONE. The feature preserved all 64 Gear, 54 KB and five Catch records, source/derived media boundaries and authored Markdown. Temporary source-transfer artifacts/workflows were removed; permanent authoring, promotion and final-bundle validation remain.

The archived September 6 checkpoint below intentionally retains its original pending-state language and exact historical SHAs. It is not current project state. Do not resume the old Gear or KB integration branches or rerun one-time migrations. Restore current main, Context, TODO and Decision Log for subsequent work.

---

# Fishing Release Handoff — 2026-09-06

**Status: IN PROGRESS / NOT DEPLOYED.** This is the durable handoff for the interrupted Gear authoring refinement. It records the source state and release obligations; it is not a claim that the pending feature is live.

## Repository and production boundary

- Repository: `ginosega/fishing`.
- Live site: https://ginosega.github.io/fishing/
- Last verified production source/main at this checkpoint: `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`, merged PR #45 (Bonafide RVR119), production workflow #235 reported successful including actual Pages deployment.
- The user subsequently confirmed that PR #44's module-cache hotfix restored My Gear home-card navigation. Do not reopen that resolved defect without new evidence.
- Main has Gear schema 3, data version `2026-09-06-my-gear-v3-bonafide-rvr119-1`, and 64 records. KB has 54 entities and Catch Log has 5 records. The 63-record counts in older documentation are historical, not current.
- The pending feature is NOT merged, has no PR, and has not passed final normal PR CI or production deployment. Do not confuse a successful temporary migration workflow with release verification.

## Exact preserved feature checkpoint

- Branch: `feature/gear-guides-ordered-links`.
- Head: `24ea22ac187f81b42c2d91743e0a470ba3d1ad94`.
- Tree: `f57cbbdc4684f6c07766bb622427cf1ae04cb443`.
- Original base: `cdb1c500f08394a9c44ea2012b6de72adbd46ecc`.
- At audit: 21 commits ahead, zero behind; 29 changed files; no open PR.
- Preserve this branch and its user-authored source. After the documentation handoff PR is merged, fetch the new main and reconcile its documentation into this feature before final release. Do not reset or overwrite the feature with main.

## Approved and implemented changes awaiting release

The user's approved taxonomy changes are My Gear **Equipment** (keep stable category key `accessories`) and Types Kayaks, Tools, Tackle Management, Electronics, Storage, Accessories. KB `equipment` remains the internal type, but its card is **Gear Guides** with exact subtitle `Equipment, rigs, and presentations reference`. The approved light-blue kayak/gray-paddle icon is implemented as a diagonal top-down SVG. Taxonomy administration remains chat-only.

Gear schema 4 uses data version `2026-09-06-my-gear-v4-ordered-links-1`. Manufacturer has only `name`; Links are ordered `{label,url}` pairs with no classifications. The migration places existing manufacturer URLs first and preserves remaining links in order. The UI removes Manufacturer URL and Link Type controls, uses the requested New Gear Item subtitle, and omits empty Links sections. All 64 stable IDs and records are preserved. Schema-3 non-seed local stores have an upgrade path, while seed-managed stores refresh deterministically.

The approved Notes-image policy allows safe, Gear-ID-prefixed sibling JPEG/PNG/WebP/GIF files beside the Markdown in `pwa/gear-content/`. A Markdown file such as `bonafide-rvr119.md` can use `![Bow hatch](bonafide-rvr119-bow-hatch.png)`. The build checks path/ownership, actual image format and extension, nonempty size up to 10 MiB, copies exact bytes, and includes referenced images in the offline manifest. Existing `assets/gear-notes/` references remain supported. Hero/thumbnail media stays separately owned.

Existing-picture editing displays the current deployed asset, media ID, and actual source. Picture Yes offers explicit Keep current picture (default) or Replace picture; replacement can use the same filename. The handoff includes the existing media ID/source and requested `pwa/assets/gear-source/<filename>` upload path. Repository promotion must preserve the original owner/media ID and register the new local source only after the user uploads a valid binary. There is no bulk migration or deletion of existing images.

The browser remains authoring/handoff-only: no direct GitHub writes, no competing local Gear database, and no raw JSON editor. Rods & Reels retain limited paired-setup editing. Stable IDs remain immutable.

## Test and workflow evidence

Temporary migration workflow #4 / `34087849216` passed the Notes-media migration tests and produced source head `8bcb346abb20fcbfc99017f487e28701d2f8d413`.

Workflow #5 / `34088142949` passed source syntax, Gear/media policy tests, model/routing/KB/Catch/final-content tests, full PWA build, authored-Notes and local-media stages, and final deployable-bundle verification. It failed at the subsequent push because the GitHub App could not update `.github/workflows/fishing-pwa-build.yml` without `workflows` permission. The build itself did not fail.

Workflow #6 / `34088215783` completed successfully after excluding the protected workflow edit from its commit. It produced current head `24ea22ac187f81b42c2d91743e0a470ba3d1ad94`. This is a source checkpoint, NOT exact-head normal PR CI.

The last full build reported 64 Gear, 54 KB, 5 catches, 63 media and 117 offline document assets. Gear Notes: 42; Catch Notes: 5. Three remote image fetches were unavailable during that build, but local-media substitution and final verification succeeded. Recheck final media results in normal CI; do not assume an unavailable remote fetch means an owned image has been lost.

## Required next actions

1. Fetch latest main and this exact feature branch. Preserve all user changes; incorporate the documentation handoff without overwriting the feature.
2. Review the feature diff for correctness and finish durable docs reconciliation. Keep the implemented source; do not rerun one-time migration scripts against already-migrated schema-4 data.
3. Remove temporary migration/finalization scripts and temporary workflow from the final feature. The permanent new files are `pwa/image-validation.mjs`, `pwa/gear-media-policy.test.mjs`, and `pwa/verify-final-bundle.mjs`.
4. Integrate the new image-policy regression and final-transformed-bundle verification into the permanent `.github/workflows/fishing-pwa-build.yml` using an authorized workflow-file write. Do not bypass GitHub permissions or claim this is complete merely because the temporary build passed.
5. Run full tests/build on the cleaned final head. Open a normal PR against current main; verify exact final head and base, including all deployment bundle checks. Merge using the expected head SHA only after CI succeeds.
6. Verify the production workflow on the exact merge commit, including the actual **Deploy to GitHub Pages** step. Only then mark FISH-TODO-058 complete and update release status in all authoritative documents. Confirm the user-facing changes in the site.
7. Preserve unrelated authored Markdown and all existing data. Do not use a new schema migration to relabel historical text or invent missing facts.

## Temporary artifacts to remove before final feature merge

- `.github/workflows/fishing-gear-guides-migration.yml`
- `pwa/migrate-gear-guides.mjs`
- `pwa/migrate-gear-guides-tests.mjs`
- `pwa/migrate-gear-notes-media.mjs`
- `pwa/migrate-gear-notes-media-fixes.mjs`
- `pwa/finalize-gear-guides-release.mjs`
- `pwa/finalize-gear-guides-tests.mjs`

Do not delete permanent image validation, media policy tests, or the final-bundle verifier. Do not reapply the temporary scripts; several assert schema3 input or literal pre-migration source strings and would fail or overwrite already-migrated state.

## Content and media follow-ups

The Bonafide RVR119 is already owned and in main from PR #45. Gear ID `bonafide-rvr119`, local hero `pwa/assets/gear-source/bonafide-rvr119.png`, Notes `pwa/gear-content/bonafide-rvr119.md`. Its six user-supplied specifications, links, and Notes were preserved. The serial number is public because the repository is public; do not remove it without user instruction. The user's original Notes heading `# Accessories` is authored content and should not be silently changed during taxonomy migration.

Cylinder Weights remains Gear ID `cylinder-weights`, media ID `thkfish-cylinder-weights`. The user wants to replace its legacy picture, but no replacement binary has been supplied. The proposed upload path is `pwa/assets/gear-source/cylinder-weights.png`, or the matching actual image extension. The new workflow will produce the exact path; preserve the existing picture until the valid replacement is uploaded and registered. This is a pending user content operation, not permission to invent or fetch a replacement.

The earlier Trailer request for a square or round Dutch oven-style griddle was handled in the separate `ginosega/trailer` repository as TT-046, planned purchase. Do not add it to Fishing or reopen the Trailer project during this release.

## Standing architecture and operating policy

Use Chat mode by default; Work only for a specific Work-only capability with explanation and user approval. My Gear owns structured facts; KB owns reusable knowledge; Catch owns exact historical relationships. Shared principles do not require identical storage. Optional Gear/Catch narratives are external stable-ID Markdown. `gear://` and `kb://` links are navigation, not a maintained relationship graph. No Planner, sessions, trip history, fuzzy identity matching, or speculative relationships. Do not transport user image binaries through ChatGPT/GitHub; user uploads directly to the specified branch/path, assistant verifies and updates text. Validate final transformed data after all build substitutions. Preserve global `fishing-pages` concurrency behavior and do not overlap direct-main content commits with runtime release checks.

## Handoff audit rule

The authoritative main README, Context, TODO, Decision Log, bootstrap, PWA README, and two data-model designs must agree that PR45 is the deployed baseline and the schema4 feature is pending. Historical release records may retain earlier values only when explicitly labeled historical. Never call an anticipated PR number a real PR. At continuation, re-fetch current repository state rather than assuming this checkpoint has not moved. The next chat must continue the preserved branch, not restart the implementation.