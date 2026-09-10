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
6. `pwa/IMAGE_RELEASE_2026-09-07.md` (latest image release evidence)
7. `Fishing_Recovery_Closeout_2026-09-07.md` and the earlier release closeouts only as historical evidence when needed.

Then fetch current main, relevant feature branch/PR, and actual CI/deployment status. Preserve direct user edits; latest repository facts override this prompt. Complete earlier documentation is preserved in Git history and `History/`; it is historical, not competing current authority. Do not restart an old release or migration from an archival checkpoint.

## Verified baseline

As of September 8, 2026, the latest maintenance release is PR52. Final head `28d84e650e0b3e1722a81d4abeeed7cb7572662c` passed normal PR CI #266 / `34185963172` against main `4ca1613d089859cfd554636e8c554acd6178cdc1`. Merge `91ee0966eff5ef95d6a7d192a95b10940d0b534e` passed production #267 / `34186006471`, including the actual GitHub Pages deployment. Both image changes are deployed. FISH062 DONE. Browser acceptance remains a normal follow-up; an independent HTTP fetch was unavailable.

The latest application-feature release is PR48, merge `6d04e29b6770000eaa50f6c449ad82bc88f7326d`, production #252 / `34142574286`. PR49 closed that release. PR47 deployed Gear schema4/Cylinder Weights. PR50 recovered the frozen Bonafide Notes test and incorporated the full audit branch; PR51 reconciled the recovery documentation. FISH058–062 DONE. No application release is pending. The live site is `https://ginosega.github.io/fishing/`.

Start with current main and the canonical TODO, not old KB/Gear integration branches, migration branches or audit snapshots. User acceptance feedback does not invalidate verified deployment. Preserve editor functionality and all user-authored data. FISH063 tracks the separate KB image-filename usability issue; do not treat it as an unfinished PR52 release.

## Architecture and safety

Fishing Companion is single-user/offline-capable with three durable domains. Gear schema4 has 64 records, strict structured facts/IndexedDB and optional stable-ID Markdown Notes. KB schema1 has 54 entities, a flat type index and complete authored Markdown. Catch schema2 has five historical records, exact known relationships and optional Markdown Notes. Share identity, ownership, validation and authored-link principles without forcing identical schemas/storage. No Planner, sessions or multi-user expansion.

Gear displays Equipment (key `accessories`); KB displays Gear Guides (type `equipment`). Preserve stable IDs, user facts, authored text, historical relationships, image bytes and provenance. No inferred ownership or Catch attribution. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

Browser Add/Edit prepares validated packages for chat/repository promotion; it does not write GitHub or maintain a competing local database. User images are uploaded directly to exact GitHub branch/path/filenames. Do not transport image bytes through the connector. Do not delete current media before replacement validation. Revalidate final transformed data after all media stages. User-maintained Markdown is not a frozen full-text test fixture; preserve durable facts and authored links while allowing legitimate content edits.

Current Buzzbait KB ID is `technique-buzzbait`; its representative source is `./assets/kb/entries/technique-buzzbait.jpg`. The original equipment-directory image is preserved. Jack Hammer retains Gear/media ID `zman-jack-hammer` and active source `pwa/assets/gear-source/zman-jack-hammer.png`, exact owner and original provenance. Neither image-only change modifies the Gear/KB/Catch schema or data versions. Do not infer the new PNG's external origin from the previous remote image.

## Release and handoff discipline

Use a feature branch/PR for meaningful runtime work, normal CI against the current base, expected-head merge and actual production Pages verification. Respect workflow permissions; do not omit required permanent tests or bypass denied permission. Do not rerun one-time migration scripts. Avoid overlapping direct-main content writes and Pages releases (`fishing-pages`, cancel-in-progress). Reconcile Context, TODO, Decision Log, affected documentation and this bootstrap against actual final state before chat transfer. If interrupted, preserve exact current branch/commit, completed tests and remaining actions rather than restarting from memory. Stop only for a genuine blocker or fully completed scope.
