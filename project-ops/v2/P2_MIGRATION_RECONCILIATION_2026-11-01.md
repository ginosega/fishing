# P2 non-destructive migration — coverage and risk reconciliation

**Evidence date:** 2026-11-01 · **Historical snapshot:** The original P2 corpus was populated on V3-dependent draft [PR #283](https://github.com/ginosega/fishing/pull/283). Its implementation route was later **superseded** by the [owner-approved independent amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) and main-based [draft PR #288](https://github.com/ginosega/fishing/pull/288). This file retains original P2 provenance; consult [current state](CURRENT_STATE.md) and [independent validation](P3_INDEPENDENT_VALIDATION_2026-11-01.md) for latest results. No Cloudflare or public Pages state queried.

## Source preservation / tracked changes
- Migration starts from fixed V3 development baseline `406723f880960d33d40bd07984559432c8caa233`; [charter](CHARTER.md) and [P1 owner approval](P1_DESIGN_APPROVAL_2026-11-01.md).
- Root `README.md`, `Fishing_Context.md`, `Fishing_TODO.md`, `Fishing_Decision_Log.md`, `Fishing_New_Chat_Bootstrap_Prompt.md`, approved V3 requirements/design/UX/plan/approval records, `pwa/` sources, Worker/Cloudflare/D1 code/config, and GitHub workflow files **remain unchanged on the documentation branch**. Existing source history is preserved.
- The candidate static [recovery prompt](../../NEW_CHAT_PROMPT.md), candidate root `PROJECT_ROUTER.md`, and five scoped active documents are **drafts** until a separately reviewed default-branch routing change and final owner acceptance.

## New active-document coverage
| Intended owner | Candidate document | Historical cross-check |
| --- | --- | --- |
| Workstream discovery | [`PROJECT_ROUTER.md`](../../PROJECT_ROUTER.md) | Default branch is still `main`; this draft is not activated |
| Static normal/emergency transfer | [`NEW_CHAT_PROMPT.md`](../../NEW_CHAT_PROMPT.md) | No current SHA/branch/issue in copyable text |
| Minimal entry / bounded read order | [`START_HERE.md`](START_HERE.md) | Old bootstrap is retained for provenance, not bulk startup |
| Source/CI/private/public/field status | [`CURRENT_STATE.md`](CURRENT_STATE.md) | V3 Notes/Catch state explicitly `unknown` where provider verification is absent |
| Active work | [`WORK_QUEUE.md`](WORK_QUEUE.md) | Operating model [#282](https://github.com/ginosega/fishing/issues/282), doc CI [#284](https://github.com/ginosega/fishing/issues/284), V3 [#263](https://github.com/ginosega/fishing/pull/263) |
| Approved safety/engineering/handoff rules | [`OPERATING_RULES.md`](OPERATING_RULES.md) | FISH108, signed V3 specifications, D1 gateway/CI/approval gates |
| Topic-only decision lookup | [`DECISIONS_INDEX.md`](DECISIONS_INDEX.md) | Seven topic catalogs with **48 curated decision entries** |
| Full original decision-log navigation | [`LEGACY_DECISION_CROSSWALK.md`](LEGACY_DECISION_CROSSWALK.md) | **56 H2/H3 headings** of original Decision Log linked to pinned `406723f` revision |
| Significant rejected/superseded rationale | [`decisions/records/`](decisions/records/) | Eight individually linked ADR summaries; source evidence retained and pinned |
| Non-V3 owner work | [`FISHING_BACKLOG_INDEX.md`](FISHING_BACKLOG_INDEX.md) | Preserve historical active, deleted, completed, ownership-unknown fishing/gear tasks |

## Historical decisions and negative lessons explicitly indexed
- Publishing and status: FISH108 release lanes, exact source/CI/hosted proof, 60-second V3 normal text-only gate, no duplicate/blind retries, rejected extra attestor.
- Security: one authorized writer and same-origin sessions, rejected HMAC-only receiver/new auth layer, scoped credentials and explicit provider/cutover approval.
- Architecture: D1–D6 finite milestone reset rather than endless P3-N substeps, rejected whole-prototype merge, rejected unnecessary hosted-site replacement, excluded planner/offline queue/multi-user expansion.
- Editor: Catch Notes image vs cover distinction, owner-selected Connection Status lifecycle, searchable Gear picker replacing unscalable datalist, links and viewer opt-in.
- Offline/reliability: opt-in offline library, provisional removable drafts, coherent service-worker release, originals retained with thumbnails.
- Operations: historical full-bootstrap handoff recorded (but superseded only **after** model adoption), Chat mode default, current source vs provider evidence.
- Fishing content/gear: old generic KB pages retired, where/why vs how editorial split, relevance-based links, equipment purchase uncertainty, and explicit deleted tasks.

## Manual cross-check completed / pending
- [x] Repo metadata and all five root documents inventoried in P0.
- [x] Seven topic catalogs created and eight rationale summaries backed by original evidence.
- [x] Legacy Decision Log heading index covers **all 56** H2/H3 headings (not a claim that every sentence is a separately interpreted ADR).
- [x] Independently-scoped fishing backlog and explicitly deleted task IDs retained.
- [x] Five active-doc candidates, static prompt and router created without modifying originals.
- [x] Current V3 private deployment and field evidence left **unknown** where source-only review cannot prove otherwise.
- [x] Basic relative-link review of router/prompt/active docs and catalog/record references found no broken paths in the audited doc branch.
- [ ] Automated P3 validator passing in a real docs-only PR, including negative fixtures and check-run evidence.
- [ ] P4 independent new Fishing-project chat can find past rejected decisions and reconcile ambiguous in-flight operations.
- [ ] P5 approved default-branch router and final owner adoption; original legacy handoff still honored until then.

## Known gaps, not silently asserted as complete
- The 56-section crosswalk points to every original heading but does **not** guarantee full semantic analysis of every mixed checkpoint paragraph; the 48 curated entries are a prioritization of reusable decisions, supplemented by original complete Git history.
- Some historical owner discussions may exist only in old chats, never captured in GitHub; this method cannot reconstruct evidence that does not exist in the repository. Missing critical rationale should be flagged rather than fabricated.
- A small topic index improves recall but cannot guarantee semantic completeness; P4 must test representative rejected approaches.
- The router on the documentation branch is **not installed on default `main`**; the user must not treat it as a production-ready emergency recovery path yet.
- No private Worker version or current Pages hosted bytes verified for V3 as part of this documentation refactor. A source green/CI green remains independent of hosted or owner acceptance.
- `FISH108` continues to require a separately scoped **full validation** PR for executable doc tooling and workflow changes; [tooling PR #285](https://github.com/ginosega/fishing/pull/285) remains separate and has no public deployment authority.

**P2 recommendation:** Do not rewrite the original giant root files or perform any undocumented archival deletion. Keep new docs unmerged until P3 validator and P4 cold-start are accepted; only then activate the default-branch router under the existing docs-only/no-deployment guardrails.
