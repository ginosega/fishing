You are helping with my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from the repository first; do not rely on an old chat or assume that a previous release is still pending.

## Operating mode

Use Chat mode by default. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research or calculations, or creates artifacts. Recommend temporary Work only for a specific Work-only capability, explain the need, and obtain my approval first.

## First actions

Read these files in order from current main:
1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`
6. `Fishing_Release_Handoff_2026-09-06.md` (historical closure and release evidence)

Then fetch current main, relevant feature branch/PR, and any actual CI/deployment status. Preserve user edits and use the latest repository facts over this bootstrap if they differ.

## Verified baseline and current work

As of September 7, 2026, PR47 is the last user-verified runtime release: merge `f05b7ec532d8e45f3fc36c1e0976c5ea40eb9983`, production workflow #240 / `34135326910`. Gear schema4 and the new Cylinder Weights image are live; the user verified both. FISH-TODO-058 and 059 are DONE. The September 6 handoff is historical, not unfinished work.

Current work is KB Add/Edit, FISH-TODO-060, `feature/kb-authoring`, PR48. Check current GitHub state before continuing. This feature must follow the established Gear handoff pattern while preserving KB's complete authored Markdown, source/derived image identity, immutable existing IDs and document paths. Do not call it deployed until exact-head CI, merge and actual Pages deployment are verified.

## Architecture and safety

Fishing Companion is single-user and offline-capable, with three durable domains. My Gear schema4 has 64 records, strict structured facts/IndexedDB and optional stable-ID Markdown Notes. KB schema1 has 54 entities, a flat type index and complete authored Markdown. Catch schema2 has five historical records with exact known relationships and optional Markdown Notes. Share identity, ownership, validation and authored-link principles without forcing identical schemas/storage. No Planner, sessions or multi-user expansion.

Gear displays Equipment (key `accessories`); KB displays Gear Guides (type `equipment`). Preserve stable IDs, user facts, authored text, historical relationships, image bytes and provenance. No inferred ownership or Catch attribution. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

Browser Add/Edit prepares validated packages for chat/repository promotion; it does not write GitHub or maintain a competing local database. User images are uploaded directly to exact GitHub branch/path/filenames. Do not transport image bytes through the connector. Do not delete current media before replacement validation. Revalidate final transformed data after all media stages.

## Release and handoff discipline

Use a feature branch/PR for meaningful runtime work, normal CI against the current base, expected-head merge, and actual production Pages verification. Respect workflow permissions; do not omit required permanent tests or bypass a denied permission. Do not rerun one-time migration scripts. Avoid overlapping direct-main content writes and Pages releases (`fishing-pages`, cancel-in-progress). Reconcile Context, TODO, Decision Log, affected documentation and this bootstrap against the actual final state before a chat transfer. If interrupted, preserve exact current branch/commit, completed tests and remaining actions rather than restarting from memory.
