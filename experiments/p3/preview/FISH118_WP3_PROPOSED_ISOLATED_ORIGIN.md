# FISH-TODO-118 WP3 — proposed isolated owner-write origin boundary

**Status:** Source-only, unmounted, default OFF. **Not a hosting approval or deployed service.**

## Why this is required

The accepted WP2 isolated Worker/Pages checkpoint has a read-only OAuth and canonical-source gateway. The production-candidate WP3 authoring modules currently pin `https://fishing.ginosega.workers.dev`, the public Worker origin, for all direct-write routes and D2 owner/CSRF calls. Neither the approved WP2 staging Worker nor public V2 may be silently turned into a writer.

This PR introduces one **proposed, not created or reserved** isolated owner publishing origin:

`https://fishing-v3-wp3-test.ginosega.workers.dev`

It is a source candidate; the owner must approve the actual hostname and associated Worker/Pages/OAuth callback before any deployment. If the name changes after review, the exact pin and all test fixtures must change together.

## Exact scope of this PR

A single immutable origin-profile module supplies the two allowed HTTPS origins: the established canonical production hostname (default), and the proposed WP3 isolated hostname (independently disabled by default). Only server-side constructor dependencies can select an origin and enable the isolated profile. Browser request URL, Origin header, query, cookies or JSON cannot select or activate it.

The existing single-gateway operation/media write routes, canonical Accepted-operation intake (still the **same D2 owner session and CSRF**) and signed media-ticket issuer/verifier all use this exact selected, validated origin. They recheck the isolated enable gate at request time or before signing/verifying. Original media ticket HMAC signatures are bound to the origin so a ticket signed in one environment cannot be replayed in another. Existing public default behavior is preserved.

The code imports **no** Worker entrypoint, GitHub credentials, D1 schema-applier, provider mutation or production deployment; no new API, owner identity authority, writer, ticket type or auth bypass. Existing method/path/session/fence/receipt/independent-proof restrictions remain unchanged. Gate revocation fails closed.

## Proposed next bounded step: trusted isolated-host composition

A **separate** follow-up must connect the exact dedicated isolated hostname through the existing WP2 OAuth/read gateway without reusing the WP2 staging hostname or public V2, and explicitly bind:
- a fresh, isolated same-origin OAuth callback/session/CSRF key and a distinct `AUTH_DB` session store (not copied from WP2 staging);
- an isolated `WP3_DB` matching the ten-table read-only schema plan, with owner-approved provisioning only;
- a dedicated Worker/Pages origin and pinned deployed asset/manifest release, private GitHub App installation and minimally scoped read/write token grants (no app private key in browser);
- independently gated write mount, write switch, write-family switch, and per-step owner approval, all default OFF;
- negative same-site/cross-origin/expired-owner/CSRF denial evidence before D1 writes or provider tokens, and separate original-media staged-byte proofs.

The host's current `createD6ProductionRuntimeBindingContract` supports public and WP2 read-only staging profiles only; this PR **does not** make it an isolated write host. No new OAuth redirects, DNS/Worker bindings, Pages deployments, secrets, database migrations, real GitHub content mutations or public Live are authorized.

A successful CI run means the **origin boundary** is source-integrated, not that the isolated environment exists, is writable, or has passed the WP3 hosted checkpoint. The approved WP3 exit still requires a controlled real GitHub PR and independent recovery/failure evidence. WP4 owns hosted Save→verified public Live.
