# FISH118 D3 — Integrated installed Android PWA scope gate

Date: 2026-10-29. Scope: SOURCE ONLY on draft PR #263. No public V2 application change, private Worker deployment, new installation, or production V3 cutover.

## Confirmed compatibility blocker

The installed Fishing Companion PWA is scoped to /fishing/, while the owner-only private pilot is served at /__d3_pilot__/, outside that scope. The currently installed V2 service worker intercepts all same-origin GETs within /fishing/, rewriting navigations to the verified V2 index.html and refusing unmanifested JS. An owner endpoint under /fishing/ cannot safely be deployed by changing the Cloudflare Worker alone: old installed clients will render V2 or fail instead of the new private page. The public GitHub Pages /fishing/ deployment and existing private gateway must not be altered to bypass this without a separately authorized release.

## Prepared isolated source changes

1. Exact owner-only test endpoints /fishing/__d3_pilot__/ and /fishing/__d3_pilot__/pilot.js. They require BOTH D3_PILOT_ENABLED and the new D3_INTEGRATED_PWA_ENABLED, which is default OFF in the Worker template. The original working /__d3_pilot__/ remains untouched.
2. Each private document and SHA-256-pinned JS response requires a valid authenticated owner session, no-store, and noindex. Unknown paths, unauthorized users, query strings, forbidden methods and cross-site JS fail closed. No credentials, GitHub App permissions, or data write targets changed.
3. The exact OAuth start target /auth/start?return=%2Ffishing%2F__d3_pilot__%2F receives an independent short-lived, single-use .i flow marker. Both route flags are mandatory at initiation and at callback. Disabling either before callback fails closed. The existing .p and .f returns are preserved. The cross-site navigation exception is strictly limited to the private document GET, never its JS or APIs.
4. V3 branch service-worker source network-passes only the two exact owner route URLs, without caching them or rewriting their navigation to public V2. All other /fishing/ release assets preserve verification and existing offline behavior. The pilot is still online-only.
5. Added negative route, OAuth, SW scope and public-byte-proxy tests. This staging code is not public V3 deployment approval.

## Remaining mandatory acceptance and safety gates

- The current **installed V2 service worker does not contain** the new exception. A regular Chrome tab is not an installed-PWA acceptance result; do not install a second PWA as a shortcut.
- An integrated V3 /fishing/ release must carry the approved owner-session and Connection Status features, a compatible SW and manifest/start-URL behavior. The actual installed Android app must return correctly through OAuth, restore its session after relaunch, keep owner-only Gear/KB editing, show durable status and sign out safely.
- Coordinate the staged V3 app/SW release, exact hosted-byte validation, downgrade/rollback and any consequential public change with **separate cutover authorization**. Don't enable the in-scope endpoint on the existing production-like Worker until the SW/hosted bytes are compatible. A Worker-only route will not fix old SW interception.
- Use the next normal owner publication, not a duplicate test publish, to verify approximately five-second active-operation polling and terminal stop. Test hide/reopen/offline/signout edges separately.
- Keep V3-SAVE-09 publicly verified 60-second normal-operation delivery open: the one 59-second private sandbox result is not a public SLA pass. D4–D6 remain open.

Status: Exact-path scoped route, OAuth and SW compatibility implemented in isolated source. Real installed Android V3 PWA acceptance NOT TESTED; public V2, existing private Worker, webhook, DO watchdog, D1 receipts and Cron unchanged.
