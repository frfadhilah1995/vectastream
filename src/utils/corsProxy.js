// Multiple CORS proxies for fallback
const CORS_PROXIES = [
    '', // Try direct first
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
];

/**
 * Fetch M3U playlist with automatic CORS proxy fallback
 * Tries direct fetch first, then falls back to multiple CORS proxies
 */
export const fetchWithCorsProxy = async (url) => {
    let lastError = null;

    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const proxy = CORS_PROXIES[i];
        const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;

        try {
            console.log(`[CORS Proxy] Attempt ${i + 1}/${CORS_PROXIES.length}: ${proxy ? 'Using proxy' : 'Direct fetch'}`);

            const controller = new AbortController();
            // Longer timeout for large playlists (30 seconds)
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(fetchUrl, {
                signal: controller.signal,
                headers: proxy ? {} : {
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
            console.warn(`❌ [CORS Proxy] Failed (${proxy ? 'proxy' : 'direct'}): ${errorMsg}`);

            // Continue to next proxy
            if (i < CORS_PROXIES.length - 1) {
                continue;
            }
        }
    }

    // All attempts failed
    throw new Error(`Failed to load playlist after ${CORS_PROXIES.length} attempts.\n\nLast error: ${lastError?.message || 'Unknown error'}\n\nTry:\n1. Check your internet connection\n2. Verify the URL is correct\n3. Try a different playlist`);
};
