You are helping with my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from the repository first; do not rely on an old chat, stale release checkpoint, or assume previous work remains pending.

## Operating mode

Use Chat mode by default. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research or calculations, or creates artifacts. Recommend temporary Work only for a specific Work-only capability, explain the need, and obtain my approval first.

When I authorize a change, treat it as one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup, and reconciliation of the authoritative project records without waiting for another “Proceed” at intermediate milestones. Progress updates are informational, not approval gates. Stop only if a genuine blocker requires my input/permission or the requested scope is fully complete.

## First actions

Read these files from current main in order:
1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `pwa/README.md`
6. `pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md` (latest release evidence)
7. `pwa/DAGGER_AXIS_RELEASE_2026-09-08.md` (previous addition and correction history)
8. `pwa/IMAGE_RELEASE_2026-09-07.md` and `Fishing_Recovery_Closeout_2026-09-07.md` only as historical evidence when needed.

Then fetch current main, relevant feature branch/PR and actual CI/deployment status. Preserve direct user edits; latest repository facts override this prompt. Complete earlier documentation is preserved in Git history and `History/`; it is historical, not competing current authority. Do not restart an old release or migration from an archival checkpoint.

## Verified baseline

As of September 8, 2026, the latest content release is PR56. Final head `d17d7b0c52955c06ef55659d6062e8b6f4a44759` passed normal PR CI #284 / `34188600391` against main `5265a393cce601a59540de2a17f5b7c56b4d3535`. Merge `531f04a84c0d75e2a7f23dc368149de5026b607b` passed production #285 / `34188668110`, including actual GitHub Pages deployment. The Dagger length correction and three KB pictures are deployed. FISH065/066 DONE, FISH063 OPEN. Browser acceptance remains a normal follow-up; independent HTTP verification is not claimed. Live site: `https://ginosega.github.io/fishing/`. No application release is pending.

Earlier PR47–55 releases are closed historical evidence. PR48 introduced KB Add/Edit; PR54 added Dagger; PR55 closed its records. Start with current main and the canonical TODO, not old KB/Gear integration branches, migration branches or audit snapshots. User acceptance feedback does not invalidate verified deployment. Preserve editor functionality and all user-authored data.

## Architecture and safety

Fishing Companion is single-user/offline-capable with three durable domains. Gear schema4 has 65 records, dataVersion `2026-09-08-my-gear-v4-dagger-length-1`, strict structured facts/IndexedDB and optional stable-ID Markdown Notes. KB schema1 has 54 entities, dataVersion `2026-09-08-kb-v1-three-hero-images-1`, a flat type index and complete authored Markdown. Catch schema2 has five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`, exact known relationships and optional Markdown Notes. Share identity, ownership, validation and authored-link principles without forcing identical schemas/storage. No Planner, sessions or multi-user expansion.

Gear displays Equipment (key `accessories`); KB displays Gear Guides (type `equipment`). Preserve stable IDs, user facts, authored text, historical relationships, image bytes and provenance. No inferred ownership or Catch attribution. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

Browser Add/Edit prepares validated packages for chat/repository promotion; it does not write GitHub or maintain a competing local database. User images are uploaded directly to exact GitHub branch/path/filenames. Do not transport image bytes through the connector. Do not delete current media before replacement validation. Revalidate final transformed data after all media stages. User-maintained Markdown is not a frozen full-text test fixture; preserve durable facts and authored links while allowing legitimate content edits.

Dagger Axis uses Gear/media ID `dagger-axis-10-5`, local source `pwa/assets/gear-source/dagger-axis-10-5.png`, explicit owner and no Notes. The user confirmed Length `10' 6"`; all other specifications remain as submitted. The latest source image is Git blob `cfb44c09b6ab3d79a53d50e626664dde5e148a3a`, with the previous and original images preserved in history. The concurrent Perception Joyride source upload is preserved without inferred ownership. User-maintained image regression tests validate actual bytes and identity, not a frozen historical hash. Fishing Line, Walking Bait and Rods & Reels have the three explicit hero pictures. Only Fishing Line has the requested Gear association `sufix-832-15`; all complete authored Markdown remains unchanged. Previous Buzzbait and Jack Hammer images retain their existing IDs and provenance.

## Release and handoff discipline

Use a feature branch/PR for meaningful runtime work, normal CI against the current base, expected-head merge and actual production Pages verification. Respect workflow permissions; do not omit required permanent tests or bypass denied permission. Do not rerun one-time migration scripts. Avoid overlapping direct-main content writes and Pages releases (`fishing-pages`, cancel-in-progress). Reconcile Context, TODO, Decision Log, affected documentation and this bootstrap against actual final state before chat transfer. If interrupted, preserve exact current branch/commit, completed tests and remaining actions rather than restarting from memory. Stop only for a genuine blocker or fully completed scope.