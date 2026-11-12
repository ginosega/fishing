# FISH118 — G1-D independent byte comparison waived by owner

**Date:** October 22, 2026  
**Owner's explicit instruction:** “I don't need to do a byte for byte comparison, let's just proceed with G1-E.”

## Recorded decision

- **Waived:** separate on-device execution of the G1-D *independent* exact-byte comparator between `https://ginosega.github.io/fishing/` and the experimental Cloudflare gateway. **Do not ask the owner to run or upload the comparison as a prerequisite for proceeding to G1-E.**
- **Not retroactively passed:** the independent gateway-vs-Pages HTTP byte comparison **was not performed**. Leave that evidence classified `WAIVED BY OWNER / NOT VERIFIED`, not `PASS`.
- **Evidence retained:** successful source-revision-bound GitHub Pages CI verified SHA-256 for all 577 deployed files; the real installed gateway PWA and its independently integrity-checked 575-entry complete offline library worked on Windows/Android as owner reported; source-level proxy non-rewriting and offline-integrity tests passed. These materially reduce the incremental risk of waiving the separate comparison.
- **Distinct G1-D requirement retained for later suitable preview testing:** release-update coherence (clean reload vs dirty-editor protection, previous-good offline fallback) was **not** mentioned or waived. It is a separate integration/acceptance item; it need not be tested by publishing a new production release now. Plan to test it in isolated v3 preview/P8 before a cutover decision.
- **Authorization:** proceed with **G1-E operational verification now**. No approval for merging draft PR #262, changing production URL, deploying write-enabled APIs, altering GitHub App privileges, paid Cloudflare plan/domain, or skipping other AUTH-P0 security/policy gates.
- **Traceability:** [original G1-D report](AUTH_P0_G1D_Hosted_Release_Integrity_2026-10-22.md), [approved G1 closeout](AUTH_P0_G1_Closeout_and_Hosting_Decision_2026-10-22.md), [formal signoff](AUTH_P0_G1_Closeout_Approval_2026-10-22.md).

**G1-D disposition:** independent comparison **WAIVED / NOT TESTED** with the owner's explicit residual-risk acceptance; source and prior gateway offline integrity evidence still **PASS** within observed scopes; release-update integration test **DEFERRED** for appropriate isolated preview. AUTH-P0/G1 remains OPEN.
