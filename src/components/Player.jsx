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
            video.play().catch(() => { });
        };

        if (Hls.isSupported()) {
            if (hlsRef.current) {
                hlsRef.current.destroy();

                hlsRef.current = hls;

                // SMART CONDITIONAL PROXY
                const PROXY_URL = localStorage.getItem('vectastream_custom_proxy') || 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev/';
                const isHttpStream = channel.url.startsWith('http://');

                let streamUrl = channel.url;
                let attemptedDirect = false;

                if (isHttpStream) {
                    streamUrl = `${PROXY_URL}${channel.url}`;
                    console.log(`[Player] 🔀 Proxying HTTP stream: ${channel.name}`);
                } else {
                    console.log(`[Player] ✅ Direct HTTPS attempt: ${channel.name}`);
                    attemptedDirect = true;
                }

                const startTime = performance.now();
                hls.loadSource(streamUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    const loadTime = (performance.now() - startTime).toFixed(0);
                    console.log(`[Player] ⚡ Loaded in ${loadTime}ms (${attemptedDirect ? 'direct' : 'proxied'})`);
                    setLoading(false);
                    playVideo();

                    import('../utils/m3u.js').then(({ setCachedStatus }) => {
                        setCachedStatus(channel.url, 'online');
                    });
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                if (attemptedDirect && !streamUrl.includes(PROXY_URL)) {
                                    console.log('[Player] ⚠️ Direct failed, retrying via proxy...');
                                    attemptedDirect = false;
                                    streamUrl = `${PROXY_URL}${channel.url}`;
                                    hls.loadSource(streamUrl);
                                    hls.startLoad();
                                } else {
                                    hls.startLoad();
                                }
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                setLoading(false);
                                setError("This stream is unavailable.");
                                import('../utils/m3u.js').then(({ setCachedStatus }) => {
                                    setCachedStatus(channel.url, 'offline');
                                });
                                hls.destroy();
                                break;
                        }
                    }
                });

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                const PROXY_URL = localStorage.getItem('vectastream_custom_proxy') || 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev/';
                const isHttpStream = channel.url.startsWith('http://');
                const streamUrl = isHttpStream ? `${PROXY_URL}${channel.url}` : channel.url;

                video.src = streamUrl;
                console.log(`[Player] 🍎 Safari ${isHttpStream ? 'proxied' : 'direct'}`);

                video.addEventListener('loadedmetadata', () => {
                    setLoading(false);
                    playVideo();
                });
                video.addEventListener('error', () => {
                    setLoading(false);
                    setError("Stream unavailable.");
                });
            } else {
                setLoading(false);
                setError("Browser does not support HLS.");
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

            <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">{channel.name}</h2>
                <p className="text-accent text-sm font-medium">{channel.group}</p>
            </div>
        </div>
    );
};

export default Player;
