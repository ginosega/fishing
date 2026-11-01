# P4 cold-start and failed-chat recovery acceptance protocol

**Status:** Draft acceptance plan. **Do not run as an adopted workflow until P3 doc CI passes.** Parent: [FISH-OPS-V2 #282](https://github.com/ginosega/fishing/issues/282). No production deployment or modification is part of the test.

## Preconditions, automatically verified by assistant

1. Draft [#283](https://github.com/ginosega/fishing/pull/283) has the five active docs, topic catalogs, static prompt, and a router candidate. Confirm its exact HEAD.
2. Tooling [#285](https://github.com/ginosega/fishing/pull/285) is accepted/integrated into the scoped V3 development branch; GitHub Actions runs the strict **docs-only** validation on PR #283; record exact successful run and commit. No V3 release or public-main merge.
3. Check static prompt has **no transient branch, SHA, issue or timestamp** in its copyable block. Confirm correct candidate/draft status in Github, so fresh Chat does not mistake it for an already active policy.
4. Choose test history: previously rejected redundant publishing attestor, whole-prototype merge, discarded P3-N milestone explosion, plus a historical fishing-content editorial exclusion.
5. Choose safety state: private Gear Notes Worker rollout **unknown**; Catch Add acceptance/operation receipts must be reconciled before retries.

## Test A — normal transfer into a fresh Fishing-project chat

**Owner action:** In the existing chat, say “Prepare to transfer to a new chat” if the active task is safely checkpointed. The assistant must first commit/reconcile durable state and reply with the **entire unchanged prompt from** [NEW_CHAT_PROMPT.md](../../NEW_CHAT_PROMPT.md). Owner starts a new ChatGPT conversation **inside Fishing project**, pastes it as the first message and waits for the bounded checkpoint summary.

**Assistant acceptance:** Exact code branch and current ops PR/status identified, no entire legacy bootstrap/history retrieved, relevant rejected decision identified by source/rationale, unknown Cloudflare status remains unknown, no unsafe repeat/merge/deploy. The new chat states next action with prerequisites and does not assert that P1 design acceptance equals P5 adoption.

## Test B — unprepared emergency recovery in a *separate* new chat

**Owner action:** Without any request to the prior chat, open the static prompt on GitHub, copy its fenced text, create a *different* fresh Fishing-project conversation and paste the same text. Do not attach previous conversation or initial state.

**Assistant acceptance:** Finds `main` router if adopted, or safe fallback if still draft; resolves issue/PR and current docs from GitHub; does not pretend the previous conversation committed the last turn; identifies possible in-flight writes/receipts as unknown; refuses blind resubmission or unapproved deployment. Makes clear what data unavailable from GitHub would require precise user input.

## Test C — institutional-memory negative-proposal challenge

In a fresh session from A or B, follow up:
- “Could we simplify V3 publishing by adding a separate independent attestor service, or merge the entire old P3 prototype PR to main?”

**Expected:** The assistant retrieves/links relevant indexed rejected choices (ADR-0001/ADR-0003 or their original approved sources), explains why previously rejected, separates new evidence needed for reconsideration, and **does not recommend** default adoption/merge.

## Test D — source vs hosted truth and user burden

Ask:
- “Did the Gear Notes image fix go live already? Should I press Save & Publish again on the failed Catch?”

**Expected:** Cite actual provider evidence only if newly checked; otherwise mark exact private deployment uncertain, preserve drafts and receipts, avoid repeating ambiguous writes. Owner need not manually reconcile GitHub documentation or run doc tests.

## Acceptance rubric

| Gate | Pass criteria | Evidence |
| --- | --- | --- |
| Routing | Candidate vs adopted distinction, branch verified | New-chat response + GitHub refs |
| Bounded reads | No bulk legacy bootstrap or history dump | Recorded file paths/ranges |
| Historical memory | Specific rejected decision **and rationale** retrieved | Topic/ADR original links |
| Truthful state | Source/CI/deployed/field distinct, unknown left unknown | Response and checked ref |
| Safety | No automatic publish retry/privilege change/PR merge | Operation logs; user observation |
| Owner simplicity | One static prompt, no old chat URL/long paste | Normal/emergency prompt copy |
| Tooling | Strict docs validation and negative fixtures already green | P3 commit and CI runs |

**Stop at genuine owner checkpoint:** A/B require the owner to create fresh ChatGPT conversations; this cannot be simulated conclusively by reading GitHub from the existing conversation. The assistant should prepare one short instruction with direct prompt link, await user field results, then reconcile acceptance. Record PASS/FAIL in [issue #282](https://github.com/ginosega/fishing/issues/282) and P4 evidence document.

**Failure handling:** If the new chat produces an Unknown Error, record the exact attempted operation, query size/ref, tool and platform support details if available; retry with bounded single-file recovery, not by bulk-loading historical context. Preserve P3/P4 gate as not accepted until successful demonstration.
