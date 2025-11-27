/**
 * 🕵️‍♂️ SHARED HEADER SPOOFING UTILITIES
 * Centralized browser fingerprinting for anti-block bypassing
 * Used by both SmartHealer and Ghost Worker (Service Worker)
 */

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

export function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function generateSpoofedHeaders(targetUrl) {
    let origin = '';
    let hostname = '';
    try {
        const urlObj = new URL(targetUrl);
        origin = urlObj.origin;
        hostname = urlObj.hostname;
    } catch (e) {
        origin = targetUrl;
    }

    const ua = getRandomUserAgent();
    const isWindows = ua.includes('Windows');
    const platform = isWindows ? '"Windows"' : (ua.includes('Mac') ? '"macOS"' : '"Linux"');

    return {
        // Standard Identity
        'User-Agent': ua,
        'Referer': origin + '/',
        'Origin': origin,

        // Modern Sec-CH-UA Headers (Critical for bypassing advanced bot detection)
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': platform,

        // Fetch Metadata (Critical for CORS compliance)
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',

        // Standard Headers
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    };
}

export default {
    getRandomUserAgent,
    generateSpoofedHeaders
};
