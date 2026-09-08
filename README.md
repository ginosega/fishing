# Fishing

Durable project repository for personal fishing/kayak knowledge, owned gear, catch records and Fishing Companion. GitHub is the authoritative source. Earlier complete documentation is preserved in Git history and `History/`; archived records are evidence, not parallel current databases.

## Current state

**Production healthy; latest maintenance release is PR56.** PR56 merged as `531f04a84c0d75e2a7f23dc368149de5026b607b`. Normal PR CI #284 / `34188600391` passed against main `5265a393cce601a59540de2a17f5b7c56b4d3535`, and production #285 / `34188668110` passed all tests, build, media/final-bundle validation and the actual GitHub Pages deployment on September 8, 2026.

PR56 corrected the Dagger Axis 10.5 Length to the user-confirmed `10' 6"` and registered the three user-supplied KB hero pictures for Fishing Line, Walking Bait and Rods & Reels. Fishing Line keeps its explicit `sufix-832-15` Gear association; no ownership/provenance was inferred for the other two images. All authored Markdown and unrelated data/media were preserved. Gear remains schema4/65 records with dataVersion `2026-09-08-my-gear-v4-dagger-length-1`. KB remains schema1/54 entities with dataVersion `2026-09-08-kb-v1-three-hero-images-1`. Catch remains schema2/5 historical records. FISH-TODO-065 is DONE. FISH-TODO-063, the KB image filename/destination usability issue, remains OPEN.

The latest application-feature release remains PR48 (KB Add/Edit). PR47 deployed Gear schema4/Cylinder Weights, PR49 closed its records, PR50 recovered the content regression, PR51 reconciled recovery, PR52 deployed Buzzbait/Jack Hammer images, PR53 closed those records, PR54 added the Dagger Axis 10.5 and PR55 closed that release's records.

Live site: [Fishing Companion](https://ginosega.github.io/fishing/). See [Dagger/KB image closeout](pwa/DAGGER_AXIS_RELEASE_2026-09-08.md) for current release evidence and preservation details.

## Authoritative project records

- [Context](Fishing_Context.md) — current architecture, equipment and project state.
- [TODO](Fishing_TODO.md) — one canonical backlog.
- [Decision Log](Fishing_Decision_Log.md) — accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restore instructions and latest release baseline.
- [PWA README](pwa/README.md) — runtime architecture, build/test commands and deployment.
- [Dagger/KB image closeout](pwa/DAGGER_AXIS_RELEASE_2026-09-08.md) — latest maintenance release evidence.
- [Historical documentation](History/) — exact prior versions, not competing current authority.

Gear Registry, Tackle Inventory, Topics, original OneNote/PDF material, decision history and older release records remain reference/history. Runtime domain owners are the structured PWA sources and stable-ID authored Markdown. Do not treat historical inventory/candidate research as current ownership without confirmation.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval.

An authorized change is one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without repeated approval gates. Stop only for genuine blockers requiring user input/permission or complete scope. Progress updates are informational.

Restore current main and relevant branches before changes; preserve user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and verified production Pages deployment. Do not bypass denied permissions, omit permanent tests or rerun one-time migrations. Validate final transformed data after media stages. User image binaries are uploaded directly to exact GitHub paths, never transported through the connector. Preserve old media/provenance until replacement validation. Shared Pages concurrency is `fishing-pages`, cancel-in-progress; avoid overlapping releases/direct-main content writes.

Fishing Companion is single-user/offline-capable with Gear schema4/65 records, KB schema1/54 entities and Catch schema2/five historical records. The domains share identity/ownership/validation principles, not identical schemas. No Planner, sessions, speculative relationships or multi-user scope. Start new work from current main and the canonical TODO, not retired migration/audit branches.
