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
6. `pwa/DAGGER_AXIS_RELEASE_2026-09-08.md` (latest application release evidence)
7. `pwa/IMAGE_RELEASE_2026-09-07.md` and `Fishing_Recovery_Closeout_2026-09-07.md` only as historical release evidence when needed.

Then fetch current main, relevant feature branch/PR, and actual CI/deployment status. Preserve direct user edits; latest repository facts override this prompt. Complete earlier documentation is preserved in Git history and `History/`; it is historical, not competing current authority. Do not restart an old release or migration from an archival checkpoint.

## Verified baseline

As of September 8, 2026, the latest maintenance release is PR54. Final head `bb13ca083b2f99c0fc6006ff7a1362b73f993912` passed normal PR CI #273 / `34187137697` against main `0f3107d8279ccca75ccb74f907391f370041c9e3`. Merge `0c07816b33c282cbc31e162812ad15c45d3a4bbe` passed production #274 / `34187188334`, including actual GitHub Pages deployment. Dagger Axis 10.5 and its source image are registered. FISH064 DONE. Browser acceptance remains a normal follow-up; independent HTTP verification is not claimed. The live site is `https://ginosega.github.io/fishing/`.

The latest application-feature release remains PR48 (KB Add/Edit). PR47 deployed Gear schema4/Cylinder Weights, PR49 closed that release, PR50 recovered the Bonafide Notes regression and incorporated the audit branch, PR51 reconciled recovery, PR52 deployed Buzzbait/Jack Hammer pictures and PR53 reconciled their records. FISH058–062 and064 are DONE. No application release is pending. Documentation closeout PR55 is administrative.

Start with current main and the canonical TODO, not old KB/Gear integration branches, migration branches or audit snapshots. User acceptance feedback does not invalidate verified deployment. Preserve editor functionality and all user-authored data. FISH063 tracks the KB image-filename usability issue. FISH065 awaits confirmation of the submitted Dagger length; neither is an unfinished PR54 deployment.

## Architecture and safety

Fishing Companion is single-user/offline-capable with three durable domains. Gear schema4 has 65 records, dataVersion `2026-09-08-my-gear-v4-dagger-axis-1`, strict structured facts/IndexedDB and optional stable-ID Markdown Notes. KB schema1 has 54 entities, a flat type index and complete authored Markdown. Catch schema2 has five historical records, exact known relationships and optional Markdown Notes. Share identity, ownership, validation and authored-link principles without forcing identical schemas/storage. No Planner, sessions or multi-user expansion.

Gear displays Equipment (key `accessories`); KB displays Gear Guides (type `equipment`). Preserve stable IDs, user facts, authored text, historical relationships, image bytes and provenance. No inferred ownership or Catch attribution. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

Browser Add/Edit prepares validated packages for chat/repository promotion; it does not write GitHub or maintain a competing local database. User images are uploaded directly to exact GitHub branch/path/filenames. Do not transport image bytes through the connector. Do not delete current media before replacement validation. Revalidate final transformed data after all media stages. User-maintained Markdown is not a frozen full-text test fixture; preserve durable facts and authored links while allowing legitimate content edits.

Dagger Axis uses Gear/media ID `dagger-axis-10-5`, local source `pwa/assets/gear-source/dagger-axis-10-5.png`, explicit owner and no Notes. Preserve the exact submitted specifications, including Length `12' 6"`, until the user confirms any correction. The source image is Git blob `b6b9c96057adda124b7369952e851b13cf2f3b7b`. The concurrent user-uploaded `technique-fishing-line.jpg` is preserved without speculative association. Previous Buzzbait and Jack Hammer images remain registered with their existing IDs and provenance.

## Release and handoff discipline

Use a feature branch/PR for meaningful runtime work, normal CI against the current base, expected-head merge and actual production Pages verification. Respect workflow permissions; do not omit required permanent tests or bypass denied permission. Do not rerun one-time migration scripts. Avoid overlapping direct-main content writes and Pages releases (`fishing-pages`, cancel-in-progress). Reconcile Context, TODO, Decision Log, affected documentation and this bootstrap against actual final state before chat transfer. If interrupted, preserve exact current branch/commit, completed tests and remaining actions rather than restarting from memory. Stop only for a genuine blocker or fully completed scope.
