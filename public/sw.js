/**
 * Ghost Worker V3 - Service Worker for Stream Interception
 * Intercepts HLS requests and applies "Smart Healing" invisibly
 * Features:
 * 1. Protocol Upgrade (HTTP -> HTTPS Proxy) to fix Mixed Content
 * 2. Race Mode (Exponential Speed)
 * 3. Reliable Proxy Fallbacks
 */

const CACHE_NAME = 'vectastream-ghost-v3';
const PROXY_URL = 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[GhostWorker] 👻 Installed and ready to haunt!');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    console.log('[GhostWorker] 👻 Activated and controlling clients');
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Only intercept HLS streams (.m3u8 and .ts)
    if (url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.ts')) {
        event.respondWith(handleStreamRequest(event.request));
    }
});

/**
 * Handle stream request with "Race Logic"
 */
async function handleStreamRequest(request) {
    const url = request.url;
    const isMixedContent = self.location.protocol === 'https:' && url.startsWith('http:');

    // Strategies to race
    const strategies = [];

    // 1. Direct Strategy (Only if NOT Mixed Content)
    if (!isMixedContent) {
        strategies.push(
            fetch(request, { mode: 'cors', credentials: 'omit' })
                .then(res => {
                    if (!res.ok) throw new Error(`Direct failed: ${res.status}`);
                    console.log('[GhostWorker] ✅ Direct success');
                    return res;
                })
        );
    } else {
        console.log('[GhostWorker] ⚠️ Skipping direct (Mixed Content)');
    }

    // 2. Cloudflare Proxy Strategy (Primary)
    const proxyUrl = `${PROXY_URL}/${url}`;
    strategies.push(
        fetch(proxyUrl)
            .then(res => {
                if (!res.ok) throw new Error(`Cloudflare Proxy failed: ${res.status}`);
                console.log('[GhostWorker] ✅ Cloudflare Proxy success');
                return res;
            })
    );

    // 3. REMOVED: allorigins.win (unreliable, CORS issues)

    // If no strategies available (shouldn't happen), return error
    if (strategies.length === 0) {
        console.error('[GhostWorker] ❌ No strategies available');
        return new Response('No available strategies', { status: 500 });
    }

    try {
        // 🏁 RACE! First successful response wins
        const winner = await Promise.any(strategies);

        // Clone response to be safe
        return new Response(winner.body, {
            status: 200,
            statusText: 'OK',
            headers: winner.headers
        });

    } catch (aggregateError) {
        console.error('[GhostWorker] ❌ All strategies failed:', aggregateError);

        // Return specific error for debugging
        return new Response(
            JSON.stringify({
                error: 'Stream unavailable via Ghost Worker',
                url: url,
                reasons: aggregateError.errors?.map(e => e.message) || []
            }),
            {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
