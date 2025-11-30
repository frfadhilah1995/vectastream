import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import EPGOverlay from './components/EPGOverlay';
import StreamDebugger from './pages/StreamDebugger';
import ErrorAnalytics from './pages/ErrorAnalytics';
import useStreamStatus from './hooks/useStreamStatus';
import useDevice from './hooks/useDevice';
import { statusRefreshService } from './utils/statusRefresh';
import { fetchWithCorsProxy } from './utils/corsProxy';
import { parseM3U } from './utils/m3u';
import { getCachedPlaylist, cachePlaylist } from './utils/playlistCache';
import { addToHistory } from './utils/history';

// Wrapper component to access useLocation
function AppContent() {
    const location = useLocation();
    const { isMobile, isTablet } = useDevice();
    const { checkStreamStatus, getStatus } = useStreamStatus();
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Player-First Layout: Auto-hide sidebar state
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // EPG Overlay state
    const [epgVisible, setEpgVisible] = useState(false);

    // Player-First Layout: Auto-hide sidebar on inactivity (Desktop only)
    useEffect(() => {
        if (isMobile || isTablet) return; // Skip auto-hide on mobile/tablet

        let inactivityTimer;

        const resetIdleTimer = () => {
            if (!sidebarVisible) {
                setSidebarVisible(true); // Show on activity
                setSidebarCollapsed(false);
            }

            clearTimeout(inactivityTimer);

            inactivityTimer = setTimeout(() => {
                setSidebarCollapsed(true); // Collapse to icon-only after 5s inactivity
            }, 5000); // 5 seconds
        };

        // Trigger on user activity
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);
        window.addEventListener('touchstart', resetIdleTimer);
        window.addEventListener('click', resetIdleTimer);

        resetIdleTimer(); // Initial call

        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('keydown', resetIdleTimer);
            window.removeEventListener('touchstart', resetIdleTimer);
            window.removeEventListener('click', resetIdleTimer);
        };
    }, [isMobile, isTablet, sidebarVisible]);

    // Keyboard Shortcuts for Player-First UX
    useEffect(() => {
        const handleKeyboardShortcuts = (e) => {
            // Ignore if user is typing in input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 's':
                    // Toggle sidebar visibility
                    e.preventDefault();
                    setSidebarCollapsed(prev => !prev);
                    setSidebarVisible(true);
                    break;
                case 'f':
                    // Fullscreen toggle
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        if (document.fullscreenElement) {
                            document.exitFullscreen();
                        } else {
                            document.documentElement.requestFullscreen();
                        }
                    }
                    break;
                case 'escape':
                    // Show sidebar / exit fullscreen / close EPG
                    if (epgVisible) {
                        setEpgVisible(false);
                    } else if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else if (sidebarCollapsed) {
                        setSidebarCollapsed(false);
                    }
                    break;
                case 'e':
                    // Toggle EPG overlay
                    e.preventDefault();
                    setEpgVisible(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyboardShortcuts);
        return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
    }, [sidebarCollapsed]);

    // Load last URL and Channel from localStorage
    useEffect(() => {
        const lastUrl = localStorage.getItem('vectastream_last_url');
        if (lastUrl) {
            setPlaylistUrl(lastUrl);
        }
    }, []);

    // Save current channel to localStorage
    useEffect(() => {
        if (currentChannel) {
            localStorage.setItem('vectastream_last_channel', JSON.stringify(currentChannel));
        }
    }, [currentChannel]);

    const handleLoadPlaylist = useCallback(async (urlToLoad = playlistUrl) => {
        if (!urlToLoad) {
            console.warn('[App] No URL provided to handleLoadPlaylist');
            return;
        }

        console.log(`[App] 🔄 Loading playlist from: ${urlToLoad}`);
        setIsLoading(true);
        setChannels([]); // Clear existing channels immediately to avoid confusion
        // setCurrentChannel(null); // REMOVED: Keep playing current channel while loading new playlist

        try {
            let loadedChannels = [];
            // Check cache first for instant load
            const cached = await getCachedPlaylist(urlToLoad);

            if (cached && cached.channels) {
                // Cache hit - instant load!
                console.log(`[App] ⚡ Using cached playlist (${cached.channels.length} channels)`);
                loadedChannels = cached.channels;
            } else {
                // Cache miss - fetch fresh data
                console.log('[App] 🌐 Fetching fresh playlist...');
                const text = await fetchWithCorsProxy(urlToLoad);
                console.log(`[App] ✅ Fetched playlist, size: ${text.length} characters`);

                const parsedChannels = parseM3U(text, urlToLoad);
                console.log(`[App] 📺 Parsed ${parsedChannels.length} channels`);


                if (parsedChannels.length === 0) {
                    toast.warning('No channels found', {
                        description: 'The playlist appears to be empty or invalid.',
                    });
                    setIsLoading(false);
                    return;
                }

                // Save to cache for next time (1-hour TTL)
                await cachePlaylist(urlToLoad, parsedChannels);
                loadedChannels = parsedChannels;
            }

            setChannels(loadedChannels);
            localStorage.setItem('vectastream_last_url', urlToLoad);
            console.log(`[App] ✅ Successfully loaded ${loadedChannels.length} channels!`);
            toast.success('Playlist loaded successfully!', {
                description: `${loadedChannels.length} channels available`,
                duration: 3000,
            });

            // Auto-resume last played channel if it exists in the new list
            const lastChannelJson = localStorage.getItem('vectastream_last_channel');
            if (lastChannelJson) {
                try {
                    const lastChannel = JSON.parse(lastChannelJson);
                    // Find matching channel in new list (by URL or Name)
                    const foundChannel = loadedChannels.find(c => c.url === lastChannel.url || c.name === lastChannel.name);
                    if (foundChannel) {
                        console.log(`[App] ▶️ Auto-resuming channel: ${foundChannel.name}`);
                        setCurrentChannel(foundChannel);
                    }
                } catch (e) {
                    console.error("[App] Failed to parse last channel", e);
                }
            }

        } catch (error) {
            console.error("[App] ❌ Error loading playlist:", error);
            toast.error('Failed to load playlist', {
                description: error.message,
                action: {
                    label: 'Retry',
                    onClick: () => handleLoadPlaylist(urlToLoad),
                },
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    }, [playlistUrl]);

    const handleRefreshChannel = useCallback(async (channel) => {
        const channelId = `${channel.url}-${channels.indexOf(channel)}`;

        // 1. Perform actual network check (updates localStorage)
        await statusRefreshService.refreshChannel(channel);

        // 2. Update UI state from the newly updated cache
        checkStreamStatus(channel.url, channelId);
    }, [channels, checkStreamStatus]);

    // NOTE: Removed global status check loop to prevent lag on large playlists (9000+ items)
    // Status checking is now handled in Sidebar.jsx for visible items only (Pagination Scoped)

    // Detect if we're on a tool page (Analytics or Debugger) - hide sidebar
    const isToolPage = location.pathname === '/analytics' || location.pathname === '/debug';

    return (
        <div className="flex flex-col h-full bg-background text-white font-sans overflow-hidden">
            {/* Toast Notifications */}
            <Toaster position="top-right" theme="dark" richColors closeButton />
            {/* Mobile/Tablet Header Overlay for Menu Toggle - Only show on main player page */}
            {(isMobile || isTablet) && !isToolPage && (
                <div className="fixed top-4 left-4 z-50">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 bg-black/50 backdrop-blur-md border border-glass-border rounded-lg text-white shadow-lg active:scale-95 transition-transform"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Logic - Player-First Layout with Auto-hide */}
                {!isToolPage && (
                    <aside
                        className={`
                            h-full flex-shrink-0 sidebar-transition
                            ${(isMobile || isTablet) ? 'absolute inset-y-0 left-0 z-50' : 'relative z-40'}
                            ${(isMobile || isTablet) && !isMobileMenuOpen ? '-translate-x-full' : ''}
                            ${!(isMobile || isTablet) && sidebarCollapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width-full)]'}
                        `}
                        style={{
                            width: (isMobile || isTablet) ? '320px' : undefined,
                        }}
                    >
                        <div className="h-full flex flex-col bg-background border-r border-glass-border shadow-2xl md:shadow-none">
                            <Header />
                            <Sidebar
                                collapsed={!(isMobile || isTablet) && sidebarCollapsed}
                                onToggleCollapsed={(expand) => {
                                    if (expand === false) {
                                        setSidebarCollapsed(false); // Expand sidebar
                                        setSidebarVisible(true);
                                    } else if (expand === true) {
                                        setSidebarCollapsed(true); // Collapse sidebar
                                    }
                                }}
                                channels={channels}
                                currentChannel={currentChannel}
                                onChannelSelect={(channel) => {
                                    setCurrentChannel(channel);
                                    addToHistory(channel);
                                    if (isMobile || isTablet) setIsMobileMenuOpen(false);
                                }}
                                onLoadPlaylist={handleLoadPlaylist}
                                isLoading={isLoading}
                                playlistUrl={playlistUrl}
                                setPlaylistUrl={setPlaylistUrl}
                                getChannelStatus={getStatus}
                                checkStreamStatus={checkStreamStatus} // Pass this for scoped checking
                                onRefreshChannel={handleRefreshChannel}
                                onClearChannels={() => {
                                    setChannels([]);
                                    setCurrentChannel(null);
                                }}
                            />
                        </div>
                    </aside>
                )}

                {/* Main Content (Player / Analytics / Debugger) - Player-First Layout */}
                <main
                    className={`
                        flex-1 relative bg-black h-full
                        player-area-transition
                    `}
                    style={{
                        marginLeft: (isMobile || isTablet)
                            ? 0
                            : sidebarCollapsed
                                ? 'var(--sidebar-width-collapsed)'
                                : 'var(--sidebar-width-full)'
                    }}
                >
                    <Routes>
                        <Route path="/debug" element={<StreamDebugger />} />
                        <Route path="/analytics" element={<ErrorAnalytics />} />
                        <Route path="/" element={
                            <Player channel={currentChannel} />
                        } />
                    </Routes>
                </main>
            </div>

            {/* EPG Overlay (Full Screen) */}
            <EPGOverlay
                visible={epgVisible}
                onClose={() => setEpgVisible(false)}
                channels={channels}
                currentChannel={currentChannel}
                onChannelSelect={(channel) => {
                    setCurrentChannel(channel);
                    addToHistory(channel);
                }}
            />
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
