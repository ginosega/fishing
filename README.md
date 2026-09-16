# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current continuation — September 15, 2026

`ginosega/fishing` is the durable source of truth. Fishing Companion remains a three-domain PWA (Gear, Knowledge Base, Catch) with canonical source under `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`.

At this handoff checkpoint, `main` is `e55dcf4a3ab01f67a3f201fc5b7416bf3bc82c4c`, there are no open PRs, and production run #293 completed successfully. Its hosted-verification artifact recorded release `7d4c4f116c4a4830e8a69efdbf51c392` from that exact source revision with counts Gear 81 / KB 57 / Catch 5. Treat those identifiers as a historical checkpoint only: always re-read actual current `main`, open PRs, the latest successful production workflow, and deployed `release.json` before relying on exact production identity.

## Current application work

### FISH111 — shared layout alignment

FISH111 is complete and production-verified. The site-header brand/connection control and the page body use the same horizontal content insets, and long-form Notes/Markdown extends through the full main-content width. Intentional narrower caps for pictures, detail tables, and editor forms remain unchanged.

### FISH112 — fixed cross-platform card icons

FISH112 is the active application/UI task. The design direction is selected but **not implemented**.

The problem is that most current card icons are raw Unicode emoji, so Windows and Android render different artwork. The approved direction is to replace those OS-dependent glyphs with bundled fixed icon assets while preserving the current Fishing Companion page/card layout and small icon scale. This is an icon replacement, not a card redesign.

Selected icon direction:

- **My Gear**
  - Rods & Reels — Google/Android rod-and-reel artwork.
  - Line — spool with a dark red/orange spool and clear/white-ish line.
  - Weights — silver/gray teardrop sinker.
  - Snaps & Swivels — silver barrel swivel only, not a snap swivel.
  - Hooks — Twitter/Twemoji-style simple hook, silver, with no bar through the middle.
  - Lures — crankbait in a Sexy Shad-style color pattern.
  - Bait — Fluent-style worm.
  - Equipment — Fluent-style oblique light-blue kayak with a paddle.
- **Knowledge Base**
  - Locations — Google/Android red round-headed pushpin with a pale blue/gray needle stem; do not substitute the teardrop map-pin glyph.
  - Species — side-view rainbow trout.
  - Techniques — compass.
  - Knots — Google/Android blue rope-knot artwork.
  - Gear Guides — open book with light pages and blue backing/edge.
- **Home**
  - My Gear — tackle box.
  - Knowledge Base — stack of three plain unlabeled books; no text on the spines. This must be visually distinct from the Gear Guides open-book icon.
  - Catch Log — jumping largemouth bass with a lure in its mouth and fishing line extending from the lure.

The image-generation mockups created during design are conceptual references only; they are not production assets and some mockups drifted from the actual page layout. Implementation should preserve the existing desktop/mobile layout and only replace the icon artwork. Before committing assets, verify the license/attribution requirements of any Google/Noto, Microsoft Fluent, or Twemoji-derived artwork and choose an appropriate bundled format (preferably SVG where practical).

Because FISH112 changes application UI/assets outside the canonical content roots, implementation requires the **Full Application Release** lane. The next unused application/architecture task ID after FISH112 is **FISH-TODO-113**.

## Current KB editorial architecture

Broad references have deliberately different jobs:

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat**: where fish are and why — habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth, and pattern recognition.
- **Bass Fishing Techniques** / **Trout Fishing Techniques**: how to catch fish once located — presentation choice, lure/bait/rig selection, retrieves, depth control, strike handling, and bank/kayak execution.
- **Spring Fishing**, **Summer Fishing**, **Fall Fishing**, and **Winter Fishing**: authoritative seasonal playbooks for both bass and trout.
- **Topwater Fishing**: broad specialized surface-fishing reference; Frog, Popper, Whopper Plopper, Walking Bait, and Buzzbait remain narrower companion Gear Guides.

Retired live Technique pages include Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance, and Water Visibility. Historical records may still mention them; do not treat those historical references as live canonical content.

Internal `kb://` links should be curated for reader value rather than mechanically added everywhere.

## Release model

FISH108 establishes two release lanes. Full policy: [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

- **Fast Content Release**: only when every changed file is canonical content under `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`.
- **Full Application Release**: any change outside those roots, including runtime/UI/assets, schema/contracts, tests, build/tooling, workflow, dependency, migration/recovery/offline, or mixed content+code work.

Routine source-aware content releases do not consume an application task ID or require per-item project-state documentation. Preserve unrelated/newer source changes and user-uploaded bytes. KB `description` is limited to 80 characters. Normalize accidental trailing whitespace unless explicitly asked not to.

FISH109 provides run-attempt-specific deployment/evidence artifacts and hosted-verification retry hardening. FISH110 centralizes the Gear/KB **Copy Changes** handoff and routes eligible packages into FISH108 Fast Content Release.

## Durable product behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**, producing `fishing-companion-change-v2`; copying is not saving and the browser does not write GitHub directly.
- FISH091: ordinary online use does not provision the complete offline library; **Connection Status → Update offline library** explicitly prepares/refreshes it.
- FISH096: Knot-only ordered `pictureSequence`, with frames under `pwa/KB/Knots/assets/<id>/`; directory contents alone never create a sequence.
- FISH102: Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- FISH103: external HTTP(S) links open in a new tab, internal app links remain same-tab, and authoring upload links use physical `/pwa/...` paths.
- FISH107: Skylety Fishing Hook Sharpener canonical type is `Tools`.

## Backlog / future phase

Preserve purchase uncertainty. `FISH-TODO-005` remains WAITING ON USER and `FISH-TODO-014` remains OPEN. The specialized content backlog still includes Texas Rig, Carolina Rig, Alabama Rig, Neko Rig, and Spoons.

**Fishing Companion v3** (historically FISH-TODO-077/P2) remains DEFERRED. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring, and multi-user generalization are not current production.

## Project continuation

Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research-heavy, or artifact-producing. Use Work only for a genuinely Work-only capability after explaining why and obtaining explicit approval.

At the start of a new chat, restore actual latest `main`, confirm open PR state, then read in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

When the user says **“It’s time to transfer to a new chat”** or clearly equivalent wording, ask once to confirm the full handoff, then reconcile repository/production state, update durable records, preserve unresolved work, cross-check the files, and finish with a clickable link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

`.github/workflows/fishing-production.yml` is the sole active production publisher. Documentation-only project-state changes do not publish the application.
