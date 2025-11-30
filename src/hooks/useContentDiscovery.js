import { useMemo } from 'react';
import { getHistory } from '../utils/history';

export function useContentDiscovery(channels) {
    // 🔧 FIX: Ensure channels is always an array
    const safeChannels = useMemo(() => {
        if (!channels) return [];
        if (!Array.isArray(channels)) {
            console.warn('[ContentDiscovery] Channels is not an array:', typeof channels);
            return [];
        }
        return channels;
    }, [channels]);

    // Get Watch History (Real Data from LocalStorage)
    const history = useMemo(() => {
        const h = getHistory();
        return Array.isArray(h) ? h : [];
    }, [safeChannels]); // Re-fetch when channels change (just as a trigger)

    // 1. Continue Watching (Directly from History)
    const continueWatching = history;

    // 2. Recommendations (Based on History Categories)
    const recommendations = useMemo(() => {
        if (!safeChannels.length) return [];
        if (!history.length) return safeChannels.slice(0, 10); // Fallback: Top 10 if no history

        // Extract preferred groups/categories from history
        const preferredGroups = new Set(history.map(h => h.group).filter(Boolean));

        if (preferredGroups.size === 0) return safeChannels.slice(0, 10);

        // Filter channels matching preferred groups, excluding already watched
        const watchedUrls = new Set(history.map(h => h.url));
        return safeChannels
            .filter(c => preferredGroups.has(c.group) && !watchedUrls.has(c.url))
            .slice(0, 15); // Limit to 15 recommendations
    }, [safeChannels, history]);

    // 3. Trending Now (Simulation using Real Data)
    // Since we don't have a backend, we'll simulate "Trending" by picking 
    // high-quality channels or specific popular categories (News, Sports, Movies)
    const trending = useMemo(() => {
        if (!safeChannels.length) return [];

        // Prioritize popular categories for "Trending"
        const popularKeywords = ['News', 'Sport', 'Movie', 'TV', 'HD'];
        const trendingChannels = safeChannels.filter(c =>
            popularKeywords.some(k => c.group?.includes(k) || c.name?.includes(k))
        );

        // Shuffle and pick 10
        return trendingChannels
            .sort(() => 0.5 - Math.random())
            .slice(0, 10);
    }, [safeChannels]);

    return {
        continueWatching,
        recommendations,
        trending
    };
}
