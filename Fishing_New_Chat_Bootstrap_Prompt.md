You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from actual latest `main` before acting; do not rely on an old chat or assume a previously observed commit/release is still current.

## Operating mode

Use Chat mode by default and permanently. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, requires research/calculations, creates artifacts, or involves substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain my approval first, then return to Chat.

## First actions

Read these files from actual latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before repository work, also confirm current open-PR state. Newer repository/production evidence controls over stale chat descriptions. When an exact current production SHA/release ID/count is needed, inspect the latest successful `main` production workflow and deployed `release.json`/hosted verification evidence; do not treat an older value copied into Markdown as current.

## Handoff checkpoint — September 15, 2026

At the handoff that produced this prompt:

- `main` was `e55dcf4a3ab01f67a3f201fc5b7416bf3bc82c4c`;
- there were no open PRs;
- latest successful production workflow was **#293**, run `35058248540`;
- its hosted-verification artifact reported release `7d4c4f116c4a4830e8a69efdbf51c392` from that exact source revision;
- source-derived hosted counts were Gear 81 / KB 57 / Catch 5;
- FISH111 was fully production-verified.

Treat all of those exact identifiers as historical checkpoint evidence only. Re-read actual current `main`, PR state and production evidence immediately.

The active application/UI task at handoff is **FISH112 — fixed cross-platform card icons**. Its design is selected but it has **not been implemented**. That is likely the next work to continue unless I ask for something else.

## FISH112 — critical continuation state

### Goal

Most current Home/My Gear/Knowledge Base card icons are raw Unicode emoji, so Windows and Android show different artwork. Replace those OS-dependent glyphs with **bundled fixed icon assets** so the artwork is consistent across platforms.

This is deliberately a small visual change. Preserve the current live Fishing Companion layouts, card geometry, text, search/Back controls, navigation, and roughly the current small icon size/placement. Do **not** treat the exploratory image-generation mockups as approval for scenic headers, enlarged tiles/cards, bottom navigation, or other layout redesigns.

The mockups are references only, not production assets. Before bundling third-party-derived artwork, verify licensing/attribution for Google/Noto, Microsoft Fluent, Twemoji, or any adapted source. Prefer scalable fixed assets such as SVG where practical.

### Approved My Gear icons

The user explicitly approved this set:

- **Rods & Reels:** Google/Android rod-and-reel artwork.
- **Line:** spool with a **dark red/orange spool** and **clear/white-ish line**.
- **Weights:** silver/gray teardrop sinker.
- **Snaps & Swivels:** silver **barrel swivel only**; not a snap swivel and not a generic chain-link icon.
- **Hooks:** Twitter/Twemoji-style simple hook, **silver**, with no bar/crossbar through its middle.
- **Lures:** crankbait in a **Sexy Shad-style** color pattern.
- **Bait:** Fluent-style worm.
- **Equipment:** Fluent-style kayak at an oblique angle, **light blue**, with a **paddle**.

The approved target keeps the icons small and avoids overusing light blue or gray.

### Approved Knowledge Base icons

The live KB root has exactly **five** category cards. There is **no Tackle card** on the KB root.

- **Locations:** Google/Android pushpin exactly in the Android direction the user supplied: **round red head with a pale blue/gray needle/stem**. Do not substitute a teardrop map-location pin, folded-map icon, or another pin shape.
- **Species:** side-view **rainbow trout**.
- **Techniques:** **compass**. Do not reuse the My Gear lure icon and do not use an angler/fly-casting figure.
- **Knots:** Google/Android **blue rope knot** selected from the Android/Fluent/Windows comparison.
- **Gear Guides:** open book with light pages and blue backing/edge.

### Approved Home icons

Keep the current live Home layout and text; only replace icons:

- **My Gear:** tackle box.
- **Knowledge Base:** stack of **three plain unlabeled books**, preferably green/blue/orange; no text on the spines. This icon must be visually distinct from the Gear Guides open-book icon.
- **Catch Log:** jumping **largemouth bass** with a lure in its mouth and fishing line extending from the lure.

### FISH112 status/release lane

FISH112 is **OPEN / design selected / implementation pending**. No runtime icon assets, CSS, application code or tests have been changed for it yet.

Because implementation changes application/UI assets outside `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`, it requires the **Full Application Release** lane. FISH112 is already allocated; the next unused application/architecture task ID is **FISH-TODO-113** unless newer `main` has allocated it.

## FISH111 — completed immediately before FISH112 design

FISH111 is complete and production-verified. The site header and page body share the same horizontal content insets, and long-form Notes/Markdown extends through the full main-content width. Desktop retains the 24 px content inset and mobile retains the 16 px inset. Intentional narrower caps for pictures, detail tables, and editor forms remain unchanged.

## Recent routine content state

Recent content releases are already canonical and do not require new closeout work merely because this is a new chat:

- **Banks Lake** exists as a KB/Location and has its Steamboat Rock State Park representative picture.
- **Electronics Research** exists as a My Gear/Equipment research entry. Current `main` uses `%20`-encoded spaces in its five local inline PNG Markdown references.
- The September 14–15 broad Technique restructuring, four-season pages, Topwater expansion and curated cross-link pass are complete.

## Current KB editorial architecture — critical

### Behavior and Habitat

- **Bass Behavior and Habitat**
- **Trout Behavior and Habitat**

These answer **where fish are and why**: habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth, waterbody type and repeatable-pattern logic.

### Fishing Techniques

- **Bass Fishing Techniques**
- **Trout Fishing Techniques**

These answer **how to catch fish once located**: presentation choice, lure/bait/rig selection, retrieves/cadence, depth control, strike handling, bank/kayak execution and broad species-specific tactics.

Do not rebuild long seasonal mini-guides inside the Behavior/Habitat or broad Techniques pages. Detailed seasonal strategy belongs in the season pages.

### Seasonal playbooks

The authoritative seasonal pages are:

- Spring Fishing
- Summer Fishing
- Fall Fishing
- Winter Fishing

Each covers both bass and trout and combines seasonal location changes with seasonal presentation strategy.

### Topwater

**Topwater Fishing** is the broad specialized surface-fishing reference. Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower companion Gear Guides.

### Linking standard

Use curated `kb://` links where they materially help the reader. Do not mechanically link every occurrence of common terms.

### Retired live Technique pages

Do not reintroduce these unless explicitly requested:

- Bass Fishing
- Spring Bass Fishing
- Fall Bass Fishing
- Bass Power and Search Overview
- Color and Scent
- Paddle-only Kayak Strategy
- Seasonal Bass Guidance
- Water Visibility

Historical evidence may still mention them; preserve that history.

## FISH108 release policy — critical

Full policy: `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release

Use only when **every changed file** is canonical content under one or more of:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

This is the normal path for source-aware `fishing-companion-change-v2` Gear/KB add/edit packages, Markdown, pictures, Knot sequence frames and Catch records.

Before mutation, restore current source/open PR state and validate source revision/ancestry, record hash/base fields where applicable, conflict state, IDs/schema/types/paths/references, notes/media actions and supplied media metadata. Apply only requested changes and preserve unrelated/newer source and user-uploaded bytes. Normalize accidental trailing whitespace unless explicitly asked not to.

Use one lightweight content PR, locked cached dependencies, one canonical production build/source inventory validation, generated-release verification, exact-current-main deployment guard and dependency-free byte-for-byte hosted/release-identity verification.

Do not manually escalate content-only work to full Node/browser/v1-cutover/dependency-audit/hosted-browser validation unless a genuine non-content issue is discovered.

Routine Fast Content Releases do **not** consume an application task ID and do **not** require per-item project-state or production-closeout Markdown.

### Full Application Release

Any changed file outside the three content roots forces full. Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture and mixed content+code work use the full suite. Manual workflow dispatch is full. If eligibility is ambiguous, use full.

### FISH109 / FISH110

FISH109 is complete/production-verified: deployment/evidence artifacts are run-attempt-specific, hosted verification has bounded retry/backoff, and exact-current-main protection remains mandatory.

FISH110 is complete/production-verified: Gear/KB Add/Edit → **Copy Changes** uses centralized FISH108-aware instruction text. Eligible content-only packages explicitly route through Fast Content Release. The human instruction and JSON are separated by a blank line so JSON remains parseable.

## Authoring constraints and durable application behavior

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**; copying is not saving and the browser does not write GitHub source directly.
- GitHub upload links target physical `/pwa/...`; packages use logical `Gear/...`, `KB/...`, `Catches/...` paths.
- KB `description` maximum is **80 characters**.
- Existing IDs stay stable unless intentionally retired/replaced.
- Simple Markdown-only narrative edits may be direct; structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships should use the source-aware workflow.
- Preserve unrelated concurrent changes and user-uploaded bytes; reconcile newer `main` before merge if it advances.
- `.github/workflows/fishing-production.yml` is the sole active publisher.

FISH091: normal online use does not provision the complete offline library; **Connection Status → Update offline library** explicitly prepares/refreshes a verified generation.

FISH096: Knot-only explicit ordered `pictureSequence`; frames live under `pwa/KB/Knots/assets/<id>/`; at least two frames; `picture.src` is final/representative; directory contents alone never create a sequence.

FISH102: Line-Tackle-Knot Reference is pinned first only on KB → Knots.

FISH103: external HTTP(S) links open new-tab; internal app/local links remain same-tab; authoring upload links use physical `/pwa/...`; Caption focus and new-KB Markdown Preview behavior retained.

FISH107: current canonical Skylety Fishing Hook Sharpener type is `Tools`.

## Backlog / future state

`FISH-TODO-005` remains WAITING ON USER; do not infer every fish-finder power component is installed.

`FISH-TODO-014` remains OPEN; do not infer FISH105's HyperSeal 3600 is the historical deep-box watch target without explicit confirmation.

The specialized content backlog remains open, including Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons.

**Fishing Companion v3** (historically FISH-TODO-077/P2) remains DEFERRED. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production.

## Chat-transfer convention

For this project, **“It’s time to transfer to a new chat”** is the standard transfer cue. Ask once to confirm the full handoff. After confirmation, execute it end-to-end without repeated “Proceed” prompts: restore actual current `main`, open PRs and production evidence; reconcile completed and unresolved work; update authoritative records where durable state changed; preserve purchase uncertainty; cross-check the files; and finish with a clickable GitHub link to this bootstrap prompt.

## Working rules

- Use current GitHub source as authority.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- Fishing Companion change packages are implementation instructions, not JSON merely to explain.
- Do not infer purchases/ownership or close WAITING/open purchase items without sufficient user confirmation.
- Historical milestone docs and old production identities are evidence only; current exact production state comes from current GitHub/Pages evidence.
