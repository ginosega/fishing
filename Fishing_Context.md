# Fishing Context

## Current authoritative state — September 15, 2026 handoff

`ginosega/fishing` is the durable source of truth. Restore actual current `main` and current open-PR state before implementation/release/repository-write work; do not rely on a previously observed commit as though it is still current.

### Handoff production checkpoint

At this handoff:

- `main`: `e55dcf4a3ab01f67a3f201fc5b7416bf3bc82c4c`
- open PRs: none
- latest successful production workflow: **#293** / run `35058248540`
- hosted-verification release ID: `7d4c4f116c4a4830e8a69efdbf51c392`
- hosted-verification source revision: `e55dcf4a3ab01f67a3f201fc5b7416bf3bc82c4c`
- hosted source-derived counts: Gear 81 / KB 57 / Catch 5

Those exact identifiers are a historical checkpoint, not durable future truth. For exact current production state, inspect the latest successful `main` production workflow plus the deployed `release.json`/hosted verification evidence.

The latest completed application change is **FISH111**, which is production-verified. The active application/UI task is **FISH112**, an icon-art refresh whose design selections are captured below but whose implementation has not begun.

## FISH112 — cross-platform fixed card icons

### Problem and implementation intent

Most current Home/My Gear/Knowledge Base card icons are raw Unicode emoji. That makes the artwork platform-dependent: Windows and Android render the same characters using different emoji sets.

The approved FISH112 direction is to replace those OS-dependent glyphs with bundled fixed artwork so every platform renders the same icon. This must be a **small visual change**:

- preserve the existing Fishing Companion page layouts, card geometry, spacing, labels, search/Back controls, and navigation;
- keep the icons at roughly the current small emoji/card scale and position rather than turning them into large illustrated tiles;
- do not adopt the scenic headers, mobile bottom navigation, enlarged cards, or other UI concepts that appeared in exploratory image-generation mockups;
- use fixed asset files rather than relying on a particular installed emoji font;
- verify source licenses/attribution before bundling Google/Noto, Fluent, Twemoji, or adapted artwork.

The AI-generated mockups from the design conversation are visual references only and are not production assets.

### Approved My Gear icon set

The user explicitly approved the final My Gear direction:

- **Rods & Reels:** Google/Android rod-and-reel artwork.
- **Line:** a spool with a **dark red/orange spool** and **clear/white-ish line**. Do not use the earlier light-blue or green spool treatments.
- **Weights:** silver/gray teardrop sinker.
- **Snaps & Swivels:** silver **barrel swivel only**; avoid a snap-swivel or generic chain-link look.
- **Hooks:** Twitter/Twemoji-style simple hook shape, **silver**, with no odd crossbar through the middle.
- **Lures:** crankbait in a **Sexy Shad-style** color pattern rather than blue.
- **Bait:** Fluent-style worm.
- **Equipment:** Fluent-style kayak at an oblique angle, **light blue**, with a **paddle**.

The final My Gear mockup was approved as the target visual balance: small icons, varied color, and no over-use of light blue or gray.

### Approved Knowledge Base icon set

The actual KB root has exactly five category cards. There is **no Tackle card** on the live KB root.

- **Locations:** retain the Google/Android pushpin seen on the user's Android app: a **round red head with a pale blue/gray needle/stem**. Do not substitute a teardrop map-location pin or folded-map icon.
- **Species:** side-view **rainbow trout**.
- **Techniques:** **compass** icon. Do not reuse the lure icon and do not use the angler/fly-casting mockup.
- **Knots:** Google/Android **blue rope knot** selected from the Android/Fluent/Windows comparison.
- **Gear Guides:** open book with light pages and blue backing/edge.

### Approved Home icon set

Keep the existing live Home layout and card text. Only change the icons:

- **My Gear:** tackle box.
- **Knowledge Base:** stack of **three plain books** with no text on the spines; the preferred mockup used green/blue/orange book colors. It must remain visually distinct from the Gear Guides open-book icon.
- **Catch Log:** jumping **largemouth bass** with a lure in its mouth and fishing line extending from the lure.

### FISH112 implementation status

**Status: OPEN / design selected, implementation pending.** No production icon assets, runtime code, CSS, or tests have been changed for FISH112 yet.

Implementation will touch non-content application/UI assets and therefore uses **Full Application Release**, not FISH108 Fast Content Release. The next unused application/architecture ID after FISH112 is **FISH-TODO-113**.

## FISH111 — shared layout alignment

FISH111 is complete and production-verified. Fishing Companion now uses one shared horizontal content grid:

- the site-header brand/connection control and main page content share the same left/right content insets;
- desktop preserves the 24 px content inset and mobile preserves the existing 16 px inset;
- long-form Notes/Markdown sections no longer use the former 900 px section cap or 78ch Markdown cap and instead extend through the full main-content width;
- intentionally narrower pictures, details tables, editor forms, and other component-specific layouts retain their separate caps.

## Recent canonical content state relevant to this chat

Routine content releases completed before/within this handoff are already canonical and need no follow-up release paperwork:

- **Banks Lake** exists as a KB/Location and has its representative Steamboat Rock State Park picture.
- **Electronics Research** exists as a My Gear/Equipment research entry. Its five inline local PNG references on current `main` use `%20`-encoded spaces and therefore match the Markdown parser's expected link syntax.

Do not create per-item handoff documents for these routine content releases; Git history and current canonical source are authoritative.

## Current KB editorial architecture

### Behavior / Habitat vs Techniques

For both bass and trout, broad references have intentionally different purposes:

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat**: where fish are likely to be and why. They own enduring location drivers such as habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth, waterbody type, and pattern recognition.
- **Bass Fishing Techniques** / **Trout Fishing Techniques**: how to catch fish once located. They own presentation choice, lure/bait/rig selection, retrieve/cadence, depth control, strike handling, bank/kayak execution, and broad species-specific tactics.

Do not duplicate full seasonal playbooks across those pages. A brief seasonal routing summary is appropriate; detailed seasonal location + presentation strategy belongs in the seasonal pages.

### Four-season fishing references

The authoritative seasonal playbooks are:

- Spring Fishing
- Summer Fishing
- Fall Fishing
- Winter Fishing

They cover both bass and trout and combine seasonal location changes with seasonal presentation strategy.

### Topwater reference

**Topwater Fishing** is the broad specialized surface-fishing reference. Narrow companion Gear Guides remain Frog, Popper, Whopper Plopper, Walking Bait, and Buzzbait.

### Cross-linking standard

Add curated `kb://` links where they materially help the reader. Do not mechanically link every occurrence of common terms.

### Retired/replaced live content

Do not reintroduce these as live canonical Technique pages unless explicitly requested:

- Bass Fishing
- Spring Bass Fishing
- Fall Bass Fishing
- Bass Power and Search Overview
- Color and Scent
- Paddle-only Kayak Strategy
- Seasonal Bass Guidance
- Water Visibility

Historical evidence may still mention them; preserve that evidence.

## FISH108 release model

Full policy: [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

### Fast Content Release

Use only when **every changed file** is canonical content beneath `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`.

Before mutation, restore current source/open PR state and validate package revision/ancestry, record hash/base fields, conflicts, IDs/schema/types/paths/references, notes/media actions, and supplied media metadata as applicable. Apply only requested changes; preserve unrelated/newer source and user-uploaded bytes. Normalize accidental trailing whitespace unless explicitly asked to preserve it.

Fast releases use one lightweight content PR, locked cached dependency installation, one canonical production build/source inventory validation, generated-release verification, exact-current-main deployment protection, and dependency-free hosted byte/release-identity verification.

Do not manually run full Node/browser/v1-cutover/dependency-audit/hosted-browser validation for content-only work unless a genuine non-content issue is discovered.

Routine Fast Content Releases do not consume an application task ID and do not require per-item project-state or production-closeout documents.

### Full Application Release

Any changed file outside the three content roots forces full. Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependency, workflow, migration/recovery/offline, or mixed content+code changes use the comprehensive full lane. If eligibility is ambiguous, use full.

### FISH109 and FISH110

FISH109 is complete/production-verified: deployment/evidence artifacts are run-attempt-specific and hosted verification has bounded retry/backoff while retaining the exact-current-main guard.

FISH110 is complete/production-verified: Gear/KB Add/Edit → **Copy Changes** uses centralized FISH108-aware handoff text and preserves a parseable blank-line boundary before JSON.

## Authoring rules and durable architecture

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes** and produces `fishing-companion-change-v2`; copying is not saving.
- GitHub upload links use physical `/pwa/...` source paths; package paths remain logical `Gear/...`, `KB/...`, and `Catches/...`.
- Simple Markdown-only narrative edits may be made directly; structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships should use the source-aware workflow.
- KB `description` has a schema maximum of 80 characters.
- Existing IDs stay stable unless intentionally retired/replaced.
- `.github/workflows/fishing-production.yml` is the sole active publisher.
- Fishing Companion keeps independent Gear, KB, and Catch domains. KB types are Location, Species, Equipment/Gear Guide, Technique, and Knot.

## Durable behavior retained

- **FISH091:** normal online use does not provision the complete offline library; **Connection Status → Update offline library** prepares/refreshes a verified generation.
- **FISH096:** Knot-only explicit ordered `pictureSequence`; physical frames under `pwa/KB/Knots/assets/<id>/`; explicit array requires at least two frames and `picture.src` is the representative/final frame. Directory contents alone never create a sequence.
- **FISH102:** Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- **FISH103:** external HTTP(S) links new-tab; internal links same-tab; physical authoring upload paths under `/pwa/...`; Caption focus and provisional new-KB Markdown Preview behavior retained.
- **FISH107:** Skylety Fishing Hook Sharpener canonical type is `Tools`.

Active Knot sequences remain Palomar, Albright, Arbor, Bowline, FG, Improved Clinch, Modified Uni, and Trilene; Non-Slip Loop remains static.

## Backlog and future phase

`FISH-TODO-005` remains **WAITING ON USER**; do not infer every fish-finder power component is installed.

`FISH-TODO-014` remains **OPEN**; do not infer the HyperSeal 3600 is the historical deep-box watch target without explicit confirmation.

The specialized content backlog remains open, including Texas Rig, Carolina Rig, Alabama Rig, Neko Rig, and Spoons.

**Fishing Companion v3** (historically `FISH-TODO-077/P2`) remains DEFERRED. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring, and multi-user generalization are not current production.

## Operating mode and new-chat protocol

Use **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, research/calculation-heavy, creates artifacts, or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the need and get explicit approval first.

When the user says **“It’s time to transfer to a new chat”** or equivalent, ask once to confirm the full handoff. Once confirmed, restore current `main`, open PRs and production evidence; reconcile completed and unresolved work; update durable records; preserve explicit purchase uncertainty; cross-check the authoritative files; and finish with a clickable link to `Fishing_New_Chat_Bootstrap_Prompt.md`.
