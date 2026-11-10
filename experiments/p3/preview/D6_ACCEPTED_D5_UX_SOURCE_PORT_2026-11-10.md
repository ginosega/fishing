# D6 selective import of owner-approved D5 V3 UX source

**State:** Source-only, inert until explicit production integration; this document is a
review manifest, not a new UX specification or public release approval.

**Accepted owner UX:** [D5 UX #357](https://github.com/ginosega/fishing/issues/357)
was closed with Windows Edge / Android acceptance. [D6 #396
clarification](https://github.com/ginosega/fishing/issues/396#issuecomment-6771522034)
states that the final Connection Status production gate is **integration and
regression acceptance**, **not** permission to redesign the owner-approved
screen. Owner reconfirmed this on 2026-11-10.

## Verified immutable sources

- Imported from isolated D5 owner branch
  `feature/fish118-d5-owner-integration@298ab5e76e48b8d66102d179dbf62d881c642226`.
  These 13 Git blob SHAs are asserted by
  `pwa/test/d6-approved-d5-ux-port.test.mjs`.
- Imported into D6 draft, stacked after [#409](https://github.com/ginosega/fishing/pull/409)
  head `892bc3ade12e9c09bfde6e57ee2def4f4702a0c4`. Git copies
  preserve byte-for-byte source content, with **no public entrypoint wiring**.
- Current public `main`, canonical `pwa/Gear/`, `pwa/KB/` and
  `pwa/Catches/`, media and old V2 release remain unchanged. Do not
  accidentally propagate private D5 synthetic sandbox records.

## Selective source-port inventory

| D5 modules now copied verbatim | Intended future role |
| --- | --- |
| `v3-connection-experience.mjs`, `v3-connection.mjs`, `d5-auth-return.mjs`, `diagnostics.mjs` | Approved Connection Status and account/publication UI, preserving presentation and semantics |
| `notes-markdown-editor.mjs`, `notes-link.mjs`, `editor-preview.mjs` | Approved Notes edit/preview and link controls |
| `catch-editor.mjs`, `catch-fields.mjs`, `catch-lure-picker.mjs` | Approved Catch Add/Edit source |
| `d5-device-drafts.mjs`, `d5-editor-recovery.mjs`, `d5-editor-entry-gate.mjs` | Local draft recovery and fail-closed owner editing guards |

Not copied here: `d5-owner-candidate.mjs`,
`d5-sandbox-baseline.mjs`, `d5-owner-overlay.mjs`,
`d5-owner-first-visit.mjs`, and `v3-reader-candidate.mjs`.
They contain private candidate or sandbox-specific routing and provenance, so
they **must not** be reused as the production owner authority.

**Existing source reconciliation:** D5 `pwa/src/` directory has 41 files;
D6 before this import had 26; 18 D5-only, 12 same-path changed, and 11
same-byte identical. This PR imports 13 of the D5-only files; it intentionally
does not overwrite the 12 changed files. The changed group includes
`ui.mjs`, `styles.css`, `app.mjs`, `offline.mjs`, `editor.mjs`,
`shared.mjs`, `markdown.mjs`, `validation.mjs`, `sw.mjs`,
`handoff.mjs`, `markdown-viewer.mjs` and `entry.mjs`.
Each requires a future **reviewed selective reconciliation**, rather than an
unreviewed copy from a different release/hosting scope.

## Outstanding integration contract

1. Preserve accepted Account / Publishing Status / Offline Library
   appearance, progress, actions and Automatic/Work Offline logic. Do not
   propagate the D6 static Stage A `Owner session unavailable` placeholder
   as a normal production account state. The D5 prototype may use internal
   `sandboxVerified` labels; production source/receipt code must translate
   them to **actual canonical-main public Live evidence**, not show
   `Sandbox Live` as a production claim.
2. Future production build must explicitly validate the exact V3
   `/fishing/` origin/scope and immutable release, use the reviewed D6
   OAuth owner session and canonical GitHub source, and have a separate
   **default-OFF write authorization gate**. Never reuse D5/D3 sandbox
   OAuth/publisher/overlay or bridge token.
3. Do not reveal CSRF/session/key/token to browser response. Offline
   remains read-only, no blind operation retry, no destructive draft testing.
   UI visibility is not authorization.
4. Preserve `pwa/src/entry.mjs`, `pwa/src/ui.mjs` and current D6
   build behavior in this PR. New imports are **not reachable** in deployed
   code, so this PR's CI is source-fidelity proof, not acceptance of
   production V3 editing or final Connection Status rendering.
5. Next bounded engineering task: reconcile D5 accepted UI/editor paths with
   D6 production entry, source and owner session **without changing
   the accepted design**, gate write capabilities OFF pending validated
   canonical publisher, and prove both the view and denial states through
   dedicated browser tests. Verify with owner on Windows/Android before
   closing #396.

**Release controls:** No D6 PR merged to `main` (the main push triggers
publication), no Cloudflare route, D1, GitHub App, OAuth credentials or write
permissions installed; no production source, public byte or device acceptance
claimed by source CI. Owner-approved ARC-007 accepts a planned V3 cutover with
V2 downtime and no full V2 rollback rehearsal, but preserves security,
content/draft integrity and separately approved cutover.
