/**
 * Ghost Worker - Service Worker for Stream Interception
 * Intercepts HLS requests and applies "Smart Healing" invisibly
 */

const CACHE_NAME = 'vectastream-ghost-v1';
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

    // 1. Try Direct First (Fastest)
    try {
        const directResponse = await fetch(request, {
            mode: 'cors',
            credentials: 'omit'
        });

        if (directResponse.ok) return directResponse;
    } catch (e) {
        // Ignore direct failure
    }

    // 2. Try via Cloudflare Proxy (Standard)
    try {
        const proxyUrl = `${PROXY_URL}/${url}`;
        const proxyResponse = await fetch(proxyUrl);

        if (proxyResponse.ok) return proxyResponse;
    } catch (e) {
        // Ignore proxy failure
    }

    // 3. Try via CORS Anywhere (Backup)
    try {
        const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const corsResponse = await fetch(corsUrl);

        if (corsResponse.ok) return corsResponse;
    } catch (e) {
        // Ignore backup failure
    }

    // 4. If all fail, return a 404 or custom error
    return new Response('Stream unavailable via Ghost Worker', { status: 404 });
}
