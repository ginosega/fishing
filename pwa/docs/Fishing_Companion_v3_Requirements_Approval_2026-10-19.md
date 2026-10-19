# Fishing Companion v3 — Requirements Approval (October 19, 2026)

**Gate outcome:** **REQUIREMENTS APPROVED / SIGNED OFF.** Technical design work is authorized for preparation and review; **technical design is not yet approved**, and application implementation, production deployment, and v3 cutover are not authorized.

## User authorization and exact approved baseline

On October 19, 2026, after reviewing the amended v3 requirements document, the user explicitly stated:

> I approve and sign off on the v3 requirements document as-is.

The approval applies to the exact substantive requirements in:

- **Document:** [Fishing_Companion_v3_Requirements.md](Fishing_Companion_v3_Requirements.md)
- **Reviewed Git main commit:** [`121fafc496238caca1b593885e8f83d4f8f9a865`](https://github.com/ginosega/fishing/commit/121fafc496238caca1b593885e8f83d4f8f9a865)
- **Reviewed file blob SHA:** `2e23686d59cf8ca4fa0ac77ce54cea9379e2b1a1`
- **Immutable reviewed file:** [v3 requirements at the signed-off revision](https://github.com/ginosega/fishing/blob/121fafc496238caca1b593885e8f83d4f8f9a865/pwa/docs/Fishing_Companion_v3_Requirements.md)
- **Requirements review PRs:** [#231](https://github.com/ginosega/fishing/pull/231), [#232](https://github.com/ginosega/fishing/pull/232), [#233](https://github.com/ginosega/fishing/pull/233).

The requirements document was relabeled **APPROVED** after sign-off. Only review/approval metadata and wording describing the completed approval gate changed; **no substantive requirement or decision was altered after the user's sign-off.**

## Approved product decisions and important exclusions

The complete approved requirements document controls; this is an index rather than a substitute:

- Public anonymous reading remains the default. A discreet **Sign in with GitHub** link appears only in **Connection Status**, not in ordinary navigation. Only the owner's authorized GitHub identity can edit/publish; existing valid sessions should be recognized automatically.
- One **Save and Publish** action validates and initiates automatic production publishing without a second manual approval; publication and final verified status remain visible if the user leaves the editor.
- Integrated GitHub-bound authoring/uploads, current-schema Catch Add/Edit, Markdown Picture Viewer integration, persistent Automatic/Work Offline reading mode, a refreshed Connection Status dialog, and improved image-loading/release/mobile-link reliability are in scope.
- Lightweight device-local draft preservation/recovery and continued editing of an already-open draft after selecting Work Offline are **provisional**: they have an explicit test-and-remove gate if reliability suffers.
- Offline authoring of new sessions, queued publication/synchronization, multi-device draft sync, broad multi-user features, Catch photos and GPS, and the v2 user-facing Copy Changes handoff are **out of scope**.
- Source-aware validation, GitHub as durable canonical source, FISH108 Fast Content Release for eligible content, hosted byte/release identity verification, and approval boundaries must remain intact.

## Next phase and restrictions

1. Prepare the **v3 technical architecture/design specification** against the approved requirements and current repository source.
2. Explicitly compare secure GitHub authentication/publishing options, installed-PWA session behavior, trusted authorization, media consistency, publication status, drafts, service-worker/release safety, performance changes, test strategy and recovery.
3. Submit the technical design for **separate user review and explicit sign-off**.
4. Only after the approved design, prepare the staged implementation plan and obtain separate implementation authorization before application code is changed.

This approval record and status reconciliation are **documentation-only**. They must not initiate a Full Application Release or alter canonical Gear/KB/Catch content. No v3 runtime or production release is implied.
