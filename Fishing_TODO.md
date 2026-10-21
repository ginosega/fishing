# Fishing TODO

## Current project task state — October 19, 2026

**V3 P0 progress — October 20, 2026:** Fresh source/production baseline restored; P0-A stale-client release defect reproduced in isolated source-level tests (run #521), **fix not yet selected or released**. P0-B [draft, unmerged thumbnail prototype PR #248](https://github.com/ginosega/fishing/pull/248) now builds manifest-verified, deterministic card derivatives, retains all original pictures, and passed Full Application validation [run #525](https://github.com/ginosega/fishing/actions/runs/39431537020). All 146 derivatives total ~1.56 MiB vs 102.94 MiB of their originals; tested above-fold decode-to-display latency improved by ~1.6–2.1× in local Chromium/WebKit fixtures. [P0-B report](pwa/docs/Fishing_Companion_v3_P0B_Thumbnail_Prototype_2026-10-20.md) preserves measurements/caveats. **Owner update October 21, 2026:** Thumbnail implementation **APPROVED**; owner accepts measured latency gain and **waives visual review and Android preview**. Exact-head Full Application CI [#526](https://github.com/ginosega/fishing/actions/runs/39436154092) succeeded for PR #248 head `6bd9d5e04c69851b2f4c64813c3b6821f6ff8db6`. **Still required:** separate express authorization to publish a v2 Full Application maintenance release, including awareness that P0-A stale-session issue remains unfixed; until then PR #248 stays draft/unmerged and production stays unchanged. **P0-C CLOSED:** owner accepted Chrome Android installed-PWA Custom Tabs; no workaround. AUTH-P0 owner sign-in/session/callback feasibility, permission/provider gate, and v3 cutover gate remain unresolved.

**October 21, 2026 post-release reconciliation — P0-A FIELD REPRODUCED, P0-B PRODUCTION RELEASED:** The owner held Edge release A `f5eab01e9d5af6101f03a7094de5b565` open while [PR #252](https://github.com/ginosega/fishing/pull/252) (approved thumbnails + security patches) deployed successfully through [Full Application workflow #531](https://github.com/ginosega/fishing/actions/runs/39624670945). Hosted B release `9f6464d53fe49d1e986bb35d2630c21a` from source `805972165f88f10898807639d8b9591ce0cf3d08`, 577 files / 100 Gear / 60 KB / 12 Catches, passed hosted verification. Old A My Gear category-card `card-icons/*.png` returned **HTTP 404** from new hosting and **503 from the service worker**, with missing icons; fresh B tab succeeded. New B tab displayed a likely overbroad `controllerchange` update notification. [Field evidence, exact URLs, limitations and fix candidates](pwa/docs/Fishing_Companion_v3_P0A_Edge_Field_Reproduction_2026-10-21.md). **P0-A fix remains open/unimplemented**, real field repro sufficient to begin isolated fix design; independent v2 reliability release requires its own approval. P0-B enhancement is no longer a prototype-only release candidate; close superseded draft PR #248 unmerged after this reconciliation. AUTH-P0 and v3 cutover gates remain separate.

### Application / architecture state

- **FISH-TODO-108 — IMPLEMENTED.** Two-lane release policy: Fast Content Release for routine canonical Gear/KB/Catch content, Full Application Release for application/runtime/tooling/schema/workflow changes.
- **FISH-TODO-109 — IMPLEMENTED / PRODUCTION-VERIFIED.** Run-attempt-safe Pages/evidence artifacts and hosted-verification retry hardening.
- **FISH-TODO-110 — IMPLEMENTED / PRODUCTION-VERIFIED.** Release-aware Gear/KB **Copy Changes** handoff.
- **FISH-TODO-111 — IMPLEMENTED / PRODUCTION-VERIFIED.** Shared site-header/page horizontal content grid and full-width long-form Notes.
- **FISH-TODO-112 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Fixed bundled cross-platform card icons.
- **FISH-TODO-113 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Responsive scenic page heroes.
- **FISH-TODO-114 — IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.** Android/Edge maskable launcher icon.

FISH071–076 and FISH078–114 are complete/implemented. The next unused application/architecture task ID is **FISH-TODO-115**.

**Fishing Companion v3 (FISH-TODO-037): REQUIREMENTS + DESIGN + UX + IMPLEMENTATION PLAN APPROVED October 19, 2026, WITH MANDATORY NEW-CHAT TRANSFER FIRST.** [Approved requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) · [approved design](pwa/docs/Fishing_Companion_v3_Technical_Design.md) · [approved UX](pwa/docs/Fishing_Companion_v3_UX_Review.md) · [approved implementation plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) · [plan approval with transfer caveat](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md). Complete [full handoff](Fishing_New_Chat_Bootstrap_Prompt.md), **then begin P0 in a new Chat**, freshly restoring main/PR/production evidence. No implementation, GitHub App setup, hosting or deployment in the handoff chat. AUTH-P0 required before security-dependent work. New provider/cost/domain/permissions, separately released v2 fixes and v3 cutover require their own stage-specific approvals. Excluded: offline sync/queue, broad multi-user, Catch photos/GPS; drafts provisional/removable.

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

Additional **October 8–12 completed content**: orange YakAttack TracPak combo and 10L drybag; Garmin Force Current with Power Steer Gear/Notes and maintenance update; Electronics Research renamed and refocused on fish finders with new image; new Lake Stevens Location fishing plan; Banks Lake Location representative picture (**PR #228 merged and deployed**). Verified production source: `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`, counts **100 Gear / 60 KB / 12 Catches**, workflow **#517**, release `0f4bd1f9e9e12b2b1981d61b48e3e501` at this handoff. None requires an application task ID. This **documentation-only reconciliation does not publish a PWA release**.

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
| FISH-TODO-037 | P3 | PLAN APPROVED / TRANSFER BEFORE P0 | v3: all four gates approved October 19 with mandatory full new-chat handoff before starting P0; proceed under staged safeguards after fresh source/production restoration. No production cutover approval. |
| FISH-TODO-039 | P2 | OPEN | Apply T-9 on kayak hardware. |
| FISH-TODO-040 | P2 | OPEN | Commission and integrate the purchased Garmin Force Current system on the RVR119: clean/inspect/service exposed items, charge/baseline the Redodo 24V 50Ah battery, reset/re-pair/update/calibrate motor/remote/Power Steer pedals/MOB tag, complete on-water calibration and functional testing, and fit/protect a snug hard-plastic storage case/bin with at least 38 × 18 × 8 in **verified usable interior** dimensions (orange preferred); determine safe reusable cushioning without encasing the electronics in spray foam. |

### Current Force Current ownership / commissioning state

Purchased **October 6, 2026** for **$2,800** from a seller in Gresham, Oregon: Garmin Force Current motor, Power Steer wireless pedals, handheld remote, MOB tag, Redodo 24V 50Ah LiFePO4 battery + charger, high-efficiency prop and weedless prop. The original Garmin receipt is from July 2026; Garmin confirmed to the user that the remaining three-year standard warranty will be honored with the original receipt. Seller reported freshwater-only use.

Storage requirement for the motor/pedals: **hard plastic**, minimum usable interior **38 × 18 × 8 in**, compact/snug, orange preferred. Flexible bags are rejected; the Hyper Tough 50-gallon tote was rejected as too large. A **48 × 19 × 14 in lidded bin** is now being considered/discussed for foam inserts; **confirmed usable interior measurements and actual purchase/ownership status are not established**. Consider cut closed-cell EVA/PE foam before sprayed construction foam, protect controls and connectors, and avoid moisture entrapment.

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

Do not reopen completed FISH096–FISH114 without an explicit new request. Fishing Companion v3 requirements, design, UX and implementation plan are each approved. **Full transfer to a new Chat must occur before P0 work.** Implement only within the approved staged plan after source/production restoration and satisfy all conditional security/provider/release gates; v3 production cutover requires separate explicit sign-off.

When the user says **“It’s time to transfer to a new chat”**, ask once for confirmation of the full handoff. After confirmation, reconcile current repository/production state, update authoritative records where durable state changed, preserve unresolved work and purchase uncertainty, cross-check the files, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.
