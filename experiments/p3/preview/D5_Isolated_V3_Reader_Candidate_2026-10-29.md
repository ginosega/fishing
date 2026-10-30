# FISH118 D5 — Isolated V3 reader candidate (source-only, October 29/30, 2026)

## Purpose and authorization boundary

The owner approved uninterrupted routine D5 source/CI work after the October 29 **129/129 Windows source PASS**. The current public GitHub Pages Fishing Companion remains **V2**, and draft PR #263 remains **unmerged**. The authenticated Cloudflare private `/__d3_pilot__/` writes only to the isolated sandbox repository. Neither pilot nor the public /fishing/ PWA is replaced by the reader candidate.

This candidate exercises integrated V3 **public-library reading** behavior without owner authorization or publishing. It is intentionally **not yet a complete V3 owner PWA** and **does not close D3 installed Android OAuth/session**, a public text-only `V3-SAVE-09` <=60-second Save-to-Live, or final production rollout. No new Worker route, provider, secret, GitHub permission, production write, release upload or public app scope is authorized here.

## Source implementation

- Optional explicit CLI `--v3-reader-candidate` **requires** `--v3-reading-mode`, exact base `/fishing/__v3_reader_candidate__/` and a distinct explicit output path. It refuses the ordinary `pwa/dist` output. A bare `--v3-reading-mode` remains SW-only and **does not** opt the public entry into V3.
- `pwa/src/entry.mjs` continues to invoke the original `bootstrap(settings)` when the candidate flag is off. Only the candidate bundle passes a read-only `v3` context; `selectV3ReaderCandidate` verifies the exact root, an explicitly marked verified manifest, matching release/source identity and HTTPS (or localhost).
- The candidate context contains **no** `auth`, `lifecycle`, `publish`, `stageMedia`, private `sandboxSource`, or owner authorization. It permits V3 Connection Status reading-mode controls, allowlisted Copy Diagnostics and local Markdown Picture Viewer but cannot expose authoring controls.
- The candidate creates its own `manifest.webmanifest` start/scope and `sw.js` at `/fishing/__v3_reader_candidate__/`, never replacing the ordinary `/fishing/` worker. Its content/release/thumbnail files are built and byte-verified under that separate base. The immutable release hash and manifest identify the candidate.
- Normal public V2 build defaults and owner-only private D3 pilot source/routes remain separate. There is **no** deployment or credential activation in this change.

## Validation

Added `D5-RC01..RC05` unit regressions for normal V2 bootstrap, no owner authority, fail-closed scope/manifest, release identity and build-option gates. Expanded isolated PR CI to build this candidate into `/tmp/fishing-v3-reader-candidate`, run `tools/verify.mjs` against all manifest-listed bytes, and assert the independent candidate release marker. CI runs **no deploy**.

Expected developer command from the `pwa` folder (use a throwaway local output, not the ordinary V2 dist directory):

```powershell
node .\tools\build.mjs --base=/fishing/__v3_reader_candidate__/ --v3-reading-mode --v3-reader-candidate --out="$HOME\fishing-v3-reader-candidate"
node .\tools\verify.mjs --out="$HOME\fishing-v3-reader-candidate"
```

Build/verify are **source-only**. Opening `index.html` as a `file://` document cannot test service workers or installation. To exercise the verified candidate in **Windows Edge or Chrome on the same PC** without any hosted deployment, run the following in another PowerShell terminal (it only binds `127.0.0.1`; stop with Ctrl+C):

```powershell
node .\\tools\\serve-v3-reader-candidate.mjs --out="$HOME\\fishing-v3-reader-candidate"
```

Then navigate to `http://127.0.0.1:4173/fishing/__v3_reader_candidate__/`. The loopback-only server never serves `/fishing/` or the D3 private pilot, handles encoded media filenames, rejects traversal and never uploads/publishes files. Tests `D5-RS01..02` cover these boundaries. In Windows Edge, verify Connection Status shows Automatic and Work Offline, Update offline library prepares a complete local copy, Work Offline persists after reload, missing online network does not break prepared reading, and Copy Diagnostics excludes secrets. Review a Gear/KB Markdown image and test its original-quality Picture Viewer. A local desktop preview **does not** satisfy installed Android PWA or actual hosted owner-auth acceptance.

A future secure-origin, isolated-scope **device test hosting** decision and proper HTTPS Android checks are required; do not publish over the canonical public `/fishing/` SW.

## Acceptance still needed

1. Exact-head independent CI PASS for all canonical PWA tests and candidate build/verify; optional owner Windows command/verification.
2. Serve the **verified independent candidate** at its exact HTTPS same-origin scope only after explicit scoped hosting/security approval; confirm no collision or accidental V2 SW/library reuse and no auto-owner publishing.
3. Windows Edge/Chrome and **installed Android Chrome PWA**: Automatic default; prepare offline library; Work Offline persists across relaunch and truly makes no routine network requests; missing/corrupted assets never mingle with live network; return to Automatic; release transitions protect dirty editors.
4. V3 local Markdown images open their original bytes (including keyboard use), existing linked images preserve link behavior, missing images show a non-fetching fallback, and Copy Diagnostics excludes secrets/operation IDs/draft text.
5. Independently integrate **owner GitHub OAuth and CSRF-backed publisher** into the proper installed V3 app scope, with session/relaunch/logout/online acceptance, before D3/D6 completion. This read-only candidate is not an auth substitute.
6. Run D6 signed-off requirement traceability, rollback and true public <=60-second canonical publication checks before any separately authorized V3 production cutover.

D4 separate direct hosted original-image byte audit and Knot-sequence replacement/interrupted upload remain documented limitations; do not manufacture new publisher writes just to repeat previous success.

## Source-CI baseline reconciliation — October 29 late

The first push-triggered isolated source CI run [#41009327363](https://github.com/ginosega/fishing/actions/runs/41009327363) passed canonical PWA tests, built and byte-verified the independent candidate, passed the standalone broker, D2/D3 bundle/CSP/Wrangler dry-run, and Windows-script parsing. Its final 760-case legacy P3 preview suite reported **759 PASS / 1 FAIL**: `P2P3-04` checked that `.github/workflows/fishing-production.yml` retains `merge-ready`, but the experimental draft branch held an outdated file missing that job. No user-facing candidate failure was implicated.

Instead of relaxing the required-check test or changing public `main`, the draft branch's entire production workflow was reconciled **verbatim** to the current protected `main` file, blob `40b71f3a5e7c4a0ec42eb434dbb8b9a12d74b580` (reconciled draft commit `a30e84fe9824a2165500dc535b0353f618ce4d4c`). This preserves the current `validate-docs` and `merge-ready` safeguards and avoids an accidental future downgrade by draft PR #263. No production workflow was edited on main, and no deploy ran. **A fresh exact-head CI result after this alignment is required before claiming the complete source suite PASS.**

