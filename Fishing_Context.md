# Fishing Context

## Current authoritative state — September 15, 2026

`ginosega/fishing` is the durable source of truth. Restore actual current `main` and current open-PR state before implementation/release/repository-write work; do not rely on a previously observed commit as though it is still current.

The September 14–15 work materially improved the Knowledge Base editorial structure without changing application architecture. That content organization is now durable project context and should be preserved unless the user explicitly changes it.

## Current KB editorial architecture

### Behavior / Habitat vs Techniques

For both bass and trout, the two broad references have intentionally different purposes:

- **Bass Behavior and Habitat** / **Trout Behavior and Habitat**: where fish are likely to be and why. These pages own enduring location drivers such as habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth, waterbody type, and pattern recognition.
- **Bass Fishing Techniques** / **Trout Fishing Techniques**: how to catch fish once they are located. These pages own presentation choice, lure/bait/rig selection, retrieve and cadence, depth control, strike handling, bank/kayak execution, and broad species-specific tactics.

Do not duplicate full seasonal playbooks across those pages. A brief seasonal routing summary is appropriate, but detailed seasonal location + presentation strategy belongs in the seasonal pages below.

### Four-season fishing references

The old bass-only **Spring Bass Fishing** and **Fall Bass Fishing** pages were replaced by four comprehensive Technique pages covering **both bass and trout**:

- **Spring Fishing**
- **Summer Fishing**
- **Fall Fishing**
- **Winter Fishing**

These are the authoritative seasonal playbooks. They combine how fish location changes through the season with how presentation strategy should change. Where useful, use early/mid/late-season or transition-period structure rather than forcing all of a season into one pattern.

The Behavior/Habitat pages were deliberately trimmed when these four pages were created so they remain focused on enduring principles.

### Topwater reference

**Topwater Fishing** is now a full KB/Techniques reference, not a placeholder. It owns broad surface-fishing decision guidance: when/where topwater works, seasonal and environmental conditions, surface clues, wind/light, cover/structure, lure-family selection, tackle/line, retrieves, hook-set timing, missed-strike follow-up, and bank/kayak execution.

The narrower supporting Gear Guides remain complementary rather than redundant:

- Frog
- Popper
- Whopper Plopper
- Walking Bait
- Buzzbait

Bass Fishing Techniques includes topwater as one major presentation category and now includes a Whopper Plopper subsection, but Topwater Fishing is the deeper specialized reference.

### Cross-linking standard

A curated sitewide cross-link pass was completed with the Topwater release. Related species, seasonal, location, tackle, and topwater Gear Guide pages now link into the broader KB/Techniques references where that improves navigation.

Continue this standard: add internal links when the reader would reasonably benefit from the broader reference. Do **not** mechanically link every occurrence of words such as “bass,” “trout,” “spring,” or “topwater.”

### Retired/replaced live content

Do not reintroduce these as live canonical Technique pages unless explicitly requested:

- Bass Fishing
- Spring Bass Fishing
- Fall Bass Fishing
- Bass Power and Search Overview
- Color and Scent
- Paddle-only Kayak Strategy
- Seasonal Bass Guidance
- Water Visibility

Historical migration or release evidence may still mention retired IDs/pages. Historical evidence is not a live-link requirement and should not be rewritten merely to erase history.

## FISH108 release model

FISH108 changes the Fishing Companion release process from one heavyweight path to two explicit lanes. The approved durable policy is [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

### Fast Content Release

Use this by default when **every changed file** is canonical content under `pwa/Gear/`, `pwa/KB/`, or `pwa/Catches/`. This includes normal source-aware Gear/KB add/edit packages, Markdown, pictures, Knot sequence frames, and Catch records.

Fast safeguards:

- restore actual current `main` / open-PR state before writing;
- validate package source revision/ancestry, record hash/base fields for edits, conflict state, IDs/schema/types/paths/references, notes/media actions, and supplied media metadata as applicable;
- apply only requested canonical changes and preserve unrelated/newer source/user bytes;
- normalize accidental trailing whitespace unless the user explicitly requests preservation;
- use one lightweight content PR;
- install locked dependencies with cache reuse, but do not run `npm audit` when dependencies did not change;
- build production once from canonical source; `inventorySource` validates schemas, semantic references, canonical paths, Markdown/resources, media decoding/integrity and unresolved-media rules;
- run `verify.mjs` against the exact generated release;
- merge only after fast validation passes;
- deploy only from exact current `main`; and
- verify hosted production byte-for-byte against the exact release, including release/source identity.

Fast Content Releases do **not** run Node application behavior tests, Chromium/WebKit, preview-browser acceptance, archived-v1/cutover acceptance, dependency audit, or hosted browser acceptance unless a genuine non-content issue is discovered.

### Full Application Release

Any changed file outside the three canonical content roots forces the full lane. Mixed content+code changes also force full. Runtime/UI/service worker, schema/contracts, test/build/tooling, dependency, workflow, migration/recovery/offline, and other non-content changes retain the comprehensive full suite. Manual `workflow_dispatch` is full.

If eligibility is ambiguous, use full rather than broadening fast eligibility ad hoc.

### FISH109 — release retry hardening

FISH109 is complete and production-verified. Pages and hosted-evidence artifacts are run-attempt-specific, allowing deployment-job reruns without duplicate-artifact collisions. The dependency-free fast hosted verifier uses bounded retry/backoff for transient network/propagation responses. The exact-current-main guard remains mandatory.

### FISH110 — release-aware Copy Changes handoff

FISH110 is complete and production-verified. Shared Gear/KB authoring uses one centralized Copy Changes prompt helper. The handoff tells the receiving chat to restore current `main` and project instructions, validate the source-aware package against current canonical content, preserve unrelated/newer changes, and apply only requested changes.

Eligible content-only packages explicitly route through one Fast Content Release PR, lightweight validation/build, merge, production deployment, and hosted byte/release-identity verification. Do not run Full Application Release or create/update project-state records unless validation shows they are required. Non-fast changes use the repository's current appropriate lane.

Regression coverage rejects the obsolete pre-FISH108 `one feature PR` / `then reconcile project records` boilerplate and preserves the blank-line boundary between human instructions and JSON.

### Source-derived library state

Gear/KB/Catch counts, canonical-path totals and reference totals are mutable content state, not application invariants. Derive them from canonical source and the exact generated release. Do not edit tests merely because the library grew.

A routine Fast Content Release does **not** consume a `FISH-TODO-###` application/architecture ID and does not require a dedicated production-closeout file or edits to README/Context/TODO/Decision/bootstrap solely to record that publication.

Update authoritative project-state files for architecture/product-behavior/durable-decision/backlog changes, or during a requested handoff/reconciliation.

For exact current production source/release identity, inspect the latest successful `main` production workflow and deployed `release.json`; narrative checkpoints become historical when `main` advances.

## Authoring rules and constraints

- Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**, producing `fishing-companion-change-v2`. Preparing/copying is not saving; the browser does not write repository source directly.
- GitHub upload links target physical `/pwa/...` folders; package paths remain logical `Gear/...` / `KB/...` / `Catches/...`.
- Simple Markdown-only narrative changes to existing canonical files may be made directly in GitHub.
- Structured fields/categories/types/specifications/links/picture metadata or sequences/paths/relationships should use Fishing Companion Edit or an equivalent source-aware workflow.
- Normalize accidental trailing spaces in package strings and text lines unless explicitly asked to preserve them.
- KB `description` is schema-limited to **80 characters**; validate length before opening a release PR.
- Preserve concurrent user uploads and unrelated source bytes. If `main` advances during work, reconcile the new commit before merge.

## Operating mode

This project uses **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research/calculation, creates artifacts or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain explicit approval first, then return to Chat afterward.

## New-chat transfer protocol

When the user says **“It’s time to transfer to a new chat”** or clearly states that the current chat is getting too long and should be transferred, ask the user to confirm that they want the full project handoff prepared.

Once confirmed, complete the handoff without repeated “Proceed” prompts: restore current `main`, open PRs and latest production evidence; reconcile work completed in the chat; update authoritative records where durable state changed; preserve unresolved work and purchase uncertainty; cross-check state files/bootstrap; and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

## Durable repository and product architecture

Canonical physical domain data lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. The active implementation/contracts/build/tests and release documentation live under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

Fishing Companion retains independent Gear, Knowledge Base and Catch domains. KB types are Location, Species, Equipment/Gear Guide, Technique and Knot. Paths are explicit record properties. Existing IDs remain stable unless explicitly retired/replaced. Retired trips/sessions/planner/paired-setup structures are not reintroduced without explicit approval.

## Durable behavior retained

- **FISH091:** normal online use does not provision the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes a verified complete generation; failed/corrupt/quota-failed refreshes preserve the prior verified generation.
- **FISH096:** Knot-only explicit ordered `pictureSequence`; physical frames under `pwa/KB/Knots/assets/<id>/`, logical paths under `KB/Knots/assets/<id>/`; explicit array defines order and requires at least two frames; `picture.src` equals the final/representative frame; cards/detail load only the representative frame; the sequence viewer retains the approved controls/keyboard/zoom behavior with no autoplay on open; Add/replace uses complete multi-file selection; converting a static picture into a sequence never silently reuses the old static picture; replacing references does not delete old source files; complete offline preparation includes every explicitly referenced frame. Directory contents alone never create a sequence.
- **FISH102:** Line-Tackle-Knot Reference is pinned first only on KB → Knots; remaining Knot cards stay alphabetical.
- **FISH103:** canonical physical source stays under `pwa/`; authoring upload links use physical `/pwa/...`; external HTTP(S) links open a new tab with `noopener noreferrer`; internal app/local links remain same-tab; Caption editing retains focus; new-KB Markdown Preview assigns a provisional required content path before whole-library validation.
- **FISH107:** Skylety Fishing Hook Sharpener is type `Tools`; FISH106's earlier `Kayaks` value is historical evidence only.
- **FISH110:** Copy Changes uses centralized release-aware FISH108 boilerplate and preserves the parseable blank-line JSON boundary.
- **FISH111:** shared page alignment uses one horizontal content grid: the site-header brand/connection control and main page content share the same left/right insets, and long-form Notes/Markdown sections expand through the full main content width. Mobile preserves the same rule with its 16 px content inset.

Active Knot sequences remain Palomar, Albright, Arbor, Bowline, FG, Improved Clinch, Modified Uni and Trilene; Non-Slip Loop remains static. Directory contents never create a sequence without explicit canonical references.

## Backlog and future phase

`FISH-TODO-005` remains **WAITING ON USER**; FISH104 does not explicitly confirm every fish-finder power component as installed.

`FISH-TODO-014` remains **OPEN**; FISH105 did not explicitly identify the HyperSeal 3600 as the historical deep-box watch target.

The existing rig/content backlog remains open, including Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons pages; the recent broad Technique redesign does not silently close those items.

**Fishing Companion v3** (historically `FISH-TODO-077/P2`) remains **DEFERRED**. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production.

FISH071–076 and FISH078–111 are complete/implemented. The next unused **application/architecture** task ID is **FISH-TODO-112**. Routine Fast Content Releases do not consume it.
