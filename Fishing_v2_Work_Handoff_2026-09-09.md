# Fishing Companion v2 — Work Handoff

**Checkpoint:** September 9, 2026, Pacific time. This is the durable source-backed continuation record for the user-authorized temporary Work session. It is not a completed v2 acceptance or production-release certificate. Restore current GitHub state before acting; the identifiers below are dated evidence, not instructions to reset newer work.

## Repository and release state

| Item | Verified checkpoint |
|---|---|
| Repository | `ginosega/fishing` |
| Main before reconciliation | `79f36144abad39a9515b8f2d7710852f1c7e7114` |
| Implementation branch | `feature/v2-implementation-20260908` |
| Observed feature head | `24f57ca7d72a9751e0935c6eb46e842f61493db2` |
| PR 64 | Open, draft, unmerged; base main |
| Successful migration | `6615ae7296e48d90dceab303b6b5a1fbc041ab80`, run `34328748390` |
| First browser acceptance | Run `34330339245`, completed failure, two of six passed |
| Production v1 | Latest verified production build #312, run `34237232075`, source `4f2fe70f47da9cca3704722de87f7282bcc00f83` |
| V2 preview | Not deployed or accepted |
| Runtime fixes after failed run | None committed at this checkpoint; diagnoses remain to be verified |

Evidence: [PR 64](https://github.com/ginosega/fishing/pull/64), [migration run](https://github.com/ginosega/fishing/actions/runs/34328748390), [browser run](https://github.com/ginosega/fishing/actions/runs/34330339245), and [v1 production run](https://github.com/ginosega/fishing/actions/runs/34237232075).

## Migration and source preservation

The source audit was pinned to `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`, then reconciled to main `79f36144abad39a9515b8f2d7710852f1c7e7114`. The archived v1 bundle is from `4f2fe70f47da9cca3704722de87f7282bcc00f83`. The committed migration preserves 66 source Gear records as 69, 54 KB entries as 54, and five Catches as five. The three paired setups became six independent rod/reel components. Original Markdown bytes, component facts and links, unaffected IDs, Catch dates, measurements, and actual relationships are preserved or explicitly accounted for in reconciliation evidence.

Canonical dataset SHA-256:

| File | SHA-256 |
|---|---|
| `Gear/gear.json` | `e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256` |
| `KB/kb.json` | `85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4` |
| `Catches/catches.json` | `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b` |

The authoritative report is `v2/migration/reconciliation.json`; image approvals are in `v2/migration/image-decisions.csv`. There are 51 decisions: 49 exact-byte ADOPT and two REPLACE. The successful migration also passed 15 core tests, dependency audit, build and verification. The committed lockfile uses Node 24, Ajv 8.20.0, DOMPurify 3.4.15, markdown-it 15.0.1, esbuild 0.28.2, sharp 0.35.4, and Playwright 1.62.0. Do not rerun the one-time migration merely to begin a new chat.

### Eight media exceptions

| Item | Required resolution |
|---|---|
| Tsuridamashii snap-swivels | Malformed active image; replacement required. |
| Rapala Original Floating F-3 | Missing original picture; required. Current report incorrectly says optional. |
| KB Perch | Remote-only picture; local replacement or explicit resolution required. |
| KB Popper | Remote-only picture; local replacement or explicit resolution required. |
| KB Whopper Plopper | Remote-only picture; local replacement or explicit resolution required. |
| Mack's Pee Wee Hoochie | Archived capture rejected; replacement required. |
| River2Sea Whopper Plopper 60 | Archived capture rejected; replacement required. |
| Generic inline-spinner | Absent representative picture; optional. |

Rejected capture hashes are `562c1081c6407a306fb8dfd3f1bbed39d39586b4855bc68117689a8c2fb3924f` and `0a62d3625752927423ac1d3d4867d6d9887dbe0ad98a4df36e9c2babb15810ac`. The current preview build reports six pending media flags because Rapala is incorrectly optional. Correct the classification and enforce seven required exceptions plus one optional. Do not silently adopt rejected captures, acquire images automatically, or invent facts. A preview may visibly carry unresolved media; production cannot silently waive them.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this baseline. No device export was performed. Preserve old browser stores and reconcile any later-discovered local-only data before retirement. Do not describe the waiver as an inspection result.

## Browser acceptance evidence

Run `34330339245` tested PR 64 merge commit `3b68d951b19f1c51e16c9d6b427ae884168bb5f9`. Node 24 dependency audit found zero vulnerabilities; all 15 core tests passed. Build/verify produced release `0258308c62b5d18756edd1edb219eb31`, 195 files and 27,622,722 bytes. Chromium 151.0.7922.34 installed successfully. Two scenarios passed and four failed.

Evidence artifact `10095686186`, SHA-256 `fd02948e1c07dd1a8b6fd472fc3cc4cba5de939f0bccaa9d1627881b49731c78`, is retained through October 9, 2026. The artifact contains only release metadata, not the advertised screenshots/traces, because `.test-output` is hidden and the upload action omitted hidden files. Correct this with `include-hidden-files: true` or a nonhidden output path.

Passing scenarios: full-library installation verifies every manifest asset's bytes and SHA-256 and survives offline reload/navigation; mobile layout at 375px and the isolated service-worker scope pass. These do not establish complete upgrade acceptance.

### Failures to repair without weakening tests

| Scenario | Actual failure | Required continuation |
|---|---|---|
| Navigation, filters, Catch History, viewer | Timeout waiting for accessible button name `Zoom in`; implementation uses `+` with a title. | Give viewer controls accessible names and use precise dialog selectors. Preserve zoom/reset assertions. |
| Gear/KB handoffs | `#app h1` filtered by `Edit` matched both page and editor headings. | Use an unambiguous page-level heading selector and complete the remaining handoff coverage. |
| Failed/corrupt update rollback | Expected new ID `446b0d41eff82f778c3d6e00bdb8041d` after retry/Reload; received old `0258308c62b5d18756edd1edb219eb31`. | Investigate worker activation, REPAIR target, current pointer, and loader selection. Ensure a verified upgrade selects the new release while old tabs retain their pinned version until explicit reload. |
| Tampered cached article recovery | Corrupt content was rejected correctly offline, but article did not reappear after network restoration. | Investigate same-hash navigation/render retry and cache repair. Preserve strict integrity and rejection of tampered bytes. |

The current `v2/src/sw.mjs` may delete the existing release cache before copying staging entries into the final cache. This is a potential last-known-good risk. Inspect and correct promotion so the only complete release is never lost. Distinguish immutable pinned release URLs from the current pointer and prevent incompatible code/data mixing. These are engineering findings, not completed fixes.

### Exact engineering continuation

1. Restore latest feature/main and inspect actual source and failed-run logs. Fix accessible labels/selectors, then release upgrade/recovery behavior and newly exposed failures.
2. Add deterministic regression tests for complete-cache promotion, failed installs/updates, verified repair, immutable old releases, current-release selection, offline reload, dirty-form protection, navigation, and authoring. Capture actual browser evidence. Run the full Node 24 core, security, build/verify, and Playwright gates until passing.
3. Correct Rapala's required-media classification and regression count without altering approved image decisions or authored narrative bytes.
4. Reconcile current main, preserve a verified v1 root and rollback checkpoint, and publish only an isolated `/fishing/v2-preview/` under a safe combined Pages artifact. Verify hosted pointer, manifest, code, content, representative images, and both worker scopes. Give the user the preview URL and stop before production cutover.

## Recovery and release boundaries

The original v1 `fishing-pwa` artifact ID `10060378687`, SHA-256 `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`, is retained through December 7, 2026. Source audit artifact `10088691303`, SHA-256 `ff909f020af9460b8d745a4bed5c46bccd199f695ac84626a8cd8cca65f5d0cb`, and migration evidence `10094858407` are retained through October 9. The original Pages deployment artifact has shorter retention and must not be the only rollback resource. Before preview publishing, verify a fresh v1 root and preserve its hash inventory; before cutover create a separate recoverable checkpoint.

The temporary local workspace from earlier chat executions is not an authoritative Git remote and may not persist into Work. No new runtime fix has been committed after the failed run. If Work discovers uncommitted changes, inspect and reconcile them before overwriting anything. Never reset the current branch to an older local bundle. Obtain a fresh authenticated checkout and recover missing artifacts only from verified sources.

The existing main workflow `.github/workflows/fishing-pwa-build.yml` must remain intact through preview. Temporary migration/workspace/acceptance workflows are scaffolding to consolidate into one normal validated path when appropriate. Do not deploy a v2-only artifact over the v1 root, bypass permissions, overlap Pages releases, merge PR 64, or remove legacy runtime before explicit cutover approval.

## Documentation and consistency closeout

The reconciliation covers README, Context, TODO, Decision Log, Source Audit, Technical Contracts, the v1 PWA README, bootstrap, and this dated handoff. Original user-authored Requirements Inventory/Design Review, approved baseline, machine schemas, runtime/data files, and historical records are preserved. Task statuses at preparation: 071/072/074/079 DONE; 073/075/080/081 IN PROGRESS; 076/078 OPEN; 077 DEFERRED. Next unused ID is 082; unrelated fishing/gear tasks retain their prior statuses. Mark 080 DONE only after the documentation is verified on main and incorporated into the feature branch.

The temporary Work authorization does not change the permanent Chat-default policy. The new session must verify current GitHub refs and complete actual engineering/preview gates before marking them DONE. Documentation publication is complete only after its manifest is verified on main and incorporated into the feature branch; this report alone is not proof of publication.