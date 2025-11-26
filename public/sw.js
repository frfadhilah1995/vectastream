/**
 * Ghost Worker - Service Worker for Stream Interception
 * Intercepts HLS requests and applies "Smart Healing" invisibly
 * Features:
 * 1. Protocol Upgrade (HTTP -> HTTPS Proxy) to fix Mixed Content
 * 2. Race Mode (Exponential Speed)
 */

const CACHE_NAME = 'vectastream-ghost-v2';
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
                    if (!res.ok) throw new Error('Direct failed');
                    return res;
                })
        );
    }

    // 2. Cloudflare Proxy Strategy (Primary)
    // Handles Mixed Content by upgrading to HTTPS via proxy
    const proxyUrl = `${PROXY_URL}/${url}`;
    strategies.push(
        fetch(proxyUrl)
            .then(res => {
                if (!res.ok) throw new Error('Proxy failed');
                return res;
            })
    );

    // 3. CORS Anywhere Strategy (Backup)
    const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    strategies.push(
        fetch(corsUrl)
            .then(res => {
                if (!res.ok) throw new Error('CORS Anywhere failed');
                return res;
            })
    );

    try {
        // 🏁 RACE! First successful response wins
        // This is "Exponential" - we don't wait for timeouts
        const winner = await Promise.any(strategies);

        // Clone response to be safe
        return new Response(winner.body, {
            status: 200,
            statusText: 'OK',
            headers: winner.headers
        });

    } catch (aggregateError) {
        console.error('[GhostWorker] ❌ All strategies failed:', aggregateError);
        return new Response('Stream unavailable via Ghost Worker', { status: 404 });
    }
}
