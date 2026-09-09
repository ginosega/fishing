# Fishing Companion v2 — Isolated Preview Release

**Status:** Published and actual-hosted verification passed. Awaiting user preview review, required-media resolution and separate production-cutover authorization. The authorized temporary Work phase is complete; continue review in Chat. This is a pending-media preview, not a production acceptance certificate.

## Live review

- [V2 preview](https://ginosega.github.io/fishing/v2-preview/)
- [Preserved v1 production](https://ginosega.github.io/fishing/)
- [Draft implementation PR 64](https://github.com/ginosega/fishing/pull/64), still open and unmerged

Review My Gear and the six independent Rods & Reels records; KB articles, pictures and links; read-only Catch Log and actual relationships; Gear/KB Edit → Prepare Changes → Copy Changes with unsaved-change protection. Wait for **Offline ready** before airplane-mode reload and navigation. The initial complete library is about 27.6 MB. Preparing/copying does not save to GitHub. Seven required media exceptions remain visible; generic inline-spinner is optional.

## Exact release identity and integration

| Item | Evidence |
|---|---|
| Final feature revision | `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6` |
| Feature branch | `feature/v2-implementation-20260908` |
| Final release ID | `b924b223850b4a2741fedb92ce924584` |
| Final engineering CI | [34376934726](https://github.com/ginosega/fishing/actions/runs/34376934726): 19 core, 16 Chromium/WebKit scenarios |
| Initial workflow-only publication PR | [66](https://github.com/ginosega/fishing/pull/66), merge `5679e1a9c7e829b2745efaf0e42986f07eea6ac0` |
| Initial successful publication | [34376332291](https://github.com/ginosega/fishing/actions/runs/34376332291), source `25cc81084f02ec395546f5949023fb0461bc0542`, release `e5dfca2224e0a70afc457c175de380d0` |
| Final workflow refresh | [PR 67](https://github.com/ginosega/fishing/pull/67) and `1922c8d5f249eaf3e556ee71a26d430791c7b997` |
| Final successful publication and hosted gate | [34378889165](https://github.com/ginosega/fishing/actions/runs/34378889165) |
| Preview scope | `/fishing/v2-preview/`, independent service worker |
| Final complete manifest | 195 files; 27,623,226 bytes |
| Actual hosted comparisons | 217 v1 files and 197 v2 files (manifest assets plus pointer/manifest) |
| Data | Gear 69 / KB 54 / Catches 5; six independent rod/reel components |
| Production cutover | Not performed; PR 64 remains draft/unmerged |

PR 66 changed only the combined-publication workflow; subsequent refresh pins the final footer display correction. Final pre-merge validation [34378557303](https://github.com/ginosega/fishing/actions/runs/34378557303) passed all 19 core and 16 browser tests plus the exact v1 comparison. Both use normal exact-head/current-base checks, the full browser gate and serialized Pages publication. Refresh validation now separates dependency setup/audit, core/build verification, browser installation and browser tests into bounded steps after run `34377227397` stalled inside its formerly combined step. The same commands/assertions remain; PR validation cannot deploy. Main contains the workflow and closeout documentation; the v2 implementation remains on the pinned feature branch. Future cutover must reconcile then-current main rather than merging an old checkpoint blindly.

## Engineering and hosted evidence

The original first browser run `34330339245` failed four of six scenarios. Repairs cover viewer accessible names, unique selectors, dirty navigation, successful update/reload coordination, retry after failed article loading, atomic complete-cache promotion, corrupt/missing content rejection and verified repair. Offline Ready validates current bytes. A direct hosted UI inspection then found a literal `null` footer text node; the final feature revision omits the absent message and browser readiness checks reject that regression.

Four fault-injection core tests exercise bundled service-worker code, including missing/corrupt assets, storage failures during asset and final-marker writes, failed same-release repair, last-known-good recovery and immutable older bytes. Eight browser scenarios run in both Chromium and WebKit. They retain full-manifest byte/hash verification, offline reload, navigation, handoffs, Catch History, image viewer, dirty forms, mobile viewport and v1 worker/store isolation. No assertions were removed to obtain green.

WebKit's offline emulation produced an internal automation reload error in run `34372041635`. Its tests instead refuse actual origin connections and require an independent fetch to fail before offline reload; the same integrity/content assertions remain. This is automated representative browser/mobile-viewport coverage, not physical-device inspection. Storage is best effort; eviction may make a previously complete library incomplete.

The publication gate rebuilds at the exact feature revision, reruns 19 core and 16 browser tests, authenticates the preserved v1 archive and compares every hosted root file before packaging. The deploy job preserves rollback in Git, combines the unchanged v1 root with only `v2-preview/`, publishes, then compares all 414 hosted files against expected bytes. This covers HTML, release pointer, manifest, code, authored content and every representative/source image. Hosted Chromium verifies 69/54/5 counts, exact preview scope with an existing v1 worker, decoded Bonafide image/viewer, offline reload at the same release, and return to the usable v1 root. Direct cloud-browser review also confirms preview navigation/readiness, six independent Rods & Reels records, five catches, and successful Update/Reload from the initial preview to the final corrected footer.

The initial hosted report at `2026-09-09T16:25:56.096Z` passed 217 v1 and 197 v2 comparisons. Initial evidence artifact `10114139262`, SHA-256 `591aa8ff00d4ce879439060222a4a9f042c9ca1f91059a1eeaaa8bbb5a6e06db`; browser gate artifact `10114094721`. Final report: checked at `2026-09-09T16:51:13.891Z`, 217 v1 / 197 v2 files match, exact release `b924b223850b4a2741fedb92ce924584` and source `5da786ef121d7cfa39f98a8c69f3b6cf09f8eca6`; hosted navigation, existing-root-worker scope, image viewer, offline reload and return to v1 passed. Artifact `10115189370`, SHA-256 `e2cdbb0edee7c326bc4207de8ecb98856000f2aad076c01aa1d4ababeb739cdc`. This committed record preserves the findings beyond artifact retention; source, tests and rollback archives are durable in Git.

## Current-main and media reconciliation

The one-time migration `6615ae7296e48d90dceab303b6b5a1fbc041ab80` was not rerun. All Gear/KB/Catch source remains unchanged from it. All 136 repository-source entries in its reconciliation report exactly match current main's authored sources at `cac5b4108a63fcaab498b256afa4420ce2dbbd70`; later release changes touch only publication workflow/documentation. Original Inventory/Design Review responses and accepted architecture were not edited. Only status metadata in original baseline/audit/contracts was refreshed.

The publication guard caught a stale v1 archive before deployment: run #314 / `34369680844`, triggered by documentation PR 65, had superseded inspected run #312. All 217 newer v1 files were preserved unchanged. Remote Eagle Claw/Rapala DT06 captures differ in format and a Rapala F-3 PNG appears in the newer archive. These are not new user approvals for v2. Both bundles are retained, and v2's 49 explicitly approved adopted captures retain their original bytes; the two rejected captures stay rejected.

Seven required exceptions: Tsuridamashii snap-swivels, Rapala Original Floating F-3, KB Perch, Popper, Whopper Plopper, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60. Generic inline-spinner is the only optional exception. Rapala is now correctly required in the report/tool and regression coverage. No image was automatically acquired or substituted, including the newly observed v1 F-3 capture.

The user accepted source equivalence and waived a separate device-only IndexedDB export. No device inspection is claimed. Retain v1 browser stores and reconcile later-discovered local-only data before retirement.

## Durable recovery and deployment discipline

Rollback branch: [`checkpoint/v1-before-v2-preview-20260909`](https://github.com/ginosega/fishing/tree/checkpoint/v1-before-v2-preview-20260909), commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`. It was created before the first combined deployment and is not reset during refreshes.

| Durable file | Source and SHA-256 |
|---|---|
| `recovery/v1-production.zip` | Current v1 source `cac5b4108a63fcaab498b256afa4420ce2dbbd70`, run #314 / `34369680844`; `fc036dc92dbf25a250917f8236c22099b798be1d5f2aa7274f6df9cb5215396e` |
| `recovery/v1-migration-source.zip` | Historical approved media source `4f2fe70f47da9cca3704722de87f7282bcc00f83`, run #312 / `34237232075`; `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf` |

For an authorized v1 restoration, fetch the checkpoint, extract `recovery/v1-production.zip` into a clean Pages artifact root, verify its hash and file tree, and deploy through one serialized Pages workflow. No rebuild or expiring artifact is needed. Preserve browser stores. The older ZIP is migration evidence, not the replacement production baseline.

For any authorized preview refresh, rebuild from the chosen verified feature revision and combine it with the unchanged authenticated current v1 root. Do not run a standalone v1 Pages upload while the preview must remain available: it replaces the site artifact and would remove `v2-preview/`. Check current refs and live bytes again; preserve newer user work. Temporary migration/workspace workflows remain inactive historical scaffolding; consolidate into the final normal release pipeline when production integration is authorized, without losing tests/evidence.

FISH073/075/081 are DONE. FISH076 and FISH078 are WAITING ON USER. P2 remains DEFERRED. Required media, explicit preview acceptance and separate production-cutover authorization are still gates; preview publication is not acceptance. No production integration, v1 retirement or P2 work was performed.
