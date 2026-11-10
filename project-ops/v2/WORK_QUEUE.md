# Fishing Project — active work queue

**Authority:** Canonical active state is `governance/project-ops`; default `main` `PROJECT_ROUTER.md` and `NEW_CHAT_PROMPT.md` are static entry points. [Operating rules](OPERATING_RULES.md) apply to subsequent work.

## FISH-OPS-V2 — Operating Model v2 adoption

State: closed
Owner: project owner; assistant implementation
Next safe action: Routine in-place upkeep only, through protected governance PRs; do not reopen migration solely because PWA app development resumes.
Prerequisites: P1 design approval and independence amendment; completed P2, P3, P4 and P5 evidence.
Acceptance: Five bounded current documents, permanent static transfer prompt/router, indexed accepted/rejected/deferred/superseded lessons and original sources, no duplicate active authority; owner-approved full adoption.
Evidence: [Owner directive](P5_OWNER_DIRECTIVE_COMPLETE_GOVERNANCE_2026-11-01.md), [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md), [main router PR #292](https://github.com/ginosega/fishing/pull/292), [ruleset #26335925](https://github.com/ginosega/fishing/rules/26335925).

## FISH-OPS-V2-VALIDATION — Required independent structural checks

State: closed
Owner: assistant implementer; project owner configured protected branch
Next safe action: Maintain validator and fixture checks through review/required CI on canonical governance branch; keep PWA release safeguards separate.
Prerequisites: `governance-docs` on `governance/project-ops`, required `fishing-merge-ready`, strict up-to-date status rules.
Acceptance: Valid governance PR PASS; invalid missing link FAIL; non-draft failing PR's GitHub merge state blocked; entire working corpus and ancillary docs covered; deleting all active docs no longer bypasses validator.
Evidence: [Issue #284](https://github.com/ginosega/fishing/issues/284), [ruleset](https://github.com/ginosega/fishing/rules/26335925), [negative block PR #296](https://github.com/ginosega/fishing/pull/296), [hardening PR #297](https://github.com/ginosega/fishing/pull/297).

## FISH-OPS-V2-RECOVERY — Bounded new-chat transfer

State: closed
Owner: assistant for ongoing maintenance; project owner accepted P4 field recovery
Next safe action: For normal handoff repeat exact unchanged fenced static prompt; for emergency recover it from default main and recheck router/refs.
Prerequisites: [P4 field evidence](P4_RECOVERY_ACCEPTANCE_2026-11-01.md) and active main router.
Acceptance: Both normal and emergency new-chat recoveries passed, including prior rejected alternatives and safe handling of unknown provider/publishing state.
Evidence: [P4 acceptance](P4_RECOVERY_ACCEPTANCE_2026-11-01.md), [static prompt](../../NEW_CHAT_PROMPT.md).

## FISH-OPS-V2-SEMANTIC-AUDIT — Ongoing semantic reconciliation

State: in-progress
Owner: assistant; weekly ChatGPT scheduled task for independent backstop
Next safe action: Run bounded semantic review at each major V3 decision, milestone and release/owner-acceptance checkpoint, plus weekly scheduled Fishing Semantic Audit; propose protected in-place governance corrections when evidence shows drift.
Prerequisites: [SEMANTIC_AUDIT_SOP.md](SEMANTIC_AUDIT_SOP.md) and available connected GitHub source; never treat inaccessible GitHub or unverified provider state as an audit PASS.
Acceptance: Dated evidence-linked audit summary after successful scheduled/checkpoint review; source, CI, hosted deployment, owner field acceptance and decision supersession remain accurately differentiated; verified corrections use the protected governance branch.
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md) and [validator](VALIDATION_RUNBOOK.md). At 2026-11-09 Stage A milestone audit, verified drift: old governance text claimed Stage A Pages/Worker unprovisioned and D6 hosted/field acceptance absent despite owner-confirmed provider and device PASS. The in-place correction [protected PR #397](https://github.com/ginosega/fishing/pull/397) **was merged after both required checks passed**; current owner downtime simplification is an additional scoped reconciliation, linked to [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6756201287). Default main remains `fc85bd38`, D6 draft [#395](https://github.com/ginosega/fishing/pull/395) exact-head [CI #42579092617](https://github.com/ginosega/fishing/actions/runs/42579092617) PASS, Stage A field [#377](https://github.com/ginosega/fishing/issues/377#issuecomment-6755722813). Owner-reported bytes/device data are not independent assistant HTTP fetches; weekly scheduled audit separate.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress — D5 authenticated private owner [#357](https://github.com/ginosega/fishing/issues/357) Windows/Android UX and private sandbox one-shot Save→Live owner PASS [#341](https://github.com/ginosega/fishing/issues/341). D6 static Stage A read-only hosted/field PASS, 577/577 checked bytes, public V2 unchanged. **D6 selective source-only stack through [draft #423](https://github.com/ginosega/fishing/pull/423) exact-head full CI PASS**: [run #42913593871](https://github.com/ginosega/fishing/actions/runs/42913593871) 425/425 source tests, 54 preview browsers, 56 production browsers, 4 dedicated accepted owner Connection Status tests; **no deployment, no real production session/write**. Current release-focused [draft #424](https://github.com/ginosega/fishing/pull/424) is a **read-only, real-record integrated owner Connection Status staging bundle**: CI packages immutable physical `fishing/` root with actual canonical-main Gear/KB/Catches and tests all three record domains; [run #42919892308](https://github.com/ginosega/fishing/actions/runs/42919892308) **pending**, no hosted/field acceptance. All D6 drafts remain unmerged.
Owner: project owner / assistant implementer
Next safe action: Finish #424 exact-head CI and verify the **d6-final-owner-real-records-source-only** artifact; obtain separate owner permission before staging or retargeting a Cloudflare Pages/Worker release. Validate actual existing records on hosted Windows Edge and Android and record source→hosted-byte evidence; **read-only is not full V3**. In parallel or next bounded phase, selectively integrate approved D5 Gear/KB/Catches authoring into D6 same-origin canonical session/source and durable guarded publishing, without wholesale prototype import or sandbox credential reuse. Production GitHub App/OAuth rights, D1 migration, public Worker/origin and final cutover each require separate owner approval. #396 final Connection Status is integration/field acceptance, **not UX redesign**; #342 draft durability/media remains provisional. Preserve ARC-007 single-user planned downtime simplification, not weaker security.
Prerequisites: Default-main PROJECT_ROUTER.md → protected `governance/project-ops`; separate D5 accepted owner source and immutable Stage A test site. Original prototype [#263](https://github.com/ginosega/fishing/pull/263) remains draft/unmerged; selective D6 source-only PR stack #395–#423 is not public production. Public same-origin `https://fishing.ginosega.workers.dev/fishing/` is proposed, not production-authorized. Decisions SEC-001/002/004/005, ARC-003/004/007 and PUB-002/003/004 apply.
Acceptance: Existing private D5 owner UX, static D6 Stage A and source-only CI have different evidence boundaries. #424 source-only artifact/CI, even if green, is **not** a deployed/read-write owner application. Need full integrated D5 editor and D6 canonical publisher, production provider credentials/permissions and approved migrations/routing, source/hosted release identity and 100% advertised file-byte proof, owner Windows/Android final acceptance, and a controlled real-record Save→GitHub→verified public Live edit. Do not merge any D6 draft to `main` (production auto-deploys on push) until explicit final cutover authorization.
Evidence: [D6 issue #377](https://github.com/ginosega/fishing/issues/377), [source CI #423](https://github.com/ginosega/fishing/actions/runs/42913593871), [read-only real-record draft #424](https://github.com/ginosega/fishing/pull/424), [approved D5 #357](https://github.com/ginosega/fishing/issues/357), [final UX #396](https://github.com/ginosega/fishing/issues/396), [provisional drafts #342](https://github.com/ginosega/fishing/issues/342), [owner downtime amendment](https://github.com/ginosega/fishing/issues/377#issuecomment-6756201287). CI, provider deployment, owner-device field acceptance and Live remain distinct.

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
