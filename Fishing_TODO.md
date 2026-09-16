# Fishing TODO

## Current project task state — September 15, 2026 handoff

### Application / architecture state

**FISH-TODO-108 — IMPLEMENTED / release-policy change.** FISH108 establishes the approved two-lane Fishing Companion release model:

- **Fast Content Release** for routine canonical changes confined to `pwa/Gear/`, `pwa/KB/`, and/or `pwa/Catches/`.
- **Full Application Release** for runtime/UI/assets, schema/contracts, tests, tooling/build, dependencies, workflow, migration/recovery/offline, or mixed content+non-content changes.

The durable policy is [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md). Routine Fast Content Releases do not consume an application/architecture task ID and do not require per-item project-state or production-closeout documentation.

**FISH-TODO-109 — IMPLEMENTED / release-retry hardening.** FISH109 makes Pages deployment reruns safe with run-attempt-specific Pages/hosted-evidence artifacts and bounded retry/backoff for transient hosted-verification failures. Exact-current-main protection remains mandatory.

**FISH-TODO-110 — IMPLEMENTED / Copy Changes release routing.** Fishing Companion Add/Edit → Copy Changes uses centralized FISH108-aware handoff text. Eligible content-only packages explicitly use one Fast Content Release PR with lightweight validation/build, merge, production deployment and hosted byte/release-identity verification; project-state churn and Full Application Release are avoided unless validation shows they are actually required.

**FISH-TODO-111 — IMPLEMENTED / PRODUCTION-VERIFIED / shared page layout alignment.** The site header and page body share the same horizontal content inset, and long-form Notes/Markdown uses the full main content width through the right-side page margin. Mobile preserves the same rule with its existing 16 px inset. Production run #293 completed successfully for the handoff checkpoint source.

**FISH-TODO-112 — OPEN / DESIGN SELECTED / fixed cross-platform card icons.** Replace OS-dependent Unicode emoji card icons with bundled fixed artwork while preserving the current live Home, My Gear and Knowledge Base layouts and the current small icon scale. No FISH112 runtime/assets/tests have been implemented yet.

Approved FISH112 target set:

- **My Gear:** Google/Android Rods & Reels; dark red/orange spool with clear/white-ish Line; silver/gray teardrop Weight; silver barrel Swivel only; silver Twitter/Twemoji-style Hook without a crossbar; Sexy Shad crankbait Lure; Fluent-style Worm; light-blue oblique Fluent-style Kayak with paddle.
- **Knowledge Base:** Google/Android round red pushpin with pale blue/gray needle for Locations; side-view rainbow trout for Species; compass for Techniques; Google/Android blue rope knot for Knots; open book with blue backing/edge for Gear Guides. The live KB root has exactly these five category cards—no Tackle card.
- **Home:** tackle box for My Gear; three plain unlabeled stacked books for Knowledge Base; jumping largemouth bass with lure in its mouth and line extending from the lure for Catch Log. The Home Knowledge Base stack must remain visually distinct from the Gear Guides open-book icon.

Implementation notes for FISH112:

- keep current card geometry, copy, search/Back controls, and navigation; do not adopt exploratory scenic headers, enlarged cards, mobile bottom navigation, or other generated-mockup layout changes;
- bundle fixed assets rather than depending on an installed emoji font;
- verify licensing/attribution before using or adapting Google/Noto, Microsoft Fluent, and Twemoji artwork;
- prefer a clean scalable asset format such as SVG where practical;
- add regression coverage for consistent icon asset rendering/availability;
- use **Full Application Release** because the work is outside canonical content roots.

FISH071–076 and FISH078–111 are complete/implemented. FISH112 is active. The next unused application/architecture task ID is **FISH-TODO-113**.

**Fishing Companion v3** — historically `FISH-TODO-077/P2` — remains **DEFERRED**. Future scope may include authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization. None of that is current production or implicitly approved implementation work.

### Recent content work completed — no application task IDs consumed

Recent routine FISH108 content work is complete/canonical and does not need new application IDs or closeout docs:

- Banks Lake KB/Location exists and has its Steamboat Rock State Park representative picture.
- Electronics Research exists in My Gear/Equipment; current Markdown uses `%20`-encoded local image paths for the five inline PNGs.
- The September 14–15 Technique restructuring and Topwater/cross-link pass are complete and production-verified.

The broad Technique redesign does **not** close the separate rig/specialty-page backlog below. Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons remain open.

Changing Gear/KB/Catch item counts, canonical path totals and reference totals are source-derived state, not hand-maintained test baselines.

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

For routine source-aware Gear/KB/Catch authoring, use the FISH108 Fast Content Release policy and do not allocate FISH-TODO-113. FISH112 is already allocated to the icon refresh. Allocate FISH-TODO-113 only for the next new application/architecture-level task unless newer `main` has already allocated it.

Do not reopen completed FISH096–FISH111 or Fishing Companion v3 work without an explicit new user request.

When the user says **“It’s time to transfer to a new chat”**, ask once for confirmation of the full handoff. After confirmation, reconcile current repository/production state, update authoritative records where durable state changed, preserve unresolved work and purchase uncertainty, cross-check the files, and finish with a direct GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.
