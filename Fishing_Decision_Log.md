# Fishing Decision Log

**Status:** Current decision authority, reconciled September 8, 2026. Complete historical decisions remain in `Fishing_Decision_History_Through_2026-09-06.md`, `History/` and Git history. Previous CURRENT labels do not override the latest approved requirements.

## V2 design approval

All fourteen decisions in the user-annotated Design Review are accepted. Decision source: `0bd773366130a302b0e80d5cd085a71731ff9e63`. The original Inventory and Design Review preserve the user's exact wording. [Approved v2 baseline](Fishing_Companion_v2_Approved_Baseline.md) is the consolidated requirement/architecture contract. No v2 application implementation or migration is complete; P2 features remain separately authorized.

| Area | Accepted decision |
|---|---|
| A1 | P1 minimal Gear/KB handoff, optional P2 direct Save, then optional P2 offline outbox. Do not build sync for P1. |
| A2 | Future secure GitHub authorization and small service are reasonable if needed, to be revisited at P2. No public embedded credentials. |
| A3 | Last-writer-wins for the same logical record/document; safe independent structured-field merging, whole-document Markdown replacement, no unrelated overwrite, visible deletion/schema conflicts. |
| B1 | Category-level assets/content folders, stable directory keys, no automatic move on reclassification. |
| B2 | Human-readable safe filenames including spaces/capitals, independent of IDs. |
| B3 | JPEG/PNG/WebP/GIF; 10 MiB, 6,000-pixel per-axis and 36-megapixel limits; reject rather than transform. Check existing sources before enforcement. |
| B4 | One authoritative picture; lazy loading and measured performance before optional derived thumbnails. No galleries or automatic optimization in P1. |
| C1 | Add Spincasting rod as the sixth independent Rods & Reels type. |
| C2 | Copy current component facts/links exactly and duplicate original setup Notes into both component Notes documents; user will correct them through Edit. No invented identities. |
| C3 | Preserve unaffected IDs; assign new component IDs; one-time old-to-new mapping only. |
| D1 | Catch has date, optional time/text Size/Species/Location/owned Lure-Bait and Notes. No setup/technique or separate picture. Species picture is derived. |
| D2 | Preserve existing measurements as text with original values/units; no enrichment or invented facts. |
| E1 | Gear Guides/Techniques classified by primary article purpose, with authored cross-links rather than extra taxonomy fields. |
| E2 | Keep gear:// and kb:// stable-ID navigation and add Copy Link. |

The remaining Inventory responses are also approved requirements: retain the current domain/category structures except agreed simplifications, current visual design, explicit search/filter/sort rules, full offline reading, rare chat-managed deletion/taxonomy administration, and no unnecessary source/provenance/owner metadata. Consult the approved baseline rather than reinterpreting historical v1 decisions.

## Current production authority

The last fully documented v1 release is PR60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`. Later direct-main changes exist; latest previously inspected run #312 / `34237232075` succeeded. Verify actual main/current deployment before acting. Historical release evidence is in `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md` and earlier records. The v1-specific model/media/authoring rules below are superseded for v2, but remain in force for live v1 until cutover.

## Standing decisions

| Area | Decision |
|---|---|
| Operating mode | Chat by default. Work only for a specific Work-only capability with explanation and user approval; complexity, duration, research, files and artifacts alone are not reasons. |
| Source of truth | GitHub is durable. Current structured runtime source and authored Markdown prevail over historical OneNote/PDF, Topics, old chats or stale bootstrap text. |
| End-to-end execution | An authorized change continues through validation, PR/CI, merge, actual deployment verification and state reconciliation. Progress is informational, not an approval gate. Stop only for genuine blockers or complete scope. |
| Preservation | Preserve user-authored text/files, confirmed facts, ownership and actual historical relationships. Do not infer purchases or catch attribution. Preserve direct-main edits and validated source bytes. |
| Project scope | Personal single-user application; no Planner, sessions, speculative graph or multi-user expansion. |
| Documentation | Keep concise current authority and one canonical TODO; historical detail remains in Git/History, not parallel current databases. |
| Releases | Restore current main; normal exact-head/current-base checks for meaningful runtime work, expected-head merge, actual Pages deployment, no skipped meaningful gates, no one-time migration reruns or permission bypass. Avoid overlapping Pages releases. |
| V2 scope control | Requirements approval does not automatically authorize a P2 feature or application build. Use approved baseline; ask only for genuine new decisions or explicit implementation authorization. |

## V1-only architecture (historical during migration)

Gear schema4 uses JSON/IndexedDB, paired setups, manufacturer objects, ordered links and external Notes. KB schema1 uses flat entities and Markdown. Catch schema2 uses exact known associations and external Notes. The media system has source/owner/override/local manifests and source/derived stages. Browser Gear/KB editing produces source-aware handoffs. V1 preserves stable IDs, explicit ownership, source provenance, safe paths, final transformed-data checks and all accepted user content. Its current implementation and historical decisions are documented in `pwa/README.md`, `pwa/DATA_MODEL_RECONCILIATION_DESIGN.md`, prior Decision Log versions and release files. Do not remove those safeguards from the live v1 application as a shortcut; replace them only with the approved v2 architecture after preservation and validation.

## Open work

The next new task ID is FISH-TODO-071, assigned to the v2 design reconciliation. The canonical TODO contains subsequent v2 audit/build/migration/cutover phases and existing fishing/gear research items. FISH063's old media-authoring policy and FISH039's setup recording are superseded for v2 by the approved requirements; they do not justify reintroducing retired structures. Existing unresolved PowerBait hook-size and loop-knot guidance remain open. No approved future feature is treated as already deployed.
