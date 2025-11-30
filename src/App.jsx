import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import Player from './components/Player';
import EPGOverlay from './components/EPGOverlay';
import StreamDebugger from './pages/StreamDebugger';
import ErrorAnalytics from './pages/ErrorAnalytics';
import { Tv, Search, Grid3x3 } from 'lucide-react';

// V2.0 Revolutionary Shell Components
import {
    CommandPalette,
    BottomDrawer,
    FloatingHeader,
    FloatingControls,
    useGestures,
    useVoiceControl,
} from './components/shell';

import useStreamStatus from './hooks/useStreamStatus';
import useDevice from './hooks/useDevice';
import { statusRefreshService } from './utils/statusRefresh';
import { fetchWithCorsProxy } from './utils/corsProxy';
import { parseM3U } from './utils/m3u';
import { getCachedPlaylist, cachePlaylist } from './utils/playlistCache';
import { addToHistory, getHistory } from './utils/history';
import { useContentDiscovery } from './hooks/useContentDiscovery';
import ContentRow from './components/discovery/ContentRow';

// Wrapper component to access useLocation
function AppContent() {
    const location = useLocation();
    const { isMobile, isTablet } = useDevice();
    const { checkStreamStatus, getStatus } = useStreamStatus();

    // Channel & Playlist State
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [playlistUrl, setPlaylistUrl] = useState('https://iptv-org.github.io/iptv/countries/id.m3u');
    const [isLoading, setIsLoading] = useState(false);

    // V2.0 Revolutionary UI State
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [epgVisible, setEpgVisible] = useState(false);

    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [quality, setQuality] = useState('Auto');

    // Content Discovery (Phase 3)
    const { continueWatching, trending, recommendations } = useContentDiscovery(channels);

    // Gesture Handler Integration
    const gestures = useGestures({
        onSwipeUp: () => !epgVisible && setDrawerOpen(true),
        onSwipeDown: () => {
            if (drawerOpen) setDrawerOpen(false);
            else if (epgVisible) setEpgVisible(false);
        },
        onSwipeLeft: () => handleNextChannel(),
        onSwipeRight: () => handlePreviousChannel(),
        onDoubleTap: () => handlePlayPause(),
        enabled: location.pathname === '/', // Only on home page
    });

    // Voice Control Integration
    const voiceControl = useVoiceControl({
        channels,
        onChannelSelect: handleChannelSelect,
        onPlayPause: handlePlayPause,
        onNext: handleNextChannel,
        onPrevious: handlePreviousChannel,
        onVolumeChange: handleVolumeChange,
        onMuteToggle: handleMuteToggle,
        onFullscreen: handleFullscreen,
        onSearch: (query) => {
            setCommandPaletteOpen(true);
        },
        enabled: location.pathname === '/',
    });

    // Check if we're on a tool page
    const isToolPage = location.pathname === '/debug' || location.pathname === '/analytics';

    // Load last URL and Channel from localStorage
    useEffect(() => {
        const lastUrl = localStorage.getItem('vectastream_last_url');
        if (lastUrl) {
            setPlaylistUrl(lastUrl);
        }

        const lastChannel = localStorage.getItem('vectastream_last_channel');
        if (lastChannel) {
            try {
                setCurrentChannel(JSON.parse(lastChannel));
            } catch (e) {
                console.error('Failed to parse last channel:', e);
            }
        }
    }, []);

    // Save current channel to localStorage
    useEffect(() => {
        if (currentChannel) {
            localStorage.setItem('vectastream_last_channel', JSON.stringify(currentChannel));
        }
    }, [currentChannel]);

    // Playlist Loading
    const handleLoadPlaylist = useCallback(async (urlToLoad = playlistUrl) => {
        if (!urlToLoad) {
            toast.error('Please enter a playlist URL');
            return;
        }

        console.log(`[App V2] 🔄 Loading playlist from: ${urlToLoad}`);
        setIsLoading(true);
        setChannels([]);

        try {
            let loadedChannels = [];

            // Check cache first
            const cached = await getCachedPlaylist(urlToLoad);
            if (cached) {
                console.log('[App V2] ✅ Using cached playlist');
                loadedChannels = cached;
            } else {
                // Fetch and parse
                console.log('[App V2] 📡 Fetching playlist...');
                const response = await fetchWithCorsProxy(urlToLoad);
                const m3uText = await response.text();
                loadedChannels = parseM3U(m3uText);

                // Cache for future
                await cachePlaylist(urlToLoad, loadedChannels);
            }

            setChannels(loadedChannels);
            localStorage.setItem('vectastream_last_url', urlToLoad);
            toast.success(`Loaded ${loadedChannels.length} channels`);

            // Auto-select first channel if none selected
            if (!currentChannel && loadedChannels.length > 0) {
                setCurrentChannel(loadedChannels[0]);
            }
        } catch (error) {
            console.error('[App V2] ❌ Playlist load error:', error);
            toast.error(`Failed to load playlist: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [playlistUrl, currentChannel]);

    // 🔥 AUTO-LOAD: Load playlist on first mount
    useEffect(() => {
        // Only auto-load if we have a URL but no channels yet
        if (playlistUrl && channels.length === 0 && !isLoading) {
            console.log('[App V2] 🚀 Auto-loading default playlist on mount');
            handleLoadPlaylist();
        }
    }, []); // Run once on mount

    // Channel Selection
    function handleChannelSelect(channel) {
        if (!channel) return;
        setCurrentChannel(channel);
        addToHistory(channel);
        setDrawerOpen(false);
        setCommandPaletteOpen(false);
        toast.success(`Playing: ${channel.name}`);
    }

    // Channel Navigation
    function handleNextChannel() {
        if (!channels.length) return;
        const currentIndex = channels.findIndex(c => c.url === currentChannel?.url);
        const nextIndex = (currentIndex + 1) % channels.length;
        handleChannelSelect(channels[nextIndex]);
    }

    function handlePreviousChannel() {
        if (!channels.length) return;
        const currentIndex = channels.findIndex(c => c.url === currentChannel?.url);
        const prevIndex = currentIndex <= 0 ? channels.length - 1 : currentIndex - 1;
        handleChannelSelect(channels[prevIndex]);
    }

    // Player Controls
    function handlePlayPause(shouldPlay) {
        const newState = shouldPlay !== undefined ? shouldPlay : !isPlaying;
        setIsPlaying(newState);
    }

    function handleVolumeChange(newVolume, mode) {
        if (mode === 'increase') {
            setVolume(prev => Math.min(1, prev + 0.1));
        } else if (mode === 'decrease') {
            setVolume(prev => Math.max(0, prev - 0.1));
        } else {
            setVolume(newVolume);
        }
        setIsMuted(false);
    }

    function handleMuteToggle(shouldMute) {
        const newState = shouldMute !== undefined ? shouldMute : !isMuted;
        setIsMuted(newState);
    }

    function handleQualityChange(newQuality) {
        setQuality(newQuality);
        toast.info(`Quality: ${newQuality}`);
    }

    function handleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    function handlePip() {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else {
                videoElement.requestPictureInPicture();
            }
        }
    }

    // Channel Refresh
    async function handleRefreshChannel(channel) {
        if (!channel) return;
        toast.info(`Refreshing ${channel.name}...`);
        await checkStreamStatus(channel.url);
    }

    // Get recent channels from history
    const recentChannels = channels.length > 0 ? getHistory().filter(h =>
        channels.some(c => c.url === h.url)
    ).slice(0, 5) : [];

    return (
        <div className="h-full w-full overflow-hidden bg-app-bg" {...gestures}>
            <Toaster position="top-right" theme="dark" />

            {/* V2.0 Revolutionary UI - Only on Home Page */}
            {!isToolPage && (
                <>
                    {/* Floating Header (Auto-hide) */}
                    <FloatingHeader
                        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                        onOpenDrawer={() => setDrawerOpen(true)}
                        showNotifications={false}
                        notificationCount={0}
                    />

                    {/* Command Palette (⌘K) */}
                    <CommandPalette
                        open={commandPaletteOpen}
                        onOpenChange={setCommandPaletteOpen}
                        channels={channels}
                        currentChannel={currentChannel}
                        onChannelSelect={handleChannelSelect}
                        recentChannels={recentChannels}
                    />

                    {/* Bottom Drawer (Swipe Up) */}
                    <BottomDrawer
                        open={drawerOpen}
                        onOpenChange={setDrawerOpen}
                        channels={channels}
                        currentChannel={currentChannel}
                        onChannelSelect={handleChannelSelect}
                    />

                    {/* Floating Controls (Auto-hide) */}
                    {currentChannel && (
                        <FloatingControls
                            isPlaying={isPlaying}
                            onPlayPause={() => handlePlayPause()}
                            volume={volume}
                            onVolumeChange={handleVolumeChange}
                            isMuted={isMuted}
                            onMuteToggle={() => handleMuteToggle()}
                            onFullscreen={handleFullscreen}
                            onPip={handlePip}
                            onPrevious={channels.length > 0 ? handlePreviousChannel : null}
                            onNext={channels.length > 0 ? handleNextChannel : null}
                            onQualityChange={handleQualityChange}
                            currentQuality={quality}
                        />
                    )}

                    {/* EPG Overlay */}
                    <EPGOverlay
                        visible={epgVisible}
                        onClose={() => setEpgVisible(false)}
                        channels={channels}
                        currentChannel={currentChannel}
                        onChannelSelect={handleChannelSelect}
                    />
                </>
            )}

            {/* Main Content (Full Screen) */}
            <main className="h-full w-full">
                <Routes>
                    <Route path="/debug" element={<StreamDebugger />} />
                    <Route path="/analytics" element={<ErrorAnalytics />} />
                    <Route path="/" element={
                        <div className="h-full w-full overflow-y-auto bg-background">
                            {currentChannel ? (
                                <div className="h-full flex items-center justify-center">
                                    <Player
                                        channel={currentChannel}
                                        isPlaying={isPlaying}
                                        onPlayingChange={setIsPlaying}
                                        volume={volume}
                                        isMuted={isMuted}
                                    />
                                </div>
                            ) : (
                                <div className="min-h-full pb-20">
                                    {/* Hero Section */}
                                    <div className="relative h-[50vh] flex items-center justify-center bg-gradient-to-b from-accent-900/20 to-background">
                                        <div className="text-center space-y-6 px-4 z-10">
                                            <div className="w-20 h-20 mx-auto bg-accent-500/10 rounded-full flex items-center justify-center mb-4">
                                                <Tv className="w-10 h-10 text-accent-500" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                                    Welcome to VectaStream V2.0
                                                </h2>
                                                <p className="text-white/60 max-w-md mx-auto">
                                                    Revolutionary IPTV with command palette, gestures, and voice control.
                                                    <br />
                                                    <span className="text-accent-400 text-sm mt-2 block">
                                                        Loaded: {channels.length} Channels (ID)
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-3 justify-center">
                                                <button
                                                    onClick={() => setCommandPaletteOpen(true)}
                                                    className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Search className="w-5 h-5" />
                                                    Search (⌘K)
                                                </button>
                                                <button
                                                    onClick={() => setDrawerOpen(true)}
                                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Grid3x3 className="w-5 h-5" />
                                                    Browse All
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Discovery Rows */}
                                    <div className="-mt-10 relative z-20 space-y-2">
                                        <ContentRow
                                            title="Continue Watching"
                                            channels={continueWatching}
                                            onChannelSelect={handleChannelSelect}
                                        />
                                        <ContentRow
                                            title="Trending Now"
                                            channels={trending}
                                            onChannelSelect={handleChannelSelect}
                                        />
                                        <ContentRow
                                            title="Recommended for You"
                                            channels={recommendations}
                                            onChannelSelect={handleChannelSelect}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    } />
                </Routes>
            </main>
        </div>
    );
}

// Main App wrapper with Router and ErrorBoundary
export default function App() {
    return (
        <ErrorBoundary>
            <Router>
                <AppContent />
            </Router>
        </ErrorBoundary>
    );
}
