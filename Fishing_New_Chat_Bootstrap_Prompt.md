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
6. `pwa/RELEASE_2026-09-08_JOYRIDE_RODS_CAPTION.md` (latest release evidence)
7. Older release/history records only when needed.

Then fetch current main, relevant feature branch/PR and actual CI/deployment status. Preserve direct user edits; latest repository facts override this prompt. Complete earlier documentation is preserved in Git history and `History/`; it is historical, not competing current authority. Do not restart an old release or migration from an archival checkpoint.

## Verified baseline

As of September 8, 2026, the latest content release is PR58. Final head `001249eeb3fb3a17cdc7ffc668fe289d3eb58084` passed normal PR CI #297 / `34189898597` against main `c82be4b253d2703830aff7b7e7db9131b4f031ba`. Merge `8cceecc42d7ffab1c672e6991378d032136145b4` passed production #298 / `34189948481`, including actual GitHub Pages deployment. Live site: `https://ginosega.github.io/fishing/`. FISH068 is DONE; FISH063 remains OPEN. No application release is pending.

PR58 added owned Gear/media ID `perception-joyride-10-0` exactly as supplied: internal category `accessories`, type `Accessories`, name Perception Joyride 10.0, manufacturer/model/specifications/link unchanged, no Notes. Its already-uploaded source is `pwa/assets/gear-source/perception-joyride-10.png`, Git blob `f24403f79788755e267ee721f5e93c34c3f8f472` (562530 bytes), explicitly owned by the new Gear ID. PR58 also changed only the existing Rods & Reels hero caption to `Baitcasting reel`, preserving its src, alt, image bytes and complete Markdown.

The Dagger Axis 10.5 remains owned Gear/media ID `dagger-axis-10-5`, confirmed Length `10' 6"`, with its latest direct user source replacement preserved. Earlier PR56 registered Fishing Line, Walking Bait and Rods & Reels hero images; only Fishing Line explicitly associates its picture with `sufix-832-15`. PR57 fixed mutable-source regression behavior. Earlier PR47–55 remain closed historical evidence.

## Architecture and safety

Fishing Companion is single-user/offline-capable with three durable domains. Gear schema4 has 66 records, dataVersion `2026-09-08-my-gear-v4-perception-joyride-1`, strict structured facts/IndexedDB and optional stable-ID Markdown Notes. KB schema1 has 54 entities, dataVersion `2026-09-08-kb-v1-rods-reels-caption-1`, a flat type index and complete authored Markdown. Catch schema2 has five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`, exact known relationships and optional Markdown Notes. Share identity, ownership, validation and authored-link principles without forcing identical schemas/storage. No Planner, sessions or multi-user expansion.

Gear displays Equipment (key `accessories`); KB displays Gear Guides (type `equipment`). Preserve stable IDs, user facts, authored text, historical relationships, image bytes and provenance. No inferred ownership or Catch attribution. `gear://` and `kb://` are authored navigation, not a speculative relationship graph.

Browser Add/Edit prepares validated packages for chat/repository promotion; it does not write GitHub or maintain a competing local database. User images are uploaded directly to exact GitHub branch/path/filenames. Do not transport image bytes through the connector. Do not delete current media before replacement validation. Revalidate final transformed data after all media stages. User-maintained Markdown is not a frozen full-text test fixture; preserve durable facts and authored links while allowing legitimate content edits.

## Release and handoff discipline

Use a feature branch/PR for meaningful runtime work, normal CI against the current base, expected-head merge and actual production Pages verification. Respect workflow permissions; do not omit required permanent tests or bypass denied permission. Do not rerun one-time migration scripts. Avoid overlapping direct-main content writes and Pages releases (`fishing-pages`, cancel-in-progress). Reconcile Context, TODO, Decision Log, affected documentation and this bootstrap against actual final state before chat transfer. If interrupted, preserve exact current branch/commit, completed tests and remaining actions rather than restarting from memory. Stop only for a genuine blocker or fully completed scope.
