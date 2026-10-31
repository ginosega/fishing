# FISH-OPS-V2 — Migration and Authority Coverage Matrix

**Baseline:** `ginosega/fishing@406723f880960d33d40bd07984559432c8caa233`, source branch `feature/fish118-p3-mock-publisher`  
**Tracker:** [#282](https://github.com/ginosega/fishing/issues/282) · **PR:** [#283](https://github.com/ginosega/fishing/pull/283)  
**Status:** P0 coverage inventory; no content has been migrated. Row action = recommendation for P1/P2 approval, not authorization to rewrite approved records.

## 1. Primary document ownership and disposition

| Existing source | What it genuinely owns today | Risk / authority collision | P1/P2 disposition | Preserve check |
| --- | --- | --- | --- | --- |
| `README.md` (root, 89,033 bytes) | Project purpose + implementation history + latest checkpoint | README blends durable overview, active V3 status and fishing backlog | Restore short project overview and point to ops router; retain historical snapshot accessible at fixed ref/archives | Generic project/fishing gear and product scope not discarded |
| `Fishing_Context.md` (100,829 bytes) | Design/backstory/constraints and repeated current status | Mixes timeline, current V3 and operational rules | Extract only currently binding constraints to `OPERATING_RULES` and state to `CURRENT_STATE`; archive original | No material constraint or deployment caveat omitted |
| `Fishing_TODO.md` (91,976 bytes) | Multi-domain backlog and long progress chronology | Closed/deleted work and open current work are hard to separate | Index active V3 work in `WORK_QUEUE`; retain independent fishing gear/KB backlog in scoped queue/index rather than silently dropping it | Keep IDs, DONE/DELETED exclusions, parked owner tasks |
| `Fishing_Decision_Log.md` (101,235 bytes) | Historical owner choices, acceptance and evidence | Same status copied from other roots; newer amendments not independently addressable | Retain immutable legacy log; create `DECISIONS_INDEX` and separately addressable effective ADR/amendments | Original decisions and any supersessions cited by stable ID |
| `Fishing_New_Chat_Bootstrap_Prompt.md` (145,354 bytes) | Full old-chat context transfer and repeated state | Full paste and all-five reread required by obsolete operating contract | Archive prior protocol; replace active chat startup with `START_HERE` and explicit bounded reads | Owner's previous transfer preference superseded only after approval, not silently |
| `Fishing_New_Chat_Handoff_2026-10-23_P3.md` | Historical P3 snapshot | Dated state can be mistaken for current | Retain as dated artifact only | Date/ref clearly indicated |
| `Fishing_Draft_Document_History_2026-10-30.md` | Small retained historical notes | Duplicate authority if promoted | Keep historical | No current-state routing |
| `pwa/docs/README.md` | Historical docs directory index and former five-file read order | Instructs full root read during new-chat start | Update routing after final accepted cutover; don't remove dated-record warning | Historical evidence remains separate from live state |
| `pwa/README.md` | App build/release and directory guidance | Appropriate scoped source; sometimes time-bound content notes | Keep as implementation guide; index only if needed | FISH108 and canonical path semantics unchanged |

## 2. Approved specification/authority coverage (must remain normatively binding)

| ID | Primary source | Active model should know | Explicit non-regression test / gate |
| --- | --- | --- | --- |
| GOV-01 | `pwa/docs/Fishing_Companion_v3_Requirements.md` + `...Requirements_Approval_2026-10-19.md` | Original Oct 19 signed-off requirements and exact approved blob | New index keeps original approval baseline immutable and newer amendments distinct |
| GOV-02 | `pwa/docs/Fishing_Companion_v3_Technical_Design.md` + `...Technical_Design_Approval_2026-10-19.md` | Approved security/architecture and conditional proof gates | No silent modification to trust boundary, App permissions or auth |
| GOV-03 | `pwa/docs/Fishing_Companion_v3_UX_Review.md` + `...UX_Approval_2026-10-19.md` | Approved user experience; newer specific owner amendments take precedence within narrow scope | Current UX references the amendment, not a blanket reapproval |
| GOV-04 | `pwa/docs/Fishing_Companion_v3_Implementation_Plan.md` + `...Implementation_Plan_Approval_2026-10-19.md` | Staged implementation and separately gated V3 cutover; old full-bootstrap transfer method was situational | Preserve stage gates while explicitly amending only the new-chat operating method |
| GOV-05 | `pwa/docs/Fishing_Companion_v3_Notes_Editor_Amendment_2026-10-31.md` | Gear/KB/Catch Notes original photos, safe viewer, Catch cover remains species-derived | No regression to "Catch Notes photos forbidden" or unaudited photo upload |
| GOV-06 | `pwa/docs/Fishing_Companion_v3_Requirements.md` V3-SAVE-09 | Oct 27 **≤60-second**, normal-operation content-only text Save→verified Live; only evidenced external outage exemptions | Preserve entire acceptance conditions incl public hosted-byte identity, not FISH108's older few-minute target |
| GOV-07 | `pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md` | Content-only lane eligible only for canonical Gear/KB/Catches physical roots, full lane otherwise | Never change release lane classification or exact-head hosted proof by documentation refactor |
| GOV-08 | `pwa/docs/FISH091_...Requirements...md`, `FISH096_...Requirements...md` and independent approvals | Existing v2 offline and knot/photo decisions persist where not revised by V3 | Retain approved records; historical stage claims cannot govern V3 live state |
| GOV-09 | `pwa/docs/Fishing_Companion_v2_Approved_Baseline.md`, technical contracts/addenda | Inherited behaviors and content integrity | No wholesale migration or rewrite to V2 source |
| GOV-10 | `experiments/p3/preview/D1_V3_Architecture_Consolidation_2026-10-25.md` | Later same-origin service/security choices and explicit no-extra-attestor decision | Remain contextual architecture evidence, not blanket production authorization |
| GOV-11 | `experiments/p3/preview/FISH118_V3_Finite_Delivery_Reset_2026-10-25.md` | Finite D1–D6 delivery milestones and distinction from P3 experimental steps | Do not restart or multiply P3-N milestones; current queue maps to D stages |

## 3. Required current-state fields: proposed coverage

Every *active deployment-bearing* work item should state:

| Field | Meaning | Example in frozen V3 | Required evidence |
| --- | --- | --- | --- |
| `work_id` / `owner` / `priority` | Unique responsibility / context | Gear Notes image; Catch editor | Issue/PR link, no numbering inflation |
| `source_ref` | Exact branch and commit implementing intended change | P3 feature branch HEAD; component commit | GitHub commit link |
| `source_status` | Not started / implemented / blocked | Gear Notes SHA indexing source-fixed | Diff/code inspection |
| `ci_status` | CI result for exact head/suite | Notes test CI #41243971222 as historical source evidence | GitHub run + SHA |
| `private_deploy_status` | Actual private Worker version and hosted proof | **UNKNOWN pending fresh provider verification** | Owner-run/cloud evidence |
| `public_deploy_status` | Public Pages verified source/release | Public V2 persists as baseline claim; must refresh when operating | Hosted-byte proof |
| `field_acceptance` | Observed user behavior, device/scope | Gear Notes image still pending; Publishing Status Edge previously accepted | Dated test/evidence |
| `next_safe_action` | One action and its exact prerequisites | Read actual private Worker version before guarded deployment | Verified runbook, approval |
| `failure_recovery` | Receipt/draft retention and safe retry | Catch Add lifecycle status unknown; never blind retry | D1/Connection Status diagnostics |
| `last_checked_at` / `freshness` | What was inspected and when | Fixed Oct 31 repo audit; not real-time Cloudflare | Time and evidence pointer |

When evidence is missing, use `unknown` or `not verified`. A green CI does not populate a deploy status. An owner-approved UX design does not populate field acceptance.

## 4. Control-plane checks and operational ownership

| Control | Current source | Refactor test | Status at P0 |
| --- | --- | --- | --- |
| Repository refs/branch truth | GitHub commits/PR #263 | New chat identifies feature vs main vs docs branch | Design pending |
| Workflow lane selection | `.github/workflows/fishing-production.yml` | No docs PR triggers public app deploy, no reduced application verification | Current YAML observed; runtime not executed |
| Docs-specific validation | `validate-docs` currently `git diff --check` only | Schema / size / link / conflicting authority checks | **Gap** |
| Private Cloudflare/D1 | Provider receipts, operator deployment output, P3 runbooks | No inferred live status from GitHub only | **Not audited live** |
| V3 security | Requirements/design; P3 tests, App permission records | Owner identity/session/CSRF/secret isolation retained | Coverage mapped, detailed test review separate |
| Production release and rollback | FISH108, P8/D6 and deployment workflows | Signed-off cutover and hosted verification still separate | Coverage mapped |
| Chat handoff | Root bootstrap + `pwa/docs/README.md` + dated D1 documents | Bounded `START_HERE` only; no history bulk read | Existing model **fails** efficiency goal |
| Current state change | Root five files, dated reports | Single in-place entry plus evidence link | Existing model **fails** single-authority goal |
| Decision amendments | Approved Oct 19 records, Oct 27/31 additions | Original blobs immutable, newer approvals in separate ADR/change records | Governance improvement needed |
| Non-V3 fishing equipment/backlog | Root TODO, KB/content, older project notes | Scoped index keeps open/deleted/done distinctions | Needs manual reconciliation at migration |

## 5. P1 design questions to resolve before any original-file changes

1. **Where does active authority live?** Proposed `project-ops/v2/` on V3 feature branch, with a 1–2 KB entry and minimal root README link; decide what gets copied/merged to public `main` only after feature-branch reconciliation.
2. **How does source verification freshness work?** Require immutable refs for past checks and an explicit `last_checked_at`; never manufacture current Worker/Pages status.
3. **How are user decisions versioned?** Use individual stable amendment IDs and an index. Keep the October 19 approval files intact; never imply later content was approved on October 19.
4. **What is the scope of CI changes?** Initial doc-only migration can do whitespace+manual validation. Automated link/schema checks that require new executable files or workflow edits must get a separate scope review and the appropriate Full Application Release gate.
5. **What does a safe chat transfer look like?** Minimal prompt naming repo/branch/entry point, read one short router and current state, then retrieve only work item/requirement sections on demand; run cold-start acceptance after user signs off.
6. **How do we avoid stale doc sprawl?** Size budgets, explicit per-file owner, one-status-per-item rule, no prepend-only changelogs, and separate history evidence.

## 6. Coverage reconciliation at migration

The P2 migration must produce a per-row check:

- [ ] Root README purpose and enduring fishing equipment/source details retained or indexed.
- [ ] Context security, design and operational constraints traced to authoritative source.
- [ ] TODO active V3 issues and separate fishing equipment/KB backlog retained with status.
- [ ] Decision Log owner-approved effective, changed and superseded choices mapped without loss.
- [ ] Bootstrap unique working rules and non-V3 gear facts retained, superseded handoff mechanism documented.
- [ ] V3 requirements/technical design/UX/plan and each approval exact lineage linked.
- [ ] Oct 27 performance and Oct 31 Notes/Catch amendments indexed.
- [ ] FISH108 release/hosted proof gate retained.
- [ ] Source/test/deployed/field evidence separated and re-verified before active operations.
- [ ] Every live route and link works, and a new chat recovers safely without bulk ingestion.

**Scope note:** This matrix is the **source coverage checklist**, not a claim that every historic excerpt has already been migrated or verified. No approved artifacts were edited for the audit.
