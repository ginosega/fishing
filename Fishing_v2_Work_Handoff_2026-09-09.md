# Fishing Companion v2 — Work Handoff

**Superseded by production:** [September10 production release](Fishing_v2_Production_Release_2026-09-10.md). PR64 is merged, root production is verified and seven absent pictures are explicitly deferred. Everything below preserves historical evidence; its old pending gates and URLs do not describe current production.

**Historical checkpoint:** September 9, 2026, Pacific time. This is the durable source-backed continuation record for the user-authorized temporary Work session. It is not a completed v2 acceptance or production-release certificate. Restore current GitHub state before acting; the identifiers below are dated evidence, not instructions to reset newer work.

## Verified preview closeout

P1 engineering and automated browser acceptance are complete. The isolated [v2 preview](https://ginosega.github.io/fishing/v2-preview/) is published and hosted verification passed; user review is pending. V1 remains at the root. Draft PR 64 is unmerged. See [Fishing_v2_Preview_Release_2026-09-09.md](Fishing_v2_Preview_Release_2026-09-09.md) for exact evidence and recovery.

The sections below preserve the initial September 9 engineering handoff and its failure evidence. Their old status labels and next-action instructions are historical, superseded by the preview release record. Do not repeat migration or repaired work from those instructions. The temporary Work phase is complete; continue user review in Chat.

## Historical repository and release state

| Item | Verified checkpoint |
|---|---|
| Repository | `ginosega/fishing` |
| Main before reconciliation | `79f36144abad39a9515b8f2d7710852f1c7e7114` |
| Implementation branch | `feature/v2-implementation-20260908` |
| Observed feature head | `24f57ca7d72a9751e0935c6eb46e842f61493db2` |
| PR 64 | Open, draft, unmerged; base main |
| Successful migration | `6615ae7296e48d90dceab303b6b5a1fbc041ab80`, run `34328748390` |
| First browser acceptance | Run `34330339245`, completed failure, two of six passed |
| Production v1 | Last verified production build #312 / `34237232075`, source `4f2fe70f47da9cca3704722de87f7282bcc00f83` |
| V2 preview | Not deployed or accepted |
| Runtime fixes after failed browser run | None committed by the documentation handoff |

The source audit and technical contracts remain complete in their original form, with separate September 9 addenda. The canonical Context, TODO, Decision Log, README and bootstrap have been reconciled. The documentation-only integration does not authorize or perform a v2 cutover.

## Migration and preservation evidence

The pinned migration maps 66 source Gear records to 69, retains 54 KB entries and five Catches, and adopts 49 explicitly approved exact-byte archived images. The full per-file reconciliation and decisions are in `v2/migration/reconciliation.json` and `v2/migration/image-decisions.csv`. The canonical JSON SHA-256 values are:

- Gear: `e001c82a49c63b8ac21c93b559bc4768a40d267eff8bdf3fb6e73225cac64256`
- KB: `85bbf03d55b98432a21ed67288fc11e72c7fcf660a9af6de59ccf4beaa6268a4`
- Catches: `db97091e484021f0b261b91a27c790bd9f2bd4a8221bbd432e47400e21e9459b`

The eight media exceptions comprise seven required items—Tsuridamashii snap-swivels, Rapala F-3, KB Perch, Popper and Whopper Plopper, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60—and one optional generic inline-spinner picture. Rapala is incorrectly optional in the committed report; correct the classification and regression test without rewriting source data. The two rejected capture hashes are `562c1081c6407a306fb8dfd3f1bbed39d39586b4855bc68117689a8c2fb3924f` and `0a62d3625752927423ac1d3d4867d6d9887dbe0ad98a4df36e9c2babb15810ac`. No automatic acquisition or unapproved replacement is permitted.

The user accepted source equivalence and waived a separate device-only IndexedDB export for this baseline. No device inspection was performed. Preserve v1 browser stores and reconcile any later-discovered local-only data before retirement.

## Browser acceptance and exact next work

Run `34330339245` tested PR 64 merge commit `3b68d951b19f1c51e16c9d6b427ae884168bb5f9`. Hosted Node 24 dependency audit found zero vulnerabilities; 15 core tests passed; build and verification produced release `0258308c62b5d18756edd1edb219eb31`, 195 manifest files and 27,622,722 bytes. Chromium installed successfully. Browser tests passed complete-library offline installation/reload and mobile/service-worker isolation; four failed:

1. Viewer test waits for accessible name `Zoom in`, while the control is labeled `+` with a title. Add the accessible name and retain the real zoom/reset assertions.
2. Editor test selector matches both the page heading and nested editor heading. Use a precise, unique page-level/accessible selector and continue the handoff coverage.
3. After a failed/corrupt update is repaired and Reload is clicked, the application remains on old release `0258308c62b5d18756edd1edb219eb31` rather than new `446b0d41eff82f778c3d6e00bdb8041d`. Investigate worker activation, REPAIR target, loader pointer and release selection. Preserve immutable old releases for existing tabs while selecting the new complete release after explicit reload.
4. Tampered cached content is correctly rejected offline, but the article does not reappear after network recovery. Investigate same-hash navigation/render retry and verified repair; do not weaken integrity checks.

The current service worker may delete an existing final cache before copying staging entries. Correct the promotion protocol so a failed copy cannot remove the only complete release. Test failure recovery, release identity, no code/data mixing, dirty-form protection, offline reload, navigation and supported mobile/browser behavior. The artifact upload must include hidden Playwright output or use a nonhidden path; the first evidence artifact omitted screenshots/traces despite their log references.

The successful migration evidence is run `34328748390`, artifact `10094858407` (SHA-256 `f3f3fc8637654852951a5a6b9d56292cd8a282db1e847ebe1c9dddd1cb610385`, retained through October 9). The browser evidence artifact is `10095686186` (SHA-256 `fd02948e1c07dd1a8b6fd472fc3cc4cba5de939f0bccaa9d1627881b49731c78`, retained through October 9). The original v1 production bundle artifact `10060378687` (SHA-256 `83100e9cf2788b2d33959b39a6bb63fdd0e78c5e512936a07e46b22632bf7dbf`) is retained through December 7. Source audit artifact `10088691303` is retained through October 9. Git history and committed source must remain the durable authority rather than expiring artifacts.

## Authorized completion sequence

Restore fresh GitHub source and check for any newer or uncommitted work. Do not rerun the one-time migration. Correct the test defects and runtime failures, run core/security/build/verify and full Playwright acceptance until meaningful gates pass, and fix the Rapala accounting. Reconcile actual main, preserve a verified v1 root artifact and rollback checkpoint, then deploy a safe combined artifact with v2 only at `/fishing/v2-preview/` and an isolated worker scope. Verify actual hosted HTML, pointer, manifest, code, content and representative images, and confirm v1 remains usable. Provide the live preview to the user for acceptance; do not merge the draft production cutover or remove v1 until the user separately approves it. P2 direct Save/authentication/integrated uploads/offline edit sync/Catch browser authoring remain deferred.

## Documentation closeout

The original approved requirements, user-authored Inventory/Design Review, machine schemas, runtime/data files and unrelated fishing backlog are preserved. The documentation reconciliation records 071/072/074/079/080 DONE; 073/075/081 IN PROGRESS; 076/078 OPEN; 077 DEFERRED. The next unused task ID is 082. The permanent Chat-default policy remains in force, with this temporary Work session specifically authorized for development and browser execution. Before any future chat transfer, reconcile current main, feature branch, decisions, TODO, bootstrap and release evidence again. This document's dated hashes are not permanent instructions to reset newer work.
