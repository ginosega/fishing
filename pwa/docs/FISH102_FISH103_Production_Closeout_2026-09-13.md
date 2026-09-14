# FISH102 / FISH103 Production Closeout — September 13, 2026

This record preserves the release evidence and final durable result for FISH-TODO-102 and FISH-TODO-103. Current continuation state remains in the repository-root README, Context, TODO, Decision Log and bootstrap files.

## FISH102 — Line-Tackle-Knot Reference

Status: **DONE / production-verified**.

Implementation PR: [#124](https://github.com/ginosega/fishing/pull/124)

FISH102 added:

- KB Knot record `line-tackle-knot-reference`;
- Markdown article `KB/Knots/content/Line-Tackle-Knot Reference.md`;
- representative picture `KB/Knots/assets/Line-Tackle-Knot Reference.png`;
- normal detail route `#/kb/line-tackle-knot-reference`;
- category behavior that pins **Line-Tackle-Knot Reference** first only on KB → Knots while sorting all remaining Knot cards alphabetically.

Other category/search/detail ordering was intentionally unchanged.

Validated post-FISH102 canonical counts:

- Gear: 69
- KB: 56
- Catches: 5

Verified production evidence:

- source: `4912f93149e9de1e9cde9ff5176b4a4831a67812`
- release: `beff9138c96489abd9723c5fcfeef0ff`
- production workflow: [34770966552](https://github.com/ginosega/fishing/actions/runs/34770966552)
- hosted-verification artifact: `10322381375`

FISH102 was production-verified before FISH103 began, but its root project-state Markdown reconciliation was intentionally completed together with FISH103 in the later docs-only closeout.

## FISH103 — PWA source relocation and authoring fixes

Status: **DONE / production-verified**.

Feature PR: [#125](https://github.com/ginosega/fishing/pull/125)

Verifier-only follow-ups:

- [#126](https://github.com/ginosega/fishing/pull/126) — accept the intentional dirty-editor navigation dialog before FISH103 hosted link-target checks;
- [#127](https://github.com/ginosega/fishing/pull/127) — scope/remove an earlier temporary no-dialog listener so it cannot race later intentional dialog acceptance.

PR126 and PR127 changed only hosted verification logic. They did not change application code, canonical domain data, release content or user-visible behavior.

### Durable FISH103 application/source result

1. **Physical canonical source relocation**
   - repository-root `Gear/`, `KB/` and `Catches/` were removed;
   - canonical physical source now lives at `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`;
   - logical record/source references and generated release paths remain `Gear/...`, `KB/...` and `Catches/...`;
   - build/source validation defaults to `pwa/` as the physical source root;
   - Gear/KB authoring GitHub upload links now target the physical `/pwa/...` repository folders.

2. **Link-target behavior**
   - external HTTP(S) structured Web links open in a new tab;
   - external HTTP(S) rendered Markdown links open in a new tab;
   - external new-tab links use `rel="noopener noreferrer"`;
   - internal `gear://`, `kb://`, local/anchor and other in-app links remain same-tab.

3. **Caption focus**
   - Gear/KB picture Caption typing updates only the caption preview instead of rerendering the full picture editor;
   - keyboard focus remains in the Caption field while typing.

4. **New-KB Markdown Preview**
   - a new KB record receives its provisional required `content` path before whole-library validation;
   - this removes the prior `content must NOT have fewer than 1 characters` validation failure while previewing unsaved new-KB Markdown.

5. **Production workflow source triggers**
   - obsolete root `Gear/**`, `KB/**` and `Catches/**` path triggers were removed because all canonical application/domain source is now within `pwa/**`.

FISH103 intentionally does not change FISH091 offline semantics or FISH096 Knot sequence semantics.

### Pre-merge validation evidence

Final feature head before PR125: `35c886e5160e6f9d50bbbe9347d876d4d2d9e4a6`.

Key validation runs:

- helper/source validation: [34778273668](https://github.com/ginosega/fishing/actions/runs/34778273668) — source tests, preview build/verify, focused online-first-visit gate, full Chromium regression suite and production-style build/verify passed;
- PR125 exact-head full production acceptance: [34778464201](https://github.com/ginosega/fishing/actions/runs/34778464201) — source/core, Chromium/WebKit preview acceptance, production browser acceptance and archived-v1 cutover acceptance passed.

PR125 merged initially as source `016a56f57913a7ef1045b142f15ebed24381d7ac`. Its Pages deployment succeeded, but hosted verification exposed verifier sequencing problems rather than product regressions. Those verifier-only issues were corrected in PR126 and PR127 under the same full PR/CI discipline.

### Final exact-main production evidence

Final verified source:

`94772e62788fa98903930e4b5649fabb9629c6d0`

Final release:

`b8c8222697222f1dd43861427d5006fb`

Final production workflow:

[34795289032](https://github.com/ginosega/fishing/actions/runs/34795289032)

Artifacts:

- production bundle: `10328869743`
- production acceptance evidence: `10329538071`
- Pages artifact: `10329392228`
- actual hosted production verification: `10329313590`

Hosted verification reported:

- hosted v2 files: **327**
- release ID: `b8c8222697222f1dd43861427d5006fb`
- source revision: `94772e62788fa98903930e4b5649fabb9629c6d0`
- production online-only default / explicit complete-library preparation / offline reload / navigation / counts / pinned Knot ordering / image viewer / absent-picture handling / no release diagnostics: passed;
- exact icon bytes, manifest, KB/Catch wording, search, Catch date layout, prefixed valid JSON and post-copy Exit behavior: passed;
- FISH096 hosted Add-Knot sequence selection, local sequence preview, ordered package metadata and exact per-Knot GitHub upload link: passed;
- FISH103 physical PWA source folders, external-link new-tab behavior, internal-link same-tab behavior, stable Caption focus and new-KB Markdown Preview: passed.

The exact-current-main guard passed before Pages deployment. Pages reported deployment success for source `94772e62788fa98903930e4b5649fabb9629c6d0`, and the hosted verifier compared all **327** deployed files against the exact production bundle before browser acceptance.

## Deferred phase terminology

The future phase historically identified as `FISH-TODO-077/P2` is now preferably called **Fishing Companion v3**. The historical identifier remains valid where useful for traceability.

Fishing Companion v3 remains **DEFERRED** and includes future direct-connected authoring expansion such as:

- authentication;
- direct GitHub save/upload;
- integrated uploads;
- offline authoring, outbox and sync;
- Catch authoring;
- multi-user generalization.

None of those capabilities are implied by FISH102 or FISH103.

## Continuation

FISH071–076 and FISH078–103 are complete. Fishing Companion v3 (`FISH-TODO-077/P2`) remains deferred. The next unused canonical application task ID after this closeout is **FISH-TODO-104**, unless a newer task has already been allocated on actual current `main`.