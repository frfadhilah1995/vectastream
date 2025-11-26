/**
 * VectaStream High-Performance CORS Proxy
 * Deployed on Cloudflare Workers (Free Tier Compatible)
 * 
 * Features:
 * 1. Full CORS Support (Access-Control-Allow-Origin)
 * 2. Header Spoofing (Bypasses simple User-Agent/Referer blocks)
 * 3. Stream Passthrough (Low latency for video)
 * 4. Whitelist Protection (Optional)
 * 5. Pre-flight (OPTIONS) handling
 */

// CONFIGURATION
const WHITELIST_ORIGINS = []; // Leave empty to allow all, or add your domain e.g. ['https://vectastream.github.io']
const BLOCKED_AGENTS = ['curl', 'python', 'wget']; // Block bots if needed

// DEFAULT HEADERS TO SPOOF (Makes requests look like a real browser)
const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity;q=1, *;q=0',
    'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'video',
    'sec-fetch-mode': 'no-cors',
    'sec-fetch-site': 'same-origin'
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS Pre-flight
        if (request.method === 'OPTIONS') {
            return handleOptions(request);
        }

        // Parse target URL
        // Usage: https://your-worker.dev/https://target-url.com/file.m3u8
        // Or: https://your-worker.dev/?url=https://target-url.com/file.m3u8
        let targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
            // Try getting from path if not in query param
            const path = url.pathname.substring(1) + url.search; // Remove leading slash
            if (path.startsWith('http')) {
                targetUrl = path;
            }
        }

        if (!targetUrl) {
            return new Response('VectaStream Proxy: No URL provided. Usage: /https://target.com', { status: 400 });
        }

        // Validate URL
        let targetUrlObj;
        try {
            targetUrlObj = new URL(targetUrl);
        } catch (e) {
            return new Response('Invalid URL specified', { status: 400 });
        }

        // Security: Whitelist Check
        const origin = request.headers.get('Origin');
        if (WHITELIST_ORIGINS.length > 0 && origin && !WHITELIST_ORIGINS.includes(origin)) {
            return new Response('Forbidden: Origin not allowed', { status: 403 });
        }

        // Prepare Request Headers
        const modifiedHeaders = new Headers();

        // 1. Apply Default Spoofed Headers
        Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
            modifiedHeaders.set(key, value);
        });

        // 2. CRITICAL: Universal Intelligent Referer & Origin Spoofing
        const targetOrigin = `${targetUrlObj.protocol}//${targetUrlObj.hostname}`;

        // Origin Handling:
        // - HTTPS targets: Send Origin (mimic CORS/Same-Origin)
        // - HTTP targets: Omit Origin (mimic standard request) to avoid confusing legacy servers
        if (targetUrlObj.protocol === 'https:') {
            modifiedHeaders.set('Origin', targetOrigin);
        }

        // Smart Referer Strategy (The "Anti-Mainstream" Fix):
        // Legacy servers (Wowza, Adobe) and some strict CDNs check if the Referer matches the file itself.
        // Instead of the "folder" (directory), we set Referer to the FULL TARGET URL.
        // This is "Self-Referential" and tricks the server into thinking it's a direct player access.
        const smartReferer = targetUrl;
        modifiedHeaders.set('Referer', smartReferer);

        // Special handling for known strict sites
        // Detik logic is now effectively covered by the universal "Full URL" strategy,
        // but we'll keep the block if we need specific tweaks later.
        if (targetUrlObj.hostname.includes('detik.com')) {
            modifiedHeaders.set('Origin', targetOrigin); // Force Origin for Detik
        }

        // 3. Forward specific important headers from client
        const allowedForwardHeaders = ['range', 'if-modified-since', 'cache-control'];
        for (const [key, value] of request.headers) {
            if (allowedForwardHeaders.includes(key.toLowerCase())) {
                modifiedHeaders.set(key, value);
            }
        }

        // 4. Handle Custom Headers passed via Query Params
        for (const [key, value] of url.searchParams) {
            if (key.startsWith('_header_')) {
                const headerName = key.substring(8);
                modifiedHeaders.set(headerName, value);
            }
        }

        try {
            // FETCH TARGET
            const response = await fetch(targetUrl, {
                method: request.method,
                headers: modifiedHeaders,
                redirect: 'follow'
            });

            // Prepare Response Headers (CORS)
            const responseHeaders = new Headers(response.headers);
            responseHeaders.set('Access-Control-Allow-Origin', origin || '*');
            responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
            responseHeaders.set('Access-Control-Allow-Headers', '*');
            responseHeaders.set('Access-Control-Expose-Headers', '*');

            // Debug Headers (Helpful for diagnosing 403/404s)
            responseHeaders.set('X-Debug-Target-Status', response.status);
            responseHeaders.set('X-Debug-Target-Url', targetUrl);

            // Remove troublesome headers
            responseHeaders.delete('X-Frame-Options');
            responseHeaders.delete('Content-Security-Policy');

            // Return Stream
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders
            });

        } catch (error) {
            return new Response(`Proxy Error: ${error.message}`, {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }
    }
};

function handleOptions(request) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '*',
        'Access-Control-Max-Age': '86400',
    };

    return new Response(null, {
        headers: corsHeaders
    });
}
