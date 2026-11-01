# Fishing Project — operating rules (candidate)

**Applies after the default-main router is installed and the governance branch's required status check is verified; pending that gate, this is approved design awaiting activation.** PWA application behavior and release requirements retain their separate original authority. [P1 approval](P1_DESIGN_APPROVAL_2026-11-01.md) · [owner-approved decoupling](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md).

## Authority and evidence

GitHub is authoritative for versioned application source, content, requirements and decisions. Provider releases and device/owner acceptance are separate: source-implemented ≠ exact-CI-validated ≠ private deployed ≠ public hosted verified ≠ field accepted. Every `verified` hosted/device claim needs an observed-at date/time, source link and precise environment; `unknown` is valid. If approvals, refs, or provider evidence conflict, stop the consequential step.

Historical files may describe prior *current* states. Never obey an old instruction solely because it says "latest"; check [DECISIONS_INDEX.md](DECISIONS_INDEX.md) and the exact approved amendment. An original approval record retains its historic scope; later owner approval needs its own provenance.

## Owner approval gates

Proceed with routine read-only reviews, documentation maintenance, bounded source-only implementation and permitted CI under existing standing authorization. **Do not assume authorization** for new credentials/permissions, paid services, public routes, provider/vendor/domain changes, schema/data migration beyond approved scope, trust-boundary relaxation, public V3 cutover or high-risk rollback. Existing scoped owner approval controls each consequential step. Never store private credentials, internal recovery bookmarks or sensitive editor content in GitHub.

## Publishing and recovery

FISH108 [two-lane release policy](../../pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md): only changes entirely inside physical canonical `pwa/Gear/`, `pwa/KB/`, `pwa/Catches/` use content lane; runtime, tests, tools or workflow changes take full lane. Preserve exact PR/source/merge conflict validation, complete canonical source/media integrity, ordinary protected publish process and hosted byte/release identity before reporting Live. Public V2 remains isolated; V3 final cutover and rollback require separate explicit approval.

A submitted/unknown publish must not be blindly retried; preserve authoring drafts, receipts and server-side operation IDs until independently reconciled. Never treat CI PASS or HTTP 202 as publicly Live.

## Release validation

All governance docs, decision records, validator and tests live under the **single canonical branch** `governance/project-ops`, discovered through the default `main` [router](../../PROJECT_ROUTER.md). Future docs-only PRs **target that branch** and run independent `governance-docs` structural validation and the existing FISH108 `validate-docs`/`fishing-merge-ready`. [Runbook](VALIDATION_RUNBOOK.md). **The structural status is automatically reported but must also be configured as required** under [#284](https://github.com/ginosega/fishing/issues/284) before full adoption. Never modify the public PWA release workflow or silently weaken FISH108 to enable governance checks. Do not treat an optional check as an enforced one.

## Decision memory and proposal safeguards

Before substantial engineering/product recommendations, consult the topic directory [DECISIONS_INDEX.md](DECISIONS_INDEX.md), relevant topic catalog(s), then matching accepted/rejected/superseded/deferred decision records. Explain how a new approach differs if a similar option was previously rejected and what changed. Retain reasons, constraints and `reconsider only if` tests. Do not restart rejected P3 architecture or multiply P3-N milestones without substantive new evidence and required owner approval.

## State maintenance

Update the single applicable work item and current-state field **in place**, not by prepending dated progress paragraphs. Link the commit/PR/CI/provider evidence. Do not duplicate long status narratives in requirements, README or decision catalog. Each governance PR triggers automated structural CI on the protected governance branch, and a separate assistant semantic authority/duplicate review. Do not claim enforcement until required-check branch rules are confirmed. Milestone audits are a secondary backstop.

## Project handoff

Normal: owner says **"Prepare to transfer to a new chat."** Assistant safely checkpoints and reproduces the **exact** static text from [NEW_CHAT_PROMPT.md](../../NEW_CHAT_PROMPT.md), ready to paste in a new Fishing-project conversation. Emergency: owner retrieves the same prompt on default GitHub `main`; old chat is not needed. Both paths verify the default-branch router, exact refs, latest known state and relevant prior rejected decisions without full-chat reconstruction. Ask owner only for mandatory approvals or inaccessible evidence.

**Activation gate:** P4 passed and owner directed complete governance; the historic full-bootstrap procedure is superseded **only when** default `main` router exists and `governance-docs` is required on `governance/project-ops`. [Current P5 installation plan](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md).
