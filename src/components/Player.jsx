import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Tv, AlertTriangle, Loader2, Activity, CheckCircle, XCircle } from 'lucide-react';
import { healStream } from '../utils/smartHealer';
import FetchLoader from '../utils/fetchLoader';

const Player = ({ channel }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [healingProgress, setHealingProgress] = useState(null);
    const [healingResult, setHealingResult] = useState(null);
    const hlsRef = useRef(null);

    // 🔧 FIX: Track player active state to prevent background interference
    const isPlayerActiveRef = useRef(true);
    const healingAbortControllerRef = useRef(null);

    useEffect(() => {
        if (!channel || !channel.url) return;

        const video = videoRef.current;
        if (!video) return;

        // Mark player as active for this channel
        isPlayerActiveRef.current = true;

        setLoading(true);
        setError(null);
        setHealingProgress(null);
        setHealingResult(null);

        const playVideo = () => {
            video.play().catch(() => { });
        };

        // SMART HEALER - Auto-heal stream on channel selection
        const initializeStream = async () => {
            console.log(`[Player] 🔄 Starting Smart Healer for: ${channel.name}`);

            // Create abort controller for this healing operation
            healingAbortControllerRef.current = new AbortController();

            // Trigger healing process
            const result = await healStream(channel, {
                timeout: 5000,
                onProgress: (progress) => {
                    // Only update UI if player is still active
                    if (isPlayerActiveRef.current) {
                        setHealingProgress(progress);
                        console.log(`[Player] Healing ${progress.current || '?'}/${progress.total || '?'}: ${progress.strategy || 'unknown'}`);
                    }
                }
            });

            // Check if player is still active before showing results
            if (!isPlayerActiveRef.current) {
                console.log('[Player] 🛑 Player closed during healing, aborting display');
                return;
            }

            setHealingResult(result);

            if (!result.success) {
                // All strategies failed
                setLoading(false);
                setError(result.recommendation);
                console.error('[Player] ❌ All healing strategies failed:', result.verdict);
                return;
            }

            // Success! Use the working URL
            const workingUrl = result.workingUrl;
            console.log(`[Player] ✅ Stream healed successfully with ${result.workingStrategy}`);

            if (Hls.isSupported()) {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }

                const hls = new Hls({
                    // CRITICAL: Use Fetch-based loader (enables Service Worker interception)
                    loader: FetchLoader,

                    // CRITICAL: Disable Worker so Service Worker can intercept
                    enableWorker: false,

                    // LL-HLS INSTANT PLAYBACK
                    lowLatencyMode: true,
                    liveSyncDurationCount: 2,

                    // ULTRA-LOW BUFFER
                    maxBufferLength: 3,
                    maxMaxBufferLength: 10,
                    backBufferLength: 30,
                    maxBufferSize: 15 * 1000 * 1000,
                    maxBufferHole: 0.3,

                    // FAST FAILURE DETECTION
                    fragLoadingTimeOut: 8000,
                    fragLoadingMaxRetry: 2,
                    fragLoadingRetryDelay: 300,
                    fragLoadingMaxRetryTimeout: 16000,
                    manifestLoadingTimeOut: 5000,
                    manifestLoadingMaxRetry: 1,
                    manifestLoadingRetryDelay: 300,
                    manifestLoadingMaxRetryTimeout: 8000,
                    levelLoadingTimeOut: 5000,
                    levelLoadingMaxRetry: 2,
                    levelLoadingRetryDelay: 300,
                    levelLoadingMaxRetryTimeout: 10000,

                    startLevel: -1,
                    abrEwmaDefaultEstimate: 500000,
                    abrBandWidthFactor: 0.95,
                    abrBandWidthUpFactor: 0.7,
                    debug: false,
                });

                hlsRef.current = hls;

                const startTime = performance.now();
                hls.loadSource(workingUrl);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    const loadTime = (performance.now() - startTime).toFixed(0);
                    console.log(`[Player] ⚡ Loaded in ${loadTime}ms via ${result.workingStrategy}`);
                    setLoading(false);
                    setHealingProgress(null);
                    playVideo();
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    // Only handle errors if player is still active
                    if (!isPlayerActiveRef.current) {
                        console.log('[Player] 🛑 Error occurred but player is inactive, ignoring');
                        return;
                    }

                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error('[Player] Network error, attempting recovery...');
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error('[Player] Media error, attempting recovery...');
                                hls.recoverMediaError();
                                break;
                            default:
                                setLoading(false);
                                setError(`Stream error: ${data.details || 'Unknown error'}`);
                                hls.destroy();
                                break;
                        }
                    }
                });

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS support
                video.src = workingUrl;
                console.log(`[Player] 🍎 Safari playback via ${result.workingStrategy}`);

                video.addEventListener('loadedmetadata', () => {
                    setLoading(false);
                    setHealingProgress(null);
                    playVideo();
                });

                video.addEventListener('error', () => {
                    if (isPlayerActiveRef.current) {
                        setLoading(false);
                        setError("Stream playback failed.");
                    }
                });
            } else {
                setLoading(false);
                setError("Browser does not support HLS playback.");
            }
        };

        initializeStream();

        // 🔧 FIX: Enhanced cleanup - abort ongoing operations when channel changes
        return () => {
            console.log('[Player] 🧹 Cleaning up player for channel:', channel.name);
            isPlayerActiveRef.current = false;

            // Abort ongoing healing operation
            if (healingAbortControllerRef.current) {
                healingAbortControllerRef.current.abort();
                healingAbortControllerRef.current = null;
            }

            // Destroy HLS instance
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
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
            {/* Healing Progress Overlay */}
            {healingProgress && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-white bg-glass p-8 rounded-2xl border border-accent/30 max-w-md">
                        <Activity size={48} className="text-accent mb-4 animate-pulse" />
                        <h3 className="text-xl font-bold mb-2">Auto-Healing Stream</h3>
                        <p className="text-sm text-gray-400 mb-4 text-center">{healingProgress.description}</p>
                        <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden mb-2">
                            <div
                                className="bg-accent h-full transition-all duration-300"
                                style={{ width: `${(healingProgress.current / healingProgress.total) * 100}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 font-mono">
                            Strategy {healingProgress.current} / {healingProgress.total}: {healingProgress.strategy}
                        </p>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && !healingProgress && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-accent">
                        <Loader2 size={48} className="animate-spin mb-4" />
                        <p className="font-medium">Loading Stream...</p>
                    </div>
                </div>
            )}

            {/* Error Overlay with Forensic Report */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80 p-6">
                    <div className="flex flex-col items-center text-red-500 p-6 text-center max-w-lg bg-glass rounded-2xl border border-red-500/30">
                        <XCircle size={64} className="mb-4" />
                        <h3 className="text-2xl font-bold mb-2">Stream Unavailable</h3>
                        <p className="text-sm text-gray-300 mb-4">{error}</p>

                        {healingResult && (
                            <div className="w-full bg-black/50 p-4 rounded-lg border border-white/10 text-left mb-4">
                                <p className="text-xs text-gray-400 mb-2">Diagnostic Report:</p>
                                <ul className="text-xs space-y-1">
                                    {healingResult.attempts.map((attempt, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            {attempt.success ? (
                                                <CheckCircle size={12} className="text-green-400" />
                                            ) : (
                                                <XCircle size={12} className="text-red-400" />
                                            )}
                                            <span className="text-gray-300">
                                                {attempt.strategy}: {attempt.statusCode || attempt.error || 'Failed'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="text-xs text-gray-500">
                            📊 Error logged to <span className="text-accent">Analytics Dashboard</span>
                        </p>
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
                {healingResult?.workingStrategy && (
                    <p className="text-xs text-green-400 mt-1">
                        ✓ Auto-healed via {healingResult.workingStrategy}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Player;
