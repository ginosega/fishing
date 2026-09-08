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
6. `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md` (latest release evidence)
7. Older release/history records only when needed.

Then fetch current main, relevant feature branch/PR and actual CI/deployment status. Preserve direct user edits; latest repository facts override this prompt. Complete earlier documentation is preserved in Git history and `History/`; it is historical, not competing current authority. Do not restart an old release or migration from an archival checkpoint.

## Verified baseline

As of September 8, 2026, the latest application release is PR60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, normal CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`, including actual GitHub Pages deployment. Gear schema4/66 uses `2026-09-08-my-gear-v4-perception-joyride-1`; KB schema1/54 uses `2026-09-08-kb-v1-cranberry-lake-picture-1`; Catch schema2/5 remains `2026-09-04-catches-v2-external-notes-1`. FISH069 and FISH070 are DONE; FISH063 remains OPEN. No application release is pending. See `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md`.

PR60 registered the exact Cranberry Lake picture handoff at `pwa/assets/kb/entries/location-cranberry-lake-deception-pass.png`, blob `201852612f8985fba057bfe224292bfe2a24d69d` (1,981,945 bytes), alt/caption `Cranberry Lake`, with no inferred owner or provenance. Its existing facts and complete authored Markdown are preserved. Home/KB root, Gear Guides, Techniques and Catch Log copy now matches the requested wording.

Previous PR58 added owned Gear/media ID `perception-joyride-10-0` exactly as supplied, with no Notes, and changed only the Rods & Reels hero caption to `Baitcasting reel`. Its historical source blob was `f24403f79788755e267ee721f5e93c34c3f8f472` (562530 bytes); current media must be validated rather than compared with a frozen historical hash. Dagger Axis 10.5 remains at confirmed Length `10' 6"`, with the latest user source replacement preserved. Earlier hero images and explicit ownership remain unchanged. PR58 and all earlier release details remain in their historical records.

## Architecture and safety

Fishing Companion is single-user/offline-capable with three durable domains. Gear schema4 has 66 records, dataVersion `2026-09-08-my-gear-v4-perception-joyride-1`, strict structured facts/IndexedDB and optional stable-ID Markdown Notes. KB schema1 has 54 entities, dataVersion `2026-09-08-kb-v1-cranberry-lake-picture-1`, a flat type index and complete authored Markdown. Catch schema2 has five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`, exact known relationships and optional Markdown Notes. Share identity, ownership, validation and authored-link principles without forcing identical schemas/storage. No Planner, sessions or multi-user expansion.

Gear displays Equipment (key `accessories`); KB displays Gear Guides (type `equipment`). Preserve stable IDs, user facts, authored text, historical relationships, image bytes and provenance. No inferred ownership or Catch attribution. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

Browser Add/Edit prepares validated packages for chat/repository promotion; it does not write GitHub or maintain a competing local database. User images are uploaded directly to exact GitHub branch/path/filenames. Do not transport image bytes through the connector. Do not delete current media before replacement validation. Revalidate final transformed data after all media stages. User-maintained Markdown is not a frozen full-text test fixture; preserve durable facts and authored links while allowing legitimate content edits.

## Release and handoff discipline

Use a feature branch/PR for meaningful runtime work, normal CI against the current base, expected-head merge and actual production Pages verification. Respect workflow permissions; do not omit required permanent tests or bypass denied permission. Do not rerun one-time migration scripts. Avoid overlapping direct-main content writes and Pages releases (`fishing-pages`, cancel-in-progress). Reconcile Context, TODO, Decision Log, affected documentation and this bootstrap against actual final state before chat transfer. If interrupted, preserve exact current branch/commit, completed tests and remaining actions rather than restarting from memory. Stop only for a genuine blocker or fully completed scope.
