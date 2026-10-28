# FISH118 D3 — Owner device acceptance (private pilot only)

**Prepared:** 2026-10-28. **Execution status:** NOT YET RUN on these devices. This is a focused owner-observed test protocol for the already deployed private sandbox. Do not infer a pass from previous D2 / V2 tests.

## Scope and guardrails

- Pilot origin: `https://fishing-auth-p0-test.ginosega.workers.dev`; private owner page: `/__d3_pilot__/`. **Not** the public canonical `/fishing/` release, and not a V3 production cutover.
- Use **Android Chrome ordinary browser tab** first. The standalone `/__d3_pilot__/` route is separate from the installed `/fishing/` PWA scope; a browser-tab PASS **does not satisfy** installed-V3-PWA acceptance. Do not present this pilot as an installed app or install a second PWA to bypass scope behavior.
- No new Gear/KB publication is needed. Use the completed PR #18 operation `p3_5527208d-a67c-4a2c-876d-9edaee353bc8` and the existing test-only `P3 Test Lake` KB entry.
- OAuth entry is an intentional top-level navigation to `/auth/start?return=%2F__d3_pilot__%2F`; only the original origin and approved destination are allowed. Do not paste cookies, secrets, session URLs, CSRF values or OAuth callback authorization codes into an issue/chat.
- Never sign out from a separate active owner editing session without first protecting any unsent draft. Do not repeat the PR merge or create a second operation. Tests of forbidden writes should be performed via **UI/read-only GETs**, not by submitting crafted POSTs from a normal device.
- A case is **PASS** only with observed behavior. Record device/OS/browser/version, local time, verdict and any nonsecret display/error text. **FAIL** or **NOT TESTED** are honest outcomes; do not paper over platform scope limits.

## A. Android Chrome — owner session and private KB (test in this order)

| Case | Action | Expected observation | Status |
| --- | --- | --- | --- |
| A1 | Open `https://fishing-auth-p0-test.ginosega.workers.dev/__d3_pilot__/` while signed out | Private page is denied (401 or not-found equivalent); no public Gear/KB substitute and no pilot JS disclosed | NOT TESTED |
| A2 | In Chrome's top-level address bar open `https://fishing-auth-p0-test.ginosega.workers.dev/auth/start?return=%2F__d3_pilot__%2F`; complete GitHub owner OAuth | Navigation returns to `/__d3_pilot__/` with the genuine authenticated sandbox, not the public V2 UI | NOT TESTED |
| A3 | View Knowledge Base and open `P3 Test Lake` | Test-only KB content and Notes display; no accidental canonical/public-data attribution | NOT TESTED |
| A4 | Open Connection Status / publication tracking, if exposed in current pilot UI, and inspect PR #18 final result | Displays Live as **sandbox verified**, never public canonical Live; if pilot lacks a status link, record UI GAP rather than count PASS | NOT TESTED |
| A5 | Switch to another page, reload and reopen the Chrome tab with the still-valid owner session | Private pilot still loads; existing KB content remains accessible and any retained durable status is recoverable | NOT TESTED |
| A6 | Use the supported Sign out action, then revisit the pilot route | Signout confirmed; owner-only pilot denies access, no edit controls. If pilot UI has no sign-out control, record UI GAP; do not clear cookies as a pretend signout test | NOT TESTED |
| A7 | Reauthenticate with owner account, reopen pilot, then close/reopen Chrome | Correct session restored while valid; no unintended new publication or OAuth loop | NOT TESTED |

## B. Windows Chrome or Edge — independent browser pass

Repeat A2–A6 in Windows desktop Chrome/Edge with a separate cookie store or carefully recorded authentication state. Inspect the same KB content and owner status. Confirm the public `/fishing/` page remains readable anonymously. **Status: NOT TESTED**.

## C. Installed Android PWA — explicitly separate pending gate

Current D3 owner test page resides at `/__d3_pilot__/`, while the existing installed app controls `/fishing/`. A passing mobile browser-tab run cannot claim an installed app sign-in/callback/return/owner-edit validation. The **integrated, production-hosted V3 PWA flow** must later demonstrate: installed Chrome PWA launch, Connection Status-only GitHub sign-in, callback return without losing app identity, restored owner session after relaunch, existing KB detail, status across navigation, and sign-out/relogin. **Status: BLOCKED by V3 integrated-PWA wiring / NOT TESTED.** Do not infer successful iPhone behavior (no iPhone test available).

## D. Security and reliability checks not closed by A–C

- Anonymous/foreign-account owner denial, server-side write refusal, stale source, conflict preservation, duplicate suppression, lost acknowledgment, interrupted merge and exactly-once recovery: covered in source tests where applicable, but real-provider regression still needs an evidence matrix. Do not perform destructive writes to manufacture failures.
- Final D3 signoff requires the owner acceptance UX, actual authorized private hosted behavior, and correct persistent status. Current pilot's live KB receipt already passed a seven-transition read-only D1 audit; **do not rerun publication just to reconfirm**.
- `V3-SAVE-09` 60-second normal-operation public delivery is a separate mandatory pre-cutover gate. Current production Actions/Pages evidence fails it. The private sandbox is not a compliant production benchmark.

## Execution report (fill after device testing)

| Case | PASS / FAIL / GAP / NOT TESTED | Device and short factual observation |
| --- | --- | --- |
| A1–A7 | NOT TESTED | — |
| B | NOT TESTED | — |
| C | BLOCKED | Current /__d3_pilot__/ route is not installed PWA's /fishing/ scope |
| D | OPEN | Use existing audited PR18 evidence; no destructive resubmission |

**Safety:** Do not modify current production routing, GitHub App grants or public main to satisfy the mobile acceptance checklist without separate consequential authorization.
