# Fishing Companion v2 review corrections

## Production execution — September 10, 2026

The user authorized production cutover and waived another preview review, then explicitly resolved the picture gate: “Yes, omit those, and those gear and KB items can just have no picture. I will add these to the site later.” The seven named pictures are intentionally absent; all Gear/KB records remain. The generic inline-spinner picture remains optional. `v2/migration/media-decisions.json` records this decision separately from the preserved original migration report. No images were acquired or canonical records changed.

Production implementation and root-scope acceptance are in progress. The consolidated `fishing-production.yml` replaces the old v1/preview publishers and one-time workflows; history and the exact v1 rollback ZIPs remain in Git. The root loader now verifies the v2 worker protocol because v1 and v2 share the same `sw.js` URL. Acceptance covers the actual archived v1 worker, retained IndexedDB/cache stores, both browser engines, full offline reading and all prior integrity/editing assertions. Do not claim deployment until the hosted production gate passes. No additional user approval is needed.

The earlier media-blocked and preview-only checkpoints below are historical and superseded by this decision. See [production release](Fishing_v2_Production_Release_2026-09-10.md) for current execution evidence.


Status: engineering and prepublication validation passed; production authorized but blocked by seven required-media exceptions. No corrected preview refresh or production cutover has occurred. The original live v1 and preview remain unchanged. The user explicitly waived another preview review and authorized this build for production; do not ask again for that authorization.

The actual command `node v2/tools/build.mjs --base=/fishing/ --out=/tmp/fishing-production-candidate` failed in `inventorySource` with `Migration has 7 unresolved media exceptions; pending-media preview only`. The binding gate is `v2/tools/library.mjs:43`, enforcing the approved baseline and seven-required/one-optional migration reconciliation. Required-media deferral has not been assumed from general cutover authorization.

## Requested changes

The original wording and implementation interpretation are preserved in [User review feedback](Fishing_v2_Review_Feedback_2026-09-09.md). All twelve supplied screenshots were inspected. No clarification was required.

| Area | Implemented correction |
|---|---|
| Initial loading | The initial HTML includes site styling before offline installation or application loading. |
| Header and status | Keeps the v2 brand, removes domain navigation links, restores the connection dot with Connection status tooltip and dialog; readiness, file count, Update and Reload move into that dialog. |
| Footer | Release/source/pending-media diagnostics are generated only for the isolated preview path. |
| Home and category cards | Centers three home cards; removes card arrows; restores v1 Gear/KB icons and exact KB descriptions; root subtitles match home-card text. |
| Navigation and lists | Back is beside the page title at the right. Existing search/type controls precede Back; their visible labels are removed while accessible names remain. Narrow screens wrap without overflow. Existing search/filter/sort rules remain. |
| Add/Edit links | Root/category Add links appear beneath cards. Gear/KB Edit item links follow the last detail section. Create Link is on Edit pages only. Catch remains read-only. |
| Details and missing pictures | Gear category – type and KB description sit below the title. Absent detail/editor pictures produce no placeholder box. Image-free cards reserve invisible space to align titles. KB article sections display as Notes, while the canonical content field remains unchanged. |
| Viewer | One bottom Close button; no literal null when caption is absent. Existing zoom/pan/pinch behavior retained. |
| Editor | One domain-appropriate Add heading or Edit [name]; Picture follows ID; requested hints and repeat-row visible labels removed; URL placeholder shortened; requested local-picture upload wording applied; Notes label used for both domains. |
| Copy feedback | Internal link and Copy internal link labels, spacing above Close, and visible package-copy confirmation beside the copied package with instructions to paste into project chat for implementation/deployment. Clipboard rejection shows manual-copy guidance without a false success claim. |

## Engineering and publication evidence

- Correction PR [69](https://github.com/ginosega/fishing/pull/69) targets the implementation branch only; reviewed head `97ee1599b5e9722afe24cb12c87027b658e09ce2`, merged at `d5f09f058e298f3852f4bf6d0ca2545984a0d6ab`.
- PR acceptance [34420863893](https://github.com/ginosega/fishing/actions/runs/34420863893) passed 19 core tests and all 20 browser scenarios (10 each in Chromium and WebKit). Existing integrity, update/reload, dirty-form, corruption recovery, navigation, authoring and scope tests remain. Two additional scenarios per browser cover reviewed layouts/copy feedback and the styled initial shell.
- Layout screenshots from both browser engines are retained in artifact `10130883906`, SHA-256 `31804b7629356da195dfd6d0356cb8ceb5288bbeb97f3ba967dd5c3fd961814e`. Home, Gear/KB roots, Lures, Add Gear and initial shell were visually inspected. Exact recorded findings and test source remain in Git beyond artifact retention.
- Clipboard regression tests simulate success/rejection at the browser API boundary and check exact package delivery plus visible messaging. These tests are not evidence of OS clipboard permissions on a physical device.

## Preservation and remaining gates

Canonical Gear/KB/Catch JSON, all migrated Markdown/images, IDs and actual historical relationships are unchanged from migration `6615ae7296e48d90dceab303b6b5a1fbc041ab80`. Gear 69, KB 54, Catches 5; six independent components. The original approved requirements and domain schemas remain unchanged. The dated feedback supplements presentation requirements, not the domain model.

Seven required media exceptions and one optional generic inline-spinner picture remain. No media acquisition or adoption occurred. The original source-equivalence waiver remains; no physical-device inspection is claimed, and old v1 stores are retained.

Recovery remains `checkpoint/v1-before-v2-preview-20260909`: current v1 ZIP SHA-256 `fc036dc92dbf25a250917f8236c22099b798be1d5f2aa7274f6df9cb5215396e`; original migration-media ZIP SHA-256 `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`. The current v1 ZIP was fetched from Git and its hash verified in this session. Refresh publication reads these durable Git copies and verifies their existing hashes, instead of relying on expiring Actions artifacts. The combined-deployment byte guard, full browser gate, exact refs and serialized deployment remain.

The user has authorized production and waived another preview review. The remaining blocker is explicit deferral or resolution of the seven required pictures; PR 64 remains unmerged until that gate and production engineering/verification are complete. P2 remains deferred. The first published preview and historical engineering evidence are preserved in [Original preview release](Fishing_v2_Preview_Release_2026-09-09.md).

## Exact continuation

- Latest verified main at this checkpoint: `68df1258dc04d41df030e1a1ab3c0ceba56a2f81`, before this documentation-only reconciliation. Restore actual latest main and feature before continuing.
- Corrected implementation: `d5f09f058e298f3852f4bf6d0ca2545984a0d6ab`. Merged engineering push run [34421093897](https://github.com/ginosega/fishing/actions/runs/34421093897) succeeded; PR run `34421097567` also succeeded.
- Workflow-only PR [70](https://github.com/ginosega/fishing/pull/70), head `12dcf62703343f6cb5cb00c6025d7a5180d540db`, passed [34421296827](https://github.com/ginosega/fishing/actions/runs/34421296827): exact feature ref/current-v1 guard, dependency audit, core/build/verification, all 20 browser scenarios and 217 hosted v1 byte comparisons. Deploy was skipped because this was PR validation. PR 70 was closed unmerged after the user's direct-production instruction, avoiding an unnecessary preview deployment.
- Verified pending-media candidate: release `d3d58f0187a17123a3e797568e7c6f61`, 195 manifest assets, 27,644,374 bytes, 69 Gear / 54 KB / 5 Catches. This is a built candidate, not the currently hosted release and not a successful production build.
- Prepublication evidence: combined bundle/recovery artifact `10131043407`, SHA-256 `9795af3dcc9a06c8b10a3a693511c26c1a228337c4e894e69f2bd3abb2c5fed3`; browser artifact `10131043872`, SHA-256 `e10a23c956f9e729c63cc1c66873ef6b5f33521f8aa21b660bd130e80ac44995`. These are supporting artifacts; implementation, requirements and rollback bytes are durable in Git.
- Once the user explicitly defers the required pictures or supplies approved replacements, record that exact decision without rewriting historical migration evidence. Reconcile main into the implementation, consolidate the production workflow, build for `/fishing/`, test the real root scope including old v1 worker/store preservation and offline update, then perform normal PR/CI integration and one serialized Pages cutover. Verify hosted bytes and browser behavior, retain rollback, and reconcile current records. Do not treat the preview's scope checks as completed production-scope acceptance.

Required pictures: Tsuridamashii snap-swivels; Rapala Original Floating F-3; KB Perch, Popper and Whopper Plopper; Mack's Pee Wee Hoochie; River2Sea Whopper Plopper 60. Generic inline-spinner remains optional. No request to reacquire these images automatically is implied.
