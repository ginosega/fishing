# Fishing Project — decision topics (candidate)

**Status:** Draft P2 index. Original owner approvals and decisions remain authoritative; these catalogs are discovery aids, not new authorization. Read **only the topic relevant to the problem**.

| Topic | Scope / search terms | Catalog |
| --- | --- | --- |
| Publishing / CI | FISH108, save, merge, verified Live, latency, attestor, D1 receipts, hosted bytes | [publishing](decisions/topics/publishing.md) |
| Security / authorization | OAuth, sessions, GitHub App, CSRF, Worker, origin, secrets, permission | [security-auth](decisions/topics/security-auth.md) |
| Architecture / delivery | same-origin gateway, P3, D1–D6, rejected extra services, complexity | [architecture](decisions/topics/architecture.md) |
| Editor / UX | Notes, Catch Add, link picker, photo, viewer, Connection Status | [editor-ux](decisions/topics/editor-ux.md) |
| Offline / reliability | FISH091, drafts, stale release, PWA, service worker, thumbnail | [offline-reliability](decisions/topics/offline-reliability.md) |
| Operating model | bootstrap, transfer, Chat/Work, evidence, project state | [project-operations](decisions/topics/project-operations.md) |
| Content / fishing equipment | KB editorial, Gear, purchases, kayaks, retired pages | [content-and-gear](decisions/topics/content-and-gear.md) |

For each topic: review a compact catalog row (decision ID, status, alternatives, reason, `reconsider_only_if`, original evidence link); fetch only matching individual [records](decisions/records/) or source sections. Where a decision was recorded only as a legacy section, link there without rewriting its original owner approval.

For a new substantial proposal, search synonyms and rejected/deferred decisions **before** recommending an approach. For ambiguous cross-topic issues, open at most two relevant catalogs first; expand only as evidence requires. Legacy historical sections are indexed in [LEGACY_DECISION_CROSSWALK.md](LEGACY_DECISION_CROSSWALK.md).

**Growth policy:** This file targets <= 5 KB (8 KB hard cap). Topic catalogs target <= 8 KB (12 KB hard). Split by meaningful subtopic, add its link here, and keep previous canonical records stable. Update index/catalog/record references in the same PR; never fabricate an approval.
