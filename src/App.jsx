import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import Player from './components/Player';
import EPGOverlay from './components/EPGOverlay';
import StreamDebugger from './pages/StreamDebugger';
import ErrorAnalytics from './pages/ErrorAnalytics';

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

// Wrapper component to access useLocation
function AppContent() {
    const location = useLocation();
    const { isMobile, isTablet } = useDevice();
    const { checkStreamStatus, getStatus } = useStreamStatus();

    // Channel & Playlist State
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [playlistUrl, setPlaylistUrl] = useState('');
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
                        <div className="h-full w-full flex items-center justify-center">
                            {currentChannel ? (
                                <Player
                                    channel={currentChannel}
                                    isPlaying={isPlaying}
                                    onPlayingChange={setIsPlaying}
                                    volume={volume}
                                    isMuted={isMuted}
                                />
                            ) : (
                                <div className="text-center space-y-6 px-4">
                                    <div className="w-24 h-24 mx-auto bg-accent-500/10 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-text-primary mb-2">
                                            Welcome to VectaStream V2.0
                                        </h2>
                                        <p className="text-text-secondary mb-6">
                                            Revolutionary IPTV with command palette, gestures, and voice control
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button
                                                onClick={() => setCommandPaletteOpen(true)}
                                                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Search Channels (⌘K)
                                            </button>
                                            <button
                                                onClick={() => setDrawerOpen(true)}
                                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                                            >
                                                Browse All Channels
                                            </button>
                                        </div>
                                    </div>
                                    {channels.length === 0 && (
                                        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10 max-w-md mx-auto text-left">
                                            <p className="text-sm text-text-tertiary mb-2">
                                                💡 <span className="font-semibold">Quick Tip:</span>
                                            </p>
                                            <p className="text-sm text-text-secondary">
                                                Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">⌘K</kbd> or <kbd className="px-2 py-1 bg-white/10 rounded text-xs">/</kbd> anywhere to open command palette
                                            </p>
                                        </div>
                                    )}
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
