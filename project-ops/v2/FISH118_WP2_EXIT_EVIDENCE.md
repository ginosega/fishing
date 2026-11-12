# FISH118 WP2 — scoped exit evidence (2026-11-12)

**Gate:** WP2 production-shaped **isolated** authentication/canonical-read exit **VERIFIED**, not full V3 requirement or writable release acceptance. **Authority:** [completion contract](FISH118_V3_COMPLETION_CONTRACT.md); the active WP status pointer remains [WORK_QUEUE.md](WORK_QUEUE.md). [Owner/provider field receipt](https://github.com/ginosega/fishing/issues/377#issuecomment-6833628839). Owner field evidence is owner-reported; GitHub CI alone never proves deployment.

## Frozen evidence

- Source: app [draft #455](https://github.com/ginosega/fishing/pull/455), exact head `77b8e18207cce15ad7301f38fdecb30178795999`, still unmerged. [Exact-head full CI #43277247187](https://github.com/ginosega/fishing/actions/runs/43277247187) SUCCESS: **466/466 Node tests**, 54 preview browsers, 6 production owner browsers, 38 WP1 editor browsers, 56 production browser tests; deploy lanes SKIPPED.
- Owner-operated isolated Cloudflare Worker `fishing-d6-wp2-test` version **`f0849ef6-1832-45cf-ab5f-3e24a5f8befa`**; immutable Pages release ID **`f43fb624ae54fc26daee2f7bd59a6650`**, source revision `8b5ec18ad3a803bda9848d80898d30bec044e3c4`, preserved. No public V3 route or app `main` merge.
- Owner Edge OAuth session `authenticated:true,authorized:true`, successful authenticated `GET /api/v3/authoring-source` for GitHub canonical `ginosega/fishing` `refs/heads/main` and server-side read-only installation grant. Real-provider local snapshot checked 135 Markdown, 17 immutable GraphQL batches, **31 external requests / 50** Free-plan budget, `sourceOnly:true`, `canPublish:false`. Canonical main SHA at local test `fc85bd38c4c688026700971b4c2d463c293eebf3` is time-specific, not a permanent pin.
- Owner-operated post-deploy denial PASS: three encrypted Worker secrets retained (names only); anonymous `/session` denies auth; anonymous source **401**; both GET/POST `/api/v3/operations` and `/api/v3/media` **404**; no authoring/publishing provider exposed. No D1 migration/public V2/Stage A change in this checkpoint.
- GitHub App grant is repo-scoped `contents:read`, with no write scope. No private key, OAuth token, GitHub installation token, CSRF or owner session secret embedded in a public response. Tests enforce immutable Git tree/Markdown hash checking and fail-closed source/Pages identity.

## Requirement disposition at WP2 scope

| WP0 matrix ID | WP2 disposition and evidence | Remaining V3 acceptance outside WP2 |
| --- | --- | --- |
| V3-AUTH-01 | **WP2 PASS.** Anonymous `/session` and source denied; Stage A public catalog/anonymous reader and WP1 no-authoring tests. | Final Windows/Android public UI field test WP5. |
| V3-AUTH-02 | **WP2 PASS (authorization/denial).** Exact numeric owner pin; `D6-OAUTH04`, `D6-OWN04`, `D6-ROUTE03`; write/media GET/POST remain 404. | Actual authorized Add/Edit/Save/Upload and independent trusted writer authorization WP3; owner installed-device flows WP5. |
| V3-AUTH-03 | **WP2 PASS.** Server-only GitHub App/OAuth/CSRF secrets; 3 encrypted Worker secret names; response redaction `D6-GW04`, `D6-ROUTE04`. | New write-provider credential custody and mutation tokens WP3/WP6. |
| V3-AUTH-04 | **WP2 PASS (session gateway).** Silent valid owner session and minimal anonymous fallback `D6-OWN02/03`; OAuth + sign-out `D6-BIND07/12`. | Complete Connection Status and installed-PWA return/expiry field acceptance WP5. |
| V3-AUTH-06 | **WP2 PASS (read least privilege).** Repo-pinned `contents:read` grant `D6-TRUST03`, no write routes; no login-based implicit write authorization. | Auditable GitHub PR/tree/merge/receipt for **submitted changes** WP3/WP4. |
| V3-AUTH-07 | **WP2 PASS (expiry/revocation).** Seven-day server-side D1 session expiry; `D6-OWN04/06`, `D6-BIND12/13` revoke on sign-out and reject forged sign-out. Explicit re-auth for absent/expired session. | Full expired-session UX/device acceptance WP5; write privilege revocation WP3/WP6. |
| V3-X-03 | **WP2 PASS (read-only boundary).** All public writer/media methods absent (404); `D6-BIND08`, `D6-GW06`, `D6-ROUTE02/03`, D2 session adapter enforces origin/intent/method/CSRF for future writes but **WP2 exports no writer**. | CSRF-invalid **wired live write** denial and media upload/validation/failure safety WP3, then WP5/6. |

## Additional WP2 security negatives

OAuth issuer `iss` exact GitHub RFC 9207 and spoof rejection `D6-OAUTH13`; short-lived PKCE, atomic single-use state and replay `D6-OAUTH02/05`; foreign owner, cross-origin and failed D1 storage `D6-OAUTH04/07/09`; malformed, expired or wrong-host session `D6-OWN04/05/07`; forged sign-out `D6-BIND13`; source route never requests GitHub for unauthorized/expired sessions `D6-ROUTE03`; wrong GitHub repo/ref/hash, GraphQL tampering, hosted bytes and redirects denied `D6-TRUST04/06/12/13`. Source-only and mock denial tests are not falsely labeled as independently exercised live foreign-user/browser/device scenarios.

## Exit / next gate

WP2 isolated hosted source/auth integration and its fail-closed **non-writable** boundary have met the approved WP2 work-package exit. **WP0's full V3 66-ID requirement acceptance remains open**; the carried forward parts listed above are mandatory WP3/WP4/WP5/WP6 obligations, not waived or newly scoped milestones. WP3 must separately obtain owner approval for writer GitHub App privileges/credentials, D1/Worker modifications and controlled provider writes. No publisher, real source mutation, public route, app `main` merge, V3 public Live or cutover was approved here. **Transfer to a new chat before beginning WP3**, using the default-main static recovery prompt and bounded GitHub reads.