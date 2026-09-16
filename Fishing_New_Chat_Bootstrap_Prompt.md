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

## Checkpoint — September 16, 2026

At the FISH113 production closeout checkpoint:

- production source revision was `fab438e2833b131204a5e4c29ab1685df0ae8fbf`;
- final implementation PR was #173;
- production workflow was **#312**, run `35139240830`;
- hosted release ID was `6a1f85979ecabc197ec66368b9fe0a65`;
- hosted source-derived counts were Gear 82 / KB 57 / Catch 5;
- hosted file count was 380;
- Full Application Release validation, exact-current-main guard, GitHub Pages deployment, and actual hosted byte/browser verification all passed;
- one unrelated timing-sensitive WebKit offline-cache failure on the first production validation attempt passed on a targeted retry without a FISH113 code change;
- the user visually verified production and confirmed no further adjustments are needed;
- FISH113 is closed.

Treat those exact identifiers as historical checkpoint evidence only. Re-read actual current `main`, PR state and production evidence immediately.

There is no currently allocated open application task after FISH113. The next unused application/architecture task ID is **FISH-TODO-114** unless newer `main` has allocated it. Routine FISH108 Fast Content Releases do not consume application task IDs.

## FISH113 — completed responsive scenic page heroes

FISH113 is **IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED**.

Home, My Gear, and Knowledge Base root pages use scenic mountain/lake page-header artwork under `pwa/assets/page-hero/` while preserving existing page wording, cards, routes, search/Back behavior, and non-root headers.

The authoritative pair is:

- `page-hero.png` — 1536 × 512 (3:1), for standard/narrow layouts;
- `page-hero-wide.png` — 3072 × 512 (6:1), for sufficiently wide landscape layouts.

The 3:1 asset is pixel-for-pixel the exact centered crop of the 6:1 master. Preserve that invariant so crossing the responsive breakpoint remains visually seamless. Wide activation is based on viewport geometry, not physical display resolution. The superseded WebP hero is retired.

Detailed evidence: `pwa/docs/FISH113_Production_Closeout_2026-09-16.md`.

Do not reopen or redesign FISH113 unless I explicitly request a change.

## FISH112 — completed fixed cross-platform card icons

FISH112 is **IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED**.

Home, My Gear, and Knowledge Base navigation cards use 16 bundled user-approved transparent-with-shadow PNG assets under `pwa/assets/card-icons/` rather than OS-dependent Unicode emoji. The existing card geometry, text, search/Back controls, routes, navigation behavior, and small icon scale were preserved.

Detailed evidence: `pwa/docs/FISH112_Production_Closeout_2026-09-16.md`.

## Recent routine content state

Recent content releases are canonical and do not require new closeout work merely because this is a new chat. Current source includes, among other work:

- Banks Lake as a KB/Location with its representative picture removed while preserving the page and its two inline Steamboat Rock images;
- Electronics Research as a My Gear/Equipment research entry with `%20`-encoded local image paths;
- the September 14–15 broad Technique restructuring, four-season pages, Topwater expansion and curated cross-link pass;
- Berkely Trilene XL as a Gear/Line item.

Git history and current canonical source are authoritative for routine content releases.

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

The authoritative seasonal pages are Spring Fishing, Summer Fishing, Fall Fishing, and Winter Fishing. Each covers both bass and trout and combines seasonal location changes with seasonal presentation strategy.

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

### FISH109 / FISH110 / FISH111

FISH109 is complete/production-verified: deployment/evidence artifacts are run-attempt-specific, hosted verification has bounded retry/backoff, and exact-current-main protection remains mandatory.

FISH110 is complete/production-verified: Gear/KB Add/Edit → **Copy Changes** uses centralized FISH108-aware instruction text. Eligible content-only packages explicitly route through Fast Content Release. The human instruction and JSON are separated by a blank line so JSON remains parseable.

FISH111 is complete/production-verified: the site header and page body share the same horizontal content insets, and long-form Notes/Markdown uses the full main content width while intentionally narrower components keep their separate caps.

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