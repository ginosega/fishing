# FISH118 P3-7 — Minimal canonical fixture and inactive exact-PR-head sandbox CI

**Date:** October 23, 2026. **Status:** Source-only design, fixture, verifier and tests on draft PR #263. **Not installed in private sandbox.** No cloud deployment, migration, live sandbox GitHub write, GitHub App permission change, sandbox pull request, merge or production release.


## Post-approval real private-sandbox PR CI smoke test — passed October 23, 2026

After a further owner instruction to proceed, the repository protection limitations were reconfirmed. The private sandbox `main` branch API reports `protected:false` and `required_status_checks.enforcement_level:off`. The private-repo rulesets endpoint reports **HTTP 403** requiring an eligible plan or public visibility, consistent with [GitHub's protected branch documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches). No plan, visibility, permissions, protections, or automatic-merge settings were changed. This prevents treating CI success as an enforced pre-merge gate. It does **not** prevent running a strictly read-only synthetic test PR, provided no merge is attempted.

The owner-authorized GitHub connector created branch `experiment/p3-7-ci-smoke` from fixture main SHA `e37db3b18bd9948bf4453d7f885f868e830a9a9a` and committed a **single purely synthetic Gear label change**, `P3 Test Rod` → `P3 Test Rod - CI Smoke Test`, under `pwa/Gear/gear.json`. The resulting head SHA is `7e39c018081e9677b33c3bcab7ebe80b44d924f8`; GitHub compare reports one commit, one changed file (one line changed). Opened **[private-sandbox draft PR #1](https://github.com/ginosega/fishing-p3-sandbox/pull/1)**, prominently marked **DO NOT MERGE**. This was a connector/owner action, **not** a GitHub App publisher write or publishing-service test.

**Confirmed actual private GitHub Actions run [#39976510965](https://github.com/ginosega/fishing-p3-sandbox/actions/runs/39976510965): SUCCESS**, with job `validate-sandbox-head` completed successfully at exact PR head. Runner logs verify both Git checkout SHAs, locked trusted Node validator dependencies, exact GitHub event head/base/repo assertions, canonical allowed diff and full inventory. Trusted validator returned:

```json
{"repositoryId":1430581407,"headSha":"7e39c018081e9677b33c3bcab7ebe80b44d924f8","baseSha":"e37db3b18bd9948bf4453d7f885f868e830a9a9a","changedFiles":1,"files":4,"bytes":608,"gear":1,"kb":1,"catches":0}
```

This proves the sandbox workflow is **registered and triggerable**, and the trusted exact-head validator succeeds against a real private sandbox PR. It does not prove a privileged GitHub App token can read private status checks, produce a PR, or merge. PR #1 is intentionally open/draft/unmerged, and the canonical sandbox `main` remains at fixture SHA `e37db3b18bd9948bf4453d7f885f868e830a9a9a`. Production is unaffected.

**Gate still closed:** No automatic merge while private branch status checks and PR requirements cannot be enforced, and no first publisher-generated branch or PR without its distinct approval. GitHub Pro/Team (or other eligible account arrangements) could enable branch protections for a private repository, but any plan/payment or repository-visibility change requires the owner's specific approval. No bypass via a direct `main` push or non-PR publishing path is approved.

---

## Post-approval sandbox installation — completed October 23, 2026

The owner subsequently **explicitly approved** adding the four synthetic canonical files to the separate private sandbox and installing the previously reviewed, read-only GitHub Actions workflow there. This approval does **not** include creating a sandbox publication PR, merging anything, new GitHub App permissions, provisioning a Node runner, changing Cloudflare Worker configuration, applying D1 migration 0002, or production changes. Earlier “not installed” and “next approval boundary” language below describes the pre-approval source-only checkpoint and is now historical for this specific fixture/workflow installation.

Using the connected owner-authorized GitHub repository interface, one non-force, expected-head-guarded commit was written directly to **`ginosega/fishing-p3-sandbox` `main`**:

- Previous HEAD: `310bc3e8cf80f9c54badc1e56ef97382ccefec87`
- New HEAD: **[`e37db3b18bd9948bf4453d7f885f868e830a9a9a`](https://github.com/ginosega/fishing-p3-sandbox/commit/e37db3b18bd9948bf4453d7f885f868e830a9a9a)**
- Added: `pwa/Gear/gear.json`, `pwa/KB/kb.json`, `pwa/KB/Locations/content/P3 Test Lake.md`, `pwa/Catches/catches.json`, and `.github/workflows/fishing-p3-sandbox-exact-head.yml`.
- The existing `README.md` remained unchanged. GitHub's compare API independently verified **exactly five added files**, one commit ahead and zero behind; the main ref and exact fixture Git blob IDs were read back independently. No sandbox PR was created.
- The workflow file was verified in the sandbox default branch with `pull_request` trigger, `contents: read`, two `persist-credentials: false` checkouts, fixed trusted validator SHA `e75b6009f947b03568124ddf8d2c513a63c4025c`, and no publishing/deploy/merge route. The obsolete template-only header was replaced with a factual sandbox-only comment; workflow behavior otherwise matches the reviewed template.

**Verification limit:** No sandbox `pull_request` event has occurred since this workflow was installed, so there is **no real private-sandbox exact-head CI execution or successful check yet**. The available GitHub connector can verify workflow contents in the default branch but does not allow the GitHub Actions workflow-list endpoint; workflow registration or runtime execution is therefore not independently proven. P3 source/test CI in `ginosega/fishing` had passed 73/73 PWA, 43/43 broker/fixture/exact-head and 61/61 preview/security on [run #39973980866](https://github.com/ginosega/fishing/actions/runs/39973980866), which is **not** a live private sandbox PR check.

**Remaining gates:** The private sandbox's rulesets API returned a documented plan-related HTTP 403; branch protection is not verified, and automatic merge stays disabled. The dedicated publisher GitHub App and Cloudflare P3 Worker were not used in this installation. The P3 Worker remains at its last owner-confirmed `P3_WRITE_ENABLED=false`; no new remote configuration inspection is claimed. Any App-created sandbox branch/draft PR or sandbox merge requires its separate explicit approval and appropriate safeguards. Production `ginosega/fishing` `main` and AUTH-P0 Worker remain untouched.

---

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
