# Fishing Project — operating rules (active)

**ACTIVE:** Adopted under the owner-approved P5 completion directive after the [router merge](https://github.com/ginosega/fishing/pull/292) and verification of active [required governance checks](https://github.com/ginosega/fishing/rules/26335925). PWA application behavior and release requirements retain their separate original authority. [P1 approval](P1_DESIGN_APPROVAL_2026-11-01.md) · [owner-approved decoupling](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md).

## Authority and evidence

GitHub is authoritative for versioned application source, content, requirements and decisions. Provider releases and device/owner acceptance are separate: source-implemented ≠ exact-CI-validated ≠ private deployed ≠ public hosted verified ≠ field accepted. Every `verified` hosted/device claim needs an observed-at date/time, source link and precise environment; `unknown` is valid. If approvals, refs, or provider evidence conflict, stop the consequential step.

Historical files may describe prior *current* states. Never obey an old instruction solely because it says "latest"; check [DECISIONS_INDEX.md](DECISIONS_INDEX.md) and the exact approved amendment. An original approval record retains its historic scope; later owner approval needs its own provenance.

## Owner approval gates

Proceed with routine read-only reviews, documentation maintenance, bounded source-only implementation and permitted CI under existing standing authorization. **Do not assume authorization** for new credentials/permissions, paid services, public routes, provider/vendor/domain changes, schema/data migration beyond approved scope, trust-boundary relaxation, public V3 cutover or high-risk rollback. Existing scoped owner approval controls each consequential step. Never store private credentials, internal recovery bookmarks or sensitive editor content in GitHub.

## Publishing and recovery

FISH108 [two-lane release policy](../../pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md): only changes entirely inside physical canonical `pwa/Gear/`, `pwa/KB/`, `pwa/Catches/` use content lane; runtime, tests, tools or workflow changes take full lane. Preserve exact PR/source/merge conflict validation, complete canonical source/media integrity, ordinary protected publish process and hosted byte/release identity before reporting Live. Public V2 remains isolated; V3 final cutover and rollback require separate explicit approval.

A submitted/unknown publish must not be blindly retried; preserve authoring drafts, receipts and server-side operation IDs until independently reconciled. Never treat CI PASS or HTTP 202 as publicly Live.

## Release validation

All governance docs, decision records, validator and tests live under the **single canonical branch** `governance/project-ops`, discovered through the default `main` [router](../../PROJECT_ROUTER.md). Future docs-only PRs **target that branch** and run independent `governance-docs` structural validation and the existing FISH108 `validate-docs`/`fishing-merge-ready`. [Runbook](VALIDATION_RUNBOOK.md). **The structural status is automatically enforced as required** by the active [ruleset](https://github.com/ginosega/fishing/rules/26335925); [#284](https://github.com/ginosega/fishing/issues/284) records its implementation and proof. Never modify the public PWA release workflow or silently weaken FISH108 to enable governance checks. Do not treat an optional check as an enforced one.

## Decision memory and proposal safeguards

Before substantial engineering/product recommendations, consult the topic directory [DECISIONS_INDEX.md](DECISIONS_INDEX.md), relevant topic catalog(s), then matching accepted/rejected/superseded/deferred decision records. Explain how a new approach differs if a similar option was previously rejected and what changed. Retain reasons, constraints and `reconsider only if` tests. Do not restart rejected P3 architecture or multiply P3-N milestones without substantive new evidence and required owner approval.

## State maintenance

Update the single applicable work item and current-state field **in place**, not by prepending dated progress paragraphs. Link the commit/PR/CI/provider evidence. Do not duplicate long status narratives in requirements, README or decision catalog. Each governance PR triggers automated structural CI on the protected governance branch, and a separate assistant semantic authority/duplicate review. The two mandatory checks and no-bypass protection were independently confirmed through GitHub; preserve this protection for every future change. **Semantic audit is mandatory at significant milestones, owner decision amendments, release/field acceptance checkpoints and substantial planned chat transfers**, as specified in [SEMANTIC_AUDIT_SOP.md](SEMANTIC_AUDIT_SOP.md). A weekly scheduled ChatGPT audit provides an independent backstop without requiring the owner to remember it. Check recent GitHub changes against the current queue, status, approved/rejected decision index and provider evidence; do not claim audit PASS from scheduling alone or use source CI as proof of deployment. Structural CI is separate and cannot detect all semantic drift. Any verified discrepancy is corrected in place through a protected governance PR, not an append-only chronology.

## Project handoff

**Assistant responsibility — proactive recommendation:** Recommend a new chat at a **safe checkpoint** when a major milestone or phase concludes, before substantial new work begins, after unusually long or iterative development/testing, or when the conversation shows possible context loss, inconsistent recall or repeated errors. Do not wait for the owner to notice length or remember the transfer phrase. There is no reliable exact context-capacity gauge, and a failure may occur without warning. If a risky transition is identified mid-operation, first preserve the latest verifiable checkpoint and any in-flight receipts/unknown outcomes; never abandon or blindly repeat a write. Recommend rather than force a transfer, and let the owner decide when to open the next chat.

**Owner initiation:** **"Prepare to transfer to a new chat"** is convenient wording, **not an exact required command**. Any clear natural-language request to start a new chat or hand off work is equivalent. The owner may also defer a suggested transfer.

**Planned checkpoint:** Reconcile the current GitHub refs, active [CURRENT_STATE.md](CURRENT_STATE.md) and [WORK_QUEUE.md](WORK_QUEUE.md), material decisions and pending GitHub/provider/publishing operations. Perform the applicable [semantic review](SEMANTIC_AUDIT_SOP.md), record verified progress in place through protected governance checks as needed, and explicitly preserve unknown outcomes. Then reproduce the **unchanged fenced prompt text** from [NEW_CHAT_PROMPT.md](../../NEW_CHAT_PROMPT.md), ready to paste into a fresh Fishing-project chat. Do not append time-dependent status to that static prompt; the next chat retrieves it via the default-branch router.

**Emergency recovery:** If the old chat fails without a checkpoint, the owner retrieves that same prompt from default GitHub `main`; the old chat is not needed. Both recovery paths verify exact refs, current state, and relevant rejected decisions through bounded reads rather than reconstructing a full conversation. Ask the owner only for necessary approvals or inaccessible evidence.

**Adoption complete:** The default-`main` router and required `governance-docs` status are installed. The legacy full-bootstrap transfer workflow is superseded **for new chats**, with all old source files preserved for targeted historical retrieval. [P5 evidence](P5_CANONICAL_BRANCH_IMPLEMENTATION_2026-11-01.md).
