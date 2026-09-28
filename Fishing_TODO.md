# Fishing TODO

## Current project task state — September 28, 2026

### Application / architecture state

- **FISH-TODO-108 — IMPLEMENTED.** Two-lane release policy: Fast Content Release for routine canonical Gear/KB/Catch content, Full Application Release for application/runtime/tooling/schema/workflow changes.
- **FISH-TODO-109 — IMPLEMENTED / PRODUCTION-VERIFIED.** Run-attempt-safe Pages/evidence artifacts and hosted-verification retry hardening.
- **FISH-TODO-110 — IMPLEMENTED / PRODUCTION-VERIFIED.** Release-aware Gear/KB **Copy Changes** handoff.
- **FISH-TODO-111 — IMPLEMENTED / PRODUCTION-VERIFIED.** Shared site-header/page horizontal content grid and full-width long-form Notes.
- **FISH-TODO-112 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Fixed bundled cross-platform card icons.
- **FISH-TODO-113 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Responsive scenic page heroes.
- **FISH-TODO-114 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Android/Edge maskable launcher icon.

FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture task ID is **FISH-TODO-115**.

**Fishing Companion v3** — historically FISH-TODO-077 — remains **DEFERRED** and requires explicit approval before implementation. Deferred scope includes authentication, direct GitHub saving/uploads, offline authoring, queued-change outbox/sync, Catch authoring, broader multi-user support, and clickable content-Markdown pictures.

### Recent routine content work completed

Routine FISH108 content work is complete/canonical and does not consume application IDs. Since the prior handoff this includes:

- five September 24 Banks Lake catches with pictures and Notes;
- Lake whitefish Species KB entry;
- Z-Man Ned Rig Kit specification update and Catch links;
- ZMan Finesse ShadZ, Trick ShotZ and TRD GobyZ with pictures;
- Blue Fox Flash Spinner and Bad River Trout/Panfish Spinners;
- removal of the old generic/South Bend inline-spinner item and live reference cleanup;
- VMC Swimbait Jig Notes;
- Banks Lake inline-image/case/format cleanup;
- Berkley PowerBait Power Jerk Shad Notes cleanup;
- Pflueger President Spincast Combo rod/reel Notes and reel-capacity update.

Current canonical source controls exact values and counts.

## Active fishing, equipment and content backlog

Preserve explicit purchase uncertainty; do not infer ownership/completion without user confirmation.

The RVR119 Under Seat Tackle Storage has **not** been purchased, remains on back-order, and is the user's **#1 needed fishing equipment item**.

| ID | Priority | Status | Work item |
|---|---|---|---|
| FISH-TODO-008 | P2 | OPEN | Purchase RVR119 Under Seat Tackle Storage when available; currently back-ordered and the user's #1 needed fishing equipment item. |
| FISH-TODO-011 | P2 | OPEN | Buy/consider bullet weights for Texas rigs/Rage Craw. |
| FISH-TODO-012 | P2 | OPEN | Buy/consider 1/8 oz weighted EWG hooks for Power Jerk Shad/depth control. |
| FISH-TODO-013 | P2 | OPEN | Buy/consider Carolina Keepers as slip-sinker alternative. |
| FISH-TODO-014 | P3 | OPEN | Watch for KastKing 3600 deep box; do not infer the existing HyperSeal 3600 resolved this. |
| FISH-TODO-015 | P3 | OPEN | Buy/consider Berkley Warpig, 1/2 oz, 3 in, Blue Shad; Gear record does not prove purchase. |
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
| FISH-TODO-031 | P3 | OPEN | Continue/confirm Science of the Strike episodes 8 and 16 (dissolved oxygen/turbidity). A dissolved-oxygen/turbidity transcript was reviewed in September; do not close until both originally targeted episodes are confirmed complete. |
| FISH-TODO-037 | P3 | DEFERRED | Fishing Companion v3 requirements; implementation requires explicit approval. |
| FISH-TODO-039 | P2 | OPEN | Apply T-9 on kayak hardware. |
| FISH-TODO-040 | P2 | OPEN | Continue RVR119 motorization research: compare Garmin Force Current + Power Steer against Newport NK180Pro HD / NK300 HD Wizard systems; preserve roof-rack removability requirement and under-seat low-profile battery preference; research alternative 24V low-profile batteries, realistic range, setup/teardown and reliability before any purchase decision. |

## Resolved/deleted items that must not be resurrected

- FISH-TODO-005 resolved: installed fish-finder power is Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and 22–18 AWG disconnects.
- FISH-TODO-006 no longer needed.
- FISH-TODO-007 complete.
- FISH-TODO-009 resolved by purchase of Canyon fish bag.
- FISH-TODO-010 no longer needed.
- FISH-TODO-017 resolved: PowerBait still-rig hook size #4.
- FISH-TODO-018 resolved: non-slip loop knot accepted.
- FISH-TODO-030 explicitly deleted; never restore.
- FISH-TODO-032, -033 and -034 no longer needed.
- FISH-TODO-038 complete: outer rod holders remounted.

## Continuation rules

Use Chat mode by default. Restore actual latest `main` and open-PR state before repository work.

For routine source-aware Gear/KB/Catch authoring, use FISH108 Fast Content Release and do not allocate FISH-TODO-115. Allocate FISH-TODO-115 only for the next new application/architecture-level task unless newer `main` already allocated it.

Do not reopen completed FISH096–FISH114 or Fishing Companion v3 without an explicit new request.

When the user says **“It’s time to transfer to a new chat”**, ask once for confirmation of the full handoff. After confirmation, reconcile current repository/production state, update authoritative records where durable state changed, preserve unresolved work and purchase uncertainty, cross-check the files, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.
