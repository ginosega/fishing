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
Evidence: [Audit procedure](SEMANTIC_AUDIT_SOP.md), [automated governance validation](VALIDATION_RUNBOOK.md). Scheduled audit created 2026-11-01; first scheduled run has not yet executed.

## FISH-TODO-118 — Fishing Companion V3 continuation

State: in-progress
Owner: project owner / assistant implementer
Next safe action: **Do not repeat completed #310/#311 private deployment or field tests.** For publishing performance [#305](https://github.com/ginosega/fishing/issues/305), the six-run D1 timing investigation is complete. Candidate source `22d83329c5aca4f8fb7c708b22bcc3e3222ceeaf` uses concurrent independent read-only GitHub main/PR checks in Checking and before Merging, retaining all exact-head CI, merge and final main protections. [Exact-head CI #41469136882](https://github.com/ginosega/fishing/actions/runs/41469136882) **SUCCESS**. **Owner-run guarded private-only deployment completed** at Worker `c75de1df-09d7-4da0-99f1-2f945d10c844` (2026-11-02 UTC), with terminal-confirmed anonymous access protections and public V2 digest unchanged. Do not redeploy. Three owner-timed text-only Notes publications finished: KB 72s ([sandbox #53](https://github.com/ginosega/fishing-p3-sandbox/pull/53)), Gear 80s ([#54](https://github.com/ginosega/fishing-p3-sandbox/pull/54)), Catch 70s ([#55](https://github.com/ginosega/fishing-p3-sandbox/pull/55)), average 74s and **0/3 ≤60s**, versus matched prior 63/64/53s, average 60s. Each new sandbox PR is independently confirmed merged after successful CI; GitHub timestamps show both longer CI and longer PR-to-merge intervals. Do not infer cause or roll back from three samples. **Read-only D1 comparison COMPLETE:** matched KB D1 **53→60s**, Gear **57→74s**, Catch **46→61s** (mean **52→65s**, +13); Validating uniformly **+4s**, Checking **+3/+10/+7s**, Merging **0/+1/+1s**. No measurable Merging improvement or evidence the source optimization caused the slowdown. Outside D1 changed only **+1s on average**, while owner end-to-end mean increased **60→74s**. **Next safe action:** stop speculative performance changes and retain the current guarded private deployment pending a product-owner decision on whether to retain the firm 60s acceptance gate versus explicitly amend it to accommodate ~70–80s; keep issue #305 OPEN/failed in the meantime. Other independent V3 work may continue. No new deployment. Independently validate [#303](https://github.com/ginosega/fishing/issues/303) exceptional alarm/Cron recovery without replaying old operations. Inline Notes derivatives [#301](https://github.com/ginosega/fishing/issues/301) remain deferred post-V3.
Prerequisites: Latest development branch `feature/fish118-p3-mock-publisher` candidate `22d83329c5aca4f8fb7c708b22bcc3e3222ceeaf` passed [CI #41469136882](https://github.com/ginosega/fishing/actions/runs/41469136882) (including PowerShell parser); private deployed version **owner-terminal confirmed** as `c75de1df-09d7-4da0-99f1-2f945d10c844`; measured latency effect is **not favorable on initial 3-run field sample (72/80/70s)**; stage-level cause remains **unverified**. Prior accepted fix source `1d34f5d5801e21eb23817ef4e6872a7bc6da5a0d` passed [CI #41403337380](https://github.com/ginosega/fishing/actions/runs/41403337380) (808 backend tests, zero failures). Owner reported successful guarded **private-only** #310/#311 fix deployment Nov 1 PST / Nov 2 UTC (intermediate Worker ID not recorded), then separately confirmed the 2026-11-02 UTC read optimization deployed with new Worker version `c75de1df-09d7-4da0-99f1-2f945d10c844` (prior `af78819d-4e1c-48ae-812a-99c5c630a0ca` superseded). No public V3 cutover approval; public V2 remains unchanged. Owner field evidence and direct Cloudflare provider inspection are different assurance levels.
Acceptance: The owner verified saved inline Notes images reappear in Edit Item → Preview Markdown ([#310 completed/closed](https://github.com/ginosega/fishing/issues/310)) and Catch Notes-only Publishing Status displays species and date rather than “Catch · Undated” ([#311 completed/closed](https://github.com/ginosega/fishing/issues/311)). Original stuck KB PR #45 recovered to Live without a duplicate merge. All six owner publications [PRs #46–51](https://github.com/ginosega/fishing-p3-sandbox/pulls?q=is%3Apr+is%3Amerged) reached Live: KB Notes 63s; Gear Notes+image 71s; Gear Notes 64s; Gear Notes+Specification/Link 62s; Catch Notes 53s; Catch data-only 62s. **Mean 62.5s; only 1/6 ≤60s (1/5 non-image); sustained V3-SAVE-09 performance acceptance NOT MET.** #303 fast recovery after exception not yet field-proven. Species-derived Catch cover untested due private sandbox asset absence. D1–D6 functional/security/device acceptance and final release/cutover gates remain in effect.
Evidence: [#310](https://github.com/ginosega/fishing/issues/310), [#311](https://github.com/ginosega/fishing/issues/311) owner-reported private deployment and field acceptance Nov 1 PST / Nov 2 UTC; source [CI #41403337380](https://github.com/ginosega/fishing/actions/runs/41403337380); performance [#305](https://github.com/ginosega/fishing/issues/305); watchdog [#303](https://github.com/ginosega/fishing/issues/303); prior cross-domain Notes recovery [CI #41398731923](https://github.com/ginosega/fishing/actions/runs/41398731923).

## Independent fishing equipment and editorial backlog

Open, closed and explicitly deleted personal fishing/gear/KB tasks remain discoverable at [FISHING_BACKLOG_INDEX.md](FISHING_BACKLOG_INDEX.md); do not absorb into V3 milestones or reopen silently.
