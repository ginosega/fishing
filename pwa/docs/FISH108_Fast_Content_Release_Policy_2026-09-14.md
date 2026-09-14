# FISH108 — Fast Content Release Policy

## Status

Approved by the user on 2026-09-14 and implemented as the durable Fishing Companion release policy.

The purpose is to make routine Gear / Knowledge Base / Catch authoring releases take only a few minutes while retaining the full regression suite for changes that can affect application behavior.

## Release lanes

### Fast Content Release — default for routine canonical content

A change is eligible only when **every changed repository file** is under one of these physical canonical source roots:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

Typical eligible changes include source-aware `fishing-companion-change-v2` add/edit packages, Markdown content, representative pictures, Knot sequence frames, and Catch records.

The fast lane performs:

1. normal package/source validation before repository mutation, including source revision/conflict checks, edit record hash/base-field checks, path/schema/type/reference validation, and supplied media existence/hash checks where applicable;
2. a lightweight feature PR so the exact canonical diff remains reviewable and revertible;
3. locked dependency installation with cache reuse, but no dependency audit because dependencies did not change;
4. one production build from canonical source; the build's `inventorySource` validation covers schemas, semantic references, canonical paths, Markdown/resources, media integrity/decoding, unresolved-media rules, and release content collection;
5. independent `verify.mjs` verification of the generated release manifest, file hashes, counts, paths, pending-media state, and bundled canonical content;
6. exact-current-main protection and GitHub Pages publication after merge; and
7. dependency-free HTTP verification that every hosted production file is byte-for-byte identical to the exact built release and that release/source identity matches the merged main SHA.

The fast lane deliberately does **not** run Node behavior/unit tests, Chromium/WebKit, preview-browser regression, v1 recovery/cutover fixtures, dependency audit, or hosted browser acceptance because those test application/runtime behavior that canonical content-only changes cannot modify.

Target end-to-end elapsed time for an ordinary authoring release is approximately a few minutes, subject to GitHub Actions / Pages queue and deployment latency.

### Full Application Release — required for everything else

Any change outside the three canonical content roots automatically selects the full lane. This includes, without limitation:

- `pwa/src/**` runtime/UI/service-worker code;
- `pwa/contracts/**` or schema/taxonomy changes;
- `pwa/tools/**`, `pwa/test/**`, `package*.json`, build/release logic, or dependency changes;
- migration/recovery/offline architecture changes;
- `.github/workflows/**`; and
- any mixed PR containing both canonical content and a non-content file.

The full lane retains the existing comprehensive validation: durable v1 recovery material, locked dependency audit, core tests, preview build, Chromium and WebKit preview acceptance, production-root build/verification, production-browser acceptance, real archived-v1 cutover acceptance, exact-current-main guard, Pages publication, byte-for-byte hosted verification, and hosted browser verification.

`workflow_dispatch` always selects the full lane.

## Source-derived expectations

Changing library size is normal authoring activity, not an application invariant. Tests and hosted verification must therefore derive current Gear / KB / Catch counts and path/reference state from canonical source or the exact generated release rather than require hand-maintained expected counts.

Historical counts in dated release evidence remain historical facts; they are not future test baselines.

## Routine authoring project-state policy

A routine Fast Content Release does **not** consume a `FISH-TODO-###` application task ID merely because an item/page is added or edited. It also does not require a per-item production-closeout Markdown document or edits to README / Context / TODO / Decision Log / bootstrap solely to record the new content release.

For routine content releases, the durable audit trail is:

- the supplied source-aware change package and its validation;
- the lightweight content PR and merge commit;
- the successful fast content workflow / Pages deployment; and
- its hosted byte-verification artifact.

Authoritative project-state files are updated when a release changes architecture, product behavior, durable decisions, backlog state, or during a requested project handoff/reconciliation. This avoids making routine content publication itself an administrative project milestone.

## Safety fallback

If eligibility is ambiguous, a requested package requires a non-content source change, or validation reveals an architectural/test/tooling issue, use the Full Application Release lane. Never broaden fast-lane eligibility ad hoc just to make a failing release pass.

## FISH108 transition

FISH108 itself changes workflow, tests and release tooling, so it is intentionally released through the Full Application Release lane. The next routine canonical content add/edit after FISH108 is the first intended real-world fast-lane test.
