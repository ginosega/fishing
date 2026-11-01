# Fishing Companion — new chat and emergency recovery prompt

**Status:** Proposed under [FISH-OPS-V2 #282](https://github.com/ginosega/fishing/issues/282); this draft copy is **not yet the adopted project handoff procedure**. After P4 cold-start acceptance and owner approval, make this file discoverable on the repository default branch `main`, linked prominently from root README. Keep this prompt short and update branch routing in GitHub instead of embedding large histories.

## Copy everything in this prompt block into a new ChatGPT chat

```text
Continue my Fishing Companion project from the last durable GitHub checkpoint. This may be recovery after a failed or overlong chat; do not assume the previous conversation completed its last operation.

Use the connected GitHub repository `ginosega/fishing`. Read the operating-model routing instructions in `README.md` on `main`, then the designated `project-ops/v2/START_HERE.md` on the branch that routing identifies. If that routing is not yet installed, consult initiative issue #282, draft PR #283, and development branch `feature/fish118-p3-mock-publisher` to establish which operating documents are **approved and active**, not merely proposed.

Use bounded reads of current state and work queue; retrieve relevant requirements, decision records and evidence only as needed. Do not bulk-load the legacy bootstrap or previous conversations.

Reconcile latest Git refs and CI, and distinguish source validation from private/public deployment and owner field acceptance. Treat an interrupted publish or provider operation as **unknown until independently verified**; do not blindly retry it, discard drafts/receipts, merge or deploy.

Before making changes, briefly report: (1) last durable checkpoint, (2) current work and unresolved or potentially in-flight operations, (3) relevant previous rejected approaches or safety decisions, and (4) the next safe action and its prerequisites. Ask me only for essential information that cannot be recovered independently.
```

## User instructions (normal or emergency)

**Normal transfer:** Tell the current chat **"Prepare to transfer to a new chat."** The assistant commits/verifies durable state and replies with the **entire exact prompt above**, ready to copy. Start a new chat **inside the Fishing project** and paste it.

**If the old chat fails or becomes unusable:** Do **not** return to the failed chat or wait for it to prepare a handoff. Open this file in GitHub, copy the same prompt above, start a fresh chat inside the Fishing project, and paste it as the first message. No previous chat URL, full transcript, large bootstrap, screenshots or additional instructions are routinely required. If necessary, the new assistant will ask narrowly for a fact that never reached GitHub or an inaccessible provider/device result.

**Recovery limitation:** Uncommitted chat-only decisions, local unsaved editor content and ambiguous provider operations may not be reconstructable from GitHub. The new assistant must mark them unknown, consult available evidence and **avoid re-submitting ambiguous operations**.

**During migration (before Operating Model v2 acceptance):** This prompt is a *candidate*; check issue #282 and PR #283 to distinguish draft from adopted files. Do not treat the unmerged docs branch as active authority until approved.

**Maintainer rule:** The normal-transfer response must include the exact current copyable prompt from this file, not merely a link or the instruction "read the bootstrap." Do not require the user to create or transcribe custom handoff content.
