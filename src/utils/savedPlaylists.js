/**
 * Saved M3U Playlist Management
 * Stores and retrieves user's custom playlist URLs
 */

const STORAGE_KEY = 'vectastream_saved_playlists';
const MAX_SAVED = 10;

/**
 * Save a playlist URL to history
 * @param {string} url - M3U playlist URL
 * @param {number} channelCount - Number of channels (optional)
 * @returns {void}
 */
export function savePlaylistUrl(url, channelCount = null) {
    if (!url) return;

    const saved = getSavedUrls();

    // Check if URL already exists
    const existingIndex = saved.findIndex(item => item.url === url);

    const newItem = {
        url,
        name: extractPlaylistName(url),
        savedAt: Date.now(),
        channelCount: channelCount || null
    };

    if (existingIndex >= 0) {
        // Update existing entry
        saved[existingIndex] = newItem;
    } else {
        // Add new entry at the beginning
        saved.unshift(newItem);
    }

    // Keep only MAX_SAVED most recent
    const limited = saved.slice(0, MAX_SAVED);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        console.log(`[Saved Playlists] Saved: ${newItem.name}`);
    } catch (error) {
        console.error('[Saved Playlists] Failed to save:', error);
    }
}

/**
 * Get all saved playlist URLs
 * @returns {Array} Array of saved playlist objects
 */
export function getSavedUrls() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[Saved Playlists] Failed to load:', error);
        return [];
    }
}

/**
 * Delete a playlist URL from history
 * @param {string} url - URL to delete
 * @returns {void}
 */
export function deletePlaylistUrl(url) {
    const saved = getSavedUrls().filter(item => item.url !== url);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        console.log(`[Saved Playlists] Deleted: ${url}`);
    } catch (error) {
        console.error('[Saved Playlists] Failed to delete:', error);
    }
}

/**
 * Update channel count for a saved playlist
 * @param {string} url - Playlist URL
 * @param {number} count - Channel count
 * @returns {void}
 */
export function updateChannelCount(url, count) {
    const saved = getSavedUrls();
    const item = saved.find(p => p.url === url);

    if (item) {
        item.channelCount = count;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        } catch (error) {
            console.error('[Saved Playlists] Failed to update count:', error);
        }
    }
}

/**
 * Extract playlist name from URL
 * @param {string} url - M3U URL
 * @returns {string} Extracted or default name
 */
function extractPlaylistName(url) {
    // Try to extract filename
    const match = url.match(/\/([^\/]+)\.m3u/i);
    if (match) {
        // Clean up the name
        return match[1]
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .trim();
    }

    // Try to extract domain name
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'Custom Playlist';
    }
}

export default {
    savePlaylistUrl,
    getSavedUrls,
    deletePlaylistUrl,
    updateChannelCount
};
