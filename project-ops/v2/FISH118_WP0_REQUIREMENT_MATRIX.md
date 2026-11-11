# FISH118 WP0 — V3 requirement-to-source-and-test matrix

**Audit:** 2026-11-10. **Authority:** approved V3 requirements (October 19 + subsequent amendments), WP0–WP6 completion contract. **Scope:** source inventory only, not an integrated acceptance claim. **Sources:** D5 = feature/fish118-d5-owner-integration; D6 = draft #424 stacked through #423. Every code below means V3-<code>-<NN> from the approved requirements. Each ID has exactly one owning WP. File evidence is by reusable bundle code; do not bulk-read all bundles at startup.

**Evidence levels:** D5 private source/tests and field acceptance exist for selected workflows; D6 source-only tests exist for selected boundaries; *every requirement still needs its listed WP exit gate in the complete production application*. Bundle presence never means fully integrated or deployed.

| Requirement ID | Owner | Source/test evidence bundle(s) | Remaining integrated acceptance |
| --- | --- | --- | --- |
| V3-AUTH-01 | WP2 | R,A | Anonymous reads; hide authoring |
| V3-AUTH-02 | WP2 | A,E | Owner-only direct write denial |
| V3-AUTH-03 | WP2 | A,P | Server-only credentials |
| V3-AUTH-04 | WP2 | A,C | Silent valid-session detection |
| V3-AUTH-05 | WP5 | A,C | Desktop/installed Android return and expiry |
| V3-AUTH-06 | WP2 | A,P | Least privilege/audit |
| V3-AUTH-07 | WP2 | A,C | Renewal/revocation behavior |
| V3-SAVE-01 | WP3 | E,P | Direct Gear/KB edit to GitHub |
| V3-SAVE-02 | WP3 | S,P | Canonical source/ID/conflict preservation |
| V3-SAVE-03 | WP3 | M,P | Atomic media and Markdown publication |
| V3-SAVE-04 | WP4 | Q,P | Correct FISH108 lane |
| V3-SAVE-05 | WP3 | E,P,W | One Save→progress lifecycle |
| V3-SAVE-06 | WP3 | S,P | Changed-main conflicts retained |
| V3-SAVE-07 | WP3 | P,D | Duplicate/unknown receipt/reload recovery |
| V3-SAVE-08 | WP1 | E,R | Remove v2 Copy Changes UI |
| V3-SAVE-09 | WP4 | W,Q | ≤60s text Save→verified public Live |
| V3-UPLOAD-01 | WP3 | E,M | Image selection and upload |
| V3-UPLOAD-02 | WP3 | M | Original image/Knot sequences |
| V3-UPLOAD-03 | WP3 | D,M | Media retained through failures |
| V3-UPLOAD-04 | WP3 | M,S | Size/MIME/path integrity |
| V3-UPLOAD-05 | WP1 | T,Q | Derived thumbnail vs original |
| V3-CATCH-01 | WP1 | E | Add/Edit fields and date/time |
| V3-CATCH-02 | WP3 | E,P,M | Canonical Catch direct publishing |
| V3-CATCH-03 | WP1 | E,R | Catch listing/sort/species image |
| V3-CATCH-04 | WP1 | E | No new Catch cover/GPS/schema |
| V3-VIEW-01 | WP1 | E,T | Opt-in original Picture Viewer |
| V3-VIEW-02 | WP1 | E,T | Safe markdown, links and alt |
| V3-VIEW-03 | WP1 | E,T | Broken image fallback |
| V3-CONNECTION-01 | WP1 | C,O | Automatic/Work Offline and state |
| V3-CONNECTION-02 | WP1 | C,O | Offline disables online write |
| V3-CONNECTION-03 | WP1 | C,O | Unprepared library safe fallback |
| V3-CONNECTION-04 | WP1 | O,Q | Atomic verified offline updates |
| V3-CONNECTION-05 | WP1 | O,D | Preserve active edits on mode/release |
| V3-CONNECTION-06 | WP1 | C,A | Approved final six-section owner UX |
| V3-CONNECTION-07 | WP1 | C,D | Offline switch with local draft |
| V3-PERF-01 | WP1 | T | Gear cards visibly load faster |
| V3-PERF-02 | WP1 | T | Measured network/decode causes |
| V3-PERF-03 | WP1 | T | Thumbnail/priority + originals |
| V3-PERF-04 | WP1 | T,O | Search/a11y/offline file accounting |
| V3-PERF-05 | WP5 | T | Measured performance thresholds |
| V3-UPDATE-01 | WP4 | O,Q | Avoid mixed release breakage |
| V3-UPDATE-02 | WP4 | O,D,Q | Safe new-release/draft refresh |
| V3-UPDATE-03 | WP4 | O,D,Q | Online/offline/interrupted update |
| V3-UPDATE-04 | WP4 | Q | Exact hosted/source asset bytes |
| V3-LINK-01 | WP1 | E,T | Accepted Android Custom Tab behavior |
| V3-LINK-02 | WP1 | E,T | YouTube, noopener and safe URLs |
| V3-LINK-03 | WP5 | A,E | Sign-in callback installed-PWA tests |
| V3-DRAFT-01 | WP1 | D | Local unsent edit recovery |
| V3-DRAFT-02 | WP1 | D,O | Restore/Discard after reload |
| V3-DRAFT-03 | WP1 | D,M | Record/Markdown/source/media scope |
| V3-DRAFT-04 | WP1 | D,O | No queued offline GitHub writes |
| V3-DRAFT-05 | WP1 | D,S | Stale restore/quota/failure honesty |
| V3-DRAFT-06 | WP1 | D,P | Clear only verified publication |
| V3-DRAFT-07 | WP5 | D | Owner acceptance or approved removal |
| V3-OPS-01 | WP3 | P,W,C | Accurate progress/no false Live |
| V3-OPS-02 | WP4 | Q,W | History/operational recovery posture |
| V3-OPS-03 | WP1 | C,O | Offline space/release status |
| V3-OPS-04 | WP1 | C | Privacy-safe Copy Diagnostics |
| V3-X-01 | WP5 | E,R | Supported device matrix/variance |
| V3-X-02 | WP1 | S,E,Q | Preserve canonical IDs/records/media |
| V3-X-03 | WP2 | A,S,P | Auth/CSRF/upload security |
| V3-X-04 | WP5 | E,C | Accessible layout/keyboard/touch |
| V3-X-05 | WP5 | D,O,P,W | End-to-end fault matrix |
| V3-X-06 | WP6 | Q | Separate cutover authorization |
| V3-X-07 | WP6 | Q | CI vs hosted/owner/source evidence |
| V3-X-08 | WP0 | Q | Tool availability and owner approval |

## Evidence bundle locator (load only the relevant WP)

D5 private means previously tested against isolated sandbox; D6 means source-only and default disabled unless explicitly noted. Paths below are repository paths; the branch is identified above. `pwa/test` names are the targeted test files, not an assertion of final production acceptance.

- **R:** D6 pwa/src/{entry,app,ui,d6-public-reader}.mjs; pwa/test/{d6-public-reader.test,d6-owner-connection-candidate.spec,browser.spec}.mjs. Read-only CI, not live.
- **E:** D5 pwa/src/{d5-owner-candidate,editor,catch-editor,notes-markdown-editor,notes-link}.mjs; pwa/test/{d5-owner-integration.test,v3-markdown-notes.test,d4-catch-ux.test}.mjs; D6 includes editor files but does not route production editor.
- **C:** D5 pwa/src/{v3-connection-experience,v3-connection,connection-indicator}.mjs and pwa/test/d5-ux-batch.test.mjs; D6 pwa/src/d6-owner-connection-adapter.mjs and pwa/test/{d6-approved-owner-connection.test,d6-owner-connection-candidate.spec}.mjs.
- **O:** pwa/src/{offline,sw,v3-offline-library-action}.mjs and pwa/test/{offline-integrity.test,release-transition.test}.mjs; D5 reading-controls tests and owner field.
- **D:** pwa/src/{d5-device-drafts,d5-editor-recovery}.mjs; D5 private pwa/test/d5-owner-integration.test.mjs; open issue #342; production device durability unaccepted.
- **A:** D6 experiments/p3/preview/src/{d6-production-oauth-session-issuer,d6-production-owner-session,d6-production-owner-signout,d6-production-runtime-bindings}.mjs; matching pwa/test/d6-production-*.test.mjs. Default OFF.
- **S:** D6 pwa/src/d6-canonical-authoring-source.mjs; experiments/p3/preview/src/{d6-canonical-snapshot-loader,d6-owner-source-route,d6-production-source-review}.mjs and matching pwa/test/d6-*.test.mjs.
- **P:** D6 experiments/p3/preview/src/{d6-production-publish-intake,d6-production-operation-receipts,d6-production-pr-creation-fence,d6-production-github-step-writer,d6-production-github-readback}.mjs; matching pwa/test/d6-production-*.test.mjs. Only Gear/KB text intake; source-only.
- **M:** D5 private experiments/p3/preview/src/{d4-media-tickets,d4-git-blob-stage,d4-media-integrity,d3-sandbox-gear-kb-pr}.mjs and experiments/p3/preview/test/{d4-media-tickets.test,d4-git-blob-stage.test,d4-catch-text-publishing.test}.mjs. Sandbox IDs cannot be reused.
- **W:** D5 private experiments/p3/preview/src/{d3-sandbox-scheduled-coordinator,d3-sandbox-operation-runner,d3-fast-watchdog,d3-fast-wake-do}.mjs and test/{d3-fast-watchdog.test,d3-fast-wake-do.test,d3-sandbox-operation-runner.test}.mjs; #303.
- **Q:** D6 pwa/tools/{build,package-d6-static-pages,verify,verify-hosted}.mjs; .github/workflows/fishing-production.yml; D6 experiments/p3/preview/src/d6-production-publish-evidence-gate.mjs; pwa/test/{d6-static-pages-package.test,d6-production-publish-evidence-gate.test}.mjs; #424 run #42919892308 failed.
- **T:** pwa/tools/card-thumbnails.mjs; pwa/test/{card-thumbnails.test,p0b-thumbnail-comparison.spec,fish096.spec,gear-layout.test,static-page-artwork.test}.mjs; related links in pwa/src/markdown.mjs.

## Exceptions requiring WP0 disposition

- **Requirement source count:** 66 explicit IDs (AUTH7, SAVE9, UPLOAD5, CATCH4, VIEW3, CONNECTION7, PERF5, UPDATE4, LINK3, DRAFT7, OPS4, X8). Later detailed Notes/UX amendments remain incorporated in WP1/WP3; use accepted decision catalog, not new feature scope.
- **Supported clients:** V3-X-01 originally includes iPhone; owner later requested focusing Windows/Android and no iPhone testing. Preserve as a documented WP5 acceptance exception requiring confirmation against the approved requirement; do not silently claim iPhone PASS.
- **Drafts:** #342 remains provisional/removable under approved V3-DRAFT-07; do not assume durable on Android or across storage eviction. Media bytes are not stored by current D5 local draft source.
- **Performance:** V3-PERF-05 needs an explicit measured target and environment before WP5 signoff; V3-SAVE-09 ≤60 seconds is already fixed and non-negotiable.
- **Security/publishing:** D6 code/test isolation and D5 sandbox field results do not establish canonical production authorization, Catch/media integration, a working D1 reconciliation coordinator, or verified public Live.
