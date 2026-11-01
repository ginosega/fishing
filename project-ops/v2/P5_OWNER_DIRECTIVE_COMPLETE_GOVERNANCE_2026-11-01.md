# P5 owner direction — finish governance enforcement before activation

**Date:** 2026-11-01  
**Source:** Owner instruction in the Fishing project conversation following the P5 decision and CI scheduling discussion.
**Status:** **Authorized to complete and fully activate Operating Model v2 only after independently enforced governance validation is proven and release safety is reconciled. NOT YET MERGED OR ADOPTED.**

The owner said:

> Yes, let's complete the new operatung model and governance system completely and apply it fully so that I can get back to PWA V3 development with renewed confidence.

This follows their earlier question about whether [issue #284](https://github.com/ginosega/fishing/issues/284) should be completed before adoption; the assistant recommended completing it first, not accepting indefinite per-change/manual enforcement.

## Practical authorization

- Complete structural CI on its own independent governance workflow; demonstrate a valid corpus passes and intentionally invalid docs fail; make the governance check a **genuinely required** branch protection check before claiming that future PRs are blocked on failure.
- Only once #284 genuinely passes, verify exact PR HEAD, docs completeness and original approval retention, then adopt/merge [governance docs PR #288](https://github.com/ginosega/fishing/pull/288) to `main`. Confirm that the static prompt and router are readable on the default branch and normal/emergency recovery still works.
- Keep the PWA V3 development branch, Cloudflare/D1 and V2 published application unchanged unless a **separately reviewed/approved** application release is required. FISH108's full application checks are **never bypassed**.
- A change to `.github/workflows/**` or executable tooling is **not** a Markdown-only release under FISH108. If it would trigger a public V2 rebuild/deployment, seek separate owner approval for that consequential deployment before merging; do not assume a governance-only task grants permission for an application rollout.
- If the GitHub connection cannot update mandatory check/rulesets, identify the precise owner-only UI step, and **do not claim merge enforcement** while configuration remains incomplete.
- Preserve historic drafts and all original signed requirements; mark superseded P1 proposals as historical and maintain one in-place current queue.

## Acceptance evidence still needed

1. [CI implementation PR #289](https://github.com/ginosega/fishing/pull/289) exact-head Full Application Release acceptance (without touching V3 branch).
2. Independent documentation-only positive proof [#290](https://github.com/ginosega/fishing/pull/290) and negative proof [#291](https://github.com/ginosega/fishing/pull/291); both temporary and unmerged. The latter shows that `fishing-merge-ready` can pass while `governance-docs` fails; that status must be **required** in GitHub branch rules.
3. Safe permanent integration path with no unauthorized public V2 deployment; exact default-branch workflow installation and required-check verification.
4. Owner-approved final activation and default-branch router verification without spurious V3 source/hosted claims.

**No P5 adoption is complete from this decision record alone.**
