# Fishing TODO

## Current project task state — September 18, 2026

### Application / architecture state

**FISH-TODO-108 — IMPLEMENTED / release-policy change.** FISH108 establishes the approved two-lane Fishing Companion release model:

- **Fast Content Release** for routine canonical changes confined to `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`.
- **Full Application Release** for runtime/UI/assets, schema/contracts, tests, tooling/build, dependencies, workflow, migration/recovery/offline, or mixed content+non-content changes.

The durable policy is [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md). Routine Fast Content Releases do not consume an application/architecture task ID and do not require per-item project-state or production-closeout documentation.

**FISH-TODO-109 — IMPLEMENTED / PRODUCTION-VERIFIED / release-retry hardening.** FISH109 makes Pages deployment reruns safe with run-attempt-specific Pages/hosted-evidence artifacts and bounded retry/backoff for transient hosted-verification failures. Exact-current-main protection remains mandatory.

**FISH-TODO-110 — IMPLEMENTED / PRODUCTION-VERIFIED / Copy Changes release routing.** Fishing Companion Add/Edit → Copy Changes uses centralized FISH108-aware handoff text. Eligible content-only packages explicitly use one Fast Content Release PR with lightweight validation/build, merge, production deployment and hosted byte/release-identity verification.

**FISH-TODO-111 — IMPLEMENTED / PRODUCTION-VERIFIED / shared page layout alignment.** The site header and page body share the same horizontal content inset, and long-form Notes/Markdown uses the full main content width through the right-side page margin. Mobile preserves the same rule with its existing 16 px inset.

**FISH-TODO-112 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / fixed cross-platform card icons.** The Home, My Gear, and Knowledge Base cards use 16 bundled transparent PNG assets instead of OS-dependent Unicode emoji while preserving existing card layout, labels, routes, search/Back controls, and navigation. Closeout: [`pwa/docs/FISH112_Production_Closeout_2026-09-16.md`](pwa/docs/FISH112_Production_Closeout_2026-09-16.md).

**FISH-TODO-113 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / responsive scenic page heroes.** Home, My Gear, and Knowledge Base root pages use the final scenic hero pair under `pwa/assets/page-hero/`: 1536 × 512 `page-hero.png` for standard/narrow layouts and 3072 × 512 `page-hero-wide.png` for sufficiently wide landscape layouts. The 3:1 asset is pixel-for-pixel the exact centered crop of the 6:1 master. Final implementation PR #173 deployed through Full Application Release workflow #312 / run `35139240830`; hosted release `6a1f85979ecabc197ec66368b9fe0a65` from source `fab438e2833b131204a5e4c29ab1685df0ae8fbf` passed actual hosted byte/browser verification. The user visually verified production and confirmed no further adjustments are needed. Closeout: [`pwa/docs/FISH113_Production_Closeout_2026-09-16.md`](pwa/docs/FISH113_Production_Closeout_2026-09-16.md).

**FISH-TODO-114 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / Android maskable launcher icon.** The approved transparent `pwa/icon.png` remains unchanged; the build generates an opaque `icon-maskable.png` with `#11665c` background, publishes ordinary + maskable manifest entries, and includes both outputs in release verification. PR #179 deployed through Full Application workflow #349 / run `35306208653` from source `771c80baa21fe17f331614f6658b5278475178ed`; hosted release `9e9cc6e2f388439c1d745c0e74122c33` passed full hosted verification. The user visually verified the installed Android result. Closeout: [`pwa/docs/FISH114_Production_Closeout_2026-09-18.md`](pwa/docs/FISH114_Production_Closeout_2026-09-18.md).

FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture task ID is **FISH-TODO-115**.

**Fishing Companion v3** — historically `FISH-TODO-077/P2` — remains **DEFERRED** and requires explicit approval before implementation. Deferred scope includes authentication, direct saving to GitHub, integrated browser-side file/image uploads, offline authoring, a queued-change outbox/sync system, Catch authoring, broader multi-user support, and clickable content-Markdown pictures that open in the existing picture viewer. None of this is current production.

### Recent content work completed — no application task IDs consumed

Recent routine FISH108 content work is complete/canonical and does not need new application IDs or closeout docs. Current source includes the Banks Lake representative-picture removal while preserving the page and inline images, Electronics Research, the September 14–15 Technique restructuring/Topwater/cross-link work, Berkely Trilene XL, the Canyon Insulated Fish Bag, BaitPop Elite Crawfish Red Scent, Lucas Fishing Reel Oil, the September 17 Lake Sammamish Catch, updated Strike King KVD Square Bill specifications, Berkely Warpig, and working Bass/Trout Fishing Techniques tables of contents.

The broad Technique redesign does **not** close the separate rig/specialty-page backlog below. Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons remain open.

Changing Gear/KB/Catch item counts, canonical path totals and reference totals are source-derived state, not hand-maintained test baselines.

## Existing fishing, equipment and content backlog

Preserve explicit purchase uncertainty; do not infer ownership or completion without user confirmation.

User responses applied September 16, 2026: the installed fish-finder power system is confirmed as Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and 22–18 AWG disconnects (resolving FISH-TODO-005); FISH-TODO-006 is no longer needed; FISH-TODO-007 is complete; FISH-TODO-009 is resolved because the Canyon fish bag was purchased instead; FISH-TODO-010 is no longer needed; PowerBait still-rig hook size is resolved as #4 (FISH-TODO-017); the non-slip loop knot is accepted (FISH-TODO-018); and FISH-TODO-032, -033 and -034 are no longer needed. These resolved items are removed from the active table below.

The RVR119 Under Seat Tackle Storage has **not** been purchased, remains on back-order, and is the user's **#1 needed fishing equipment item**. FISH-TODO-008 therefore remains active as an acquisition item rather than a purchase-confirmation question.

FISH105 adds a KastKing HyperSeal Waterproof Tackle Box in size 3600, but the supplied package does **not** explicitly identify that item as the specific “KastKing 3600 deep box” target in FISH-TODO-014. Preserve FISH-TODO-014 as OPEN unless the user explicitly resolves that backlog item.

Kayak-maintenance updates applied September 18, 2026: FISH-TODO-030 was explicitly deleted; FISH-TODO-038 is now **Remount outer rod holders**; and FISH-TODO-039 is **Apply T-9 on kayak hardware**.

| ID | Priority | Status | Work item |
|---|---|---|---|
| FISH-TODO-008 | P2 | OPEN | Purchase RVR119 Under Seat Tackle Storage when available; currently back-ordered and the user's #1 needed fishing equipment item. |
| FISH-TODO-011 | P2 | OPEN | Buy/consider bullet weights for Texas rigs/Rage Craw. |
| FISH-TODO-012 | P2 | OPEN | Buy/consider 1/8 oz weighted EWG hooks for Power Jerk Shad/depth control. |
| FISH-TODO-013 | P2 | OPEN | Buy/consider Carolina Keepers as slip-sinker alternative. |
| FISH-TODO-014 | P3 | OPEN | Watch for KastKing 3600 deep box. |
| FISH-TODO-015 | P3 | OPEN | Buy/consider Berkley Warpig, 1/2 oz, 3 in, Blue Shad. |
| FISH-TODO-019 | P2 | OPEN | Build Texas Rig KB page. |
| FISH-TODO-020 | P3 | OPEN | Build Carolina Rig KB page. |
| FISH-TODO-021 | P3 | OPEN | Build Alabama Rig KB page. |
| FISH-TODO-022 | P3 | OPEN | Build Neko Rig KB page using historical seed references and complete authored article. |
| FISH-TODO-023 | P3 | OPEN | Build Spoons KB page. |
| FISH-TODO-024 | P3 | OPEN | Research Lake Bosworth bass. |
| FISH-TODO-025 | P3 | OPEN | Visit/check Holiday Sports in Burlington. |
| FISH-TODO-026 | P3 | OPEN | Research/join fishing club. |
| FISH-TODO-027 | P2 | OPEN | Buy/consider NRS ATB Wetshoe size 11. |
| FISH-TODO-028 | P2 | OPEN | Buy/consider NRS Champion Jacket and Bib, with neoprene cuffs, waterproof zipper and articulated hood requirements. |
| FISH-TODO-029 | P2 | OPEN | Determine bow-hatch item tie-offs, including tool bag/bilge pump. |
| FISH-TODO-031 | P3 | OPEN | Listen/watch Science of the Strike episodes 8 and 16 (dissolved oxygen/turbidity). |
| FISH-TODO-037 | P3 | DEFERRED | Fishing Companion v3 requirements; implementation requires explicit approval: authentication, direct saving to GitHub, integrated browser-side file/image uploads, offline authoring, queued-change outbox/sync, Catch authoring, broader multi-user support, and clickable content-Markdown pictures that open in the existing picture viewer. |
| FISH-TODO-038 | P2 | OPEN | Remount outer rod holders. |
| FISH-TODO-039 | P2 | OPEN | Apply T-9 on kayak hardware. |

## Continuation rules

Use Chat mode by default. Restore actual latest `main` and current open-PR state before repository work.

For routine source-aware Gear/KB/Catch authoring, use the FISH108 Fast Content Release policy and do not allocate FISH-TODO-115. Allocate FISH-TODO-115 only for the next new application/architecture-level task unless newer `main` has already allocated it.

Do not reopen completed FISH096–FISH114 or Fishing Companion v3 work without an explicit new user request.

When the user says **“It’s time to transfer to a new chat”**, ask once for confirmation of the full handoff. After confirmation, reconcile current repository/production state, update authoritative records where durable state changed, preserve unresolved work and purchase uncertainty, cross-check the files, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.
