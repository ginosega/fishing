# Fishing

Durable project repository for personal fishing/kayak knowledge, owned gear, catch records and Fishing Companion. GitHub is the authoritative source. Current records are concise; complete earlier versions are preserved in Git history and `History/`. Archived records are evidence, not parallel current sources.

## Current state

**Production healthy; two-picture release deployed.** PR52 merged as `91ee0966eff5ef95d6a7d192a95b10940d0b534e`. Normal PR CI #266 / `34185963172` passed against main `4ca1613d089859cfd554636e8c554acd6178cdc1`; production #267 / `34186006471` passed all tests, build, media/final-bundle validation and actual GitHub Pages deployment on September 8, 2026. Buzzbait KB and Z-Man Jack Hammer images are registered. FISH-TODO-062 is DONE. Browser acceptance and an independent HTTP fetch have not been claimed.

The latest application-feature release remains PR48 (KB Add/Edit). PR47 deployed Gear schema4/Cylinder Weights, PR49 closed that release, PR50 recovered the content regression, and PR51 reconciled recovery documentation. FISH-TODO-058–062 are DONE. The new filename-usability feedback is FISH-TODO-063, OPEN. No application release is pending.

Live site: [Fishing Companion](https://ginosega.github.io/fishing/). See [Image release closeout](pwa/IMAGE_RELEASE_2026-09-07.md) for exact source identity, test/deployment evidence and preservation details.

## Authoritative project records

- [Context](Fishing_Context.md) — current architecture, equipment and project state.
- [TODO](Fishing_TODO.md) — one canonical backlog and completed release evidence.
- [Decision Log](Fishing_Decision_Log.md) — current accepted decisions and process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restore instructions and release baseline.
- [PWA README](pwa/README.md) — runtime architecture, build/test commands and deployment.
- [Image release closeout](pwa/IMAGE_RELEASE_2026-09-07.md) — latest production and media evidence.
- [Recovery closeout](Fishing_Recovery_Closeout_2026-09-07.md) — PR50 recovery evidence.
- [Historical documentation](History/) — exact prior records, including the pre-image-closeout snapshots.

Gear Registry, Tackle Inventory, Topics, original OneNote/PDF material and older releases remain reference/history. Runtime domain owners are the structured PWA sources and stable-ID authored Markdown. Do not infer ownership from candidate research.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval.

An authorized change is one end-to-end transaction through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation. Do not stop for intermediate approval; progress is informational. Stop only for genuine blockers or completed scope.

Restore current main and relevant branches before changes; preserve all user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and verified production Pages deployment. Do not bypass denied permissions, omit permanent tests or rerun one-time migrations. Validate final transformed data after media stages. User image binaries are uploaded directly to exact GitHub paths, never transported through the connector. Preserve old media/provenance until replacement validation. Shared Pages concurrency is `fishing-pages`, cancel-in-progress; avoid overlapping releases/direct-main content writes.

Fishing Companion is single-user/offline-capable with Gear schema4/64 records, KB schema1/54 entities and Catch schema2/five historical records. The domains share identity/ownership/validation principles, not identical schemas. No Planner, sessions, speculative relationships or multi-user scope. Start new work from current main and the canonical TODO, not retired migration/audit branches.
