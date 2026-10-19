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

1. **Read publicly, author privately.** The published Fishing Companion remains publicly readable. Editing and publishing are available only to the repository owner's authorized GitHub identity. No broad multi-user capabilities.
2. **GitHub stays canonical.** Gear, Knowledge Base, and Catch records, Markdown, and source images continue to live in ginosega/fishing. Browser drafts are not canonical records.
3. **Online publishing, offline reading.** Offline authoring, automatic sync/outbox publishing, and cross-device draft synchronization are explicitly deferred beyond v3.
4. **Reliability before novelty.** Fix the deployment-refresh and Android installed-PWA external-link issues, improve image-heavy page loading, and preserve existing content and references.
5. **Simple Catch Log.** Add and edit existing Catch fields, but do not introduce Catch photographs, GPS capture, session tracking, or field-workflow embellishments.
6. **No hidden expansion.** A low-value feature should not force a new cloud content database, generalized user-management platform, new source-image model, or unrelated schema redesign.
7. **Maintain existing release assurances.** Direct saving should remove the manual JSON handoff, not remove validation, conflict detection, auditable history, or verifiable production publication.

### Included

- GitHub-authorized access to Add/Edit/Save/Upload, with public read-only access retained.
- Direct online saving of Gear and Knowledge Base changes through GitHub and the verified production process.
- Integrated browser-side selection, validation, and upload of supported local files/images as part of authored changes, including Knot picture sequences.
- Catch Add/Edit using the existing Catch schema.
- Image Viewer opening from applicable Markdown images.
- Automatic / Work Offline user selection in Connection Status, for reading.
- Smaller, faster card images and appropriate load priorities, subject to measured performance.
- Correct, consistent update handling without broken pages or missing images after deployment.
- Fix external web links in Android installed-PWA mode.
- Lightweight local draft preservation/recovery during interrupted online editing, **provisionally included and expressly removable if reliability testing fails**.
- Clear publication status, conservative recovery/rollback, limited offline-storage information, and Copy Diagnostics capability.

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

**V3-AUTH-01.** Anonymous visitors can navigate and read all publicly published Gear, KB, and Catch content, including images, without signing in.

**V3-AUTH-02.** Add/Edit/Save/Upload actions require an authenticated GitHub identity explicitly authorized for this repository. Anonymous visitors should not be presented with functional authoring controls. Hiding buttons is not the security boundary: unauthorized publishing must also be rejected by the trusted write path.

**V3-AUTH-03.** No GitHub long-lived token, app private key, client secret, or equivalent credential may be embedded in public site files or exposed to an unauthorized browser session. Authentication and authorization failure must fail closed for writes without preventing ordinary public reading.

**V3-AUTH-04.** Support sign-in and sign-out, clear expired-authentication messaging, and recovery from an interrupted authentication flow. A failed or expired session must not destroy the current edit.

**V3-AUTH-05.** Test authentication and return navigation in desktop browser tabs and installed Android/iOS PWA contexts. The observed Android installed-PWA external-link bug is relevant to this flow.

**V3-AUTH-06.** Preserve least-privilege access and an auditable record of the GitHub changes submitted through the application.

**Design deferred:** GitHub App/serverless intermediary versus other secure options; how credentials are stored/renewed; exact sign-in UI; definition of the single authorized identity.

### V3-SAVE — Direct GitHub saving and publication

**V3-SAVE-01.** An authorized user can add or edit Gear and KB items in the existing browser editor and submit changes directly; no manual copying of generated JSON into ChatGPT and no separate manual media upload are necessary.

**V3-SAVE-02.** Preserve the current canonical paths, stable record IDs, source-aware change semantics, base fields, content hashes, current data schemas, safe paths, media rules, and unaffected/newer source modifications. No silent overwriting of concurrent changes.

**V3-SAVE-03.** Apply logically related record, Markdown, and referenced media updates consistently. A record must not go live referring to missing media, and an unsuccessful publish must not be misrepresented as successful.

**V3-SAVE-04.** The write flow must use the appropriate release lane: content-only eligible changes through FISH108 Fast Content Release; application/schema/runtime changes through the Full Application Release process. Preserve canonical validation/build, GitHub change history, production publication, and hosted byte/release-identity verification.

**V3-SAVE-05.** Show understandable stages, including at minimum Editing, Saving/Submitting, Validating, Publishing, Live/Verified, Failed, and Conflict. Distinguish GitHub acceptance from confirmed successful production publication. Permit safe retry where appropriate without duplicate or unintended changes.

**V3-SAVE-06.** If the source has changed since the edit began, detect and report conflicts. Preserve all user-authored local changes and provide a recoverable path to reconciliation. Automatically accept nonconflicting changes only when source-aware validation establishes safety.

**V3-SAVE-07.** Prevent accidental duplicate submissions; disable or guard conflicting actions while a submission is pending. A navigation, reload, sign-out, authentication interruption, or failed workflow must not silently lose uncommitted work.

**V3-SAVE-08.** Existing v2 Copy Changes handoff may remain as an explicitly labeled fallback/export or troubleshooting method if useful; its fate is a design decision, not a requirement to remove it.

**Open requirement decision:** Should normal Save automatically publish after validation, with GitHub PRs handled behind the scenes, or require separate user confirmation/approval for each publication? The discussed product preference favors simple one-click operation but this has not yet been explicitly decided.

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

**V3-CONNECTION-01.** Connection Status provides **Automatic** (online preferred, complete verified offline-library fallback) and **Work Offline** (use the prepared offline library even if the device has network connectivity). Show selected mode, actual browser/network status, prepared-library availability/release identity, and update state separately.

**V3-CONNECTION-02.** Work Offline must not initiate ordinary app-content network requests or direct GitHub publishing. It is an offline-reading mode, not permission to queue or synchronize writes. Explain unavailable online-only actions clearly.

**V3-CONNECTION-03.** If no complete verified offline library exists, Work Offline must not strand the user. Explain preparation requirements and retain usable automatic/online operation.

**V3-CONNECTION-04.** Preserve explicit offline-library preparation/update, atomicity, rollback to an earlier valid library after update failures, and release integrity checks already established under FISH091.

**V3-CONNECTION-05.** Mode changes, update checks, and release transitions must never erase or overwrite an unpublished edit or locally recovered draft.

**Open requirement decision:** Whether Work Offline preference persists after app restart and whether an authenticated editor already open when mode changes may continue locally (without publishing) should be specified during review.

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

**V3-DRAFT-02.** A partially completed edit must remain recoverable after a temporary network loss, accidental app closure, reload, or service-worker update when the browser retains the local data. Restore/discard must be an explicit user choice on reopening the relevant record.

**V3-DRAFT-03.** Include relevant structured fields, Markdown, original record source revision/base information, and selected local media when feasible within browser storage limits. Drafts must not be silently interpreted as published records.

**V3-DRAFT-04.** No automatic or queued GitHub submission, no cross-device synchronization, and no promise to start a new complete editing session without connectivity. Publishing requires explicit user action and online availability.

**V3-DRAFT-05.** On restoration, run the normal source-aware conflict checks before publishing. A browser storage denial, eviction, quota failure, or bad draft must never cause data corruption or prevent ordinary online authoring; never claim that a draft was stored if the write failed.

**V3-DRAFT-06.** Store drafts separately from offline-library caches and release assets. Successful production publication should clear a draft only after the verified completion condition has been met; an unsuccessful attempt should retain recovery material.

**V3-DRAFT-07 (explicit removal gate).** Implement this feature as an independently disableable/removable layer, with a tested fallback to the safe online editor. If v3 reliability testing reveals substantial regressions, the feature can be removed from v3 before cutover without delaying or compromising core direct-saving behavior. The user has authorized this contingency in advance; any actual scope removal will be reported for review.

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
4. Investigate/fix reliability and performance defects (deployment consistency, Android installed-PWA links, card-image loading, Markdown viewer); these could be independent v2 maintenance changes if specifically approved.
5. Build GitHub authentication/direct publishing and local draft recovery behind a removable feature gate.
6. Integrate media uploads and Catch Add/Edit.
7. Implement Automatic/Work Offline mode and related reading/storage controls.
8. Run cross-platform system testing and scope-removal gate for draft recovery; conduct acceptance review before v3 cutover.

No PR implementing any application/runtime feature is authorized by this document.

## 6. Open decisions for user requirements review

**D1 — Save/publication semantics.** Prefer single **Save and Publish** action that automatically initiates the verified production process after validation, with any GitHub PR entirely behind the scenes? Or require confirmation/approval for every content change? Define whether the editor waits for publication or may be left while publication proceeds.

**D2 — Authorization UX.** Confirm editing requires GitHub sign-in and only the owner's authorized identity; decide whether public pages hide Edit controls entirely or show a Sign in to edit affordance. Full private site access is out of scope.

**D3 — Draft behavior.** Confirm drafts are device-local, not shared; choose whether automatic restore prompt appears on entry versus a manually accessible Recover Draft option. Preserve the right to remove this feature at testing gate.

**D4 — Connection selection.** Confirm whether Work Offline is persistent across app restarts; clarify behavior for an editor already open if a user switches to offline mode.

**D5 — Source and edit UX.** Decide whether to retain Copy Changes as optional manual export/fallback; confirm existing forms remain generally familiar and Save/Publish reports final verified production state.

**D6 — Bug reproduction.** Collect exact failing regular external URL(s), device/browser/installed-app modes as convenient; record updated-release broken-page/image symptom when it next occurs. These observations refine acceptance tests, not prerequisites for requirements discussion.

**D7 — Performance targets.** Determine representative device/network baselines and explicit measurement thresholds during design/profiling. The observed 3–4-second card-image appearance is user-reported and not yet instrumented.

**D8 — Maintenance strategy.** Decide whether independently repairable reliability fixes should ship as v2 maintenance before the full v3 release or remain bundled into v3. Such fixes still require normal approval and release procedures.

## 7. Traceability and review record

This draft derives from the user's v3 wishlist and October 16–19 scope and Android testing feedback, including:
- Deferred offline authoring/synchronization and broad multi-user support.
- Explicit exclusion of Catch photography and optional capture enhancements.
- Agreement on Automatic / Work Offline connection concept.
- Noticeable 3–4-second tile-image appearance on desktop and mobile.
- Agreement that public reading remains open, with one GitHub-authorized author/publisher.
- Agreement with staged engineering plan, requirements/design sign-off, and later explicit implementation authorization.
- Provisional local draft recovery with an explicit option to remove it if testing harms reliability.
- Android link diagnosis limited to external-link activation in installed-PWA mode, not general browser tabs; YouTube links work when delegated to the YouTube app.

**Review status:** Awaiting the user's review and explicit approval. Until approval, all requirement IDs are proposed, not a signed-off baseline. No application/source changes, implementation, migration, or production deployment should be inferred from this requirements-document PR.
