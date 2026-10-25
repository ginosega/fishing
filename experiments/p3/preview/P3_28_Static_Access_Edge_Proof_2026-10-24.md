# FISH118 P3-28 — Staged live Access edge proof for inert ingress

**October 24, 2026 — READ-ONLY TEST HARNESS INSTALLED; LIVE EDGE TEST NOT YET PERFORMED.** User asked to continue from a Cloudflare dashboard screenshot verifying `fishing-p3-access-ingress-sandbox` has *Production URL disabled*, *Preview URL disabled*, no custom domains/routes and no connected bindings. The separate Access service-auth application and token passed independent [metadata verification #40162761115](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/40162761115). No deploy/route changes, D1 writes, command acceptance, App PR creation, publishing or production modifications are authorized.

## Current static ingress scope

Dedicated Cloudflare Worker: `fishing-p3-access-ingress-sandbox`, Cloudflare Hello World starter only, with no service bindings, D1, secrets, custom domains or routes. The production hostname is `fishing-p3-access-ingress-sandbox.ginosega.workers.dev`. Both worker URL switches stay disabled until the user explicitly begins the supervised edge test. The original `fishing-p3-command-bridge-sandbox` remains *separate, hard-disabled and unrouted*.

## Read-only test implementation

Private sandbox [PR #12](https://github.com/ginosega/fishing-p3-sandbox/pull/12) passed exact-head infrastructure CI, **44 of 44 Python tests**, and squash-merged to private sandbox main `b70932e6b4994ed979b30af7ed865bdb8306e4ff`. It installs:
- `scripts/p3_access_edge_probe.py`: no Cloudflare mutations; before network, revalidates exact account Access application name/domain/AUD, dedicated enabled token and unique Service Auth policy through existing Cloudflare GET metadata, checks GitHub Actions Client ID belongs to approved token; then only HTTP GET requests to **fixed HTTPS inert ingress URL** with redirects disabled and response bodies never logged.
- `tests/test_p3_access_edge_probe.py`: adversarial tests including no-credential requests returning 200, redirects, unavailable URL, wrong service token, non-Hello-World content, wrong confirmation, and preventing a secret-bearing request after public access is detected.
- `.github/workflows/fishing-p3-access-edge-readonly.yml`: **owner-manual-only** GitHub Actions workflow `Fishing P3 inert ingress Access edge check (manual)`. Checks exact main repository and confirmation `PROBE-STATIC-P3-INGRESS-ONLY`, and uses only existing private GitHub secrets `P3_ACCESS_READ_TOKEN`, `P3_ACCESS_CLIENT_ID`, `P3_ACCESS_CLIENT_SECRET` plus existing account ID. Does not receive Cloudflare Worker/D1 edit credentials. No deployment step, no schedule, no status writes, and no automatic retry.

## Controlled operator procedure

1. Confirm the ingress Worker still runs only Cloudflare's default inert Hello World content and has **no bindings**. The command Worker must remain isolated/disabled. Confirm exact Access application still exists with its sole Service Auth policy; preflight also rechecks this at runtime.
2. In Cloudflare Workers & Pages → `fishing-p3-access-ingress-sandbox` → **Domains**, temporarily enable only **Production URL** for `fishing-p3-access-ingress-sandbox.ginosega.workers.dev`. Keep Preview URL disabled and do not add a route/domain/binding. The target may briefly be routable if Access is not enforced; that's why the Worker must contain harmless Hello World only.
3. In the private sandbox GitHub Actions [inert ingress Access edge workflow](https://github.com/ginosega/fishing-p3-sandbox/actions/workflows/fishing-p3-access-edge-readonly.yml), choose branch `main`, mode `edge-probe`, confirmation exactly **`PROBE-STATIC-P3-INGRESS-ONLY`**, and manually run ONCE.
4. Read sanitized logs: PASS for Access metadata; PASS unauthenticated GET denied with 401/403; PASS invalid service token denied with 401/403; PASS approved service token reaches static Hello World with HTTP 200; no D1 or Worker mutation. If ANY check fails, do not rerun automatically and treat security as unproven.
5. **IMMEDIATELY disable Production URL again**, even after a passing test or if the GitHub Actions job fails. Verify both Production and Preview toggles OFF. Do not leave even a harmless endpoint live until a separately reviewed next phase. Owner reports result and restored disabled URLs; assistant inspects the actual workflow logs.

**Access result interpretation:** Metadata preflight (already passed) verifies policy configuration but not edge enforcement. A successful edge probe verifies effective Access on the exact protected hostname and the intended dedicated service-token behavior while the Worker is inert. It does not certify Cloudflare JWKS injection, the source-only ingress module, any live HMAC message, a private service binding, remote D1 atomicity, or application publishing.

**No authority for activation:** The proof is not permission to deploy the P3-26 Access ingress source, turn on `P3_WRITE_ENABLED`, connect the command Worker or start PR generation. Each requires a new scoped security review and explicit separate approval.
