# Fishing

Durable project repository for personal fishing/kayak knowledge, owned gear, catch records and Fishing Companion. GitHub is the authoritative source. Earlier complete documentation is preserved in Git history and `History/`; archived records are evidence, not parallel current databases.

## Current state

**Production healthy; Dagger Axis addition deployed.** PR54 merged as `0c07816b33c282cbc31e162812ad15c45d3a4bbe`. Normal CI #273 / `34187137697` passed against current main, and production #274 / `34187188334` passed all tests, build, media/final-bundle validation and the actual GitHub Pages deployment on September 8, 2026. The Dagger Axis 10.5 is registered under My Gear → Equipment → Kayaks with its uploaded picture. FISH-TODO-064 is DONE. The submitted length awaits confirmation under FISH-TODO-065; the stored value has not been changed. Browser acceptance and independent live HTTP verification are not claimed.

The latest application-feature release remains PR48 (KB Add/Edit). PR47 deployed Gear schema4/Cylinder Weights, PR49 closed its records, PR50 recovered the content regression, PR51 reconciled recovery, PR52 deployed Buzzbait/Jack Hammer images and PR53 closed those records. Current source counts are Gear schema4/65, KB schema1/54 and Catch schema2/5. No application release is pending. The separate KB filename usability issue FISH063 remains open.

Live site: [Fishing Companion](https://ginosega.github.io/fishing/). See [Dagger release closeout](pwa/DAGGER_AXIS_RELEASE_2026-09-08.md) for exact evidence and preservation, and [previous image release](pwa/IMAGE_RELEASE_2026-09-07.md) for prior media changes.

## Authoritative project records

- [Context](Fishing_Context.md) — current architecture, equipment and project state.
- [TODO](Fishing_TODO.md) — one canonical backlog, including FISH064 completion and FISH065 confirmation.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restore instructions and latest release baseline.
- [PWA README](pwa/README.md) — runtime architecture, build/test commands and deployment.
- [Dagger closeout](pwa/DAGGER_AXIS_RELEASE_2026-09-08.md) — latest application release evidence.
- [Historical documentation](History/) — exact prior versions, not competing current authority.

Gear Registry, Tackle Inventory, Topics, original OneNote/PDF material, decision history and older release records remain reference/history. Runtime domain owners are the structured PWA sources and stable-ID authored Markdown. Do not treat historical inventory/candidate research as current ownership without confirmation.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval.

An authorized change is one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without repeated approval gates. Stop only for genuine blockers requiring user input/permission or complete scope. Progress updates are informational.

Restore current main and relevant branches before changes; preserve user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and verified production Pages deployment. Do not bypass denied permissions, omit permanent tests or rerun one-time migrations. Validate final transformed data after media stages. User image binaries are uploaded directly to exact GitHub paths, never transported through the connector. Preserve old media/provenance until replacement validation. Shared Pages concurrency is `fishing-pages`, cancel-in-progress; avoid overlapping releases/direct-main content writes.

Fishing Companion is single-user/offline-capable with Gear schema4/65 records, KB schema1/54 entities and Catch schema2/five historical records. The domains share identity/ownership/validation principles, not identical schemas. No Planner, sessions, speculative relationships or multi-user scope. Start new work from current main and the canonical TODO, not retired migration/audit branches.
