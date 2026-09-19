# Fishing Context

## Current authoritative state — September 18, 2026

`ginosega/fishing` is the durable source of truth. Restore actual current `main` and current open-PR state before implementation/release/repository-write work; do not rely on a previously observed commit as though it is still current.

For exact production identity, inspect the latest successful `main` production workflow plus the deployed `release.json`/hosted verification evidence. Exact SHA/release/count values recorded below are a checkpoint, not permanent future truth.

### Current production checkpoint

The latest verified hosted production at this handoff is the Fast Content Release for the Bass/Trout Fishing Techniques table-of-contents work.

- production source revision: `45b85250d4342326cfd0e103026f1cea7adcbea7`
- implementation PR: #182
- production workflow: **#359** / run `35387318153`
- hosted release ID: `5ad3a0a1bdb76b3c4827114de3ef07b8`
- hosted source-derived counts: Gear 86 / KB 57 / Catch 6
- hosted file count: 387
- release lane: Fast Content Release
- exact-current-main deployment guard: passed
- GitHub Pages deployment: passed
- hosted byte/release-identity verification: passed

This is a handoff checkpoint. Documentation-only reconciliation may advance `main` without republishing the PWA; always inspect current production evidence when exact identity matters.

FISH114 is the latest completed application/architecture change. The next unused application/architecture task ID is **FISH-TODO-115** unless newer `main` has allocated it.

## FISH114 — Android/Edge maskable launcher icon

**Status: IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED.**

FISH114 fixes Android/Edge adaptive-icon presentation for installed Fishing Companion shortcuts without changing the approved transparent source icon.

Durable implementation result:

- `pwa/icon.png` remains the approved transparent source and is unchanged;
- the production build generates an opaque `icon-maskable.png` from that artwork;
- generated maskable background is `#11665c`;
- approved artwork is trimmed/resized and centered within the maskable canvas;
- the web manifest publishes both `purpose: "any"` and `purpose: "maskable"` icon entries;
- the generated maskable icon participates in release identity and verification;
- regression coverage checks manifest shape, exact preservation of the ordinary source icon, maskable dimensions/background/opacity, and distinction between the two outputs.

Production closeout:

- implementation PR: #179
- production source revision: `771c80baa21fe17f331614f6658b5278475178ed`
- Full Application workflow: **#349** / run `35306208653`
- hosted release: `9e9cc6e2f388439c1d745c0e74122c33`
- hosted counts at that release: Gear 85 / KB 57 / Catch 6
- hosted file count at that release: 386
- full validation, Pages deployment, and actual hosted byte/browser verification passed
- the user visually inspected the installed Android result and confirmed it looks great

Detailed closeout: [`pwa/docs/FISH114_Production_Closeout_2026-09-18.md`](pwa/docs/FISH114_Production_Closeout_2026-09-18.md).

## FISH113 — responsive scenic page heroes

**Status: IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED.**

FISH113 adds scenic mountain/lake hero artwork to the Home, My Gear, and Knowledge Base root pages while preserving existing page wording, cards, routes, search/Back behavior, and non-root headers.

Durable implementation result:

- authoritative assets live under `pwa/assets/page-hero/`;
- `page-hero.png` is 1536 × 512 (3:1);
- `page-hero-wide.png` is 3072 × 512 (6:1);
- the 3:1 asset is pixel-for-pixel the exact centered crop of the 6:1 master;
- standard/narrow layouts use the 3:1 asset;
- sufficiently wide landscape layouts use the 6:1 asset via geometry-based responsive behavior rather than display-resolution detection;
- regression coverage protects dimensions, filenames, CSS references, and the exact centered-crop relationship;
- the superseded WebP hero asset was removed.

The final production release was visually inspected by the user and accepted with no further adjustments requested.

## FISH112 — fixed cross-platform card icons

**Status: IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.**

FISH112 replaced OS-dependent Unicode emoji card icons with 16 user-approved bundled transparent-with-shadow PNG assets for the existing Home, My Gear, and Knowledge Base cards.

Durable implementation result:

- assets live under `pwa/assets/card-icons/`;
- card geometry, labels, search/Back controls, routes, and navigation behavior remain unchanged;
- icons render at the existing small card-icon scale;
- the production build copies the icon bytes into each content-addressed release;
- release identity/manifest verification includes the icon assets;
- regression coverage checks the exact 16-file set, PNG transparency, card mappings, production-build byte preservation, and manifest inclusion.

Final icon mapping:

- **Home:** My Gear = red/cream tackle box; Knowledge Base = three colorful stacked books; Catch Log = leaping largemouth bass.
- **Knowledge Base:** Locations = red pushpin; Species = largemouth bass; Techniques = compass; Knots = blue rope knot; Gear Guides = open book.
- **My Gear:** Rods & Reels = blue rod/reel; Line = red spool; Weights = metallic teardrop sinker; Snaps & Swivels = barrel swivel; Hooks = silver hook; Lures = green/gold crankbait; Bait = pink worm; Equipment = blue kayak with paddle.

The generated final assets—not earlier conceptual third-party-style references—are authoritative for the live implementation.

## FISH111 — shared layout alignment

FISH111 remains complete and production-verified. Fishing Companion uses one shared horizontal content grid:

- the site-header brand/connection control and main page content share the same left/right content insets;
- desktop preserves the 24 px content inset and mobile preserves the existing 16 px inset;
- long-form Notes/Markdown sections extend through the full main-content width;
- intentionally narrower pictures, details tables, editor forms, and other component-specific layouts retain their separate caps.

## Recent canonical content state

Routine FISH108 content releases are canonical and do not require per-item closeout documentation. Current source includes, among other recent work:

- Banks Lake KB/Location with its representative picture removed while preserving its Markdown and two inline Steamboat Rock images;
- Electronics Research in My Gear/Equipment with `%20`-encoded local image paths;
- September 14–15 Technique restructuring, four-season pages, Topwater expansion and curated cross-links;
- Berkely Trilene XL as a Gear/Line record;
- Canyon Insulated Fish Bag and BaitPop Elite Crawfish Red Scent;
- Lucas Fishing Reel Oil as Gear/Equipment/Tools;
- the September 17 Lake Sammamish largemouth Catch record;
- Strike King KVD Square Bill 1.0 specifications updated with 1/4 oz weight and #5 hook size;
- Berkely Warpig as a Gear/Lure record;
- Bass Fishing Techniques with corrected same-page heading anchors and Trout Fishing Techniques with a matching table of contents.

Git history and current canonical source are authoritative for routine content releases.

## Current KB editorial architecture

### Behavior / Habitat vs Techniques

For both bass and trout, broad references intentionally have different purposes:

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat**: where fish are likely to be and why. They own enduring location drivers such as habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth, waterbody type, and pattern recognition.
- **Bass Fishing Techniques** / **Trout Fishing Techniques**: how to catch fish once located. They own presentation choice, lure/bait/rig selection, retrieve/cadence, depth control, strike handling, bank/kayak execution, and broad species-specific tactics.

Detailed seasonal location + presentation strategy belongs in the seasonal pages rather than being duplicated across those broad references.

### Four-season fishing references

The authoritative seasonal playbooks are Spring Fishing, Summer Fishing, Fall Fishing, and Winter Fishing. They cover both bass and trout and combine seasonal location changes with seasonal presentation strategy.

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

FISH109 remains complete/production-verified: deployment/evidence artifacts are run-attempt-specific and hosted verification has bounded retry/backoff while retaining the exact-current-main guard.

FISH110 remains complete/production-verified: Gear/KB Add/Edit → **Copy Changes** uses centralized FISH108-aware handoff text and preserves a parseable blank-line boundary before JSON.

## Authoring rules and durable architecture

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes** and produces `fishing-companion-change-v2`; copying is not saving.
- GitHub upload links use physical `/pwa/...` source paths; package paths remain logical `Gear/...`, `KB/...`, and `Catches/...`.
- Simple Markdown-only narrative edits may be made directly; structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships should use the source-aware workflow.
- KB `description` has a schema maximum of 80 characters.
- Existing IDs stay stable unless intentionally retired/replaced.
- Same-page Markdown heading links must use the renderer-generated slug: lowercase, punctuation stripped, spaces collapsed to hyphens; for example `## Kayak Fishing and Electronics` is targeted by `#kayak-fishing-and-electronics`. Do not use percent-encoded original heading text as the anchor.
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

`FISH-TODO-005` is **RESOLVED**: the user explicitly confirmed the installed fish-finder power system as Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and 22–18 AWG disconnects.

`FISH-TODO-014` remains **OPEN**; do not infer the HyperSeal 3600 is the historical deep-box watch target without explicit confirmation.

The specialized content backlog remains open, including Texas Rig, Carolina Rig, Alabama Rig, Neko Rig, and Spoons.

**Fishing Companion v3** (historically `FISH-TODO-077/P2`) remains DEFERRED and requires explicit approval before implementation. Deferred scope includes authentication, direct GitHub save/upload, integrated browser-side file/image uploads, offline authoring, an outbox/sync system for queued changes, Catch authoring, broader multi-user support, and making pictures embedded in content Markdown clickable into the existing picture viewer. None of this is current production.

### Current kayak-specific open work

The active backlog includes RVR119 Under Seat Tackle Storage (back-ordered/#1 equipment need), NRS ATB Wetshoe, NRS Champion Jacket/Bib, bow-hatch tie-offs, **Remount outer rod holders** (FISH-TODO-038), and **Apply T-9 on kayak hardware** (FISH-TODO-039). FISH-TODO-030 was explicitly deleted and must not be restored.

## Operating mode and new-chat protocol

Use **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, research/calculation-heavy, creates artifacts, or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the need and get explicit approval first.

When the user says **“It’s time to transfer to a new chat”** or equivalent, ask once to confirm the full handoff. Once confirmed, restore current `main`, open PRs and production evidence; reconcile completed and unresolved work; update durable records; preserve explicit purchase uncertainty; cross-check the authoritative files; and finish with a clickable link to `Fishing_New_Chat_Bootstrap_Prompt.md`.