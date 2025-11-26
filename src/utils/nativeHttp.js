/**
 * Native HTTP Wrapper
 * Simplified version for web-only (Capacitor imports removed to fix build)
 */

/**
 * Detect platform (always web for now)
 */
export function isNativePlatform() {
    return false; // TODO: Check Capacitor.isNativePlatform() when needed
}

/**
 * Smart Fetch - Platform-aware HTTP
 * Web + HTTP URL on HTTPS Page: FORCE PROXY (Mixed Content fix)
 * Web + HTTPS URL: Try direct
 */
export async function smartFetch(url, options = {}) {
    // WEB: Check for Mixed Content
    const pageProtocol = window.location.protocol; // 'https:' or 'http:'
    const urlProtocol = new URL(url).protocol; // 'https:' or 'http:'

    if (pageProtocol === 'https:' && urlProtocol === 'http:') {
        // CRITICAL: Mixed Content detected!
        // Don't even try direct fetch - it WILL be blocked
        console.error(`[WebHTTP] 🚫 Mixed Content blocked (HTTPS page, HTTP resource): ${url}`);
        console.log(`[WebHTTP] 💡 This request should be handled by proxy or Service Worker`);

        // Throw specific error so caller knows to use proxy
        const error = new Error('Mixed Content: HTTP resource on HTTPS page');
        error.code = 'MIXED_CONTENT';
        throw error;
    }

    // WEB: Safe to try direct fetch (both HTTPS or both HTTP)
    console.log(`[WebHTTP] 🌐 Using browser fetch (CORS applies): ${url}`);

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'omit', // Don't send cookies cross-origin
        });
        return response;
    } catch (error) {
        console.error(`[WebHTTP] ❌ Fetch failed:`, error);
        throw error;
    }
}

/**
 * Smart HEAD - Platform-aware HEAD request
 */
export async function smartHead(url, options = {}) {
    // WEB: Check Mixed Content
    const pageProtocol = window.location.protocol;
    const urlProtocol = new URL(url).protocol;

    if (pageProtocol === 'https:' && urlProtocol === 'http:') {
        const error = new Error('Mixed Content: HTTP resource on HTTPS page');
        error.code = 'MIXED_CONTENT';
        throw error;
    }

    // WEB: Direct HEAD
    return fetch(url, {
        ...options,
        method: 'HEAD',
        credentials: 'omit',
    });
}
