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
export async function gatewayResponse(request) {
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
      headers: {'Accept': '*/*'},
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
  const headers = new Headers(GATEWAY_HEADERS);
  const contentType = result.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);
  // Body must remain a byte-for-byte untouched stream (no HTML rewriting).
  // No upstream Set-Cookie, Location, Access-Control-Allow-Origin, Content-Length,
  // Transfer-Encoding, Content-Encoding or other response metadata is reflected.
  return new Response(request.method === 'HEAD' ? null : result.body, {status: 200, headers});
}
