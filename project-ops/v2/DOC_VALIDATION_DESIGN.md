# FISH-OPS-V2 — P1 Documentation Validation Design and Rollout

**Status:** **P1 design accepted on 2026-11-01** ([sign-off](P1_DESIGN_APPROVAL_2026-11-01.md)); validator implementation/proof and P5 activation still separate gates.
**Tracked action:** [FISH-OPS-V2 P3 documentation validator — issue #284](https://github.com/ginosega/fishing/issues/284)
**Parent:** [initiative #282](https://github.com/ginosega/fishing/issues/282) · [independent governance PR #288](https://github.com/ginosega/fishing/pull/288) · [owner-approved decoupling](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md)
**Inputs:** [P1 operating-model design](P1_OPERATING_MODEL_DESIGN.md), [audit](AUDIT_2026-10-31.md), and `.github/workflows/fishing-production.yml` in the verified V3 source baseline.

## 1. Explicit decision to make in P1

**Recommend automated local + CI structural validation, plus mandatory assistant-performed semantic/evidence review and owner authorization only where required.** The earlier phrase "manual-only checks" referred to the former assistant-maintained, ad hoc comparison of root files and `git diff --check`; it did **not** mean the user was responsible for formal manual validation. Such checks were insufficient to prevent repeated file sprawl, broken routing, or missing required status. Automated checks alone cannot determine whether a Cloudflare deployment is real or a product decision has legitimate owner authorization. Assistant analysis is **not** a substitute for a specifically required independent human sign-off.

This issue is **not optional backlog**: the new operating model is **not adopted** until the validator is implemented, its positive/negative cases are exercised, and an actual docs-only PR runs the check. Do not start it prematurely while the P2 document formats are still changing.

## 2. Validator scope

**Validate only:**
- The five active files under `project-ops/v2/`, the indexed topic catalogs and declared ADRs, plus the **static** root `NEW_CHAT_PROMPT.md` and default-branch `PROJECT_ROUTER.md` after adoption.
- Files changed in the current PR when they are inside those active paths, plus historical-approval paths only to confirm no unreviewed modifications.
- The invariant that there is **one active owner** for each named state/work item/decision; the legacy root documents are explicitly historical.
- Accepted project Markdown conventions. Do not parse and lint every Gear/KB/Catches content page as a documentation-governance file.

**Do not do:** GitHub API probes, online link crawling, Cloudflare/Pages access, external network calls, reading private credentials, running scripts embedded in Markdown, inferring hosted status from CI, or rewriting files automatically during CI.

## 3. Minimal machine-checkable document conventions

Use **Markdown headings and fixed field labels**, not a second editable JSON/YAML "state database". Avoid a sprawling schema or a dependency-heavy Markdown compiler. Proposed examples:

`START_HERE.md`: required `#` title, `## Read order`, `## Evidence boundaries`, and links to `CURRENT_STATE.md` and `WORK_QUEUE.md`.

`CURRENT_STATE.md`: required `Last reconciled (UTC):`, `Source baseline:`, `## Environments`, `## Active workstreams`, and each active workstream row carries `Source`, `CI`, `Private hosted`, `Public hosted`, `Field acceptance`, `Observed at`, `Evidence`. A state may explicitly be `unknown`.

`WORK_QUEUE.md`: `## <stable-id> — <title>` with required lines `State:`, `Owner:`, `Next safe action:`, `Prerequisites:`, `Acceptance:`, `Evidence:`. IDs are unique within the document. A closed/accepted item should leave the active queue and remain discoverable in GitHub history/issues.

`OPERATING_RULES.md`: required sections for `Authority and evidence`, `Owner approval gates`, `Publishing and recovery`, `Release validation`, `Project handoff`. It links to FISH108 and exact approved baseline/amendment records.

`DECISIONS_INDEX.md`: **topic directory only**, with unique topic keys, descriptions, search keywords/synonyms and relative links to `decisions/topics/*.md`; it must not accumulate every decision in a single giant table. Each **topic catalog** contains one row per substantive decision with unique ID, topic/tags/aliases, `status` (`accepted`, `rejected`, `deferred`, `superseded`, `proposed`), concise reason and canonical detail link/supersession. Old owner approvals keep their existing record/ID links. `decisions/records/ADR-*.md` have required evidence, alternatives, rationale and reconsideration conditions where applicable.

`PROJECT_ROUTER.md` (default branch, **only after adopted**): stable title, `Primary workstream:`, `Active workstreams:`, `Routed branch:`, `Entry point:`, `Routing reviewed at:` and evidence/PR reference; no page-sized status history. Branch and cross-ref existence are reviewed against GitHub on chat start rather than asserted by local-only CI.

`NEW_CHAT_PROMPT.md`: one short fenced text block containing **no specific current branch, issue/PR number, SHA or date** and instructions to look up the default-branch router, handle absent/stale routing, check prior rejected decisions and avoid ambiguous write retries. CI validates its static contract; any new project state goes in router or current-state, not this prompt.

Standards are **not fixed until the first five working files are drafted and tested**. Define them once in the validator rather than keeping two independent schema specifications.

## 4. Automated checks — severity and ownership

| Check | Behavior after rollout | Why |
| --- | --- | --- |
| Mandatory five active docs and essential headings/field labels | **Fail** once active | Avoid missing routing or unverifiable state |
| Static recovery prompt with forbidden temporary identifiers | **Fail** | Prompt must remain usable months later |
| Adopted default-branch router format and presence | **Fail after activation**; validate sample/contract before activation | Stable discovery despite branch changes |
| Topic catalog links, unique decision IDs and supersession chain | **Fail** | Bounded searching without losing past rejected options |
| UTF-8 bytes / docs budgets | **Warn** above soft target; **fail** above hard cap | Prevent a new uncontrolled document monolith |
| Unique work IDs, ADR IDs and active-authority owners | **Fail** | Prevent contradictory duplicate state |
| Allowed status vocabulary, unknown/not-verified permitted | **Fail** malformed values | Preserve source/CI/hosted/field truthfulness |
| Evidence URL/ref + `observed_at` for *asserted external verified state* | **Fail** when missing | No unverifiable "deployed" or "field accepted" assertions |
| Local relative file links | **Fail** on missing file, escaping repo, or clear broken target; avoid false positives on GitHub-style anchors | Startup references must be usable |
| Git diff touches an original approved baseline or approval record unexpectedly | **Fail** unless separately allowed by explicit scope review | Preserve exact signed-off provenance |
| Full old-bootstrap copy or duplicated large current-state section in active files | **Fail** for explicit known forbidden patterns; **warn** for heuristic near-duplication | Prevent repeat sprawl, without pretending to semantically understand all prose |
| Stale historical assertion/timestamp | **Warn** with observed date, no fabricated current result | Old evidence may remain valid as historical fact |
| External HTTP link availability | **Not checked in CI**; manual as needed | Network errors and security costs cause flaky CI |
| Whether owner really approved a change, actual private/public hosted identity, or user device behavior | **Human gate** | Tools and text cannot establish these facts alone |

**Important:** Treat any unreviewed claim of `verified` without origin, timestamp and evidence as a hard validation failure. However, a dated historical source or `unknown` should be legal. Do not require a current Cloudflare query to validate a pure documentation PR.

### Size targets (UTF-8 bytes)

| Document | Soft warning | Hard limit |
| --- | ---: | ---: |
| `START_HERE.md` | 2,048 | 4,096 |
| `CURRENT_STATE.md` | 8,192 | 12,288 |
| `WORK_QUEUE.md` | 10,240 | 16,384 |
| `OPERATING_RULES.md` | 10,240 | 16,384 |
| `DECISIONS_INDEX.md` | 5,120 | 8,192 |

If a safety rule legitimately exceeds the hard limit, move the detail into a **specifically linked reference** and retain the effective rule/trigger in `OPERATING_RULES`. Exemptions require documented review; do not silently raise limits to bypass a failing check.

## 5. Negative and positive fixtures

Automated tests should cover:
- Valid minimal five-file project, with an explicit `unknown` private Worker status: PASS.
- Missing `START_HERE`/state document or section: FAIL.
- Bad relative path including `../` traversal outside repo: FAIL.
- Duplicate work ID and conflicting active owner: FAIL.
- Duplicate accepted ADR ID or unlinked supersession: FAIL.
- `CURRENT_STATE` says `verified private hosted` with no date or evidence link: FAIL.
- Intentional `unknown private hosted` state: PASS.
- Oversized current document: WARN at soft, FAIL at hard.
- Unreviewed edit to original Oct 19 approval record: FAIL.
- Dated prior CI described as historical rather than current: PASS.
- Attempt to paste historical full bootstrap into active START_HERE: FAIL.
- Non-V3 gear/KB Markdown unaffected by validator: PASS.

Run the same fixture suite locally and in CI. Errors must include filename, field/line where practical, and a brief resolution path.

## 6. Amended P3–P5 sequence — governance independent of V3

**Owner-approved replacement:** [November 1 independent-governance amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md) supersedes the original V3-based tooling and merge sequence. Earlier design discussions remain historical evidence but **must not be executed**. [Validation runbook](VALIDATION_RUNBOOK.md) defines the effective independent checks.

**P2 — completed as a draft:** Copy the governed Markdown docs by identical Git blobs onto a branch based directly on `main`; preserve legacy approvals, source and full V3 separation. Working [PR #288](https://github.com/ginosega/fishing/pull/288) remains draft.

**P3 — independent verification:** (a) existing `main` docs-only GitHub Actions checks (whitespace + `fishing-merge-ready`); (b) deterministic standalone governance-document validation, using pinned source, required fields, local links, budgets, decision IDs/provenance and negative fixtures; (c) triggered semantic/evidence review. Record reproducible results in a dated audit document, not a claim of application release readiness. The earlier [isolated strict docs run #41332302407](https://github.com/ginosega/fishing/actions/runs/41332302407) is supplementary historical proof, not the new branch's exact-head result.

**P4 — owner fresh-chat recovery:** Test the **static prompt** twice in fresh Fishing-project conversations while PR #288 remains draft: verify safe fallback when the default-branch router is absent, topic-specific rejected-decision retrieval, precise source vs hosted truth, and no blind retry. This requires no PWA browser suite.

**P5 — owner adoption:** Present full P3 and P4 evidence and clearly state whether structural validation runs are **assistant-executed per change**, versus an **automatically enforced required GitHub CI check**. The latter is **not yet installed**. Owner explicitly accepts or declines that remaining enforcement limitation before activation. Only after approval may the docs-only PR merge into `main` and the static prompt/router become discoverable on the default branch; recheck no published application changes.

**Future automatic enforcement:** Keep [issue #284](https://github.com/ginosega/fishing/issues/284) open for a truly independent governance validation integration. Do not add executable code or change `.github/workflows/fishing-production.yml` in the docs-only PR, relax FISH108 or invent a CI exemption. A later approved architecture must preserve application release gates and may require a separate execution environment.

**Historical abandoned path:** V3-targeted PR #285 is unmerged and is not a prerequisite. Existing PWA browser timeout issue #287 remains solely an application workstream.

## 7. Operational maintenance after rollout

- Every active-doc change **must receive independent deterministic validation** per [VALIDATION_RUNBOOK.md](VALIDATION_RUNBOOK.md) before acceptance; the existing PR docs lane currently checks whitespace only. Permanent automated-on-every-PR enforcement is not installed and remains tracked in #284. Content-only PWA releases do not require a governance-doc update.
- If validators fail, correct the underlying state or explicitly mark unknown; never mask missing proof with fake SHA/timestamps or downgrade security checks.
- Review validators alongside schema changes; expanded project docs must preserve small entry and ownership rules.
- The human closeout review still verifies current Git/CI/provider/device facts, owner decisions and legal branch/merge boundaries.
- CI can prevent structural degradation; it **cannot** prove ChatGPT will never produce an Unknown error.

## 8. P1 acceptance for documentation validation

- [x] Owner agrees to **automated structural checks + triggered assistant-performed semantic/evidence review**, with actual owner sign-off only when an existing authorization or acceptance gate requires it.
- [x] Owner approved the initial staged sequence; **later superseded** by [decoupling amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md): independent governance validation without V3 browser-suite dependency.
- [x] Owner agrees to the scope, soft/hard budgets, failure-vs-warning policy and explicit allowance for unknown status.
- [ ] Owner must review the disclosed distinction between **passing independent per-change checks** and **permanent CI enforcement** at P5; issue #284 remains open until an independently integrated, automatically enforced governance check exists.

## 9. Continuous prevention, Tier 2 triggers and rejected-decision coverage

**Prevent, then audit:** Every operating-doc PR runs objective validation; it does not wait for a periodic reconciliation. Every substantive modification also receives a short semantic review **before merge**, checking that the authoritative state owner has been updated *in place* and that no new "current/latest" prose duplicates or contradicts an existing active record. Milestone audits are secondary backstops, not the basic sprawl-control process.

**Triggered semantic/evidence checks:** Before material requirement/UX/architecture changes, independently inspect accepted, rejected and superseded decisions; before deployment/permissions/merge/cutover, inspect authorization plus exact source/provider gates; before marking deployed/accepted/closed, inspect direct time-stamped evidence; when a provider outcome is ambiguous, preserve receipts and avoid blind retries. The assistant records the trigger and evidence link in its PR/issue. Owner participation is required only for consequential approval, unavailable owner-device observations, or designated project acceptance.

**Validator requirements extended for historical lessons:** Decision records/index must declare `status: accepted | rejected | superseded | deferred | proposed`, topic/component tags, original rationale or a durable pointer, `alternatives_considered`, and `reconsider_only_if` for a known rejected approach where applicable. Avoid pretending all prior chat-only decisions were recorded; migration must mark missing negative-decision coverage as unresolved for curator review. The pre-proposal decision lookup is a **Tier 2 semantic rule**; structural CI checks the index and link presence, but cannot guarantee correct semantic retrieval.

**Additional fixtures:**
- A static recovery prompt without named active branch/issue/commit: PASS, even when workstream changes; a prompt with a hardcoded development branch, PR or SHA: FAIL.
- A router naming a nonexistent local active-document path: FAIL when same-ref; cross-branch pointer syntax must validate offline and its current target must be confirmed in human/CI integration evidence.
- A topic catalog with unique IDs and valid canonical links: PASS; broken topic link or unresolved supersession: FAIL.
- A decision catalog expanded beyond its topic hard cap: FAIL until it is split by meaningful subtopic.
- Repeating a long obsolete "latest checkpoint" in two active files: automated fail for deterministic duplicate text, manual semantic fail for paraphrased duplication.
- Duplicate effective status owners with different words: schema failure where authority IDs disagree; manual review otherwise.
- New ADR tagged `rejected` without rationale/reconsideration link: fail.
- Significant technical proposal that reintroduces a previously rejected architecture without discussing its rejection: Tier 2 review failure and cold-start adversarial test.
- Normal owner content publication with no operational-model change: must not require an irrelevant current-state update or full-document audit.
- Emergency-start scenario with draft model files: new chat must distinguish proposed vs adopted docs, not silently promote a draft.

**Owner burden:** Routine validator failures, source reconciliation, duplication corrections and handoff preparation are maintained by the assistant. Owner is asked for only (a) material approvals, (b) evidence solely available to owner, (c) final P1/P5 acceptance. Do not add a second per-PR human certification ceremony for the owner.

**Static recovery prompt and routing:** [`NEW_CHAT_PROMPT.md`](../../NEW_CHAT_PROMPT.md) is a required P2/P4 acceptance artifact, with the *same prompt* for a planned transfer or unexpected failed chat. A small `PROJECT_ROUTER.md` on default `main` (after adoption) points to the current workstream branch and approved docs. Validate presence, prompt-block size/bounded instructions, no temporary branch/issue/SHA references, safe stale-router fallback, explicit unknown in-flight operations policy, and no full-bootstrap paste requirement. The router changes only when workstream/branch/entry changes. A normal transfer reply must reproduce the exact prompt, not rewrite it.

**Separate work item:** These validator requirements are tracked by [#284](https://github.com/ginosega/fishing/issues/284), with the same FISH108 full-lane safety constraint for executable/workflow changes. The implementation may not be marked complete before documented fixture results and a real docs-only PR CI run.
