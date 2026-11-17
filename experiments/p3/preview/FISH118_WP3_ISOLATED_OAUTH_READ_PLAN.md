# FISH-TODO-118 WP3 — proposed isolated OAuth/read host profile

**Source only; default OFF.** This is **not** a deployed Worker, Pages project, OAuth client/redirect registration, D1 migration, credential grant, or publishing acceptance.

## Exact proposed profile

- Worker origin: `https://fishing-v3-wp3-test.ginosega.workers.dev`
- Pages base: `https://fishing-v3-wp3-test.pages.dev/fishing/`
- Existing WP2 read-only host: `https://fishing-d6-wp2-test.ginosega.workers.dev`, preserved with its independent Pages project and credentials.
- Existing public origin: `https://fishing.ginosega.workers.dev`, preserved without V3 writer activation.

Neither WP3 hostname/project has been provisioned or approved as a deployed endpoint. Both values are source-only proposals. Changes to the proposed host must be reviewed and reflected together in all host, origin, OAuth and release checks.

The existing D6 OAuth/read binding contract now supports a third **explicitly selected** runtime profile. Selecting this profile requires all existing trusted owner/repository/global/session capability checks **plus** exact strings `D6_WP3_ISOLATED_READ_ENABLED=true`, `D6_WP3_ISOLATED_PAGES_ENABLED=true` and `D6_WP3_READ_PROFILE_ENABLED=true`. No WP2 staging flag or older Pages flag can be simultaneously enabled. The boolean nature of these values is important: they must be literal string `true` in a server-only Worker environment, not browser-provided values, and default to disabled.

Existing pinned GitHub OAuth `/auth/start` and `/auth/callback`, one-use PKCE state, host-only `__Host-fish_p0_flow` and `__Host-fish_p0_session` cookies, AUTH_DB session lookup, owner authorization, canonical-source read and signout routines are reused. A valid first-party isolated callback sends `redirect_uri` to the exact proposed isolated Worker origin, never the WP2 or production origin; sessions and cookies do not cross hosts. The isolated Pages proxy only serves the matching proposed Pages origin, never the WP2 Pages project or public GitHub Pages source.

## Explicitly excluded from this source PR

No running Worker entrypoint, Cloudflare binding, static hosted files, production branch merge, GitHub App installation/credential permission change, real GitHub publishing, operator write authorization, D1 provisioner, new user-facing API, or WP3 checkpoint acceptance. The source-only read composition exposes `fetch` and the operator-only hosted-byte preflight, not writer methods. There are no new write routes.

## Remaining source-to-host steps

1. Compose the **existing** #497 trusted WP3 write host with this exact isolated OAuth/read profile, using the #500 operation/media/intake/ticket origin gates; keep all write flags and operator approval default OFF. No external Worker mount may occur merely because a module can be imported.
2. Review and implement the dedicated isolated build/release pointer and owner UI origin selection (the current production-root reader/build flags still know only public and WP2 static staging). Confirm the new Pages release is byte-for-byte verifiable before enabling source reads.
3. Produce a narrowly scoped, explicit owner review/approval bundle for *new* Cloudflare Worker/Pages/AUTH_DB/WP3_DB, ten-table WP3 schema, GitHub OAuth callback and GitHub App contents/PR permissions, encrypted secrets and first-party owner-authenticated **isolated** write activation. Existing WP2 deployed resources must not be retargeted or modified.
4. After owner approval and exact-head source CI, run controlled isolated provider publication. Verify real operations/owner CSRF, original media, uncertain-write D1 and independent GET, final **VerifiedPr not Live**, adversarial/recovery tests, source/hosted bytes and owner Windows Edge/Android acceptance as scoped. WP4 still owns public Save→Live.

## Evidence boundary

A source-only CI pass for this PR establishes the isolated OAuth/read profile and its negative tests **only**. Do not count it as a hosted write-enabled WP3 exit or as permission to run an infrastructure command.
