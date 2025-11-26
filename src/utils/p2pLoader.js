/**
 * P2P Stream Loader for HLS.js
 * Uses WebRTC to fetch segments from other peers before hitting the server
 */

import Peer from 'peerjs';

class P2PLoader {
    constructor(config) {
        this.peer = null;
        this.connections = [];
        this.segmentCache = new Map(); // url -> ArrayBuffer
        this.initPeer();
    }

    initPeer() {
        // Generate random ID
        const id = 'vecta-' + Math.random().toString(36).substr(2, 9);

        // Connect to free PeerJS server
        this.peer = new Peer(id, {
            debug: 1
        });

        this.peer.on('open', (id) => {
            console.log('[P2P] 🕸️ Joined mesh network as:', id);
            this.findPeers();
        });

        this.peer.on('connection', (conn) => {
            this.handleConnection(conn);
        });
    }

    findPeers() {
        // In a real app, we would fetch active peers from a signaling server/tracker
        // For now, we simulate by listening for broadcasts or using a known room
        console.log('[P2P] Searching for peers...');
    }

    handleConnection(conn) {
        this.connections.push(conn);

        conn.on('data', (data) => {
            // Handle incoming data (segment requests or responses)
            if (data.type === 'request_segment') {
                this.serveSegment(conn, data.url);
            } else if (data.type === 'segment_data') {
                this.receiveSegment(data.url, data.buffer);
            }
        });
    }

    serveSegment(conn, url) {
        if (this.segmentCache.has(url)) {
            console.log('[P2P] Serving segment to peer:', url);
            conn.send({
                type: 'segment_data',
                url: url,
                buffer: this.segmentCache.get(url)
            });
        }
    }

    receiveSegment(url, buffer) {
        // Resolve pending request
        // (Implementation detail: need to map this back to the load() call)
    }

    /**
     * HLS.js Loader Interface
     */
    load(context, config, callbacks) {
        const { url } = context;

        // 1. Check P2P Cache / Ask Peers
        // (Async logic here)

        // 2. Fallback to HTTP (Standard Load)
        this.loadHttp(context, config, callbacks);
    }

    loadHttp(context, config, callbacks) {
        fetch(context.url)
            .then(response => response.arrayBuffer())
            .then(data => {
                // Cache for peers
                this.segmentCache.set(context.url, data);

                // Limit cache size
                if (this.segmentCache.size > 20) {
                    const firstKey = this.segmentCache.keys().next().value;
                    this.segmentCache.delete(firstKey);
                }

                callbacks.onSuccess({
                    url: context.url,
                    data: data
                });
            })
            .catch(error => {
                callbacks.onError(error);
            });
    }
}

export default P2PLoader;
