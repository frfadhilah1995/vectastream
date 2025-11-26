/**
 * Alternative Sources Database
 * Manages fallback URLs for channels with known issues
 */

/**
 * Database of alternative sources for popular channels
 * Format: { channelName: { original, alternatives: [...] } }
 */
export const ALTERNATIVE_SOURCES = {
    // Dead channels with known alternatives
    'AKTV (720p) [Not 24/7]': {
        original: 'https://e.siar.us/live/aktv.m3u8',
        status: 'dead',
        alternatives: []
        // User can submit alternatives via submitAlternative()
    },

    'Al-Iman TV (720p)': {
        original: 'https://tv.aliman.id/aliman/live.m3u8',
        status: 'dead',
        alternatives: []
    },

    'Arek TV (720p)': {
        original: 'https://ams.juraganstreaming.com:5443/LiveApp/streams/arektv.m3u8',
        status: 'dead',
        alternatives: []
    },

    // Example with working alternative
    'Trans7 (Example)': {
        original: 'https://video.detik.com/trans7/smil:trans7.smil/playlist.m3u8',
        status: 'working',
        alternatives: [
            {
                url: 'https://cdn-telkomsel-01.akamaized.net/Content/HLS/Live/channel(9f94d33f-d2e7-42a7-9aa1-a92ca4c4a03f)/index.m3u8',
                quality: '1080p',
                verified: '2025-11-26',
                success_rate: 0.95,
                upvotes: 10
            }
        ]
    }
};

/**
 * Get all URLs to try for a channel (original + alternatives)
 */
export function getAlternatives(channelName, originalUrl) {
    // Check database
    const entry = ALTERNATIVE_SOURCES[channelName];
    if (entry && entry.alternatives.length > 0) {
        // Return original + verified alternatives
        const verifiedAlts = entry.alternatives
            .filter(alt => alt.success_rate > 0.5)
            .sort((a, b) => b.success_rate - a.success_rate)
            .map(alt => alt.url);

        return [entry.original, ...verifiedAlts];
    }

    // Check localStorage for user-submitted alternatives
    const localKey = `alt_source_${channelName}`;
    const localAlts = JSON.parse(localStorage.getItem(localKey) || '[]');

    if (localAlts.length > 0) {
        const urls = localAlts
            .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
            .map(alt => alt.url);

        return [originalUrl, ...urls];
    }

    // No alternatives found, return only original
    return [originalUrl];
}

/**
 * Submit new alternative source (crowd-sourced)
 */
export function submitAlternative(channelName, alternativeUrl, metadata = {}) {
    const key = `alt_source_${channelName}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    // Check if already exists
    const duplicate = existing.find(alt => alt.url === alternativeUrl);
    if (duplicate) {
        console.warn('[AltSource] Alternative already exists');
        return false;
    }

    existing.push({
        url: alternativeUrl,
        submitted: new Date().toISOString(),
        upvotes: 0,
        quality: metadata.quality || 'unknown',
        submitter: metadata.submitter || 'anonymous'
    });

    localStorage.setItem(key, JSON.stringify(existing));

    console.log('[AltSource] New alternative submitted:', channelName, alternativeUrl);
    return true;
}

/**
 * Upvote an alternative source
 */
export function upvoteAlternative(channelName, alternativeUrl) {
    const key = `alt_source_${channelName}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    const alternative = existing.find(alt => alt.url === alternativeUrl);
    if (!alternative) {
        console.warn('[AltSource] Alternative not found');
        return false;
    }

    alternative.upvotes = (alternative.upvotes || 0) + 1;
    localStorage.setItem(key, JSON.stringify(existing));

    console.log('[AltSource] Upvoted:', channelName, alternativeUrl);
    return true;
}

/**
 * Report alternative as broken
 */
export function reportBroken(channelName, alternativeUrl) {
    const key = `alt_source_${channelName}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    const alternative = existing.find(alt => alt.url === alternativeUrl);
    if (!alternative) return false;

    alternative.downvotes = (alternative.downvotes || 0) + 1;

    // Remove if too many downvotes
    if (alternative.downvotes > 3) {
        const filtered = existing.filter(alt => alt.url !== alternativeUrl);
        localStorage.setItem(key, JSON.stringify(filtered));
        console.log('[AltSource] Removed broken alternative:', alternativeUrl);
    } else {
        localStorage.setItem(key, JSON.stringify(existing));
    }

    return true;
}

/**
 * Get all alternatives for a channel (for UI display)
 */
export function getAllAlternatives(channelName) {
    const official = ALTERNATIVE_SOURCES[channelName];
    const localKey = `alt_source_${channelName}`;
    const userSubmitted = JSON.parse(localStorage.getItem(localKey) || '[]');

    return {
        original: official?.original,
        official: official?.alternatives || [],
        userSubmitted: userSubmitted
    };
}

/**
 * Export all user-submitted alternatives (for backup/sharing)
 */
export function exportAlternatives() {
    const allAlts = {};

    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('alt_source_')) {
            const channelName = key.replace('alt_source_', '');
            allAlts[channelName] = JSON.parse(localStorage.getItem(key) || '[]');
        }
    });

    return allAlts;
}

/**
 * Import alternatives (from backup or community database)
 */
export function importAlternatives(alternativesData) {
    Object.entries(alternativesData).forEach(([channelName, alternatives]) => {
        const key = `alt_source_${channelName}`;
        localStorage.setItem(key, JSON.stringify(alternatives));
    });

    console.log('[AltSource] Imported alternatives for', Object.keys(alternativesData).length, 'channels');
}
