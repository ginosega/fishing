/**
 * Fishing Companion AUTH-P0: CLOUDFLARE DASHBOARD EDITOR SINGLE-FILE DEPLOYMENT.
 * Nonproduction identity feasibility ONLY. No repository write endpoints or tokens.
 * Generated from experiments/auth-p0/src/worker.mjs + public assets.
 * For the Worker: fishing-auth-p0-test.ginosega.workers.dev
 * Required: D1 binding DB; vars APP_ORIGIN, GITHUB_CLIENT_ID,
 * GITHUB_CLIENT_SECRET, OWNER_GITHUB_ID (the latter three Cloudflare secrets).
 * NEVER paste secrets into this file.
 */
/**
 * Fishing Companion AUTH-P0: isolated same-origin authentication feasibility worker.
 * No repository modification, publishing, or GitHub App installation tokens.
 * All GitHub OAuth tokens are used solely for identity verification and discarded.
 */
// Read-only same-origin Pages gateway: exact same source as gateway.mjs.
/**
 * AUTH-P0 only: immutable-origin, read-only forwarding for published public Fishing Companion bytes.
 * Do not add publishing APIs, user-supplied upstream URLs, credential forwarding or HTML injection.
 * The canonical GitHub Pages /fishing/ release is verified by its existing PWA SW/manifest.
 */
const GATEWAY_PREFIX = '/fishing/';
const GATEWAY_ORIGIN = 'https://ginosega.github.io';
const GATEWAY_CACHE_POLICY = 'no-store';
const GATEWAY_HEADERS = {
  'Cache-Control': GATEWAY_CACHE_POLICY,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
};

/** Return a Response for gateway routes, or null for non-gateway routes. */
async function gatewayResponse(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/fishing') {
    return new Response(null, {status: 308, headers: {...GATEWAY_HEADERS, Location: GATEWAY_PREFIX}});
  }
  if (!path.startsWith(GATEWAY_PREFIX)) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Read-only gateway', {status: 405, headers: {...GATEWAY_HEADERS, Allow: 'GET, HEAD'}});
  }
  // Do not let differing slash/backslash decoding or encoded NULs reclassify paths downstream.
  if (/%(?:2f|5c|00)/i.test(path) || path.includes('\\')) {
    return new Response('Invalid asset path', {status: 400, headers: GATEWAY_HEADERS});
  }
  // Upstream hostname is hard-coded. Forward no inbound cookies, Authorization,
  // Origin, Forwarded, CORS or other browser request headers to Pages.
  const upstream = new URL(GATEWAY_ORIGIN);
  upstream.pathname = path;
  upstream.search = url.search;
  let result;
  try {
    result = await fetch(upstream.href, {
      method: request.method,
      headers: {'Accept': '*/*', 'Accept-Encoding': 'identity'},
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return new Response('Public gateway upstream unavailable', {status: 502, headers: GATEWAY_HEADERS});
  }
  if (result.status >= 300 && result.status < 400) {
    // Never follow untrusted upstream redirect or reflect its Location header.
    return new Response('Public gateway redirect denied', {status: 502, headers: GATEWAY_HEADERS});
  }
  if (result.status !== 200 && result.status !== 404) {
    return new Response('Public gateway upstream error', {status: 502, headers: GATEWAY_HEADERS});
  }
  if (result.status === 404) {
    return new Response('Public file not found', {status: 404, headers: GATEWAY_HEADERS});
  }
  // Forward only identity-encoded bodies; otherwise cached release hashes would not match.
  const encoding = result.headers.get('Content-Encoding');
  if (encoding && encoding.toLowerCase() !== 'identity') {
    return new Response('Unsupported upstream asset encoding', {status: 502, headers: GATEWAY_HEADERS});
  }
  const headers = new Headers(GATEWAY_HEADERS);
  const contentType = result.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);
  // Body must remain a byte-for-byte untouched stream (no HTML rewriting).
  // No upstream Set-Cookie, Location, Access-Control-Allow-Origin, Content-Length,
  // Transfer-Encoding, Content-Encoding or other response metadata is reflected.
  return new Response(request.method === 'HEAD' ? null : result.body, {status: 200, headers});
}

const FLOW_COOKIE = '__Host-fish_p0_flow';
const SESSION_COOKIE = '__Host-fish_p0_session';
const FLOW_SECONDS = 600;
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const HEADERS = {
  'Cache-Control': 'no-store, private',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; manifest-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};
const encoder = new TextEncoder();
const nowSeconds = () => Math.floor(Date.now() / 1000);
const bytesToB64url = (array) => {
  let s = '';
  for (const b of array) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};
const nonce = () => bytesToB64url(crypto.getRandomValues(new Uint8Array(32)));
async function hash(value) {
  return bytesToB64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
function cookies(req) {
  const result = {};
  for (const piece of (req.headers.get('Cookie') || '').split(';')) {
    const index = piece.indexOf('=');
    if (index > 0) result[piece.slice(0, index).trim()] = piece.slice(index + 1).trim();
  }
  return result;
}
function setCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}
function response(body, status = 200, type = 'application/json; charset=utf-8', extra = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { ...HEADERS, 'Content-Type': type, ...extra },
  });
}
// Self-contained dashboard-editor build: test-only PWA assets are served from this Worker.
// Keep in sync with src/worker.mjs and public/ when updating this generated copy.
const P0_MANIFEST = "{\n  \"name\": \"Fishing AUTH-P0 Test \u2014 Not Production\",\n  \"short_name\": \"Fishing P0 Test\",\n  \"description\": \"Isolated GitHub login and installed PWA session experiment\",\n  \"id\": \"/?pwa-test=1\",\n  \"start_url\": \"/?pwa-test=1\",\n  \"scope\": \"/\",\n  \"display\": \"standalone\",\n  \"theme_color\": \"#0e4335\",\n  \"background_color\": \"#ffffff\",\n  \"icons\": [\n    { \"src\": \"/icon-192.png\", \"sizes\": \"192x192\", \"type\": \"image/png\" },\n    { \"src\": \"/icon-512.png\", \"sizes\": \"512x512\", \"type\": \"image/png\", \"purpose\": \"any maskable\" }\n  ]\n}\n";
const P0_SW = "// Installed-PWA test shell ONLY. Do not cache auth callbacks or owner sessions.\nself.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));\nself.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));\nself.addEventListener('fetch', () => {});\n";
const P0_ICON192 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAADPklEQVR42u3dPU4kSxCFUUilzW7wkXoR+CwMn12wM/AwED8SZFdlxD1HGvsNGfFVds0bmNu7y/3bDYQajgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAARAI68vzwLA8gsAyy8AEACe/gLA8gsAyy8ALL8AsPwCAAHg6S8ALL8AsPwCwPILAC/BjoDUp78AiF5+ARC9/AIgevkFQPTyC4B40xGc+7R6eHxyngLIHchv/+1ugey0/JEB7DaAv/x+q0ax49lPy97j69o9il1nMS19v6878b0iOoDUpa8Sw87zmZZeDMlzmpZeDMnzmhY/O4ZrhVBlZtPiCyH5xXlafFaHUGl+w/Kz8vyrzW9afFbdBhVnOCw/K+ZSdYbD8vPf+VSe4ei+/A+PTx+/8JD67Pbucv/W8VB/Wni3zrozPfMsVzzURsfl55i5dZjj6Lj8vz0ZfBz6//y6PMRGt+XHHLcMwPLjI9AmsYmRQwOwcOyq7fcEf/W/84XI4QGcvXSWnrh3ABAACAAEAAIAAYAA4MAA/M1L3ACQHIBbADcAJAfgFiD+BhBBD53mOBwef5lflzmOMw8RT/7Yl2AR1F/+DjMcux0qtZ781Wc4dj5canzsqTzDUeWQ2XsuVWd42s8G/Y7v4a39QDpyfmV/NqjboOfyuwHcBhb/wLmt+D1vHYAQ6j7xd/ghyG0CEELNjzpn/hsQLQMQQ73P99ecU3QAYqjzUnut+QhADNsu/RFzWfF1zs7DT4rBHx+7AWJuiKrLvvrsfQQKiKLbk33lWQugQSCJH11WnacAiI6g5d8Fwkv7kQRAdAQCIJoAiL4FBEB0BAIgOgIBEB2BAIiOQABEEwDRt4AAiI5AAERHIACiIxAA0REIgOgIBEA0ARB9CwiA6AgEQHQEvicY7wAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAIAAYAAQAAgABAACAAEAAKAb7wDIAg3ZP3Zeq4AAAAASUVORK5CYII=";
const P0_ICON512 = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAKYUlEQVR42u3dwW0qSxBAUYO8Jhv2SATBnsDYkwWZ4b1lLMti6KHvORn8Yar60vb32+yO+/sHAJCy9QgAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAEAAAgAAEAAAAACAAAQAACAAAAABAAAIAAAAAEAAAgAAEAAAAACAAAQAACAAAAABAAAIAAAAAEAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAAAIAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAQAAAgAjwAABAAAIAAAAAEAAAgAAEAAAAACAAAQAACAAAAABAAAIAAAAAEAAAgAAEAAAAACAAAQAACAAAAABAAACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAEAAAgAAAAAQAACAAAAABAAAIAABAAADAlG7XiwAAAIe/AAAAh78AAAAEAAD49i8AAMDhLwAAwOEvAADA4S8AAAABAAC+/QsAAHD4CwAAcPgLAABw+AsAAKgSAAAQ+/YvAAAgePgLAAAIHv4CAACCh78AAIAoAQCAb/8CAAAc/gIAABz+AgAAHP4CAAAc/gIAABAAAODbvwAAAIe/AAAAh78AAACHvwAAAAQAAPj2LwAAwOEvAADA4S8AAHD4IwAAAAEAgG//CAAAHP4CAAAc/gIAABz+AgAAEAAA4Nu/AAAAh78AAACHvwAAAIe/AAAABAAA+PYvAADA4S8AAHD4O/wFAAAOfwQAACAAAPDtHwEAgMMfAQCAwx8BAIDDXwAAAAIAAHz7n9inRwDzLKrD6eyDwUwhAKC2eP7z3yEaMIMCACwWz0ckYEYFAFge/O0ZCwQQAOCg99kIA8y1AAALwWcpDDDrAgAsAB587qLAO4AAwNDj3RAE9gACAIOOd0cQgADAgY93SxDYEQgADDPePUFgXyAAMMB4NwWB3YEAwODivRUDdggCAAOLGBADdgkCAIOKGAABgEMfxAD2iwDAUIIYwJ4RABhIyM2KELBrBAAGEdwKeCB2jgDAEIJbARAAOPhBCGD/CAAMHbTmTgzYQwIAAwduBewiBACGDYSAfYQAwKCBEAABgIMfhIDdxChbj8CAAebYf5MbAAwX4DbAfhIAGCxACNhRAgBDBQgBpuB3ABz+gPm3q9wAYJgAtwH2lRsADBOQ3wv2lRsADBIQuw2ws9wAYJAA+wIBgGEGZt8b9tbc/AjAAAFvsENe/SMBu8sNAAYIiO0Tu0sAYICA2F6xuwQABgiwXxAAGE5g9j1jf7X4JUDDs4jffmHJc4Ln7Jtn/mKguezZ7I77u8dgeF5x8HtmMHbmzOJ6P4MR/AjA4T9sCPwraDB+/9hfXQLA4T+0gEUA2EMIAEMXO/xFAIzdR3aYAMDhP/zwFgHw2r1khyEAHP5AbD/ZYQgAh/+qvrW7BYDl95QdhgBw+AP2FQIAAFGAAMDgAFPtLTuM7/wpYIc/YH/hBgAAEACoZwAEgMOfJZ+P5w0gAAAAAeDb/+zPyfMGEADEIsDhDyAAfPuPPTPPGkAAEIsAhz/AOP4QkENpkef32z/s4xkDCACEFAAD+BEAAAgA31oBQAAAAAIAABAAAIAAAAAEwJvxC4AACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAAAJgUYfT2UMAQAAAAAIAABAAAIAAAAAEwLvyi4AACAAAQAAAAAJgWn4MAIAAAAAEgFsAABAAAIAAcAsAAAIAABAAbgEAQACIAAAQAACAAHALAAACQAQAgAAAwBcXBIBhAni0r+wtBIAIAKJ7yt5CAIgAILqf7C0EgAgAonvJ3kIAiADAPkIAYOiAyh6ysxAAIgCI7h87CwEgAoDo3rGzEAAiAIjuGztLACACgOiesbMEACIAiO4XO0sAYKCA6F6xswQABgqwTwjY7I77u8ewvNv14iEAqz/47apOnLkB8IIA9oZdFSQADBZgX9hVQX4EMIhrNmDth689NXcwuQHwwgD2gj3lBgCVDTho7Sg3AHh5gPz821Fz+vQI1jVgShsc/PAKfgSwUkIAHPz2ks9UAAgBwCFhJ/lsn8rvAHixAHNsJwW5AVDegMPSPgp+zgLA4AEOBLtIAGD4AAe/PVT43P1vgBO8dAYQHADgBsCtgIcADn17x7sgAAwkYNnbOd4JAWAoAQe/fePdEACGE3Do2zMCAAMKOPjtGAGAQQVLHLtFAGBgweLGTpnmPfJ3APjxJRYDWNYwNzcAqHgc+tgfwfdLAGCYsZSxNwQAGGwsYewKAQCGHEsX+0EAgIHHksVOEABg+LFUye8BAQAWAQ58grPv7wDAkwZHFDjsATcAIAwc9Jhp77kAAGFgAWJ+vf8CAASCBYcZNR8CAESCwx0zaIYEAOQWlsMcM2XuBAAAIkAAPLT1ugHgMO0RAAAgAADALYAAAAARIAAAQAQIAAAQAQIAAESAAAAAESAAAAABAABuAQQAAIgAAQAAIkAAAIAIEAAAIAIEAAAiAAEAgAhAAAAAAgAAtwAIAABEgAAAABEgAABABAgAABABAgAARIAAAAARIAAAAAEAAG4BBAAAiAABAAAiQAAAgAgQAAAgAgQAAIgAAQAACAAAcAsgAABABAgAABABAgAAshEgAAAgGAECAACCESAAACAYAQIAAIIEAAAEbwEEAAAEI0AAAEAwAgQAAAQjQAAAQDACBAAABCNAAABAMAIEAAAECQAACN4CCAAACEaAAACAYARsdsf93ccIAC1uAABAAAAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAACAAAAABAAAIAAAAAEAAAgAAEAAAAACAAAQAACAAAAABAAAIAAAAAEAAAgAAEAAAAACAAAQAACAAAAAAQAACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAABAAAIAAAAAEAAAgAAEAAAAACAAAQAACAAAAABAAAIAAAAAEAAAgAAEAAAAACAAAQAACAAAAABAAAIAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAAAIAABAAAIAAAAAEAAAgAAAAAQAACAAAQAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAAEAAAgAAEAAAAACAAAQAADAe/kCgS4p7YTAooQAAAAASUVORK5CYII=";
function p0Static(req, path) {
  if (req.method !== 'GET') return null;
  if (path === '/manifest.webmanifest') return response(P0_MANIFEST, 200, 'application/manifest+json; charset=utf-8');
  if (path === '/sw.js') return response(P0_SW, 200, 'text/javascript; charset=utf-8', {'Service-Worker-Allowed': '/'});
  const data = path === '/icon-192.png' ? P0_ICON192 : path === '/icon-512.png' ? P0_ICON512 : null;
  if (data !== null) {
    const binary = atob(data);
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    return new Response(bytes, { status: 200, headers: {...HEADERS, 'Content-Type': 'image/png'} });
  }
  return null;
}

function withCookies(res, values) {
  for (const value of values) res.headers.append('Set-Cookie', value);
  return res;
}
function redirect(location, cookiesToSet = []) {
  return withCookies(new Response(null, {
    status: 303,
    headers: { ...HEADERS, Location: location },
  }), cookiesToSet);
}
function error(status, reason) { return response({ error: reason }, status); }
function originAllowed(req, origin) {
  return req.headers.get('Origin') === origin &&
    (req.headers.get('Sec-Fetch-Site') || 'same-origin') === 'same-origin' &&
    req.headers.get('X-Fish-P0-Intent') === 'signout';
}
function configOk(env) {
  try {
    const url = new URL(env.APP_ORIGIN);
    return url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash &&
      String(Number(env.OWNER_GITHUB_ID)) === String(env.OWNER_GITHUB_ID) &&
      !!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET && !!env.DB;
  } catch { return false; }
}
async function currentSession(req, env) {
  const secret = cookies(req)[SESSION_COOKIE];
  if (!secret || !/^[A-Za-z0-9_-]{43}$/.test(secret)) return null;
  return env.DB.prepare('SELECT github_id, expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(await hash(secret), nowSeconds()).first();
}
async function githubIdentity(code, verifier, env) {
  const callback = `${env.APP_ORIGIN}/auth/callback`;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'Fishing-Auth-P0' },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
      code, redirect_uri: callback, code_verifier: verifier }),
    signal: AbortSignal.timeout(10000),
  });
  if (!tokenRes.ok) throw new Error('GitHub token exchange failed');
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token || tokenData.token_type?.toLowerCase() !== 'bearer')
    throw new Error('GitHub denied authorization');
  // Never persist, return, log, or write the GitHub token into a browser cookie.
  const identityRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Fishing-Auth-P0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!identityRes.ok) throw new Error('GitHub identity lookup failed');
  const identity = await identityRes.json();
  if (!Number.isSafeInteger(identity.id) || identity.id <= 0) throw new Error('Invalid GitHub user id');
  return { id: identity.id, login: identity.login };
}
const TEST_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><title>Fishing AUTH-P0 test</title><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#0e4335"><link rel="stylesheet" href="/test.css"></head>
<body><main><h1>Fishing Companion · AUTH-P0</h1>
<p>Isolated authentication feasibility test. No connection to the live Fishing Companion or publishing services.</p>
<section aria-label="Connection Status proof"><h2>Connection Status — authentication test</h2>
<p id="status" role="status">Checking session…</p>
<a href="/auth/start" id="signin">Sign in with GitHub</a>
<button id="signout" type="button" hidden>Sign out</button>
<button id="revoke" type="button" hidden>Revoke all test sessions</button></section>
<p>Tests: sign in, close and reopen, installed PWA return, sign out, revocation, blocked cookies.</p>
 <p><a href="/fishing/">Open read-only Fishing Companion via the isolated gateway</a></p>
 <p><a href="/auth/start?return=%2Ffishing%2F">Start owner sign-in then return to the gateway PWA</a> (not a feature of production Fishing Companion)</p>
</main><script src="/test-client.js" defer></script></body></html>`;
const TEST_JS = `const statusNode=document.querySelector('#status');
const signin=document.querySelector('#signin');const signout=document.querySelector('#signout');const revoke=document.querySelector('#revoke');
async function refresh(){try{const r=await fetch('/session',{cache:'no-store',credentials:'same-origin'});const s=await r.json();
statusNode.textContent=s.authorized?'Signed in as the approved owner':'Anonymous — read only';
signin.hidden=!!s.authorized;signout.hidden=!s.authorized;revoke.hidden=!s.authorized;
}catch{statusNode.textContent='Session check unavailable';}}
async function action(url){const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'X-Fish-P0-Intent':'signout'}});
if(!r.ok)statusNode.textContent='Action failed ('+r.status+')';else await refresh();}
signout.addEventListener('click',()=>action('/session/signout'));
revoke.addEventListener('click',()=>action('/session/revoke-all'));
if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
refresh();`;
const TEST_CSS = `body{font:16px system-ui,sans-serif;margin:2rem auto;max-width:42rem;padding:0 1rem;line-height:1.5;background:#f3f6f2;color:#153524}main{padding:2rem;background:white;border-radius:1rem}section{border:1px solid #9fb8a9;padding:1rem;border-radius:.5rem}button,a{margin:.5rem .5rem .5rem 0}button{padding:.4rem .7rem}`;

export default {
  async fetch(req, env) {
    if (!configOk(env)) return error(503, 'Test environment is not configured');
    const origin = new URL(req.url).origin;
    if (origin !== env.APP_ORIGIN) return error(421, 'Unexpected host');
    const url = new URL(req.url);
    const path = url.pathname;
    try {
      const proxied = await gatewayResponse(req);
      if (proxied) return proxied;
      const staticAsset = p0Static(req, path);
      if (staticAsset) return staticAsset;
      if (req.method === 'GET' && path === '/') return response(TEST_HTML, 200, 'text/html; charset=utf-8');
      if (req.method === 'GET' && path === '/test-client.js') return response(TEST_JS, 200, 'text/javascript; charset=utf-8');
      if (req.method === 'GET' && path === '/test.css') return response(TEST_CSS, 200, 'text/css; charset=utf-8');
      if (req.method === 'GET' && path === '/session') {
        const session = await currentSession(req, env);
        return response({ authenticated: !!session, authorized: !!session && String(session.github_id) === String(env.OWNER_GITHUB_ID) });
      }
      if (req.method === 'GET' && path === '/auth/start') {
        const destination = url.searchParams.get('return');
        if (destination !== null && destination !== '/fishing/') return error(400, 'Invalid return target');
        const state = nonce() + (destination === '/fishing/' ? '.f' : '');
        const verifier = nonce();
        await env.DB.prepare('INSERT INTO auth_flows (state_hash, code_verifier, expires_at) VALUES (?, ?, ?)')
          .bind(await hash(state), verifier, nowSeconds() + FLOW_SECONDS).run();
        const auth = new URL('https://github.com/login/oauth/authorize');
        auth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
        auth.searchParams.set('redirect_uri', `${env.APP_ORIGIN}/auth/callback`);
        auth.searchParams.set('state', state);
        auth.searchParams.set('code_challenge', await hash(verifier));
        auth.searchParams.set('code_challenge_method', 'S256');
        auth.searchParams.set('allow_signup', 'false');
        return redirect(auth.toString(), [setCookie(FLOW_COOKIE, state, FLOW_SECONDS)]);
      }
      if (req.method === 'GET' && path === '/auth/callback') {
        const clearFlow = setCookie(FLOW_COOKIE, '', 0);
        const state = url.searchParams.get('state');
        const code = url.searchParams.get('code');
        const flow = cookies(req)[FLOW_COOKIE];
        if (!state || !code || !flow || state !== flow || !/^[A-Za-z0-9_-]{43}(?:\.f)?$/.test(state))
          return withCookies(error(400, 'Invalid OAuth callback'), [clearFlow]);
        // Atomic, single-use state. Parallel callbacks cannot both consume the row.
        const pending = await env.DB.prepare('DELETE FROM auth_flows WHERE state_hash = ? AND expires_at > ? RETURNING code_verifier')
          .bind(await hash(state), nowSeconds()).first();
        if (!pending) return withCookies(error(400, 'Expired or replayed OAuth state'), [clearFlow]);
        const identity = await githubIdentity(code, pending.code_verifier, env);
        if (String(identity.id) !== String(env.OWNER_GITHUB_ID))
          return withCookies(error(403, 'This account is not authorized'), [clearFlow]);
        const sid = nonce();
        await env.DB.prepare('INSERT INTO sessions (token_hash, github_id, expires_at) VALUES (?, ?, ?)')
          .bind(await hash(sid), identity.id, nowSeconds() + SESSION_SECONDS).run();
        return redirect(state.endsWith('.f') ? '/fishing/' : '/', [clearFlow, setCookie(SESSION_COOKIE, sid, SESSION_SECONDS)]);
      }
      if (req.method === 'POST' && (path === '/session/signout' || path === '/session/revoke-all')) {
        if (!originAllowed(req, env.APP_ORIGIN)) return error(403, 'Cross-origin or invalid request');
        const secret = cookies(req)[SESSION_COOKIE];
        if (secret && /^[A-Za-z0-9_-]{43}$/.test(secret)) {
          const session = await currentSession(req, env);
          if (path === '/session/revoke-all') {
            if (!session || String(session.github_id) !== String(env.OWNER_GITHUB_ID)) return error(403, 'Not authorized');
            await env.DB.prepare('DELETE FROM sessions WHERE github_id = ?').bind(session.github_id).run();
          } else {
            await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(secret)).run();
          }
        } else if (path === '/session/revoke-all') return error(403, 'Not authorized');
        return withCookies(response({ signedOut: true }), [setCookie(SESSION_COOKIE, '', 0)]);
      }
      // Explicitly no write API or GitHub App installation token in P1.
      return error(404, 'Not found');
    } catch {
      // No request URLs, OAuth codes, tokens, cookies, or identity details in errors/logs.
      return error(502, 'Authentication test temporarily unavailable');
    }
  },
};