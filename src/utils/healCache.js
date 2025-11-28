/**
 * 🧠 HEALING RESULT CACHE
 * Session-based cache for healing results to enable instant re-playback
 * Uses sessionStorage (cleared on browser close, ~10MB limit)
 */

const CACHE_KEY_PREFIX = 'vectastream_heal_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached healing result for a channel URL
 */
export function getCachedHeal(channelUrl) {
    try {
        // 🔧 FIX: Remove substring limit to prevent collisions
        const key = CACHE_KEY_PREFIX + btoa(channelUrl);
        const cached = sessionStorage.getItem(key);

        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        // Check if expired
        if (age > CACHE_TTL_MS) {
            sessionStorage.removeItem(key);
            return null;
        }

        console.log(`[HealCache] ✅ Cache HIT for ${channelUrl} (age: ${Math.round(age / 1000)}s)`);
        return data.result;
    } catch (e) {
        console.warn('[HealCache] Read error:', e);
        return null;
    }
}

/**
 * Save healing result to cache
 */
export function setCachedHeal(channelUrl, result) {
    try {
        // 🔧 FIX: Remove substring limit to prevent collisions
        const key = CACHE_KEY_PREFIX + btoa(channelUrl);
        const data = {
            result: result,
            timestamp: Date.now()
        };

        sessionStorage.setItem(key, JSON.stringify(data));
        console.log(`[HealCache] 💾 Cached result for ${channelUrl}`);
    } catch (e) {
        // Quota exceeded or other error - fail silently
        console.warn('[HealCache] Write error (quota exceeded?):', e);
    }
}

/**
 * Clear all cached healing results
 */
export function clearHealCache() {
    try {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                sessionStorage.removeItem(key);
            }
        });
        console.log('[HealCache] 🧹 Cleared all cached results');
    } catch (e) {
        console.warn('[HealCache] Clear error:', e);
    }
}

export default {
    getCachedHeal,
    setCachedHeal,
    clearHealCache
};
