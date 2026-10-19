# Fishing Companion v3 — Technical Architecture and Design Review

**Status:** **DRAFT / PROPOSED — NOT APPROVED.** This document is for separate technical-design review. It is not authorization to implement, deploy, migrate, configure credentials, or change production.
**Date:** October 19, 2026
**Repository:** `ginosega/fishing`
**Source inspected:** `aa64a13e3204ede57ef5b133e1152c957a20b662` on `main` (no open PRs at start of design research).
**Authority:** [Approved v3 requirements](Fishing_Companion_v3_Requirements.md), signed off October 19, 2026; [exact reviewed revision](https://github.com/ginosega/fishing/blob/121fafc496238caca1b593885e8f83d4f8f9a865/pwa/docs/Fishing_Companion_v3_Requirements.md); [requirements approval](Fishing_Companion_v3_Requirements_Approval_2026-10-19.md); approved [v2 baseline](Fishing_Companion_v2_Approved_Baseline.md); [FISH091](FISH091_Online_Only_Default_Requirements_2026-09-11.md); [FISH108](FISH108_Fast_Content_Release_Policy_2026-09-14.md).

**Approval gates:** Requirements **approved**. Technical design **pending separate review/sign-off**. Staged implementation plan and its authorization **pending**. Production v2 remains authoritative and operational.

## 1. Decision summary

The proposed architecture **retains the existing static GitHub Pages PWA and canonical source** and adds a **small trusted publication service** for owner identity, GitHub writes, publication tracking, and reconciliation. The service is operational infrastructure, **not a second canonical content database**. It uses a repository-restricted GitHub App, creates a content-only PR from the submitted change, waits for the existing Fast Content Release validation, merges automatically only if safe, then follows production deployment and independently verified hosted identity.

The browser gains: unobtrusive GitHub sign-in within Connection Status; one **Save and Publish** action; an optional/removable device-local draft layer; existing-image upload support; Catch Add/Edit; reader-mode selection; markdown image viewing; release-aware navigation; and build-generated card thumbnails.

**Critical conditional decision: session transport and PWA OAuth return.** The recommended GitHub App + serverless publication service is strong, but the existing `https://ginosega.github.io/fishing/` site and a separately hosted API are *cross-origin, often cross-site*. Cross-site cookies are not reliable on every supported browser. We should **not** declare silent owner recognition solved merely by choosing HttpOnly cookies. Before approving final hosting/session mechanics, validate the options in a non-production authentication proof of concept on real installed Android/iOS PWAs. Section 3 defines the decision gate. This document does **not** presume that a custom domain, a third-party cookie exception, or persistent browser-held OAuth tokens are approved.

Other deliberately open decisions and measurable test gates are summarized in Section 16.

## 2. Source-derived v2 inventory and reuse plan

At the inspected baseline:

| Area | Existing component and behavior | v3 design action |
|---|---|---|
| PWA startup | `pwa/src/loader.js` loads no-store `release.json`, validates the manifest SHA, then loads release-pinned app/CSS. | Preserve integrity; coordinate safe release transitions and owner-session UI. |
| Service worker | `pwa/src/sw.mjs` selects online-first verified release or complete explicitly prepared offline generation, pins a context per client in an in-memory map, and checks bytes. | Make release resolution survive service-worker restarts; support persisted Work Offline selection and consistent navigation. |
| Offline control | `pwa/src/offline.mjs` and Connection Status in `ui.mjs` implement explicit complete-library preparation, status, and reload. | Separate mode, network reachability, library readiness and identity; keep FISH091 atomicity; refresh visual layout. |
| Domains | `pwa/Gear/gear.json`, `pwa/KB/kb.json`, `pwa/Catches/catches.json` are schema v2, validated through `validation.mjs` and `contracts/schema.json`. | Preserve schema/IDs; add Catch browser authoring, not a new Catch data model. |
| Forms | `pwa/src/editor.mjs` has Gear/KB forms, picture and sequence selection, browser image validation, markdown preview, `Prepare Changes → Copy Changes`. | Reuse form components; replace user-facing copy handoff with Save and Publish; keep the source-aware package logic internally. |
| Source-aware edits | `pwa/src/handoff.mjs` implements `fishing-companion-change-v2`, base source revision/record fingerprint/field bases, narrative hashes and media metadata; `promoteChange` flags conflicts. | Extend trusted promotion for direct publishing and Catches; no force-overwrite and no silent loss of newer source edits. |
| Markdown / viewer | `pwa/src/markdown.mjs` resolves internal/external/local links and sanitizes HTML; `viewer.mjs` has picture, pinch, zoom and Knot sequence controls. | Attach viewer behavior to ordinary local Markdown images; retain hyperlink behavior and sanitizer. |
| Card images | `pwa/src/ui.mjs` uses `loading='lazy'` but full-resolution original sources for cards. | Emit disposable, hashed build thumbnails and choose image priority based on viewport. |
| Build | `pwa/tools/build.mjs` assembles content-addressed releases, manifest, release pointer; `sharp` already installed. | Add deterministic derived thumbnails without modifying canonical images or undermining manifest/release identity. |
| CI/CD | `.github/workflows/fishing-production.yml` PR classification: content-only = build/verify; noncontent = full tests. After merge: guarded Pages deploy then hosted byte/release verification. | Reuse FISH108; require exact PR-head/merge-base, completed CI and hosted verification before reporting Live. |

**Known v2 limits, not established root causes:** (1) Android installed Chrome PWA fails to open ordinary external links while normal Chrome/Edge tabs work; YouTube app links succeed. (2) An already-open session sometimes cannot load pages/images after publishing until manually refreshed. (3) card pictures visibly fill over ~3–4 seconds on PC and mobile. Root causes must be measured and reproduced, not assumed from code inspection.

## 3. Architecture alternatives: authorization, sessions and GitHub publishing

### 3.1 Options considered

| Approach | Benefits | Risks / reason not primary |
|---|---|---|
| **A. GitHub App + minimal trusted serverless API** (**recommended**) | GitHub identity independently validated; short-lived repo-scoped installation credentials held server-side; one-click broker-managed PR/build/merge/deploy status; no GitHub OAuth tokens in PWA. | Requires minimal hosted backend, protected secrets and durable operation/session metadata; cross-origin session design needs proof. |
| B. Browser-only GitHub App user OAuth/PKCE + GitHub REST | No separate publication service; lower hosting footprint. | Sensitive GitHub write credential or refresh material on user device; harder revoke/recover/rate-limit; browser/PWA redirect and durable operation tracking; greater security exposure for a publicly hosted static app. GitHub supports browser OAuth with PKCE but does not make persistent token storage risk-free. |
| C. GitHub OAuth App + backend proxy | Could provide sign-in and server writes. | Broader/less narrowly scoped permissions than a repository-installed GitHub App; no reason to prefer it given single-repository use. |
| D. Long-lived personal access token entered into app | Shortest implementation path. | **Rejected:** credential exposure, manual renewal, difficult secure persistence, undesirable public-app security model. |
| E. Replace GitHub Pages with a complete authenticated web app | Easier same-origin auth if hosted together. | **Rejected as unnecessary migration** unless option A cannot meet requirements within reasonable security/complexity. |

GitHub's official documentation supports GitHub App web authorization, recommended PKCE, separate user access and installation access tokens, expiry/refresh, and restricting installation tokens to individual repositories and granted permissions. See Section 17.

### 3.2 Recommended trust boundaries

```text
 Anonymous / owner browser (GitHub Pages PWA; read-only files public)
       |                   |
       | Public GET        | Authenticated HTTPS publish/status operations
       v                   v
 GitHub Pages           Trusted publication API / credential broker
 immutable assets       - validate owner numeric GitHub user ID
 release.json           - maintain revocable app session
                       - permitlist one repo and content paths
                       - independently validate package + bytes
                       - create content PR, monitor, merge when safe
                       - persist publish-job state
                                 |
                                 | short-lived GitHub App installation token
                                 v
                       ginosega/fishing GitHub
                           PR -> CI validation -> merge main
                                 |
                                 v
                       existing GitHub Actions/Pages pipeline
                                 |
                                 v
                       verified hosted release identity
```

**Trust:** The PWA is always a public, potentially attacker-controlled client. All write authority and GitHub App private keys remain server-side. A public sign-in link in Connection Status conveys no trust. The service checks GitHub's immutable **numeric user ID**, not just the changeable username, before creating *any* write operation. Keep a server-side one-repository allowlist and reject arbitrary repository/path/workflow requests.

**GitHub App installation:** Install only for `ginosega/fishing`. Start with repository Contents read/write and Pull Requests read/write; add only the minimum read permissions required for CI/run verification (e.g. Actions/Checks read after checking exact endpoint requirements). **Do not grant Actions write, Administration, Secrets or Pages write** merely for publishing. Let the existing GitHub Actions Pages publisher own actual deployment. Recheck necessary permissions against the APIs and any branch rules during the implementation plan.

### 3.3 GitHub authentication and unobtrusive UI

- Public sessions: no Add/Edit; the only visible sign-in entry is a small **Sign in with GitHub** link at the bottom of **Connection Status**; no owner bookmark or secret route.
- On launch: check for a **valid previously established application owner session** unobtrusively. If authorized, show Add/Edit, and in Connection Status display the GitHub identity and **Sign out**. If not, stay publicly readable with no redirect or popup.
- Sign-in begins only from a user action. Use GitHub App authorization-code web flow, with secure `state`, PKCE (S256), replay-resistant one-time callback, and strong callback/return URL validation. The server exchanges the code and resolves the authenticated GitHub numeric identity.
- An unauthorized GitHub account may complete GitHub login but **never** gains a publishing session. Show an appropriately discreet access-denied message; public reading remains available.
- Expiry/revocation: revoke/expire the application session, hide authoring controls, preserve an active local draft (if enabled), and offer reauthentication via Connection Status. Sign out must invalidate server-side rights; clearing client UI alone is insufficient.
- On Android/iOS installed PWAs, do not rely on `target="_blank"`, popups or `window.open` for OAuth. Design a user-initiated full navigation / callback / reentry flow and empirically verify preservation or recovery of the original app context. Never put access tokens or persistent session secrets in URL fragments/query strings or log them.

### 3.4 **Mandatory session/origin feasibility gate (AUTH-P0)**

**Fact:** `ginosega.github.io` and a separately hosted API do not share an origin, and may be cross-site. An HttpOnly cookie from that API sent as a third-party cookie can be blocked by modern browsers. CORS alone cannot bypass that restriction.

Test a *non-production* GitHub App login service with one of these designs:

1. **Preferred if achievable without unwanted migration:** same-site or same-origin HTTPS session boundary for the PWA and write API, with HttpOnly Secure appropriately scoped cookies, CSRF protection, and no credential exposed to JavaScript. A custom domain or reverse proxy would require **separate explicit user approval** because it changes hosting/operational obligations.
2. **Conditional fallback:** a revocable, narrowly scoped **application session** credential (never a GitHub token), with short lifetime and rotation, carried to the API explicitly over HTTPS. Evaluate local device persistence, XSS theft/replay, device compromise and sign-out. Use strict CSP, no third-party runtime scripts, origin allowlist, bounded refresh and server revocation. Browser-held credentials have **more risk** than HttpOnly first-party cookies; do not silently commit to this option.
3. **If neither is acceptably secure and reliable:** retain anonymous startup and require GitHub sign-in from Connection Status as needed, then return to the user with explicit trade-offs before changing the approved auto-recognition goal.

**Acceptance proof (real devices):** Sign in; close/reopen the ordinary browser and the installed PWA; restart the device; follow callback from GitHub; handle an expired session; sign out/revoke; test Chrome/Edge Android and Safari iPhone, including blocked third-party cookies. Record whether auth state is genuinely retained and the PWA regains focus correctly. A desktop emulator does not establish this behavior.

**Decision required in design review:** Endorse **A** as the architecture, with **AUTH-P0** as a mandatory pre-implementation feasibility gate and no silent custom-domain adoption. The exact provider/hostname/session-transport choice remains a **conditional implementation-design decision** requiring documented evidence and user approval before the security-dependent work proceeds.

### 3.5 Minimal service and operational state

Choose a provider with HTTPS, managed secret storage, low-complexity durable operation/session metadata, scheduled retries or webhooks, rate limits, and practical logs (e.g. a small serverless function plus durable KV/SQL). Do **not** choose a hosting vendor or set up infrastructure until design/plan approvals.

The service persists only:
- owner session identifiers/revocation metadata (and required securely held GitHub App credentials);
- idempotency key, operation UUID, source revision, record ID/domain, sanitized error/state, GitHub PR number/head SHA/main merge SHA, expected release ID when known, and final hosted verification;
- short-lived upload staging if needed; purge staged binary bytes after success/failure retention window.

No second editable Gear/KB/Catch store; GitHub remains the only canonical authored-content repository. Define minimal retention, backup and cost controls before implementation.

## 4. Direct publishing protocol and consistency

### 4.1 One-click user flow

1. Owner edits Gear/KB/Catch using familiar form; browser validates schema fields and selected files for fast feedback.
2. **Save and Publish** freezes an immutable submission snapshot, including field-base values, Markdown body/old SHA, media filenames/bytes/digests, base source SHA, and randomly generated idempotency key. No extra confirmation or PR approval prompt.
3. Browser sends package and media to the trusted API. **Only after the service durably accepts the operation** may the user freely leave the editor while publishing continues. A distinct in-flight status is shown; do not pretend it is Live.
4. Service authenticates and authorizes owner and upload limits; validates the requested domain and record; loads **actual latest `main`**, canonical JSON/Markdown/reference files, and current media metadata; applies source-aware patch or reports explicit conflicts.
5. For valid content-only changes, create **one** branch commit/PR with only the approved canonical `pwa/Gear/**`, `pwa/KB/**`, or `pwa/Catches/**` paths. Do not update TODO/Decision Log for a routine edit. For any change needing schema/runtime/tooling adjustment, **stop** and require the separate Full Application Release review; the public editor must not silently expand privileges.
6. Await exact PR-head lightweight content validation. Revalidate PR head and current `main` just before merging. If the main branch moved, compare/conflict-check again and rebuild/revalidate as necessary. Never merge from stale validation.
7. Merge automatically when the safe content PR is eligible and repository branch rules allow it. The existing production workflow rebuilds against exact merged SHA, deploys Pages, and performs hosted byte/release identity verification. Report **Live / Verified** only after the correct target source SHA is verified live.
8. Preserve a queryable operation record independent of the currently open browser. Returning to the site or Connection Status/publication status can recover submitted status and final result. Release retries must not produce duplicate records.

### 4.2 State machine

```text
Editing
  -> Submitting -> Accepted -> Validating -> Awaiting safe merge
  -> Merged -> Deploying -> Verifying -> Live / Verified

At any stage -> Failed (recoverable reason) or Conflict (review required)
Accepted/Validating/etc. -> Pending (when disconnected or service restarted)
No status transition to Live without hosted source + byte verification.
```

The browser is allowed to navigate away after **Accepted**. A second edit of the **same record** should be blocked or clearly serialized until the first operation resolves; unrelated records may be edited while publishing. A failed operation leaves the original submitted snapshot recoverable; the server cannot modify an already-submitted snapshot without a new explicit user Save.

### 4.3 Exactly what the service may write

Permitlist repository `ginosega/fishing`, one approved domain, and canonical paths. Validate record schema and source-aware package fields server-side; do not trust client-side hashes as proofs. Use GitHub Git tree / commit APIs (or equivalent) so the JSON update, Markdown replacement and images form **one atomic branch commit**, not an inconsistent chain of separately committed files. Restrict to known MIME/size/path rules and prevent traversal, schema escapes and GitHub API path injection.

For edits: compare requested base field values against current values; use `promoteChange` in review/conflict mode (not `overwrite`), then perform full source inventory/reference validation on the prospective tree. For adds: check current ID/path collisions and allocate only legal IDs. Preserve **unaffected or newer fields and files** on latest main; a repository-wide rewrite or stale JSON overwrite is forbidden.

**Media:** Selected local images must be part of the same candidate commit as the corresponding record/Notes. Staged bytes are verified against declared hash, file format and limits again on the trusted side; the canonical CI build independently checks all referenced resources. Knot sequence frames remain ordered with final frame as representative picture. No Catch photo picker is added. Existing Markdown images retain valid relative paths; locally selected new images in Markdown need explicit path/validation support or a clear user instruction, not a missing-reference publication.

**GitHub events:** Use the GitHub App installation token for the service's PR/merge actions, not a repository `GITHUB_TOKEN` when expecting the normal push/PR workflows. GitHub restricts recursive workflow triggering by events created with `GITHUB_TOKEN`; the App can trigger the normal release events. See official docs in Section 17.

### 4.4 Conflict, failure, branch protection, recovery

- **Conflicts:** show record/field or narrative/file conflicts with the fresh published source. Preserve user's original submission/draft; offer explicit editing to reconcile and resubmit. No force overwrite or silent replacement.
- **Multiple writes / retries:** idempotency keys bind to exact authorized user, record and byte digest; retries return the same operation status or safe retriable failure. Guard double clicks and mobile reconnect retries.
- **PR gate:** select and validate the exact expected CI run/commit SHA, not a generic green status. Before unattended auto-merge, verify repository branch/ruleset settings allow an approved bot merge without an impossible self-approval requirement. If required external human review is configured, **stop and discuss**—do not bypass security settings silently.
- **Main advancement race:** GitHub merge protection and service-side compare/retry must be designed as one coherent optimistic-concurrency protocol; do not rely on a single read before PR creation.
- **CI failure:** do not merge; show actionable validation failure and leave accepted operation/auditable PR available for investigation.
- **Post-merge deploy failure:** do not report Live. The source may already be on main; record `Merged / Deployment failed` and allow a controlled retry/recovery under release rules. Do not automatically rewrite main or claim rollback without verifying it.
- **Host verification:** require matching GitHub merged SHA, release manifest identity, Pages publication, and actual hosted bytes (FISH108). Never infer success from a PR merge alone.
- **Audit:** every published change references GitHub PR, merge SHA, workflow run, release ID, and hosted verification result; sensitive session material is never logged.

### 4.5 Suggested service contract (illustrative, not authorized implementation)

```text
GET  /session             -> {authenticated, authorized, userDisplay?}
GET  /auth/github/start   -> initiate state/PKCE auth flow (user gesture)
GET  /auth/github/callback-> validate code, establish authorized session
POST /session/signout     -> revoke session
POST /publications       -> accept one source-aware change + bounded binary media
GET  /publications/:id   -> durable state, error classification, PR/run/release refs
GET  /publications       -> recent authorized owner's operations
```

API bodies and response codes are **design examples**, not finalized public contracts. Use server-side CSRF/origin/replay protection appropriate to the eventual session transport. Enforce attachment size, total-request size, rate, timeout and authorization limits; consider signed short-lived upload staging for large Knot sequences if normal requests cannot fit platform limits. Never accept caller-supplied GitHub API URLs, arbitrary refs or deployment workflow changes.

## 5. Local drafts and editor resilience (provisional)

Use a small, separately testable local repository abstraction backed by IndexedDB, not by the service-worker Cache Storage used for the published offline library.

- Key existing records by `domain + stable ID`; new unsaved records get a durable temporary draft ID. Store structured form values, Markdown, base source revision, base record fingerprint/base fields, media `Blob`s plus names/hashes and editor schema version.
- Debounce changes, write transactionally and expose honest status (**Saving locally**, **Draft saved on this device**, **Unable to save locally**). If storage is denied/quota exhausted, keep the editor usable in memory and show a clear warning; don't claim preservation.
- On opening a record with a matching unpublished draft, prompt **Restore / Discard**. Do not auto-apply stale drafts. Resolve conflicts against current GitHub source before publishing.
- Draft never uploads or publishes itself, even after reconnection. Work Offline may allow *continued editing of an already-open editor* with an explicit notice and no Save-and-Publish action; don't create a new offline-authoring workflow.
- Keep local draft and in-flight submission data until the correct merged source is hosted and verified; then remove only the exact successfully published snapshot. If another draft revision has since been made, never delete it accidentally.
- Keep browser draft DB **separate** from explicit offline release caches and SW upgrades. Do not store GitHub credentials in drafts. Sign-out on a shared device should warn about locally retained unpublished content and provide a safe discard option; never silently upload/discard.
- Validate data size, schema upgrades, forced eviction, update/removal and service-worker lifetime behavior on Windows/Android/iOS. Request persistent storage where supported, but do not promise durability beyond browser policies.

**Removal gate:** `DraftStore` and editor-continues-when-Work-Offline may be disabled/removed together before v3 acceptance. Core online authoring, Save and Publish, unsaved-edit guard, and conflict safety **must still work**. A removal decision is visible to the user; do not force v3 delivery to depend on fragile local persistence.

## 6. Catch Add/Edit without schema expansion

Extend the existing editor to domain `catches` and existing `pwa/contracts/schema.json` / `validation.mjs` semantics. Fields: stable ID, required local date, optional local time, optional text size, optional species, location, *owned* lure/bait link, optional Markdown notes. Use current taxonomies/references; no mandatory picture, no GPS, no sessions/trips, no equipment-setups or additional structured facts.

Date/time are local strings with deliberate user input; do not silently invent catches, timestamps, precision, or locations. Keep current descending Catch Log order, existing history relationships, and derived Species picture. New Catch Notes use approved `Catches/content/` paths and source-aware direct publishing. Catch authoring may use its own `fishing-companion-change-v2` domain extension, versioned with compatibility tests rather than redefining existing Gear/KB packages.

## 7. Markdown image Picture Viewer and external links

### 7.1 Clickable Markdown images

Keep the current MarkdownIt + DOMPurify pipeline. In a sanitized article, decorate only locally resolved, approved Markdown `img` nodes with accessible activation behavior. On click or keyboard activation, call `openViewer` with the **original verified release image URL**; retain alt text/caption where available, scrolling and touch access. Avoid intercepting images inside an ordinary `a` link, Knot sequence frames, remote image URLs or unrelated UI images. No unsafe Markdown HTML/event handlers. Missing images show an error/placeholder without breaking the article.

### 7.2 Android installed-PWA external-link fix

**Evidence:** ordinary web links work in normal Android Chrome and Edge tabs; fail on Chrome *installed PWA* short taps; long-press in installed app offers browser opening; YouTube can open the YouTube app in installed Chrome. Other installed browsers remain unverified.

Centralize outbound-link handling for structured Links and Markdown. Use explicit URLs and real user gesture; compare default anchor, `target` semantics, explicit external navigation and documented Android PWA behavior **on actual installed devices**. Preserve safe URL validation and `noopener noreferrer` where applicable. A solution may use a controlled external-link affordance/browser handoff, but must not silently replace a stable in-app session with a broken navigation, interrupt an unsaved editor, or break YouTube app delegation. Do not claim that `window.open` or `target='_blank'` is reliably supported until tested. OAuth redirects from Connection Status must receive a separate installed-PWA test.

## 8. Work Offline and Connection Status redesign

**Mode is not connectivity.** Model at least:
- `mode`: **Automatic** or **Work Offline** (user preference, persistent across restarts).
- `network`: browser-reported online/offline; distinguish this weak hint from actual reachability.
- `library`: Not prepared / Updating / Ready / Repair needed; show selected release and bytes.
- `auth`: Anonymous / Authorized owner / Session expired; only GitHub owner sees authoring controls.
- `publication`: none / in progress / failed / verified, visible without misleading offline status.

Persist the selected mode in a **service-worker-readable** store (e.g. dedicated Cache Storage metadata or an explicitly shared IndexedDB key), not merely `localStorage` inaccessible to the worker. Hydrate it **before** startup network attempts. Treat updates as versioned/atomic state changes across page and SW; acknowledge a mode selection only after worker configuration commits.

- **Automatic:** prefer the latest coherent verified online release; if unreachable and a complete offline library is prepared, use it. A timeout/abort strategy may be required for weak service; verify behavior rather than relying solely on `navigator.onLine`.
- **Work Offline:** read the selected complete verified offline library even when online; suppress normal app-data network fetches and GitHub publishing/auth checks; permit deliberate switch back to Automatic to obtain new content. If no complete library, explain and refuse the mode transition without stranding user.
- Preserve FISH091 explicit Update Offline Library, atomic staging, previous-good fallback, verified bytes, and distinction between current online release vs prepared offline release. Don't recopy the entire library on startup or silently download new offline generations.
- When an editor is open and Work Offline is selected, notify immediately; provisional support for local continuation is tied to the draft removal gate. No uploads/publications until back in Automatic and explicitly requested by user.
- **Visual refresh:** compact polished sections for Mode, Network, Offline Library (release/counts/bytes), Sign in with GitHub or Signed in as owner / Sign out, and relevant active publication/update status. Use accessible focus, touch targets, responsive sizes, and the existing teal/green visual language, not an unrelated component framework.

## 9. Release coherence and post-deployment reliability

### 9.1 Root-cause hypotheses to test, not assume

The current SW stores `clientContexts` in a volatile in-memory map. On SW termination/restart, a client may need to recover its release pin; the loader uses a current `release.json`, while an already-open app may still reference URLs for an old release. GitHub Pages currently publishes a new complete `dist`, and **the design must verify whether old release files remain hosted**; never assume they do. A mismatch can manifest as a 503 for pinned assets. Other candidates include update activation timing, stale navigation shell, Cache Storage eviction, and fallback-selection errors.

### 9.2 Target invariants

- One visible page session uses **one verified release** for schema, JS, CSS, JSON, Notes, thumbnails and originals; no mixed-version asset set.
- After a deployment, an old session can either continue with coherent accessible assets or safely transition to the new release; it cannot become partially broken.
- The selected Work Offline generation stays valid and explicit; its marker/selection remains intact through app updates.
- Reload of a dirty editor is postponed or preceded by confirmed draft capture/unsaved-change guard. Never silently discard unsent changes.
- A new content-only release should not require the user to clear cache, reinstall or manually recover from missing images.
- Full manifest/release hash checks, exact-current-main and actual-hosted verification remain mandatory.

### 9.3 Proposed implementation direction

Decouple the **session release pin** from volatile service-worker process memory. Evaluate persistent per-client release leasing, content-addressed URL resolution, explicit release-version handoff, and preservation/caching of assets required by already-open sessions. In particular, test whether retaining a bounded previous hosted release or a session-critical verified cache is necessary. Do not load every original image into cache by default; choose a bounded, measurable approach consistent with FISH091's explicit offline provisioning.

Introduce a safe **new release available** state. When editor clean and publication complete, support managed reload/reinitialization (or next-navigation transition) without a manual browser refresh; with dirty editor, preserve user choice. Distinguish latest **online** release from the optionally older **prepared offline** release. Keep corruption detection stricter than convenience; never return unverified bytes to conceal a missing asset.

**Release-fix acceptance:** Leave desktop and installed-PWA sessions open across an actual content-only Pages deployment. Load a previously unvisited detail page and its picture afterward; repeat with previously cached/un-cached images, current/previous offline library, Work Offline mode, service-worker restart and an unsaved draft. No missing image or page, no mixed source SHA, and no data loss. Collect exact HAR/network/console/release diagnostics before selecting the fix.

## 10. Card image performance and build-generated derivatives

The currently rendered card uses original content image URLs with `loading='lazy'`. Sharp is already in the locked build dependencies. Do **not** start with an assumed exact thumbnail size, format or timing target.

Design:
1. Benchmark real PC + Android initial viewport appearance, card grid scrolling, transfer bytes, image decode, and service-worker fetch/verification time. Capture network, cache hit/miss and slow-network variability.
2. Generate deterministic, orientation-correct, format-appropriate **card-size derivatives** from canonical images at build time; preserve original bytes and all explicit picture paths. Derived filenames/content maps are immutable under release identity (e.g. `releases/<release-id>/thumbnails/...` or another nonrecursive release-bound path).
3. Include all generated derivatives and a deterministic mapping in the release manifest/hash verification. Never add them to canonical `pwa/Gear/`, `pwa/KB/` or `pwa/Catches/`. If animating originals, decide whether a static representative thumbnail is acceptable before implementation.
4. Prioritize immediately visible cards; keep near/below-viewport loading measured rather than artificially slow. Preserve layout slots/aspect ratio and `decoding='async'` where appropriate, and only use prefetch within a bounded resource budget.
5. Original image remains on detail and Picture Viewer. Offline complete-library sizing includes any derivatives as well as originals, with explicit size reporting; ensure release file/byte budget is respected.
6. Establish quantitative acceptance metrics after profiling: visible-first-row completion, p75/p95 card appearance, transferred bytes and service-worker CPU/verification, all compared with a v2 baseline on representative devices.

No blanket quality loss, changed canonical image bytes, mandatory image resubmission or thumbnail-specific authoring UI.

## 11. Testing and acceptance matrix

### 11.1 Automated unit/integration tests

- Source-aware patch: base/current/add conflict matrix, field-level independent edits, narrative SHA mismatch, missing and malicious media, duplicate ID/path/case collisions, Knot frame validation, Catch references, authorized paths only.
- Security: anonymous/mismatched GitHub numeric ID cannot publish; tampered client session, expired/revoked credentials, CSRF/state/PKCE replay, CORS/origin failures, over-size upload, nonimage disguised payload, arbitrary target repo/ref, unauthorized action; no secrets in static PWA/manifest/logs.
- Publication: idempotent duplicate Save; service restart after accepted submission; PR validation fail; moving main; PR merge failure; Pages deploy fail; hosted hash mismatch; correct final status; exact source/PR/CI/merged SHA matching; no `GITHUB_TOKEN`-suppressed workflow event.
- Draft: IndexedDB denied/evicted/quota full, media Blob persistence, schema upgrade, restored draft conflict, interrupted reload, sign-out, successful publish clearing only correct draft, disable/remove layer without breaking online editing.
- Offline/SW: Automatic vs Work Offline persisted, no prepared cache, network false positives, weak signal/timeouts, offline update failure, SW termination, stale app open at deployment, release pin/manifest hash mismatch, pristine/recovered draft during update.
- Images/UI: deterministic build thumbnail bytes/map, original retained, Markdown viewer activation with keyboard/pointer, linked-image noninterference, accessible Connection Status, Catch authoring form and history.
- Existing v2 tests remain regressions; no schema migration unless separately approved.

### 11.2 Browser and real-device tests

- **Automated:** Chromium and WebKit using existing Playwright pipeline for desktop/mobile-responsive behaviors; mocked GitHub API/broker and end-to-end publication state against test repo when authorized.
- **Manual real hardware:** Android Chrome and Edge **browser tab and installed PWA**, Windows Edge/Chrome, and iPhone Safari/Chrome. Emulation is **not** proof of Android installed-PWA external link or GitHub auth handoff. Validate actual online/offline behavior, app restarts, device restart, token/cookie restrictions and YouTube delegation.
- **Performance:** compare the same pages at the same controlled connection profile; measure before/after, not isolated subjective perception.
- **Hosted:** test an isolated nonproduction preview endpoint with distinct SW scope and GitHub test branch/repository as appropriate; no production secrets or writes from anonymous preview.
- **Rollback:** verify that the current healthy production version can be restored or publication retried without corrupting canonical records or losing an offline library.

### 11.3 Capability/Work checkpoint

Continue source audit, document authoring, GitHub PRs and GitHub Actions review in **Chat** with available tools. Before browser-driving tests or GUI-only interactions that cannot be executed here, **proactively request a temporary Work switch**, explaining exactly which test or site interaction requires it. Do not recommend Work merely due to complexity. Even Work may not substitute for testing an installed PWA on the user's physical Android device; when needed, provide short reproducible steps and a precise evidence checklist. Do not attempt production deployment without an approved implementation plan and verified tool capability.

## 12. Phased implementation recommendation (not authorization)

1. **Gate AUTH-P0:** confirm secure login/session persistence, authorized identity and callback return across real installed PWAs; compare trusted service providers and scope secrets. If this cannot be made reliable without a domain migration or browser-held sensitive session, return to user for explicit trade-off decision.
2. **Standalone v2 maintenance candidates:** reproduce/fix Android link behavior, deployment release mismatch and card images where independent. Ship only after specific approval and Full Application release validation; do not wait unnecessarily for all of v3.
3. **Trusted publishing spine:** implement tightly scoped auth service, source-aware write validation, GitHub App PR workflow, idempotency/status, full hosted verification, and tests before exposing Save to production.
4. **Gear/KB Save + media:** integrate current editors, form validation, single picture and Knot sequences; remove user-facing Copy Changes; keep safe publication tracking.
5. **Catch Add/Edit, Markdown viewer, Connection Status redesign and persistent reading mode.**
6. **Provisional draft layer:** implement behind independently removable gate; test failure modes; disable/remove if unreliable.
7. **Cross-device acceptance and v3 preview/cutover:** collect measured evidence, obtain owner acceptance and explicit authorization for production switch. Preserve healthy v2 until verified.

Break these into separate scoped PRs with full application validation for runtime changes. Do not combine unrelated UI, auth, offline and release rewrites into one unreviewable change. Ordinary *post-v3* canonical content publications should continue through FISH108 Fast Content Release.

## 13. Risks, mitigations and rollback triggers

| Risk | Severity | Mitigation / gate |
|---|---|---|
| Cross-origin GitHub Pages/API login persistence fails, especially installed Safari/Android PWAs | **High** | AUTH-P0 on real devices; no assumption of third-party cookie support; user approves hosting/session trade-off before build. |
| OAuth callback loses installed app context or opens wrong browser | **High** | Explicit user-initiated redirect, one-time state/PKCE, no secrets in URL, real-device return-path tests. |
| Broker credential or unrestricted GitHub App installation compromised | **High** | One-repo permissions, server-side secret store, numeric user allowlist, revocation, rate limits, audit and restricted write paths. |
| Auto-merge bypasses checks or merges stale work | **High** | Exact head SHA and latest-main conflict checks, PR CI gate, ruleset assessment, no force-overwrite; stop on incompatible branch policy. |
| GitHub merge succeeds, Pages deploy fails | Medium–High | Durable operation status and explicit not-Live outcome; controlled retry/recovery; no silent rollout claim. |
| New app release breaks old session assets | **High** | Release-coherence tests, SW restart handling, verified old/new transition, no cache clearing as workaround. |
| Local drafts evicted/corrupt, or steal browser storage space | Medium | Feature-gated draft store, honest status, quota/failure tests, easy removal without direct-save regression. |
| Thumbnails grow offline library or alter pictures unexpectedly | Medium | Deterministic release derivatives only; source originals unchanged; size/perf budget and verification. |
| Android external link fix breaks YouTube, redirects, auth | Medium | Centralized link rules, actual installed Chrome/Edge testing, regressions. |
| Implementation grows into sync/user-management platform | Medium | Out-of-scope list is binding; no offline queue/cross-device sync/Catch photo or GPS. |

## 14. Source/data migration, preservation and cutover

Preserve stable record IDs and canonical JSON/Markdown/media. Extend authoring at the UI/API level; neither user sign-in nor publish-job metadata changes Gear/KB/Catch schemas. Do not rename/move existing content paths merely to introduce thumbnails or a publishing service. Preserve authored source images byte-for-byte. Any proposed necessary schema migration, repo hosting/domain change, service-worker cache reset, or destructive cache cleanup is an exception requiring an explicit design amendment and user sign-off.

v3 preview has isolated hosting path/SW scope and no production credentials. Maintain a tested production rollback artifact/path, keep the actual old v2 production available until approved cutover, and verify offline-library compatibility and that the initial v3 launch does not delete prepared v2 content. If draft layer is removed, document how remaining drafts are preserved/exported or clearly disposed with user's informed action; do not silently delete unpublished work.

## 15. Requirement traceability

| Approved requirements | Technical design sections |
|---|---|
| V3-AUTH-01..07 | 3.1–3.5, 7.2, 11 |
| V3-SAVE-01..08 | 4, 11–12 |
| V3-UPLOAD-01..05 | 4.3, 10–11 |
| V3-CATCH-01..04 | 6, 11 |
| V3-VIEW-01..03 | 7.1 |
| V3-CONNECTION-01..07 | 5, 8–9, 11 |
| V3-PERF-01..05 | 10–11 |
| V3-UPDATE-01..04 | 9, 11 |
| V3-LINK-01..03 | 7.2, 11 |
| V3-DRAFT-01..07 | 5, 11–13 |
| V3-OPS-01..04 | 3.5–5, 8, 11 |
| V3-X-01..08 | 2–14 |

## 16. Review checklist / decisions before design approval

Please review the proposed design with these explicit choices in mind:

- **T1 — Approve or revise the trusted GitHub App + small serverless publication service** instead of browser-held GitHub credentials. It is an architectural change to support a secure one-click flow, not a second data store.
- **T2 — Agree on the AUTH-P0 feasibility gate**: we will not assume cookie persistence or authentication return works on installed PWAs. Choose final session transport/hosting after the measured proof, with your approval if a custom domain or riskier browser-held app session is required.
- **T3 — Approve automatic merge after exact source/PR validation and automatic Pages verification**, with conflict/errors retained for review; no human approval per routine content item.
- **T4 — Approve the publication state machine and “leave editor after durable Accepted” rule**, plus one in-flight submission per record and clear verified completion.
- **T5 — Approve device-local provisional drafts/continuation, with independent test-and-remove gate** and no offline queue.
- **T6 — Approve SW release-coherence redesign, persistent Work Offline selection, and a visual refresh**, subject to root-cause evidence and no weakening of integrity.
- **T7 — Approve build-generated thumbnails and measured perf targets**, preserving originals and offline budget; correct final implementation details depend on profiling.
- **T8 — Approve isolated v2 maintenance bug releases when independently safe**, requiring separate release authorization and full application validation.
- **T9 — Confirm no additional v3 features** (no Catch photos/GPS, broad users, offline queued sync, alternative repository, or permanent backend content database).

**Design remains NOT APPROVED.** A design sign-off (possibly after updates) approves the architecture only. The next gate is a detailed, testable staged implementation plan and its separate explicit user authorization; no code changes or production deployment are authorized by publication of this draft.

## 17. External technical references (reviewed October 19, 2026)

Source-based GitHub/PWA design guidance, **not claims that a chosen integration has been implemented or tested**:

- GitHub: [Authenticating with a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app)
- GitHub: [Generating a GitHub App user access token; web application flow, PKCE](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- GitHub: [Best practices for GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app)
- GitHub: [GitHub App installation tokens and scoped permissions](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation)
- GitHub: [Git trees for atomic candidate source updates](https://docs.github.com/en/rest/git/trees)
- GitHub: [GitHub Actions triggering; `GITHUB_TOKEN` event limitations](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- GitHub: [Creating pull requests via fine-grained credentials](https://docs.github.com/en/rest/pulls/pulls)
- MDN: [CORS and third-party cookie policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- Chrome Developers: [Installed PWA navigation management](https://developer.chrome.com/docs/capabilities/pwa-navigation-management)

**Evidence boundary:** Repository facts above were read from `main`. External references establish available APIs and browser limitations, not actual installed PWA behavior, which still requires device testing.
