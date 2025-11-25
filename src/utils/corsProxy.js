// Multiple CORS proxies for fallback
// PRIORITIZE: Custom Cloudflare Worker if set
const CUSTOM_PROXY = localStorage.getItem('vectastream_custom_proxy'); // e.g., 'https://my-worker.user.workers.dev/'

const CORS_PROXIES = [
    CUSTOM_PROXY ? (url) => `${CUSTOM_PROXY}${url}` : '', // Custom Proxy (Highest Priority)
    '', // Try direct first (if CORS is already enabled on server)
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Fetch M3U playlist with automatic CORS proxy fallback
 * Tries direct fetch first, then falls back to multiple CORS proxies
 */
export const fetchWithCorsProxy = async (url) => {
    let lastError = null;

    // Filter out empty proxies (e.g. if CUSTOM_PROXY is not set)
    const activeProxies = CORS_PROXIES.filter(p => p !== '');

    for (let i = 0; i < activeProxies.length; i++) {
        const proxyGenerator = activeProxies[i];
        // If proxyGenerator is a string (empty), it means direct fetch. 
        // If it's a function, call it with the URL.
        const fetchUrl = typeof proxyGenerator === 'function' ? proxyGenerator(url) : url;
        const isProxy = typeof proxyGenerator === 'function';

        try {
            console.log(`[CORS Proxy] Attempt ${i + 1}/${activeProxies.length}: ${isProxy ? 'Using proxy' : 'Direct fetch'}`);

            const controller = new AbortController();
            // Longer timeout for large playlists (30 seconds)
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(fetchUrl, {
                signal: controller.signal,
                headers: isProxy ? {} : {
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, audio/x-mpegurl, */*',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();

            if (!text || text.length === 0) {
                throw new Error('Empty response received');
            }

            // Validate M3U format
            if (!text.includes('#EXTM3U') && !text.includes('#EXTINF')) {
                throw new Error('Invalid M3U format - missing required headers');
            }

            console.log(`✅ [CORS Proxy] Success! Loaded ${text.length} characters`);
            return text;

        } catch (error) {
            lastError = error;
            const errorMsg = error.name === 'AbortError' ? 'Request timeout (30s)' : error.message;
            console.warn(`❌ [CORS Proxy] Failed (${isProxy ? 'proxy' : 'direct'}): ${errorMsg}`);

            // Continue to next proxy
            if (i < activeProxies.length - 1) {
                continue;
            }
        }
    }

    // All attempts failed
    throw new Error(`Failed to load playlist after ${activeProxies.length} attempts.\n\nLast error: ${lastError?.message || 'Unknown error'}\n\nTry:\n1. Check your internet connection\n2. Verify the URL is correct\n3. Try a different playlist`);
};

