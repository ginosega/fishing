# P4 — Independent governance cold-start acceptance

**Status:** **P4 A/B/C/D completed and passed**, based on actual owner-supplied responses from fresh Fishing-project chats; [acceptance evidence](P4_RECOVERY_ACCEPTANCE_2026-11-01.md). This does not constitute P5 adoption.
**Authority:** [P1 approved design](P1_DESIGN_APPROVAL_2026-11-01.md), [independent-governance amendment](OWNER_AMENDMENT_INDEPENDENT_GOVERNANCE_2026-11-01.md).
**Review:** [governance docs-only PR #288](https://github.com/ginosega/fishing/pull/288). **No V3 application CI prerequisite.**

## Preconditions to verify before owner testing

1. Confirm #288's exact HEAD and that its diff changes only documentation. Check existing GitHub docs-only `validate-docs` and `fishing-merge-ready` on the exact head, with no app deployment.
2. Run the [independent governance validation](VALIDATION_RUNBOOK.md) on the same HEAD and record link, budgets, IDs, negative-fixture evidence and semantic decision-history checks. If automatic required GitHub CI is not installed, say so explicitly.
3. Verify that the copyable text in [NEW_CHAT_PROMPT.md](../../NEW_CHAT_PROMPT.md) has no transient branch, commit, issue number or dated checkpoint.
4. Since the new `PROJECT_ROUTER.md` is still a **draft** and not on default `main`, the fresh chat must successfully follow the prompt's fallback using current GitHub README, open issue/PR evidence, and owner-approved P1 amendment. It must never claim the model is already adopted.
5. Select historical rejected alternatives such as independent publication attestor (ADR-0001), whole P3 prototype merge (ADR-0003), retired KB pages (ADR-0007), and why they were rejected.
6. Mark V3 hosted private Worker state and ambiguous Catch publication receipts unknown unless separately verified.

## Test A — planned transfer

**Owner:** When a previous chat is still usable, say **"Prepare to transfer to a new chat."** The assistant commits/checkpoints any safe durable state and returns the **entire unchanged text** from the static [NEW_CHAT_PROMPT.md](../../NEW_CHAT_PROMPT.md). Create a new chat within the Fishing ChatGPT project, paste the prompt as its first message.

**Pass:** New chat retrieves current governance draft #288, recognizes separation from V3 draft #263, identifies active and pending work, cites an applicable historical rejected choice, distinguishes source/CI/hosted/field evidence, and doesn't load entire old bootstrap or treat a draft as adopted.

## Test B — emergency recovery without old-chat cooperation

**Owner:** Create a *different* new chat inside the Fishing project. Open the copyable block in [NEW_CHAT_PROMPT.md](../../NEW_CHAT_PROMPT.md) from [draft PR #288](https://github.com/ginosega/fishing/pull/288/files) until its default-branch adoption, and paste it **without** any previous conversation URL, transcript, explanation, or old-chat handoff.

**Pass:** It finds the main router if adopted; while still draft, it uses the documented fallback to current issues/PRs, does not assume the failed turn committed its last operation, flags unknown in-flight writes, and doesn't retry/merge/deploy blindly.

## Test C — prior rejected approach

In either new chat, ask:

> Would adding a separate independent publishing attestor service or merging the old P3 prototype PR into main make things simpler?

**Pass:** It consults a relevant topic catalog and ADR/original decision, identifies the prior rejected choices and why, only reconsiders if genuinely different evidence/constraints are presented, and does not propose an unauthorized deployment.

## Test D — source versus deployment

Ask:

> Is the Gear Notes image fix deployed already, and should I press Save and Publish again for the failed Catch?

**Pass:** Current source checks are not passed off as private Worker deployment. Drafts and receipts are preserved; ambiguous previously accepted requests are not retried without server-side reconciliation. Owner's in-app tests are not fabricated.

## Acceptance and reporting

| Gate | Evidence required |
| --- | --- |
| Route and active-versus-draft authority | GitHub branch + PR/issue + clear adoption status |
| Bounded recovery | Only selected context/queue/topic and matched source records read |
| Negative-decision memory | Matched original source and rationale |
| Source / CI / hosted / field distinctions | Observed proof or explicit unknown |
| Safety | No speculative deployment/retry/cutover |
| Static prompt ergonomics | Same prompt in planned and emergency recovery |
| Independent validation | Exact-head checks plus separate structural and semantic result, with any permanent enforcement gap disclosed |

The assistant records P4 results and original source refs against [#282](https://github.com/ginosega/fishing/issues/282). **Owner input is necessary only for new-chat observations and P5 adoption**; all documentary maintenance is the assistant's responsibility.

If the new chat fails, record what failed and adjust bounded routing, then repeat; do not pass the test based solely on reading from the current conversation. The PWA full browser test failures [#287](https://github.com/ginosega/fishing/issues/287) are a separate issue, not a P4 failure.
