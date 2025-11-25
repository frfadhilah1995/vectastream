/**
 * Background Status Refresh Service
 * Re-checks offline streams periodically via Worker proxy
 */

import { getCachedStatus, setCachedStatus } from './m3u.js';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const WORKER_PROXY_URL = localStorage.getItem('vectastream_custom_proxy') || 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev/';

class StatusRefreshService {
    constructor() {
        this.refreshTimer = null;
        this.isRunning = false;
        this.onStatusUpdate = null;
    }

    /**
     * Start background refresh for offline channels
     * @param {Array} channels - All channels to monitor
     * @param {Function} callback - Called when status changes
     */
    start(channels, callback) {
        if (this.isRunning) return;

        this.isRunning = true;
        this.onStatusUpdate = callback;

        console.log('[Background Refresh] Started - checking every 30 minutes');

        // Initial check after 5 seconds
        setTimeout(() => this.checkOfflineStreams(channels), 5000);

        // Periodic check
        this.refreshTimer = setInterval(() => {
            this.checkOfflineStreams(channels);
        }, REFRESH_INTERVAL_MS);
    }

    stop() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.isRunning = false;
        console.log('[Background Refresh] Stopped');
    }

    async checkOfflineStreams(channels) {
        // Get favorites for priority
        const favorites = JSON.parse(localStorage.getItem('vectastream_favorites') || '[]');

        // Filter offline streams, prioritize favorites
        const offlineStreams = channels
            .filter(ch => getCachedStatus(ch.url) === 'offline')
            .sort((a, b) => {
                const aFav = favorites.some(f => f.url === a.url);
                const bFav = favorites.some(f => f.url === b.url);
                return (bFav ? 1 : 0) - (aFav ? 1 : 0); // Favorites first
            })
            .slice(0, 10); // Only check top 10 to avoid rate limits

        if (offlineStreams.length === 0) {
            console.log('[Background Refresh] No offline streams to check');
            return;
        }

        console.log(`[Background Refresh] Checking ${offlineStreams.length} offline streams...`);

        for (const channel of offlineStreams) {
            try {
                await this.checkSingleStream(channel);
                // Rate limiting: wait 2 seconds between checks
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.warn(`[Background Refresh] Error checking ${channel.name}:`, error);
            }
        }
    }

    async checkSingleStream(channel) {
        try {
            // Use Worker proxy to check stream HEAD
            const proxyUrl = `${WORKER_PROXY_URL}${channel.url}`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(proxyUrl, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (response.ok) {
                // Stream is back online!
                setCachedStatus(channel.url, 'online');
                console.log(`[Background Refresh] ✅ ${channel.name} is back online!`);

                // Notify callback
                if (this.onStatusUpdate) {
                    this.onStatusUpdate(channel.url, 'online');
                }
            }
        } catch (error) {
            // Still offline, keep status
            console.log(`[Background Refresh] ❌ ${channel.name} still offline`);
        }
    }

    /**
     * Manual refresh for a single channel
     */
    async refreshChannel(channel, callback) {
        console.log(`[Manual Refresh] Checking ${channel.name}...`);

        try {
            await this.checkSingleStream(channel);

            // Re-read status after check
            const newStatus = getCachedStatus(channel.url) || 'unknown';

            if (callback) {
                callback(channel.url, newStatus);
            }

            return newStatus;
        } catch (error) {
            console.error(`[Manual Refresh] Failed for ${channel.name}:`, error);
            return getCachedStatus(channel.url) || 'unknown';
        }
    }
}

// Singleton instance
export const statusRefreshService = new StatusRefreshService();
