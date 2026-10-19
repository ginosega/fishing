# Fishing Companion v3 — UX Flow Review (Proposed)

**Status:** **DRAFT — FOR USER UX REVIEW; NOT APPROVED.** These are proposed presentation details for the already-approved v3 requirements and technical design, not new features or implementation authorization.
**Date:** October 19, 2026
**Authority:** [Approved v3 requirements](Fishing_Companion_v3_Requirements.md), [approved v3 technical design](Fishing_Companion_v3_Technical_Design.md), [design approval](Fishing_Companion_v3_Technical_Design_Approval_2026-10-19.md).

This document is a durable companion to the interactive Chat review. It proposes wording/layout/interaction details and explicitly notes alternatives requiring feedback. Actual UI testing has not occurred.

## 1. Overall design principles

- Retain Fishing Companion's current header, navigation, responsive content grid, teal/green palette, familiar Gear/KB editors, and existing detail pages. No app-wide visual redesign.
- Anonymous reading remains the default; only the discreet **Sign in with GitHub** link at the bottom of **Connection Status** invites sign-in.
- Signed-in owner gets Add/Edit controls without altering public reading.
- **Save and Publish** is one action. Do not require an approval dialog. Report submission acceptance separately from verified production publication.
- A user may leave the editor **after the server confirms the submission was durably accepted**. Their publication remains trackable.
- Work Offline applies to reading. No new offline-authored sessions or queued publishing. Device-local recovery of already-open drafts is provisional and removable.
- Distinguish physical network status, the selected connection mode, the offline library's currentness and the current user authorization.

## 2. Sign-in flow

### Anonymous Connection Status

```text
┌──────────────────────────────────────┐
│ Connection status              [×]  │
│                                      │
│ Connection mode                      │
│  (●) Automatic                       │
│  ( ) Work Offline                    │
│                                      │
│ Network                 ● Connected  │
│ Offline library         ✓ Ready      │
│  Prepared release: a1b2c3…           │
│  [Update offline library]            │
│                                      │
│ Account                              │
│  Browsing anonymously                │
│  Sign in with GitHub  ↗              │
└──────────────────────────────────────┘
```

Only the link in Connection Status initiates GitHub login; no header sign-in and no prominent public Add/Edit controls. The sign-in link is an identity entry point, **not** an authorization secret. Any GitHub identity other than the owner remains read-only.

### After sign-in

- Start owner-initiated GitHub authorization (a navigation/callback scheme proven on real installed PWAs in AUTH-P0; **not** necessarily a popup/new tab).
- On success and owner identity verification, return to the original Fishing Companion view. The relevant Add/Edit controls appear.
- Connection Status account area now reads **Signed in as ginosega**, with **Sign out**.
- If a valid owner session exists at launch, recognition occurs unobtrusively; no login interruption.
- If another account signs in, show **This GitHub account is not authorized to edit Fishing Companion** and remain read-only.
- If session expires while editing, keep current work, ask to sign in again before publication; do not claim the action succeeded.
- Sign out reverts to anonymous reading and hides editor entry points. Warn about any unpublished device-local draft before sign-out.

## 3. Gear / Knowledge Base / Catch editing

Use existing fields and visual structure. Representative editor:

```text
┌─────────────────────────────────────────┐
│ Edit Z-Man Finesse TRD          [Back] │
│ Name          [Z-Man Finesse TRD       ] │
│ ... current fields retained             │
│                                         │
│ Picture       [Choose file]             │
│               ✓ Image validated         │
│ Notes                                   │
│ [Markdown editor / Preview]             │
│                                         │
│ ● Draft saved on this device   (if      │
│   optional draft feature enabled)       │
│                                         │
│ [Save and Publish]       [Cancel]       │
└─────────────────────────────────────────┘
```

- Save and Publish snapshots current data and images. A separate approval/confirm step is **not** shown.
- On submission, show **Submitting…**; while waiting for trusted-service acceptance, protect unsent state and prevent double submit.
- Once the service responds **Accepted**, show **Publication started** with a view/status action; leaving the editor is safe for that submitted immutable snapshot. There is no need to keep the editor open throughout CI/Pages deployment.
- If local draft feature is disabled at its testing gate, omit the local-draft indicator while preserving unsaved-change warnings.

## 4. Publication status

Proposed compact status presentation:

```text
┌──────────────────────────────────────────┐
│ Publishing: Z-Man Finesse TRD           │
│                                          │
│ ✓ Submitted                              │
│ ✓ Validated                              │
│ ◌ Publishing to production               │
│ · Verifying hosted content               │
│                                          │
│ You can leave this page.                 │
│ [View publication status]                │
└──────────────────────────────────────────┘
```

When navigating away after Accepted, show a brief nonblocking notice **Publishing 1 change…**. Publication status is discoverable again from the Connection Status dialog or returning to the edited item; an active owner publication need not force a modal. At terminal state:
- **Live / Verified:** show **Published successfully** only after hosted bytes and merged-source identity verify; optionally provide **View updated item**.
- **Validation failed:** show concise stage/reason and safe retry/return-to-edit option; never show Live.
- **Conflict:** say **The item changed in GitHub since you began editing**; retain submitted content; route to explicit review and resubmission, no silent overwrite.
- **Deployment failed after GitHub merge:** say **Saved to GitHub; not yet verified live**. Avoid implying changes were rolled back.
- **Unknown / temporarily disconnected:** keep accepted submission's operation reference; show **Checking status…**, not a second Save or a false failure.

No routine GitHub PR review/approval screen is added.

## 5. Refreshed Connection Status screen

```text
┌───────────────────────────────────────┐
│ Connection status               [×]  │
│                                       │
│ MODE                                  │
│ Automatic       Work Offline          │
│  Uses online release when available;  │
│  verified offline library fallback.   │
│                                       │
│ NETWORK                               │
│ ● Connected                            │
│                                       │
│ OFFLINE LIBRARY                       │
│ ✓ Ready  ·  431 files  ·  42 MB       │
│ Prepared version  f5eab…              │
│ [Update offline library]              │
│                                       │
│ PUBLICATION (owner only, if relevant) │
│ ◌ Publishing 1 change…                │
│ [View details]                        │
│                                       │
│ ACCOUNT                               │
│ Signed in as ginosega   [Sign out]   │
│                                       │
│ [Reload safely]       [Close]        │
└───────────────────────────────────────┘
```

The counts, bytes and release shown above are **illustrative**, not current production facts. The Network indicator is informational and not proof that the GitHub publishing API is reachable. The selected mode and last committed preference persist across app restarts.

- **Automatic:** online-current verified content, prepared-offline fallback. Normal authenticated authoring and Save-and-Publish permitted when API reachable.
- **Work Offline:** prepared offline library only; no normal app-data network fetches or publishing. Mode is not available if verified offline library is absent. Existing open edit can provisionally continue locally with a notice and without publishing; this behavior may be removed if reliability testing fails.
- **Offline update:** explicit action retained; no automatic massive library download. Warn if a partial edit would be disrupted.
- **Account:** anonymous state shows a small sign-in link at dialog bottom; owner state shows identity/sign out.
- **Publication:** visible only for a relevant owner operation; do not show false all-clear if a publication has not finished.
- **Reload:** safe reload honors dirty editor/provisional draft protection.

Suggested visual treatment: accessible single-column sections, subtle dividers, aligned state glyphs, compact secondary text, consistently styled buttons, generous mobile touch targets, no large colorful status badges. Preserve current site style.

## 6. Recovery and edge cases for visual review

| Scenario | Proposed UI |
|---|---|
| Owner returns while valid session | No prompt; editing controls become available after identity check |
| User opens Account section anonymously | Small Sign in with GitHub link; click intentionally begins auth |
| Unauthorized GitHub user signs in | Explicit access denied; no Add/Edit or publishing |
| GitHub sign-in returns outside installed PWA | Safe app return/reentry; do not rely on blocked popup/new-tab; AUTH-P0 evidence required |
| Owner submits once then leaves editor | Show compact in-progress status; publication proceeds through trusted service |
| Source conflict after submit | Retain submission; show review/resubmit; don't overwrite GitHub |
| Editor open when Work Offline selected | Notice: **You're working offline. You can continue editing this draft, but publishing is unavailable.** (provisional) |
| App reopened with device-local unsent draft | **Restore draft / Discard draft** prompt (provisional) |
| Draft store unavailable | Explain saving locally failed; online Save and Publish remains usable; do not claim preserved work |
| Deploy completes while app open | Preserve coherent release; prompt/safely transition; no broken images/pages/manual emergency refresh |

## 7. UX review checklist (not yet approved)

**UX-1.** Connection Status as the only anonymous sign-in entry, identity + Sign out after authentication.

**UX-2.** Existing Add/Edit layout with one Save and Publish button, no manual Copy Changes or per-save confirmation.

**UX-3.** Post-Accepted ability to leave editor; compact owner publication progress and eventual verified success/error.

**UX-4.** Connection Status sectional layout/wording for mode, network, offline library, account and relevant publication.

**UX-5.** Compact, explicit failure/recovery and provisional draft states; no offline publication queue.

Once the user reviews this mockup, adjust only presentation and approved flow details. If proposed feedback materially changes signed-off requirements or design, request an explicit amendment before implementation. **No implementation plan is approved by this UX draft.**
