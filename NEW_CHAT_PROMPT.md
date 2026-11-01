# Fishing Companion — static new-chat and emergency recovery prompt

**Status:** Candidate for Operating Model v2; not yet adopted. The **prompt text below is deliberately free of current branch names, commit hashes, issue numbers and dates.** After acceptance it must be accessible on the repository's default branch. Dynamic context and the active docs branch live in the short `PROJECT_ROUTER.md`, also on the default branch. The old five-file bootstrap is historical.

## Copy only the contents of this prompt block

```text
Continue my Fishing Companion project from the latest durable GitHub state. The previous chat might have failed mid-operation.

Use the connected repository ginosega/fishing. On its default branch, first read PROJECT_ROUTER.md to locate the active workstream, working branch, and approved operating-model entry point. Verify those pointers against current GitHub refs and PRs. If the router is absent, stale, or unclear, inspect the repository's README and relevant open issues/PRs to establish the latest approved source of truth; explicitly identify uncertainty rather than adopting a draft or guessing.

Follow the entry point's bounded-reading instructions. Read only the current state and relevant work queue, then retrieve applicable operating rules and decision history on demand. Before suggesting a substantive approach, check the indexed accepted, rejected, deferred, and superseded decisions for prior lessons and constraints. Do not bulk-read old chat histories or the legacy full bootstrap.

Independently reconcile code/CI evidence with private or public deployment and owner field acceptance. Treat possibly in-flight or interrupted writes as unknown until proven; never blindly repeat them or discard drafts/receipts.

Before continuing work, briefly report the last verified checkpoint, unresolved operations, relevant historical decisions, and next safe action. Ask me only for essential information that cannot be recovered from the available evidence.
```

## Use this prompt for either kind of chat transfer

**Planned:** In the old chat, say **"Prepare to transfer to a new chat."** The assistant checkpoints safe durable state and reproduces the **exact prompt block above** in its final response so you can paste it into a new Fishing-project conversation.

**Emergency:** If the old chat crashes or becomes too long, do not require it to prepare anything. Open this file on GitHub's default branch, copy the same prompt block, create a new Fishing-project chat, and paste it. You do not have to provide a chat URL, transcript or old bootstrap.

**Limits:** If a fact never reached GitHub or an external provider/device cannot be queried, the assistant must report the gap, avoid unsafe assumptions and request only the narrow missing information.

**While this file is a draft:** This candidate alone does not activate Operating Model v2. The default-branch router and approved operating docs must be published and cold-start-tested at P4/P5 before replacing the historical transfer process.

**Maintenance:** The prompt text changes only when the recovery protocol changes. Never embed current task status, branch names, source SHAs or temporary initiative IDs here. Maintain dynamic routing in `PROJECT_ROUTER.md` and status in `CURRENT_STATE.md` instead.
