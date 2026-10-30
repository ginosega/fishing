# FISH118 D3 — Owner device acceptance (private pilot only)

**Prepared:** 2026-10-28. **Execution status:** Android Chrome cross-device publication-status fix and subsequent A5–A7 browser-session sequence owner-reported PASS on 2026-10-28. Private owner pilot passes core owner sign-in/KB/reload/status behavior; installed V3 PWA acceptance remains a separate pending gate. This is a focused owner-observed test protocol for the already deployed private sandbox. Do not infer a pass from previous D2 / V2 tests.

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
| A1 | Open `https://fishing-auth-p0-test.ginosega.workers.dev/__d3_pilot__/` while signed out | Private page is denied (401 or not-found equivalent); no public Gear/KB substitute and no pilot JS disclosed | **PASS — Android Chrome reported Not Found** |
| A2 | In Chrome's top-level address bar open `https://fishing-auth-p0-test.ginosega.workers.dev/auth/start?return=%2F__d3_pilot__%2F`; complete GitHub owner OAuth | Navigation returns to `/__d3_pilot__/` with the genuine authenticated sandbox, not the public V2 UI | **PASS — existing GitHub authorization completed automatically; private pilot opened signed in** |
| A3 | View Knowledge Base and open `P3 Test Lake` | Test-only KB content and Notes display; no accidental canonical/public-data attribution | **PASS — changes verified on Android** |
| A4 | Open Connection Status / publication tracking, if exposed in current pilot UI, and inspect PR #18 final result | Displays Live as **sandbox verified**, never public canonical Live; if pilot lacks a status link, record UI GAP rather than count PASS | **PASS after fix — owner confirmed publication status message appears and Check publication status button works in Android Chrome.** The earlier missing-message/inert-button failure was due to browser-local-only receipts; the new owner-scoped, read-only latest-operation service lookup resolved it. The exact visible text was not supplied in the retest; the prior D1 audit already established sandbox Live independently. |
| A5 | Switch to another page, reload and reopen the Chrome tab with the still-valid owner session | Private pilot still loads; existing KB content remains accessible and any retained durable status is recoverable | **PASS — October 28 evening owner reports all requested Chrome relaunch/session tests passed.** Earlier KB reload and cross-device status were separately confirmed; no screen recording or detailed new observation supplied. |
| A6 | Use the supported Sign out action, then revisit the pilot route | Signout confirmed; owner-only pilot denies access, no edit controls. If pilot UI has no sign-out control, record UI GAP; do not clear cookies as a pretend signout test | **PASS — October 28 evening owner reports the requested signout plus direct private-route denial test passed.** No new unauthorized POST was attempted. |
| A7 | Reauthenticate with owner account, reopen pilot, then close/reopen Chrome | Correct session restored while valid; no unintended new publication or OAuth loop | **PASS — October 28 evening owner reports reauthentication, Chrome closure/relaunch and restored private pilot passed.** Browser pilot only; exact timings not supplied. |

## B. Windows Chrome or Edge — independent browser pass

Repeat A2–A6 in Windows desktop Chrome/Edge with a separate cookie store or carefully recorded authentication state. Inspect the same KB content and owner status. Confirm the public `/fishing/` page remains readable anonymously. **Owner comparison: PC/Edge displays the publication message and the Check publication status button works; other B cases not freshly documented.**

## C. Installed Android PWA — explicitly separate pending gate

Current D3 owner test page resides at `/__d3_pilot__/`, while the existing installed app controls `/fishing/`. A passing mobile browser-tab run cannot claim an installed app sign-in/callback/return/owner-edit validation. The **integrated, production-hosted V3 PWA flow** must later demonstrate: installed Chrome PWA launch, Connection Status-only GitHub sign-in, callback return without losing app identity, restored owner session after relaunch, existing KB detail, status across navigation, and sign-out/relogin. **Status: BLOCKED by V3 integrated-PWA wiring / NOT TESTED.** Do not infer successful iPhone behavior (no iPhone test available).

## Approved forthcoming Connection Status UX enhancement — October 29, 2026

**Owner decision: APPROVED / OPEN (not yet implemented or deployed).** When a publication is underway, the V3 Connection Status panel must refresh status **automatically at approximately 5-second intervals** while the owner is authenticated and the panel remains visible. Keep the existing **Check publication status** button as a manual fallback.

Acceptance and safety criteria:
- Poll the **original owner-scoped durable operation receipt** (or discover the latest only when no operation is known), never re-submit a write or create another publication merely because status refresh fails.
- Poll only during nonterminal publication states (e.g. Accepted, Validating, Checking, Merging, Deploying, Verifying); **stop at Live, Failed, or Conflict** and accurately distinguish private-sandbox verification from public canonical Live.
- Stop or suspend polling when Connection Status closes, the page is hidden, the owner signs out, or connectivity is lost; restore on reopening/reconnection when appropriate. Do not leave orphan timers across panel destruction/relaunch.
- Use at most **one in-flight status request**, prevent stale responses after sign-out or operation change from overwriting current state, and avoid flashing `Checking` in the UI on every automatic refresh. Retry transient read failures conservatively without duplicating operations.
- Show the new state accessibly (existing live region) and retain the manual button for on-demand checks and troubleshooting.
- Test the change on desktop Edge and Android Chrome, including cross-device restoration, pending→Live, terminal stop, close/reopen, offline/online, and sign-out mid-poll. Integrated installed-PWA acceptance remains a separate gate.

**Priority:** Include in the next planned Connection Status screen update. **No source/deployment change is authorized by recording this future UX requirement; active webhook performance tests continue on the existing pilot.**

## D. Security and reliability checks not closed by A–C

- Anonymous/foreign-account owner denial, server-side write refusal, stale source, conflict preservation, duplicate suppression, lost acknowledgment, interrupted merge and exactly-once recovery: covered in source tests where applicable, but real-provider regression still needs an evidence matrix. Do not perform destructive writes to manufacture failures.
- Final D3 signoff requires the owner acceptance UX, actual authorized private hosted behavior, and correct persistent status. Current pilot's live KB receipt already passed a seven-transition read-only D1 audit; **do not rerun publication just to reconfirm**.
- `V3-SAVE-09` 60-second normal-operation public delivery is a separate mandatory pre-cutover gate. Current production Actions/Pages evidence fails it. The private sandbox is not a compliant production benchmark.

## Execution report (fill after device testing)

| Case | PASS / FAIL / GAP / NOT TESTED | Device and short factual observation |
| --- | --- | --- |
| A1–A7 | OWNER-REPORTED PASS | A1–A4 previously individually evidenced; A5–A7 reported passed in the follow-up on October 28 evening after the requested test sequence. No new logs, exact displayed text, or installed-PWA evidence. |
| B | PARTIAL | PC/Edge publication message and status button work; full pass outstanding |
| C | BLOCKED | Current /__d3_pilot__/ route is not installed PWA's /fishing/ scope |
| D | OPEN | Use existing audited PR18 evidence; no destructive resubmission |

**Later owner confirmation (October 28 evening):** After being instructed to verify post-signout direct-route denial, owner reauthentication and Chrome closure/relaunch, the owner replied: "Tests pass - continue." This is accepted as owner-reported PASS for A5–A7, without inventing further observations. This does not close section C or D.

**Observed Android retest:** The owner reported, "That fixed it. The status message is showing and the button works on Android." This verifies the private browser pilot's cross-device display and button behavior; it does not by itself verify the exact displayed text, a new backend D1 transition, installed-PWA scope, or the public 60-second requirement.

**Safety:** Do not modify current production routing, GitHub App grants or public main to satisfy the mobile acceptance checklist without separate consequential authorization.

---

## October 29 private Connection Status polling deployment checkpoint

**Status: deployed to existing owner-only private pilot; owner device acceptance NOT YET REPORTED.** This later checkpoint supersedes the earlier "not yet implemented" statement in the October 29 approval section above without altering its requirements.

- Exact reviewed FISH118 source head deployed: `52362795c9c7746b0696c418fa0b43e19fd24249` on **draft/unmerged PR #263**. Isolated source validation [#40929509415](https://github.com/ginosega/fishing/actions/runs/40929509415) completed **success**, covering the Connection Status controller's new five-second polling, serialized GETs, visible/closed/hidden/offline/signout gates, terminal states, error retry, and stale-result tests. This is source evidence, not real-device proof.
- Owner executed the exact-head guarded local `deploy-d3-connection-poll.ps1` preflight and one `-Deploy` to **existing Cloudflare Worker `fishing-auth-p0-test`**. Both reported PASS. Before: Worker version `7a7a85e2-7bf3-4664-8dbb-04d0f3c13457`; after: **`1416b04e-843b-4fd6-98f5-c095fd33ece0`**.
- Generated private owner pilot bundle SHA-256 **`6a3db817c67d47773ef0f911ceeea1c94e554163186ced006d8b7ab4893be542`**, size **282866 bytes**. Browser CSP, Windows CRLF parity, Worker bundling and Wrangler 4.153.0 dry-run checks passed in the local output; this is the generated code's identity, not evidence of a new public PWA.
- Postflight reported **private anonymous pilot and script denied; unsigned webhook POST denied; owner session API available; known sandbox PR #26 D1 Live receipt and merge SHA preserved; public V2 gateway content hash unchanged**. Fast watchdog and signed webhook remain enabled; recovery Cron `*/5 * * * *` retained. D2 flags remain false. No remote migration, new content publication, new resources, public GitHub main deployment or V3 cutover.
- **Still unverified on real devices:** (1) desktop Edge private owner Connection Status manual button and terminal Live status on new Worker; (2) Android Chrome same; (3) actual auto-transition while a fresh legitimate owner publication is in-progress, including 5-second refresh, terminal stop, hide/close/reopen, connectivity, and sign-out. Do not generate a new publication solely for a status check; capture pending→Live evidence with the next ordinary owner edit. Browser tab testing does **not** satisfy integrated installed Android V3 PWA OAuth/service-worker scope acceptance, still OPEN.
- **Important distinction:** A completed `Live · sandbox verified` receipt should remain visible with no automatic timer. The five-second polling is conditional on a genuine nonterminal operation, so an existing completed PR #26 can validate terminal display but cannot prove the auto-poll timing.

## October 29 owner-reported browser acceptance after polling deployment

**Owner result: PASS, October 29, 2026.** Following the guarded Worker deployment (`1416b04e-843b-4fd6-98f5-c095fd33ece0`), the owner was asked to run the two browser smoke-test steps: Windows Edge and Android Chrome, each opening the authenticated private pilot's Connection Status, verifying the existing terminal **Live · sandbox verified** publication and manual **Check publication status** action, and checking dialog close/reopen (Edge) or page reload/cross-device status restoration (Android). The owner replied **"pass"**, which is recorded as an owner-reported PASS for both requested steps. No browser screenshots, timings, or extra case-by-case details were provided; do not claim independent instrumentation or exact five-second intervals were observed.

**Closed:** postdeployment **B/Edge** and **A/Android Chrome** terminal status-display/manual-refresh smoke checks for the existing private pilot. These update only the new-Worker status acceptance, not the previously completed broader A1–A7 sequence or public hosted identity.

**Remains OPEN:** (1) actual ~5-second automatic status progress and terminal stopping **during the next legitimate nonterminal owner publication**, without creating a new publication merely for polling; (2) active-operation visibility/close/reopen/offline/sign-out edges on real devices (source-tested, not owner tested); (3) **integrated installed Android V3 PWA** sign-in, callback, session restoration and status acceptance (the private pilot is outside installed `/fishing/` scope); (4) D3 broader real-provider negative/reliability evidence and V3-SAVE-09 public canonical delivery gate. Keep PR #263 draft; do not cut over public V2 or infer a production SLA from a private Live receipt.
