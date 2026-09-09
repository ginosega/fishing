You are helping with my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from the repository first; do not rely on an old chat, stale release checkpoint, or assume previously observed work is still pending.

## Operating mode

Use Chat mode by default. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research or calculations, or creates artifacts. Recommend temporary Work only for a specific Work-only capability, explain the need, and obtain my approval first.

When I authorize a change, treat it as one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup, and reconciliation of authoritative project records without waiting for another Proceed at intermediate milestones. Progress updates are informational, not approval gates. Stop only for genuine blockers requiring input/permission or fully completed scope. Do not claim work is complete until its actual state is verified.

## First actions in a new chat

Read the following from latest main, in order:
1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_Companion_v2_Approved_Baseline.md`
6. `Fishing_Companion_v2_Source_Audit.md`
7. `Fishing_Companion_v2_Technical_Contracts.md` and `v2/contracts/schema.json`
8. `Fishing_Companion_v2_Requirements_Inventory.md` and `Fishing_Companion_v2_Design_Review.md` when exact user responses or decisions are needed.
9. `pwa/README.md` and the latest relevant release record when working on v1 or auditing its sources.

Then fetch actual current main, relevant branches/PRs, CI and deployment status. Latest repository evidence overrides any old checkpoint. Preserve direct user edits. Complete historical documentation is in Git/History; it is not competing current authority.

## Current project phase

All fourteen v2 Design Review decisions were accepted in user commit `0bd773366130a302b0e80d5cd085a71731ff9e63`. The consolidated requirements authority is `Fishing_Companion_v2_Approved_Baseline.md`; exact user-authored Inventory and Design Review responses remain unchanged. The user explicitly authorized the source/dependency/data audit and minimal architecture/contracts. Those are complete and documented in the Source Audit and Technical Contracts. FISH072 is DONE. No v2 application implementation, migration, preview or production cutover has occurred. The next milestone is FISH073, a representative Gear/KB/Catch vertical slice. Do not implement P2 direct Save, authentication, integrated uploads or offline synchronization without their separate approved design.

V2 preserves three distinct domains with shared identity, Markdown, picture, path and validation conventions. Independent rods/reels replace paired setups; six types include Spincasting rod. Catch has optional Species/Location/owned Lure-Bait, plain-text Size and Species-derived picture. Gear/KB images use a local path plus authored caption, no source/provenance/owner graph. Human-readable filenames and category-level assets/content folders. Full-library offline reading and minimal Gear/KB handoffs are P1; direct Save, integrated uploads, offline edits/sync and Catch browser authoring are P2. No Planner, sessions, generic graph, multi-user or speculative features. The approved baseline contains exact fields, limits, UI and migration instructions.

## Verified audit and live v1 baseline

The source audit is pinned to main `1fa82a0cb653b8205bc8a45a1cf4608a616bf3b2`. Isolated audit run #2 / `34312003986` succeeded, yielding a complete source snapshot and inventory. The verified v1 production bundle came from main `4f2fe70f47da9cca3704722de87f7282bcc00f83`, run #312 / `34237232075`. Source Gear/Catch data and all 101 authored Markdown files match the published bundle; KB non-picture fields match. Twelve source tests, four dist tests and final-bundle verification passed. This is not a claim of v2 browser or offline acceptance.

The live application remains at https://ginosega.github.io/fishing/. Last fully documented feature release: PR60, head `cd47dc9ce39660840de493346e7df9fda72a14e5`, CI `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production `34191692935`. Later direct-main changes exist. Run #311 / `34237203787` failed on a deleted Bonafide source still expected by a content test; #312 succeeded. Earlier recovery records document full-text test coupling. Do not assume every failed email has the same cause. Verify current main and deployment rather than treating historical metadata as current.

Audited source counts: Gear schema4/66, KB schema1/54, Catch schema2/5; 101 authored Markdown files and 36 repository content images. Expected Gear count after the approved three-to-six component split is 69 if the source remains unchanged. These counts are audit evidence, not permanent migration expectations. Current structured source and authored Markdown own the facts. Do not infer ownership, purchases, equipment identity or historical Catch attribution from old research.

The media audit identified 51 remote-only Gear captures, three standalone remote KB pictures, six KB pictures sharing Gear assets, one malformed active Tsuridamashii WebP, an unused malformed Kokanee WebP and an absent Rapala F-3 picture. Preserve archived captures and current source bytes. FISH078 tracks user-supplied replacements or explicit one-time adoption of existing captures; no automatic web acquisition. FISH079 tracks the one-time read-only browser IndexedDB export/difference check before retiring the old store. No browser-only data is known to exist, but that is not proof it is absent. Do not clear browser data.

## Implementation and preservation boundaries

The selected minimal architecture uses framework-free JS/ESM, three independent domain contracts, one router, direct rendering, tested Markdown/sanitization, a deterministic source build and complete versioned offline releases. The machine-readable draft-2020-12 schema is `v2/contracts/schema.json`. Dependency candidates and precise path, authoring, offline and release contracts are in the Technical Contracts; exact versions must be locked and tested during implementation. No new production dependency is installed by the design phase.

V1 remains operational on its existing schema, IndexedDB, media registries, source-aware handoffs and multi-stage build. Preserve all source files, IDs, authored content and media until migration verification. The exact three-setup-to-six-component mapping is in the Source Audit. Copy each component's recorded Manufacturer, Model, Specifications and Links exactly and duplicate complete setup Notes byte-for-byte into both new component Notes. Do not invent the unidentified spincasting rod model or picture. Reconcile retired setup references explicitly; preserve all five Catch facts and Notes. User image binaries are uploaded directly to exact GitHub paths; do not transport binary/base64 through the connector.

FISH073 is the next implementation task; FISH074–076 cover migration, complete P1 UI/offline acceptance and preview/cutover. FISH078–079 are explicit migration gates. P2 remains deferred under FISH077. The one-time preview uses a separate URL and isolated service-worker scope; ordinary releases do not need staging. After verified cutover, remove obsolete active v1 code while retaining Git/rollback history. No permanent legacy adapter or parallel authoritative database.

Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and actual Pages deployment verification. Respect workflow permissions, preserve direct-main edits, avoid overlapping releases, do not weaken meaningful tests or rerun one-time migrations. Do not claim an audit, browser test or deployment completed without actual evidence. If interrupted, recover exact current branch/commit, validated steps and remaining work before acting. No unnecessary status interruptions or repeated approval gates.