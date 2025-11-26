/**
 * P2P Stream Loader for HLS.js
 * Uses WebRTC to fetch segments from other peers before hitting the server
 * Implements HLS.js Loader Interface
 */

import Peer from 'peerjs';

class P2PLoader {
    constructor(config) {
        this.config = config;
        this.peer = null;
        this.connections = [];
        this.segmentCache = new Map(); // url -> ArrayBuffer
        this.stats = {
            p2pBytes: 0,
            httpBytes: 0
        };

        // Initialize PeerJS (Singleton-ish pattern could be better, but per-loader is safer for now)
        this.initPeer();
    }

    initPeer() {
        // Generate random ID
        const id = 'vecta-' + Math.random().toString(36).substr(2, 9);

        try {
            // Connect to free PeerJS server
            this.peer = new Peer(id, {
                debug: 0 // Quiet mode
            });

            this.peer.on('open', (id) => {
                console.log('[P2P] 🕸️ Joined mesh network as:', id);
                // In a real app, we would join a "room" based on the channel ID
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on('error', (err) => {
                // console.warn('[P2P] Peer error:', err);
            });
        } catch (e) {
            console.warn('[P2P] Failed to init peer:', e);
        }
    }

    handleConnection(conn) {
        this.connections.push(conn);

        conn.on('data', (data) => {
            if (data.type === 'request_segment') {
                this.serveSegment(conn, data.url);
            }
        });
    }

    serveSegment(conn, url) {
        if (this.segmentCache.has(url)) {
            // console.log('[P2P] Serving segment to peer:', url);
            conn.send({
                type: 'segment_data',
                url: url,
                buffer: this.segmentCache.get(url)
            });
        }
    }

    /**
     * HLS.js Loader Interface: load()
     */
    load(context, config, callbacks) {
        this.context = context;
        this.config = config;
        this.callbacks = callbacks;
        this.stats = context.stats;

        // 1. Try P2P (Simulated for now - in real implementation we'd ask peers)
        // For this "Disruptive" MVP, we'll focus on the caching part to enable seeding

        // 2. Fallback to HTTP (Standard Load)
        this.loadHttp(context, config, callbacks);
    }

    loadHttp(context, config, callbacks) {
        const startTime = Date.now();

        // Use the Ghost Worker (Service Worker) implicitly by just fetching
        fetch(context.url)
            .then(async response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(data => {
                const duration = Date.now() - startTime;

                // Cache for peers (Seeding logic)
                this.segmentCache.set(context.url, data);

                // Limit cache size (keep last 20 segments)
                if (this.segmentCache.size > 20) {
                    const firstKey = this.segmentCache.keys().next().value;
                    this.segmentCache.delete(firstKey);
                }

                this.stats.loading = {
                    start: startTime,
                    first: duration,
                    end: Date.now()
                };

                this.stats.total = data.byteLength;
                this.stats.loaded = data.byteLength;

                callbacks.onSuccess({
                    url: context.url,
                    data: data
                }, this.stats, context);
            })
            .catch(error => {
                callbacks.onError({
                    code: 404, // HLS.js error code
                    text: error.message
                }, context);
            });
    }

    /**
     * HLS.js Loader Interface: abort()
     */
    abort() {
        // Abort fetch if possible (requires AbortController in loadHttp)
    }

    /**
     * HLS.js Loader Interface: destroy()
     */
    destroy() {
        if (this.peer) {
            this.peer.destroy();
        }
        this.segmentCache.clear();
    }
}

export default P2PLoader;
