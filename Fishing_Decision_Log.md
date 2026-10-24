# Fishing Decision Log

## October 24, 2026 — binding v3 feasibility, sandbox and migration decisions

- **AUTH-P0/G1 disposition:** owner **accepted/closed feasibility with explicit waivers** October 22, approved same-origin Cloudflare gateway architecture direction *in principle* and a fixed seven-day first-party Secure HttpOnly D1 session with local signout/revoke-all and no GitHub external-authorization-revocation webhook. iOS and certain live/security/metric/byte-comparison tests not run or waived; do not misstate as passes or extend waivers to later P3 security/release tests. [Final decision on draft PR #262](experiments/auth-p0/AUTH_P0_G1_Final_Decision_and_Waivers_2026-10-22.md). P1 evidence PR still draft/unmerged.
- **P3 isolation/privileges:** owner separately approved only sandbox Cloudflare Free Worker/D1 and GitHub private sandbox/GitHub App. Owner's Contents-read-only test succeeded, temporary key removed, `P3_WRITE_ENABLED=false` remains binding. Production repo `ginosega/fishing` not in sandbox App installation scope. GitHub read-only connector verified private sandbox ID **1430581407** and main `e37db3b`. Draft P3 PR #263 has source, CI and staged D1 work; **no merge, Github write action, publisher activation, production-provider change or production cutover**.
- **Actual Wrangler migration sequencing:** P3-17 owner-performed synthetic local staged 0001+0002+0003 ledger/schema rehearsal completed. Owner then **separately approved R1 only** and, after exact isolated-target/SQL verification, fresh PRIVATE Time Travel bookmark and interactive *0001-only* preview, completed the **remote sandbox R1**. Postflight exactly 0001 in Wrangler ledger, three original P3 tables/three indexes, zero application rows, no FK violations, Worker health `ready:false` and anonymous session. No secret or bookmark stored in repository. **R1 is closed; do not rerun/restore.**
- **R2/R3 separate gates:** applying `0002_durable_snapshot_and_audit.sql` to isolated remote D1 is **NOT YET APPROVED**. It adds p3_requests + three triggers; require new approval and fresh private guarded stage, with 0002 alone pending and verified postflight. 0003 requires yet another approval. Recovery restore, changed Worker deployment, repository writes/merges, and enabled publishing are likewise unapproved. [Binding P3-18 report](experiments/p3/preview/P3_18_Remote_Sandbox_D1_Migration_Approval_Proposal_2026-10-23.md) lives on draft PR #263.
- **Production source/host:** October 23 full application main run [#672](https://github.com/ginosega/fishing/actions/runs/39990546320) successful for `4a1a8c44317b56a4d47e818db9cd2b5587a966d8`; hosted release `504d615b2bef361da06d655ee621d43a` with 577 verified files and 100/60/12 canonical counts. No code change/deployment for this documentation-only handoff. FISH-TODO-118 allocated; prior FISH115–117 production complete. Prior owner field acceptance caveat for FISH117 remains.
- **Persistent preferences and backlog:** Chat mode; don't reopen signed-off v3 requirements/design/UX/plan; keep published v2 and isolated experimental services separate; all fishing/gear/KB open tasks carry forward without assuming purchases.

---

## Historical October 21, 2026 transfer — work-sequence decisions

**Requested transfer:** The owner asked to open a fresh Fishing chat after completing the category-icon and scenic-header optimization. Pre-handoff `main` `c42d0e737151608b53ffd0de6fa29dbbd76eba32`, no open PRs; latest successful actual hosted deployment [#543](https://github.com/ginosega/fishing/actions/runs/39690549053), production source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, release `131ebca9c6d46fa1c1d815ad43a318f6`, 577 files / 100 Gear / 60 KB / 12 Catches. This handoff is a **documentation-only** update, no new code/deploy.

**FISH117 owner's choice:** Publish compact WebP derivatives of 16 Home/Gear/KB category icons and the two responsive scenic headers immediately to v2, maintaining original source PNGs in GitHub. Owner deliberately waived separate pre-release visual review, physical Android preview, and additional page-load timing; they will inspect appearance and performance *on live production*. Core/release/integrity/browser validations were not waived. FISH117 is engineering-complete after source PR #258, isolated WebKit offline test fixture PR #259, production workflow #543. Original 17,090,051 bytes → shipped WebP 253,660 bytes (98.5% less in this subset), **not proof of a 98.5% faster page**. No subjective owner result recorded yet.

**Other completed P0 choices:** P0-A stale sessions transition coherently to the latest SHA-verified release without online retention of old assets; dirty edits are preserved, released via PR #254. P0-B Gear/KB photo cards use small generated thumbnails while details retain canonical full-resolution originals, released via PR #252. P0-C native Android Chrome PWA Custom Tab link handling is accepted; no workaround.

**Next v3 gate:** AUTH-P0 P1 requires an evidence-based owner-session/OAuth/installed-PWA feasibility test and explicit user approval of minimal GitHub App permissions, new provider/domain/secrets/cost before setup. Existing approved v3 requirements/technical design/UX/staged plan do not preapprove those resources or later production v3 cutover. Chat mode remains default; do not suggest Work merely for complexity. All unrelated fishing gear/KB TODOs persist. Next unused app ID FISH-TODO-118.

---

This file records **current durable decisions**. Detailed historical release evidence remains in Git history and dated `pwa/docs/` records rather than being repeated here.

## Operating mode

**Decision:** Chat mode is the permanent default. Do not recommend Work merely because work is complex, lengthy, file-heavy, analytical, research/calculation-heavy or artifact-producing. Use a temporary Work switch only for a genuinely Work-only capability after explaining the need and obtaining explicit user approval.

## FISH117 static page art optimization — published October 21, 2026

**Owner decision:** Authorizes production release directly, without separate visual preview or image-performance comparison. Keep original canonical PNG icon and scenic hero artwork in GitHub; generate small transparent 128px WebP card icons and compressed responsive scenic WebP headers for Home/My Gear/KB pages. User will check appearance and performance on live site.

**Engineering/release result:** [Image PR #258](https://github.com/ginosega/fishing/pull/258) merged; [WebKit test-fixture-only PR #259](https://github.com/ginosega/fishing/pull/259) preserved the required offline assertions while avoiding a second forced-socket-abort artifact. [Main Full Application #543](https://github.com/ginosega/fishing/actions/runs/39690549053) passed and deployed, with hosted bytes/browser verified at https://ginosega.github.io/fishing/. Release `131ebca9c6d46fa1c1d815ad43a318f6`, source `ab1c59a61c748e9a8a1da2b31d87e1d86c96ac9f`, 577 files / 100 Gear / 60 KB / 12 catches. 18 original images totaled **17,090,051 bytes** and their packaged WebPs totaled **253,660 bytes** (98.5% reduction in these file bytes). Original source PNGs unchanged; offline library includes derivatives, not redundant full-size static art. [Release analysis and acceptance report](pwa/docs/Fishing_Companion_FISH117_Static_Artwork_Optimization_2026-10-21.md). Owner visual confirmation remains outstanding by deliberate choice; no new OAuth/App/provider or v3-cutover authorization.

## P0-A stale-session v2 maintenance release — deployed and verified October 21, 2026

**Owner authorization:** Explicitly approved merging and deploying [PR #254](https://github.com/ginosega/fishing/pull/254) after successful CI of the no-prior-hosted-assets transition fix. On October 21, merge commit `953cba549515b08aec76a8408868a6b3bdac2117` triggered [Full Application workflow #535](https://github.com/ginosega/fishing/actions/runs/39676555110). Full validation, Pages deployment and real hosted byte/release/browser checks **all passed**. Verified production release `855b2b33d7d3fdca7ac5e92be881824b` (source `953cba549515b08aec76a8408868a6b3bdac2117`, **577 files, 100 Gear / 60 KB / 12 Catches**). [P0-A design and production closeout](pwa/docs/Fishing_Companion_v3_P0A_Transition_Fix_2026-10-21.md).

**Result:** Clean stale tabs atomically navigate to the most recently SHA/manifest-verified release, retaining the hash route. Dirty editors are protected, and spurious `controllerchange` update messages are removed. Older online release files are **not** retained on Pages; independently prepared offline libraries remain as before. **One-time transition caveat:** tabs already running the pre-fix production JS may still need a manual refresh to load the fix. This is automated browser/hosted acceptance, not field proof for every Android/iOS scenario. No GitHub App provider, OAuth or v3 cutover permission has been established by this release.

## P0-A reliability architecture — new release supersedes old (October 21, 2026)

**Owner direction:** Proceed with fixing post-deployment stale sessions and **do not retain assets from older hosted releases**. A newer release should supersede the previous one. This is a decision for coherent current-release transition, **not** approval to merge/deploy a new v2 application maintenance build.

**Implemented in draft PR #254:** The controlled service worker verifies the latest network release and its manifest before informing a tab. Clean old tabs reload the **entire** application on the same hash route, so JS/JSON/CSS/Markdown/images all come from B. Dirty editors retain changes and show a warning; no automatic destructive reload. Controller changes are no longer indiscriminately presented as app updates. No additional hosted release retention or automatic offline-media provisioning is introduced. [Implementation and test evidence](pwa/docs/Fishing_Companion_v3_P0A_Transition_Fix_2026-10-21.md).

**Acceptance state:** Full Application pull-request [workflow #534](https://github.com/ginosega/fishing/actions/runs/39643607290) completed successfully with 46 core, 54 preview and 56 production-root browser tests. The simulated A-removal regression, dirty editing, offline integrity and unrelated app acceptance passed; deployment jobs skipped. **PR #254 remains draft/unmerged**, the independent v2 reliability production release still needs explicit owner go-ahead, and live Android/iOS update testing has not been performed. First release of this change cannot retroactively fix already-open unpatched A tabs; subsequent release transitions are covered by new code.

## P0-A field result and verified v2 thumbnail release — October 21, 2026

**Verified deployment:** Owner approved thumbnails and the minimum security dependency patch set. [PR #252](https://github.com/ginosega/fishing/pull/252) merged application source `805972165f88f10898807639d8b9591ce0cf3d08`; [main Full Application run #531](https://github.com/ginosega/fishing/actions/runs/39624670945) **succeeded**, including actual GitHub Pages browser/release verification of B `9f6464d53fe49d1e986bb35d2630c21a`, 577 files / 100 Gear / 60 KB / 12 Catches. The original detail pictures were retained; card thumbnails and DOMPurify/markdown-it/fast-uri/argparse compatible patches are production. No new hosting or other v3 feature.

**Owner field test:** Against held A `f5eab01e9d5af6101f03a7094de5b565`, old Edge My Gear category artwork disappeared; Network showed old-release `card-icons/*.png` fetches returning underlying **HTTP 404**, surfaced as **HTTP 503 (from ServiceWorker)**. Console still held A identity. A freshly opened B tab rendered normally, confirming old/new release mismatch in a real browser. Its “Fishing Companion was updated. Reload when you have finished any edits.” notice correlates with a broadly triggered service-worker `controllerchange` listener, rather than demonstrating a failed new release. Exact screenshot observations and source correlation are documented in [field report](pwa/docs/Fishing_Companion_v3_P0A_Edge_Field_Reproduction_2026-10-21.md).

**Next engineering constraint:** P0-A defect is **confirmed and open**; isolated reliability correction should ensure coherent old-client transition or bounded verified prior-release asset retention, cover SW restart, protect unsaved editor state, and eliminate false-positive reload prompts. Owner's evidence is enough to begin implementation/tests; **no separate v2 reliability production deployment was authorized** by the thumbnail release approval. Do not claim physical Android proof or universal failure frequency from one Edge repro.

## P0-A field-diagnostics plan — accepted October 21, 2026

**Owner decision:** Use the separately approved thumbnail improvement as a practical opportunity to investigate the pre-existing stale-session defect in production, **provided an old Windows Edge browser tab is prepared and its release ID is captured before deploying**. The owner requests detailed step-by-step assistance collecting failed requests and release IDs. See [P0-A production deployment field-test instructions](pwa/docs/Fishing_Companion_P0A_Production_Deployment_Field_Test_Instructions_2026-10-21.md). Compare old session against a fresh tab after a verified Pages deploy; do not refresh or clear data before recording evidence. The observed outcome may be no failure; that would not negate the isolated source-level reproduction.

**Release authorization remains distinct:** Agreeing to the diagnostic *plan* is not blanket authority to deploy. Complete the old-tab preparation, then obtain explicit user go-ahead for the **thumbnail-only v2 Full Application Release**. PR #248 remains draft and production unchanged until that gate is satisfied. Separately investigate/develop and release the P0-A reliability fix after evidence; v3 AUTH-P0/cutover gates are unaffected.

## Fishing Companion v3 P0-B — thumbnail improvement approved (October 21, 2026)

**Owner decision:** Approves release-scoped, deterministic 512 × 270 maximum WebP thumbnails for Gear and Knowledge Base cards, keeping original pictures at full resolution on detail pages and in the viewer. Accepts the measured CI reduction in above-fold image bytes and roughly 1.6–2.1× faster end-to-end above-fold decode/paint-completion timings. Owner explicitly **waives further visual-quality review and Android-preview creation/device comparison**; do not propose a separate public preview repository. This does not imply a real Android speed measurement occurred. Evidence: [P0-B prototype report](pwa/docs/Fishing_Companion_v3_P0B_Thumbnail_Prototype_2026-10-20.md) and [draft PR #248](https://github.com/ginosega/fishing/pull/248), exact-head [CI #526](https://github.com/ginosega/fishing/actions/runs/39436154092) success.

**Production release gate remains distinct:** The user approved the *thumbnail change* but did not expressly direct immediate publication to live v2. The approved staged plan requires a separate **specific v2 maintenance production-release authorization**. PR #248 remains unmerged; merging app code on `main` automatically runs Full Application Release and Pages production deployment. Before offering release, disclose the independently reproduced P0-A stale-session weakness affecting held clients on deploy, retain a rollback plan, and confirm desired release scope. AUTH-P0 and v3 production-cutover gates are unaffected.

## Fishing Companion v3 P0-C — accepted Chrome Android external links (October 20, 2026)

**Owner decision:** Accept Google's [documented Chrome Android PWA behavior](https://web.dev/articles/add-manifest): tapping an ordinary external link with `target="_blank"` in an installed Chrome PWA may open it in a browser-powered **Chrome Custom Tab** attached to the app, rather than a separate regular-browser tab. On October 19 the owner initially preferred an out-of-app Chrome tab and observed that the Daiwa Gear link opened in-app, while ordinary Chrome opened it in a new tab. After verifying Google's platform documentation on October 20, the owner explicitly accepted the installed-PWA behavior and directed the project to move on. This **supersedes** the prior out-of-app requirement. P0-C is **CLOSED — ACCEPTED NATIVE BEHAVIOR / NO CODE CHANGE**.

**Preserve:** existing external link activation and safe `noopener noreferrer`, internal app routing, YouTube native-app delegation, and normal browser-tab new-tab behavior. Do **not** pursue Android intent/browser-escape hacks or a v2 maintenance release merely to force a regular tab. This acceptance is specific to Chrome Android, not proof about Edge/iOS installed behavior. The separate v3 **AUTH-P0 sign-in/callback return feasibility gate remains mandatory**. Source evidence and disposition: [P0-B/P0-C diagnostics](pwa/docs/Fishing_Companion_v3_P0_Image_and_External_Link_Diagnostics_2026-10-19.md).

## New-chat transfer and handoff

**Decision:** When the user says **“It’s time to transfer to a new chat”** or clearly equivalent wording, ask once for confirmation that they want the full project handoff. Once confirmed, execute it end-to-end without repeated “Proceed” prompts: restore actual latest `main`, open PRs and current production evidence; reconcile durable state; update authoritative records where project state actually changed; preserve unresolved work and purchase uncertainty; cross-check records/bootstrap; and finish with a clickable GitHub link to `Fishing_New_Chat_Bootstrap_Prompt.md`.

Routine content releases do not require state-file churn merely so a later handoff can discover them. Git history and current canonical source remain authoritative for those events.

## Repository authority

**Decision:** `ginosega/fishing` is authoritative. Restore actual latest `main` and open-PR state before implementation/release/repository-write work.

Canonical physical content roots are `pwa/Gear/`, `pwa/KB/` and `pwa/Catches/`; logical paths remain `Gear/...`, `KB/...` and `Catches/...`. `.github/workflows/fishing-production.yml` is the sole active publisher.

For exact current production SHA/release ID/counts, inspect the latest successful `main` production workflow and deployed `release.json`/hosted verification evidence. Do not maintain volatile production identifiers as permanent narrative truth.

## FISH108 — two-lane release discipline

**Decision/status:** APPROVED and IMPLEMENTED. Full policy: [`pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md`](pwa/docs/FISH108_Fast_Content_Release_Policy_2026-09-14.md).

### Fast Content Release

Use Fast Content Release only when **every changed file** is beneath `pwa/Gear/`, `pwa/KB/` and/or `pwa/Catches/`.

Fast releases require source/package conflict validation before mutation, one lightweight content PR, locked cached dependency installation, one canonical production build/source inventory validation, exact generated-release verification, exact-current-main deployment protection, and dependency-free byte-for-byte hosted/release-identity verification.

**Decision:** Do not run full Node behavior tests, Chromium/WebKit, preview-browser regression, archived-v1/cutover regression, dependency audit or hosted browser acceptance for content-only work unless validation reveals an actual non-content problem.

**Decision:** A routine Fast Content Release does not consume a `FISH-TODO-###` application/architecture ID and does not require a per-item production-closeout or per-item project-state document update.

### Full Application Release

Any file outside the three canonical content roots forces full. Runtime/UI/assets, service worker, schema/contracts, tests, build/tooling, dependencies, workflow, migration/recovery/offline architecture and mixed content+non-content changes retain the comprehensive full suite. If eligibility is ambiguous, use full.

## FISH109 — release retry hardening

**Decision/status:** IMPLEMENTED and production-verified. Pages deployment and hosted-evidence artifacts are run-attempt-specific; hosted verification uses bounded retry/backoff for transient propagation/network failures; exact-current-main protection remains mandatory.

## FISH110 — release-aware Copy Changes handoff

**Decision/status:** IMPLEMENTED and production-verified. Gear/KB Add/Edit → **Copy Changes** uses one centralized release-aware instruction. Eligible content-only packages route through FISH108 Fast Content Release; non-fast packages use the repository's current appropriate lane. The human instruction and JSON remain separated by a blank line so JSON is parseable.

## FISH111 — shared page layout alignment

**Decision/status:** IMPLEMENTED and production-verified. Fishing Companion uses one shared horizontal content grid: the site-header brand/connection control and main page content share the same left/right insets, and long-form Notes/Markdown uses the full main-content width rather than the former 900 px/78ch caps. Mobile preserves the same rule with its existing 16 px inset. Pictures, detail tables, editor forms and other intentionally narrower components keep their own caps.

## FISH112 — fixed cross-platform card icon artwork

**Decision/status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED.

### Final implementation decision

**Decision:** Home, My Gear, and Knowledge Base card icons use 16 bundled user-approved transparent PNG assets under `pwa/assets/card-icons/` rather than OS-dependent emoji glyphs. Preserve current card geometry, spacing, labels, search/Back controls, routes, navigation, and small icon scale/placement.

**Decision:** The final generated transparent-with-shadow PNG assets are the authoritative artwork. Earlier exploratory Google/Noto, Fluent, Twemoji-style references and mockups are historical design references only and are not the live source assets.

**Decision:** The production build must carry these assets into each content-addressed release and include them in release identity/manifest verification. Regression coverage must continue to protect the exact 16-file set, transparency, card mappings, production-build byte preservation, and manifest inclusion.

### Production closeout

FISH112 was implemented in PR #168 and released through Full Application Release workflow #298 / run `35119930916` from source revision `89ca4773365f8d99750b9424b5cb9eefb4a29907`. Hosted release `f5d691d727fd439ff5553f6c7db509f4` passed actual hosted production byte and browser verification. The user then inspected production and confirmed that it looks correct.

Detailed evidence: [`pwa/docs/FISH112_Production_Closeout_2026-09-16.md`](pwa/docs/FISH112_Production_Closeout_2026-09-16.md).

**Decision:** FISH112 is closed.

## FISH113 — responsive scenic page heroes

**Decision/status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED.

### Final artwork and responsive behavior

**Decision:** Home, My Gear, and Knowledge Base root pages use the scenic mountain/lake hero artwork under `pwa/assets/page-hero/`. Non-root headers remain unchanged.

**Decision:** The authoritative hero pair is:

- `page-hero.png` — 1536 × 512 (3:1), used for standard/narrow layouts;
- `page-hero-wide.png` — 3072 × 512 (6:1), used for sufficiently wide landscape layouts.

**Decision:** The 3:1 asset must remain pixel-for-pixel the exact centered crop of the 6:1 master so crossing the responsive breakpoint looks like one continuous scene rather than two separately generated images.

**Decision:** Wide-hero activation is geometry-based responsive art direction, not monitor/display-resolution detection. Preserve the dark overlay treatment and existing page text/card/navigation behavior.

**Decision:** The superseded WebP hero artwork is retired; the final PNG pair is authoritative.

### Production closeout

FISH113's final responsive implementation was merged in PR #173 as source revision `fab438e2833b131204a5e4c29ab1685df0ae8fbf`. Full Application workflow #312 / run `35139240830` deployed hosted release `6a1f85979ecabc197ec66368b9fe0a65` after a targeted retry cleared one unrelated timing-sensitive WebKit offline-cache test. Actual hosted byte/release/browser verification passed.

The user inspected the final live responsive behavior and confirmed: **“It’s great. No more adjustments are needed.”**

Detailed evidence: [`pwa/docs/FISH113_Production_Closeout_2026-09-16.md`](pwa/docs/FISH113_Production_Closeout_2026-09-16.md).

**Decision:** FISH113 is closed.

## FISH114 — Android/Edge maskable launcher icon

**Decision/status:** IMPLEMENTED / PRODUCTION-VERIFIED / USER-VERIFIED / CLOSED.

**Decision:** Preserve the approved transparent `pwa/icon.png` as the ordinary source icon. Generate the Android adaptive/maskable variant at build time rather than replacing or mutating the approved source.

**Decision:** The production manifest publishes both an ordinary `purpose: "any"` icon and a dedicated `purpose: "maskable"` icon. The generated maskable icon uses opaque `#11665c` background, centered approved artwork, and participates in release identity and verification.

FISH114 was implemented in PR #179 from source revision `771c80baa21fe17f331614f6658b5278475178ed`. Full Application workflow #349 / run `35306208653` deployed hosted release `9e9cc6e2f388439c1d745c0e74122c33`; full validation, Pages deployment and actual hosted byte/browser verification passed. The user visually inspected the installed Android result and confirmed it looks great.

Detailed evidence: [`pwa/docs/FISH114_Production_Closeout_2026-09-18.md`](pwa/docs/FISH114_Production_Closeout_2026-09-18.md).

**Decision:** FISH114 is closed. The next unused application/architecture task ID is **FISH-TODO-115** unless newer `main` has already allocated it.

## KB editorial ownership model

**Decision:** Broad fishing-reference pages have complementary responsibilities:

- **Behavior and Habitat** pages own **where fish are and why**: habitat, structure/cover, temperature, oxygen, forage, light, wind/current, depth and pattern-recognition principles.
- **Fishing Techniques** pages own **how to catch fish once located**: presentation/lure/bait choice, rigs, retrieve/cadence, depth control, strike handling and bank/kayak execution.
- **Spring / Summer / Fall / Winter Fishing** own detailed seasonal location + presentation strategy for both bass and trout.
- **Topwater Fishing** owns broad specialized surface-fishing strategy; Frog, Popper, Whopper Plopper, Walking Bait and Buzzbait remain narrower companion Gear Guides.

**Decision:** Internal cross-links should be curated for reader value rather than mechanically applied to every keyword occurrence.

**Decision:** The old Bass Fishing, Spring Bass Fishing, Fall Bass Fishing, Bass Power and Search Overview, Color and Scent, Paddle-only Kayak Strategy, Seasonal Bass Guidance and Water Visibility pages are retired from live canonical content. Historical evidence may still mention them.

## Domain architecture and authoring boundary

**Decision:** Fishing Companion retains independent Gear, Knowledge Base and Catch domains. KB types are Location, Species, Equipment/Gear Guide, Technique and Knot. Paths are explicit record properties; existing IDs remain stable unless intentionally retired/replaced. Retired trips/sessions/planner/setup structures remain retired unless explicitly re-approved.

**Decision:** Gear/KB browser Add/Edit uses **Prepare Changes → Copy Changes** to create `fishing-companion-change-v2`. Preparing/copying is not saving; browser-side repository writes/uploads are not current production. Physical authoring upload links use `/pwa/...` while packages use logical paths.

Simple Markdown-only narrative edits may be made directly. Structured record fields, categories/types, specifications, structured links, picture metadata/sequences, paths and relationships should use the source-aware workflow.

### Authoring constraints

- Normalize accidental trailing whitespace unless explicitly asked to preserve it.
- KB `description` maximum is 80 characters.
- Preserve unrelated concurrent changes and user-uploaded bytes; reconcile newer `main` before merge if it advances.
- Same-page Markdown heading links must target the renderer-generated slug: lowercase, punctuation stripped, spaces converted to hyphens. Do not use capitalized/percent-encoded original heading text as the anchor target.

## Durable application behavior

- **FISH091:** normal online use does not provision the complete offline library; **Connection Status → Update offline library** explicitly prepares/refreshes a verified complete generation.
- **FISH096:** Knot-only explicit ordered `pictureSequence`; physical frames under `pwa/KB/Knots/assets/<id>/`; at least two frames; `picture.src` is final/representative; directory contents alone never create a sequence.
- **FISH102:** Line-Tackle-Knot Reference is pinned first only on KB → Knots.
- **FISH103:** external HTTP(S) links open new-tab with `noopener noreferrer`; internal app/local links remain same-tab; authoring uploads use physical `/pwa/...`; Caption focus and provisional new-KB Markdown Preview behavior retained.
- **FISH107:** canonical Skylety Fishing Hook Sharpener type is `Tools`.

## Backlog decisions

**FISH-TODO-005:** resolved. The user explicitly confirmed the installed fish-finder power system as Amped Outdoors 12V 8Ah, 3A fuse, IP68 connector and 22–18 AWG disconnects.

**FISH-TODO-014:** remains OPEN. FISH105's HyperSeal 3600 was not explicitly identified as the historical deep-box watch target.

**Decision:** The broad Technique redesign does not implicitly close specialized future pages. Texas Rig, Carolina Rig, Alabama Rig, Neko Rig and Spoons remain open until explicitly completed.

## Fishing Companion v3

**Decision (October 19, 2026):** Fishing Companion v3, tracked as FISH-TODO-037 (historically FISH-TODO-077/P2), has **explicitly approved requirements**; the user reviewed and signed off [the v3 requirements](pwa/docs/Fishing_Companion_v3_Requirements.md) **as-is**. The [approval record](pwa/docs/Fishing_Companion_v3_Requirements_Approval_2026-10-19.md) identifies the exact reviewed version. **Technical design preparation and review are authorized; design sign-off, implementation, and production deployment are not.** Approved scope: public anonymous reading; discreet GitHub sign-in in Connection Status; a single authenticated owner; direct automatic Save and Publish via validated GitHub releases; integrated media uploads; current-schema Catch authoring; clickable Markdown pictures; persistent Automatic/Work Offline reading selection; performance and Android/deployment reliability fixes. Device-local draft recovery and offline continuation of an already-open edit are provisional and removable at testing. Full offline authoring/queued sync, broad multi-user support, Catch photos/GPS, and user-facing Copy Changes are excluded. Preserve GitHub as canonical source and the established release checks.

**Decision (October 19, 2026 — subsequent v3 gate):** The user explicitly approved [v3 technical design](pwa/docs/Fishing_Companion_v3_Technical_Design.md) **as-is**, with no additional v3 features. The [technical design approval record](pwa/docs/Fishing_Companion_v3_Technical_Design_Approval_2026-10-19.md) pins the exact reviewed revision. The user additionally requested a [screen-level UX preview](pwa/docs/Fishing_Companion_v3_UX_Review.md) for sign-in, editing/submit/publish and Connection Status **before implementation**. UX review and implementation plan are pending; **neither implementation nor deployment is authorized**. AUTH-P0 remains a mandatory real-device auth/session feasibility gate; draft recovery remains provisional.

**Decision (October 19, 2026 — v3 UX approval):** The user stated **“I approve the screens and flows”** after viewing the sign-in, editing/submit/publish, and refreshed Connection Status visual examples and interactive mockup. See [approved UX review](pwa/docs/Fishing_Companion_v3_UX_Review.md) and [UX approval record](pwa/docs/Fishing_Companion_v3_UX_Approval_2026-10-19.md), pinned to the exact previously reviewed `main` revision. The [staged implementation plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) is **DRAFT / NOT APPROVED**. **No implementation, GitHub App/provider setup, or deployment authorization** has been given. AUTH-P0 and the separate production cutover gate remain in force; local drafts remain removable.

**Decision (October 19, 2026 — v3 implementation-plan approval and chat transfer):** After separate approval of v3 requirements, technical design and UX, the owner explicitly approved the [staged v3 implementation plan](pwa/docs/Fishing_Companion_v3_Implementation_Plan.md) **with the condition that a full project-state audit/reconciliation and transfer to a fresh Chat conversation take place before P0 or any implementation**. The [approval record](pwa/docs/Fishing_Companion_v3_Implementation_Plan_Approval_2026-10-19.md) pins the reviewed plan to `7cc7eea06a110e041dbf552855957713df4b1c51` and blob `8d23d327033b1b348abb53d8462ccd2bb8dc0513`. Do not repeat plan approval in the new chat. After this handoff, restore current main, open PRs, latest successful production workflow and hosted identity, then begin P0 there. **No implementation, GitHub App/provider provisioning, browser test or production deployment in the old handoff chat.** AUTH-P0 proof, special provider/domain/permissions and optional v2-fix approvals, draft-removal gate and separate v3 cutover approval all still apply. The approved scope is unchanged; ordinary current v2 Gear/KB edits still use the established Copy Changes/FISH108 process until an approved v3 release replaces that experience.

**Production evidence for handoff (October 15, 2026 UTC):** Latest successful main production run **#520 / 38686171921**, source revision `4fc893d044b72e61fbc36cfd82103af55bc36f97`, hosted release `f5eab01e9d5af6101f03a7094de5b565`, 431 files, 100 Gear / 60 KB / 12 Catches; hosted byte match true. Main was `7cc7eea06a110e041dbf552855957713df4b1c51` with zero open PRs before the documentation-only handoff; recheck both identities in new chat.

## Open application work

FISH071–076 and FISH078–114 are complete/implemented. There is no currently allocated open application task after FISH114. The next unused application/architecture task ID is **FISH-TODO-115** unless actual newer `main` has already allocated it. Routine Fast Content Releases do not consume that ID.
## October 12, 2026 project handoff reconciliation

**Audit outcome:** PRs #221–#228 are all merged and deployed; the interrupted Banks Lake representative image change in PR #228 was successfully finished (production workflow #517 / run `38207507318`). As verified at the start of this documentation-only handoff: published source `e71c9ab6a90da46f8b46c7977bf476a1633fa94c`, release `0f4bd1f9e9e12b2b1981d61b48e3e501`, **100 Gear / 60 KB / 12 Catches**, **431 hosted files**, `hostedBytesMatch: true`, and **0 open PRs**. These are dated evidence, not permanent future-state values.

**Canonical content clarification:** `electronics-research` was renamed **Electronics Research** and intentionally refocused on chart plotters/fish finders; the prior motor/battery Notes sections are no longer on that page. Garmin Force Current Gear and maintenance/component Notes now cover motor content. A Lake Stevens Location guide was added, and the Banks Lake Location now has a representative picture. These are completed content changes; no new architecture task was allocated.

**Outstanding equipment clarification:** FISH-TODO-040 remains **OPEN** pending commissioning/installation/functional testing and case-fit/cushioning decisions. A 48 × 19 × 14 in hard-plastic lidded bin is being evaluated, but exact **interior** dimensions and purchased status were not confirmed. Do not claim the case/foam installation is completed. The historical under-seat tackle tray back-order and other open purchase items are not implicitly resolved.

**Release decision unchanged:** Documentation-only reconciliation does not trigger PWA publication because the publisher's `push`/`pull_request` path filters exclude the root project Markdown files. Handoff commits may move `main` ahead of the last deployed production source SHA; distinguish these identities rather than reporting an outdated production release as current `main`.

## RVR119 Force Current purchase and commissioning — October 6–7, 2026

**Decision:** The motorization purchase decision is complete. The user purchased a used **Garmin Force Current + Power Steer wireless foot-pedal system** on October 6, 2026 for **$2,800** from a seller in Gresham, Oregon. The package includes the motor, both Power Steer pedals, Garmin handheld remote, Garmin MOB tag, Redodo 24V 50Ah LiFePO4 battery and charger, high-efficiency propeller and weedless propeller.

**Warranty evidence:** The seller transferred the original **July 2026** Garmin receipt. The user contacted Garmin directly and Garmin confirmed that the remaining three-year standard warranty will be honored with the original receipt. The seller reported that the motor has never been used in saltwater.

**Decision:** FISH-TODO-040 remains OPEN but now tracks **commissioning/integration**, not pre-purchase comparison. The baseline process is to document/clean/inspect, charge and baseline the Redodo battery, clear previous-user data, restore defaults, re-pair controls, install current software through ActiveCaptain, calibrate the pedals/remote, then complete motor compass/bow-offset calibration and full functional testing on the installed RVR119. Do not perform invasive preventive service on the three-month-old warranted motor absent a fault.

**Safety/maintenance constraints:** Preserve Garmin's 40A protected-feed requirement; disconnect battery power before propeller/electrical service; never run the propeller out of water; inspect exposed rope/mount/connectors/props/sacrificial anodes as owner maintenance.

**Storage decision:** The motor/pedal storage solution must be **hard plastic**, not a flexible bag. Minimum usable internal dimensions are **38 × 18 × 8 in**; snug/compact fit is preferred and **orange is preferred**. Pelican/Otter-level protection/cost is unnecessary. The Hyper Tough 50-gallon tote is too large. Verify actual usable interior dimensions because molded bins often lose substantial space to taper/handles/wheels.

**Transport constraint retained:** The RVR119 is transported on the F-150 roof rack, so the Force Current motor, battery and Power Steer pedals must remain easy to remove before roof loading. The Newport LoPRO is no longer the selected battery; it remains only a possible future low-profile alternative to the currently owned Redodo 24V 50Ah battery.

## Science of the Strike evidence standard — September 28, 2026

**Decision:** When extracting Science of the Strike transcripts or incorporating them into Fishing Companion, explicitly distinguish study evidence from the hosts' opinions, extrapolations and fishing hypotheses. Do not convert a single study's thresholds, one population's behavior, lab results, or host inferences into universal fishing rules.

**Decision:** Podcast-derived additions should follow the existing KB ownership model rather than create redundant pages. Behavior/Habitat owns enduring location/biology drivers; Fishing Techniques owns execution/presentation; seasonal detail belongs in seasonal pages; electronics-specific implications belong in Electronics Research.
