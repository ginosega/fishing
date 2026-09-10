# Fishing

Durable project repository for personal fishing/kayak knowledge, owned gear, catch records and Fishing Companion. GitHub is authoritative; earlier complete documentation is preserved in Git history and `History/`, not maintained as parallel current databases.

## Current state

**Production healthy; Perception Joyride and Rods & Reels caption deployed.** PR58, merge `8cceecc42d7ffab1c672e6991378d032136145b4`, passed normal PR CI #297 / `34189898597` and production #298 / `34189948481`, including actual GitHub Pages deployment on September 8, 2026.

PR58 added the user-supplied owned Gear record `perception-joyride-10-0` (Perception Joyride 10.0) exactly as submitted, registered the already-uploaded `pwa/assets/gear-source/perception-joyride-10.png` with explicit ownership, and created no Notes. It also changed only the existing Rods & Reels hero-picture caption to `Baitcasting reel`; the picture bytes, alt text, content path and complete authored Markdown were preserved. The Dagger Axis 10.5 remains at the confirmed `10' 6"` and its latest user-replaced source image remains preserved. FISH-TODO-068 is DONE. FISH-TODO-063 remains OPEN for KB image-filename/upload-destination usability.

Current sources: Gear schema4/66 records, dataVersion `2026-09-08-my-gear-v4-perception-joyride-1`; KB schema1/54 entities, dataVersion `2026-09-08-kb-v1-rods-reels-caption-1`; Catch schema2/five historical records, dataVersion `2026-09-04-catches-v2-external-notes-1`. No application release is pending.

Live site: [Fishing Companion](https://ginosega.github.io/fishing/). See [latest release closeout](pwa/RELEASE_2026-09-08_JOYRIDE_RODS_CAPTION.md) for exact implementation and deployment evidence. Earlier PR47–57 release records remain historical evidence.

## Authoritative project records

- [Context](Fishing_Context.md) — current architecture, source versions, equipment and media state.
- [TODO](Fishing_TODO.md) — one canonical backlog, including completed and unresolved tasks.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restore instructions and latest verified baseline.
- [PWA README](pwa/README.md) — runtime architecture, build/test commands and deployment.
- [Latest release](pwa/RELEASE_2026-09-08_JOYRIDE_RODS_CAPTION.md) — PR58 Joyride/caption release.
- [Previous kayak/KB image release](pwa/RELEASE_2026-09-08_KAYAK_KB_IMAGES.md) — PR56 correction and three pictures.
- [Historical documentation](History/) — exact prior versions, not competing current authority.

Gear Registry, Tackle Inventory, Topics, original OneNote/PDF material, decision history and older release records remain reference/history. Structured PWA sources and stable-ID authored Markdown own current runtime facts. Do not infer ownership or historical catch relationships from reference material.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval.

An authorized change is one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without repeated approval gates. Stop only for genuine blockers requiring user input/permission or complete scope. Progress updates are informational.

Restore current main and relevant branches before changes; preserve user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and verified production Pages deployment. Respect denied permissions, retain permanent tests and never rerun one-time migrations. Validate final transformed data after media stages. User image binaries are uploaded directly to exact GitHub paths, never transported through the connector. Preserve source bytes/provenance and existing ownership. Shared Pages concurrency is `fishing-pages`, cancel-in-progress; avoid overlapping releases/direct-main content writes.

Fishing Companion is single-user/offline-capable. The domains share identity, ownership, validation and authored-link principles without identical schemas. No Planner, sessions, speculative relationships or multi-user expansion. Start new work from current main and the canonical TODO, not retired migration/audit branches.
