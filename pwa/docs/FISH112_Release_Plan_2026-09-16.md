# FISH112 Release Plan — September 16, 2026

User direction: skip a separate review preview and carry the approved fixed-card-icon implementation directly through the repository Full Application Release path to production. If a production visual issue is found afterward, correct it in a follow-up change.

Required acceptance before merge:

1. Full Application Release classification on the PR.
2. Locked dependency install/audit succeeds.
3. Unit tests, preview build/verification, Chromium/WebKit preview browser tests, production build/verification, and production browser/cutover acceptance succeed.
4. The PR diff remains limited to FISH112 assets/build/style/tests/docs and preserves unrelated source.

Required production closeout after merge:

1. Exact-current-main guard succeeds.
2. GitHub Pages deployment succeeds.
3. Hosted production byte/browser verification succeeds.
4. Durable root project state is updated to mark FISH112 implemented and production-verified.
