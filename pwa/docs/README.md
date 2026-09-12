# Fishing Companion project documentation

This directory contains retained requirements, design, audit, review, approval, release, cleanup, and handoff records for the Fishing Companion project.

## Current authority

Dated files in this directory are durable **historical milestone records**. Statements such as “current production,” “next task,” “awaiting review,” “implementation authorization,” repository paths, commit IDs, release IDs, or open work inside a dated record describe that record's milestone unless the file explicitly says it has been reconciled to a later outcome.

For the actual current project state, always restore latest `main` and read the repository-root files in this order:

1. `README.md`
2. `Fishing_Context.md`
3. `Fishing_TODO.md`
4. `Fishing_Decision_Log.md`
5. `Fishing_New_Chat_Bootstrap_Prompt.md`

For current PWA implementation/development guidance, also use `pwa/README.md`.

Newer primary repository evidence controls over stale wording in an older dated record. Historical release/source identities remain valid evidence for the milestone they document; they are not claims about today's production unless explicitly labeled as current.

## Reconciled approval records

FISH091 and FISH096 use staged requirements/design approval records. Their requirements and design documents now explicitly distinguish the original gate state from the final outcome:

- FISH091 requirements: approved as written including S1–S4; design separately approved; implementation is DONE / production-verified.
- FISH096 requirements: approved as written including S1–S11; design separately approved; implementation is DONE / production-verified.

The separate approval files preserve what each approval authorized **at that checkpoint** while also pointing to the later final outcome. Production release/closeout files preserve the corresponding release evidence.

## Historical v2 records

The original v2 Requirements Inventory, Design Review, Approved Baseline, Source Audit, Technical Contracts, addenda, preview/review records, production release, UI-refinement scope, work handoff, and repository-cleanup records are retained because they document decisions and evidence that still matter for provenance and recovery.

Where those files contain old paths, old release identities, old task IDs, or phase-specific instructions, treat them as historical unless a reconciliation banner in the file says otherwise. Do not use them to override the root current-state files.

## Documentation rule

Keep current continuation state concise in the root project-state files. Preserve milestone evidence here rather than repeatedly rewriting historical bodies to match later releases. When a staged requirements/design document moves from draft to approval/implementation, reconcile its status metadata and link its approval/release record so it cannot be mistaken for an unresolved draft.
