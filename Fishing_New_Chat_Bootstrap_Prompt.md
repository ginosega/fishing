You are continuing my persistent **Fishing** project. The durable repository is `ginosega/fishing` on GitHub. Restore current state from actual latest `main` before acting; do not rely on an old chat or assume a previously observed commit/release is still current.

## Operating mode

Use Chat mode by default and permanently. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, requires research/calculations, creates artifacts, or involves substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain my approval first, then return to Chat.

## First actions

Read these files from actual latest `main`, in order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

Before repository work, also confirm current open-PR state. Newer repository/production evidence controls over stale chat descriptions. When an exact current production SHA/release ID/count is needed, inspect the latest successful `main` production workflow and deployed `release.json`; do not treat an older value copied into Markdown as current.

## Handoff checkpoint — September 15, 2026

At the handoff that produced this prompt, the project was clean after the Topwater/cross-link release: no open PRs, the latest merged `main` content had passed Fast Content validation, Pages deployment and hosted byte/release-identity verification. Treat that as a historical checkpoint only; immediately re-read actual current `main` and current workflow state because newer work may have landed.

The important durable change from the just-finished work is the **KB editorial architecture** below.

## Current KB editorial architecture — critical

The major broad fishing-reference pages have intentionally different purposes.

### Behavior and Habitat

- **Bass Behavior and Habitat**
- **Trout Behavior and Habitat**

These answer **where the fish are and why**. They own enduring location drivers: habitat, structure/cover, temperature, dissolved oxygen, forage, light, wind/current, depth, waterbody type and repeatable-pattern logic.

### Fishing Techniques

- **Bass Fishing Techniques**
- **Trout Fishing Techniques**

These answer **how to catch fish once located**. They own presentation choice, lure/bait/rig selection, retrieves/cadence, depth control, strike handling, bank/kayak execution and broad species-specific tactics.

Do not rebuild long seasonal mini-guides inside the Behavior/Habitat or broad Techniques pages. Brief routing/context is fine; detailed seasonal strategy belongs in the seasonal pages.

### Seasonal playbooks

The authoritative seasonal pages are:

- **Spring Fishing**
- **Summer Fishing**
- **Fall Fishing**
- **Winter Fishing**

Each covers **both bass and trout** and combines seasonal location changes with seasonal presentation strategy. These replaced the old bass-only Spring Bass Fishing and Fall Bass Fishing pages.

### Topwater

**Topwater Fishing** is a full specialized KB/Techniques reference covering broad surface-fishing strategy, lure-family selection, conditions, cover/structure, wind/light, retrieves, tackle/line, hook-set timing, missed-strike follow-up and bank/kayak execution.

Narrower companion Gear Guides remain focused pages rather than duplicates:

- Frog
- Popper
- Whopper Plopper
- Walking Bait
- Buzzbait

Bass Fishing Techniques includes topwater as a major presentation family and has a Whopper Plopper subsection, but Topwater Fishing is the deeper specialized reference.

### Linking standard

A curated sitewide Technique-link pass was completed. Species, seasonal, local-water, tackle and topwater Gear Guide pages link into the broad Technique references where useful.

Continue that standard: add `kb://` links where they materially help the reader, but do not mechanically link every occurrence of “bass,” “trout,” “spring,” “topwater,” etc.

### Retired live Technique pages

Do not reintroduce these unless explicitly requested:

- Bass Fishing
- Spring Bass Fishing
- Fall Bass Fishing
- Bass Power and Search Overview
- Color and Scent
- Paddle-only Kayak Strategy
- Seasonal Bass Guidance
- Water Visibility

Historical migration/release evidence may still mention retired IDs/pages. Preserve historical evidence rather than rewriting it merely to remove old names.

## FISH108 release policy — critical

Fishing Companion has two release lanes. The durable policy is `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release — default for routine authoring

Use Fast Content Release only when **every changed file** is canonical content under one or more of:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

This is the normal path for source-aware `fishing-companion-change-v2` Gear/KB add/edit packages, Markdown, pictures, Knot sequence frames and Catch records.

Before mutation, restore actual current source and validate the package: source revision/ancestry as appropriate, record hash/base fields for edits, conflict state, IDs/schema/types/paths/references, notes/media actions, and supplied media existence/hash where applicable. Apply only requested changes and preserve unrelated source/user bytes.

Normalize accidental trailing whitespace before mutation unless the user explicitly instructs that it be preserved.

Then use one lightweight content PR. The workflow performs locked cached dependency installation, one canonical production build/source inventory validation, exact generated-release verification, merge-to-main deployment with exact-current-main protection, and dependency-free byte-for-byte hosted/release-identity verification.

For a content-only release, do **not** manually escalate to Node behavior tests, Chromium/WebKit, preview-browser testing, archived-v1/cutover testing, dependency audit or hosted browser acceptance unless validation reveals a real non-content issue.

A routine Fast Content Release:

- does **not** consume a `FISH-TODO-###` application/architecture ID;
- does **not** require per-item README/Context/TODO/Decision Log/bootstrap updates;
- does **not** require a per-item production-closeout Markdown document; and
- is complete when the requested canonical diff is merged, the fast production workflow succeeds, and hosted byte/release identity verification passes.

Its durable audit trail is the package/validation, content PR/merge, workflow run and hosted verification artifact.

### Full Application Release

Use the full lane whenever **any** changed file is outside the three canonical content roots. Mixed content+code is full. Runtime/UI/service-worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture or other application changes use the comprehensive full CI/browser/v1-cutover/deploy/hosted-browser suite. Manual workflow dispatch is full.

If lane eligibility is ambiguous, use full. Do not broaden fast eligibility ad hoc.

### FISH109 retry hardening

FISH109 is complete and production-verified. Pages and hosted-evidence artifacts are run-attempt-specific, so deployment-job reruns do not collide with artifacts from earlier attempts. The fast hosted verifier uses bounded retries/backoff for transient propagation/network failures. Preserve the exact-current-main guard: if `main` advances, do not force an older run to deploy.

### FISH110 Copy Changes handoff

FISH110 is complete and production-verified. Gear/KB Add/Edit → **Copy Changes** uses one centralized release-aware prompt. The copied instruction tells the receiving chat to restore current `main` and project instructions, validate the source-aware package against current canonical content, preserve unrelated/newer source changes, and apply only the requested changes.

If the package is eligible for FISH108 Fast Content Release, follow the copied instruction literally: use one content PR, lightweight content validation/build, merge, production deployment, and hosted byte/release-identity verification. Do **not** run Full Application Release or create/update project-state records unless validation shows they are actually required. If the requested package is not fast-lane eligible, follow the repository's current instructions for the appropriate release lane.

The human instruction and JSON package are separated by a blank line so the JSON remains directly parseable. Regression coverage rejects the obsolete pre-FISH108 `one feature PR` / `then reconcile project records` boilerplate.

### Source-derived expectations

Changing Gear/KB/Catch item counts, canonical path totals and reference totals is normal content evolution. Do not edit tests solely to update these numbers. Validation derives current state from canonical source and the exact generated release. Historical counts in dated records remain historical evidence only.

## Authoring constraints and source preservation

- KB `description` values have a schema maximum of **80 characters**. Check length before PR/CI.
- Preserve unrelated concurrent changes and user-uploaded bytes. If `main` advances while work is underway, reconcile the newer commit before merge.
- If a package supplies image byte counts/SHA-256, validate those exact bytes when tool access permits; if binary streaming is unavailable pre-merge, use canonical build/media validation and verify exact production artifact bytes before declaring success.
- Existing IDs remain stable unless a page is intentionally retired/replaced.
- Simple Markdown-only narrative edits may be made directly in GitHub; structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships should use Fishing Companion Edit or an equivalent source-aware workflow.

## Chat-transfer convention

For this project, **“It’s time to transfer to a new chat”** is the standard transfer cue. If I say that (or clearly say the current chat is getting too long and should be transferred), ask me to confirm that I want the **full project handoff** prepared.

After confirmation, execute it end-to-end without repeated “Proceed” prompts:

- restore actual latest `main`, open PRs and current production evidence;
- reconcile work completed in the chat;
- update README/Context/TODO/Decision Log/bootstrap and any other genuinely affected durable records;
- do not manufacture per-content-release documentation merely for handoff completeness;
- preserve unresolved work and purchase uncertainty;
- cross-check the authoritative files; and
- finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

This is a project convention, not an automatic ChatGPT feature. A user-requested lighter transfer overrides it.

## Current durable architecture/behavior

`ginosega/fishing` is authoritative. Canonical physical data is under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical paths remain `Gear/...`, `KB/...` and `Catches/...`. `.github/workflows/fishing-production.yml` is the sole active publisher.

Fishing Companion uses independent Gear, KB and Catch domains. Gear/KB Add/Edit remains **Prepare Changes → Copy Changes** and produces source-aware packages; preparing/copying is not saving and the browser does not write GitHub source directly. Physical upload links use `pwa/...`; package paths remain logical.

FISH091 remains active: normal online use does not provision the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes it; a failed refresh preserves the prior verified generation.

FISH096 remains active: Knot-only explicit ordered `pictureSequence`; physical frames under `pwa/KB/Knots/assets/<id>/`; logical paths `KB/Knots/assets/<id>/`; explicit array defines order and requires at least two frames; `picture.src` equals final representative frame; cards/detail load only the representative frame; the approved sequence viewer supports controls/keyboard/zoom and does not autoplay on open; complete multi-file selection establishes order; conversion from static picture never silently reuses the old image; replacing references does not delete old source files; complete offline preparation includes every referenced frame. Directory contents alone never create a sequence.

FISH102: Line-Tackle-Knot Reference is pinned first only on KB → Knots.

FISH103: external HTTP(S) links open in a new tab; internal app/local links remain same-tab; Caption editing retains focus; new-KB Markdown Preview uses a provisional required content path before whole-library validation; GitHub upload links target physical `/pwa/...` source.

FISH107: current canonical Skylety Fishing Hook Sharpener type is `Tools`; FISH106's `Kayaks` value is historical package evidence only.

FISH110: Copy Changes uses centralized FISH108-aware boilerplate; eligible source-aware content packages are routed to Fast Content Release, non-fast packages defer to the current appropriate lane, and the obsolete automatic feature-PR/project-record-reconciliation instruction is gone.

## Backlog / future state

`FISH-TODO-005` remains WAITING ON USER; do not infer every fish-finder power component is installed from FISH104 notes.

`FISH-TODO-014` remains OPEN; do not infer FISH105's HyperSeal 3600 is the historical deep-box watch target without explicit confirmation.

The specialized content backlog remains open, including Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons. The broad Technique-page redesign did not close those tasks.

**Fishing Companion v3** (historically `FISH-TODO-077/P2`) remains DEFERRED. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production.

FISH071–076 and FISH078–110 are complete/implemented. The next unused **application/architecture** task ID is **FISH-TODO-111** unless actual newer `main` already allocated it. Routine Fast Content Releases—including normal new KB pages—do not consume FISH-TODO-111.

## Working rules

- Use current GitHub source as authority.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- Fishing Companion change packages are implementation instructions, not JSON merely to explain.
- Do not infer purchases/ownership or close WAITING/open purchase items without sufficient user confirmation.
- Historical milestone docs and old production identities are evidence only; current exact production state comes from current GitHub/Pages evidence.
