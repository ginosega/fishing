# P0-A — Controlled old-session test during the v2 thumbnail maintenance release

**Prepared:** October 21, 2026  
**Status:** Instructions ready; no production release, feature merge, or reproduction test has been conducted by this document.  
**Purpose:** Distinguish a healthy fresh session after deployment from an already-open session that still references an older verified release. This is **observational testing**, not a request to deliberately corrupt caches or disable the service worker.  
**Basis:** [P0-A source-level diagnostic report](Fishing_Companion_v3_P0_Stale_Session_Diagnostics_2026-10-19.md), [approved thumbnail PR #248](https://github.com/ginosega/fishing/pull/248), [Full Application CI #526](https://github.com/ginosega/fishing/actions/runs/39436154092). **Full Application Release to v2 production requires specific user approval after this setup is complete.**

## A — Prepare on Windows Edge **before** deployment

1. Open a **normal Edge browser tab** (not a home-screen installed app) at <https://ginosega.github.io/fishing/>. Wait until Fishing Companion's home screen loads. This must be the *old live production version*.
2. Press **F12** (or **Ctrl+Shift+I**). The Edge **Developer Tools** panel opens. Select **Console**. If it is hidden, use the panel's **»**/**More tools** menu.
3. At the Console prompt, **type** the following harmless, read-only expression, then press **Enter**:

   ```javascript
   window.__FISHING_V2__
   ```

   Expand the returned object. Record **`releaseId`** (32 hexadecimal characters) and **`sourceRevision`**. These are build identifiers, not credentials. If it shows `undefined`, check that you are inspecting the Fishing Companion tab and wait for it to finish loading. Do not refresh an old session after deployment.
4. Switch DevTools to **Network**. Ensure the circular **recording button is red** (recording enabled); check **Preserve log**; leave **Disable cache** **unchecked**; select **All** request types and clear any search/filter text. Keep the browser online and leave normal cache/service-worker behavior intact. The Network list may initially be empty—that is normal.
5. Leave Fishing Companion at its **Home** screen. Do not visit **My Gear → Lures** or **Knowledge Base → Techniques** yet. Those will be our post-deploy routes, selected so the old session may need to fetch as-yet-unloaded release A pictures/Markdown.
6. **Keep that tab open and unrefreshed, even if DevTools remains open.** Do not close Edge, restart the PC, clear site data, unregister/update the worker, change Work Offline, or click **Update offline library**. A previously fully prepared offline library can mask the issue; if one is already prepared, do not delete it just for testing—tell us.
7. Tell the assistant "**Old Edge tab ready**" and paste the `releaseId` and `sourceRevision` (or screenshot). We will then obtain **specific production authorization** for the thumbnail-only v2 Full Application Release and perform actual GitHub CI/merge/deploy/hosted verification. **Do not begin part B until the assistant confirms the actual production deployment completed**.

## B — Immediately after assistant-confirmed production deployment

8. **Stay in the original old Edge tab**, without using the browser address bar, Back to re-open, Reload, Refresh, Ctrl+R, or F5. With Network recording, **click inside the app**: **My Gear → Lures**. Let the card images load; record any missing/blank images. Optionally scroll far enough to cause more lazy images to load.
9. Within the same old tab, use the app's navigation to visit **Knowledge Base → Techniques → an article you have not viewed in this session**. Wait for its picture and content/Notes; note errors such as "**Unable to display this page**". If it fails, **stop and capture the evidence before attempting Retry or refreshing**. Capture a screenshot with **Win+Shift+S**.
10. In DevTools **Network**, look for red requests or response statuses such as **503** or **404**. A request may appear as an image (`.png`, `.jpg`) or a Markdown file (`.md`) under a URL containing `releases/<32-character-id>/content/`. Click the failed row, then **Headers → General**. Capture **Request URL**, **Status Code**, **Type**, time and the visible page/route. A request returning **503** from the service worker is especially informative. If the table looks empty, make sure recording is on and **All** is selected; do **not** reload just to populate it.
11. Optional **detailed trace**: In Network click **Export HAR (sanitized)** (or right-click a request → **Copy → Copy all as HAR (sanitized)**). Use **sanitized**, never "with sensitive data". A sanitized HAR normally excludes Cookie/Authorization headers but can still contain URLs or page-specific details; inspect it before sharing. A screenshot and one or two failed requests are usually sufficient.
12. Return briefly to **Console** and record any red errors. Type `window.__FISHING_V2__` again; record whether the old tab still reports its **original releaseId**. This command reads state and does not reload.
13. **Only after the original tab evidence is saved**, open a **new Edge tab** (Ctrl+T) to <https://ginosega.github.io/fishing/>. Wait until it loads. In **that new tab** press F12, choose Console and run `window.__FISHING_V2__`. Record the **new releaseId**. Visit the **same Gear/KB content**. Record whether images/article work. A fresh tab succeeding when the held old tab fails is strong evidence of release-transition mismatch.
14. Once screenshots, URLs/statuses, old/new IDs and timestamps are preserved and the assistant has confirmed receipt, it is safe to refresh the old tab to recover. **If the old tab never fails**, report that too: it does not disprove the source-level defect, because cached assets, worker lifetime, and CDN timing vary. Do not artificially break it by clearing caches or disconnecting network.

## What to send back

- **Old tab releaseId + sourceRevision**, and **new tab releaseId** after deployment.
- **Approximate Pacific time** and whether the old tab remained open throughout.
- **Exactly which page** was visited and what was missing (photo, whole article, blank card, error text).
- At least one **screenshot** if there is a failure.
- For one or two failed requests: **full Request URL** and **HTTP Status Code**; optionally a **sanitized HAR** or screenshot of Headers.
- State whether **Knowledge Base and My Gear work in the fresh new tab**, and whether an offline library was already prepared.
- If no failure occurs, state "**no reproduction**" with the exact old/new release IDs and which pages were tried. A negative observation is informative but not proof of a fix.

## Safety and interpretation

- A **normal browser tab** is the primary diagnostic target because Microsoft Edge DevTools can capture complete headers/network requests. A physical installed Android PWA can be observed afterward, but user-driven Android logs are *not required* for this first pass.
- **Don't turn on Disable cache, Clear site data, or Work Offline** for this test. These change the condition under investigation. **Do not reload the old tab until capturing evidence**.
- The two mechanisms already seen in source-level tests are removal of release-A-only assets from a single-release Pages publish and loss of a client's in-memory chosen release when its service worker restarts. A real-device 503 can help distinguish them, but may not conclusively establish all contributing causes.
- Documented release A vs B and actual hosted bytes must be verified by the assistant using the **latest successful main deployment workflow and hosted evidence**, independently of what DevTools shows.
- **Rollback/recovery:** If fresh sessions fail broadly, this is a release incident and the assistant must inspect hosted verification and initiate the separately approved appropriate remediation/rollback process; the old-tab repro experiment must not hold production hostage.
- Source references: [Microsoft Edge DevTools — Network activity](https://learn.microsoft.com/en-us/microsoft-edge/devtools/network/), [Network reference including Preserve log and sanitized HAR](https://learn.microsoft.com/en-us/microsoft-edge/devtools/network/reference), [Console usage](https://learn.microsoft.com/en-us/microsoft-edge/devtools/console/).

