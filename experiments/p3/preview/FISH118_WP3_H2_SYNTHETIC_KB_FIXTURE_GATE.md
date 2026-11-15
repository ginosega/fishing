# FISH-TODO-118 WP3 H2 — exact synthetic KB fixture / source-only review

**Scope:** H2 synthetic package validation, no hosted publication, deployment, or credential change. This memo supplements the owner-reviewed [H2 activation packet](FISH118_WP3_H2_ACTIVATION_APPROVAL_PACKET.md) and new source-only H2 Worker/authorizer in draft #514. This source-only proposal does **not** constitute H2 GitHub App permission, Worker rollout, operator window, or provider-write approval.

## One named and non-destructive test fixture

- **Test:** `WP3-H2-SYNTH-KB-001`
- **Domain/operation:** `kb` / `add`, type `technique`; synthetic title `WP3 H2 Synthetic Publishing Proof`.
- **Record ID:** `h2-synthetic-kb-publishing-proof` (not a real fishing article).
- **Created Markdown:** `KB/Techniques/content/h2-synthetic-kb-publishing-proof.md`.
- **Other modified Git file:** `KB/kb.json` — append a single validated KB record referencing that Markdown. No other canonical files are authorized to change.
- **No media:** representative pictures, Notes inline photos and Knot sequence frames are deliberately absent. The first H2 provider proof is a **text-only KB index + Markdown atomic Git tree**. Other images/domains and fault cases remain WP3 requirements to be accepted separately.
- **Idempotency key:** `wp3_h2_synthetic_kb_001` for the single controlled proof; do not reuse for a different record or snapshot.
- **Result:** one operation-owned `fish-v3/publish/<uuid>` Git ref and a new independently verified GitHub PR **against `main`, never merged**; do not change `main` or expose the synthetic article publicly.
- **Implementation:** `pwa/server/d6-wp3-h2-synthetic-kb-fixture.mjs`, builder `createD6Wp3H2SyntheticKbFixture`. Creates an exact JSON serialized envelope and SHA-256 digest using the existing `prepareChange` + `validatePackage` contracts. Returns `sourceOnly:true`, `canPublish:false`, `isLive:false`; has **no GitHub, D1 or Worker publish method**.

## Source-time tests and exact-head assurance

`pwa/test/d6-wp3-h2-synthetic-kb-fixture.test.mjs` checks:

1. The checked-out Gear/KB/Catches canonical inventory, no collision with the 60 KB IDs, and absence of the Markdown path. These are **source CI facts at its exact commit**, not proof of what GitHub `main` contains at a future write window.
2. Exact change-package format/Notes content/path, media-free intent and envelope bytes/digest.
3. Real V3 record schema, Markdown and path validation while preserving every existing record, original and unrelated domain.
4. Existing source review and atomic tree planner on the real checked-out canonical data produce **only** `KB/kb.json` and the new synthetic Markdown, without Git provider writes or a Live claim.
5. The original H2 operator gate accepts only the exact body SHA and denies altered body, disabled operator or stale/colliding source.

**Critical runtime preconditions before ANY owner-authorized H2 write:** independently GET canonical `refs/heads/main` at the moment of exercise; inspect the real KB ID inventory, full file-path collisions and protected base, including the exact proposed two-file diff; generate the fixture from that current GitHub revision; record the serialized body SHA-256, owner approval and bounded window. Recheck immutable source and exact D1 state before every step, and stop on drift or collision. The 2026-11-15 source revision `fc85bd38c4c688026700971b4c2d463c293eebf3` is merely the verified source-CI reference; it must be treated as stale if `main` changes.

**Approval separation:** the owner-approved source-only scope does NOT authorize `contents:write`, `pull_requests:write`, a live H2 Worker, secret updates, executing D1 SQL, activating four writer gates, creating the synthetic Git ref/PR, merging, deleting, or updating `main`. Review the finished exact-head CI and generated diff; obtain fresh, separate permission, deployment and exact-operation approvals as specified in the H2 activation packet. A GitHub PR/201 is only `VerifiedPr` after independent provider/D1 verification, never public `Live`.

**Fail closed:** wrong source SHA, missing/no longer unique record ID, reused idempotency key with different body, missing/source-shifted path, insufficient D1 schema, rejected owner/CSRF, missing App permission or receipt, or ambiguous POST/PATCH means no blind retries, no substitute real record, and no H2 exit.
