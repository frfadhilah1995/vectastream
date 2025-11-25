import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Tv, AlertTriangle, Loader2 } from 'lucide-react';

const Player = ({ channel }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const hlsRef = useRef(null);

    useEffect(() => {
        if (!channel || !channel.url) return;

        const video = videoRef.current;
        if (!video) return;

        setLoading(true);
        setError(null);

        const playVideo = () => {
            video.play().catch(() => {
                // Autoplay blocked by browser - this is normal, user can click play manually
            });
        };

        if (Hls.isSupported()) {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }

            const hls = new Hls({
                // PERFORMANCE OPTIMIZATION: Tuned for smooth streaming
                enableWorker: true,
                lowLatencyMode: true,

                // BUFFER OPTIMIZATION: Smaller buffers = faster start, less memory
                maxBufferLength: 20,        // Reduced from 30 - start faster
                maxMaxBufferLength: 40,     // Reduced from 60
                backBufferLength: 60,       // Reduced from 90
                maxBufferSize: 30 * 1000 * 1000, // 30MB limit
                maxBufferHole: 0.3,         // More aggressive

                // FRAGMENT LOADING: Faster timeouts for dead streams
                fragLoadingTimeOut: 10000,  // 10s instead of 20s
                fragLoadingMaxRetry: 3,     // Reduced from 4
                fragLoadingRetryDelay: 500, // Faster retry
                fragLoadingMaxRetryTimeout: 32000,

                // MANIFEST LOADING: Quick detection of dead streams
                manifestLoadingTimeOut: 8000,
                manifestLoadingMaxRetry: 2,  // Reduced from 3
                manifestLoadingRetryDelay: 500,
                manifestLoadingMaxRetryTimeout: 16000,

                // LEVEL LOADING: Optimized
                levelLoadingTimeOut: 8000,
                levelLoadingMaxRetry: 3,
                levelLoadingRetryDelay: 500,
                levelLoadingMaxRetryTimeout: 16000,

                // ABR: Start with lowest quality for instant playback
                startLevel: -1,
                abrEwmaDefaultEstimate: 500000,
                abrBandWidthFactor: 0.95,
                abrBandWidthUpFactor: 0.7,

                debug: false,
            });

            hlsRef.current = hls;

            // PROXY INTEGRATION: Route stream through Cloudflare Worker if needed
            const PROXY_URL = localStorage.getItem('vectastream_custom_proxy') || 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev/';

            // Determine if we need to proxy this stream
            let streamUrl = channel.url;
            const isHttpStream = streamUrl.startsWith('http://');

            // Always proxy HTTP streams (Mixed Content security), optionally proxy HTTPS for CORS
            if (isHttpStream || true) { // TODO: Make HTTPS proxying optional based on error
                streamUrl = `${PROXY_URL}${channel.url}`;
                console.log(`[Player] 🔀 Proxying stream: ${channel.name}`);
            }

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setLoading(false);
                playVideo();

                // NATIVE STATUS CACHING: Mark stream as online
                import('../utils/m3u.js').then(({ setCachedStatus }) => {
                    setCachedStatus(channel.url, 'online');
                    console.log(`[Status Cache] Marked ${channel.name} as online`);
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Network error, attempting recovery...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Media error, attempting recovery...');
                            hls.recoverMediaError();
                            break;
                        default:
                            setLoading(false);
                            setError("This stream is currently unavailable. It may be offline, geo-blocked, or require authentication.");

                            // NATIVE STATUS CACHING: Mark stream as offline
                            import('../utils/m3u.js').then(({ setCachedStatus }) => {
                                setCachedStatus(channel.url, 'offline');
                                console.log(`[Status Cache] Marked ${channel.name} as offline`);
                            });

                            hls.destroy();
                            break;
                    }
                }
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            // Also use proxy for Safari to ensure HTTP->HTTPS conversion
            const PROXY_URL = localStorage.getItem('vectastream_custom_proxy') || 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev/';
            const isHttpStream = channel.url.startsWith('http://');
            const streamUrl = (isHttpStream || true) ? `${PROXY_URL}${channel.url}` : channel.url;

            video.src = streamUrl;
            console.log(`[Player] 🍎 Safari - Proxying stream: ${channel.name}`);

            video.addEventListener('loadedmetadata', () => {
                setLoading(false);
                playVideo();
            });
            video.addEventListener('error', () => {
                setLoading(false);
                setError("This stream is currently unavailable.");
            });
        } else {
            setLoading(false);
            setError("Your browser does not support HLS playback.");
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [channel]);

    if (!channel) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-gray-500 p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                    <Tv size={48} className="opacity-50" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Watch</h2>
                <p className="max-w-md">Select a channel from the sidebar to start streaming.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center group">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-accent">
                        <Loader2 size={48} className="animate-spin mb-4" />
                        <p className="font-medium">Loading Stream...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
                    <div className="flex flex-col items-center text-red-500 p-6 text-center max-w-md bg-white/5 rounded-xl border border-red-500/20">
                        <AlertTriangle size={48} className="mb-4" />
                        <h3 className="text-xl font-bold mb-2">Playback Error</h3>
                        <p className="text-sm text-gray-300">{error}</p>
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                controls
                className="w-full h-full max-h-[100dvh] object-contain focus:outline-none"
                poster={channel.logo || ""}
            />

            {/* Overlay Info (Visible on hover) */}
            <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">{channel.name}</h2>
                <p className="text-accent text-sm font-medium">{channel.group}</p>
            </div>
        </div>
    );
};

export default Player;
