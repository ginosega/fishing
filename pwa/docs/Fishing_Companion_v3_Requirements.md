# Fishing Companion v3 — Requirements (Draft for Review)

**Status:** DRAFT — discussion and user requirements review; **NOT APPROVED**. No design, implementation, or release authorization is implied.
**Date:** October 19, 2026
**Repository:** ginosega/fishing
**Draft baseline:** main at 4fc893d044b72e61fbc36cfd82103af55bc36f97
**Project workstream:** FISH-TODO-037 (Fishing Companion v3; previously deferred for implementation)
**Predecessors:** [v2 Approved Baseline](Fishing_Companion_v2_Approved_Baseline.md), [FISH091 offline-reading requirements](FISH091_Online_Only_Default_Requirements_2026-09-11.md), [FISH108 Fast Content Release policy](FISH108_Fast_Content_Release_Policy_2026-09-14.md)

## 1. Purpose and approval boundaries

Fishing Companion v3 is primarily an online authoring and reliability upgrade to the existing three-domain PWA. Preserve the useful v2 architecture, canonical GitHub sources, visual language, and verified release model. Reduce friction between editing content and seeing it in production while improving mobile reliability and image-loading performance.

This is a **requirements draft**, incorporating the user's October 2026 scope discussion and Android link observations. Where the discussion has not settled exact behavior, this document records an open decision rather than silently choosing an implementation. Explicit user approval of this requirements document is required before the technical design begins. Separate explicit approval of the design and implementation plan is required before application implementation.

The original v2 requirements and approved changes remain authoritative for behavior not intentionally changed in this document.

## 2. Product principles and scope

1. **Read publicly, author privately.** The published Fishing Companion remains publicly readable, anonymously and by default. Public/unauthenticated pages show no sign-in option and no authoring controls. Editing and publishing are available only to the repository owner's authorized GitHub identity; previously authenticated owner sessions should be recognized automatically where technically and securely possible. No broad multi-user capabilities.
2. **GitHub stays canonical.** Gear, Knowledge Base, and Catch records, Markdown, and source images continue to live in ginosega/fishing. Browser drafts are not canonical records.
3. **Online publishing, offline reading.** Offline authoring, automatic sync/outbox publishing, and cross-device draft synchronization are explicitly deferred beyond v3.
4. **Reliability before novelty.** Fix the deployment-refresh and Android installed-PWA external-link issues, improve image-heavy page loading, and preserve existing content and references.
5. **Simple Catch Log.** Add and edit existing Catch fields, but do not introduce Catch photographs, GPS capture, session tracking, or field-workflow embellishments.
6. **No hidden expansion.** A low-value feature should not force a new cloud content database, generalized user-management platform, new source-image model, or unrelated schema redesign.
7. **Maintain existing release assurances.** Direct saving should remove the manual JSON handoff, not remove validation, conflict detection, auditable history, or verifiable production publication.

### Included

- GitHub-authorized access to Add/Edit/Save/Upload, with anonymous public read-only access as the default, no public sign-in affordance, and automatic recognition of valid existing owner sessions.
- Direct online saving of Gear and Knowledge Base changes through GitHub and the verified production process.
- Integrated browser-side selection, validation, and upload of supported local files/images as part of authored changes, including Knot picture sequences.
- Catch Add/Edit using the existing Catch schema.
- Image Viewer opening from applicable Markdown images.
- Automatic / Work Offline user selection in Connection Status, for reading.
- Smaller, faster card images and appropriate load priorities, subject to measured performance.
- Correct, consistent update handling without broken pages or missing images after deployment.
- Fix external web links in Android installed-PWA mode.
- Lightweight local draft preservation/recovery during interrupted online editing, **provisionally included and expressly removable if reliability testing fails**.
- Clear publication status, conservative recovery/rollback, limited offline-storage information, Copy Diagnostics capability, and a visual refresh of the Connection Status screen consistent with the rest of Fishing Companion.

### Explicitly excluded / deferred

- General-purpose offline editing sessions, queued GitHub writes, background publishing after reconnection, and multi-device draft synchronization.
- Multi-user roles/teams, invitations, permissions administration, or collaborative edits.
- Full-site private hosting or making public GitHub Pages content confidential.
- Catch photographs, independent Catch representative pictures, optional GPS, automatic fishing-session/location capture, or other expanded Catch workflow.
- New Planner, Trips, shopping, inventory transactions, relationship graph, or schema redesign.
- Browsable revision-history product UI or automatic merging of independently edited drafts across devices.
- Deleting records from the user interface unless separately approved.
- Adding thumbnails as canonical source assets; derivatives should be disposable build artifacts.

## 3. Functional requirements

### V3-AUTH — Authentication and editor authorization

**V3-AUTH-01.** Anonymous use is the default. Visitors can navigate and read all publicly published Gear, KB, and Catch content, including images, without signing in or seeing a Sign In option on public pages.

**V3-AUTH-02.** Add/Edit/Save/Upload actions require an authenticated GitHub identity explicitly authorized for this repository. Anonymous and unauthorized visitors see neither authoring controls nor sign-in prompts/options in ordinary site navigation. Hiding buttons or obscuring an owner-access address is not a security boundary: the trusted write path must independently reject unauthorized publishing.

**V3-AUTH-03.** No GitHub long-lived token, app private key, client secret, or equivalent credential may be embedded in public site files or exposed to an unauthorized browser session. Authentication and authorization failure must fail closed for writes without preventing ordinary public reading.

**V3-AUTH-04.** On ordinary page visits, automatically detect and restore a previously established valid owner session without requiring a repetitive sign-in action. If no valid session exists, remain in anonymous reading mode without unsolicited sign-in UI. Support an intentional owner-only entry flow for initial authentication and expired-session recovery, plus sign-out and clear authentication-failure messages within that owner flow. A failed or expired session must not destroy the current edit.

**V3-AUTH-05.** Test authentication and return navigation in desktop browser tabs and installed Android/iOS PWA contexts. The observed Android installed-PWA external-link bug is relevant to this flow.

**V3-AUTH-06.** Preserve least-privilege access and an auditable record of the GitHub changes submitted through the application. An owner-entry link, route, gesture, or bookmark is only a navigation affordance, never proof of authorization.

**V3-AUTH-07.** Do not depend on silent recognition of a person who has no valid previous app session or equivalent authorized credentials. Initial authentication, credential expiry, revocation, privacy restrictions, or a new browser/device may require explicit GitHub authentication. Prefer securely managed, renewable server-side sessions where justified; no public PWA bundle may expose sensitive write credentials. The exact owner-entry/renewal UX is subject to a focused requirements decision.

**Design deferred:** GitHub App/serverless intermediary versus other secure options; session-cookie/origin constraints, how credentials are stored/renewed, and platform-specific installed-PWA re-entry; the exact owner-entry and recovery experience remains an **open requirements decision**. Public users are not offered sign-in.

### V3-SAVE — Direct GitHub saving and publication

**V3-SAVE-01.** An authorized user can add or edit Gear and KB items in the existing browser editor and submit changes directly; no manual copying of generated JSON into ChatGPT and no separate manual media upload are necessary.

**V3-SAVE-02.** Preserve the current canonical paths, stable record IDs, source-aware change semantics, base fields, content hashes, current data schemas, safe paths, media rules, and unaffected/newer source modifications. No silent overwriting of concurrent changes.

**V3-SAVE-03.** Apply logically related record, Markdown, and referenced media updates consistently. A record must not go live referring to missing media, and an unsuccessful publish must not be misrepresented as successful.

**V3-SAVE-04.** The write flow must use the appropriate release lane: content-only eligible changes through FISH108 Fast Content Release; application/schema/runtime changes through the Full Application Release process. Preserve canonical validation/build, GitHub change history, production publication, and hosted byte/release-identity verification.

**V3-SAVE-05.** Provide one **Save and Publish** action that automatically initiates source-aware validation and the GitHub/production publishing workflow without an additional user confirmation, per-change approval, or manual merge. Show understandable stages, including at minimum Editing, Saving/Submitting, Validating, Publishing, Live/Verified, Failed, and Conflict. Distinguish GitHub acceptance from confirmed successful production publication. Permit safe retry where appropriate without duplicate or unintended changes.

**V3-SAVE-06.** If the source has changed since the edit began, detect and report conflicts. Preserve all user-authored local changes and provide a recoverable path to reconciliation. Automatically accept nonconflicting changes only when source-aware validation establishes safety.

**V3-SAVE-07.** Prevent accidental duplicate submissions; disable or guard conflicting actions while a submission is pending. The editor may be left while a submitted publication progresses. Its status and final verified outcome must remain discoverable on return or subsequent visits. A navigation, reload, sign-out, authentication interruption, or failed workflow must not silently lose uncommitted work.

**V3-SAVE-08.** Remove the v2 **Copy Changes** user-facing handoff/export fallback from the v3 interface. Do not retain a parallel manual JSON copy/paste publication workflow. Preserve any internal source-aware change-package logic needed for validation, conflict safety, and release correctness.

**Confirmed user decision:** A single **Save and Publish** action automatically publishes after validation, without a separate confirmation or approval. GitHub PRs may be handled behind the scenes; the editor may be left while publishing proceeds. Final verification must still be reported.

### V3-UPLOAD — Integrated images and files

**V3-UPLOAD-01.** Existing image selection, local preview, validation, approved extensions/sizes, filename/path checks, and media references remain supported. The browser shall upload new or replacement files directly through the authorized publish workflow.

**V3-UPLOAD-02.** Support single pictures and the existing ordered Knot step-by-step picture sequences without requiring separate visits to GitHub's upload interface. Preserve original user-supplied image bytes when canonical uploads are accepted; no implicit destructive transformations.

**V3-UPLOAD-03.** Local files required for a pending authored change are tracked through validation, failure, retry, and (if enabled) local draft recovery. Do not claim publication until the file and all its referring content have passed the release checks.

**V3-UPLOAD-04.** Enforce existing media validation and resource-integrity constraints, with actionable messages for unsupported files, invalid dimensions, excessive sizes, missing sequence frames, unsafe names, or path collisions.

**V3-UPLOAD-05.** Generated thumbnails are derived release artifacts and must not replace or change canonical source pictures.

### V3-CATCH — Catch authoring

**V3-CATCH-01.** Provide Add and Edit forms for Catch records using the approved existing fields: ID, local Date, optional local Time, plain-text Size, optional Species ID, Location ID, owned Lure/Bait ID, and Markdown Notes.

**V3-CATCH-02.** Reuse established editor affordances and direct-save workflow, with Catch-specific constraints and references validated against current canonical source.

**V3-CATCH-03.** Existing Catch history, sorting, and inferred Species picture display remain intact.

**V3-CATCH-04.** Do not add Catch picture capture/storage, GPS, trips, sessions, additional required fields, or new authoring-time obligations.

### V3-VIEW — Markdown image viewing

**V3-VIEW-01.** Activating a locally referenced image rendered inside Gear Notes, KB Content, or Catch Notes opens the existing Picture Viewer with original image quality, zoom/pan/pinch and accessible dismissal.

**V3-VIEW-02.** Preserve safe Markdown rendering, links, alt text, captions where available, responsive layouts, and keyboard/touch operation. An image already serving as a link must not acquire contradictory click handling.

**V3-VIEW-03.** A failed or missing image must degrade intelligibly without breaking the containing article.

### V3-CONNECTION — User-selected reading mode

**V3-CONNECTION-01.** Connection Status provides **Automatic** (online preferred, complete verified offline-library fallback) and **Work Offline** (use the prepared offline library even if the device has network connectivity). Show selected mode, actual browser/network status, prepared-library availability/release identity, and update state separately. The Work Offline preference persists across application restarts until intentionally changed.

**V3-CONNECTION-02.** Work Offline must not initiate ordinary app-content network requests or direct GitHub publishing. It is an offline-reading mode, not permission to queue or synchronize writes. Explain unavailable online-only actions clearly.

**V3-CONNECTION-03.** If no complete verified offline library exists, Work Offline must not strand the user. Explain preparation requirements and retain usable automatic/online operation.

**V3-CONNECTION-04.** Preserve explicit offline-library preparation/update, atomicity, rollback to an earlier valid library after update failures, and release integrity checks already established under FISH091.

**V3-CONNECTION-05.** Mode changes, update checks, and release transitions must never erase or overwrite an unpublished edit or locally recovered draft.

**V3-CONNECTION-06.** Refresh the visual design and usability of Connection Status to match the polish and styling of the rest of Fishing Companion. Keep the actual network status and selected operating mode clearly differentiated.

**V3-CONNECTION-07 (provisional).** If the user selects Work Offline while an authenticated editor is open, explain the mode change and allow the already-open draft to continue being edited locally, without publishing, subject to the same local-draft reliability tests and possible removal gate as V3-DRAFT-07. Do not create a general offline authoring or queued-publication system.

**Confirmed user decisions:** Work Offline persists across app restarts. If mode changes while an authorized editor is already open, notify the user and provisionally permit local continuation without publishing; this behavior is part of the removable draft-recovery support layer.

### V3-PERF — Faster image-heavy pages

**V3-PERF-01.** Improve perceived performance for Lures and Gear card grids on desktop and mobile. Currently the user observes thumbnail-sized images appearing one by one over roughly 3–4 seconds; eliminate or materially reduce this visible delay.

**V3-PERF-02.** Investigate network transfer, image size, lazy-load priorities, decode/paint cost, and service-worker verification/caching using reproducible measurements. Do not assume lazy loading or thumbnails alone are the complete explanation.

**V3-PERF-03.** Evaluate build-time generation of size-appropriate thumbnails, prioritized loading of immediately visible cards, and controlled loading/prefetch near the viewport. Use the original pictures for detail pages and the Picture Viewer.

**V3-PERF-04.** Retain search, order, image correctness, alt/accessibility semantics, responsive layout, and offline-library integrity. Extra thumbnail files must be accounted for in offline storage and release verification.

**V3-PERF-05.** Establish quantitative performance acceptance thresholds and representative baseline devices/networks during design/performance investigation; do not commit to arbitrary timings before measurement.

### V3-UPDATE — Correct application behavior following deployment

**V3-UPDATE-01.** An open browser tab or installed PWA session must not enter a broken state (missing images, unavailable pages, mixed/incompatible release assets) when a new production release is published.

**V3-UPDATE-02.** Detect and safely handle new releases. The application may continue serving a fully consistent pinned old release temporarily; if a reload is necessary, prompt or perform it only when safe for unpublished edits, and make the action understandable. No manual browser refresh should be needed to recover broken functionality.

**V3-UPDATE-03.** Explicitly test online, prepared offline, Work Offline, active draft, and interrupted/failed update scenarios. A content-only FISH108 release should not need a disruptive application upgrade path.

**V3-UPDATE-04.** Preserve exact source/release identity, asset integrity verification, and hosted-byte verification.

**Known symptom:** After successful production deployments, the user often must manually refresh the site or some pages do not load and some pictures are missing. Root cause is not yet established.

### V3-LINK — External links in installed Android PWA

**V3-LINK-01.** Ordinary external HTTP(S) web links in structured Links and Markdown Content/Notes must reliably open their destination from Android installed-PWA mode as well as ordinary browser tabs, without disrupting the Fishing Companion session.

**V3-LINK-02.** Preserve working YouTube and other verified app-link behavior, safe link validation, and appropriate tab/window/navigation semantics. Do not automatically force the same-tab or new-tab behavior until platform testing determines reliable and acceptable UX.

**V3-LINK-03.** Test Android Chrome and Edge as both browser tabs and installed PWAs, representative ordinary external links, YouTube app links, and long-press menu behavior. Also regression-test supported desktop and iOS clients.

**User observations (October 2026):**
- External links correctly open a new browser tab in ordinary Chrome and Edge browsing.
- Non-YouTube external web links do **not** open normally in Chrome when Fishing Companion runs as an installed app.
- Long-press in the installed Chrome app exposes an option to open an external link in the browser.
- YouTube links successfully open the YouTube app, verified in Edge browser mode and Chrome installed-app mode.
- Installed Edge and iOS app behavior remain unverified. The underlying cause is not established.

### V3-DRAFT — Local draft recovery (provisional, removable)

**V3-DRAFT-01.** While an authorized user is editing, retain unsent changes in memory and, if this feature remains enabled, automatically store a recoverable local draft on the same device with clear success/failure status.

**V3-DRAFT-02.** A partially completed edit must remain recoverable after a temporary network loss, accidental app closure, reload, or service-worker update when the browser retains the local data. When re-entering a record with a saved device-local draft, show an **automatic restore-or-discard prompt**; do not silently restore or discard.

**V3-DRAFT-03.** Include relevant structured fields, Markdown, original record source revision/base information, and selected local media when feasible within browser storage limits. Drafts must not be silently interpreted as published records.

**V3-DRAFT-04.** No automatic or queued GitHub submission, no cross-device synchronization, and no promise to start a new complete editing session without connectivity. Publishing requires explicit user action and online availability.

**V3-DRAFT-05.** On restoration, run the normal source-aware conflict checks before publishing. A browser storage denial, eviction, quota failure, or bad draft must never cause data corruption or prevent ordinary online authoring; never claim that a draft was stored if the write failed.

**V3-DRAFT-06.** Store drafts separately from offline-library caches and release assets. Successful production publication should clear a draft only after the verified completion condition has been met; an unsuccessful attempt should retain recovery material.

**V3-DRAFT-07 (explicit removal gate).** Implement local draft persistence/recovery **and local continuation of an already-open editor after switching Work Offline** as an independently disableable/removable support layer, with a tested fallback to the safe online editor. If v3 reliability testing reveals substantial regressions, the feature can be removed from v3 before cutover without delaying or compromising core direct-saving behavior. The user has authorized this contingency in advance; any actual scope removal will be reported for review.

**Not guaranteed:** Browser storage permanence, backup on another device, background publishing, or a full offline-first authoring experience.

### V3-OPS — Status, recovery, and diagnostics

**V3-OPS-01.** Make authoring and publication statuses understandable and actionable; report failure at the correct stage without a false Live/Published message.

**V3-OPS-02.** Maintain GitHub history and a practical documented rollback path for erroneous/failed production changes; a standalone revision browser UI is not required.

**V3-OPS-03.** Connection Status exposes offline-library readiness, release identity, and approximate space usage where accessible. Storage errors must be clear and not destructive.

**V3-OPS-04.** Provide Copy Diagnostics for useful troubleshooting facts (app/release/source identity, browser/platform, selected connection mode, offline-library state, non-sensitive error details). Do not include authentication credentials, private drafts, tokens, or personally sensitive user content.

## 4. Cross-cutting requirements and acceptance

**V3-X-01 — Supported clients.** Continue supporting Windows Edge/Chrome, Android Edge/Chrome (browser and installed PWA), and iPhone Safari/Chrome as in the v2 baseline. Distinguish cases that cannot be exercised in all modes from actual pass results.

**V3-X-02 — Source/data preservation.** Preserve unaffected Gear, KB and Catch records, record IDs, pictures, Knot sequences, paths, Markdown content, links, and historical Catch records. A data migration is permitted only if separately justified and approved at design review.

**V3-X-03 — Security/privacy.** Publishing requires authenticated authorization on a trustworthy path; public reading cannot expose write credentials. Use safe rendering/upload validation, ensure failures reject unsafe writes, and test session expiration/unauthorized requests.

**V3-X-04 — Accessibility/usability.** Use accessible, responsive controls, focus management and error messages. Preserve installed-PWA usability, existing visual language, and keyboard/touch navigation.

**V3-X-05 — Reliability.** Test network loss during edit, sign-in, media upload, submission, build, and deployment; conflicting GitHub updates; quota/storage errors; rejected images; stale browsers; interrupted/retried release workflows; and offline-library updates.

**V3-X-06 — Release.** Use approved design, test and rollout gates; preserve production v2 until v3 user acceptance and explicit cutover approval. Runtime changes use Full Application Release; ordinary content-only post-cutover publication must retain the established FISH108 guarantees.

**V3-X-07 — Evidence.** Keep traceable acceptance test results for representative real user workflows and hosted release identity; do not equate a successful GitHub commit with a verified deployment.

**V3-X-08 — Testing capability checkpoint.** Before investigations, visual/cross-browser acceptance testing, or deployment work requiring capabilities unavailable in the current Chat environment, proactively identify the specific missing capability, recommend a temporary Work-mode switch only if needed, and request the user's approval before switching. GitHub-source analysis and connector-supported workflow review may proceed in Chat. Installed Android PWA behavior may still require user-device testing with step-by-step instructions regardless of mode. Do not start a high-risk release step without confirming the necessary tools are available.

### Representative end-to-end acceptance scenarios

1. Anonymous user reads all domains; cannot publish even by invoking the write endpoint directly.
2. Authorized user signs in from desktop and installed Android PWA, edits an existing lure, saves once, sees appropriate progress, and confirms the new content is published with verified release identity.
3. Authorized user replaces a picture or Knot sequence; source content and media appear together after production validation; originals/unrelated bytes stay intact.
4. User adds/edits a Catch with the existing fields only; the record and related Catch history show correctly, with no demand to take a picture or share location.
5. User edits on an old source revision while newer changes exist in GitHub; detects conflict and preserves both newer source and local work without silent overwrite.
6. Existing page stays open while a content-only deployment completes; user navigates and loads images successfully without an emergency browser refresh.
7. Ordinary external web links activate in Android Chrome installed-PWA mode, while YouTube links continue opening their app where previously working.
8. Image-heavy Gear pages display their initial cards promptly and scroll smoothly; changes meet thresholds established from measured baseline.
9. Work Offline uses a complete verified library despite a weak live network; switching back to Automatic restores expected online behavior without corrupting release selection.
10. An interrupted in-progress edit is recovered locally if the provisional draft feature passes testing. If the feature is removed at its gate, core online saving and safe unsaved-edit warnings still work.
11. A rejected validation, failed deployment, or temporarily unavailable GitHub service never produces a false success message or silently drops unpublished work.
12. Authenticated editor session and sign-in return behave correctly with installed-PWA navigation/external-window restrictions.

## 5. Dependencies and proposed engineering order

The **requirements, technical design, and implementation plan each require separate explicit user approval**. The below ordering is a working proposal, not permission to implement.

1. Finalize this requirements document and obtain explicit requirements approval.
2. Research architectural alternatives and approve a technical design: secure GitHub authorization/writes; publication workflow; media transaction semantics; draft isolation; release/service-worker coherence; thumbnail design; fault recovery and tests.
3. Review a staged implementation/release plan and explicitly authorize implementation.
4. Investigate/fix reliability and performance defects (deployment consistency, Android installed-PWA links, card-image loading, Markdown viewer). **Preferred:** release independently verified, low-risk bug fixes as v2 maintenance when ready, rather than hold them for the complete v3 cutover; leave tightly coupled v3 changes within v3. Each maintenance release still requires normal approvals and the appropriate Full Application Release process.
5. Build GitHub authentication/direct publishing and local draft recovery behind a removable feature gate. Validate owner-session auto-recognition, explicit reauthentication fallback, and no public sign-in UI before dependent authoring features.
6. Integrate media uploads and Catch Add/Edit.
7. Implement Automatic/Work Offline mode and related reading/storage controls.
8. Run cross-platform system testing and scope-removal gate for draft recovery; conduct acceptance review before v3 cutover.

No PR implementing any application/runtime feature is authorized by this document.

## 6. Decisions and remaining questions for requirements review

**D1 — RESOLVED: Save/publication semantics.** One **Save and Publish** action, automatic publication after validation, no additional confirmation or approval, GitHub PR handling behind the scenes. The editor may be left while publishing proceeds; publishing status and eventual verified result must remain accessible.

**D2 — PARTLY RESOLVED; owner recovery decision outstanding.** Anonymous browsing is the default. Ordinary public pages show **no sign-in option and no Add/Edit controls**. Only the repository owner's authorized GitHub identity can publish. Automatically recognize and restore an existing valid owner session on routine visits, with minimal friction. A newly used browser or an expired/revoked session cannot be assumed to identify the owner silently. **Decision needed before design approval:** confirm a separate, owner-intended bookmarked entry route or equivalent unobtrusive manual entry for first-time/expired-session authentication. The route must never be treated as security; the server must validate GitHub identity and authorization. Review feasibility of persistent secure sessions across supported browsers/installed PWAs, including cross-origin cookie limits.

**D3 — RESOLVED: Draft behavior.** Drafts are device-local, not shared; display an automatic Restore/Discard prompt on entry when a matching draft exists. Preserve the explicit remove-at-testing gate and no queued publication.

**D4 — RESOLVED with provisional editor-continuation support.** Work Offline preference persists across restarts. Switching modes while an authorized editor is open informs the user and provisionally allows further editing of that open draft locally; no publishing while offline, and the behavior can be pulled with local draft recovery if reliability is unacceptable.

**D5 — RESOLVED: Source and edit UX.** Remove the user-facing Copy Changes manual export/fallback. Keep existing editors generally familiar; single Save and Publish must report the final verified production state.

**D6 — RESOLVED as investigation workflow.** During implementation/testing, provide the user with concrete step-by-step reproduction instructions **when help is needed**, rather than requesting further troubleshooting now. Preserve the already supplied Android Chrome/Edge evidence; investigate production-update breakage on the next suitable release or controlled test.

**D7 — RESOLVED as measurement workflow.** Investigate and measure representative device/network baselines and establish quantitative acceptance thresholds during design/profiling. The user's observed 3–4-second card-image appearance is not yet instrumented. Provide clear testing instructions if user-device evidence is necessary.

**D8 — RECOMMENDED IMPLEMENTATION STRATEGY.** Independently repairable, low-risk reliability bug fixes should normally ship as approved v2 maintenance once validated, so users receive fixes before v3 cutover. Strongly coupled or high-risk application rewrites remain in v3. This is a release-planning recommendation, not blanket authorization to implement or deploy.

## 7. Traceability and review record

This draft derives from the user's v3 wishlist and October 16–19 scope and Android testing feedback, including:
- Deferred offline authoring/synchronization and broad multi-user support.
- Explicit exclusion of Catch photography and optional capture enhancements.
- Agreement on Automatic / Work Offline connection concept.
- Noticeable 3–4-second tile-image appearance on desktop and mobile.
- Agreement that public reading remains open, with one GitHub-authorized author/publisher.
- Agreement with staged engineering plan, requirements/design sign-off, and later explicit implementation authorization.
- Provisional device-local draft recovery and already-open-editor local continuation after Work Offline selection, both removable if reliability testing fails.
- Android link diagnosis limited to external-link activation in installed-PWA mode, not general browser tabs; YouTube links work when delegated to the YouTube app.
- Anonymous-by-default browsing, no public Sign In or editing links, automatic recognition of existing authorized owner sessions, and a clearly documented open owner reauthentication-access decision.
- Single Save and Publish action with publication continuing after the editor is left; Copy Changes removed from v3 user-facing UI.
- Persistent Work Offline preference and an improved Connection Status visual design.
- Early warning before Work-only investigations or test capabilities are required; user-assisted installed Android PWA diagnosis if needed.
- Preferred independently releasable, approved v2 maintenance fixes for isolated reliability defects.

**Review status:** Awaiting the user's review and explicit approval. Until approval, all requirement IDs are proposed, not a signed-off baseline. No application/source changes, implementation, migration, or production deployment should be inferred from this requirements-document PR.
