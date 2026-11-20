# Fishing V3 — Shared media architecture and approval gates

**Status: source-only design and fail-closed UI contract.** FISH-TODO-118 / ADR-0011. No R2 bucket, D1 schema, credential, provider upload endpoint or deployment is authorized by this document. User-approved goal: one consistent image-upload feature across Gear, KB and Catches, without restoring per-edit GitHub publishing.

## Verified existing implementation

- All three domains use the **same** accepted `createNotesMarkdownEditor` (`pwa/src/notes-markdown-editor.mjs`) and browser `validateBrowserImage` (JPEG/PNG/WebP/GIF, up to **10 MiB**, pixel/animation validation). Existing original images and Knot sequences are immutable Worker assets and are verified in release manifests.
- Gear/KB direct Save (`d6-approved-owner-editor-preview.mjs`) rejects `mediaAction!=='keep'`, selected picture files, selected Knot sequences and any Notes image uploads. Catch direct Save rejects new Notes images. None of the three Worker direct-D1 services persists new binary media.
- Old Gear/KB `allowUpload: typeof stageMedia==='function'` produced a false positive: the V3 UI supplied a placeholder that always throws. Catch correctly hid Insert Image. The source-only `DIRECT_D1_MEDIA_CAPABILITIES` contract now explicitly marks **all** new media uploads/replacements/sequences unavailable for all three domains, and a shared decorator provides identical disabled Insert Image UI. No accepted D5 Notes editor source is modified. Text and link Save remains available.

## Storage choice (recommendation, NOT approved provisioning)

| Option | Fit | Deficiency |
|---|---|---|
| Worker static assets | Keep existing source/hosted image history unchanged | Upload requires a new Worker assets deployment; incompatible with owner direct Save |
| D1 BLOB in existing database | No new binding | Cloudflare D1 **2,000,000-byte row/BLOB limit** conflicts with accepted 10 MiB photos; large binary rows burden the content database and backups |
| **R2 bound to existing private Worker** | **Recommended**: durable object bytes, read and write without rebuilding, existing D1 retains JSON, Markdown and metadata | Requires checking whether an existing appropriate R2 bucket can be reused; otherwise explicit owner approval for new bucket/binding and R2 activation/billing |

Source references: Cloudflare D1 limits <https://developers.cloudflare.com/d1/platform/limits/>; Cloudflare Worker static assets <https://developers.cloudflare.com/workers/static-assets/>; R2 Workers API <https://developers.cloudflare.com/r2/get-started/workers-api/>; R2 pricing <https://developers.cloudflare.com/r2/pricing/>. No assertion that the owner's Cloudflare account already has R2.

## One shared media service and client (proposed API, not executable)

- `POST /api/v3/media/stage`: same-origin, verified owner session, session-bound CSRF, upload intent, strict content length and method, no bearer-token fallback; accept at most one validated original per request, with batch orchestration for Knot sequences. Revalidate magic bytes, MIME, size, hash and allowable dimensions on the server; never trust client metadata alone. Require image types from the accepted allowlist (no SVG or HTML). Reject duplicates, path traversal and any out-of-scope domain/record.
- Stage immutable, content-addressed R2 objects in a private bucket; no public bucket listing or directly public R2 origin. Names use digest/opaque IDs to prevent overwrite and directory traversal. R2 `put` receipt proves bytes are stored but **does not alone make a content edit live**.
- D1 `d6_media_records` metadata (proposed; schema separately approved): logical media path, domain, owner record ID, blob SHA-256, content type, byte count, storage key, revision/state and timestamps. Existing verified Worker-asset paths remain unchanged and are never reuploaded. For new media, record/image-path references become live only with an owner-authenticated, expected-revision-checked D1 Save; publish the media mapping and record reference together, with fail-closed transactional or batch semantics. Failed/stale Save must not produce a live dangling reference. Handle staged orphan cleanup only with an independently approved, bounded retention policy—never delete still-referenced bytes on first replacement.
- `GET /api/v3/media/<validated-logical-path>`: read only a D1-indexed, live media mapping; return R2 bytes with verified MIME, Content-Length, strong immutable ETag, `X-Content-Type-Options: nosniff`, suitable cache and range handling. Read access aligns with the currently anonymous Gear/KB/Catch library; uploading remains owner-only. No arbitrary R2 key access or user-supplied external URL proxy.
- One shared browser uploader and server image handler, with policy-based domain differences only: Gear cover image and Notes, KB cover/Notes/Knot sequence (atomic complete sequence), Catch Notes images. Shared progress/failure/retry receipts, media preview, filename collision policy, and persisted verification. Files over 10 MiB remain rejected unless the product requirement and validator are explicitly revised.
- **Critical integration:** The existing Notes parser/preview, `knownPaths`, static release manifest and `ctx.asset(...)` only resolve frozen image paths. The future client **must** extend the verified path registry to include D1-authorized live media and resolve them via the private Worker GET route. A successful upload without this reader integration is not an accepted feature.

## Guardrails and acceptance

1. Before implementation, **read-only check** whether the user's Cloudflare account already contains an R2 bucket safe for this private project; do not assume or create one. Obtain explicit owner approval for any new binding/bucket and for D1 schema or data writes. No R2 service enabled, credential issued or Wrangler deploy before approval.
2. Source-only unit/integration tests: unsigned upload denied; cross-origin/CSRF denied; MIME/magic mismatch, invalid filename/unsafe path, over-limit and hash discrepancy denied; stalled/partial upload and duplicate path denied; stale Save/409 prevents publication; single image and multi-step Knot atomicity; anonymous GET serves only referenced live media; OFF and offline mode hide writes.
3. Owner staging acceptance per domain: upload a real test image, authenticated Save, reload on Windows Edge and Android, exact hash/bytes and image rendering, link/alt/caption/Viewer, stale edit refusal, reversible replacement, offline fallback and backup/recovery. Preserve original 100 Gear/60 KB/12 Catch content without reimports or historical release rewrites.
4. Separate approval sequence: storage design/provider selection, optional R2 resource+binding, D1 metadata schema, bounded source-only backend, private deploy, physical acceptance, app merge and public cutover. Each gate remains fail-closed and auditable in issue #377.

**Current release stays unchanged** until the owner approves its next private deployment. The shared capability source changes do **not** activate uploads.
