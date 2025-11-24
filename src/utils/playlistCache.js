/**
 * Playlist Cache Manager using IndexedDB
 * Provides fast caching for M3U playlists with automatic TTL expiration
 */

const DB_NAME = 'VectaStreamCache';
const DB_VERSION = 1;
const STORE_NAME = 'playlists';
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Initialize IndexedDB
 */
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'url' });
            }
        };
    });
};

/**
 * Get cached playlist
 * @param {string} url - Playlist URL
 * @returns {Promise<object|null>} Cached data or null if expired/not found
 */
export const getCachedPlaylist = async (url) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.get(url);

            request.onsuccess = () => {
                const data = request.result;

                if (!data) {
                    console.log('[Cache] ❌ Miss - not found');
                    resolve(null);
                    return;
                }

                const age = Date.now() - data.timestamp;
                if (age > CACHE_TTL) {
                    console.log(`[Cache] ⏰ Expired (${Math.round(age / 60000)}m old)`);
                    // Delete expired cache
                    deleteCache(url);
                    resolve(null);
                    return;
                }

                console.log(`[Cache] ✅ Hit - ${data.channels.length} channels (${Math.round(age / 60000)}m old)`);
                resolve(data);
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Cache] Error reading:', error);
        return null;
    }
};

/**
 * Cache playlist data
 * @param {string} url - Playlist URL
 * @param {Array} channels - Parsed channel list
 * @returns {Promise<void>}
 */
export const cachePlaylist = async (url, channels) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const data = {
            url,
            channels,
            timestamp: Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(data);

            request.onsuccess = () => {
                console.log(`[Cache] 💾 Saved ${channels.length} channels`);
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Cache] Error writing:', error);
    }
};

/**
 * Delete cached playlist
 * @param {string} url - Playlist URL
 * @returns {Promise<void>}
 */
export const deleteCache = async (url) => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.delete(url);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Cache] Error deleting:', error);
    }
};

/**
 * Clear all cached playlists
 * @returns {Promise<void>}
 */
export const clearAllCache = async () => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.clear();

            request.onsuccess = () => {
                console.log('[Cache] 🗑️ All cache cleared');
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Cache] Error clearing:', error);
    }
};

/**
 * Get cache statistics
 * @returns {Promise<object>} Cache stats
 */
export const getCacheStats = async () => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                const stats = {
                    totalItems: items.length,
                    totalChannels: items.reduce((sum, item) => sum + item.channels.length, 0),
                    oldestCache: items.length > 0 ? Math.min(...items.map(i => i.timestamp)) : null,
                    newestCache: items.length > 0 ? Math.max(...items.map(i => i.timestamp)) : null
                };
                resolve(stats);
            };

            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[Cache] Error getting stats:', error);
        return { totalItems: 0, totalChannels: 0 };
    }
};
