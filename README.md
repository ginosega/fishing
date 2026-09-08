# Fishing

Durable project repository for personal fishing/kayak knowledge, owned gear, catch records and Fishing Companion. GitHub is authoritative; earlier complete documentation is preserved in Git history and `History/`, not maintained as parallel current databases.

## Current state

**Production healthy; Cranberry Lake picture and page-copy corrections deployed.** PR60, final head `cd47dc9ce39660840de493346e7df9fda72a14e5`, normal CI #307 / `34191643311`, merge `ecd9f3d52ca8180ea4f48ec888e7574105deafda`, production #308 / `34191692935`, including actual GitHub Pages deployment. Gear schema4/66 uses `2026-09-08-my-gear-v4-perception-joyride-1`; KB schema1/54 uses `2026-09-08-kb-v1-cranberry-lake-picture-1`; Catch schema2/5 remains `2026-09-04-catches-v2-external-notes-1`. FISH069 and FISH070 are DONE; FISH063 remains OPEN. No application release is pending. See `pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md`.

PR60 registered the user-uploaded Cranberry Lake PNG and its exact alt/caption, preserving all authored Markdown and other entity facts. Home/KB, Gear Guides, Techniques and Catch Log subtitles now match the requested wording. Earlier Joyride, Dagger, hero-media and Gear/Catch data remain preserved. No Planner or speculative relationships were added.

Live site: [Fishing Companion](https://ginosega.github.io/fishing/). See [latest release closeout](pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md) for exact evidence. Previous PR58 and earlier records remain historical evidence.

## Authoritative project records

- [Context](Fishing_Context.md) — current architecture, source versions, equipment and media state.
- [TODO](Fishing_TODO.md) — one canonical backlog, including completed and unresolved tasks.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restore instructions and latest verified baseline.
- [PWA README](pwa/README.md) — runtime architecture, build/test commands and deployment.
- [Latest release](pwa/RELEASE_2026-09-08_CRANBERRY_COPY.md) — PR60 Cranberry Lake picture and page-copy release.
- [Previous Joyride/caption release](pwa/RELEASE_2026-09-08_JOYRIDE_RODS_CAPTION.md) — PR58 historical evidence.
- [Previous kayak/KB image release](pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md) — PR56 correction and three pictures.
- [Historical documentation](History/) — exact prior versions, not competing current authority.

Gear Registry, Tackle Inventory, Topics, original OneNote/PDF material, decision history and older release records remain reference/history. Structured PWA sources and stable-ID authored Markdown own current runtime facts. Do not infer ownership or historical catch relationships from reference material.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval.

An authorized change is one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without repeated approval gates. Stop only for genuine blockers requiring user input/permission or complete scope. Progress updates are informational.

Restore current main and relevant branches before changes; preserve user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and verified production Pages deployment. Respect denied permissions, retain permanent tests and never rerun one-time migrations. Validate final transformed data after media stages. User image binaries are uploaded directly to exact GitHub paths, never transported through the connector. Preserve source bytes/provenance and existing ownership. Shared Pages concurrency is `fishing-pages`, cancel-in-progress; avoid overlapping releases/direct-main content writes.

Fishing Companion is single-user/offline-capable. The domains share identity, ownership, validation and authored-link principles without identical schemas. No Planner, sessions, speculative relationships or multi-user expansion. Start new work from current main and the canonical TODO, not retired migration/audit branches.
