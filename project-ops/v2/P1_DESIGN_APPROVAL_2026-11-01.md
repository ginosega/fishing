# FISH-OPS-V2 — P1 Design Acceptance

**Date:** 2026-11-01  
**Initiative:** [#282](https://github.com/ginosega/fishing/issues/282)  
**Design PR:** [#283](https://github.com/ginosega/fishing/pull/283)  
**Gate outcome:** **P1 OPERATING-MODEL DESIGN APPROVED; P2 NON-DESTRUCTIVE MIGRATION AUTHORIZED.** This approval does not activate the new workflow, merge a PR, deploy an application, or waive future acceptance gates.

## Owner decision

The project owner stated in the conversation:

> I am satisfied with the approach to and design of the new project operating model. What are our next steps, and what do you need from me?

This follows the owner review/discussion of the first P1 drafts and requested refinements about two-tier validation, owner burden, normal and emergency chat transfer, static prompt/current-state routing, indexed/lazy-loaded historical decision rationale, and continuous protection against documentation growth.

**Approved proposal sources (design branch at review checkpoint):**
- [P1 Operating-Model Design](P1_OPERATING_MODEL_DESIGN.md).
- [P1 Documentation Validation Design](DOC_VALIDATION_DESIGN.md).
- [Static copyable recovery prompt](../../NEW_CHAT_PROMPT.md).
- [P0 Audit](AUDIT_2026-10-31.md) and [Migration Coverage Matrix](MIGRATION_COVERAGE_MATRIX.md).

The owner accepted the **approach and design**, not the factual completeness of migrated records or the successful operation of a validator that has not yet been built. The P1 sign-off authorizes the assistant to prepare the P2 documents and curate/index legacy decisions non-destructively on the existing draft documentation branch. Where old material is ambiguous, retain the original and flag the ambiguity rather than infer an approval.

## Approved P1 policy design

1. A truly **static new-chat prompt** whose only job is to find the latest approved GitHub router and bounded active context; routine progress does not require modifying the static prompt.
2. A **default-branch workstream router** kept separate from mutable `CURRENT_STATE` and verified against latest Git refs before use.
3. Five small, uniquely owned active docs: `START_HERE`, `CURRENT_STATE`, `WORK_QUEUE`, `OPERATING_RULES`, `DECISIONS_INDEX`; historical root docs retained and no longer used as full-context startup after cutover.
4. Current state **updated in place** and with source/CI/deployment/field-acceptance evidence independently tracked.
5. Historical decisions, **including rejected, deferred, superseded and negative lessons**, curated into searchable topic catalogs and linked detailed records/original signed-off evidence, with exact approval provenance retained.
6. **Continuous validation** on changes, with deterministic automated structural tests and triggered assistant-performed semantic/evidence review; owner involvement reserved for required material authorizations, inaccessible owner-only evidence and final acceptance.
7. Documentation validator and CI wiring tracked in [#284](https://github.com/ginosega/fishing/issues/284), delivered via **separate reviewed tooling/workflow PR** on the appropriate Full Application Release lane, then proved through a docs-only PR. It is a required gate, not optional maintenance.
8. P4 cold-start tests exercise normal/emergency recovery, historical rejected-approach retrieval, and ambiguous in-flight operations; the old workflow remains active until the owner accepts the result.

## Boundaries and subsequent gates

- **P2 now permitted:** add documents, indexes, migration coverage evidence and initial decision catalogs/records to draft PR #283, without modifying existing production-facing files, historical approval records or app code.
- **P3 requires scoped implementation and testing:** any executable tools or GitHub Actions YAML changes follow FISH108 Full Application Release validation and a separate reviewed PR. No shortcut using documentation-only classification.
- **P4/P5 still required:** prove the fully populated docs, validator, router discovery, and cold-start before final owner adoption; do not silently switch the ChatGPT project or deprecate its working procedure.
- **Public `main` remains separate:** no unreviewed merge, public V2 deployment, Cloudflare/D1 Worker change, or V3 public cutover authorized.
- **V3 PR #263 remains paused and draft.** Reconcile source/CI/private hosted/field proof afresh before feature work resumes.

**Immediate P2 action:** Create/populate bounded current-state, work-queue, operating-rules and decision-topic coverage starting from verified GitHub evidence, with explicit gaps and zero-loss review against P0 matrix.
