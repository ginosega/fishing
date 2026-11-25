# D6 production service entry — source-only integration review

**Status (2026-11-10): PROPOSED, NOT DEPLOYED OR OWNER-APPROVED FOR LIVE ACTIVATION.**
Tracking: [D6 issue #377](https://github.com/ginosega/fishing/issues/377). This review accompanies the *draft* stacked production Worker entry PR built on #408. It is **not** a second governance authority, an installed Cloudflare service, a provider receipt, or authorization to cut over the public PWA.

## Existing verified layers and what this PR adds

| Layer | Evidence boundary | Included or changed here |
| --- | --- | --- |
| Current public V2, `main` | Existing `ginosega.github.io/fishing/` deploy; no V3 public cutover | Untouched. No main merge. |
| D6 static Stage A [#395](https://github.com/ginosega/fishing/pull/395) | Owner-reported immutable Pages/Worker byte and Windows/Android read-only PASS [#377](https://github.com/ginosega/fishing/issues/377) | Preserved separately, not repointed. |
| D6 production owner session, same-origin read, App JWT, OAuth PKCE, read gateway | Draft stacked PRs #399–#407 have exact-head source CI, **not** production provider/field proof | Reused by composition, not copied from D2/D3 sandbox. |
| D6 environment binding contract [#408](https://github.com/ginosega/fishing/pull/408) | Full exact-head CI PASS [#42836603202](https://github.com/ginosega/fishing/actions/runs/42836603202); no live configuration | Imported unchanged. |
| This candidate | New disabled Worker source, example configuration and negative tests; CI must be verified on exact head | Adds one **extra** `D6_WORKER_ENTRY_ENABLED` server-only string gate and a deployable handler shape, no actual service. |

No D2/D3 sandbox GitHub App authority, sandbox repository ID, private Worker environment or provisioning credentials are repurposed. The clean public V3 production-root build/source-port reconciliation and canonical writer are still separate work; no prototype #263 wholesale merge.

## User-facing origin decision — not yet granted

**Preferred option for review: a single Worker-facing V3 origin**, `https://fishing.ginosega.workers.dev/fishing/`, serving allowlisted public bytes fetched from GitHub Pages on the same Worker origin as `/session`, `/auth/start`, `/auth/callback` and eventual authenticated owner-only authoring routes. This meets SEC-002's single origin and preserves Pages as the static release storage/origin. The `workers.dev` address and availability must be verified with Cloudflare before actual activation. It would be a **new user-facing PWA origin** relative to existing `https://ginosega.github.io/fishing/`: browser local storage, installed shortcut/service worker, offline library and bookmarks do **not** migrate automatically. Per ARC-007, an owner-instructed one-time V3 install/reprepare is acceptable, but device drafts must not be silently deleted.

Alternative: an owner-approved custom hostname mapped to the same Worker would also satisfy same-origin, but requires domain/DNS coordination and separate approval. Retaining the public `github.io` URL while putting login/API on a different `workers.dev` origin fails the approved simple same-origin model: a Worker cannot attach to GitHub's `github.io` hostname. Do **not** adopt cross-origin browser tokens, a second auth layer or wholesale Pages replacement as a shortcut. **Owner decision required before binding a public route.**

## Unrouted source candidate and safety gate

- Entry: `src/d6-production-disabled-worker.mjs`, supports Cloudflare's `fetch(request, env)` shape.
- Review-only config: `d6-production-disabled.example.toml`, *not* an active `wrangler.toml` or deployment workflow. `workers_dev=false`, `routes=[]`, all toggles explicitly `false`, no D1 binding, OAuth client secret, App PEM, GitHub installation or issuer credentials.
- The new `D6_WORKER_ENTRY_ENABLED` must be exact string `true` **and** the #408 runtime's independent global production/owner/repository/origin gates must pass. Static, session, OAuth, App READ, preflight and source each require separate exact-string enables.
- Unknown origin, cross-origin Origin headers, disabled features and writer/media paths remain denied. No new write, scheduled task or message queue routes.
- The example config is deliberately **unreachable**, including when manually copied without changes. Do not run `wrangler deploy` or install/rotate production secrets until separately approved.
- Required evidence: exact-head full application/Chromium/WebKit CI, `fishing-merge-ready`, disabled/default route tests, no deploy, then separately reviewed private provider staging and owner device acceptance. A passing CI result alone never proves a Worker is live.

## Bounded path from here to public V3

1. Finish this draft source/CI gate. Independently check exact PR head, every mandatory job and that deploy was skipped. Never merge the stacked D6 drafts directly to public `main`.
2. Resolve the **public origin choice** with the owner. Reconcile a clean production-root V3 build with today's canonical main Gear/KB/Catches IDs and media (source port, not the entire #263 prototype), keeping GitHub authoritative and `/fishing/` SW scope coherent.
3. In a separate owner-approved private deployment phase, stage the disabled Worker on a distinct nonproduction address, authorize only the minimum dedicated OAuth/GitHub App read identity and D1 binding, prove real owner session/selected-source read and anonymous isolation; do not enable writes.
4. Build/validate a canonical-main writer with owner CSRF, path/ID/media allowlists, exact expected source SHA and conflict detection, operation receipts and unknown-result recovery; only exact-current-branch CI+public hosted byte/source identity establishes **Live**. No automatic overwrite or blind retries; target ordinary Save-to-Live <=60 seconds.
5. Complete [Connection Status #396](https://github.com/ginosega/fishing/issues/396), preserve [draft durability #342](https://github.com/ginosega/fishing/issues/342), run isolated immutable hosting and Windows/Android V3 tests, then present the explicit credential/privilege/cutover authorization package.
6. Upon **separate explicit cutover approval**, coordinate the guarded main deployment (main push auto-deploys Pages), public gateway route and a simple fail-closed incident plan. V2 uptime and full rollback rehearsals are waived under ARC-007, not source integrity, publishing proof or live-owner acceptance.

**No live provider state, new public URL, installed GitHub App, secret, D1 binding, write route or public V3 release is asserted here.**
