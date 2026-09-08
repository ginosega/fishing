# Fishing

Durable project repository for personal fishing/kayak knowledge, owned gear, catch records and Fishing Companion. Current authoritative records are concise; full pre-recovery versions are preserved under `History/2026-09-07-pre-recovery/` and in Git history. Archived records are evidence, not parallel current sources.

## Current state

**Production recovery verified.** Latest maintenance release PR50, merge `fcf28f34b89f68c22e8a2200e8410509801ff801`, normal CI #259 / `34184091548` and production #260 / `34184126036` succeeded, including actual GitHub Pages deployment. The stale Bonafide Notes regression was repaired and the full audit branch incorporated without reverting user edits. Latest application-feature release remains PR48 (KB Add/Edit); PR47 deployed Gear schema4/Cylinder Weights, PR49 closed release records. FISH058/059/060/061 DONE. No pending application release.

Live site: [Fishing Companion](https://ginosega.github.io/fishing/). See [Recovery closeout](Fishing_Recovery_Closeout_2026-09-07.md) for exact evidence, preservation and verification limitations. User acceptance is a normal follow-up. Do not confuse historical release handoffs with unfinished work.

## Authoritative project records

- [Context](Fishing_Context.md) — current architecture, equipment and project state.
- [TODO](Fishing_TODO.md) — one canonical backlog, including FISH061 recovery closure.
- [Decision Log](Fishing_Decision_Log.md) — current accepted decisions and standing process.
- [New-chat bootstrap](Fishing_New_Chat_Bootstrap_Prompt.md) — restore instructions and latest release baseline.
- [PWA README](pwa/README.md) — runtime architecture, build/test commands and deployment.
- [Recovery closeout](Fishing_Recovery_Closeout_2026-09-07.md) — latest recovery evidence.
- [Historical documentation](History/2026-09-07-pre-recovery/) — exact prior versions, not current authority.

Gear Registry, Tackle Inventory, Topics, original OneNote/PDF material, decision history and older release records remain reference/history. Runtime domain owners are the structured PWA sources and stable-ID authored Markdown. Do not treat historical inventory/candidate research as current ownership without confirmation.

## Operating and release discipline

Use Chat mode by default. Do not recommend Work for complexity, duration, file volume, research, calculations, analysis or artifact creation. Recommend a temporary switch only for a specific Work-only capability, explain the need and obtain approval.

An authorized change is one end-to-end transaction. Continue through implementation, validation, PR/CI, merge, production verification, cleanup and authoritative-record reconciliation without repeated approval gates. Stop only for genuine blockers requiring user input/permission or complete scope. Progress updates are informational.

Restore current main and relevant branches before changes; preserve all user-authored files and direct-main edits. Meaningful runtime work uses a feature branch, normal exact-head/current-base CI, expected-head merge and verified production Pages deployment. Do not bypass denied permissions, omit permanent tests or rerun one-time migrations. Validate final transformed data after media stages. User image binaries are uploaded directly to exact GitHub paths, never transported through the connector. Preserve old media/provenance until replacement validation. Shared Pages concurrency is `fishing-pages`, cancel-in-progress; avoid overlapping releases/direct-main content writes.

Fishing Companion is single-user/offline-capable with Gear schema4/64 records, KB schema1/54 entities and Catch schema2/five historical records. The domains share identity/ownership/validation principles, not identical schemas. No Planner, sessions, speculative relationships or multi-user scope. Start new work from the current TODO, not retired migration/audit branches.
