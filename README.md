# Fishing

Durable project repository for personal fishing/kayak knowledge, owned gear, catch records and Fishing Companion. GitHub is authoritative; earlier complete documentation is preserved in Git history and `History/`, not maintained as parallel current databases.

## Current state

**Production healthy; kayak correction and three KB pictures deployed.** PR56, merge `531f04a84c0d75e2a7f23dc368149de5026b607b`, passed normal CI #284 / `34188600391` and production #285 / `34188668110`, including actual GitHub Pages deployment on September 8, 2026. The Dagger Axis 10.5 Length is corrected to the user-confirmed `10' 6"`. Fishing Line, Walking Bait and Rods & Reels now have the requested pictures. All authored Markdown and unrelated domain records are preserved. The latest user-replaced Dagger PNG is retained. FISH065 and FISH066 are DONE. FISH063 remains OPEN for KB image-filename usability. Browser acceptance and independent live HTTP verification are separate from verified deployment.

Current sources: Gear schema4/65 records, dataVersion `2026-09-08-my-gear-v4-dagger-length-1`; KB schema1/54 entities, dataVersion `2026-09-08-kb-v1-three-hero-images-1`; Catch schema2/five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`. No application release is pending. PR47–55 remain closed historical release evidence.

Live site: [Fishing Companion](https://ginosega.github.io/fishing/). See [latest release closeout](pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md) for exact implementation and deployment evidence.

## Authoritative project records

- [Context](Fishing_Context.md) — current architecture, source versions, equipment and media state.
- [TODO](Fishing_TODO.md) — one canonical backlog, including completed and unresolved tasks.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restore instructions and latest verified baseline.
- [PWA README](pwa/README.md) — runtime architecture, build/test commands and deployment.
- [Latest release](pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md) — PR56 correction and three pictures.
- [Dagger addition history](pwa/DAGGER_AXIS_RELEASE_2026-09-08.md) — PR54 and subsequent correction.
- [Historical documentation](History/) — exact prior versions, not competing current authority.

Gear Registry, Tackle Inventory, Topics, original OneNote/PDF material, decision history and older release records remain reference/history. Structured PWA sources and stable-ID authored Markdown own current runtime facts. Do not infer ownership or historical catch relationships from reference material.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval.

An authorized change is one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without repeated approval gates. Stop only for genuine blockers requiring user input/permission or complete scope. Progress updates are informational.

Restore current main and relevant branches before changes; preserve user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and verified production Pages deployment. Respect denied permissions, retain permanent tests and never rerun one-time migrations. Validate final transformed data after media stages. User image binaries are uploaded directly to exact GitHub paths, never transported through the connector. Preserve source bytes/provenance and existing ownership. Shared Pages concurrency is `fishing-pages`, cancel-in-progress; avoid overlapping releases/direct-main content writes.

Fishing Companion is single-user/offline-capable. The domains share identity, ownership, validation and authored-link principles without identical schemas. No Planner, sessions, speculative relationships or multi-user expansion. Start new work from current main and the canonical TODO, not retired migration/audit branches.