You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. This is a dated entry point; restore actual latest main before acting.

## Repository cleanup — September 10, 2026

The user approved the new site's appearance and behavior, then requested repository cleanup. Production source, tests, contracts and migration evidence have moved from root `v2/` into `pwa/`; the preserved icon was the only build dependency on the former v1 `pwa/`. Retained v2 specifications/release references are in `pwa/docs/`. Root `History/`, `Topics/`, obsolete registries/handoffs and v1 runtime/assets/per-item helpers are removed from main, recoverable at `checkpoint/pre-repo-cleanup-20260910` (`edca2a3f04fc8c32dec65b9330d43944be1a561c`). Canonical Gear/KB/Catch bytes, including the newer unreferenced Pflueger image upload, are unchanged. No image adoption or migration rerun.

Add/Edit creates copyable source-change packages, not one-off helper/release files. Routine changes must update canonical files and existing project records; reusable code/tests stay under `pwa/`, and significant release references belong under `pwa/docs/`. No new per-item scripts/release records in either root. Cleanup PR73 is merged and published. [Production run 34490532301](https://github.com/ginosega/fishing/actions/runs/34490532301) passes all 20 core tests, 42 browser scenarios across the two scopes, and all 197 hosted-file comparisons. Current production source `6a64be686cf751720884469b98f2fcc4df94ec6a`, release `d63599a99498d62fdfb1fc22c04643c2`. See [cleanup/release evidence](pwa/docs/Repository_Cleanup_2026-09-10.md).


## Current state and operating mode

V2 is published at [Fishing Companion](https://ginosega.github.io/fishing/). Current production source `76094d48055ca9e2363298763cdbf00586fbeb71` passed the complete production pipeline and actual hosted verification in [run 34544432559](https://github.com/ginosega/fishing/actions/runs/34544432559); release `d6334fcb8a34834f1918df95b8f04efd` contains 205 hosted files. Post-production site-authored changes include PR75/PR76 (Pflueger spincast rod/reel), PR77 (Tsuridamashii snap-swivels picture), PR79 (four previously deferred pictures plus Rebel Pop-R replacement), PR81 (Kokanee/Largemouth/Smallmouth Species updates), and PR84 (final Popper and Whopper Plopper Gear-Guide pictures). All seven originally deferred required pictures are resolved and live. Generic inline-spinner remains optional. No acceptance or media approval blocks routine releases.

### Pending approved UI refinement batch — not yet implemented

FISH-TODO-084 is OPEN and approved for one coordinated future feature PR/release in Chat mode. Exact scope: approved CSS-matched fish/hook app icon; Catch Log date on a regular-weight second line under Species; general `Search [page title]` placeholders; Exit after Copy Changes returning to the originating item/page without dirty-form warning; plain-language ChatGPT instruction above copied JSON; Knowledge Base text `Fishing reference library`; Catch Log text `Recorded catches`; and removal of the Back-button arrow site-wide. The earlier request to make KB Notes optional was withdrawn; do not implement it. Read `pwa/docs/Fishing_UI_Refinement_Approved_Scope_2026-09-10.md` before implementing. The approved icon exists only as the signed-off image attachment in the originating Chat and is intentionally not in GitHub; the user will manually upload it after starting the new chat. Do not regenerate or substitute the icon unless asked. This reconciliation is documentation only; none of FISH084 is deployed yet.

Validation remains the complete core/source build plus preview-scope and production-scope Chromium/WebKit scenarios, including the archived-v1 worker/store transition, followed by exact-current-main Pages deployment and actual hosted-byte/browser verification. These are automated browser/direct hosted checks, not physical-device inspection.

The sole active pipeline is `.github/workflows/fishing-production.yml`. V1 and the earlier preview are historical; use the production root. V1 sources are archived in Git history and the pre-cleanup checkpoint; exact rollback ZIPs remain in Git. Old browser stores are retained. P2 remains deferred. Continue in Chat.

I explicitly authorized production and waived another preview review, then said: “Yes, omit those, and those gear and KB items can just have no picture. I will add these to the site later.” Do not ask me to reapprove those completed decisions. No migration rerun, image acquisition, speculative source edits or browser-store deletion.

Chat is the permanent default. The temporary Work production phase is complete. Do not recommend Work for complexity, duration, research/calculations, file volume or artifact creation. Explain a specific unavailable execution capability and obtain temporary Work approval only when needed. Do not promise background work.

## Restore authority

Read latest main in order:
1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/docs/Fishing_v2_Production_Release_2026-09-10.md`, `pwa/docs/Fishing_v2_Review_Feedback_2026-09-09.md` and `pwa/docs/Fishing_UI_Refinement_Approved_Scope_2026-09-10.md`
6. `pwa/docs/Fishing_Companion_v2_Approved_Baseline.md`
7. `pwa/docs/Fishing_Companion_v2_Source_Audit.md` and its September9 addendum
8. `pwa/docs/Fishing_Companion_v2_Technical_Contracts.md`, its September9 addendum and `pwa/contracts/schema.json`
9. Original Requirements Inventory and Design Review when exact user responses are needed

Fetch current refs, PR/CI and deployment state when implementation/release work requires them. The review-release checkpoint, initial preview release, Work Handoff and `pwa/` release notes are historical. Do not revive their old media/preview/cutover gates or reset branches to their SHAs. GitHub is authoritative, never a previous chat's temporary files.

## Source and scope

Canonical v2 domains are `Gear/gear.json`, `KB/kb.json` and `Catches/catches.json` with authored Markdown and local image bytes. Original migration `6615ae7296e48d90dceab303b6b5a1fbc041ab80` contains Gear69/KB54/Catches5 and six independent rod/reel components. Forty-nine exact-byte archive adoptions were approved; two rejected. Preserve original confirmed facts, stable IDs, narrative and actual Catch relationships. Do not infer purchases, missing rod models/pictures or historical Catch attribution. Use current-source-derived tests; pinned hashes are historical evidence, not permanent article locks.

The original seven-picture absence decision is historical production-cutover evidence. PR77 supplied Tsuridamashii; PR79 supplied Rapala Original Floating, Mack's Pee Wee Hoochie, River2Sea Whopper Plopper 60 and Yellow Perch; PR84 supplied Popper and Whopper Plopper. All seven required picture exceptions are resolved. Generic inline-spinner is optional. `pwa/migration/media-decisions.json` preserves the original accepted-absence disposition; do not reinterpret it as current absence or automatically acquire optional imagery.

The Approved Baseline and original user responses remain authoritative. V2 has three independent domains sharing conventions, not a generic graph. P1 includes read-only Catch Log, complete-library offline reading and source-aware Gear/KB Prepare Changes → Copy Changes handoffs for project chat/repository implementation. P2 direct Save/authentication/uploads/offline editing/outbox/sync and Catch browser authoring remain deferred. No Planner, sessions, paired setups, speculative ownership/media graph, accounts or multi-user expansion.

## Release and recovery

The only active production pipeline is `.github/workflows/fishing-production.yml`. Normal feature PR/current-base CI, exact-head integration, one serialized Pages deployment and actual hosted verification apply to runtime/source changes. Preserve meaningful integrity, offline, dirty-form and migration-source assertions. Documentation-only changes do not redeploy.

V1 runtime sources remain historical. Exact v1 production and migration-media ZIPs are preserved in Git at `checkpoint/v1-before-v2-preview-20260909`, commit `4aafcd2f88b35bb34b608e2f85dec1daffc6c1d1`; the production release has hashes/restore guidance. Do not run old competing publishers. The earlier preview URL is superseded by the production root.

The source-equivalence waiver stands; no separate physical-device/IndexedDB export or inspection is claimed. Retain old browser stores and reconcile later-discovered local-only data before retirement. FISH076, FISH078 and FISH083 are DONE; P2 FISH077 remains DEFERRED; FISH084 is OPEN for the approved UI/authoring refinement batch. All originally required missing pictures are resolved; generic inline-spinner remains optional. Unrelated backlog remains; next unused task ID085. Update Context, Decision Log, TODO, README, affected source/technical/release records and this bootstrap after actual milestones; cross-check before handoff.
