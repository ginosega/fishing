/**
 * Fishing Companion AUTH-P0: isolated same-origin authentication feasibility worker.
 * No repository modification, publishing, or GitHub App installation tokens.
 * All GitHub OAuth tokens are used solely for identity verification and discarded.
 */
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
      if (req.method === 'GET' && path === '/') return response(TEST_HTML, 200, 'text/html; charset=utf-8');
      if (req.method === 'GET' && path === '/test-client.js') return response(TEST_JS, 200, 'text/javascript; charset=utf-8');
      if (req.method === 'GET' && path === '/test.css') return response(TEST_CSS, 200, 'text/css; charset=utf-8');
      if (req.method === 'GET' && path === '/session') {
        const session = await currentSession(req, env);
        return response({ authenticated: !!session, authorized: !!session && String(session.github_id) === String(env.OWNER_GITHUB_ID) });
      }
      if (req.method === 'GET' && path === '/auth/start') {
        const state = nonce();
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
        if (!state || !code || !flow || state !== flow || !/^[A-Za-z0-9_-]{43}$/.test(state))
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
        return redirect('/', [clearFlow, setCookie(SESSION_COOKIE, sid, SESSION_SECONDS)]);
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