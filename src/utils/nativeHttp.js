/**
 * Native HTTP Wrapper
 * Automatically uses native HTTP on mobile (no CORS!) and fetch on web
 */

import { CapacitorHttp } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

/**
 * Check if running on native platform
 */
export function isNativePlatform() {
    return Capacitor.isNativePlatform();
}

/**
 * Smart HTTP request - uses native on mobile, fetch on web
 */
export async function smartFetch(url, options = {}) {
    const isNative = isNativePlatform();

    if (isNative) {
        // Native platform: Use Capacitor HTTP (NO CORS!)
        console.log('[NativeHTTP] 🚀 Using native HTTP (CORS-free):', url);

        try {
            const response = await CapacitorHttp.request({
                url: url,
                method: options.method || 'GET',
                headers: options.headers || {},
                connectTimeout: options.timeout || 10000,
                readTimeout: options.timeout || 10000
            });

            // Convert to fetch-like response
            return {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                statusText: response.status === 200 ? 'OK' : 'Error',
                headers: new Map(Object.entries(response.headers || {})),
                data: response.data,

                // fetch-compatible methods
                json: async () => {
                    if (typeof response.data === 'string') {
                        return JSON.parse(response.data);
                    }
                    return response.data;
                },
                text: async () => {
                    return typeof response.data === 'string'
                        ? response.data
                        : JSON.stringify(response.data);
                }
            };

        } catch (error) {
            console.error('[NativeHTTP] ❌ Native request failed:', error);
            throw error;
        }

    } else {
        // Web platform: Use standard fetch (CORS applies)
        console.log('[WebHTTP] 🌐 Using browser fetch (CORS applies):', url);

        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: options.headers || {},
                signal: options.signal
            });

            return response;

        } catch (error) {
            console.error('[WebHTTP] ❌ Fetch failed:', error);
            throw error;
        }
    }
}

/**
 * Smart HEAD request (for stream testing)
 */
export async function smartHead(url, options = {}) {
    return smartFetch(url, { ...options, method: 'HEAD' });
}

/**
 * Smart GET request
 */
export async function smartGet(url, options = {}) {
    return smartFetch(url, { ...options, method: 'GET' });
}

/**
 * Get platform info
 */
export function getPlatformInfo() {
    const isNative = isNativePlatform();
    const platform = Capacitor.getPlatform();

    return {
        isNative,
        platform, // 'web', 'android', 'ios'
        corsEnabled: !isNative,
        canBypassCors: isNative
    };
}

export default {
    smartFetch,
    smartHead,
    smartGet,
    isNativePlatform,
    getPlatformInfo
};
