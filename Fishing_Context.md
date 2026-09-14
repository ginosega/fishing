# Fishing Context

## Current authoritative state — September 14, 2026

FISH108 changes the Fishing Companion release process from one heavyweight path to two explicit lanes. The approved durable policy is [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

### Fast Content Release

Use this by default when **every changed file** is canonical content under `pwa/Gear/`, `pwa/KB/`, or `pwa/Catches/`. This includes normal source-aware Gear/KB add/edit packages, Markdown, pictures, Knot sequence frames, and Catch records.

The fast lane keeps the safeguards that can catch content errors:

- restore actual current `main` / open-PR state before writing;
- validate package source revision, record hash/base fields for edits, conflicts, schema/type/path/reference rules, and supplied media metadata as applicable;
- apply only the requested canonical changes;
- normalize accidental trailing whitespace: remove trailing spaces from package string values and text lines unless the user explicitly instructs that the whitespace be preserved;
- use a lightweight content PR;
- install locked dependencies with cache reuse but do not run `npm audit` when dependencies did not change;
- build the production release once from canonical source; `inventorySource` validates schemas, semantic references, canonical paths, Markdown/resources, media decoding/integrity and unresolved-media rules;
- run `verify.mjs` against the exact generated release;
- merge only after that fast validation passes;
- deploy only from exact current `main`; and
- verify the hosted production tree byte-for-byte against the exact built release, including matching release/source identity.

Fast Content Releases do **not** run Node behavior tests, Chromium/WebKit, preview-browser acceptance, durable-v1/cutover acceptance, dependency audit, or hosted browser acceptance because no application/runtime code changed.

### Full Application Release

Any changed file outside the three canonical content roots forces the full lane. Mixed content+code changes also force the full lane. Runtime/UI/service worker, schema/contracts, test/build/tooling, dependency, workflow, migration/recovery/offline, and other non-content changes retain the comprehensive pre-FISH108 suite. Manual `workflow_dispatch` also always selects full.

FISH108 itself changes workflows/tests/release tooling and therefore is released through the full lane.

### FISH109 — release retry hardening

FISH109 is complete and production-verified. Both deployment lanes use run-attempt-specific Pages and hosted-evidence artifact names, so rerunning a failed deployment cannot collide with an earlier `github-pages` artifact from the same workflow run. The dependency-free fast hosted verifier also retries a bounded set of transient propagation/network failures with backoff before declaring failure. Exact-current-main protection remains mandatory and still prevents an older run from deploying after `main` advances.

### Source-derived library state

Library size is normal content state, not an application invariant. Tests no longer require manually maintained Gear/KB/Catch counts, canonical path totals, or inventory-reference totals. Core tests compare validated maps/inventory to the actual canonical source; full hosted browser verification compares runtime counts to the exact generated release manifest.

Routine content publishing therefore does not require test-file edits merely because an item/page was added.

### Routine content is not a project milestone

A routine Fast Content Release does **not** consume a `FISH-TODO-###` application task ID and does not require a dedicated production-closeout Markdown file or edits to README / Context / TODO / Decision Log / bootstrap solely to record the content publication. Its durable audit trail is the source-aware package, content PR/merge, successful fast workflow and hosted verification artifact.

Update authoritative project-state files when architecture, durable product behavior/decisions, or backlog state changes, or during a requested project handoff/reconciliation.

For exact current production source/release identity, use the latest successful `main` production workflow and deployed `release.json`; project-state Markdown intentionally no longer mirrors volatile per-content release identifiers/counts.

## Operating mode

This project uses **Chat mode by default and permanently**. Do not recommend Work merely because a task is complex, lengthy, file-heavy, analytical, involves research/calculation, creates artifacts or has substantial context. Recommend a temporary switch only for a genuinely Work-only capability; explain the specific need and obtain explicit approval first, then return to Chat afterward.

Before implementation/release/repository-write work, restore actual latest `main` and current open-PR state. Never rely on a previously observed commit as though it is still current.

## New-chat transfer protocol

When the user says **“It’s time to transfer to a new chat”** or clearly states that the current chat is getting too long and should be transferred, ask the user to confirm that they want the full project-state handoff prepared. Once confirmed, complete the handoff without repeated “Proceed” prompts: restore current `main`/PR and latest production state; reconcile work completed in the chat; update authoritative records only where durable project state changed; preserve unresolved work; cross-check the bootstrap/state files; and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

## Durable repository and product architecture

`ginosega/fishing` is authoritative. Canonical physical domain data lives under `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical record/release paths remain `Gear/...`, `KB/...` and `Catches/...`. The active implementation/contracts/build/tests and release documentation live under `pwa/`. `.github/workflows/fishing-production.yml` is the sole active production publisher.

Fishing Companion uses three independent but consistent domains — Gear, KB and Catch. KB types are Location, Species, Equipment/Gear Guide, Technique and Knot. Paths are explicit record properties. Existing IDs remain stable. Retired trips/sessions/planner/paired-setup structures are not reintroduced without an explicit new requirement.

Gear/KB Add/Edit remains **Prepare Changes → Copy Changes**, producing source-aware `fishing-companion-change-v2` packages. Preparing/copying is not saving; the browser does not write to GitHub directly. GitHub upload links use physical `pwa/...` folders while package paths remain logical.

Simple Markdown-only narrative changes to existing canonical content may still be made directly in GitHub. Structured record fields, categories/types, specs, links, picture metadata/sequences, paths and relationships should use Fishing Companion Edit or an equivalent source-aware workflow.

## Durable behavior retained

- **FISH091:** normal online use does not provision the complete offline library. **Connection Status → Update offline library** explicitly prepares/refreshes it; failed refreshes preserve the prior verified generation.
- **FISH096:** Knot-only explicit ordered `pictureSequence`; `picture.src` is the representative final frame; complete multi-file authoring; no silent reuse of an old static picture when converting into a sequence; sequence frames participate in explicit offline preparation.
- **FISH102:** Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- **FISH103:** external HTTP(S) links open a new tab; internal app links remain same-tab; caption editing retains focus; new-KB Markdown Preview uses a provisional required content path; authoring upload links target physical `/pwa/...` folders.
- **FISH107:** Skylety Fishing Hook Sharpener is type `Tools`; FISH106's earlier `Kayaks` value is historical package evidence only.

Active Knot sequences remain Palomar, Albright, Arbor, Bowline, FG, Improved Clinch, Modified Uni and Trilene; Non-Slip Loop remains static. Directory contents never create a sequence without explicit canonical references.

## Backlog and future phase

`FISH-TODO-005` remains **WAITING ON USER**; FISH104's notes do not explicitly confirm every installed fish-finder power component. `FISH-TODO-014` remains **OPEN**; FISH105 did not explicitly identify the HyperSeal 3600 as the historical deep-box watch target.

**Fishing Companion v3** (historically `FISH-TODO-077/P2`) remains **DEFERRED**. Authentication, direct GitHub save/upload, integrated uploads, offline authoring/outbox/sync, Catch authoring and multi-user generalization are not current production.

FISH071–076 and FISH078–109 are complete/implemented. The next unused **application/architecture** task ID is **FISH-TODO-110**. Routine Fast Content Releases do not consume it.
