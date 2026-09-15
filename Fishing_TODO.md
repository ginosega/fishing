# Fishing TODO

## Current project task state — September 15, 2026

### Application / architecture state

**FISH-TODO-108 — IMPLEMENTED / release-policy change.** FISH108 establishes the approved two-lane Fishing Companion release model:

- **Fast Content Release** for routine canonical changes confined to `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`.
- **Full Application Release** for runtime, schema/contracts, tests, tooling/build, dependencies, workflow, migration/recovery/offline, or mixed content+non-content changes.

The durable policy is [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md). Routine Fast Content Releases are ordinary authoring events, not application tasks. They do **not** consume a `FISH-TODO-###` application/architecture ID and do not require per-item project-state or production-closeout documentation.

**FISH-TODO-109 — IMPLEMENTED / release-retry hardening.** FISH109 makes Pages deployment reruns safe with run-attempt-specific Pages/hosted-evidence artifacts and bounded retry/backoff for transient hosted-verification failures. Exact-current-main protection remains mandatory.

**FISH-TODO-110 — IMPLEMENTED / Copy Changes release routing.** Fishing Companion Add/Edit → Copy Changes uses centralized FISH108-aware handoff text. Eligible content-only packages explicitly use one Fast Content Release PR with lightweight validation/build, merge, production deployment and hosted byte/release-identity verification; project-state churn and Full Application Release are avoided unless validation shows they are actually required.

FISH071–076 and FISH078–110 are complete/implemented. The next unused application/architecture task ID is **FISH-TODO-111**.

**Fishing Companion v3** — historically `FISH-TODO-077/P2` — remains **DEFERRED**. Future scope may include authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization. None of that is current production or implicitly approved implementation work.

### Recent content work completed — no application task IDs consumed

The September 14–15 Technique restructuring is complete and production-verified through routine FISH108 content releases:

- Bass Fishing Techniques was created and expanded into the main bass presentation/tactics reference.
- Bass Behavior and Habitat was created as the complementary “where bass are and why” reference.
- Trout Fishing was renamed **Trout Fishing Techniques** and substantially expanded.
- Trout Behavior and Habitat was created as the complementary trout location/behavior reference.
- Bass-only Spring/Fall pages were replaced by **Spring Fishing**, **Summer Fishing**, **Fall Fishing**, and **Winter Fishing**, covering both bass and trout.
- Topwater Fishing was expanded from a placeholder into a full specialized surface-fishing reference.
- A curated internal cross-link pass connected the broad Technique pages to relevant species, seasonal, location, tackle and topwater Gear Guide pages.
- Retired duplicate/obsolete Technique pages were removed from live canonical content.

This completed broad-reference work does **not** close the separate rig/specialty-page backlog below. In particular, Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons remain open content items.

Changing Gear/KB/Catch counts, canonical path totals and reference totals are not maintained as test baselines; derive current state from canonical source and the exact generated release.

## Existing fishing, equipment and content backlog

Preserve explicit purchase uncertainty; do not infer ownership or completion without user confirmation.

FISH104 documents a fish-finder power architecture and parts list, but it does **not** explicitly confirm that every listed part is the installed configuration. Therefore FISH-TODO-005 remains WAITING ON USER rather than being closed by inference.

FISH105 adds a KastKing HyperSeal Waterproof Tackle Box in size 3600, but the supplied package does **not** explicitly identify that item as the specific “KastKing 3600 deep box” target in FISH-TODO-014. Preserve FISH-TODO-014 as OPEN unless the user explicitly resolves that backlog item.

| ID | Priority | Status | Work item |
|---|---|---|---|
| FISH-TODO-005 | P2 | WAITING ON USER | Verify exact installed fish-finder power system; historical Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and disconnects need confirmation. |
| FISH-TODO-006 | P2 | OPEN | Verify Bonafide RVR119 brass insert thread sizes. |
| FISH-TODO-007 | P2 | OPEN | Decide whether/how to modify rear flush rod-holder angle; preserve Pelican installation details and evaluate alternatives to heat-bending. |
| FISH-TODO-008 | P2 | WAITING ON USER | Confirm whether RVR119 Under Seat Tackle Storage was purchased; do not infer ownership. |
| FISH-TODO-009 | P2 | WAITING ON USER | Confirm whether YakAttack 38 x 13 fish cooler bag was purchased; verify exact SKU/status. |
| FISH-TODO-010 | P2 | OPEN | Buy/consider tubes and internal tube jigheads for Lake Washington/Sammamish smallmouth. |
| FISH-TODO-011 | P2 | OPEN | Buy/consider bullet weights for Texas rigs/Rage Craw. |
| FISH-TODO-012 | P2 | OPEN | Buy/consider 1/8 oz weighted EWG hooks for Power Jerk Shad/depth control. |
| FISH-TODO-013 | P2 | OPEN | Buy/consider Carolina Keepers as slip-sinker alternative. |
| FISH-TODO-014 | P3 | OPEN | Watch for KastKing 3600 deep box. |
| FISH-TODO-015 | P3 | OPEN | Buy/consider Berkley Warpig, 1/2 oz, 3 in, Blue Shad. |
| FISH-TODO-016 | P3 | OPEN | Buy/consider Bait Pop with red flake; water-soluble/shrimp-extract preference. |
| FISH-TODO-017 | P2 | OPEN | Resolve PowerBait still-rig hook size (#4 versus #8). |
| FISH-TODO-018 | P2 | OPEN | Resolve loop-knot guidance conflict. |
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
| FISH-TODO-030 | P3 | DEFERRED | Evaluate trailer battery for kayak motor/electronics only if motor project returns. |
| FISH-TODO-031 | P3 | OPEN | Listen/watch Science of the Strike episodes 8 and 16 (dissolved oxygen/turbidity). |
| FISH-TODO-032 | P3 | OPEN | Continue individual structured Catch records, with no trips/no-bite sessions or inferred relationships. |
| FISH-TODO-033 | P3 | OPEN | Create regulations recheck checklist for Fish Washington, lake rules, species identification and bait/retention implications. |
| FISH-TODO-034 | P3 | OPEN | Spot-check authored links in GitHub Preview and PWA. |
| FISH-TODO-037 | P3 | DEFERRED | Multi-user generalization only as part of a future explicitly approved Fishing Companion v3 requirement. |

## Continuation rules

Use Chat mode by default. Restore actual latest `main` and current open-PR state before repository work.

For routine source-aware Gear/KB/Catch authoring, use the FISH108 Fast Content Release policy and **do not allocate FISH-TODO-111**. Allocate FISH-TODO-111 only for the next application/architecture-level task unless newer current `main` has already allocated it.

Do not reopen completed FISH096–FISH110 or Fishing Companion v3 work without an explicit new user request.

When the user says **“It’s time to transfer to a new chat”**, ask for confirmation of the full handoff. After confirmation, reconcile current repository/production state, update authoritative records where durable state changed, cross-check them, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.
