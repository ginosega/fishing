# FISH118 P3-7 — Minimal canonical fixture and inactive exact-PR-head sandbox CI

**Date:** October 23, 2026. **Status:** Source-only design, fixture, verifier and tests on draft PR #263. **Not installed in private sandbox.** No cloud deployment, migration, live sandbox GitHub write, GitHub App permission change, sandbox pull request, merge or production release.

## Authority and restored baseline

The approved Fishing v3 requirements/design/UX/plan and AUTH-P0 owner decisions remain binding. Current P3-6 handoff and source report remain the prerequisite. The private sandbox currently has only its README on main SHA 310bc3e8cf80f9c54badc1e56ef97382ccefec87. Production main was 35e88c47d96f4d7021afa642fdee9e6616c65e83 and latest verified Pages release 131ebca9c6d46fa1c1d815ad43a318f6. P3 App installation is restricted to numeric sandbox ID 1430581407, and P3_WRITE_ENABLED=false. PR #263 and #262 stay draft.

## Prepared fixture — entirely synthetic, not live

The source-only canonical fixture under fixtures/sandbox-canonical/pwa/ contains precisely:
- Gear/gear.json: one fictional P3 Test Rod, with an explicitly synthetic p3- ID.
- KB/kb.json: one fictional P3 Test Lake location.
- KB/Locations/content/P3 Test Lake.md: an invented narrative, not fishing advice.
- Catches/catches.json: empty collection.

These four files are **not** production Fishing content and are not copied from it. The existing full canonical inventory checks the fixture with actual Ajv/semantic schema, source paths and Markdown parser. No images or Catch records are included. Do not import the owner's actual records merely to make sandbox tests pass.

## Trusted exact-head verifier

The trusted Node CLI tools/validate-sandbox-head.mjs validates a future GitHub pull_request event, not user-controlled submission fields. It requires exact GitHub repository numeric ID 1430581407 for both head/base, main base ref, valid distinct 40-character base/head SHAs, clean exact-head worktree and fixed HTTPS sandbox remote, and that the exact event base commit is an ancestor of the PR head. Changed paths must all be under pwa/Gear, pwa/KB, or pwa/Catches; workflow, executable or README changes cannot pass. All symlinks and special files under canonical content, including its root directories, are rejected; content has file-count and 64 MiB size ceilings.

The untrusted checkout is treated strictly as data. No sandbox checkout script, npm install, package manifest or workflow is executed. The actual repository-pinned Fishing canonical inventory validates the complete source with image decoding, Markdown references, schema and semantic checks. In this initial tiny private P3 sandbox, all IDs must contain p3- and there may be at most 10 Gear records, 10 KB records, and **zero Catches**, preventing accidental promotion of a full real Fishing content library. Any eventual expansion requires deliberate review.

## INACTIVE private sandbox GitHub Actions template

[templates/fishing-p3-sandbox-exact-head.example.yml](templates/fishing-p3-sandbox-exact-head.example.yml) is checked into the experimental folder of **ginosega/fishing**, not into .github/workflows of the private sandbox. It will not run there until separately installed after approval.

If approved and installed in sandbox default branch as .github/workflows/fishing-p3-sandbox-exact-head.yml, its behavior is:
1. pull_request to main only (never pull_request_target), job has only GitHub Actions contents:read rights, and no stored App key or outside secrets.
2. Read-only actions/checkout pins the sandbox source to GitHub's exact pull_request.head.sha with complete baseline history and credentials not persisted.
3. A *second* read-only checkout obtains trusted public Fishing source from immutable reviewed SHA **e75b6009f947b03568124ddf8d2c513a63c4025c**. A separate exact SHA assertion guards this source.
4. It installs lockfile dependencies **only** from the trusted public Fishing repo and invokes the trusted validator on sandbox source as data, passing GitHub-supplied event identity/base/head values only through environment variables. It does not execute scripts from the PR branch.
5. This yields a CI job named validate-sandbox-head. It is **not** a required check, merge or published hosted-release proof until actual branch protections and a fully approved publishing lifecycle exist.

Potential limitations to test at actual installation: same-repo private Actions availability, public trusted checkout from a private repository workflow, and rate limits. **Read-only provider check October 23:** GET /repos/ginosega/fishing-p3-sandbox/rulesets returned HTTP 403 with GitHub's explicit message "Upgrade to GitHub Pro or make this repository public to enable this feature." GET /branches/main/protection returned HTTP 403 "Resource not accessible by integration," so branch-protection state is not independently verified. Do not claim required private rulesets are active, suggest a silent paid-plan/visibility change, or permit automatic merge without an approved, enforceable protection alternative. Existing Github App has Contents/PR R/W but no Checks:read; this workflow alone does not change that. The separate App check-runs API permission request requires separate approval. No branch-rule bypass is permitted.

## Automated evidence

[experiments/p3/test/sandbox-canonical-ci.test.mjs](../../test/sandbox-canonical-ci.test.mjs) validates actual synthetic fixture source and simulated PR heads using real temporary Git repositories. Adversarial cases cover wrong repo IDs/base ref, swapped head SHA, outdated base, noncanonical diff paths, workflow addition, dirty source, wrong Git remote, symlink, invalid taxonomy and missing Markdown image. Additional static assertions lock down the inactive workflow's read-only credentials and trusted-validator pin. Existing P3-6 exact-SHA checkout, App JWT, D1 and guard tests remain unchanged. Hosted CI pass/fail for the **final** PR head must be verified, not inferred.

## Next approval boundary

Source-only P3-7 can be verified now. The next *live* step requires an explicit owner decision to **seed these four synthetic files in private sandbox main and install the reviewed read-only GitHub Actions workflow there**, with appropriate branch protection feasibility and a rollback/reversion plan. This would be a live **sandbox-only** repository write, distinct from activating the P3 publisher or approving the first App-created branch/draft PR. Installing/activating the fixture or workflow is **not authorized by this source-only package**. The following would still be outstanding: reviewed P3 OAuth owner-session issuer, secure Node/Worker bridge, D1 0002 deployment, side-effect/recovery policies, branch protections/checks interpretation, App Checks:read (if needed), first separately approved live PR write and first separately approved merge. Never claim Live before hosted byte/release proof.
