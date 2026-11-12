# FISH118 / AUTH-P0 G1-D — Hosted release identity, gateway byte fidelity and release transition

**Prepared:** October 22, 2026  
**Status:** **Production GitHub Pages hosted-byte verification: PASS (all 577 files by CI). Gateway verified offline-library integrity: PASS by owner field report. Independent live Pages-vs-gateway byte comparison: NOT EXECUTED because this testing environment cannot access either public hostname.** G1-D remains **OPEN** pending the new independent live comparison and a hosted transition/fallback acceptance test.

**Authorization:** Owner-approved G1-A–E investigation on unmerged experimental [draft PR #262](https://github.com/ginosega/fishing/pull/262). No Worker deployment, GitHub permissions, production app changes, canonical content edits, domain purchase or D1 mutation is authorized or performed in this stage.

## 1. Current source and independently available production evidence

- `main`: `35e88c47d96f4d7021afa642fdee9e6616c65e83` (documentation commits after the deployed source). One open PR: draft #262.
- **Latest successful production workflow:** [run #543](https://github.com/ginosega/fishing/actions/runs/39690549053), `deploy-full` job ID `119538996060`, Pages source SHA `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`; published release ID `131ebca9c6d46fa1c1d815ad43a318f6`.
- **CI verified 577 hosted files (Pages only):** The exact `pwa/tools/verify-hosted.mjs` job compares **SHA-256 of HTTP response bytes** with each file in the publication artifact: `hash(await get(new URL(encode(file),base))) === hash(expected)`, running all files under the deployed `dist`. The successful log prints `v2Files: 577`, source SHA, release ID, and **Gear 100 / KB 60 / Catches 12**. This is evidence for the canonical Pages host—not an independent Cloudflare comparison.
- **Owner-reported gateway:** In Windows Edge InPrivate, the Cloudflare `/fishing/release.json` pointer and the versioned manifest matched the above release and content counts. The gateway installed on Android, prepared offline with no errors, worked disconnected and retained its cached library across Android restart. Windows Edge reported `Offline library ready` for **575 manifest asset entries**; 577 total published files includes the pointer and manifest. These are substantial SHA-verified PWA functional evidence, **not** proof that direct Pages and gateway HTTP bodies are identical by an independent third-party comparator.

## 2. G1-D comparison tool added and executed locally

**Read-only checker:** [`tools/compare-hosted-bytes.mjs`](tools/compare-hosted-bytes.mjs). **Regression suite:** [`test/hosted-integrity.test.mjs`](test/hosted-integrity.test.mjs).

This Node.js 20+ checker uses **only unauthenticated HTTP GET** on the two fixed HTTPS origins:
- Direct: `https://ginosega.github.io/fishing/`
- Proxy: `https://fishing-auth-p0-test.ginosega.workers.dev/fishing/`

It fetches and compares raw bytes for `release.json`, the content-addressed manifest and **13 representative current-release app/media files** (home shell, JS loader, service worker, web manifest, release JS/CSS, Gear/KB/Catches JSON, sample Gear/KB images, thumbnail and KB Markdown). Each sampled file must also match the size and SHA-256 advertised by the release manifest. The checker recomputes the manifest digest from the release pointer and checks release ID/source commit/base path, and **re-fetches both release pointers** after the sampled files to detect a publication during the test. It records per-file elapsed GET timings; these are one-run transfer timings, **not** an operational benchmark.

**Exact local Git blob matches:**

| File | Git SHA confirmed in container and on GitHub |
| --- | --- |
| `tools/compare-hosted-bytes.mjs` | `afb97b27176a7b29e101900542cb87def250a9ec` |
| `test/hosted-integrity.test.mjs` | `c9f157591b7d973265c09e32f057373d5569e444` |

**Actual local regression result (Node v22.16.0):** `node --test test/hosted-integrity.test.mjs` → **6 tests passed, 0 failed**. Cases: matching fixture passes; proxy-byte tampering fails; matching-origin bytes with wrong manifest digest fail; manifest corruption fails; a pointer changing mid-comparison fails; path traversal cannot fetch arbitrary paths. Early edits to this new test suite corrected assertion expectations only; the committed exact SHA versions above passed together.

**Actual live attempt here:** `node tools/compare-hosted-bytes.mjs` exited nonzero with **`G1-D NOT VERIFIED: fetch failed`**. The container has no outbound DNS resolution for either hostname; independent web inspection of the two release pointer URLs also returned **not accessible via this tool**. These failures are transport limitations of the testing environment, **not evidence of a gateway outage or integrity mismatch**. No live comparison hash is reported as observed.

### How to complete the live comparison without modifying either site

From a machine with internet access and Node.js 20+ (e.g. the owner's Windows PC), download the two experiment-branch files to their matching `tools/` and `test/` paths, or work from a checkout of the draft branch. Execute:

```powershell
node tools/compare-hosted-bytes.mjs
```

The script prints JSON with `status: PASS`, actual release ID, source commit, number of checked assets, pointer/manifest SHA-256, per-asset SHA-256 and read timings. It exits nonzero with **G1-D NOT VERIFIED** on any mismatch/network error; capture full output without passwords/cookies. It requires no GitHub/Cloudflare sign-in, tokens, local browser setup, production change or app installation. **Do not infer a PASS until such a real connected run is recorded.**

## 3. Gateway source review / what is and is not proven

- `experiments/auth-p0/gateway.mjs`: fixed upstream `https://ginosega.github.io`, matching `/fishing/*` path, read-only GET/HEAD, no browser Authorization/Cookie forwarding, manual/no-follow redirect, strips upstream `Set-Cookie`/Location/CORS headers and returns upstream response body stream **without deliberate byte rewriting**. This supports the expected identity by construction but does not alone attest to the **live deployed single-file Worker**.
- `pwa/src/release.mjs`: release pointer binds manifest SHA-256; manifest validates source revision, base, expected paths and each listed file's hash/size; copied PWA SW bytes are independently verified on fetch and on offline preparation.
- `pwa/src/sw.mjs`: `loadOnlineContext` reads fresh pointer + verified manifest; a client-context map pins a tab to one release; pinned-version assets cannot silently redirect to another release. With upstream unavailable, it can fall back to the verified selected cached generation, including `release.json` and manifest; offline `Ready` status explicitly re-verifies complete entries.
- `pwa/src/offline.mjs`: `checkCurrent` asks the worker for the fresh online pointer; for clean editor state, it performs a whole-page reload rather than mixing releases; for unsaved edits, it warns and **does not force reload**.

**Limitations and conditions:** service-worker client contexts are in memory and may be lost across SW restart; fallback selection can use an older complete offline generation, and GitHub Pages does not promise to retain prior-release *online* assets. This is by design only under coherent user flows. A live published-update/dirty-editor transition via the gateway is **not tested in G1-D**. Do not trigger an unrelated production publication merely to manufacture this test; use a separate controlled nonproduction preview/fixture after scoped approval.

## 4. Additional G1-D checks still required

1. **Independent live check:** Execute the new comparator on a connected device and record exact JSON outcome, including any failing file. If a release publishes during the check, retry only once the pointer is stable.
2. **Release-update coherence:** In a controlled preview, confirm an online release switch on a clean tab reloads all assets together; when editor data is dirty, the app retains edits and asks before navigating away.
3. **Already-prepared offline fallback:** In the same controlled scenario, verify that after serving new online version metadata (or an upstream error), the previously complete local library remains safely usable without silent mixing. Avoid touching current production or deleting its cache.
4. **Recoverable failure path:** Confirm gateway read errors and proxy outages result in readable fallback or deliberate failure—not stale or unverified bytes. Record independently observed statuses and timing.

## 5. Gate summary

| Evidence | Result |
| --- | --- |
| Pages deployment / all 577 hosted HTTP files by CI | **PASS** |
| Gateway read-only source design and deployed real-device 575-asset verified offline library | **PASS within observed scope** |
| New source-matched comparison helper and 6 fixture tests | **PASS** |
| Independent live Pages-vs-gateway comparison | **NOT VERIFIED — external network unavailable here** |
| Live new-release switch / dirty-editor and offline fallback under upgrade | **NOT VERIFIED — controlled preview required** |
| **AUTH-P0 G1-D overall** | **OPEN** |

G1-A has passed; G1-B local cases passed but live negative verification is open; G1-C local lifecycle passed but final D3 policy and live expiry are open; G1-E is next. **AUTH-P0/G1 remains OPEN, P3 HOLD, draft PR #262 unmerged, production unchanged.**
