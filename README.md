# Fishing

Persistent Fishing project and source repository for Fishing Companion.

## Current continuation — September 18, 2026

`ginosega/fishing` is the durable source of truth. Fishing Companion remains a three-domain PWA (Gear, Knowledge Base, Catch) with canonical source under `pwa/Gear/`, `pwa/KB/`, and `pwa/Catches/`.

Always restore actual latest `main`, current open PRs, and the latest successful production evidence before relying on exact SHA/release/count values. Historical checkpoint identifiers in project Markdown are evidence only.

### September 18 production checkpoint

The latest verified hosted production at this handoff is the Fast Content Release for the Bass/Trout Fishing Techniques table-of-contents work:

- production source revision: `45b85250d4342326cfd0e103026f1cea7adcbea7`;
- implementation PR: #182;
- production workflow: #359 / run `35387318153`;
- hosted release: `5ad3a0a1bdb76b3c4827114de3ef07b8`;
- hosted counts: Gear 86 / KB 57 / Catch 6;
- hosted file count: 387;
- hosted byte/release-identity verification passed.

This exact production identity is a handoff checkpoint, not permanent truth. Documentation-only reconciliation may advance `main` without republishing the PWA.

## Current application state

### FISH114 — Android/Edge maskable launcher icon

FISH114 is **complete, production-verified, and user-verified**.

Android/Edge installs now receive a dedicated maskable launcher icon while the approved transparent `pwa/icon.png` source remains unchanged. The build generates `icon-maskable.png` with an opaque `#11665c` background and centered approved artwork, publishes both `any` and `maskable` manifest entries, and includes the generated maskable icon in release identity/verification.

Production closeout evidence:

- implementation PR: #179;
- production source revision: `771c80baa21fe17f331614f6658b5278475178ed`;
- Full Application workflow: #349 / run `35306208653`;
- hosted release: `9e9cc6e2f388439c1d745c0e74122c33`;
- full validation, Pages deployment, and actual hosted byte/browser verification passed;
- the user reinstalled/inspected the Android launcher result and confirmed it looks great.

Detailed closeout: [`pwa/docs/FISH114_Production_Closeout_2026-09-18.md`](pwa/docs/FISH114_Production_Closeout_2026-09-18.md).

### FISH113 — responsive scenic page heroes

FISH113 is **complete, production-verified, and user-verified**.

The Home, My Gear, and Knowledge Base root pages use scenic mountain/lake hero artwork with responsive art direction. Standard/narrow layouts use the 1536 × 512 `page-hero.png`; sufficiently wide landscape layouts use the 3072 × 512 `page-hero-wide.png`. The 3:1 asset is pixel-for-pixel the exact centered crop of the 6:1 master so the swap is visually seamless.

Production closeout evidence:

- final implementation PR: #173;
- production source revision: `fab438e2833b131204a5e4c29ab1685df0ae8fbf`;
- production workflow: #312 / run `35139240830`;
- hosted release: `6a1f85979ecabc197ec66368b9fe0a65`;
- hosted counts: Gear 82 / KB 57 / Catch 5;
- actual hosted byte/browser verification passed;
- the user subsequently inspected production and confirmed no further adjustments are needed.

Detailed closeout: [`pwa/docs/FISH113_Production_Closeout_2026-09-16.md`](pwa/docs/FISH113_Production_Closeout_2026-09-16.md).

### FISH112 — fixed cross-platform card icons

FISH112 is **complete, production-verified, and user-verified**.

The Home, My Gear, and Knowledge Base cards now use 16 bundled fixed transparent PNG icons instead of OS-dependent Unicode emoji, so Windows, Android, and other platforms render the same artwork. The existing card geometry, text, search/Back controls, routes, and navigation behavior were preserved.

Detailed closeout: [`pwa/docs/FISH112_Production_Closeout_2026-09-16.md`](pwa/docs/FISH112_Production_Closeout_2026-09-16.md).

The next unused application/architecture task ID is **FISH-TODO-115** unless newer `main` has already allocated it.

## Current KB editorial architecture

Broad references have deliberately different jobs:

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat**: where fish are and why — habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth, and pattern recognition.
- **Bass Fishing Techniques** / **Trout Fishing Techniques**: how to catch once located — presentation choice, lure/bait/rig selection, retrieves, depth control, strike handling, and bank/kayak execution.
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
- Same-page Markdown links must target the renderer's heading slug: lowercase, punctuation stripped, spaces changed to hyphens (for example `#kayak-fishing-and-electronics`), not percent-encoded original heading text.

## Backlog / future phase

Preserve purchase uncertainty. FISH-TODO-005 is resolved: the installed fish-finder power system was explicitly confirmed as Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and 22–18 AWG disconnects. `FISH-TODO-008` remains OPEN/back-ordered and is the user's #1 needed fishing equipment item; `FISH-TODO-014` remains OPEN. The specialized content backlog still includes Texas Rig, Carolina Rig, Alabama Rig, Neko Rig, and Spoons.

**Fishing Companion v3** (historically FISH-TODO-077/P2) remains DEFERRED and requires explicit approval before implementation. Deferred scope includes authentication, direct GitHub save/upload, integrated browser-side file/image uploads, offline authoring, an outbox/sync system for queued changes, Catch authoring, broader multi-user support, and making Markdown-content images clickable into the picture viewer. None of this is current production.

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