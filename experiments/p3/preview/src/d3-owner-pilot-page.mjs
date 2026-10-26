/**
 * Complete test-only page HTML. This is NOT a derivative of the hosted V2
 * index and does not alter public /fishing/ release files.
 * A future separate owner-authenticated Worker pilot route serves this
 * page with Content-Type text/html, no-store, CSP and X-Robots-Tag:noindex.
 * The corresponding compiled pilot.js must be served on the SAME host
 * behind the SAME owner-session gate; do not enable an anonymous pilot.
 */
export const D3_OWNER_PILOT_PATH='/__d3_pilot__/';
export const D3_OWNER_PILOT_SCRIPT='/__d3_pilot__/pilot.js';
export const D3_OWNER_PILOT_HTML=String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#11665c">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>Fishing Companion · Private Sandbox Test</title>
<script defer src="/__d3_pilot__/pilot.js"></script>
</head>
<body>
<div class="preview-banner">Private Gear / Knowledge Base sandbox · Not public Fishing data</div>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" data-nav href="#/">Fishing <span>Companion</span></a>
    <button id="connection-status" class="connection-status" type="button"
      title="Connection status" aria-label="Connection status">
      <span class="connection-dot" aria-hidden="true"></span>
    </button>
  </div>
</header>
<main id="app" class="site-main" tabindex="-1">
  <p>Loading the private Fishing sandbox…</p>
</main>
<aside id="app-notice" class="site-main" aria-live="polite"></aside>
<dialog id="connection-dialog" class="small-dialog"
  aria-labelledby="connection-title">
  <h2 id="connection-title">Connection status</h2>
  <p id="connection-network"></p>
  <div class="offline-panel">
    <span id="offline-status" class="offline-state" role="status">
      Private test · Online only
    </span>
    <div class="toolbar">
      <button id="offline-update" class="btn secondary"
        type="button" disabled>Update offline library</button>
      <button id="offline-reload" class="btn secondary"
        type="button" disabled>Reload</button>
    </div>
  </div>
  <button id="connection-close" class="btn secondary dialog-close"
    type="button">Close</button>
</dialog>
</body>
</html>`;
