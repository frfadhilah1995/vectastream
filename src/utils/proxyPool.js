/**
 * Advanced Proxy Pool Manager
 * Manages multiple proxies with health scoring and intelligent routing
 */

import { isNativePlatform } from './nativeHttp';

class ProxyPool {
    constructor() {
        this.proxies = [
            {
                name: 'Cloudflare',
                url: 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev',
                priority: 1,
                geo: 'global',
                healthScore: 100,
                features: ['cors', 'http-upgrade', 'headers-manipulation']
            },
            {
                name: 'CORS Anywhere',
                url: 'https://api.allorigins.win/raw?url=',
                priority: 3,
                geo: 'global',
                healthScore: 70,
                features: ['cors', 'simple'],
                rateLimit: 200 // requests per day
            }
        ];

        this.failureCount = {};
        this.lastHealthCheck = {};
        this.requestCount = {};

        // Auto health check every 5 minutes
        this.startHealthMonitor();
    }

    /**
     * Get best proxy for given URL
     */
    async getBestProxy(targetUrl, options = {}) {
        const { forceGeo = null, excludeProxies = [] } = options;

        // On Native Platform, we might not need a proxy for CORS!
        // But we still need it for Geo-blocking or HTTP upgrades.
        // The Smart Healer handles the "Direct" attempt first.
        // If we are here, it means Direct failed, so we definitely need a proxy.

        // Check if Indonesia-only server
        const isIndonesia = this.isIndonesiaServer(targetUrl);
        const requiredGeo = forceGeo || (isIndonesia ? 'indonesia' : null);

        // Filter eligible proxies
        let candidates = this.proxies.filter(proxy => {
            // Exclude specified proxies
            if (excludeProxies.includes(proxy.name)) return false;

            // Geo filter
            if (requiredGeo && proxy.geo !== requiredGeo && proxy.geo !== 'global') {
                return false;
            }

            // Health filter (exclude dead proxies)
            if (proxy.healthScore < 20) return false;

            // Rate limit check
            if (proxy.rateLimit) {
                const today = new Date().toDateString();
                const key = `${proxy.name}_${today}`;
                const count = this.requestCount[key] || 0;
                if (count >= proxy.rateLimit) return false;
            }

            return true;
        });

        if (candidates.length === 0) {
            console.warn('[ProxyPool] No eligible proxies available!');
            return null;
        }

        // Sort by combined score
        candidates.sort((a, b) => {
            const scoreA = this.calculateScore(a);
            const scoreB = this.calculateScore(b);
            return scoreB - scoreA;
        });

        const selected = candidates[0];

        // Track request count
        if (selected.rateLimit) {
            const today = new Date().toDateString();
            const key = `${selected.name}_${today}`;
            this.requestCount[key] = (this.requestCount[key] || 0) + 1;
        }

        console.log(`[ProxyPool] Selected: ${selected.name} (score: ${this.calculateScore(selected)})`);
        return selected;
    }

    /**
     * Calculate proxy score based on health and priority
     */
    calculateScore(proxy) {
        const healthWeight = 0.7;
        const priorityWeight = 0.3;

        // Normalize priority (lower number = higher priority)
        const normalizedPriority = (10 - proxy.priority) * 10;

        // Recent failure penalty
        const failurePenalty = (this.failureCount[proxy.name] || 0) * 5;

        return (
            proxy.healthScore * healthWeight +
            normalizedPriority * priorityWeight -
            failurePenalty
        );
    }

    /**
     * Get all available proxies
     */
    getAllProxies() {
        return this.proxies
            .filter(p => p.healthScore > 0)
            .sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
    }

    /**
     * Report proxy failure
     */
    reportFailure(proxyName, errorType = 'unknown') {
        this.failureCount[proxyName] = (this.failureCount[proxyName] || 0) + 1;

        const proxy = this.proxies.find(p => p.name === proxyName);
        if (!proxy) return;

        // Penalty based on error type
        const penalties = {
            'timeout': 15,
            'network': 20,
            '403': 10,
            '404': 5,
            'unknown': 10
        };

        const penalty = penalties[errorType] || 10;
        proxy.healthScore = Math.max(0, proxy.healthScore - penalty);

        console.log(`[ProxyPool] ${proxyName} failure (${errorType}), health: ${proxy.healthScore}`);
    }

    /**
     * Report proxy success
     */
    reportSuccess(proxyName, responseTime = 0) {
        // Reset failure count on success
        this.failureCount[proxyName] = 0;

        const proxy = this.proxies.find(p => p.name === proxyName);
        if (!proxy) return;

        // Recovery based on response time
        const recovery = responseTime < 1000 ? 15 : responseTime < 3000 ? 10 : 5;
        proxy.healthScore = Math.min(100, proxy.healthScore + recovery);

        console.log(`[ProxyPool] ${proxyName} success (${responseTime}ms), health: ${proxy.healthScore}`);
    }

    /**
     * Health check routine
     */
    async runHealthCheck() {
        console.log('[ProxyPool] Running health check...');

        const testUrl = 'https://www.google.com/favicon.ico';

        for (const proxy of this.proxies) {
            try {
                const proxyUrl = proxy.url.endsWith('=')
                    ? `${proxy.url}${testUrl}`  // CORS Anywhere format
                    : `${proxy.url}/${testUrl}`; // Standard format

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const start = Date.now();
                const response = await fetch(proxyUrl, {
                    method: 'HEAD',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const latency = Date.now() - start;
                this.lastHealthCheck[proxy.name] = new Date().toISOString();

                if (response.ok) {
                    // Good health: fast and successful
                    if (latency < 2000) {
                        proxy.healthScore = 100;
                    } else if (latency < 5000) {
                        proxy.healthScore = Math.max(proxy.healthScore, 70);
                    } else {
                        proxy.healthScore = Math.max(0, proxy.healthScore - 10);
                    }

                    console.log(`[ProxyPool] ${proxy.name} OK (${latency}ms)`);
                } else {
                    proxy.healthScore = Math.max(0, proxy.healthScore - 15);
                    console.warn(`[ProxyPool] ${proxy.name} returned ${response.status}`);
                }
            } catch (error) {
                proxy.healthScore = Math.max(0, proxy.healthScore - 25);
                console.error(`[ProxyPool] ${proxy.name} failed:`, error.message);
            }
        }

        console.log('[ProxyPool] Health check complete');
    }

    /**
     * Start background health monitor
     */
    startHealthMonitor() {
        // Run immediately
        this.runHealthCheck().catch(console.error);

        // Then every 5 minutes
        setInterval(() => {
            this.runHealthCheck().catch(console.error);
        }, 5 * 60 * 1000);
    }

    /**
     * Check if URL is Indonesia-only server
     */
    isIndonesiaServer(url) {
        const indonesiaMarkers = [
            '103.180.118.5',      // Tvheadend
            '122.248.43.242',     // Wowza Batam
            '202.150.153.254',    // Bandung TV
            '.id/',               // .id domain
            'indonesia',
            'jakarta',
            'bandung'
        ];

        return indonesiaMarkers.some(marker => url.toLowerCase().includes(marker.toLowerCase()));
    }

    /**
     * Get proxy statistics
     */
    getStatistics() {
        return this.proxies.map(proxy => ({
            name: proxy.name,
            healthScore: proxy.healthScore,
            failureCount: this.failureCount[proxy.name] || 0,
            lastHealthCheck: this.lastHealthCheck[proxy.name] || 'Never',
            requestsToday: this.requestCount[`${proxy.name}_${new Date().toDateString()}`] || 0,
            rateLimit: proxy.rateLimit || 'Unlimited'
        }));
    }

    /**
     * Add new proxy (for future expansion)
     */
    addProxy(proxyConfig) {
        const exists = this.proxies.find(p => p.url === proxyConfig.url);
        if (exists) {
            console.warn('[ProxyPool] Proxy already exists');
            return false;
        }

        this.proxies.push({
            healthScore: 100,
            ...proxyConfig
        });

        console.log(`[ProxyPool] Added new proxy: ${proxyConfig.name}`);
        return true;
    }

    /**
     * Remove proxy
     */
    removeProxy(proxyName) {
        const index = this.proxies.findIndex(p => p.name === proxyName);
        if (index === -1) return false;

        this.proxies.splice(index, 1);
        delete this.failureCount[proxyName];
        delete this.lastHealthCheck[proxyName];

        console.log(`[ProxyPool] Removed proxy: ${proxyName}`);
        return true;
    }
}

// Singleton instance
const proxyPool = new ProxyPool();

export default proxyPool;
