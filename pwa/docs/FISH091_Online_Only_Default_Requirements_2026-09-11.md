# FISH091 — Online-Only Default / Explicit Offline Library

**Document type:** Change request and requirements specification  
**Status:** APPROVED / IMPLEMENTED / PRODUCTION-VERIFIED  
**Date:** September 11, 2026  
**Repository:** `ginosega/fishing`  
**Baseline:** `470c74472e569010b81659c86fdd60937d6a9159`  
**Approval/outcome:** Approved as written including S1–S4; subsequent design approval authorized implementation; FISH091 is DONE / production-verified. See `FISH091_Requirements_Approval_2026-09-11.md`, `FISH091_Design_Approval_2026-09-11.md`, and `FISH091_Production_Release_2026-09-11.md`.  
**Historical gate note:** This requirements document did not itself authorize runtime changes when first reviewed; that gate was later satisfied by the separate design approval.

## 1. Change request

Change Fishing Companion so that ordinary use defaults to **online-only** operation and does **not** automatically provision the complete offline library.

The complete offline library must remain available as an intentional P1 capability, but downloading or refreshing it must be initiated by the user through the existing **Connection Status → Update offline library** action (or an explicitly approved equivalent).

The desired user experience is that a person who follows a shared Fishing Companion link can begin using the site online without first waiting for the entire offline library to download and without the application intentionally consuming storage for a complete local copy. A user who expects to need offline access can intentionally prepare the offline library before going offline.

## 2. Problem statement

The current production architecture couples application startup with complete offline-library provisioning. On a browser that receives a newly installed Fishing Companion service worker, the application waits while the service worker downloads and verifies the complete release before normal application startup continues.

This has two undesirable effects:

1. A first-time or casual visitor must wait for the complete offline library even when that visitor only intends to browse the site online.
2. The complete library consumes local browser/device storage even when offline access was never requested.

The same coupling also means a new service-worker/release lifecycle can initiate complete-library provisioning as a consequence of deployment rather than as an intentional user action.

## 3. Relationship to the approved v2 baseline

This change **does not remove or downgrade offline reading**. The approved v2 requirement that previously entered text and images be viewable offline remains P1.

FISH091 changes **how that offline capability is provisioned and refreshed**:

- Current behavior: complete offline provisioning is automatic and startup-blocking.
- Required behavior: normal operation is online-first/online-only by default; complete offline provisioning is explicit and user-initiated.

FISH091 does not authorize offline editing, synchronization, authentication, direct repository save, upload infrastructure, or other FISH077/P2 work.

## 4. Goals and objectives

FISH091 must achieve all of the following:

1. **Fast shared-link / first-visit use.** A user with network access must be able to open and use the site without first downloading the complete offline library.
2. **Intentional storage use.** Fishing Companion must not deliberately store a complete local library unless the user explicitly requests it.
3. **Current online content.** When online, users should receive the current deployed production release rather than being pinned to an older complete offline release.
4. **Explicit offline readiness.** A user can intentionally prepare or refresh a complete, verified offline library using the existing Connection Status workflow.
5. **No deployment-triggered bulk download.** Publishing a new production release must not itself cause clients to download the complete new offline library.
6. **Preserve release integrity.** The existing integrity protections for complete offline releases—verified manifests/assets, atomic completion, preservation of a prior good release on failure—must not be weakened.
7. **Minimal UX change.** Preserve the Connection Status dot/dialog and the **Update offline library** action if practical; a separate user-facing connection-mode selector is not desired.
8. **Narrow scope.** Avoid introducing backend services, accounts, synchronization machinery, selective-download systems, or other complexity not required to satisfy this change.

## 5. Definitions

For this change request:

- **Online mode / online-only default** means the application obtains the release and resources needed for current use from production while network access is available, without intentionally provisioning the complete release for offline use.
- **Complete offline library** means the complete, verified release that Fishing Companion deliberately stores so all supported read-only application content and images can be used without network access.
- **Offline-ready** means a complete offline library has been fully downloaded, verified, and atomically marked complete.
- **Current production release** means the release identified by the production site's current release pointer at the time of a normal online application load.
- **Ordinary browser caching** means browser/HTTP caching that can occur as resources are normally requested during online use. It is distinct from Fishing Companion deliberately enumerating and downloading the complete release for offline readiness.

## 6. Functional requirements

### FISH091-R01 — Online-only is the default

On a clean browser/origin with network access, an ordinary visit to Fishing Companion must not automatically download or verify every file in the complete offline library before the application can be used.

### FISH091-R02 — Startup must not depend on offline provisioning

Normal online application startup must not be blocked on completion of a full-library offline download.

### FISH091-R03 — Shared and deep links must work without offline preparation

A user opening the home page or a valid direct/deep link while online must be able to load the requested application content without first preparing the complete offline library.

### FISH091-R04 — Complete offline provisioning is explicit

Fishing Companion may deliberately provision a complete offline library only after an explicit user action. For the current UX, that action is **Connection Status → Update offline library**.

Normal site load, navigation, application installation, service-worker registration/update, page reload, or production deployment must not be treated as equivalent authorization.

### FISH091-R05 — Online use prefers current production

When network access is available, a normal application load must use the current production release even if the browser already contains an older complete offline library.

An older complete offline release must not pin ordinary online browsing to stale text, images, application code, or other release content.

### FISH091-R06 — Production deployment does not refresh the offline library automatically

When a newer release is deployed, clients must not automatically download the complete new release merely because they visit the site, reload the site, receive updated application/service-worker code, or continue ordinary online browsing.

### FISH091-R07 — Existing complete offline libraries are preserved

The transition to FISH091 must not delete a previously complete and valid offline library merely because online-only becomes the default.

If production is newer than the stored offline library, online browsing must use current production while the previously complete library remains available as the offline fallback until the user intentionally updates it.

### FISH091-R08 — Explicit update creates the current complete offline library

When the user chooses **Update offline library** while online, Fishing Companion must attempt to download the complete current production release and verify every required offline asset before reporting the library as ready.

### FISH091-R09 — Offline updates remain atomic

A partially downloaded, incomplete, corrupt, or otherwise unverified offline update must never be promoted as the complete offline library.

### FISH091-R10 — Failed update preserves the prior complete library

If an explicit offline-library update fails and an older complete offline library exists, the older complete library must remain intact and usable offline.

### FISH091-R11 — Offline use selects a complete verified library

When the network is unavailable and a complete verified offline library exists, Fishing Companion must load from the most appropriate complete verified offline release available on that device. In the expected normal case, this is the most recently successfully prepared offline library.

### FISH091-R12 — Clear behavior when offline is not prepared

If the network is unavailable and no complete verified offline library exists, the application must present a clear unavailable/not-offline-ready state rather than implying that offline use is ready or relying on an arbitrary partial browser cache as though it were a complete library.

### FISH091-R13 — Connection Status remains the offline-library control surface

The existing Connection Status dot/dialog should remain the user-facing place to view network/offline-library state and to invoke **Update offline library**. A separate Online/Offline mode selector is not required and is not desired by this change request.

The wording/status presentation may be adjusted as needed so that network connectivity and offline-library readiness are truthful and understandable.

### FISH091-R14 — No silent complete-library accumulation

Fishing Companion must not use background service-worker activity, release checks, navigation, deployment events, or other automatic processes to deliberately assemble the complete offline library over time without the explicit offline-library action.

### FISH091-R15 — Ordinary resource caching is permitted

FISH091 does not require disabling ordinary browser/HTTP caching of resources used during normal online browsing. The requirement is to prevent deliberate **complete-library provisioning**, not to guarantee zero local browser cache usage.

### FISH091-R16 — Integrity checks remain authoritative

FISH091 must preserve appropriate release-pointer and manifest validation for online loading and must preserve the existing complete-library asset-integrity and completeness guarantees for offline-ready releases.

The design may reorganize where those checks occur, but it must not trade away integrity in order to make startup faster.

### FISH091-R17 — Authoring safety is unchanged

Existing protections for in-memory edits/prepared change packages and guarded reload/navigation must remain intact. FISH091 changes read/provisioning behavior only; it does not authorize new persistence or synchronization behavior.

### FISH091-R18 — Existing supported clients remain in scope

The approved responsive PWA/browser scope remains unchanged. The change must remain compatible with the currently supported Windows, iPhone, and Android browser targets covered by the v2 project requirements and production test strategy.

## 7. Non-functional requirements

### FISH091-N01 — No full-library startup gate

The amount of time required to provision the complete offline library must not be part of the critical path for a normal online first visit.

### FISH091-N02 — Avoid unnecessary device storage

A user who only browses online must not incur Fishing Companion's intentional complete-library storage cost.

### FISH091-N03 — Preserve failure isolation

Network failure, quota failure, asset corruption, or interruption during an explicit offline update must fail closed and preserve any prior complete offline release.

### FISH091-N04 — Preserve deterministic release behavior

Online and offline content selection must be deterministic and testable. The application must be able to distinguish the current production release from any stored complete offline release and report/use them according to these requirements.

### FISH091-N05 — No unnecessary architecture expansion

The approved design must solve the provisioning/currentness problem without adding accounts, a backend, sync infrastructure, per-record caching policy, selective content packs, or other systems not required by FISH091.

## 8. Transition and compatibility requirements

### FISH091-T01 — Existing users must not be forced to redownload

Deploying FISH091 must not require an existing user with a valid complete offline library to immediately download the complete library again merely to use the site online.

### FISH091-T02 — Existing offline copy remains a fallback

After FISH091 is deployed, an older valid complete offline library may remain stored and usable offline until the user intentionally chooses to update it.

### FISH091-T03 — New production becomes visible online without offline refresh

The existence of an older offline library must not prevent an online user from seeing a newly deployed production change. Updating the offline library is not a prerequisite for seeing current production while online.

### FISH091-T04 — No automatic bulk migration

The transition from the current automatic-offline behavior to FISH091 must not perform a one-time automatic download of the current complete release as a migration step.

## 9. Acceptance scenarios

The eventual design/implementation must demonstrate at least these behaviors in automated acceptance coverage:

| ID | Scenario | Required result |
|---|---|---|
| A01 | Clean browser storage, online, first visit | Application becomes usable without complete-library provisioning; no complete offline marker/library is created automatically. |
| A02 | Clean browser storage, online, valid deep link | Requested content loads without first downloading the complete library. |
| A03 | Clean browser storage, then network unavailable before explicit preparation | Clear not-offline-ready/unavailable behavior; no claim of complete offline readiness. |
| A04 | Online user explicitly clicks **Update offline library** | Current complete release is downloaded, fully verified, atomically committed, and reported ready. |
| A05 | Prepared library, then network unavailable | Application and previously entered text/images covered by the complete library remain usable offline. |
| A06 | Older complete offline release exists; newer production release is deployed; device is online | Normal load uses newer production immediately (subject to the signoff clarification below); no automatic complete-library refresh occurs. |
| A07 | Scenario A06 device goes offline without clicking Update | Previously complete older offline release remains the offline fallback. |
| A08 | Older complete offline release exists; explicit update to newer release fails | Older complete release remains intact and usable offline. |
| A09 | New production/service-worker code is deployed while user is an online-only user | Visiting/reloading does not trigger a bulk request for every manifest asset. |
| A10 | Ordinary online browsing | Resources needed for viewed content may use normal browser caching, but the application does not deliberately enumerate/download the entire library. |
| A11 | Chromium and WebKit automated suites | New online-default and explicit-offline scenarios pass alongside existing applicable integrity/authoring regressions. |
| A12 | Hosted production verification | The deployed hosted application demonstrates the approved online-default behavior and explicit complete-offline workflow, with exact deployed/source integrity checks retained. |

## 10. Out of scope

FISH091 does **not** include:

- offline add/edit, queued changes, outbox, synchronization, or conflict resolution;
- Direct Save or repository authentication;
- integrated image/file upload;
- Catch browser authoring;
- user accounts or a server/backend;
- selective offline packs, per-category downloads, or per-page "save for offline";
- automatic scheduled/background complete-library refresh;
- a major redesign of the Connection Status UI;
- automatic deletion/garbage-collection policy for historical complete offline releases beyond what is required for correctness and safe migration;
- live hot-replacement of the content inside an already-open page/session, unless that is separately approved during requirements review.

## 11. Design constraints, not design decisions

The following are constraints that the later design must respect; this section does not prescribe the implementation mechanism:

1. Online startup and complete offline provisioning must be separable operations.
2. The application must be able to distinguish online-current content from a stored complete offline fallback.
3. A complete offline release remains an all-or-nothing verified unit for readiness purposes.
4. User intent to update the offline library must be explicit.
5. Existing dirty-edit/reload protection and release-integrity guarantees must remain effective.

## 12. Proposed clarifications requiring requirements signoff

These interpretations were proposed for signoff and were subsequently **approved as written in S1–S4**. The original wording is preserved below as the reviewed requirements record.

### S1 — Meaning of "pick up all changes as soon as deployed"

**Proposed requirement interpretation:** an online client must use the newest deployed production release on its **next normal visit, navigation that causes a full application load, or reload** after deployment. FISH091 does not require forced hot-swapping of an already-open session while the user is actively using/editing it.

### S2 — Stale offline library after a deployment

**Proposed requirement interpretation:** if the device has an older complete offline library, keep it as a valid offline fallback. While online, use current production. Replace the stored offline fallback only when the user explicitly chooses **Update offline library** and the new complete release verifies successfully.

### S3 — Browser cache versus offline library

**Proposed requirement interpretation:** normal browser/HTTP caching of resources that the user actually visits is acceptable. "Online-only" means Fishing Companion does not deliberately fetch/store the **entire** release for offline readiness without explicit user action; it does not mean every online response must bypass the browser cache.

### S4 — UX scope

**Proposed requirement interpretation:** retain the existing Connection Status dot/dialog and **Update offline library** action rather than adding a persistent connection-mode switch. Status labels/help text may change only as needed to clearly distinguish **network connectivity** from **offline-library readiness/currentness**.

## 13. Requirements signoff gate — satisfied

The requirements gate was satisfied when the user explicitly approved this document as written, resolved S1–S4 by approving them, and authorized creation of the FISH091 design document. That approval is recorded in `FISH091_Requirements_Approval_2026-09-11.md`.

Requirements signoff alone did not authorize runtime implementation. The later design was separately approved in `FISH091_Design_Approval_2026-09-11.md`, after which implementation, production deployment, and hosted verification completed as recorded in `FISH091_Production_Release_2026-09-11.md`.
