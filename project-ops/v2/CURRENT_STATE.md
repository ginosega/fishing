# Fishing Project — current state (candidate)

Last reconciled (UTC): **2026-11-01 (repository source only; no live provider query)**
Source baseline: `ginosega/fishing` V3 draft branch `feature/fish118-p3-mock-publisher@406723f880960d33d40bd07984559432c8caa233`; ops draft branch tracked by [PR #283](https://github.com/ginosega/fishing/pull/283). **Re-check branch HEAD every session**.
**Status:** P1 operating-model design approved; P2 documentation migration in progress; P3 CI/tooling not implemented; P4 cold-start and P5 adoption pending.

## Environments

| Environment | Source | CI | Private hosted | Public hosted | Field acceptance | Observed at / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Operating Model v2 | Docs draft PR #283 | Documentation validator **not yet implemented** | not-applicable | Not activated on `main` | P1 design accepted; P2–P5 pending | Source + approval, 2026-11-01: [P1 sign-off](P1_DESIGN_APPROVAL_2026-11-01.md) |
| Fishing Companion V3 | PR #263 draft; source implementation work ongoing when paused | Component source test runs in docs are **historical**, not a fresh exact-head CI result | **unknown** actual Worker version / latest rollout | V3 cutover **not approved** | Partial private Edge UX accepted historically; remaining Gear/Catch/Android checks **pending** | [V3 checkpoint](../../Fishing_Context.md) at audited `406723f`, 2026-10-31 |
| Fishing Companion public V2 | `main` (independently refresh before use) | **unknown** latest exact current run | not-applicable | Last known production V2; **current byte identity not freshly checked** | Not retested during operating-model audit | [FISH108](../../pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md); 2026-10-31 source-only review |

## Active workstreams

**OPS-V2 / source:** P0 audit completed, P1 owner-approved, P2 in progress. **CI:** prior docs lane checks whitespace only; P3 checker issue [#284](https://github.com/ginosega/fishing/issues/284) open. **Private hosted:** not-applicable. **Public hosted:** not adopted. **Field acceptance:** P4 not performed. **Next:** populate and reconcile current docs, complete historical decisions, prepare isolated validator.

**V3 / Gear Notes original-image defect:** Source fix described as validated by historical CI [#41243971222](https://github.com/ginosega/fishing/actions/runs/41243971222), **not proof of present HEAD CI**. Private Worker deployment/version **unknown**; previously observed owner field test failed with `Picture unavailable`. Next after V3 resumes: reconcile actual Worker version and exact source before guarded fix or recheck; do not republish as a diagnostic.

**V3 / Catch Add publication and lure picker:** Lifecycle failure observed; exact `D3LifecycleError.code` not known. Picker/rejection source fix documented in historical CI [#41245344080](https://github.com/ginosega/fishing/actions/runs/41245344080), no live field acceptance. Private deployment **unknown** and sequentially dependent on the Notes-image Worker checkpoint. Preserve draft/receipts; no blind Save retry.

**V3 / source acceptance:** Current private Windows Edge acceptance of Publishing Status disclosure was recorded for a specific prior build only. Other browser/Android and D6 publication latency ≤60 seconds (ordinary content-only text) / security / rollback / public cutover remain **open**, independent of source tests. See [approved requirements](../../pwa/docs/Fishing_Companion_v3_Requirements.md) and [Oct 31 Notes amendment](../../pwa/docs/Fishing_Companion_v3_Notes_Editor_Amendment_2026-10-31.md).

All time-sensitive claims above are **dated repository evidence**, not an assertion about a provider's live state. Never convert `unknown` to `verified` without an observed-at time and exact evidence.
