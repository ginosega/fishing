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

## FISH108 release policy — critical

Fishing Companion now has two release lanes. The durable policy is `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`.

### Fast Content Release — default for routine authoring

Use Fast Content Release only when **every changed file** is canonical content under one or more of:

- `pwa/Gear/`
- `pwa/KB/`
- `pwa/Catches/`

This is the normal path for source-aware `fishing-companion-change-v2` Gear/KB add/edit packages, Markdown, pictures, Knot sequence frames and Catch records.

Before mutation, still restore actual current source and validate the package: source revision/ancestry as appropriate, record hash/base fields for edits, conflict state, IDs/schema/types/paths/references, notes/media actions, and supplied media existence/hash where applicable. Apply only requested changes and preserve unrelated source/user bytes.

Then use the lightweight content PR. The workflow automatically performs a locked cached dependency install, one canonical production build/source inventory validation, exact generated-release verification, merge-to-main deployment with exact-current-main protection, and dependency-free byte-for-byte hosted/release-identity verification.

For a content-only release, do **not** manually escalate to Node behavior tests, Chromium/WebKit, preview-browser testing, archived-v1/cutover testing, dependency audit or hosted browser acceptance unless validation reveals a real non-content issue. Those belong to the full lane.

A routine Fast Content Release:

- does **not** consume a `FISH-TODO-###` application/architecture ID;
- does **not** require per-item README/Context/TODO/Decision Log/bootstrap updates;
- does **not** require a per-item production-closeout Markdown document; and
- is complete when the requested canonical diff is merged, the fast production workflow succeeds, and hosted byte/release identity verification passes.

Its durable audit trail is the change package/validation, content PR/merge, workflow run, and hosted verification artifact.

### Full Application Release

Use the full lane whenever **any** changed file is outside those three canonical content roots. Mixed content+code is full. Runtime/UI/service-worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture, or other application changes use a feature PR and the comprehensive full CI/browser/v1-cutover/deploy/hosted-browser suite. Manual workflow dispatch is full.

If lane eligibility is ambiguous, use full. Do not broaden fast eligibility ad hoc.

### Source-derived expectations

Changing Gear/KB/Catch item counts, canonical path totals and reference totals is normal content evolution. Do not edit tests solely to update these numbers. Validation derives current state from canonical source and the exact generated release. Historical counts in dated records remain historical evidence only.

## Chat-transfer convention

For this project, the phrase **“It’s time to transfer to a new chat”** is the standard transfer cue. If I say that (or clearly say this chat is getting too long and should be transferred), ask me to confirm that I want the **full project handoff** prepared.

After confirmation, execute it end-to-end without repeated “Proceed” prompts:

- restore actual latest `main`, open PRs and current production evidence;
- reconcile work completed in the chat;
- update README/Context/TODO/Decision Log/bootstrap and other records only where durable project state actually changed;
- do not manufacture per-content-release documentation merely for handoff completeness;
- preserve unresolved work and purchase uncertainty;
- cross-check the authoritative files; and
- finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

This is a project convention, not an automatic ChatGPT feature. A user-requested lighter transfer overrides it.

## Current durable architecture/behavior

`ginosega/fishing` is authoritative. Canonical physical data is under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical paths remain `Gear/...`, `KB/...` and `Catches/...`. `.github/workflows/fishing-production.yml` is the sole active publisher.

Fishing Companion uses independent Gear, KB and Catch domains. Gear/KB Add/Edit remains **Prepare Changes → Copy Changes** and produces source-aware packages; preparing/copying is not saving and the browser does not write GitHub source directly. Physical upload links use `pwa/...`; package paths remain logical.

Simple Markdown-only narrative edits to existing canonical files may be made directly in GitHub. Structured fields/categories/types/specifications/links/pictures/sequences/paths/relationships should use Fishing Companion Edit or an equivalent source-aware workflow.

FISH091 remains active: normal online use does not provision the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes it; a failed refresh preserves the prior verified generation.

FISH096 remains active: Knot-only explicit ordered `pictureSequence`; physical frames under `pwa/KB/Knots/assets/<id>/`; logical paths `KB/Knots/assets/<id>/`; `picture.src` equals final representative frame; complete multi-file authoring; no silent reuse of old static picture when converting into a sequence; explicit sequence frames participate in complete offline preparation.

FISH102: Line-Tackle-Knot Reference is pinned first only on KB → Knots.

FISH103: external HTTP(S) links open in a new tab; internal app/local links remain same-tab; Caption editing retains focus; new-KB Markdown Preview uses a provisional required content path; GitHub upload links target physical `/pwa/...` source.

FISH107: current canonical Skylety Fishing Hook Sharpener type is `Tools`; FISH106's `Kayaks` value is historical package evidence only.

## Backlog/future state

`FISH-TODO-005` remains WAITING ON USER; do not infer every fish-finder power component is installed from FISH104 notes.

`FISH-TODO-014` remains OPEN; do not infer FISH105's HyperSeal 3600 is the historical deep-box watch target without explicit user confirmation.

**Fishing Companion v3** (historically `FISH-TODO-077/P2`) remains DEFERRED. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production.

FISH071–076 and FISH078–108 are complete/implemented. The next unused **application/architecture** task ID is **FISH-TODO-109** unless actual newer `main` already allocated it. Routine Fast Content Releases — including a normal new KB page — do not consume FISH-TODO-109.

## Working rules

- Use current GitHub source as authority.
- Do not repeat completed migration/cutover/release work.
- Preserve unrelated concurrent source changes and user-uploaded bytes.
- P1 authoring packages are implementation instructions, not JSON merely to explain.
- Do not infer purchases/ownership or close WAITING/open purchase items without sufficient user confirmation.
- Historical milestone docs and old production identities are evidence only; current exact production state comes from current GitHub/Pages evidence.
